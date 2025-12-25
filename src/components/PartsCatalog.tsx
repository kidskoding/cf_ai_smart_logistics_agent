import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { inventoryService, Part } from '@/lib/inventory';
interface PartsCatalogProps {
  onSelectPart: (description: string) => void;
  className?: string;
}
export function PartsCatalog({ onSelectPart, className }: PartsCatalogProps) {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await inventoryService.fetchParts();
      if (res.success && res.data) setParts(res.data);
      setLoading(false);
    };
    load();
  }, []);
  const filteredParts = useMemo(() => {
    return parts.filter(part =>
      part.part_number.toLowerCase().includes(search.toLowerCase()) ||
      part.part_description.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, parts]);
  return (
    <div className={cn("flex flex-col h-full space-y-4", className)}>
      <div className="relative group px-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
        <Input
          placeholder="Filter inventory..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs focus-visible:ring-sky-500"
        />
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 min-h-[200px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <Loader2 className="animate-spin text-sky-500" size={20} />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Loading DB...</span>
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-900">
              <TableRow className="hover:bg-transparent border-b border-slate-200 dark:border-slate-800">
                <TableHead className="w-[110px] text-[10px] font-bold uppercase tracking-wider h-10 px-3">
                  PN
                </TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 px-3">
                  Description
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParts.length > 0 ? (
                filteredParts.map((part) => (
                  <TableRow
                    key={part.id}
                    className="cursor-pointer group hover:bg-sky-50/50 dark:hover:bg-sky-900/10 transition-colors border-b border-slate-100 dark:border-slate-900"
                    onClick={() => onSelectPart(`${part.part_number}: ${part.part_description}`)}
                  >
                    <TableCell className="font-mono text-[11px] text-sky-600 dark:text-sky-400 font-bold py-2.5 px-3">
                      {part.part_number}
                    </TableCell>
                    <TableCell className="text-[11px] text-slate-600 dark:text-slate-400 py-2.5 px-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate max-w-[120px]">{part.part_description}</span>
                        <ChevronRight className="h-3 w-3 opacity-0 group-hover:opacity-100 text-sky-500 transition-all" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center text-xs text-muted-foreground italic">
                    No results
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}