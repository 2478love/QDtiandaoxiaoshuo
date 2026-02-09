/**
 * 增量分析缓存系统测试
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  AnalysisCacheManager,
  withCache,
  clearAllCaches,
  getAllCacheStats,
  cleanAllExpiredCaches,
  generateCacheReport,
  DEFAULT_CACHE_CONFIG,
  type CacheEntry,
} from './incrementalAnalysisCache';

describe('utils/incrementalAnalysisCache', () => {
  let cache: AnalysisCacheManager<any>;

  beforeEach(() => {
    // 使用不持久化的配置进行测试
    cache = new AnalysisCacheManager({ enablePersistence: false });
  });

  afterEach(() => {
    cache.clear();
  });

  describe('AnalysisCacheManager', () => {
    describe('basic operations', () => {
      it('should store and retrieve data', () => {
        const content = 'test content';
        const data = { score: 85 };
        const key = cache.generateKey('test', content);

        cache.set(key, data, content);
        const retrieved = cache.get(key, content);

        expect(retrieved).toEqual(data);
      });

      it('should return null for non-existent key', () => {
        const result = cache.get('non-existent', 'content');
        expect(result).toBeNull();
      });

      it('should return null when content changes', () => {
        const key = cache.generateKey('test', 'original');
        cache.set(key, { score: 85 }, 'original');

        const result = cache.get(key, 'modified');
        expect(result).toBeNull();
      });

      it('should delete cache entry', () => {
        const content = 'test';
        const key = cache.generateKey('test', content);
        cache.set(key, { score: 85 }, content);

        const deleted = cache.delete(key);
        expect(deleted).toBe(true);

        const result = cache.get(key, content);
        expect(result).toBeNull();
      });

      it('should clear all cache', () => {
        cache.set('key1', { data: 1 }, 'content1');
        cache.set('key2', { data: 2 }, 'content2');

        cache.clear();

        const stats = cache.getStats();
        expect(stats.totalEntries).toBe(0);
      });
    });

    describe('cache expiration', () => {
      it('should expire old entries', () => {
        const shortTTLCache = new AnalysisCacheManager({
          ttl: 100, // 100ms
          enablePersistence: false,
        });

        const content = 'test';
        const key = shortTTLCache.generateKey('test', content);
        shortTTLCache.set(key, { score: 85 }, content);

        // 立即获取应该成功
        let result = shortTTLCache.get(key, content);
        expect(result).not.toBeNull();

        // 等待过期
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            result = shortTTLCache.get(key, content);
            expect(result).toBeNull();
            resolve();
          }, 150);
        });
      });

      it('should clean expired entries', () => {
        const shortTTLCache = new AnalysisCacheManager({
          ttl: 50,
          enablePersistence: false,
        });

        shortTTLCache.set('key1', { data: 1 }, 'content1');
        shortTTLCache.set('key2', { data: 2 }, 'content2');

        return new Promise<void>((resolve) => {
          setTimeout(() => {
            const cleaned = shortTTLCache.cleanExpired();
            expect(cleaned).toBe(2);
            resolve();
          }, 100);
        });
      });
    });

    describe('cache eviction', () => {
      it('should evict LRU entry when max entries reached', () => {
        const smallCache = new AnalysisCacheManager({
          maxEntries: 2,
          enablePersistence: false,
        });

        smallCache.set('key1', { data: 1 }, 'content1');
        smallCache.set('key2', { data: 2 }, 'content2');
        
        // 访问 key1，使其成为最近使用
        smallCache.get('key1', 'content1');
        
        // 添加第三个条目，应该移除 key2
        smallCache.set('key3', { data: 3 }, 'content3');

        const stats = smallCache.getStats();
        expect(stats.totalEntries).toBeLessThanOrEqual(2);
      });

      it('should evict when max size exceeded', () => {
        const smallCache = new AnalysisCacheManager({
          maxSize: 1000, // 1KB
          enablePersistence: false,
        });

        // 添加大对象
        const largeData = { content: 'x'.repeat(500) };
        smallCache.set('key1', largeData, 'content1');
        smallCache.set('key2', largeData, 'content2');
        smallCache.set('key3', largeData, 'content3');

        const stats = smallCache.getStats();
        // 允许一些误差，因为大小估算不是完全精确的
        expect(stats.totalSize).toBeLessThanOrEqual(1100);
      });
    });

    describe('statistics', () => {
      it('should track hit and miss counts', () => {
        const content = 'test';
        const key = cache.generateKey('test', content);

        // Miss
        cache.get(key, content);
        
        // Set
        cache.set(key, { score: 85 }, content);
        
        // Hit
        cache.get(key, content);
        cache.get(key, content);

        const stats = cache.getStats();
        expect(stats.hitCount).toBe(2);
        expect(stats.missCount).toBe(1);
        expect(stats.hitRate).toBeCloseTo(2/3, 2);
      });

      it('should track total size', () => {
        cache.set('key1', { data: 'small' }, 'content1');
        cache.set('key2', { data: 'x'.repeat(100) }, 'content2');

        const stats = cache.getStats();
        expect(stats.totalSize).toBeGreaterThan(0);
        expect(stats.totalEntries).toBe(2);
      });

      it('should track oldest and newest entries', () => {
        cache.set('key1', { data: 1 }, 'content1');
        
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            cache.set('key2', { data: 2 }, 'content2');
            
            const stats = cache.getStats();
            expect(stats.newestEntry).toBeGreaterThan(stats.oldestEntry);
            resolve();
          }, 10);
        });
      });
    });

    describe('key generation', () => {
      it('should generate consistent keys for same content', () => {
        const content = 'test content';
        const key1 = cache.generateKey('prefix', content);
        const key2 = cache.generateKey('prefix', content);

        expect(key1).toBe(key2);
      });

      it('should generate different keys for different content', () => {
        const key1 = cache.generateKey('prefix', 'content1');
        const key2 = cache.generateKey('prefix', 'content2');

        expect(key1).not.toBe(key2);
      });

      it('should generate different keys for different prefixes', () => {
        const content = 'same content';
        const key1 = cache.generateKey('prefix1', content);
        const key2 = cache.generateKey('prefix2', content);

        expect(key1).not.toBe(key2);
      });
    });
  });

  describe('withCache', () => {
    it('should cache function results', () => {
      let callCount = 0;
      const analyzeFunc = (content: string) => {
        callCount++;
        return { score: content.length };
      };

      const cachedAnalyze = withCache(cache, 'test', analyzeFunc);

      // 第一次调用
      const result1 = cachedAnalyze('test content');
      expect(result1.fromCache).toBe(false);
      expect(result1.result.score).toBe(12);
      expect(callCount).toBe(1);

      // 第二次调用（应该从缓存获取）
      const result2 = cachedAnalyze('test content');
      expect(result2.fromCache).toBe(true);
      expect(result2.result.score).toBe(12);
      expect(callCount).toBe(1); // 没有增加
    });

    it('should re-analyze when content changes', () => {
      let callCount = 0;
      const analyzeFunc = (content: string) => {
        callCount++;
        return { score: content.length };
      };

      const cachedAnalyze = withCache(cache, 'test', analyzeFunc);

      cachedAnalyze('content1');
      cachedAnalyze('content2');

      expect(callCount).toBe(2);
    });

    it('should track analysis time', () => {
      const analyzeFunc = (content: string) => ({ score: 100 });
      const cachedAnalyze = withCache(cache, 'test', analyzeFunc);

      const result = cachedAnalyze('test');
      expect(result.analysisTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('global cache functions', () => {
    beforeEach(() => {
      clearAllCaches();
    });

    it('should clear all caches', () => {
      clearAllCaches();
      const stats = getAllCacheStats();

      Object.values(stats).forEach(stat => {
        expect(stat.totalEntries).toBe(0);
      });
    });

    it('should get all cache stats', () => {
      const stats = getAllCacheStats();

      expect(stats).toHaveProperty('comprehensive');
      expect(stats).toHaveProperty('style');
      expect(stats).toHaveProperty('tension');
      expect(stats).toHaveProperty('emotion');
    });

    it('should clean all expired caches', () => {
      const cleaned = cleanAllExpiredCaches();

      expect(cleaned).toHaveProperty('comprehensive');
      expect(cleaned).toHaveProperty('style');
      expect(cleaned).toHaveProperty('tension');
      expect(cleaned).toHaveProperty('emotion');
    });

    it('should generate cache report', () => {
      const report = generateCacheReport();

      expect(report).toContain('分析缓存报告');
      expect(report).toContain('comprehensive');
      expect(report).toContain('style');
      expect(report).toContain('tension');
      expect(report).toContain('emotion');
      expect(report).toContain('命中率');
    });
  });

  describe('edge cases', () => {
    it('should handle empty content', () => {
      const key = cache.generateKey('test', '');
      cache.set(key, { score: 0 }, '');

      const result = cache.get(key, '');
      expect(result).toEqual({ score: 0 });
    });

    it('should handle very long content', () => {
      const longContent = 'x'.repeat(10000);
      const key = cache.generateKey('test', longContent);
      cache.set(key, { score: 100 }, longContent);

      const result = cache.get(key, longContent);
      expect(result).toEqual({ score: 100 });
    });

    it('should handle special characters in content', () => {
      const specialContent = '特殊字符 !@#$%^&*() 中文测试';
      const key = cache.generateKey('test', specialContent);
      cache.set(key, { score: 100 }, specialContent);

      const result = cache.get(key, specialContent);
      expect(result).toEqual({ score: 100 });
    });

    it('should handle null/undefined data gracefully', () => {
      const key = cache.generateKey('test', 'content');
      cache.set(key, null, 'content');

      const result = cache.get(key, 'content');
      expect(result).toBeNull();
    });

    it('should handle concurrent access', () => {
      const content = 'test';
      const key = cache.generateKey('test', content);

      // 模拟并发访问
      cache.set(key, { score: 1 }, content);
      cache.get(key, content);
      cache.set(key, { score: 2 }, content);
      cache.get(key, content);

      const result = cache.get(key, content);
      expect(result).toEqual({ score: 2 });
    });
  });

  describe('memory management', () => {
    it('should estimate object size', () => {
      const smallData = { value: 1 };
      const largeData = { value: 'x'.repeat(1000) };

      cache.set('small', smallData, 'content1');
      cache.set('large', largeData, 'content2');

      const stats = cache.getStats();
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should respect max entries limit', () => {
      const limitedCache = new AnalysisCacheManager({
        maxEntries: 5,
        enablePersistence: false,
      });

      for (let i = 0; i < 10; i++) {
        limitedCache.set(`key${i}`, { data: i }, `content${i}`);
      }

      const stats = limitedCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(5);
    });

    it('should respect max size limit', () => {
      const limitedCache = new AnalysisCacheManager({
        maxSize: 5000,
        enablePersistence: false,
      });

      for (let i = 0; i < 10; i++) {
        const largeData = { content: 'x'.repeat(500) };
        limitedCache.set(`key${i}`, largeData, `content${i}`);
      }

      const stats = limitedCache.getStats();
      expect(stats.totalSize).toBeLessThanOrEqual(5000);
    });
  });
});
