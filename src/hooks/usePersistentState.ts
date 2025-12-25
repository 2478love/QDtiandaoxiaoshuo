/**
 * @fileoverview 持久化状态 Hook
 * @module hooks/usePersistentState
 * @description 提供带自动持久化功能的 React 状态 Hook，支持 IndexedDB + localStorage 双层存储
 * @version 1.0.0
 *
 * @features
 * - IndexedDB 主存储 + localStorage 快速加载
 * - 智能防抖批量保存
 * - 页面卸载时使用 sendBeacon 可靠保存
 * - 深度比较避免重复保存
 * - 存储配额监控
 *
 * @example
 * // 基础用法
 * const [value, setValue] = usePersistentState('my-key', 'default');
 *
 * // 带加载状态
 * const [value, setValue, isLoading] = usePersistentStateWithLoading('my-key', {});
 *
 * // 自定义选项
 * const [value, setValue] = usePersistentState('my-key', [], {
 *   debounceMs: 1000,
 *   saveOnUnload: true,
 *   deepCompare: true
 * });
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { storage } from '../services/storage/StorageService';

/**
 * 持久化状态配置选项
 */
interface PersistentStateOptions {
  /** 防抖延迟(ms)，默认 500ms */
  debounceMs?: number;
  /** 是否在页面卸载时立即保存，默认 true */
  saveOnUnload?: boolean;
  /** 最大保存间隔(ms)，防止长时间不保存，默认 5000ms */
  maxSaveInterval?: number;
  /** 是否启用深度比较避免重复保存，默认 true */
  deepCompare?: boolean;
}

// 全局待保存队列，用于批量处理
const pendingSaves = new Map<string, { value: unknown; timestamp: number }>();
let flushTimeout: ReturnType<typeof setTimeout> | null = null;

// sendBeacon 端点（用于页面卸载时的紧急保存）
// 注意：这是一个前端专用的 fallback，实际保存到 localStorage
const BEACON_ENDPOINT = '/__beacon_save__';

/**
 * 使用 sendBeacon 保存数据（页面卸载时）
 *
 * sendBeacon 是专门为页面卸载场景设计的 API，
 * 比 beforeunload 中的同步操作更可靠
 */
function saveWithBeacon(data: Map<string, { value: unknown; timestamp: number }>): boolean {
  if (data.size === 0) return true;

  // 先尝试同步保存到 localStorage 作为紧急备份
  data.forEach((item, key) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(item.value));
    } catch {
      // 忽略错误，继续处理其他数据
    }
  });

  // 如果支持 sendBeacon，尝试使用它（通常用于发送到服务器）
  // 在纯前端场景，我们主要依赖 localStorage
  if (navigator.sendBeacon) {
    try {
      // 创建一个小的标记数据，表示有数据需要同步
      // 实际数据已保存到 localStorage
      const payload = JSON.stringify({
        type: 'sync_marker',
        keys: Array.from(data.keys()),
        timestamp: Date.now(),
      });

      const blob = new Blob([payload], { type: 'application/json' });

      // 尝试发送 beacon（如果有服务端支持）
      // 这里使用相对路径，实际部署时可以配置
      navigator.sendBeacon(BEACON_ENDPOINT, blob);
    } catch {
      // sendBeacon 失败不影响 localStorage 保存
    }
  }

  return true;
}

/**
 * 批量保存处理器
 */
const flushPendingSaves = async (): Promise<void> => {
  if (pendingSaves.size === 0) return;

  const saves = Array.from(pendingSaves.entries());
  pendingSaves.clear();

  // 并行执行所有保存操作
  await Promise.allSettled(
    saves.map(async ([key, { value }]) => {
      try {
        await storage.set(key, value);
      } catch (error) {
        console.error(`[PersistentState] 批量保存 ${key} 失败:`, error);
        // 降级保存到 localStorage
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (lsError) {
          console.error(`[PersistentState] 降级保存到 localStorage 也失败:`, lsError);
        }
      }
    })
  );
};

// 页面卸载时强制保存
if (typeof window !== 'undefined') {
  // 使用 pagehide 事件（比 beforeunload 更可靠）
  window.addEventListener('pagehide', (event) => {
    if (pendingSaves.size > 0) {
      // 使用 sendBeacon 进行可靠保存
      saveWithBeacon(pendingSaves);

      // 如果页面可能被缓存（bfcache），清除待保存队列
      if (!event.persisted) {
        pendingSaves.clear();
      }
    }
  });

  // beforeunload 作为兼容性回退
  window.addEventListener('beforeunload', () => {
    if (pendingSaves.size > 0) {
      // 同步保存到 localStorage 作为紧急备份
      pendingSaves.forEach((data, key) => {
        try {
          window.localStorage.setItem(key, JSON.stringify(data.value));
        } catch {
          // 忽略错误
        }
      });
    }
  });

  // 页面可见性变化时保存
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      // 页面隐藏时立即保存
      if (pendingSaves.size > 0) {
        saveWithBeacon(pendingSaves);
      }
      flushPendingSaves();
    }
  });

  // 定期检查并保存（防止数据积压）
  setInterval(() => {
    if (pendingSaves.size > 0) {
      const now = Date.now();
      // 检查是否有超过 10 秒未保存的数据
      let hasOldData = false;
      pendingSaves.forEach((data) => {
        if (now - data.timestamp > 10000) {
          hasOldData = true;
        }
      });
      if (hasOldData) {
        flushPendingSaves();
      }
    }
  }, 5000);
}

/**
 * 深度比较两个值是否相等
 *
 * 优化策略：
 * 1. 快速路径：引用相等、类型不同、null 检查
 * 2. 简单对象使用 JSON.stringify (对小对象更快)
 * 3. 深度限制防止栈溢出
 * 4. 数组长度优先检查
 * 5. 缓存 Object.keys 结果
 */
const MAX_DEPTH = 15;
const SIMPLE_OBJECT_THRESHOLD = 10; // 键数量阈值，小于此值使用 JSON 比较

function deepEqual(a: unknown, b: unknown, depth = 0): boolean {
  // 快速路径：引用相等
  if (a === b) return true;

  // 快速路径：类型不同
  if (typeof a !== typeof b) return false;

  // 快速路径：null 检查
  if (a === null || b === null) return a === b;

  // 非对象类型已经在上面处理了（引用相等或类型不同）
  if (typeof a !== 'object') return false;

  // 深度限制：防止栈溢出，超过限制使用 JSON 比较
  if (depth >= MAX_DEPTH) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  }

  // 数组比较
  const aIsArray = Array.isArray(a);
  const bIsArray = Array.isArray(b);

  if (aIsArray !== bIsArray) return false;

  if (aIsArray && bIsArray) {
    if (a.length !== b.length) return false;
    // 使用 for 循环替代 every，更快
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], depth + 1)) return false;
    }
    return true;
  }

  // 对象比较
  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;

  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  // 小对象使用 JSON 比较（通常更快）
  if (aKeys.length <= SIMPLE_OBJECT_THRESHOLD && depth === 0) {
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      // JSON 序列化失败，降级到递归比较
    }
  }

  // 递归比较每个键
  for (let i = 0; i < aKeys.length; i++) {
    const key = aKeys[i];
    if (!Object.prototype.hasOwnProperty.call(bObj, key)) return false;
    if (!deepEqual(aObj[key], bObj[key], depth + 1)) return false;
  }

  return true;
}

/**
 * 检查存储配额
 */
async function checkStorageQuota(): Promise<{ usage: number; quota: number; percentUsed: number } | null> {
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentUsed: ((estimate.usage || 0) / (estimate.quota || 1)) * 100,
      };
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * 持久化状态 Hook
 *
 * 升级版：使用 IndexedDB + 压缩 + 分片存储 + 智能防抖 + sendBeacon
 * 保持与原版 API 兼容
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T),
  options: PersistentStateOptions = {}
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const {
    debounceMs = 500,
    saveOnUnload = true,
    maxSaveInterval = 5000,
    deepCompare = true,
  } = options;

  // 计算初始值
  const getDefaultValue = useCallback(() => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, []);

  // 尝试从 localStorage 同步读取（用于初始渲染，兼容性考虑）
  const getInitialState = (): T => {
    if (typeof window === 'undefined') {
      return getDefaultValue();
    }

    // 先尝试从 localStorage 读取（快速同步加载）
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as T;
      }
    } catch (error) {
      console.warn(`[PersistentState] 从 localStorage 读取 ${key} 失败:`, error);
    }

    return getDefaultValue();
  };

  const [state, setState] = useState<T>(getInitialState);
  const isFirstRender = useRef(true);
  const isAsyncLoaded = useRef(false);
  const lastSavedRef = useRef<T | null>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxIntervalTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 异步从 IndexedDB 加载数据（可能覆盖 localStorage 的值）
  useEffect(() => {
    let mounted = true;

    const loadFromIndexedDB = async () => {
      try {
        await storage.init();
        const storedValue = await storage.get<T>(key, getDefaultValue());

        if (mounted && !isAsyncLoaded.current) {
          isAsyncLoaded.current = true;
          setState(storedValue);
          lastSavedRef.current = storedValue;
        }
      } catch (error) {
        console.warn(`[PersistentState] 从 IndexedDB 加载 ${key} 失败:`, error);
      }
    };

    loadFromIndexedDB();

    return () => {
      mounted = false;
    };
  }, [key, getDefaultValue]);

  // 执行保存操作
  const performSave = useCallback(async (value: T) => {
    // 检查是否需要保存（深度比较）
    if (deepCompare && lastSavedRef.current !== null && deepEqual(lastSavedRef.current, value)) {
      return;
    }

    // 检查存储配额
    const quota = await checkStorageQuota();
    if (quota && quota.percentUsed > 90) {
      console.warn(`[PersistentState] 存储空间使用率已达 ${quota.percentUsed.toFixed(1)}%`);
    }

    // 添加到待保存队列
    pendingSaves.set(key, { value, timestamp: Date.now() });
    lastSavedRef.current = value;
    lastSaveTimeRef.current = Date.now();

    // 取消之前的刷新计划
    if (flushTimeout) {
      clearTimeout(flushTimeout);
    }

    // 延迟批量刷新
    flushTimeout = setTimeout(flushPendingSaves, 100);
  }, [key, deepCompare]);

  // 状态变化时保存到存储
  useEffect(() => {
    // 跳过首次渲染
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 防抖保存
    saveTimeoutRef.current = setTimeout(() => {
      performSave(state);
    }, debounceMs);

    // 设置最大保存间隔，确保不会太久不保存
    if (!maxIntervalTimeoutRef.current) {
      maxIntervalTimeoutRef.current = setTimeout(() => {
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current);
          saveTimeoutRef.current = null;
        }
        performSave(state);
        maxIntervalTimeoutRef.current = null;
      }, maxSaveInterval);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [key, state, debounceMs, maxSaveInterval, performSave]);

  // 组件卸载时保存
  useEffect(() => {
    return () => {
      if (saveOnUnload && !isFirstRender.current) {
        // 立即添加到保存队列
        pendingSaves.set(key, { value: state, timestamp: Date.now() });
        // 触发保存
        flushPendingSaves();
      }

      if (maxIntervalTimeoutRef.current) {
        clearTimeout(maxIntervalTimeoutRef.current);
      }
    };
  }, [key, state, saveOnUnload]);

  return [state, setState] as const;
}

/**
 * 带加载状态的持久化 Hook
 */
export function usePersistentStateWithLoading<T>(
  key: string,
  initialValue: T | (() => T),
  options?: PersistentStateOptions
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [state, setState] = usePersistentState(key, initialValue, options);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkLoaded = async () => {
      await storage.init();
      setIsLoading(false);
    };
    checkLoaded();
  }, []);

  return [state, setState, isLoading];
}

/**
 * 强制立即保存所有待保存数据
 */
export async function forceSaveAll(): Promise<void> {
  await flushPendingSaves();
}

/**
 * 获取待保存数据数量
 */
export function getPendingSaveCount(): number {
  return pendingSaves.size;
}

export default usePersistentState;
