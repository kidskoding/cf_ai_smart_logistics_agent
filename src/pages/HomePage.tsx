import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Loader2, PackageSearch, AlertCircle, Sparkles } from 'lucide-react';
import { chatService } from '@/lib/chat';
import type { Message } from '../../worker/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { ChatMessage } from '@/components/ChatMessage';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
export function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    loadMessages();
  }, []);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isLoading]);
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
        toast.error(response.error || "Procurement inquiry failed");
        setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      }
    } catch (err) {
      toast.error("Network communication error");
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
    } finally {
      setIsLoading(false);
    }
  };
  const startNewSession = () => {
    chatService.newSession();
    setMessages([]);
    setInput('');
    toast.info("Started new procurement inquiry");
  };
  const handlePartSelect = (description: string) => {
    const query = `Find suppliers for ${description}`;
    setInput(query);
    inputRef.current?.focus();
    toast.success("Query updated from catalog");
  };
  return (
    <AppLayout className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="border-b bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl px-6 py-4 flex items-center justify-between z-10 shrink-0 transition-colors">
        <div className="flex items-center gap-3">
          <div className="bg-sky-600 p-2.5 rounded-xl text-white shadow-lg shadow-sky-600/20">
            <PackageSearch size={22} />
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 dark:text-white leading-none mb-1 tracking-tight">SourceAI</h1>
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Enterprise Network</p>
            </div>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={startNewSession} 
          className="gap-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 shadow-sm"
        >
          <Plus size={16} /> <span className="hidden sm:inline font-semibold">New Search</span>
        </Button>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden px-4 md:px-8">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto py-8 md:py-12 space-y-8 no-scrollbar"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-700">
                <div className="relative">
                  <div className="absolute inset-0 bg-sky-500/20 blur-[80px] rounded-full" />
                  <div className="relative w-24 h-24 bg-white dark:bg-slate-900 shadow-2xl rounded-[2rem] flex items-center justify-center text-sky-600 border border-slate-100 dark:border-slate-800 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                    <Sparkles size={48} className="text-sky-500 animate-pulse" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Procurement Intelligence</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed text-lg">
                    Instantly retrieve supplier history, reliability scores, and contact details for industrial components.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                  {["High-speed ball bearings", "12V DC stepper motor", "5mm aluminum sheets", "Stainless steel fasteners"].map((text) => (
                    <button
                      key={text}
                      onClick={() => setInput(text)}
                      className="text-left px-5 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-sky-500 dark:hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 hover:shadow-lg transition-all text-sm font-semibold group"
                    >
                      <span className="text-sky-600 opacity-0 group-hover:opacity-100 transition-opacity mr-1">→</span>
                      "{text}"
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-10 max-w-4xl mx-auto w-full pb-10">
                <AnimatePresence initial={false}>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChatMessage role={msg.role} content={msg.content} />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {isLoading && (
                  <div className="flex items-center gap-4 text-sky-600 pl-14 animate-in fade-in slide-in-from-left-2 duration-300">
                    <div className="relative">
                      <div className="absolute inset-0 bg-sky-500/20 blur-md rounded-full" />
                      <Loader2 size={20} className="animate-spin relative z-10" />
                    </div>
                    <span className="text-sm font-bold tracking-tight animate-pulse uppercase">Searching Procurement database...</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="shrink-0 pb-8 pt-4">
            <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSend} className="relative group">
                <div className="absolute -inset-1.5 bg-gradient-to-r from-sky-500 via-indigo-500 to-sky-500 rounded-[1.4rem] blur opacity-15 group-focus-within:opacity-30 transition duration-1000 animate-gradient-x" />
                <div className="relative">
                  <Input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Describe the component or material to source..."
                    className="pr-16 py-8 bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/60 rounded-2xl shadow-xl focus:ring-sky-500/50 transition-all text-base font-medium placeholder:text-slate-400"
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 h-12 w-12 rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xl transition-all active:scale-90 disabled:bg-slate-200 dark:disabled:bg-slate-800"
                  >
                    <Send size={22} />
                  </Button>
                </div>
              </form>
              <div className="mt-5 flex items-center justify-center gap-3 text-[11px] font-bold text-muted-foreground bg-white/50 dark:bg-slate-900/50 py-2.5 px-6 rounded-full w-fit mx-auto border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm shadow-sm">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="uppercase tracking-widest">Enterprise results verified by procurement node</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}