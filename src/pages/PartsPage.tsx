import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { inventoryService, Part } from '@/lib/inventory';
import { useChatStore } from '@/lib/store';
import { useNavigate } from 'react-router-dom';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Package, ArrowRight, Copy, Loader2 } from "lucide-react";
import { toast } from 'sonner';
export function PartsPage() {
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const setInputValue = useChatStore(s => s.setInputValue);
  const navigate = useNavigate();
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const res = await inventoryService.fetchParts();
      if (res.success && res.data) setParts(res.data);
      setLoading(false);
    };
    load();
  }, []);
  const filteredParts = parts.filter(p => 
    p.part_number.toLowerCase().includes(search.toLowerCase()) ||
    p.part_description.toLowerCase().includes(search.toLowerCase())
  );
  const handleSource = (part: Part) => {
    setInputValue(`Find suppliers for ${part.part_number}: ${part.part_description}`);
    navigate('/');
    toast.success(`Started procurement for ${part.part_number}`);
  };
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Part number copied");
  };
  return (
    <AppLayout className="bg-slate-50 dark:bg-slate-950 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-1">
              <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <Package className="text-sky-600" size={32} />
                Enterprise Inventory
              </h1>
              <p className="text-muted-foreground font-medium">Manage and source industrial components from the central database.</p>
            </div>
            <div className="relative w-full md:w-96 group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
              <Input
                placeholder="Search by part number or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:ring-sky-500"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                <TableRow>
                  <TableHead className="font-bold py-4">Part Number</TableHead>
                  <TableHead className="font-bold py-4">Description</TableHead>
                  <TableHead className="font-bold py-4">Category</TableHead>
                  <TableHead className="text-right font-bold py-4">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="animate-spin text-sky-600" size={32} />
                        <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Accessing Persistence Layer...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredParts.length > 0 ? (
                  filteredParts.map((part) => (
                    <TableRow key={part.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        <button 
                          onClick={() => copyToClipboard(part.part_number)}
                          className="flex items-center gap-2 hover:underline group"
                        >
                          {part.part_number}
                          <Copy size={12} className="opacity-0 group-hover:opacity-100" />
                        </button>
                      </TableCell>
                      <TableCell className="font-medium">{part.part_description}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                          {part.category}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-sky-600 hover:text-sky-700 hover:bg-sky-50 dark:hover:bg-sky-900/20 font-bold"
                          onClick={() => handleSource(part)}
                        >
                          Source <ArrowRight size={14} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">
                      No components found matching your search.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}