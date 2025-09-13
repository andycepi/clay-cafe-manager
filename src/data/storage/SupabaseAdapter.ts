import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { IStorageAdapter } from './IStorageAdapter';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export class SupabaseAdapter implements IStorageAdapter {
  private convertToSnakeCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.convertToSnakeCase(item));
    
    // Fields that should be excluded from database writes (UI-only fields)
    const excludeFields = ['checkedIn', 'checked_in'];
    
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip excluded fields
      if (excludeFields.includes(key)) continue;
      
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      converted[snakeKey] = this.convertToSnakeCase(value);
    }
    return converted;
  }

  private convertToCamelCase(obj: any): any {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.convertToCamelCase(item));
    
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      // Convert ISO string back to Date object for date fields
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        converted[camelKey] = new Date(value);
      } else {
        converted[camelKey] = this.convertToCamelCase(value);
      }
    }
    return converted;
  }

  private mapCollectionName(collection: string): string {
    const mapping: Record<string, string> = {
      'eventBookings': 'event_bookings',
      'notificationSettings': 'notification_settings',
      'studioSettings': 'studio_settings',
      'eventTemplates': 'event_templates'
    };
    return mapping[collection] || collection;
  }
  async read<T>(collection: string): Promise<T[]> {
    try {
      const tableName = this.mapCollectionName(collection);
      const { data, error } = await supabase.from(tableName).select('*');
      if (error) throw new Error(`Failed to read from ${collection}: ${error.message}`);
      return this.convertToCamelCase(data || []) as T[];
    } catch (error) {
      throw new Error(`Database read error for ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async write<T>(collection: string, data: T[]): Promise<void> {
    try {
      if (!Array.isArray(data) || data.length === 0) return;
      const tableName = this.mapCollectionName(collection);
      const convertedData = this.convertToSnakeCase(data);
      const { error } = await supabase.from(tableName).upsert(convertedData, { onConflict: 'id' });
      if (error) throw new Error(`Failed to write to ${collection}: ${error.message}`);
    } catch (error) {
      throw new Error(`Database write error for ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async readOne<T>(collection: string, id: string): Promise<T | null> {
    try {
      const tableName = this.mapCollectionName(collection);
      const { data, error } = await supabase.from(tableName).select('*').eq('id', id).single();
      if (error) {
        if (error.code === 'PGRST116') return null; // No rows returned
        throw new Error(`Failed to read ${id} from ${collection}: ${error.message}`);
      }
      return this.convertToCamelCase(data) as T;
    } catch (error) {
      if (error instanceof Error && error.message.includes('No rows returned')) return null;
      throw new Error(`Database readOne error for ${collection}:${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async writeOne<T>(collection: string, id: string, data: T): Promise<void> {
    try {
      const tableName = this.mapCollectionName(collection);
      const convertedData = this.convertToSnakeCase({ ...data, id });
      const { error } = await supabase.from(tableName).upsert([convertedData], { onConflict: 'id' });
      if (error) throw new Error(`Failed to write ${id} to ${collection}: ${error.message}`);
    } catch (error) {
      throw new Error(`Database writeOne error for ${collection}:${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updatePartial<T>(collection: string, id: string, updates: Partial<T>): Promise<void> {
    try {
      const tableName = this.mapCollectionName(collection);
      const convertedUpdates = this.convertToSnakeCase({
        ...updates,
        updated_at: new Date().toISOString()
      });
      const { error } = await supabase
        .from(tableName)
        .update(convertedUpdates)
        .eq('id', id);
      if (error) throw new Error(`Failed to update ${id} in ${collection}: ${error.message}`);
    } catch (error) {
      throw new Error(`Database updatePartial error for ${collection}:${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateBulk<T>(collection: string, updates: Array<{id: string, data: Partial<T>}>): Promise<void> {
    try {
      const tableName = this.mapCollectionName(collection);
      const timestamp = new Date().toISOString();
      
      // Convert all updates to snake_case with timestamp
      const convertedUpdates = updates.map(update => ({
        ...this.convertToSnakeCase(update.data),
        id: update.id,
        updated_at: timestamp
      }));

      // Use upsert for bulk operations (more efficient than multiple update calls)
      const { error } = await supabase
        .from(tableName)
        .upsert(convertedUpdates, { onConflict: 'id' });
      
      if (error) throw new Error(`Failed to bulk update ${collection}: ${error.message}`);
    } catch (error) {
      throw new Error(`Database updateBulk error for ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteOne(collection: string, id: string): Promise<boolean> {
    try {
      const tableName = this.mapCollectionName(collection);
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw new Error(`Failed to delete ${id} from ${collection}: ${error.message}`);
      return true;
    } catch (error) {
      throw new Error(`Database deleteOne error for ${collection}:${id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async exists(collection: string): Promise<boolean> {
    try {
      const tableName = this.mapCollectionName(collection);
      const { data, error } = await supabase.from(tableName).select('id').limit(1);
      if (error) {
        if (error.code === '42P01') return false; // Table doesn't exist
        throw new Error(`Failed to check existence of ${collection}: ${error.message}`);
      }
      return !!data && data.length > 0;
    } catch (error) {
      console.warn(`Could not check existence of ${collection}:`, error);
      return false;
    }
  }

  async clear(collection: string): Promise<void> {
    try {
      const tableName = this.mapCollectionName(collection);
      const { error } = await supabase.from(tableName).delete().neq('id', '');
      if (error) throw new Error(`Failed to clear ${collection}: ${error.message}`);
    } catch (error) {
      throw new Error(`Database clear error for ${collection}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async backup(): Promise<string> {
    try {
      const collections = ['customers', 'pieces', 'events', 'eventBookings', 'notificationSettings', 'studioSettings', 'eventTemplates'];
      const backup: Record<string, any> = {
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      for (const collection of collections) {
        try {
          const data = await this.read(collection);
          backup[collection] = data;
        } catch (error) {
          console.warn(`Could not backup collection ${collection}:`, error);
          backup[collection] = [];
        }
      }

      return JSON.stringify(backup);
    } catch (error) {
      throw new Error(`Backup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restore(backupData: string): Promise<void> {
    try {
      const backup = JSON.parse(backupData);
      const collections = ['customers', 'pieces', 'events', 'eventBookings', 'notificationSettings', 'studioSettings', 'eventTemplates'];

      for (const collection of collections) {
        if (backup[collection]) {
          try {
            await this.clear(collection);
            if (Array.isArray(backup[collection]) && backup[collection].length > 0) {
              await this.write(collection, backup[collection]);
            } else if (backup[collection] && typeof backup[collection] === 'object') {
              await this.writeOne(collection, 'default', backup[collection]);
            }
          } catch (error) {
            console.error(`Failed to restore collection ${collection}:`, error);
          }
        }
      }
    } catch (error) {
      throw new Error(`Restore failed: ${error instanceof Error ? error.message : 'Invalid backup data'}`);
    }
  }
}