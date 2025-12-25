import React from 'react';
import { cn } from '@/lib/utils';
import { User, ShieldCheck, Mail, Calendar, Star } from 'lucide-react';
interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  const renderContent = (text: string) => {
    if (!text) return null;
    if (text.includes('|') && text.includes('--')) {
      const parts = text.split('\n\n');
      return (
        <div className="space-y-6">
          {parts.map((part, idx) => {
            if (part.includes('|') && part.includes('--')) {
              const lines = part.split('\n').filter(l => l.trim().startsWith('|'));
              if (lines.length > 2) {
                const headers = lines[0].split('|').filter(Boolean).map(s => s.trim());
                const rows = lines.slice(2).map(line =>
                  line.split('|').filter(Boolean).map(s => s.trim())
                );
                return (
                  <div key={idx} className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                        <thead className="bg-slate-50 dark:bg-slate-900/50">
                          <tr>
                            {headers.map((h, i) => (
                              <th key={i} className="px-5 py-4 text-left text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-950">
                          {rows.map((row, i) => (
                            <tr key={i} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors group">
                              {row.map((cell, j) => (
                                <td key={j} className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                  {headers[j].toLowerCase().includes('contact') ? (
                                    <div className="flex items-center gap-2">
                                      <Mail size={14} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                                      <span className="text-sky-600 dark:text-sky-400 underline decoration-sky-600/30 underline-offset-4 cursor-pointer">{cell}</span>
                                    </div>
                                  ) : headers[j].toLowerCase().includes('order') ? (
                                    <div className="flex items-center gap-2">
                                      <Calendar size={14} className="text-slate-400" />
                                      {cell}
                                    </div>
                                  ) : headers[j].toLowerCase().includes('reliability') ? (
                                    <div className="flex items-center gap-2">
                                      <Star size={14} className="text-amber-500 fill-amber-500" />
                                      <span className="text-emerald-600 dark:text-emerald-400">{cell}</span>
                                    </div>
                                  ) : cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
            }
            return <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap">{part.trim()}</p>;
          })}
        </div>
      );
    }
    return <div className="text-sm leading-relaxed whitespace-pre-wrap">{text}</div>;
  };
  return (
    <div className={cn(
      "flex gap-5 w-full animate-in fade-in slide-in-from-bottom-3 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-sky-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20 border border-sky-400/20">
          <ShieldCheck size={20} className="text-white" />
        </div>
      )}
      <div className={cn(
        "max-w-[90%] md:max-w-[80%] rounded-2xl px-6 py-5 transition-shadow",
        isAssistant
          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm"
          : "bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/10 font-medium"
      )}>
        {renderContent(content)}
      </div>
      {!isAssistant && (
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700">
          <User size={20} className="text-slate-600 dark:text-slate-400" />
        </div>
      )}
    </div>
  );
}