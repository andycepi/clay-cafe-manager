import { IStorageAdapter, StorageConfig } from './IStorageAdapter';

export class LocalStorageAdapter implements IStorageAdapter {
  private config: StorageConfig;
  private baseKey: string;

  constructor(config: StorageConfig = {}) {
    this.config = {
      baseKey: 'clay-cafe',
      compressionEnabled: false,
      encryptionEnabled: false,
      autoBackup: true,
      maxBackups: 5,
      ...config
    };
    this.baseKey = this.config.baseKey!;
  }

  private getCollectionKey(collection: string): string {
    return `${this.baseKey}:${collection}`;
  }

  private getItemKey(collection: string, id: string): string {
    return `${this.baseKey}:${collection}:${id}`;
  }

  private getIndexKey(collection: string): string {
    return `${this.baseKey}:${collection}:_index`;
  }

  private serializeData(data: any): string {
    return JSON.stringify(data, (key, value) => {
      if (value instanceof Date) {
        return { __type: 'Date', value: value.toISOString() };
      }
      return value;
    });
  }

  private deserializeData<T>(data: string): T {
    return JSON.parse(data, (key, value) => {
      // Handle special Date format
      if (value && typeof value === 'object' && value.__type === 'Date') {
        return new Date(value.value);
      }
      
      // Handle date-like field names with ISO strings
      const dateFields = ['createdAt', 'updatedAt', 'readyForPickupDate', 'pickedUpDate', 'bookingDate', 'date'];
      if (dateFields.includes(key) && typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date;
      }
      
      return value;
    });
  }

  private getIndex(collection: string): string[] {
    const indexKey = this.getIndexKey(collection);
    const indexData = localStorage.getItem(indexKey);
    return indexData ? JSON.parse(indexData) : [];
  }

  private setIndex(collection: string, ids: string[]): void {
    const indexKey = this.getIndexKey(collection);
    localStorage.setItem(indexKey, JSON.stringify(ids));
  }

  private addToIndex(collection: string, id: string): void {
    const index = this.getIndex(collection);
    if (!index.includes(id)) {
      index.push(id);
      this.setIndex(collection, index);
    }
  }

  private removeFromIndex(collection: string, id: string): void {
    const index = this.getIndex(collection);
    const newIndex = index.filter(indexId => indexId !== id);
    this.setIndex(collection, newIndex);
  }

  async read<T>(collection: string): Promise<T[]> {
    try {
      const index = this.getIndex(collection);
      const items: T[] = [];

      for (const id of index) {
        const item = await this.readOne<T>(collection, id);
        if (item !== null) {
          items.push(item);
        }
      }

      return items;
    } catch (error) {
      console.error(`Error reading collection ${collection}:`, error);
      return [];
    }
  }

  async write<T>(collection: string, data: T[]): Promise<void> {
    try {
      await this.clear(collection);
      
      for (const item of data) {
        const id = (item as any).id;
        if (id) {
          await this.writeOne(collection, id, item);
        }
      }
    } catch (error) {
      console.error(`Error writing collection ${collection}:`, error);
      throw error;
    }
  }

  async readOne<T>(collection: string, id: string): Promise<T | null> {
    try {
      const key = this.getItemKey(collection, id);
      const data = localStorage.getItem(key);
      
      if (data === null) {
        return null;
      }

      return this.deserializeData<T>(data);
    } catch (error) {
      console.error(`Error reading item ${id} from collection ${collection}:`, error);
      return null;
    }
  }

  async writeOne<T>(collection: string, id: string, data: T): Promise<void> {
    try {
      const key = this.getItemKey(collection, id);
      const serializedData = this.serializeData(data);
      
      localStorage.setItem(key, serializedData);
      this.addToIndex(collection, id);
    } catch (error) {
      console.error(`Error writing item ${id} to collection ${collection}:`, error);
      throw error;
    }
  }

  async deleteOne(collection: string, id: string): Promise<boolean> {
    try {
      const key = this.getItemKey(collection, id);
      const existed = localStorage.getItem(key) !== null;
      
      localStorage.removeItem(key);
      this.removeFromIndex(collection, id);
      
      return existed;
    } catch (error) {
      console.error(`Error deleting item ${id} from collection ${collection}:`, error);
      return false;
    }
  }

  async exists(collection: string): Promise<boolean> {
    const indexKey = this.getIndexKey(collection);
    return localStorage.getItem(indexKey) !== null;
  }

  async clear(collection: string): Promise<void> {
    try {
      const index = this.getIndex(collection);
      
      for (const id of index) {
        const key = this.getItemKey(collection, id);
        localStorage.removeItem(key);
      }
      
      const indexKey = this.getIndexKey(collection);
      localStorage.removeItem(indexKey);
    } catch (error) {
      console.error(`Error clearing collection ${collection}:`, error);
      throw error;
    }
  }

  async backup(): Promise<string> {
    try {
      const backupData: Record<string, any> = {};
      const allKeys = Object.keys(localStorage);
      
      for (const key of allKeys) {
        if (key.startsWith(this.baseKey)) {
          const value = localStorage.getItem(key);
          if (value !== null) {
            backupData[key] = value;
          }
        }
      }

      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: backupData
      };

      return JSON.stringify(backup);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restore(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      
      if (!backup.data || typeof backup.data !== 'object') {
        throw new Error('Invalid backup format');
      }

      const allKeys = Object.keys(localStorage);
      for (const key of allKeys) {
        if (key.startsWith(this.baseKey)) {
          localStorage.removeItem(key);
        }
      }

      for (const [key, value] of Object.entries(backup.data)) {
        if (typeof value === 'string') {
          localStorage.setItem(key, value);
        }
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      throw error;
    }
  }

  getStorageInfo(): { used: number; available: number; collections: string[] } {
    let used = 0;
    const collections = new Set<string>();
    
    const allKeys = Object.keys(localStorage);
    for (const key of allKeys) {
      if (key.startsWith(this.baseKey)) {
        const value = localStorage.getItem(key);
        if (value) {
          used += key.length + value.length;
        }
        
        const parts = key.split(':');
        if (parts.length >= 2) {
          collections.add(parts[1]);
        }
      }
    }

    const available = 5 * 1024 * 1024 - used;

    return {
      used,
      available,
      collections: Array.from(collections).filter(c => !c.endsWith('_index'))
    };
  }
}