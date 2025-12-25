import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Loader2, PackageSearch } from 'lucide-react';
import { chatService } from '@/lib/chat';
import type { Message } from '../../worker/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatMessage } from '@/components/ChatMessage';
import { toast } from 'sonner';
export function HomePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    loadMessages();
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const loadMessages = async () => {
    const res = await chatService.getMessages();
    if (res.success && res.data) {
      setMessages(res.data.messages);
    }
  };
  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);
    // Optimistic update
    const tempUserMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, tempUserMsg]);
    try {
      const response = await chatService.sendMessage(userMessage);
      if (response.success) {
        await loadMessages();
      } else {
        toast.error("Failed to fetch procurement data");
      }
    } catch (err) {
      toast.error("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  const startNewSession = () => {
    chatService.newSession();
    setMessages([]);
    setInput('');
    toast.info("Started new procurement search");
  };
  return (
    <AppLayout className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b bg-white dark:bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-sky-500 p-2 rounded-lg text-white">
            <PackageSearch size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white">SourceAI</h1>
            <p className="text-xs text-muted-foreground">Intelligent Procurement Agent</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startNewSession} className="gap-2">
          <Plus size={16} /> New Search
        </Button>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400">
                <PackageSearch size={32} />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Ready to Source?</h2>
                <p className="text-sm text-muted-foreground">
                  Ask me to find suppliers for any part, material, or industrial component. 
                  Try: "Find suppliers for high-speed ball bearings"
                </p>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
            ))
          )}
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground animate-pulse ml-2">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Consulting supplier database...</span>
            </div>
          )}
        </div>
        <div className="p-4 md:p-8 bg-gradient-to-t from-slate-50 dark:from-slate-950 via-slate-50 dark:via-slate-950 to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-4xl mx-auto relative group"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter part description or material requirements..."
              className="pr-12 py-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-sky-500"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-sky-600 hover:bg-sky-700 text-white"
            >
              <Send size={18} />
            </Button>
          </form>
          <p className="text-[10px] text-center text-muted-foreground mt-4">
            Note: Requests are subject to AI rate limits. Verified procurement data only.
          </p>
        </div>
      </main>
    </AppLayout>
  );
}