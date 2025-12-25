import React from 'react';
import { cn } from '@/lib/utils';
import { User, ShieldCheck } from 'lucide-react';
interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export function ChatMessage({ role, content }: ChatMessageProps) {
  const isAssistant = role === 'assistant';
  // Basic markdown-to-table parser for simple phase implementation
  const renderContent = (text: string) => {
    if (!text) return null;
    // Check if contains a table structure
    if (text.includes('|') && text.includes('--')) {
      const lines = text.split('\n');
      const tableLines = lines.filter(l => l.trim().startsWith('|'));
      if (tableLines.length > 2) {
        const headers = tableLines[0].split('|').filter(Boolean).map(s => s.trim());
        const rows = tableLines.slice(2).map(line => 
          line.split('|').filter(Boolean).map(s => s.trim())
        );
        return (
          <div className="space-y-4">
            <div className="text-sm leading-relaxed whitespace-pre-wrap mb-4">
              {lines.filter(l => !l.trim().startsWith('|')).join('\n').trim()}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                <thead className="bg-slate-50 dark:bg-slate-900/50">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-4 py-3 text-left font-semibold text-slate-900 dark:text-slate-100">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {rows.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-3 text-slate-600 dark:text-slate-400">
                          {cell}
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
    return <div className="text-sm leading-relaxed whitespace-pre-wrap">{text}</div>;
  };
  return (
    <div className={cn(
      "flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center shrink-0 border border-sky-200 dark:border-sky-800">
          <ShieldCheck size={16} className="text-sky-600" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
        isAssistant 
          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none" 
          : "bg-sky-600 text-white rounded-tr-none"
      )}>
        {renderContent(content)}
      </div>
      {!isAssistant && (
        <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0">
          <User size={16} className="text-slate-600 dark:text-slate-400" />
        </div>
      )}
    </div>
  );
}