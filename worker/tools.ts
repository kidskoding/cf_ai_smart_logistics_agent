import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | ErrorResult | any;
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'search_inventory',
      description: 'Search the internal enterprise parts database for specific components, part numbers, or categories.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search term for part number, description, or category' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'find_suppliers',
      description: 'Search our procurement database for the last 3 known suppliers for a specific part description.',
      parameters: {
        type: 'object',
        properties: {
          part_description: { type: 'string', description: 'Detailed description of the part' }
        },
        required: ['part_description']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_weather',
      description: 'Get current weather information for a location',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string', description: 'The city or location name' } },
        required: ['location']
      }
    }
  }
];
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  return [...customTools, ...mcpTools];
}
function generateMockSuppliers(part: string) {
  const cleanPart = part.toUpperCase().trim();
  let domain = 'components';
  let companyPool = ["Global Dynamics Corp", "Precision Machining Ltd", "Apex Industrial Solutions", "Vertex Components", "Legacy Parts Co"];
  const seed = Array.from(cleanPart).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const results = [];
  for (let i = 0; i < 3; i++) {
    const companyIdx = (seed + (i * 7)) % companyPool.length;
    const daysAgo = (seed % 90) + (i * 15);
    const date = new Date(Date.now() - (daysAgo * 86400000));
    results.push({
      company_name: companyPool[companyIdx],
      contact_email: `sales@${companyPool[companyIdx].toLowerCase().replace(/\s+/g, '')}.${domain}.com`,
      last_order_date: date.toISOString().split('T')[0],
      reliability_score: `${88 + ((seed + i) % 12)}%`,
      sourcing_lead_time: `${2 + ((seed * (i + 1)) % 20)} Days`
    });
  }
  return results;
}
export async function executeTool(name: string, args: Record<string, unknown>, env?: any): Promise<ToolResult> {
  try {
    switch (name) {
      case 'search_inventory': {
        const query = (args.query as string) || "";
        if (!env?.DB) return { error: "Inventory database unavailable" };
        const results = await env.DB.prepare(
            "SELECT * FROM Parts WHERE part_number LIKE ? OR part_description LIKE ? OR category LIKE ? LIMIT 10"
        ).bind(`%${query}%`, `%${query}%`, `%${query}%`).all();
        return {
            status: "success",
            count: results.results.length,
            parts: results.results
        };
      }
      case 'find_suppliers': {
        const part = (args.part_description as string) || "generic component";
        return {
          status: "success",
          suppliers: generateMockSuppliers(part)
        };
      }
      case 'get_weather': {
        return { location: args.location, temperature: 22, condition: 'Sunny', humidity: 45 };
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: `Tool Error: ${error instanceof Error ? error.message : 'Unknown'}` };
  }
}