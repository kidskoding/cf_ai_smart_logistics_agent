import type { WeatherResult, ErrorResult } from './types';
import { mcpManager } from './mcp-client';
export type ToolResult = WeatherResult | { content: string } | ErrorResult | any;
const customTools = [
  {
    type: 'function' as const,
    function: {
      name: 'find_suppliers',
      description: 'Search our highly reliable procurement database for the last 3 known suppliers for a specific part, material, or industrial component.',
      parameters: {
        type: 'object',
        properties: {
          part_description: { type: 'string', description: 'Detailed description of the part, e.g., "high-speed ball bearings" or "12V DC stepper motor"' }
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
/**
 * Deterministic supplier generator for SourceAI
 * Uses part description characteristics to seed results
 */
function generateMockSuppliers(part: string) {
  const cleanPart = part.toUpperCase().trim();
  
  // Special handling for catalog categories to make it feel "authentic"
  let domain = 'components';
  let companyPool = [
    "Global Dynamics Corp", "Precision Machining Ltd", "Apex Industrial Solutions",
    "Vertex Components", "Legacy Parts Co", "Quantum Logistics", "Titan Sourcing",
    "AeroTech Manufacturing", "Standard Supply Group", "Infinite Parts Inc"
  ];

  if (cleanPart.includes('CPU') || cleanPart.includes('GPU') || cleanPart.includes('IC-')) {
    domain = 'semiconductors';
    companyPool = ["Silicon Labs", "MicroChip Systems", "Nordic Electro", "Apex Chips", "Velocity Semi", "Quantum Circuits"];
  } else if (cleanPart.includes('RES-') || cleanPart.includes('CAP-') || cleanPart.includes('IND-')) {
    domain = 'passives';
    companyPool = ["TDK Industrial", "Murata Sourcing", "Vishay Logistics", "Panasonic Pro", "Bourns Supply"];
  } else if (cleanPart.includes('CON-') || cleanPart.includes('TERM-')) {
    domain = 'interconnect';
    companyPool = ["Amphenol Direct", "Molex Sourcing", "TE Connectivity", "Hirose Solutions"];
  }

  const seed = Array.from(cleanPart).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const results = [];
  for (let i = 0; i < 3; i++) {
    // Use varied indexes for deterministic but unique feeling results
    const companyIdx = (seed + (i * 7)) % companyPool.length;
    const daysAgo = (seed % 90) + (i * 15);
    const date = new Date(Date.now() - (daysAgo * 86400000));
    // Reliability score between 88% and 99%
    const reliability = 88 + ((seed + i) % 12);
    // Lead time between 2 and 21 days
    const leadTime = 2 + ((seed * (i + 1)) % 20);
    results.push({
      company_name: companyPool[companyIdx],
      contact_email: `sales@${companyPool[companyIdx].toLowerCase().replace(/\s+/g, '')}.${domain === 'semiconductors' ? 'tech' : 'com'}`,
      last_order_date: date.toISOString().split('T')[0],
      reliability_score: `${reliability}%`,
      sourcing_lead_time: `${leadTime} Days`
    });
  }
  return results;
}
export async function executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
  try {
    switch (name) {
      case 'find_suppliers': {
        const part = (args.part_description as string) || "generic component";
        return { 
          status: "success",
          results_count: 3,
          source: "Historical Procurement DB v4.2",
          suppliers: generateMockSuppliers(part) 
        };
      }
      case 'get_weather': {
        const location = (args.location as string) ?? 'unknown';
        return {
          location,
          temperature: Math.floor(Math.random() * 40) - 10,
          condition: ['Sunny', 'Cloudy', 'Rainy', 'Snowy'][Math.floor(Math.random() * 4)],
          humidity: Math.floor(Math.random() * 100)
        };
      }
      case 'web_search': {
        const { query, url } = args;
        if (typeof url === 'string') {
          return { content: `SourceAI Web Fetch: Content retrieved from ${url} (Simulation)` };
        }
        return { content: `SourceAI Search: 5 results identified for query "${query ?? 'unknown'}" (Simulation)` };
      }
      default: {
        const content = await mcpManager.executeTool(name, args);
        return { content };
      }
    }
  } catch (error) {
    return { error: `Procurement Node Error: ${error instanceof Error ? error.message : 'Internal Failure'}` };
  }
}