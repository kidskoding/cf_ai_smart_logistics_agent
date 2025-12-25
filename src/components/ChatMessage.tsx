import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { User, ShieldCheck, Mail, Calendar, Star, Copy, Check, DollarSign, Download, Info } from 'lucide-react';
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
  const exportToCSV = (headers: string[], rows: string[][], filename: string) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Procurement data exported as CSV");
  };
  const renderContent = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    const blocks: Array<{ type: 'text' | 'table'; content: string[] }> = [];
    let currentBlock: { type: 'text' | 'table'; content: string[] } | null = null;
    lines.forEach((line) => {
      const trimmed = line.trim();
      const isTableLine = trimmed.startsWith('|') && trimmed.endsWith('|');
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
            // Robust parsing: split by | and slice to remove empty outer elements
            const headers = tableLines[0].split('|').slice(1, -1).map(s => s.trim());
            const rows = tableLines.slice(2)
              .filter(l => l.includes('|') && !l.includes('---'))
              .map(line => line.split('|').slice(1, -1).map(s => s.trim()));
            const isVerified = text.toLowerCase().includes('historical_transactions') || text.toLowerCase().includes('enterprise network');
            return (
              <div key={idx} className="my-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 shadow-md bg-white dark:bg-slate-950 group/table">
                <div className="bg-slate-50/80 dark:bg-slate-900/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Supplier Intelligence Report</span>
                    {isVerified && (
                      <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter">
                        <ShieldCheck size={10} /> Verified
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => exportToCSV(headers, rows, `procurement-data-${Date.now()}`)}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-sky-600 hover:text-sky-700 transition-colors"
                    title="Export to CSV"
                  >
                    <Download size={12} /> <span className="hidden sm:inline">Export CSV</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                    <thead className="bg-slate-50/50 dark:bg-slate-900/30">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {rows.map((row, rowIndex) => {
                        const isTotalRow = row.some(cell => cell.toLowerCase().includes('total'));
                        return (
                          <tr 
                            key={rowIndex} 
                            className={cn(
                              "transition-colors",
                              isTotalRow 
                                ? "bg-sky-50/50 dark:bg-sky-900/20 font-bold" 
                                : "hover:bg-slate-50/50 dark:hover:bg-slate-900/20"
                            )}
                          >
                            {row.map((cell, cellIndex) => {
                              const header = headers[cellIndex]?.toLowerCase() || '';
                              const isEmail = !isTotalRow && (header.includes('email') || cell.includes('@'));
                              // Enhanced price detection: regex for numbers with common patterns
                              const isPrice = header.includes('price') || header.includes('cost') || /^\$?\d+(\.\d{2})?$/.test(cell.trim());
                              const cellId = `cell-${idx}-${rowIndex}-${cellIndex}`;
                              return (
                                <td key={cellIndex} className="px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                                  {isEmail ? (
                                    <button 
                                      onClick={() => handleCopy(cell, 'Email', cellId)} 
                                      className="flex items-center gap-2 group/email text-sky-600 dark:text-sky-400 hover:underline"
                                      title="Copy Email"
                                    >
                                      <Mail size={12} className="shrink-0" />
                                      <span className="truncate max-w-[140px]">{cell}</span>
                                      {copiedId === cellId ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="opacity-0 group-hover/email:opacity-100 transition-opacity" />}
                                    </button>
                                  ) : isPrice ? (
                                    <div className="flex items-center gap-1 tabular-nums whitespace-nowrap">
                                      <DollarSign size={13} className="text-emerald-500 shrink-0" />
                                      <span>{cell.replace('$', '')}</span>
                                    </div>
                                  ) : header.includes('reliability') ? (
                                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full w-fit border border-emerald-100 dark:border-emerald-900/50 shadow-sm">
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          }
          const textContent = block.content.join('\n').trim();
          if (!textContent) return null;
          return (
            <div key={idx} className="text-sm leading-relaxed whitespace-pre-wrap text-pretty">
              {textContent.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-slate-900 dark:text-white font-extrabold">{part}</strong> : part)}
            </div>
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
        "max-w-[90%] md:max-w-[80%] rounded-2xl px-5 py-4 shadow-sm",
        isAssistant 
          ? "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none" 
          : "bg-sky-600 text-white rounded-tr-none font-medium"
      )}>
        {renderContent(content)}
        {isAssistant && (
           <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
             <Info size={12} className="text-sky-500" />
             Validated Sourcing node
           </div>
        )}
      </div>
      {!isAssistant && (
        <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-1">
          <User size={18} className="text-slate-600" />
        </div>
      )}
    </div>
  );
}