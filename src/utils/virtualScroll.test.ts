import { describe, it, expect, vi } from 'vitest';
import {
  calculateVirtualScrollState,
  getVisibleIndices,
  calculateTotalHeight,
  isIndexVisible,
  shouldRenderIndex,
  scrollToIndex,
  getIndexAtPosition,
  VirtualScrollManager,
  createVirtualScrollManager,
  throttleScroll,
  DynamicVirtualScrollManager,
  type VirtualScrollConfig,
} from './virtualScroll';

describe('virtualScroll', () => {
  const defaultConfig: VirtualScrollConfig = {
    containerHeight: 600,
    itemHeight: 100,
    bufferSize: 3,
    totalItems: 100,
  };

  describe('calculateVirtualScrollState', () => {
    it('should calculate state at scroll position 0', () => {
      const state = calculateVirtualScrollState(defaultConfig, 0);
      
      expect(state.scrollTop).toBe(0);
      expect(state.startIndex).toBe(0);
      expect(state.visibleCount).toBe(6); // 600 / 100
      expect(state.renderStartIndex).toBe(0);
      expect(state.renderEndIndex).toBe(9); // 6 + 3 buffer
      expect(state.offsetY).toBe(0);
    });

    it('should calculate state at middle scroll position', () => {
      const state = calculateVirtualScrollState(defaultConfig, 500);
      
      expect(state.scrollTop).toBe(500);
      expect(state.startIndex).toBe(5);
      expect(state.renderStartIndex).toBe(2); // 5 - 3 buffer
      expect(state.renderEndIndex).toBe(14); // 11 + 3 buffer
    });

    it('should handle scroll near end', () => {
      const state = calculateVirtualScrollState(defaultConfig, 9000);
      
      expect(state.startIndex).toBe(90);
      expect(state.endIndex).toBe(96);
      expect(state.renderEndIndex).toBeLessThanOrEqual(100); // capped at totalItems
      expect(state.renderEndIndex).toBeGreaterThan(96); // should include buffer
    });

    it('should respect buffer size', () => {
      const config = { ...defaultConfig, bufferSize: 5 };
      const state = calculateVirtualScrollState(config, 500);
      
      expect(state.renderStartIndex).toBe(0); // 5 - 5 buffer, capped at 0
      expect(state.renderEndIndex).toBe(16); // 11 + 5 buffer
    });
  });

  describe('getVisibleIndices', () => {
    it('should return array of visible indices', () => {
      const state = calculateVirtualScrollState(defaultConfig, 0);
      const indices = getVisibleIndices(state);
      
      expect(indices).toHaveLength(9); // 0-8
      expect(indices[0]).toBe(0);
      expect(indices[8]).toBe(8);
    });

    it('should return correct indices for middle position', () => {
      const state = calculateVirtualScrollState(defaultConfig, 500);
      const indices = getVisibleIndices(state);
      
      expect(indices[0]).toBe(2);
      expect(indices[indices.length - 1]).toBe(13);
    });
  });

  describe('calculateTotalHeight', () => {
    it('should calculate total height', () => {
      const height = calculateTotalHeight(100, 100);
      expect(height).toBe(10000);
    });

    it('should handle zero items', () => {
      const height = calculateTotalHeight(0, 100);
      expect(height).toBe(0);
    });
  });

  describe('isIndexVisible', () => {
    it('should return true for visible index', () => {
      const state = calculateVirtualScrollState(defaultConfig, 0);
      expect(isIndexVisible(3, state)).toBe(true);
    });

    it('should return false for non-visible index', () => {
      const state = calculateVirtualScrollState(defaultConfig, 0);
      expect(isIndexVisible(10, state)).toBe(false);
    });
  });

  describe('shouldRenderIndex', () => {
    it('should return true for index in render range', () => {
      const state = calculateVirtualScrollState(defaultConfig, 0);
      expect(shouldRenderIndex(8, state)).toBe(true);
    });

    it('should return false for index outside render range', () => {
      const state = calculateVirtualScrollState(defaultConfig, 0);
      expect(shouldRenderIndex(20, state)).toBe(false);
    });
  });

  describe('scrollToIndex', () => {
    it('should scroll to start of index', () => {
      const scrollTop = scrollToIndex(10, defaultConfig, 'start');
      expect(scrollTop).toBe(1000); // 10 * 100
    });

    it('should scroll to center of index', () => {
      const scrollTop = scrollToIndex(10, defaultConfig, 'center');
      expect(scrollTop).toBe(750); // 1000 - 300 + 50
    });

    it('should scroll to end of index', () => {
      const scrollTop = scrollToIndex(10, defaultConfig, 'end');
      expect(scrollTop).toBe(500); // 1000 - 600 + 100
    });

    it('should clamp to valid range', () => {
      const scrollTop = scrollToIndex(0, defaultConfig, 'center');
      expect(scrollTop).toBeGreaterThanOrEqual(0);
    });

    it('should handle last item', () => {
      const scrollTop = scrollToIndex(99, defaultConfig, 'start');
      const maxScroll = 100 * 100 - 600;
      expect(scrollTop).toBeLessThanOrEqual(maxScroll);
    });
  });

  describe('getIndexAtPosition', () => {
    it('should get index at position', () => {
      expect(getIndexAtPosition(0, 100)).toBe(0);
      expect(getIndexAtPosition(500, 100)).toBe(5);
      expect(getIndexAtPosition(999, 100)).toBe(9);
    });
  });

  describe('VirtualScrollManager', () => {
    it('should create manager with initial state', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const state = manager.getState();
      
      expect(state.scrollTop).toBe(0);
      expect(state.startIndex).toBe(0);
    });

    it('should update scroll position', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      manager.updateScrollTop(500);
      
      const state = manager.getState();
      expect(state.scrollTop).toBe(500);
      expect(state.startIndex).toBe(5);
    });

    it('should notify listeners on state change', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const listener = vi.fn();
      
      manager.subscribe(listener);
      manager.updateScrollTop(500);
      
      expect(listener).toHaveBeenCalled();
    });

    it('should not notify if state unchanged', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const listener = vi.fn();
      
      manager.subscribe(listener);
      manager.updateScrollTop(10); // Small scroll, same render range
      
      // Should not be called if render range didn't change
      expect(listener).toHaveBeenCalledTimes(0);
    });

    it('should unsubscribe listener', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const listener = vi.fn();
      
      const unsubscribe = manager.subscribe(listener);
      unsubscribe();
      
      manager.updateScrollTop(500);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should update config', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      manager.updateConfig({ totalItems: 200 });
      
      expect(manager.getTotalHeight()).toBe(20000);
    });

    it('should scroll to index', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const scrollTop = manager.scrollToIndex(10);
      
      expect(scrollTop).toBe(1000);
      expect(manager.getState().scrollTop).toBe(1000);
    });

    it('should get visible indices', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const indices = manager.getVisibleIndices();
      
      expect(indices).toHaveLength(9);
    });

    it('should check if index is visible', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      
      expect(manager.isIndexVisible(3)).toBe(true);
      expect(manager.isIndexVisible(20)).toBe(false);
    });

    it('should check if index should render', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      
      expect(manager.shouldRenderIndex(8)).toBe(true);
      expect(manager.shouldRenderIndex(20)).toBe(false);
    });

    it('should destroy manager', () => {
      const manager = new VirtualScrollManager(defaultConfig);
      const listener = vi.fn();
      
      manager.subscribe(listener);
      manager.destroy();
      manager.updateScrollTop(500);
      
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('createVirtualScrollManager', () => {
    it('should create manager instance', () => {
      const manager = createVirtualScrollManager(defaultConfig);
      expect(manager).toBeInstanceOf(VirtualScrollManager);
    });
  });

  describe('throttleScroll', () => {
    it('should throttle scroll updates', async () => {
      const callback = vi.fn();
      const throttled = throttleScroll(callback, 50);
      
      throttled(100);
      throttled(200);
      throttled(300);
      
      expect(callback).not.toHaveBeenCalled();
      
      await new Promise(resolve => setTimeout(resolve, 60));
      
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(300);
    });
  });

  describe('DynamicVirtualScrollManager', () => {
    it('should create dynamic manager', () => {
      const manager = new DynamicVirtualScrollManager(100, 600, 100);
      expect(manager.getTotalHeight()).toBe(10000);
    });

    it('should set and get item height', () => {
      const manager = new DynamicVirtualScrollManager(100, 600, 100);
      manager.setItemHeight(5, 200);
      
      expect(manager.getItemHeight(5)).toBe(200);
      expect(manager.getItemHeight(6)).toBe(100); // default
    });

    it('should calculate item offset', () => {
      const manager = new DynamicVirtualScrollManager(100, 600, 100);
      manager.setItemHeight(0, 150);
      manager.setItemHeight(1, 200);
      
      expect(manager.getItemOffset(0)).toBe(0);
      expect(manager.getItemOffset(1)).toBe(150);
      expect(manager.getItemOffset(2)).toBe(350); // 150 + 200
    });

    it('should get visible items', () => {
      const manager = new DynamicVirtualScrollManager(100, 600, 100);
      const items = manager.getVisibleItems(0);
      
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].index).toBe(0);
      expect(items[0].offset).toBe(0);
    });

    it('should handle dynamic heights in visible items', () => {
      const manager = new DynamicVirtualScrollManager(100, 600, 100);
      manager.setItemHeight(0, 200);
      manager.setItemHeight(1, 150);
      
      const items = manager.getVisibleItems(0);
      
      expect(items[0].height).toBe(200);
      expect(items[1].height).toBe(150);
    });

    it('should calculate total height with dynamic heights', () => {
      const manager = new DynamicVirtualScrollManager(10, 600, 100);
      manager.setItemHeight(0, 200);
      manager.setItemHeight(1, 150);
      
      const total = manager.getTotalHeight();
      expect(total).toBe(1150); // 200 + 150 + 8*100
    });
  });
});
