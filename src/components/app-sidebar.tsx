import React, { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2, ShieldCheck, Database } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { chatService } from "@/lib/chat";
import { useChatStore } from "@/lib/store";
import type { SessionInfo } from "../../worker/types";
import { cn } from "@/lib/utils";
import { PartsCatalog } from "./PartsCatalog";
import { toast } from "sonner";
export function AppSidebar(): JSX.Element {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const currentSessionId = useChatStore((s) => s.sessionId);
  const setSessionId = useChatStore((s) => s.setSessionId);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const loadSessions = async () => {
    const res = await chatService.listSessions();
    if (res.success && res.data) {
      setSessions(res.data);
    }
  };
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleNewSearch = () => {
    const newId = crypto.randomUUID();
    setSessionId(newId);
    setInputValue('');
  };
  const handleSelectSession = (id: string) => {
    setSessionId(id);
  };
  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await chatService.deleteSession(id);
    if (id === currentSessionId) {
      handleNewSearch();
    }
    loadSessions();
  };
  return (
    <Sidebar className="border-r border-slate-200 dark:border-slate-800">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3 px-2 py-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold">
            S
          </div>
          <span className="text-lg font-bold tracking-tight">SourceAI</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleNewSearch}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 py-5"
            >
              <Plus size={18} /> <span>New Procurement Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Recent Searches
          </SidebarGroupLabel>
          <SidebarMenu className="px-2 mt-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground italic">
                No recent activity
              </div>
            ) : (
              sessions.map((session) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectSession(session.id)}
                    isActive={currentSessionId === session.id}
                    className={cn(
                      "group transition-colors",
                      currentSessionId === session.id
                        ? "bg-slate-100 dark:bg-slate-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <MessageSquare className="size-4 text-slate-400" />
                    <span className="truncate flex-1 text-sm">{session.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="size-3 text-slate-400 hover:text-red-500" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="mt-4 flex-1 flex flex-col min-h-0">
          <SidebarGroupLabel className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
            <Database size={12} className="text-sky-500" />
            Component Catalog
          </SidebarGroupLabel>
          <div className="px-4 mt-2 flex-1 overflow-hidden">
            <PartsCatalog
              onSelectPart={(desc) => {
                setInputValue(`Find suppliers for ${desc}`);
                toast.success("Catalog item selected");
              }}
            />
          </div>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
          <ShieldCheck size={14} className="text-emerald-500" />
          <span>Verified Supplier Network Active</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}