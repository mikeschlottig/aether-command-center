import OpenAI from 'openai';
import type { Message, ToolCall } from './types';
import { getToolDefinitions, executeTool } from './tools';
import { ChatCompletionMessageFunctionToolCall, ChatCompletionMessageParam, ChatCompletionMessageToolCall } from 'openai/resources/index.mjs';
export class ChatHandler {
  private client: OpenAI;
  private model: string;
  private systemPrompt: string;
  private agentName: string;
  private agentAvatar: string;
  constructor(
    aiGatewayUrl: string,
    apiKey: string,
    model: string,
    systemPrompt?: string,
    agentName?: string,
    agentAvatar?: string
  ) {
    this.client = new OpenAI({
      baseURL: aiGatewayUrl,
      apiKey: apiKey
    });
    this.model = model;
    this.systemPrompt = systemPrompt || 'You are a helpful AI assistant.';
    this.agentName = agentName || 'Assistant';
    this.agentAvatar = agentAvatar || '🤖';
  }
  async processMessage(
    message: string,
    conversationHistory: Message[],
    onChunk?: (chunk: string) => void
  ): Promise<{
    content: string;
    toolCalls?: ToolCall[];
  }> {
    const messages = this.buildConversationMessages(message, conversationHistory);
    const toolDefinitions = await getToolDefinitions();
    if (onChunk) {
      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        tools: toolDefinitions,
        tool_choice: 'auto',
        max_completion_tokens: 16000,
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
  private async handleStreamResponse(
    stream: AsyncIterable<OpenAI.Chat.Completions.ChatCompletionChunk>,
    message: string,
    conversationHistory: Message[],
    onChunk: (chunk: string) => void
  ) {
    let fullContent = '';
    const accumulatedToolCalls: ChatCompletionMessageFunctionToolCall[] = [];
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        if (delta?.content) {
          fullContent += delta.content;
          onChunk(delta.content);
        }
        if (delta?.tool_calls) {
          for (const dtc of delta.tool_calls) {
            const i = dtc.index;
            if (!accumulatedToolCalls[i]) {
              accumulatedToolCalls[i] = {
                id: dtc.id || `tool_${Date.now()}_${i}`,
                type: 'function',
                function: {
                  name: dtc.function?.name || '',
                  arguments: dtc.function?.arguments || ''
                }
              };
            } else {
              if (dtc.function?.name) accumulatedToolCalls[i].function.name += dtc.function.name;
              if (dtc.function?.arguments) accumulatedToolCalls[i].function.arguments += dtc.function.arguments;
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream processing error:', error);
      throw new Error('Stream processing failed');
    }
    if (accumulatedToolCalls.length > 0) {
      const executedTools = await this.executeToolCalls(accumulatedToolCalls);
      const finalResponse = await this.generateToolResponse(message, conversationHistory, accumulatedToolCalls as unknown as ChatCompletionMessageToolCall[], executedTools);
      return { content: finalResponse, toolCalls: executedTools };
    }
    return { content: fullContent };
  }
  private async handleNonStreamResponse(
    completion: OpenAI.Chat.Completions.ChatCompletion,
    message: string,
    conversationHistory: Message[]
  ) {
    const responseMessage = completion.choices[0]?.message;
    if (!responseMessage) {
      return { content: 'I apologize, but I encountered an issue.' };
    }
    if (!responseMessage.tool_calls) {
      return { content: responseMessage.content || 'I apologize, but I encountered an issue.' };
    }
    const toolCalls = await this.executeToolCalls(responseMessage.tool_calls as ChatCompletionMessageFunctionToolCall[]);
    const finalResponse = await this.generateToolResponse(
      message,
      conversationHistory,
      responseMessage.tool_calls,
      toolCalls
    );
    return { content: finalResponse, toolCalls };
  }
  private async executeToolCalls(openAiToolCalls: ChatCompletionMessageFunctionToolCall[]): Promise<ToolCall[]> {
    return Promise.all(
      openAiToolCalls.map(async (tc) => {
        try {
          const args = tc.function.arguments ? JSON.parse(tc.function.arguments) : {};
          const result = await executeTool(tc.function.name, args);
          return { id: tc.id, name: tc.function.name, arguments: args, result };
        } catch (error) {
          console.error(`Tool execution failed for ${tc.function.name}:`, error);
          return {
            id: tc.id,
            name: tc.function.name,
            arguments: {},
            result: { error: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}` }
          };
        }
      })
    );
  }
  private async generateToolResponse(
    userMessage: string,
    history: Message[],
    openAiToolCalls: ChatCompletionMessageToolCall[],
    toolResults: ToolCall[]
  ): Promise<string> {
    const messages: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'Respond naturally to the tool results.' },
      ...history.slice(-3).map(m => this.mapMessageToOpenAI(m)),
      { role: 'user', content: userMessage },
      { role: 'assistant', content: null, tool_calls: openAiToolCalls },
      ...toolResults.map(tr => ({
        role: 'tool' as const,
        content: JSON.stringify(tr.result),
        tool_call_id: tr.id
      }))
    ];
    const followUp = await this.client.chat.completions.create({
      model: this.model,
      messages,
      max_tokens: 16000
    });
    return followUp.choices[0]?.message?.content || 'Tool results processed.';
  }
  private buildConversationMessages(userMessage: string, history: Message[]): ChatCompletionMessageParam[] {
    const fullPrompt = `${this.systemPrompt}\n\nIdentity: ${this.agentName} ${this.agentAvatar}\nHANDOFF PROTOCOL: Use [HANDOFF: Agent Name] for specialized tasks.`;
    return [
      { role: 'system', content: fullPrompt },
      ...history.slice(-5).map(m => this.mapMessageToOpenAI(m)),
      { role: 'user', content: userMessage }
    ];
  }
  private mapMessageToOpenAI(m: Message): ChatCompletionMessageParam {
    if (m.role === 'tool') {
      return { role: 'tool', content: m.content, tool_call_id: m.id } as ChatCompletionMessageParam;
    }
    const base: any = { role: m.role, content: m.content };
    if (m.toolCalls) {
      base.tool_calls = m.toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: JSON.stringify(tc.arguments) }
      }));
    }
    return base as ChatCompletionMessageParam;
  }
  updateModel(newModel: string): void { this.model = newModel; }
  updatePersona(systemPrompt: string, name: string, avatar: string): void {
    this.systemPrompt = systemPrompt; this.agentName = name; this.agentAvatar = avatar;
  }
}