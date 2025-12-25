import { useEffect, useState, useCallback, useRef } from 'react';
import { storage, storageService } from '../services/storage/StorageService';

/**
 * 异步持久化状态 Hook
 * 使用 IndexedDB + 压缩 + 分片存储
 */
export function useAsyncPersistentState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void, boolean, boolean] {
  const [state, setState] = useState<T>(() => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const isFirstRender = useRef(true);
  const pendingSave = useRef<T | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化：从存储加载数据
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        // 确保存储服务初始化
        await storage.init();

        const defaultValue = typeof initialValue === 'function'
          ? (initialValue as () => T)()
          : initialValue;

        const storedValue = await storage.get<T>(key, defaultValue);

        if (mounted) {
          setState(storedValue);
          setIsLoading(false);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error(`加载 ${key} 失败:`, error);
        if (mounted) {
          setIsLoading(false);
          setIsInitialized(true);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [key]); // 只在 key 变化时重新加载

  // 保存数据（带防抖）
  const saveData = useCallback(async (value: T) => {
    try {
      await storage.set(key, value);
    } catch (error) {
      console.error(`保存 ${key} 失败:`, error);
    }
  }, [key]);

  // 状态变化时保存
  useEffect(() => {
    // 跳过首次渲染和未初始化状态
    if (isFirstRender.current || !isInitialized) {
      isFirstRender.current = false;
      return;
    }

    // 防抖保存：300ms 内的多次更新只执行最后一次
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    pendingSave.current = state;

    saveTimeoutRef.current = setTimeout(() => {
      if (pendingSave.current !== null) {
        saveData(pendingSave.current);
        pendingSave.current = null;
      }
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [state, isInitialized, saveData]);

  // 自定义 setState，支持函数式更新
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
 * 异步加载但同步使用
 */
export function usePersistentStateAsync<T>(
  key: string,
  initialValue: T | (() => T)
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useAsyncPersistentState(key, initialValue);
  return [state, setState];
}

/**
 * 存储事件 Hook
 * 监听存储容量警告等事件
 */
export function useStorageEvents(
  onWarning?: (message: string) => void,
  onCritical?: (message: string) => void,
  onError?: (message: string) => void
) {
  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    if (onWarning) {
      unsubscribers.push(
        storageService.on('warning', (event) => onWarning(event.message))
      );
    }

    if (onCritical) {
      unsubscribers.push(
        storageService.on('critical', (event) => onCritical(event.message))
      );
    }

    if (onError) {
      unsubscribers.push(
        storageService.on('error', (event) => onError(event.message))
      );
    }

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [onWarning, onCritical, onError]);
}

/**
 * 获取存储统计信息
 */
export function useStorageStats() {
  const [stats, setStats] = useState<{
    used: number;
    quota: number;
    percentage: number;
    isNearLimit: boolean;
    isCritical: boolean;
  } | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      const s = await storage.getStats();
      setStats(s);
    };
    loadStats();

    // 每分钟刷新一次
    const interval = setInterval(loadStats, 60000);
    return () => clearInterval(interval);
  }, []);

  return stats;
}

export default useAsyncPersistentState;
