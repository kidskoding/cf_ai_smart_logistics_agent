import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
async function ensureInventorySeeded(db: D1Database) {
  try {
    // 1. Create Parts Table
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS Parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_number TEXT UNIQUE NOT NULL,
            part_description TEXT NOT NULL,
            category TEXT NOT NULL
        )
    `).run();
    // 2. Create PurchaseOrders Table
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS PurchaseOrders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_id INTEGER NOT NULL,
            supplier_name TEXT NOT NULL,
            supplier_email TEXT NOT NULL,
            order_date TEXT NOT NULL,
            unit_price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (part_id) REFERENCES Parts(id)
        )
    `).run();
    const check = await db.prepare("SELECT COUNT(*) as count FROM Parts").first<{count: number}>();
    if (check && check.count === 0) {
        const parts = [
            ['GPU-RTX-4090', 'NVIDIA GeForce RTX 4090 24GB Graphics Card', 'Graphics Cards'],
            ['RES-220K', '2.2k Ohm 1/4W Carbon Film Resistor', 'Passives'],
            ['CPU-i7-13700K', 'Intel Core i7-13700K Processor', 'Processors'],
            ['CAP-100UF', '100uF 25V Electrolytic Capacitor', 'Passives'],
            ['MCU-STM32F4', 'STM32F405 ARM Cortex-M4 Microcontroller', 'Microcontrollers'],
            ['IC-LM358', 'Dual Operational Amplifier IC', 'Analog'],
            ['SSD-NVME-1TB', '1TB NVMe M.2 PCIe Gen4 SSD', 'Storage'],
            ['RAM-DDR4-16G', '16GB DDR4 3200MHz Desktop Memory', 'Memory'],
            ['FAN-120MM-PWM', '120mm PWM Cooling Fan 12V', 'Thermal'],
            ['SEN-BME280', 'Temperature/Humidity/Pressure Sensor', 'Sensors']
        ];
        const stmt = db.prepare("INSERT INTO Parts (part_number, part_description, category) VALUES (?, ?, ?)");
        await db.batch(parts.map(p => stmt.bind(p[0], p[1], p[2])));
        // Seed Purchase Orders for RTX 4090 and others
        const rtxId = 1; // First inserted
        const orders = [
            [rtxId, 'Silicon Valley Direct', 'sales@svdirect.components.com', '2024-03-15', 1599.99, 10],
            [rtxId, 'NextGen Hardware', 'orders@nextgen.components.com', '2024-03-20', 1649.50, 5],
            [rtxId, 'Apex Industrial', 'procure@apex.components.com', '2024-03-25', 1585.00, 20],
            [rtxId, 'Silicon Valley Direct', 'sales@svdirect.components.com', '2024-04-01', 1610.00, 8],
            [2, 'Global Dynamics', 'sales@global.components.com', '2024-02-10', 0.05, 1000],
            [3, 'Legacy Parts', 'info@legacy.components.com', '2024-01-20', 420.00, 15],
            [7, 'Vertex Components', 'sales@vertex.components.com', '2024-03-05', 95.00, 50],
            [8, 'Global Dynamics', 'sales@global.components.com', '2024-03-12', 65.00, 100],
            [rtxId, 'Vertex Components', 'sales@vertex.components.com', '2024-04-05', 1575.00, 12],
            [1, 'Elite Graphics', 'contact@elite.components.com', '2024-04-10', 1699.00, 2]
        ];
        const orderStmt = db.prepare("INSERT INTO PurchaseOrders (part_id, supplier_name, supplier_email, order_date, unit_price, quantity) VALUES (?, ?, ?, ?, ?, ?)");
        await db.batch(orders.map(o => orderStmt.bind(o[0], o[1], o[2], o[3], o[4], o[5])));
    }
  } catch (error) {
    console.error("Database seeding failed:", error);
  }
}
export function coreRoutes(app: Hono<{ Bindings: Env }>) {
    app.all('/api/chat/:sessionId/*', async (c) => {
        const sessionId = c.req.param('sessionId');
        if (!c.env.CHAT_AGENT) {
          return c.json({ success: false, error: 'Chat agent unavailable' }, { status: 503 });
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
            return c.json({ success: false, error: API_RESPONSES.AGENT_ROUTING_FAILED }, { status: 500 });
        }
    });
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    app.get('/api/parts', async (c) => {
        if (!c.env.DB) return c.json({ success: false, error: 'DB binding missing' }, { status: 503 });
        try {
            await ensureInventorySeeded(c.env.DB);
            const results = await c.env.DB.prepare("SELECT * FROM Parts LIMIT 50").all();
            const rows = results.results;
            const acceptHeader = c.req.header('Accept') || '';
            const format = c.req.query('format');
            if (acceptHeader.includes('text/html') || format === 'html') {
                const html = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Central Inventory Registry</title>
                        <style>
                            body { font-family: sans-serif; padding: 2rem; background: #f8fafc; color: #1e293b; }
                            table { width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
                            th { background: #0ea5e9; color: white; text-align: left; padding: 12px 16px; font-size: 0.875rem; text-transform: uppercase; }
                            td { padding: 12px 16px; border-bottom: 1px solid #e2e8f0; font-size: 0.875rem; }
                            tr:last-child td { border-bottom: none; }
                            tr:hover { background: #f1f5f9; }
                            h1 { font-size: 1.5rem; margin-bottom: 1.5rem; }
                        </style>
                    </head>
                    <body>
                        <h1>Central Inventory Registry</h1>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Part Number</th>
                                    <th>Description</th>
                                    <th>Category</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.map(r => `
                                    <tr>
                                        <td>${r.id}</td>
                                        <td><strong>${r.part_number}</strong></td>
                                        <td>${r.part_description}</td>
                                        <td>${r.category}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </body>
                    </html>
                `;
                return c.html(html);
            }
            return c.json({ success: true, parts: rows });
        } catch (error) {
            return c.json({ success: false, error: 'Inspection failed' }, { status: 500 });
        }
    });
    app.get('/api/inventory', async (c) => {
        if (!c.env.DB) return c.json({ success: false, error: 'DB binding missing' }, { status: 503 });
        try {
            await ensureInventorySeeded(c.env.DB);
            const query = c.req.query('q');
            let results;
            if (query) {
                results = await c.env.DB.prepare(
                    "SELECT * FROM Parts WHERE part_number LIKE ? OR part_description LIKE ? OR category LIKE ?"
                ).bind(`%${query}%`, `%${query}%`, `%${query}%`).all();
            } else {
                results = await c.env.DB.prepare("SELECT * FROM Parts LIMIT 100").all();
            }
            return c.json({ success: true, data: results.results });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to fetch inventory' }, { status: 500 });
        }
    });
    app.get('/api/sessions', async (c) => {
        if (!c.env.APP_CONTROLLER) return c.json({ success: false, error: 'Binding missing.' }, { status: 503 });
        try {
            const controller = getAppController(c.env);
            const sessions = await controller.listSessions();
            return c.json({ success: true, data: sessions });
        } catch (error) {
            return c.json({ success: false, error: 'Failed to retrieve sessions' }, { status: 500 });
        }
    });
    app.post('/api/sessions', async (c) => {
        if (!c.env.APP_CONTROLLER) return c.json({ success: false, error: 'Binding missing.' }, { status: 503 });
        try {
            const body = await c.req.json().catch(() => ({}));
            const { title, sessionId: providedSessionId, firstMessage } = body;
            const sessionId = providedSessionId || crypto.randomUUID();
            let sessionTitle = title || (firstMessage ? (firstMessage.slice(0, 24).trim() + '...') : `Search • ${new Date().toLocaleDateString()}`);
            sessionTitle = sessionTitle.replace(/[^\w\s.-]/g, '').slice(0, 32);
            await registerSession(c.env, sessionId, sessionTitle);
            return c.json({ success: true, data: { sessionId, title: sessionTitle } });
        } catch (error) {
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
            return c.json({ success: false, error: 'Failed to delete session' }, { status: 500 });
        }
    });
}