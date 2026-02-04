import { Agent } from 'agents';
import type { Env } from './core-utils';
import type { ChatState, Message } from './types';
import { ChatHandler } from './chat';
import { API_RESPONSES } from './config';
import { createMessage, createStreamResponse, createEncoder } from './utils';
type MCPServerConfig = { name: string; sseUrl: string };
export class ChatAgent extends Agent<Env, ChatState> {
  private chatHandler?: ChatHandler;
  initialState: ChatState = {
    messages: [],
    sessionId: crypto.randomUUID(),
    isProcessing: false,
    model: 'google-ai-studio/gemini-2.0-flash',
    systemPrompt: 'You are a helpful assistant.',
    agentName: 'Assistant',
    agentAvatar: '🤖',
  };
  async onStart(): Promise<void> {
    this.chatHandler = new ChatHandler(
      this.env.CF_AI_BASE_URL,
      this.env.CF_AI_API_KEY,
      this.state.model,
      this.state.systemPrompt,
      this.state.agentName,
      this.state.agentAvatar
    );
  }
  async onRequest(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const method = request.method;
      if (method === 'GET' && url.pathname === '/messages') return this.handleGetMessages();
      if (method === 'POST' && url.pathname === '/chat') return this.handleChatMessage(await request.json());
      if (method === 'DELETE' && url.pathname === '/clear') return this.handleClearMessages();
      if (method === 'POST' && url.pathname === '/model') return this.handleModelUpdate(await request.json());
      if (method === 'POST' && url.pathname === '/persona') return this.handlePersonaUpdate(await request.json());
      return Response.json({ success: false, error: API_RESPONSES.NOT_FOUND }, { status: 404 });
    } catch (error) {
      console.error('Request handling error:', error);
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
  }
  private handleGetMessages(): Response {
    return Response.json({ success: true, data: this.state });
  }
  private normalizeMcpServers(raw: unknown): MCPServerConfig[] {
    const MAX_SERVERS = 6;
    const MAX_NAME = 80;
    const MAX_URL = 2048;
    if (!Array.isArray(raw)) return [];
    const out: MCPServerConfig[] = [];
    const seen = new Set<string>();
    for (const entry of raw.slice(0, MAX_SERVERS)) {
      const name = typeof entry?.name === 'string' ? entry.name.trim() : '';
      const sseUrl = typeof entry?.sseUrl === 'string' ? entry.sseUrl.trim() : '';
      if (!name || !sseUrl) continue;
      if (name.length > MAX_NAME || sseUrl.length > MAX_URL) continue;
      let normalizedUrl = '';
      try {
        const url = new URL(sseUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') continue;
        normalizedUrl = url.toString();
      } catch {
        continue;
      }
      const key = `${name}|${normalizedUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ name, sseUrl: normalizedUrl });
    }
    return out;
  }
  private async handleChatMessage(body: {
    message: string;
    model?: string;
    stream?: boolean;
    crewNames?: string[];
    mcpServers?: MCPServerConfig[];
  }): Promise<Response> {
    const { message, model, stream, crewNames, mcpServers } = body;
    if (!message?.trim()) {
      return Response.json({ success: false, error: API_RESPONSES.MISSING_MESSAGE }, { status: 400 });
    }
    if (!this.chatHandler) {
      console.error('[ChatAgent] Chat handler not initialized');
      return Response.json({ success: false, error: API_RESPONSES.INTERNAL_ERROR }, { status: 500 });
    }
    if (model && model !== this.state.model) {
      this.setState({ ...this.state, model });
      this.chatHandler.updateModel(model);
    }
    if (crewNames) this.chatHandler.updateCrew(crewNames);
    const normalizedMcp = this.normalizeMcpServers(mcpServers);
    if (normalizedMcp.length > 0) {
      try {
        this.chatHandler.updateMcpServers(normalizedMcp);
      } catch (e) {
        console.warn('[ChatAgent] Failed to update MCP servers (non-fatal):', e);
      }
    } else {
      // Allow clearing MCP servers by explicitly sending empty array
      if (Array.isArray(mcpServers)) {
        try {
          this.chatHandler.updateMcpServers([]);
        } catch (e) {
          console.warn('[ChatAgent] Failed to clear MCP servers (non-fatal):', e);
        }
      }
    }
    const userMessage = createMessage('user', message.trim());
    const updatedMessages = [...this.state.messages, userMessage];
    // Persist immediately before starting processing
    this.setState({ ...this.state, messages: updatedMessages, isProcessing: true });
    try {
      if (stream) {
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = createEncoder();
        (async () => {
          try {
            const response = await this.chatHandler!.processMessage(message, updatedMessages, (chunk: string) => {
              writer.write(encoder.encode(chunk));
            });
            const finalMessages = [...updatedMessages, ...response.messages];
            this.setState({
              ...this.state,
              messages: finalMessages,
              isProcessing: false,
              streamingMessage: '',
            });
          } catch (error) {
            console.error('Stream processing error:', error);
            const err = 'An error occurred during transmission.';
            writer.write(encoder.encode(err));
            this.setState({
              ...this.state,
              messages: [...updatedMessages, createMessage('assistant', err)],
              isProcessing: false,
            });
          } finally {
            writer.close();
          }
        })();
        return createStreamResponse(readable);
      }
      const response = await this.chatHandler.processMessage(message, updatedMessages);
      this.setState({ ...this.state, messages: [...updatedMessages, ...response.messages], isProcessing: false });
      return Response.json({ success: true, data: this.state });
    } catch (error) {
      console.error('Chat message handling error:', error);
      this.setState({ ...this.state, isProcessing: false });
      return Response.json({ success: false, error: API_RESPONSES.PROCESSING_ERROR }, { status: 500 });
    }
  }
  private handleClearMessages(): Response {
    this.setState({ ...this.state, messages: [] });
    return Response.json({ success: true, data: this.state });
  }
  private handleModelUpdate(body: { model: string }): Response {
    this.setState({ ...this.state, model: body.model });
    this.chatHandler?.updateModel(body.model);
    return Response.json({ success: true, data: this.state });
  }
  private handlePersonaUpdate(body: { name: string; avatar: string; systemPrompt: string }): Response {
    const { name, avatar, systemPrompt } = body;
    this.setState({ ...this.state, agentName: name, agentAvatar: avatar, systemPrompt });
    this.chatHandler?.updatePersona(systemPrompt, name, avatar);
    return Response.json({ success: true, data: this.state });
  }
}