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
    // Split content into blocks by identifying table segments
    const lines = text.split('\n');
    const blocks: Array<{ type: 'text' | 'table'; content: string[] }> = [];
    let currentBlock: { type: 'text' | 'table'; content: string[] } | null = null;
    lines.forEach((line) => {
      const isTableLine = line.trim().startsWith('|') && line.trim().endsWith('|');
      if (isTableLine) {
        if (currentBlock?.type === 'table') {
          currentBlock.content.push(line);
        } else {
          currentBlock = { type: 'table', content: [line] };
          blocks.push(currentBlock);
        }
      } else {
        if (currentBlock?.type === 'text') {
          currentBlock.content.push(line);
        } else {
          currentBlock = { type: 'text', content: [line] };
          blocks.push(currentBlock);
        }
      }
    });
    return (
      <div className="space-y-4">
        {blocks.map((block, idx) => {
          if (block.type === 'table' && block.content.length >= 3) {
            const tableLines = block.content;
            const headers = tableLines[0]
              .split('|')
              .filter(Boolean)
              .map((s) => s.trim());
            // Skip the separator line (index 1) and map the rest to rows
            const rows = tableLines.slice(2).map((line) =>
              line.split('|').filter(Boolean).map((s) => s.trim())
            );
            return (
              <div key={idx} className="my-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-5 py-3 text-left text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors group">
                          {row.map((cell, cellIndex) => {
                            const header = headers[cellIndex]?.toLowerCase() || '';
                            return (
                              <td key={cellIndex} className="px-5 py-3.5 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {header.includes('contact') || cell.includes('@') ? (
                                  <div className="flex items-center gap-2">
                                    <Mail size={14} className="text-slate-400 group-hover:text-sky-500 transition-colors" />
                                    <span className="text-sky-600 dark:text-sky-400 underline decoration-sky-600/30 underline-offset-4 cursor-pointer truncate max-w-[150px]">{cell}</span>
                                  </div>
                                ) : header.includes('order') || header.includes('date') ? (
                                  <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-slate-400" />
                                    <span className="tabular-nums">{cell}</span>
                                  </div>
                                ) : header.includes('reliability') || header.includes('score') ? (
                                  <div className="flex items-center gap-2">
                                    <Star size={14} className="text-amber-500 fill-amber-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{cell}</span>
                                  </div>
                                ) : (
                                  cell
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
          const textContent = block.content.join('\n').trim();
          if (!textContent) return null;
          return (
            <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">
              {textContent}
            </p>
          );
        })}
      </div>
    );
  };
  return (
    <div className={cn(
      "flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500",
      isAssistant ? "justify-start" : "justify-end"
    )}>
      {isAssistant && (
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 shadow-lg shadow-sky-500/20 border border-sky-400/20 mt-1">
          <ShieldCheck size={18} className="text-white" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4 transition-all duration-300",
        isAssistant
          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none shadow-sm hover:shadow-md"
          : "bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/10 font-medium"
      )}>
        {renderContent(content)}
      </div>
      {!isAssistant && (
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-300 dark:border-slate-700 mt-1">
          <User size={18} className="text-slate-600 dark:text-slate-400" />
        </div>
      )}
    </div>
  );
}