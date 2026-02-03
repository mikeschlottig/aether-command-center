import type { Message, ChatState, ToolCall, WeatherResult, MCPResult, ErrorResult, SessionInfo } from '../../worker/types';
export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
}
export const MODELS = [
  { id: 'google-ai-studio/gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fastest)' },
  { id: 'google-ai-studio/gemini-2.0-pro-exp-02-05', name: 'Gemini 2.0 Pro (Intelligence)' },
  { id: 'google-ai-studio/gemini-1.5-flash', name: 'Gemini 1.5 Flash (Legacy)' },
];
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  constructor() {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
  }
  async sendMessage(message: string, model?: string, onChunk?: (chunk: string) => void): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            if (chunk) onChunk(chunk);
          }
        } finally {
          reader.releaseLock();
        }
        return { success: true };
      }
      return await response.json();
    } catch (error) {
      console.error('Transmission error:', error);
      return { success: false, error: 'Failed to establish Aether Link' };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to synchronize chronicles' };
    }
  }
  async clearMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/clear`, { method: 'DELETE' });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to purge memory' };
    }
  }
  getSessionId(): string { return this.sessionId; }
  newSession(): void { this.sessionId = crypto.randomUUID(); this.baseUrl = `/api/chat/${this.sessionId}`; }
  switchSession(sessionId: string): void { this.sessionId = sessionId; this.baseUrl = `/api/chat/${sessionId}`; }
  async createSession(title?: string, sessionId?: string, firstMessage?: string): Promise<any> {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, sessionId, firstMessage })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to manifest session' };
    }
  }
  async listSessions(): Promise<any> {
    try {
      const response = await fetch('/api/sessions');
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to browse archives' };
    }
  }
  async updatePersona(name: string, avatar: string, systemPrompt: string): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/persona`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, avatar, systemPrompt })
      });
      return await response.json();
    } catch (error) {
      return { success: false, error: 'Failed to transfer persona' };
    }
  }
}
export const chatService = new ChatService();