/**
 * @fileoverview 高级存储服务
 * @module services/storage/StorageService
 * @description 提供 IndexedDB + localStorage 混合存储方案，支持大数据压缩和分片
 * @version 1.0.0
 *
 * @features
 * - IndexedDB 主存储（支持大数据）
 * - LZ-String 数据压缩
 * - 分片存储（大数据自动分片）
 * - 存储容量检测与用户提醒
 * - 数据版本控制和迁移
 * - 自动降级到 localStorage
 *
 * @example
 * // 初始化存储
 * await storage.init();
 *
 * // 存储数据
 * await storage.set('my-key', { data: 'value' });
 *
 * // 读取数据
 * const data = await storage.get('my-key', defaultValue);
 *
 * // 删除数据
 * await storage.remove('my-key');
 *
 * // 检查存储状态
 * const stats = await storage.getStorageStats();
 */

import LZString from 'lz-string';

// ==================== 常量定义 ====================

const DB_NAME = 'TiandaoWriterDB';
const DB_VERSION = 1;
const STORE_NAME = 'data';
const META_STORE = 'meta';

// 分片大小：500KB（IndexedDB 单条记录建议不超过 1MB）
const CHUNK_SIZE = 500 * 1024;

// 数据版本（用于迁移）
const DATA_VERSION = 1;

// 存储警告阈值
const STORAGE_WARNING_THRESHOLD = 0.8; // 80%
const STORAGE_CRITICAL_THRESHOLD = 0.95; // 95%

// ==================== 类型定义 ====================

export interface StorageMetadata {
  version: number;
  totalSize: number;
  lastUpdated: string;
  chunkCount?: number;
  compressed: boolean;
}

export interface StorageStats {
  used: number;
  quota: number;
  percentage: number;
  isNearLimit: boolean;
  isCritical: boolean;
}

export interface MigrationResult {
  success: boolean;
  fromVersion: number;
  toVersion: number;
  migratedKeys: string[];
  errors: string[];
}

type StorageEventType = 'warning' | 'critical' | 'error' | 'migrated';

type StorageEventCallback = (event: {
  type: StorageEventType;
  message: string;
  details?: unknown;
}) => void;

// ==================== IndexedDB 工具函数 ====================

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * 初始化 IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance;
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB 初始化失败:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 创建主数据存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }

      // 创建元数据存储
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
  });

  return dbInitPromise;
}

/**
 * 检查 IndexedDB 是否可用
 */
function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

// ==================== 压缩工具 ====================

/**
 * 压缩数据
 */
function compress(data: string): string {
  return LZString.compressToUTF16(data);
}

/**
 * 解压数据
 */
function decompress(data: string): string | null {
  return LZString.decompressFromUTF16(data);
}

/**
 * 计算压缩后的大小
 */
function getCompressedSize(data: string): number {
  return new Blob([compress(data)]).size;
}

// ==================== 分片存储 ====================

/**
 * 将数据分片
 */
function splitIntoChunks(data: string): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    chunks.push(data.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

/**
 * 合并分片数据
 */
function mergeChunks(chunks: string[]): string {
  return chunks.join('');
}

// ==================== 存储容量检测 ====================

/**
 * 获取存储使用情况
 */
async function getStorageStats(): Promise<StorageStats> {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const quota = estimate.quota || 0;
      const percentage = quota > 0 ? used / quota : 0;

      return {
        used,
        quota,
        percentage,
        isNearLimit: percentage >= STORAGE_WARNING_THRESHOLD,
        isCritical: percentage >= STORAGE_CRITICAL_THRESHOLD
      };
    }
  } catch (error) {
    console.warn('无法获取存储估算:', error);
  }

  // 降级：尝试通过 localStorage 估算
  try {
    let totalSize = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        totalSize += (localStorage.getItem(key) || '').length * 2; // UTF-16
      }
    }
    // 假设 localStorage 限制为 5MB
    const quota = 5 * 1024 * 1024;
    const percentage = totalSize / quota;

    return {
      used: totalSize,
      quota,
      percentage,
      isNearLimit: percentage >= STORAGE_WARNING_THRESHOLD,
      isCritical: percentage >= STORAGE_CRITICAL_THRESHOLD
    };
  } catch {
    return {
      used: 0,
      quota: 0,
      percentage: 0,
      isNearLimit: false,
      isCritical: false
    };
  }
}

// ==================== 数据迁移 ====================

interface MigrationHandler {
  fromVersion: number;
  toVersion: number;
  migrate: (data: unknown) => unknown;
}

const migrations: MigrationHandler[] = [
  // 示例迁移：从版本 0 到版本 1
  // {
  //   fromVersion: 0,
  //   toVersion: 1,
  //   migrate: (data) => {
  //     // 迁移逻辑
  //     return data;
  //   }
  // }
];

/**
 * 执行数据迁移
 */
function migrateData(data: unknown, fromVersion: number, toVersion: number): unknown {
  let currentData = data;
  let currentVersion = fromVersion;

  while (currentVersion < toVersion) {
    const migration = migrations.find(
      m => m.fromVersion === currentVersion && m.toVersion === currentVersion + 1
    );

    if (migration) {
      currentData = migration.migrate(currentData);
      currentVersion = migration.toVersion;
    } else {
      // 没有找到迁移处理器，跳过
      currentVersion++;
    }
  }

  return currentData;
}

// ==================== 主存储类 ====================

class StorageService {
  private eventListeners: Map<StorageEventType, Set<StorageEventCallback>> = new Map();
  private useIndexedDB: boolean;
  private initialized: boolean = false;

  constructor() {
    this.useIndexedDB = isIndexedDBAvailable();
  }

  /**
   * 初始化存储服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    if (this.useIndexedDB) {
      try {
        await initDB();
        // 从 localStorage 迁移数据到 IndexedDB
        await this.migrateFromLocalStorage();
      } catch (error) {
        console.warn('IndexedDB 初始化失败，降级使用 localStorage:', error);
        this.useIndexedDB = false;
      }
    }

    this.initialized = true;

    // 检查存储容量
    await this.checkStorageCapacity();
  }

  /**
   * 从 localStorage 迁移数据到 IndexedDB
   */
  private async migrateFromLocalStorage(): Promise<void> {
    const keysToMigrate = [
      'tiandao_novels',
      'tiandao_users',
      'tiandao_activity_log',
      'tiandao_prompts',
      'tiandao_invites',
      'tiandao_short_works',
      'tiandao_longnovel_ai_sessions'
    ];

    for (const key of keysToMigrate) {
      try {
        const localData = localStorage.getItem(key);
        if (localData) {
          // 检查 IndexedDB 中是否已有数据
          const existingData = await this.getRawFromIndexedDB(key);
          if (!existingData) {
            // 迁移到 IndexedDB
            const parsed = JSON.parse(localData);
            await this.set(key, parsed);
            console.log(`已迁移 ${key} 到 IndexedDB`);
            // 保留 localStorage 作为备份，但标记为已迁移
            localStorage.setItem(`${key}_migrated`, 'true');
          }
        }
      } catch (error) {
        console.warn(`迁移 ${key} 失败:`, error);
      }
    }
  }

  /**
   * 检查存储容量并发出警告
   */
  private async checkStorageCapacity(): Promise<void> {
    const stats = await getStorageStats();

    if (stats.isCritical) {
      this.emit('critical', '存储空间严重不足！请立即导出备份并清理数据。', stats);
    } else if (stats.isNearLimit) {
      this.emit('warning', '存储空间即将用尽，建议导出备份。', stats);
    }
  }

  /**
   * 设置数据
   */
  async set<T>(key: string, value: T): Promise<void> {
    const jsonData = JSON.stringify(value);
    const compressedData = compress(jsonData);
    const dataSize = new Blob([compressedData]).size;

    // 检查存储容量
    const stats = await getStorageStats();
    if (stats.isCritical) {
      this.emit('critical', '存储空间不足，无法保存数据！', { key, size: dataSize });
      throw new Error('存储空间不足');
    }

    if (this.useIndexedDB) {
      try {
        await this.setToIndexedDB(key, compressedData, dataSize);
        return;
      } catch (error) {
        console.warn('IndexedDB 写入失败，尝试 localStorage:', error);
      }
    }

    // 降级到 localStorage
    await this.setToLocalStorage(key, compressedData, dataSize);
  }

  /**
   * 写入 IndexedDB
   */
  private async setToIndexedDB(key: string, data: string, size: number): Promise<void> {
    const db = await initDB();

    // 如果数据较大，进行分片存储
    const needsChunking = size > CHUNK_SIZE;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, META_STORE], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const metaStore = transaction.objectStore(META_STORE);

      // 先删除旧数据和旧分片
      store.delete(key);

      if (needsChunking) {
        const chunks = splitIntoChunks(data);

        // 删除旧分片
        for (let i = 0; i < 1000; i++) {
          store.delete(`${key}_chunk_${i}`);
        }

        // 存储新分片
        chunks.forEach((chunk, index) => {
          store.put({ key: `${key}_chunk_${index}`, value: chunk });
        });

        // 存储元数据
        const metadata: StorageMetadata = {
          version: DATA_VERSION,
          totalSize: size,
          lastUpdated: new Date().toISOString(),
          chunkCount: chunks.length,
          compressed: true
        };
        metaStore.put({ key, ...metadata });
      } else {
        // 直接存储
        store.put({ key, value: data });

        // 存储元数据
        const metadata: StorageMetadata = {
          version: DATA_VERSION,
          totalSize: size,
          lastUpdated: new Date().toISOString(),
          compressed: true
        };
        metaStore.put({ key, ...metadata });
      }

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * 写入 localStorage（带容量检测）
   */
  private async setToLocalStorage(key: string, data: string, size: number): Promise<void> {
    try {
      // 检查是否需要分片
      if (size > 2 * 1024 * 1024) { // 2MB 以上进行分片
        const chunks = splitIntoChunks(data);

        // 清理旧分片
        for (let i = 0; i < 100; i++) {
          localStorage.removeItem(`${key}_chunk_${i}`);
        }

        // 存储新分片
        chunks.forEach((chunk, index) => {
          localStorage.setItem(`${key}_chunk_${index}`, chunk);
        });

        // 存储元数据
        localStorage.setItem(`${key}_meta`, JSON.stringify({
          version: DATA_VERSION,
          totalSize: size,
          chunkCount: chunks.length,
          compressed: true,
          lastUpdated: new Date().toISOString()
        }));

        // 删除旧的非分片数据
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, data);
        localStorage.setItem(`${key}_meta`, JSON.stringify({
          version: DATA_VERSION,
          totalSize: size,
          compressed: true,
          lastUpdated: new Date().toISOString()
        }));
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.emit('error', 'localStorage 存储空间已满！', { key, size });
        throw new Error('存储空间已满');
      }
      throw error;
    }
  }

  /**
   * 获取数据
   */
  async get<T>(key: string, defaultValue: T): Promise<T> {
    try {
      if (this.useIndexedDB) {
        const result = await this.getFromIndexedDB<T>(key);
        if (result !== null) return result;
      }

      // 尝试从 localStorage 读取
      const result = await this.getFromLocalStorage<T>(key);
      if (result !== null) return result;
    } catch (error) {
      console.error(`读取 ${key} 失败:`, error);
      this.emit('error', `读取数据失败: ${key}`, error);
    }

    return defaultValue;
  }

  /**
   * 从 IndexedDB 读取
   */
  private async getFromIndexedDB<T>(key: string): Promise<T | null> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME, META_STORE], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const metaStore = transaction.objectStore(META_STORE);

      const metaRequest = metaStore.get(key);

      metaRequest.onsuccess = () => {
        const metadata = metaRequest.result as (StorageMetadata & { key: string }) | undefined;

        if (!metadata) {
          // 尝试直接读取（无元数据的旧数据）
          const directRequest = store.get(key);
          directRequest.onsuccess = () => {
            const result = directRequest.result;
            if (result?.value) {
              try {
                const decompressed = metadata?.compressed !== false
                  ? decompress(result.value)
                  : result.value;
                if (decompressed) {
                  resolve(JSON.parse(decompressed) as T);
                  return;
                }
              } catch {
                // 可能是未压缩的旧数据
                try {
                  resolve(JSON.parse(result.value) as T);
                  return;
                } catch {
                  // 忽略
                }
              }
            }
            resolve(null);
          };
          directRequest.onerror = () => reject(directRequest.error);
          return;
        }

        // 检查是否需要数据迁移
        if (metadata.version < DATA_VERSION) {
          // 需要迁移，但先读取数据
        }

        if (metadata.chunkCount) {
          // 分片数据
          const chunks: string[] = [];
          let completed = 0;

          for (let i = 0; i < metadata.chunkCount; i++) {
            const chunkRequest = store.get(`${key}_chunk_${i}`);
            chunkRequest.onsuccess = () => {
              chunks[i] = chunkRequest.result?.value || '';
              completed++;

              if (completed === metadata.chunkCount) {
                try {
                  const merged = mergeChunks(chunks);
                  const decompressed = metadata.compressed ? decompress(merged) : merged;
                  if (decompressed) {
                    let data = JSON.parse(decompressed) as T;
                    // 执行迁移
                    if (metadata.version < DATA_VERSION) {
                      data = migrateData(data, metadata.version, DATA_VERSION) as T;
                    }
                    resolve(data);
                  } else {
                    resolve(null);
                  }
                } catch (error) {
                  reject(error);
                }
              }
            };
            chunkRequest.onerror = () => reject(chunkRequest.error);
          }
        } else {
          // 非分片数据
          const dataRequest = store.get(key);
          dataRequest.onsuccess = () => {
            const result = dataRequest.result;
            if (result?.value) {
              try {
                const decompressed = metadata.compressed ? decompress(result.value) : result.value;
                if (decompressed) {
                  let data = JSON.parse(decompressed) as T;
                  // 执行迁移
                  if (metadata.version < DATA_VERSION) {
                    data = migrateData(data, metadata.version, DATA_VERSION) as T;
                  }
                  resolve(data);
                  return;
                }
              } catch {
                // 忽略
              }
            }
            resolve(null);
          };
          dataRequest.onerror = () => reject(dataRequest.error);
        }
      };

      metaRequest.onerror = () => reject(metaRequest.error);
    });
  }

  /**
   * 从 IndexedDB 获取原始数据（用于检查是否存在）
   */
  private async getRawFromIndexedDB(key: string): Promise<string | null> {
    const db = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * 从 localStorage 读取
   */
  private async getFromLocalStorage<T>(key: string): Promise<T | null> {
    try {
      const metaStr = localStorage.getItem(`${key}_meta`);

      if (metaStr) {
        const metadata = JSON.parse(metaStr) as StorageMetadata;

        if (metadata.chunkCount) {
          // 分片数据
          const chunks: string[] = [];
          for (let i = 0; i < metadata.chunkCount; i++) {
            chunks.push(localStorage.getItem(`${key}_chunk_${i}`) || '');
          }
          const merged = mergeChunks(chunks);
          const decompressed = metadata.compressed ? decompress(merged) : merged;
          if (decompressed) {
            let data = JSON.parse(decompressed) as T;
            if (metadata.version < DATA_VERSION) {
              data = migrateData(data, metadata.version, DATA_VERSION) as T;
            }
            return data;
          }
        } else {
          // 非分片但有元数据
          const data = localStorage.getItem(key);
          if (data) {
            const decompressed = metadata.compressed ? decompress(data) : data;
            if (decompressed) {
              let parsed = JSON.parse(decompressed) as T;
              if (metadata.version < DATA_VERSION) {
                parsed = migrateData(parsed, metadata.version, DATA_VERSION) as T;
              }
              return parsed;
            }
          }
        }
      }

      // 尝试读取旧格式（无元数据）
      const rawData = localStorage.getItem(key);
      if (rawData) {
        // 先尝试解压
        const decompressed = decompress(rawData);
        if (decompressed) {
          return JSON.parse(decompressed) as T;
        }
        // 可能是未压缩的旧数据
        return JSON.parse(rawData) as T;
      }
    } catch (error) {
      console.warn(`从 localStorage 读取 ${key} 失败:`, error);
    }

    return null;
  }

  /**
   * 删除数据
   */
  async remove(key: string): Promise<void> {
    if (this.useIndexedDB) {
      try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const metaStore = transaction.objectStore(META_STORE);

        // 获取元数据以确定是否有分片
        const metaRequest = metaStore.get(key);
        metaRequest.onsuccess = () => {
          const metadata = metaRequest.result as StorageMetadata | undefined;

          // 删除主数据
          store.delete(key);

          // 删除分片
          if (metadata?.chunkCount) {
            for (let i = 0; i < metadata.chunkCount; i++) {
              store.delete(`${key}_chunk_${i}`);
            }
          }

          // 删除元数据
          metaStore.delete(key);
        };
      } catch (error) {
        console.warn('从 IndexedDB 删除失败:', error);
      }
    }

    // 同时清理 localStorage
    localStorage.removeItem(key);
    localStorage.removeItem(`${key}_meta`);
    localStorage.removeItem(`${key}_migrated`);

    // 清理分片
    for (let i = 0; i < 100; i++) {
      const chunkKey = `${key}_chunk_${i}`;
      if (localStorage.getItem(chunkKey) === null) break;
      localStorage.removeItem(chunkKey);
    }
  }

  /**
   * 获取存储统计信息
   */
  async getStats(): Promise<StorageStats> {
    return getStorageStats();
  }

  /**
   * 清理所有数据
   */
  async clear(): Promise<void> {
    if (this.useIndexedDB) {
      try {
        const db = await initDB();
        const transaction = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        transaction.objectStore(STORE_NAME).clear();
        transaction.objectStore(META_STORE).clear();
      } catch (error) {
        console.warn('清理 IndexedDB 失败:', error);
      }
    }

    // 清理 localStorage 中的 tiandao 相关数据
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('tiandao_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  /**
   * 导出所有数据（用于备份）
   */
  async exportAll(): Promise<Record<string, unknown>> {
    const keys = [
      'tiandao_novels',
      'tiandao_users',
      'tiandao_activity_log',
      'tiandao_prompts',
      'tiandao_invites',
      'tiandao_short_works',
      'tiandao_longnovel_ai_sessions',
      'tiandao_api_settings',
      'tiandao_api_presets'
    ];

    const data: Record<string, unknown> = {
      exportedAt: new Date().toISOString(),
      version: DATA_VERSION
    };

    for (const key of keys) {
      const value = await this.get(key, null);
      if (value !== null) {
        data[key] = value;
      }
    }

    return data;
  }

  /**
   * 导入数据（从备份恢复）
   */
  async importAll(data: Record<string, unknown>): Promise<void> {
    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith('tiandao_') && value !== null && value !== undefined) {
        await this.set(key, value);
      }
    }
  }

  /**
   * 注册事件监听器
   */
  on(event: StorageEventType, callback: StorageEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    // 返回取消监听函数
    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * 触发事件
   */
  private emit(type: StorageEventType, message: string, details?: unknown): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, message, details });
        } catch (error) {
          console.error('事件回调执行失败:', error);
        }
      });
    }
  }
}

// 导出单例
export const storageService = new StorageService();

// 导出便捷函数
export const storage = {
  init: () => storageService.init(),
  get: <T>(key: string, defaultValue: T) => storageService.get(key, defaultValue),
  set: <T>(key: string, value: T) => storageService.set(key, value),
  remove: (key: string) => storageService.remove(key),
  getStats: () => storageService.getStats(),
  clear: () => storageService.clear(),
  exportAll: () => storageService.exportAll(),
  importAll: (data: Record<string, unknown>) => storageService.importAll(data),
  on: (event: StorageEventType, callback: StorageEventCallback) => storageService.on(event, callback)
};

export default storageService;
