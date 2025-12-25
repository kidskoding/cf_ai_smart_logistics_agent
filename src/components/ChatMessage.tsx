import { useState } from 'react';
import { cn } from '@/lib/utils';
import { User, ShieldCheck, Mail, Calendar, Star, Copy, Check, Hash, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system';
  content: string;
}
export function ChatMessage({ role, content }: ChatMessageProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const isAssistant = role === 'assistant';
  const handleCopy = (text: string, type: string, uniqueId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(uniqueId);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const renderContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const blocks: Array<{ type: 'text' | 'table'; content: string[] }> = [];
    let currentBlock: { type: 'text' | 'table'; content: string[] } | null = null;
    lines.forEach((line) => {
      const isTableLine = line.trim().startsWith('|') && line.trim().includes('|');
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
            const headers = tableLines[0].split('|').filter(Boolean).map(s => s.trim());
            const rows = tableLines.slice(2).filter(l => !l.includes('---')).map(line =>
              line.split('|').filter(Boolean).map(s => s.trim())
            );
            return (
              <div key={idx} className="my-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {rows.map((row, rowIndex) => (
                        <tr key={rowIndex} className="hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-colors">
                          {row.map((cell, cellIndex) => {
                            const header = headers[cellIndex]?.toLowerCase() || '';
                            const isEmail = header.includes('email') || cell.includes('@');
                            const isPrice = header.includes('price') || header.includes('cost') || cell.startsWith('$');
                            const cellId = `cell-${idx}-${rowIndex}-${cellIndex}`;
                            return (
                              <td key={cellIndex} className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                                {isEmail ? (
                                  <button onClick={() => handleCopy(cell, 'Email', cellId)} className="flex items-center gap-2 group/email text-sky-600 dark:text-sky-400">
                                    <Mail size={12} className="shrink-0" />
                                    <span className="truncate max-w-[120px]">{cell}</span>
                                    {copiedId === cellId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover/email:opacity-100 transition-opacity" />}
                                  </button>
                                ) : isPrice ? (
                                  (() => {
                                    const raw = cell.replace(/[^0-9.]/g, '');
                                    const num = parseFloat(raw);
                                    if (isNaN(num)) return <span className="text-muted-foreground italic text-xs">{cell}</span>;
                                    return (
                                      <div className="flex items-center gap-1 font-bold tabular-nums whitespace-nowrap">
                                        <DollarSign size={13} className="text-emerald-500 shrink-0" />
                                        <span>{num.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                        <button onClick={() => handleCopy(cell, 'Price', cellId)} className="ml-1 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                                          {copiedId === cellId ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} className="text-slate-300" />}
                                        </button>
                                      </div>
                                    );
                                  })()
                                ) : header.includes('reliability') ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full w-fit border border-emerald-100 dark:border-emerald-900/50">
                                    <Star size={10} className="text-amber-500 fill-amber-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs">{cell}</span>
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
    <div className={cn("flex gap-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-500", isAssistant ? "justify-start" : "justify-end")}>
      {isAssistant && (
        <div className="w-9 h-9 rounded-lg bg-sky-600 flex items-center justify-center shrink-0 shadow-lg border border-sky-400/20 mt-1">
          <ShieldCheck size={18} className="text-white" />
        </div>
      )}
      <div className={cn(
        "max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-4",
        isAssistant ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none" : "bg-sky-600 text-white rounded-tr-none font-medium"
      )}>
        {renderContent(content)}
      </div>
      {!isAssistant && (
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
          <User size={18} className="text-slate-600" />
        </div>
      )}
    </div>
  );
}