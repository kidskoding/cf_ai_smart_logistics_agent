import { Hono } from "hono";
import { getAgentByName } from 'agents';
import { ChatAgent } from './agent';
import { API_RESPONSES } from './config';
import { Env, getAppController, registerSession, unregisterSession } from "./core-utils";
async function ensureInventorySeeded(db: D1Database) {
  try {
    await db.prepare(`
        CREATE TABLE IF NOT EXISTS Parts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            part_number TEXT UNIQUE NOT NULL,
            part_description TEXT NOT NULL,
            category TEXT NOT NULL
        )
    `).run();
    const check = await db.prepare("SELECT COUNT(*) as count FROM Parts").first<{count: number}>();
    if (check && check.count === 0) {
        const parts = [
            ['RES-220K', '2.2k Ohm 1/4W Carbon Film Resistor', 'Passives'],
            ['CPU-i7-13700K', 'Intel Core i7-13700K Processor', 'Processors'],
            ['CAP-100UF', '100uF 25V Electrolytic Capacitor', 'Passives'],
            ['MCU-STM32F4', 'STM32F405 ARM Cortex-M4 Microcontroller', 'Microcontrollers'],
            ['IC-LM358', 'Dual Operational Amplifier IC', 'Analog'],
            ['LED-RGB-5MM', '5mm RGB Common Cathode LED', 'Optoelectronics'],
            ['MOS-IRFZ44N', 'N-Channel Power MOSFET 49A 55V', 'Discrete'],
            ['REG-7805', '5V Positive Voltage Regulator', 'Power'],
            ['DIO-1N4007', '1A 1000V General Purpose Rectifier', 'Discrete'],
            ['ESP-WROOM-32', 'ESP32 WiFi + BT Module', 'Wireless'],
            ['CON-USB-C', 'USB Type-C Female Connector SMT', 'Connectors'],
            ['LCD-1602-I2C', '16x2 Character LCD with I2C Interface', 'Displays'],
            ['RAM-DDR4-16G', '16GB DDR4 3200MHz Desktop Memory', 'Memory'],
            ['SSD-NVME-1TB', '1TB NVMe M.2 PCIe Gen4 SSD', 'Storage'],
            ['FAN-120MM-PWM', '120mm PWM Cooling Fan 12V', 'Thermal'],
            ['SEN-BME280', 'Temperature/Humidity/Pressure Sensor', 'Sensors'],
            ['REL-5V-1CH', '5V Single Channel Relay Module', 'Power'],
            ['SW-SPDT-MINI', 'Miniature SPDT Toggle Switch', 'Electromechanical'],
            ['CRY-16MHZ', '16MHz HC-49S Crystal Oscillator', 'Timing'],
            ['POT-10K-LIN', '10k Ohm Linear Potentiometer', 'Passives']
        ];
        const stmt = db.prepare("INSERT INTO Parts (part_number, part_description, category) VALUES (?, ?, ?)");
        await db.batch(parts.map(p => stmt.bind(p[0], p[1], p[2])));
    }
  } catch (error) {
    console.error("Database seeding failed, but worker continuing:", error);
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
            // SANITIZATION: Clean up and truncate the title for the sidebar
            let sessionTitle = title || (firstMessage ? (firstMessage.slice(0, 24).trim() + '...') : `Search • ${new Date().toLocaleDateString()}`);
            sessionTitle = sessionTitle.replace(/[^\w\s\.\-]/g, '').slice(0, 32);
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