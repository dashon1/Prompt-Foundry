// Storage interface for Prompt Foundry
// Using in-memory storage for generator history (optional feature)

export interface GeneratorHistory {
  id: string;
  category: string;
  genType: string;
  inputs: any;
  output: any;
  timestamp: string;
}

export interface IStorage {
  // Optional: Store generator history for future features
  saveHistory(history: Omit<GeneratorHistory, 'id'>): Promise<GeneratorHistory>;
  getHistory(limit?: number): Promise<GeneratorHistory[]>;
}

export class MemStorage implements IStorage {
  private history: Map<string, GeneratorHistory>;

  constructor() {
    this.history = new Map();
  }

  async saveHistory(historyData: Omit<GeneratorHistory, 'id'>): Promise<GeneratorHistory> {
    const id = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const history: GeneratorHistory = { ...historyData, id };
    this.history.set(id, history);
    return history;
  }

  async getHistory(limit = 50): Promise<GeneratorHistory[]> {
    const allHistory = Array.from(this.history.values());
    return allHistory
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }
}

export const storage = new MemStorage();
