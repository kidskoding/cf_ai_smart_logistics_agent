import { create } from 'zustand';
import { chatService } from './chat';
interface ChatState {
  sessionId: string;
  inputValue: string;
  setSessionId: (id: string) => void;
  setInputValue: (value: string) => void;
}
export const useChatStore = create<ChatState>((set) => ({
  sessionId: chatService.getSessionId(),
  inputValue: '',
  setSessionId: (id: string) => {
    chatService.switchSession(id);
    set({ sessionId: id });
  },
  setInputValue: (value: string) => set({ inputValue: value }),
}));