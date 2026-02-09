/**
 * 分析缓存管理器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisCache, globalAnalysisCache, withCache } from './analysisCache';

describe('AnalysisCache', () => {
  let cache: AnalysisCache<any>;

  beforeEach(() => {
    cache = new AnalysisCache({
      maxSize: 1024 * 1024, // 1MB
      maxEntries: 10,
      ttl: 1000, // 1秒
      persistent: false,
    });
  });

  describe('基本操作', () => {
    it('应该能设置和获取缓存', () => {
      const text = '测试文本';
      const type = 'test';
      const value = { result: 'test result' };

      cache.set(text, type, value);
      const cached = cache.get(text, type);

      expect(cached).toEqual(value);
    });

    it('应该在缓存不存在时返回 null', () => {
      const cached = cache.get('不存在的文本', 'test');
      expect(cached).toBeNull();
    });

    it('应该能检查缓存是否存在', () => {
      const text = '测试文本';
      const type = 'test';

      expect(cache.has(text, type)).toBe(false);

      cache.set(text, type, { result: 'test' });

      expect(cache.has(text, type)).toBe(true);
    });

    it('应该能删除缓存', () => {
      const text = '测试文本';
      const type = 'test';

      cache.set(text, type, { result: 'test' });
      expect(cache.has(text, type)).toBe(true);

      const deleted = cache.delete(text, type);
      expect(deleted).toBe(true);
      expect(cache.has(text, type)).toBe(false);
    });

    it('应该能清空所有缓存', () => {
      cache.set('文本1', 'test', { result: '1' });
      cache.set('文本2', 'test', { result: '2' });

      expect(cache.getStats().totalEntries).toBe(2);

      cache.clear();

      expect(cache.getStats().totalEntries).toBe(0);
    });
  });

  describe('LRU 策略', () => {
    it('应该在达到最大条目数时驱逐最少使用的条目', () => {
      const smallCache = new AnalysisCache({
        maxEntries: 3,
        persistent: false,
      });

      smallCache.set('文本1', 'test', { result: '1' });
      smallCache.set('文本2', 'test', { result: '2' });
      smallCache.set('文本3', 'test', { result: '3' });

      expect(smallCache.getStats().totalEntries).toBe(3);

      // 添加第4个条目，应该驱逐最早的
      smallCache.set('文本4', 'test', { result: '4' });

      expect(smallCache.getStats().totalEntries).toBe(3);
      expect(smallCache.has('文本1', 'test')).toBe(false);
      expect(smallCache.has('文本4', 'test')).toBe(true);
    });

    it('应该更新访问顺序', () => {
      const smallCache = new AnalysisCache({
        maxEntries: 3,
        persistent: false,
      });

      smallCache.set('文本1', 'test', { result: '1' });
      smallCache.set('文本2', 'test', { result: '2' });
      smallCache.set('文本3', 'test', { result: '3' });

      // 访问文本1，使其成为最近使用
      smallCache.get('文本1', 'test');

      // 添加新条目，应该驱逐文本2
      smallCache.set('文本4', 'test', { result: '4' });

      expect(smallCache.has('文本1', 'test')).toBe(true);
      expect(smallCache.has('文本2', 'test')).toBe(false);
      expect(smallCache.has('文本3', 'test')).toBe(true);
      expect(smallCache.has('文本4', 'test')).toBe(true);
    });
  });

  describe('统计信息', () => {
    it('应该正确统计命中和未命中', () => {
      cache.set('文本1', 'test', { result: '1' });

      cache.get('文本1', 'test'); // 命中
      cache.get('文本2', 'test'); // 未命中

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(0.5);
    });

    it('应该统计缓存大小', () => {
      cache.set('文本1', 'test', { result: '1' });

      const stats = cache.getStats();

      expect(stats.totalEntries).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('应该统计驱逐次数', () => {
      const smallCache = new AnalysisCache({
        maxEntries: 2,
        persistent: false,
      });

      smallCache.set('文本1', 'test', { result: '1' });
      smallCache.set('文本2', 'test', { result: '2' });
      smallCache.set('文本3', 'test', { result: '3' });

      const stats = smallCache.getStats();

      expect(stats.evictions).toBe(1);
    });
  });

  describe('TTL 过期', () => {
    it('应该在 TTL 过期后返回 null', async () => {
      const shortCache = new AnalysisCache({
        ttl: 100, // 100ms
        persistent: false,
      });

      shortCache.set('文本1', 'test', { result: '1' });

      expect(shortCache.get('文本1', 'test')).not.toBeNull();

      // 等待过期
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCache.get('文本1', 'test')).toBeNull();
    });

    it('应该在检查时清理过期条目', async () => {
      const shortCache = new AnalysisCache({
        ttl: 100,
        persistent: false,
      });

      shortCache.set('文本1', 'test', { result: '1' });

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(shortCache.has('文本1', 'test')).toBe(false);
    });
  });

  describe('辅助方法', () => {
    it('应该能获取缓存条目列表', () => {
      cache.set('文本1', 'test', { result: '1' });
      cache.set('文本2', 'test', { result: '2' });

      const entries = cache.getEntries();

      expect(entries.length).toBe(2);
      expect(entries[0].value).toBeDefined();
    });

    it('应该能获取最常访问的条目', () => {
      cache.set('文本1', 'test', { result: '1' });
      cache.set('文本2', 'test', { result: '2' });
      cache.set('文本3', 'test', { result: '3' });

      // 多次访问文本2
      cache.get('文本2', 'test');
      cache.get('文本2', 'test');
      cache.get('文本2', 'test');

      const topEntries = cache.getTopEntries(1);

      expect(topEntries.length).toBe(1);
      expect(topEntries[0].value).toEqual({ result: '2' });
    });

    it('应该能预热缓存', () => {
      const items = [
        { text: '文本1', type: 'test', value: { result: '1' } },
        { text: '文本2', type: 'test', value: { result: '2' } },
      ];

      cache.warmup(items);

      expect(cache.getStats().totalEntries).toBe(2);
      expect(cache.has('文本1', 'test')).toBe(true);
      expect(cache.has('文本2', 'test')).toBe(true);
    });

    it('应该能获取缓存大小（MB）', () => {
      cache.set('文本1', 'test', { result: '1' });

      const sizeMB = cache.getSizeMB();

      expect(sizeMB).toBeGreaterThan(0);
      expect(sizeMB).toBeLessThan(1);
    });
  });

  describe('withCache 包装器', () => {
    it('应该缓存函数结果', () => {
      let callCount = 0;

      const expensiveFunction = (text: string) => {
        callCount++;
        return { result: text.toUpperCase() };
      };

      const cachedFunction = withCache(expensiveFunction, 'uppercase');

      // 第一次调用
      const result1 = cachedFunction('hello');
      expect(result1).toEqual({ result: 'HELLO' });
      expect(callCount).toBe(1);

      // 第二次调用，应该从缓存获取
      const result2 = cachedFunction('hello');
      expect(result2).toEqual({ result: 'HELLO' });
      expect(callCount).toBe(1); // 没有增加

      // 不同参数，应该重新计算
      const result3 = cachedFunction('world');
      expect(result3).toEqual({ result: 'WORLD' });
      expect(callCount).toBe(2);
    });
  });

  describe('全局缓存实例', () => {
    it('应该存在全局缓存实例', () => {
      expect(globalAnalysisCache).toBeDefined();
      expect(globalAnalysisCache instanceof AnalysisCache).toBe(true);
    });
  });
});
