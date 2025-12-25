import { useEffect, useState } from "react";
import { Plus, MessageSquare, Trash2, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
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
export function AppSidebar(): JSX.Element {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const currentSessionId = useChatStore((s) => s.sessionId);
  const setSessionId = useChatStore((s) => s.setSessionId);
  const setInputValue = useChatStore((s) => s.setInputValue);
  const location = useLocation();
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
        <div className="flex items-center gap-3 px-2 py-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-bold shadow-lg shadow-sky-500/20">
            S
          </div>
          <span className="text-xl font-bold tracking-tight">SourceAI</span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleNewSearch}
              className="w-full bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center gap-2 py-6 rounded-xl transition-all shadow-md shadow-sky-600/10 active:scale-[0.98]"
            >
              <Plus size={18} /> <span className="font-bold">New Procurement Search</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 text-xs font-bold text-slate-500 uppercase tracking-[0.15em] mb-2">
            Recent Activity
          </SidebarGroupLabel>
          <SidebarMenu className="px-2">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground italic bg-slate-50/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                No recent searches
              </div>
            ) : (
              sessions.map((session) => (
                <SidebarMenuItem key={session.id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectSession(session.id)}
                    isActive={currentSessionId === session.id}
                    className={cn(
                      "group transition-all duration-200 py-5 rounded-lg mb-1",
                      currentSessionId === session.id
                        ? "bg-sky-50 text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 font-semibold"
                        : "hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                    )}
                  >
                    <MessageSquare className={cn("size-4 shrink-0", currentSessionId === session.id ? "text-sky-500" : "text-slate-400")} />
                    <span className="truncate flex-1 text-sm">{session.title}</span>
                  </SidebarMenuButton>
                  <SidebarMenuAction
                    onClick={(e) => handleDeleteSession(e, session.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="size-3 text-slate-400 hover:text-red-500" />
                  </SidebarMenuAction>
                </SidebarMenuItem>
              ))
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-slate-100 dark:border-slate-900">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
          <div className="bg-emerald-500/10 p-1 rounded-full">
            <ShieldCheck size={14} className="text-emerald-500" />
          </div>
          <span className="font-bold uppercase tracking-widest leading-tight">Verified Intelligence Node Active</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}