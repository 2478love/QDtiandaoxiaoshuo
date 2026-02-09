/**
 * 增量分析缓存系统 - 提升分析性能
 * 
 * 核心能力：
 * 1. 缓存分析结果，避免重复计算
 * 2. 增量分析，只分析变化的部分
 * 3. 智能失效策略
 * 4. 内存管理和清理
 */

import type {
  ComprehensiveAnalysis,
  StyleAnalysis,
  PlotTensionAnalysis,
  EmotionAnalysis,
} from './analyzers';

// ============ 类型定义 ============

export interface CacheEntry<T> {
  key: string;
  data: T;
  contentHash: string;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // 估算的内存大小（字节）
}

export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitCount: number;
  missCount: number;
  hitRate: number;
  oldestEntry: number;
  newestEntry: number;
}

export interface CacheConfig {
  maxEntries: number; // 最大缓存条目数
  maxSize: number; // 最大缓存大小（字节）
  ttl: number; // 缓存有效期（毫秒）
  enablePersistence: boolean; // 是否持久化到 localStorage
}

// ============ 默认配置 ============

export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxEntries: 100,
  maxSize: 10 * 1024 * 1024, // 10MB
  ttl: 30 * 60 * 1000, // 30分钟
  enablePersistence: true,
};

// ============ 缓存管理器 ============

export class AnalysisCacheManager<T = any> {
  private cache: Map<string, CacheEntry<T>>;
  private config: CacheConfig;
  private hitCount: number;
  private missCount: number;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
    this.hitCount = 0;
    this.missCount = 0;

    // 从 localStorage 恢复缓存
    if (this.config.enablePersistence) {
      this.loadFromStorage();
    }
  }

  /**
   * 生成内容哈希
   */
  private generateHash(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36);
  }

  /**
   * 估算对象大小
   */
  private estimateSize(obj: any): number {
    const str = JSON.stringify(obj);
    return str.length * 2; // 粗略估算（UTF-16）
  }

  /**
   * 生成缓存键
   */
  generateKey(prefix: string, content: string): string {
    const hash = this.generateHash(content);
    return `${prefix}:${hash}`;
  }

  /**
   * 获取缓存
   */
  get(key: string, content: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.missCount++;
      return null;
    }

    // 检查内容是否变化
    const currentHash = this.generateHash(content);
    if (entry.contentHash !== currentHash) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - entry.timestamp > this.config.ttl) {
      this.cache.delete(key);
      this.missCount++;
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = now;
    this.hitCount++;

    return entry.data;
  }

  /**
   * 设置缓存
   */
  set(key: string, data: T, content: string): void {
    const now = Date.now();
    const contentHash = this.generateHash(content);
    const size = this.estimateSize(data);

    const entry: CacheEntry<T> = {
      key,
      data,
      contentHash,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now,
      size,
    };

    // 检查是否需要清理
    this.evictIfNeeded(size);

    this.cache.set(key, entry);

    // 持久化
    if (this.config.enablePersistence) {
      this.saveToStorage();
    }
  }

  /**
   * 清理缓存（LRU策略）
   */
  private evictIfNeeded(newEntrySize: number): void {
    const stats = this.getStats();

    // 检查条目数限制
    if (this.cache.size >= this.config.maxEntries) {
      this.evictLRU();
    }

    // 检查大小限制
    while (stats.totalSize + newEntrySize > this.config.maxSize && this.cache.size > 0) {
      this.evictLRU();
    }
  }

  /**
   * 移除最少使用的条目
   */
  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.hitCount = 0;
    this.missCount = 0;

    if (this.config.enablePersistence) {
      this.clearStorage();
    }
  }

  /**
   * 删除指定缓存
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    
    if (result && this.config.enablePersistence) {
      this.saveToStorage();
    }

    return result;
  }

  /**
   * 获取缓存统计
   */
  getStats(): CacheStats {
    let totalSize = 0;
    let oldestEntry = Infinity;
    let newestEntry = 0;

    for (const entry of this.cache.values()) {
      totalSize += entry.size;
      oldestEntry = Math.min(oldestEntry, entry.timestamp);
      newestEntry = Math.max(newestEntry, entry.timestamp);
    }

    const totalRequests = this.hitCount + this.missCount;
    const hitRate = totalRequests > 0 ? this.hitCount / totalRequests : 0;

    return {
      totalEntries: this.cache.size,
      totalSize,
      hitCount: this.hitCount,
      missCount: this.missCount,
      hitRate,
      oldestEntry: oldestEntry === Infinity ? 0 : oldestEntry,
      newestEntry,
    };
  }

  /**
   * 清理过期缓存
   */
  cleanExpired(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.config.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0 && this.config.enablePersistence) {
      this.saveToStorage();
    }

    return cleaned;
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.cache.entries());
      localStorage.setItem('analysis-cache', JSON.stringify(data));
      localStorage.setItem('analysis-cache-stats', JSON.stringify({
        hitCount: this.hitCount,
        missCount: this.missCount,
      }));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
    }
  }

  /**
   * 从 localStorage 加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('analysis-cache');
      const stats = localStorage.getItem('analysis-cache-stats');

      if (data) {
        const entries = JSON.parse(data) as Array<[string, CacheEntry<T>]>;
        this.cache = new Map(entries);
      }

      if (stats) {
        const { hitCount, missCount } = JSON.parse(stats);
        this.hitCount = hitCount || 0;
        this.missCount = missCount || 0;
      }

      // 清理过期条目
      this.cleanExpired();
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.cache.clear();
    }
  }

  /**
   * 清除 localStorage
   */
  private clearStorage(): void {
    try {
      localStorage.removeItem('analysis-cache');
      localStorage.removeItem('analysis-cache-stats');
    } catch (error) {
      console.warn('Failed to clear cache storage:', error);
    }
  }
}

// ============ 全局缓存实例 ============

export const comprehensiveAnalysisCache = new AnalysisCacheManager<ComprehensiveAnalysis>();
export const styleAnalysisCache = new AnalysisCacheManager<StyleAnalysis>();
export const tensionAnalysisCache = new AnalysisCacheManager<PlotTensionAnalysis>();
export const emotionAnalysisCache = new AnalysisCacheManager<EmotionAnalysis>();

// ============ 增量分析 ============

export interface IncrementalAnalysisResult<T> {
  result: T;
  fromCache: boolean;
  analysisTime: number;
}

/**
 * 带缓存的分析函数包装器
 */
export function withCache<T>(
  cacheManager: AnalysisCacheManager<T>,
  prefix: string,
  analyzeFunc: (content: string) => T
): (content: string) => IncrementalAnalysisResult<T> {
  return (content: string): IncrementalAnalysisResult<T> => {
    const startTime = Date.now();
    const key = cacheManager.generateKey(prefix, content);

    // 尝试从缓存获取
    const cached = cacheManager.get(key, content);
    if (cached) {
      return {
        result: cached,
        fromCache: true,
        analysisTime: Date.now() - startTime,
      };
    }

    // 执行分析
    const result = analyzeFunc(content);
    
    // 保存到缓存
    cacheManager.set(key, result, content);

    return {
      result,
      fromCache: false,
      analysisTime: Date.now() - startTime,
    };
  };
}

/**
 * 批量清理所有缓存
 */
export function clearAllCaches(): void {
  comprehensiveAnalysisCache.clear();
  styleAnalysisCache.clear();
  tensionAnalysisCache.clear();
  emotionAnalysisCache.clear();
}

/**
 * 获取所有缓存统计
 */
export function getAllCacheStats(): Record<string, CacheStats> {
  return {
    comprehensive: comprehensiveAnalysisCache.getStats(),
    style: styleAnalysisCache.getStats(),
    tension: tensionAnalysisCache.getStats(),
    emotion: emotionAnalysisCache.getStats(),
  };
}

/**
 * 清理所有过期缓存
 */
export function cleanAllExpiredCaches(): Record<string, number> {
  return {
    comprehensive: comprehensiveAnalysisCache.cleanExpired(),
    style: styleAnalysisCache.cleanExpired(),
    tension: tensionAnalysisCache.cleanExpired(),
    emotion: emotionAnalysisCache.cleanExpired(),
  };
}

/**
 * 生成缓存报告
 */
export function generateCacheReport(): string {
  const stats = getAllCacheStats();
  const lines: string[] = [];

  lines.push('# 分析缓存报告\n');

  Object.entries(stats).forEach(([name, stat]) => {
    lines.push(`## ${name} 缓存`);
    lines.push(`- 条目数: ${stat.totalEntries}`);
    lines.push(`- 总大小: ${(stat.totalSize / 1024).toFixed(2)} KB`);
    lines.push(`- 命中次数: ${stat.hitCount}`);
    lines.push(`- 未命中次数: ${stat.missCount}`);
    lines.push(`- 命中率: ${(stat.hitRate * 100).toFixed(2)}%`);
    
    if (stat.oldestEntry > 0) {
      const age = Date.now() - stat.oldestEntry;
      lines.push(`- 最旧条目: ${Math.floor(age / 60000)} 分钟前`);
    }
    
    lines.push('');
  });

  return lines.join('\n');
}
