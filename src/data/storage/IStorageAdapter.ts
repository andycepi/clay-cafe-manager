export interface IStorageAdapter {
  read<T>(collection: string): Promise<T[]>;
  write<T>(collection: string, data: T[]): Promise<void>;
  readOne<T>(collection: string, id: string): Promise<T | null>;
  writeOne<T>(collection: string, id: string, data: T): Promise<void>;
  updatePartial?<T>(collection: string, id: string, updates: Partial<T>): Promise<void>;
  updateBulk?<T>(collection: string, updates: Array<{id: string, data: Partial<T>}>): Promise<void>;
  deleteOne(collection: string, id: string): Promise<boolean>;
  exists(collection: string): Promise<boolean>;
  clear(collection: string): Promise<void>;
  backup(): Promise<string>;
  restore(backupData: string): Promise<void>;
}

export interface StorageConfig {
  baseKey?: string;
  compressionEnabled?: boolean;
  encryptionEnabled?: boolean;
  autoBackup?: boolean;
  maxBackups?: number;
}