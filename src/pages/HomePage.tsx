import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Loader2, PackageSearch, AlertCircle } from 'lucide-react';
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
        toast.error(response.error || "Failed to fetch procurement data");
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
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
    <AppLayout className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-6 py-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2 rounded-lg text-white shadow-sm">
            <PackageSearch size={20} />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white leading-none mb-1">SourceAI</h1>
            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Enterprise Procurement</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={startNewSession} className="gap-2 border-slate-200 dark:border-slate-800">
          <Plus size={16} /> <span className="hidden sm:inline">New Search</span>
        </Button>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-8 md:py-10 lg:py-12 space-y-8 scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-sky-500/20 blur-3xl rounded-full" />
                  <div className="relative w-20 h-20 bg-white dark:bg-slate-900 shadow-xl rounded-2xl flex items-center justify-center text-sky-600 border border-slate-100 dark:border-slate-800">
                    <PackageSearch size={40} />
                  </div>
                </div>
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Procurement Intelligence</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Search for specific parts or materials to instantly retrieve supplier history, reliability scores, and contact details.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {["High-speed ball bearings", "12V DC stepper motor", "5mm aluminum sheets", "Stainless steel fasteners"].map((text) => (
                    <button
                      key={text}
                      onClick={() => setInput(text)}
                      className="text-left px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 transition-all text-sm font-medium"
                    >
                      "{text}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto w-full">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
                ))}
              </div>
            )}
            {isLoading && (
              <div className="max-w-4xl mx-auto w-full px-12">
                <div className="flex items-center gap-3 text-sky-600 font-medium">
                  <Loader2 size={18} className="animate-spin" />
                  <span className="text-sm animate-pulse">Scanning global supplier database...</span>
                </div>
              </div>
            )}
          </div>
          <div className="shrink-0 pb-8 pt-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSend} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-500" />
                <div className="relative">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe the part or material you need to source..."
                    className="pr-14 py-7 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-lg focus:ring-sky-500 transition-all text-base"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-11 w-11 rounded-lg bg-sky-600 hover:bg-sky-700 text-white shadow-md transition-transform active:scale-95"
                  >
                    <Send size={20} />
                  </Button>
                </div>
              </form>
              <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-900/50 py-2 px-4 rounded-full w-fit mx-auto border border-slate-200/50 dark:border-slate-800/50">
                <AlertCircle size={12} className="text-amber-500" />
                <span>AI results are based on historical records. Requests subject to rate limits.</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}