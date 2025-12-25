export interface Part {
  id: number;
  part_number: string;
  part_description: string;
  category: string;
}
class InventoryService {
  async fetchParts(query?: string): Promise<{ success: boolean; data?: Part[]; error?: string }> {
    try {
      const url = query ? `/api/inventory?q=${encodeURIComponent(query)}` : '/api/inventory';
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('InventoryService.fetchParts failed:', error);
      return { success: false, error: (error as Error).message };
    }
  }
}
export const inventoryService = new InventoryService();