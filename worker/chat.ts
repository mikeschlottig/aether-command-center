import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private agentName: string;
  private agentAvatar: string;
  private activeCrew: string[];
  constructor(aiGatewayUrl: string, apiKey: string, model: string, systemPrompt?: string, agentName?: string, agentAvatar?: string) {
    this.client = new OpenAI({ baseURL: aiGatewayUrl, apiKey: apiKey });
    this.model = model;
    this.systemPrompt = systemPrompt || 'You are a helpful AI assistant.';
    this.agentName = agentName || 'Assistant';
    this.agentAvatar = agentAvatar || '🤖';
    this.activeCrew = [];
  }
  async processMessage(message: string, conversationHistory: Message[], onChunk?: (chunk: string) => void): Promise<{ content: string; messages: Message[]; toolCalls?: ToolCall[] }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_tokens: 16000,
        stream: true,
      });
      return this.handleStreamResponse(stream, message, conversationHistory, onChunk);
    }
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages,
      tools: toolDefinitions,
      tool_choice: 'auto',
      max_tokens: 16000,
      stream: false
    });
    return this.handleNonStreamResponse(completion, message, conversationHistory);
  }
  private async handleStreamResponse(stream: AsyncIterable<any>, message: string, history: Message[], onChunk: (chunk: string) => void) {
    let fullContent = '';
    const accToolCalls: any[] = [];
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk(delta.content);
      }
      if (delta?.tool_calls) {
        for (const dtc of delta.tool_calls) {
          const i = dtc.index;
          if (!accToolCalls[i]) {
            accToolCalls[i] = {
              id: dtc.id || `tool_${Date.now()}_${i}`,
              type: 'function',
              function: { name: dtc.function?.name || '', arguments: dtc.function?.arguments || '' }
            };
          } else {
            if (dtc.function?.name) accToolCalls[i].function.name += dtc.function.name;
            if (dtc.function?.arguments) accToolCalls[i].function.arguments += dtc.function.arguments;
          }
        }
      }
    }
    if (accToolCalls.length > 0) {
      const toolResults = await this.executeToolCalls(accToolCalls);
      const followUp = await this.generateToolResponse(message, history, accToolCalls, toolResults);
      const assistantToolMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now(), toolCalls: toolResults };
      const toolMsg: Message = { id: crypto.randomUUID(), role: 'tool', content: JSON.stringify(toolResults.map(tr => tr.result)), timestamp: Date.now() };
      const finalMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: followUp, timestamp: Date.now() };
      return { content: followUp, messages: [assistantToolMsg, toolMsg, finalMsg], toolCalls: toolResults };
    }
    const simpleMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: fullContent, timestamp: Date.now() };
    return { content: fullContent, messages: [simpleMsg] };
  }
  private async handleNonStreamResponse(completion: any, message: string, history: Message[]) {
    const resp = completion.choices[0]?.message;
    if (!resp) throw new Error('No response from AI');
    if (!resp.tool_calls) {
      const msg: Message = { id: crypto.randomUUID(), role: 'assistant', content: resp.content || '', timestamp: Date.now() };
      return { content: resp.content || '', messages: [msg] };
    }
    const toolResults = await this.executeToolCalls(resp.tool_calls);
    const followUp = await this.generateToolResponse(message, history, resp.tool_calls, toolResults);
    const assistantToolMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: '', timestamp: Date.now(), toolCalls: toolResults };
    const toolMsg: Message = { id: crypto.randomUUID(), role: 'tool', content: JSON.stringify(toolResults.map(tr => tr.result)), timestamp: Date.now() };
    const finalMsg: Message = { id: crypto.randomUUID(), role: 'assistant', content: followUp, timestamp: Date.now() };
    return { content: followUp, messages: [assistantToolMsg, toolMsg, finalMsg], toolCalls: toolResults };
  }
  private async executeToolCalls(openAiToolCalls: any[]): Promise<ToolCall[]> {
    return Promise.all(openAiToolCalls.map(async (tc) => {
      const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
      const result = await executeTool(tc.function.name, args);
      return { id: tc.id, name: tc.function.name, arguments: args, result };
    }));
  }
  private async generateToolResponse(userMsg: string, history: Message[], toolCalls: any[], results: ToolCall[]): Promise<string> {
    const messages: any[] = [
      { role: 'system', content: `Summarize the tool results efficiently. ${this.buildHandoffDirective()}` },
      ...history.slice(-5).map(m => this.mapMessageToOpenAI(m)),
      { role: 'assistant', content: null, tool_calls: toolCalls },
      ...results.map(tr => ({ role: 'tool', content: JSON.stringify(tr.result), tool_call_id: tr.id }))
    ];
    const followUp = await this.client.chat.completions.create({ model: this.model, messages, max_tokens: 4000 });
    return followUp.choices[0]?.message?.content || 'Task completed.';
  }
  private buildHandoffDirective(): string {
    const crew = this.activeCrew.length > 0 ? this.activeCrew.join(', ') : 'none';
    return `PROTOCOL DIRECTIVE: Monitor your confidence. If a task exceeds your persona "${this.agentName}" or tools fail repeatedly, suggest a handoff. SIGNAL: "[HANDOFF:AgentName]". Available crew: ${crew}. If crew list is empty, suggest that a specialized agent should be Manifested in the Atelier.`;
  }
  private buildConversationMessages(userMsg: string, history: Message[]): any[] {
    const identity = `${this.agentName} ${this.agentAvatar}\nSoul: ${this.systemPrompt}\n${this.buildHandoffDirective()}`;
    return [
      { role: 'system', content: identity },
      ...history.slice(-10).map(m => this.mapMessageToOpenAI(m)),
      { role: 'user', content: userMsg }
    ];
  }
  private mapMessageToOpenAI(m: Message): any {
    if (m.role === 'tool') return { role: 'tool', content: m.content || '{}', tool_call_id: m.id };
    const base: any = { role: m.role, content: m.content };
    if (m.toolCalls) {
      base.tool_calls = m.toolCalls.map(tc => ({ 
        id: tc.id, 
        type: 'function', 
        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) } 
      }));
    }
    return base;
  }
  updateModel(newModel: string): void { this.model = newModel; }
  updatePersona(soul: string, name: string, avatar: string): void { this.systemPrompt = soul; this.agentName = name; this.agentAvatar = avatar; }
  updateCrew(names: string[]): void { this.activeCrew = names; }
}