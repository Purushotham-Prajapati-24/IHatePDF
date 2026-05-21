import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import type { TaskLog, ToolType } from '../types';

const DB_NAME = 'ihatepdf_db';
const DB_VERSION = 1;
const FILE_BUFFER_TTL_MS = 2 * 60 * 60 * 1000;

export interface FileBufferRecord {
  id: string;
  name: string;
  size: number;
  blob: Blob;
  timestamp: number;
}

export interface TesseractCacheRecord {
  languageCode: string;
  modelData: ArrayBuffer;
  timestamp: number;
}

interface IHatePdfDatabase extends DBSchema {
  history_logs: {
    key: string;
    value: TaskLog;
    indexes: {
      timestamp: number;
      tool: ToolType;
    };
  };
  file_buffer: {
    key: string;
    value: FileBufferRecord;
    indexes: {
      timestamp: number;
    };
  };
  tesseract_cache: {
    key: string;
    value: TesseractCacheRecord;
  };
}

export type IHatePdfDb = IDBPDatabase<IHatePdfDatabase>;

export async function initDB(): Promise<IHatePdfDb> {
  return openDB<IHatePdfDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('history_logs')) {
        const historyStore = db.createObjectStore('history_logs', { keyPath: 'id' });
        historyStore.createIndex('timestamp', 'timestamp', { unique: false });
        historyStore.createIndex('tool', 'tool', { unique: false });
      }

      if (!db.objectStoreNames.contains('file_buffer')) {
        const bufferStore = db.createObjectStore('file_buffer', { keyPath: 'id' });
        bufferStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      if (!db.objectStoreNames.contains('tesseract_cache')) {
        db.createObjectStore('tesseract_cache', { keyPath: 'languageCode' });
      }
    },
  });
}

export async function runGarbageCollector(db: IHatePdfDb): Promise<void> {
  const cutoffTimestamp = Date.now() - FILE_BUFFER_TTL_MS;
  const tx = db.transaction('file_buffer', 'readwrite');
  const timestampIndex = tx.store.index('timestamp');

  let cursor = await timestampIndex.openCursor(IDBKeyRange.upperBound(cutoffTimestamp));

  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

export async function initializeLocalDatabase(): Promise<IHatePdfDb> {
  const db = await initDB();
  await runGarbageCollector(db);
  return db;
}

export async function saveTaskLog(log: TaskLog): Promise<void> {
  const db = await initDB();
  await db.put('history_logs', log);
}

export async function saveFileToBuffer(record: FileBufferRecord): Promise<void> {
  const db = await initDB();
  await db.put('file_buffer', record);
}
