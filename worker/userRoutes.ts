import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    app.all('/api/chat/:sessionId/*', async (c) => {
        const sessionId = c.req.param('sessionId');
        if (!c.env.CHAT_AGENT) {
          console.error('[ERROR] CHAT_AGENT binding missing');
          return c.json({
            success: false, 
            error: 'Chat agent unavailable - Durable Object binding missing. Please check wrangler.jsonc.'
          }, { status: 503 });
        }
        try {
            const agent = await getAgentByName<Env, ChatAgent>(c.env.CHAT_AGENT, sessionId);
            const url = new URL(c.req.url);
            url.pathname = url.pathname.replace(`/api/chat/${sessionId}`, '');
            return agent.fetch(new Request(url.toString(), {
                method: c.req.method,
                headers: c.req.header(),
                body: c.req.method === 'GET' || c.req.method === 'DELETE' ? undefined : c.req.raw.body
            }));
        } catch (error) {
            console.error(`[AGENT PROXY ERROR] Session ${sessionId}:`, error);
            return c.json({
                success: false,
                error: API_RESPONSES.AGENT_ROUTING_FAILED,
                detail: error instanceof Error ? error.message : String(error)
            }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/sessions', async (c) => {
        if (!c.env.APP_CONTROLLER) {
            return c.json({ success: false, error: 'Session management unavailable - Binding missing.' }, { status: 503 });
        }
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            console.error('Failed to list sessions:', error);
            return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        if (!c.env.APP_CONTROLLER) {
            return c.json({ success: false, error: 'Session management unavailable.' }, { status: 503 });
        }
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title;
            if (!sessionTitle) {
                const now = new Date();
                const dateTime = now.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                if (firstMessage && firstMessage.trim()) {
                    const cleanMessage = firstMessage.trim().replace(/\s+/g, ' ');
                    const truncated = cleanMessage.length > 35 ? cleanMessage.slice(0, 32) + '...' : cleanMessage;
                    sessionTitle = `${truncated}`;
                } else {
                    sessionTitle = `Search • ${dateTime}`;
                }
            }
            await registerSession(c.env, sessionId, sessionTitle);
            return c.json({ success: true, data: { sessionId, title: sessionTitle } });
        } catch (error) {
            console.error('Failed to create session:', error);
            return c.json({ success: false, error: 'Failed to create session' }, { status: 500 });
        }
    });
    app.delete('/api/sessions/:sessionId', async (c) => {
        if (!c.env.APP_CONTROLLER) return c.json({ success: false, error: 'Binding missing.' }, { status: 503 });
        try {
            const sessionId = c.req.param('sessionId');
            const deleted = await unregisterSession(c.env, sessionId);
            return c.json({ success: true, data: { deleted } });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to delete' }, { status: 500 });
        }
    });
}