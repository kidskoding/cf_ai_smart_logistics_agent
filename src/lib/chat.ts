import type { Message, ChatState, ToolCall, WeatherResult, MCPResult, ErrorResult, SessionInfo } from '../../worker/types';
import { toast } from 'sonner';
export interface ChatResponse {
  success: boolean;
  data?: ChatState;
  error?: string;
}
export const MODELS = [
  { id: 'google-ai-studio/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'google-ai-studio/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'google-ai-studio/gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
];
class ChatService {
  private sessionId: string;
  private baseUrl: string;
  constructor() {
    this.sessionId = localStorage.getItem('source_ai_last_session') || crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
    localStorage.setItem('source_ai_last_session', this.sessionId);
  }
  async sendMessage(
    message: string,
    model?: string,
    onChunk?: (chunk: string) => void
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, model, stream: !!onChunk }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorMessage;
        } catch (e) { /* ignore */ }
        if (response.status === 503) {
          toast.error("Deployment issue: Durable Object bindings missing.");
        }
        throw new Error(errorMessage);
      }
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
      console.error('ChatService.sendMessage failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }
  async getMessages(): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  getSessionId(): string {
    return this.sessionId;
  }
  newSession(): void {
    this.sessionId = crypto.randomUUID();
    this.baseUrl = `/api/chat/${this.sessionId}`;
    localStorage.setItem('source_ai_last_session', this.sessionId);
  }
  switchSession(sessionId: string): void {
    if (!sessionId) return;
    this.sessionId = sessionId;
    this.baseUrl = `/api/chat/${sessionId}`;
    localStorage.setItem('source_ai_last_session', sessionId);
  }
  async listSessions(): Promise<{ success: boolean; data?: SessionInfo[]; error?: string }> {
    try {
      const response = await fetch('/api/sessions');
      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
  async deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, { method: 'DELETE' });
      if (sessionId === this.sessionId) {
        this.newSession();
      }
      return await response.json();
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
}
export const chatService = new ChatService();