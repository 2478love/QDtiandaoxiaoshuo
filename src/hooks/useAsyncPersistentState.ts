import { useEffect, useState, useCallback, useRef } from 'react';

/**
 * 从 localStorage 读取数据
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      return JSON.parse(stored) as T;
    }
  } catch (error) {
    console.warn(`[Storage] 读取 ${key} 失败:`, error);
  }
  return defaultValue;
}

/**
 * 保存数据到 localStorage
 */
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Storage] 保存 ${key} 失败:`, error);
  }
}

/**
 * 异步持久化状态 Hook（简化版，使用 localStorage）
 */
export function useAsyncPersistentState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void, boolean, boolean] {
  const getDefaultValue = useCallback((): T => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, [initialValue]);

  const [state, setState] = useState<T>(() => {
    return loadFromStorage(key, getDefaultValue());
  });

  const [isLoading] = useState(false); // localStorage 是同步的
  const [isInitialized] = useState(true);
  const isFirstRender = useRef(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 状态变化时保存
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // 防抖保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      saveToStorage(key, state);
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, key]);

  // 自定义 setState
  const setStateWrapper = useCallback((value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function'
        ? (value as (prev: T) => T)(prev)
        : value;
      return newValue;
    });
  }, []);

  return [state, setStateWrapper, isLoading, isInitialized];
}

/**
 * 简化版 Hook - 与原 usePersistentState 兼容
 */
export function usePersistentStateAsync<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useAsyncPersistentState(key, initialValue);
  return [state, setState];
}

/**
 * 存储事件 Hook（简化版，不再需要事件监听）
 */
export function useStorageEvents(
  _onWarning?: (message: string) => void,
  _onCritical?: (message: string) => void,
  _onError?: (message: string) => void
) {
  // localStorage 没有事件系统，这里保留接口但不做任何事
}

/**
 * 获取存储统计信息
 */
export function useStorageStats() {
  const [stats] = useState<{
    used: number;
    quota: number;
    percentage: number;
    isNearLimit: boolean;
    isCritical: boolean;
  } | null>(() => {
    // 简单估算 localStorage 使用量
    try {
      let totalSize = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          totalSize += (localStorage.getItem(key) || '').length * 2; // UTF-16
        }
      }
      const quota = 5 * 1024 * 1024; // 假设 5MB
      const percentage = totalSize / quota;
      return {
        used: totalSize,
        quota,
        percentage,
        isNearLimit: percentage >= 0.8,
        isCritical: percentage >= 0.95
      };
    } catch {
      return null;
    }
  });

  return stats;
}

export default useAsyncPersistentState;
