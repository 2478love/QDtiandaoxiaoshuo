/**
 * 分析缓存管理器 - 提升分析性能
 * 
 * 核心能力：
 * 1. 基于内容哈希的缓存
 * 2. LRU 缓存策略
 * 3. 增量分析支持
 * 4. 缓存持久化（可选）
 * 5. 缓存统计和监控
 */

// ============ 类型定义 ============

/**
 * 简单的字符串哈希函数
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  hash: string;
  timestamp: number;
  hits: number;
  size: number; // 字节数
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number; // 字节
  hits: number;
  misses: number;
  hitRate: number; // 命中率 0-1
  evictions: number; // 驱逐次数
}

export interface CacheOptions {
  maxSize?: number; // 最大缓存大小（字节）
  maxEntries?: number; // 最大条目数
  ttl?: number; // 生存时间（毫秒）
  persistent?: boolean; // 是否持久化
  storageKey?: string; // 存储键名
}

// ============ LRU 缓存实现 ============

export class AnalysisCache<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private accessOrder: string[]; // LRU 访问顺序
  private stats: CacheStats;
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.accessOrder = [];
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
    };
    this.options = {
      maxSize: options.maxSize || 10 * 1024 * 1024, // 10MB
      maxEntries: options.maxEntries || 100,
      ttl: options.ttl || 3600000, // 1小时
      persistent: options.persistent || false,
      storageKey: options.storageKey || 'analysis-cache',
    };

    // 从持久化存储加载
    if (this.options.persistent) {
      this.loadFromStorage();
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(text: string, type: string): string {
    const hash = simpleHash(text);
    return `${type}:${hash}`;
  }

  /**
   * 计算数据大小（字节）
   */
  private calculateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2; // UTF-16
    } catch {
      return 0;
    }
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  /**
   * 驱逐最少使用的条目
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return;

    const keyToEvict = this.accessOrder.shift()!;
    const entry = this.cache.get(keyToEvict);
    
    if (entry) {
      this.stats.totalSize -= entry.size;
      this.stats.totalEntries--;
      this.stats.evictions++;
      this.cache.delete(keyToEvict);
    }
  }

  /**
   * 检查并清理过期条目
   */
  private cleanExpired(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > this.options.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => {
      const entry = this.cache.get(key);
      if (entry) {
        this.stats.totalSize -= entry.size;
        this.stats.totalEntries--;
      }
      this.cache.delete(key);
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
    });
  }

  /**
   * 获取缓存
   */
  get(text: string, type: string): T | null {
    const key = this.generateKey(text, type);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.totalEntries--;
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 命中
    entry.hits++;
    this.stats.hits++;
    this.updateAccessOrder(key);
    this.updateHitRate();

    return entry.value;
  }

  /**
   * 设置缓存
   */
  set(text: string, type: string, value: T): void {
    const key = this.generateKey(text, type);
    const hash = simpleHash(text);
    const size = this.calculateSize(value);

    // 检查是否需要驱逐
    while (
      (this.stats.totalSize + size > this.options.maxSize ||
        this.stats.totalEntries >= this.options.maxEntries) &&
      this.accessOrder.length > 0
    ) {
      this.evictLRU();
    }

    // 如果键已存在，先删除旧的
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.size;
      this.stats.totalEntries--;
    }

    // 添加新条目
    const entry: CacheEntry<T> = {
      key,
      value,
      hash,
      timestamp: Date.now(),
      hits: 0,
      size,
    };

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    this.stats.totalEntries++;
    this.updateAccessOrder(key);

    // 持久化
    if (this.options.persistent) {
      this.saveToStorage();
    }
  }

  /**
   * 检查缓存是否存在
   */
  has(text: string, type: string): boolean {
    const key = this.generateKey(text, type);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > this.options.ttl) {
      this.cache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.totalEntries--;
      return false;
    }
    
    return true;
  }

  /**
   * 删除缓存
   */
  delete(text: string, type: string): boolean {
    const key = this.generateKey(text, type);
    const entry = this.cache.get(key);
    
    if (!entry) return false;
    
    this.stats.totalSize -= entry.size;
    this.stats.totalEntries--;
    this.cache.delete(key);
    
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    
    if (this.options.persistent) {
      this.saveToStorage();
    }
    
    return true;
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats = {
      totalEntries: 0,
      totalSize: 0,
      hits: 0,
      misses: 0,
      hitRate: 0,
      evictions: 0,
    };

    if (this.options.persistent) {
      this.saveToStorage();
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * 获取缓存大小（MB）
   */
  getSizeMB(): number {
    return this.stats.totalSize / (1024 * 1024);
  }

  /**
   * 保存到持久化存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        accessOrder: this.accessOrder,
        stats: this.stats,
      };
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * 从持久化存储加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(this.options.storageKey);
      if (!data) return;

      const parsed = JSON.parse(data);
      this.cache = new Map(parsed.entries);
      this.accessOrder = parsed.accessOrder;
      this.stats = parsed.stats;

      // 清理过期条目
      this.cleanExpired();
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
    }
  }

  /**
   * 预热缓存
   */
  warmup(items: Array<{ text: string; type: string; value: T }>): void {
    items.forEach(item => {
      this.set(item.text, item.type, item.value);
    });
  }

  /**
   * 获取缓存条目列表
   */
  getEntries(): Array<CacheEntry<T>> {
    return Array.from(this.cache.values());
  }

  /**
   * 获取最常访问的条目
   */
  getTopEntries(limit: number = 10): Array<CacheEntry<T>> {
    return Array.from(this.cache.values())
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }
}

// ============ 全局缓存实例 ============

export const globalAnalysisCache = new AnalysisCache({
  maxSize: 50 * 1024 * 1024, // 50MB
  maxEntries: 500,
  ttl: 3600000, // 1小时
  persistent: true,
  storageKey: 'tiandao-analysis-cache',
});

// ============ 缓存装饰器 ============

/**
 * 缓存分析结果的装饰器
 */
export function cached<T>(type: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (text: string, ...args: any[]): T {
      // 尝试从缓存获取
      const cached = globalAnalysisCache.get(text, type);
      if (cached !== null) {
        return cached as T;
      }

      // 执行原方法
      const result = originalMethod.apply(this, [text, ...args]);

      // 缓存结果
      globalAnalysisCache.set(text, type, result);

      return result;
    };

    return descriptor;
  };
}

/**
 * 带缓存的分析函数包装器
 */
export function withCache<T>(
  fn: (text: string, ...args: any[]) => T,
  type: string
): (text: string, ...args: any[]) => T {
  return function (text: string, ...args: any[]): T {
    // 尝试从缓存获取
    const cached = globalAnalysisCache.get(text, type);
    if (cached !== null) {
      return cached as T;
    }

    // 执行原函数
    const result = fn(text, ...args);

    // 缓存结果
    globalAnalysisCache.set(text, type, result);

    return result;
  };
}
