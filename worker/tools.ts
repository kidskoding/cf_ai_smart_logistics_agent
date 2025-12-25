import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | ErrorResult | any;
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'find_suppliers',
      description: 'Search for the last 3 known suppliers for a specific part or material description',
      parameters: {
        type: 'object',
        properties: {
          part_description: { type: 'string', description: 'Description of the part, e.g., "high-speed ball bearings"' }
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
  },
  {
    type: 'function' as const,
    function: {
      name: 'web_search',
      description: 'Search the web using Google or fetch content from a specific URL',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query for Google search' },
          url: { type: 'string', description: 'Specific URL to fetch content from (alternative to search)' },
          num_results: { type: 'number', description: 'Number of search results to return (default: 5, max: 10)', default: 5 }
        },
        required: []
      }
    }
  }
];
export async function getToolDefinitions() {
  const mcpTools = await mcpManager.getToolDefinitions();
  return [...customTools, ...mcpTools];
}
// Deterministic supplier generator for Phase 1
function generateMockSuppliers(part: string) {
  const seeds = [part.length, part.charCodeAt(0) || 0, part.charCodeAt(part.length - 1) || 0];
  const companies = ["Global Dynamics Corp", "Precision Machining Ltd", "Apex Industrial Solutions", "Vertex Components", "Legacy Parts Co", "Quantum Logistics"];
  const results = [];
  for (let i = 0; i < 3; i++) {
    const idx = (seeds[i] + i) % companies.length;
    const date = new Date(Date.now() - (seeds[i] * 1000000) - (i * 86400000));
    results.push({
      company_name: companies[idx],
      contact_email: `sales@${companies[idx].toLowerCase().replace(/\s+/g, '')}.com`,
      last_order_date: date.toISOString().split('T')[0],
      reliability_score: ((seeds[0] + i) % 5) + 85 + "%"
    });
  }
  return results;
}
export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'find_suppliers':
        const part = (args.part_description as string) || "generic part";
        return { suppliers: generateMockSuppliers(part) };
      case 'get_weather':
        return {
          location: args.location as string,
          temperature: Math.floor(Math.random() * 40) - 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 100)
        };
      case 'web_search': {
        const { query, url } = args;
        if (typeof url === 'string') {
          return { content: "Content fetching simulated for Phase 1" };
        }
        return { content: `Search results for ${query} simulated` };
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}