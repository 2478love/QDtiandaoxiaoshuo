/**
 * @fileoverview 防抖/节流 Hooks
 * @module hooks/useDebounce
 * @description 提供防抖和节流功能的 React Hooks，用于优化高频操作
 * @version 1.0.0
 *
 * @features
 * - useDebouncedValue: 值防抖，延迟更新
 * - useDebouncedCallback: 函数防抖
 * - useThrottledCallback: 函数节流
 * - useDebouncedState: 完整的防抖状态管理
 * - useDebouncedSearch: 搜索专用防抖
 * - useBatchedUpdates: 批量更新优化
 *
 * @example
 * // 防抖值
 * const debouncedSearch = useDebouncedValue(searchTerm, 300);
 *
 * // 防抖回调
 * const debouncedSubmit = useDebouncedCallback((data) => {
 *   api.submit(data);
 * }, 500);
 *
 * // 节流回调
 * const throttledScroll = useThrottledCallback(() => {
 *   updateScrollPosition();
 * }, 100);
 */

import { useState, useEffect, useRef, useCallback, useMemo, type DependencyList } from 'react';

/**
 * 防抖值 Hook
 * 在值停止变化指定时间后才更新
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 防抖回调 Hook
 * 返回一个防抖版本的函数
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: DependencyList = []
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay, ...deps]) as T;

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * 节流回调 Hook
 * 在指定时间间隔内最多执行一次
 */
export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300,
  deps: DependencyList = []
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);

  // 更新回调引用
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const throttledCallback = useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunRef.current;

    if (timeSinceLastRun >= delay) {
      lastRunRef.current = now;
      callbackRef.current(...args);
    } else {
      // 安排在延迟结束时执行
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        callbackRef.current(...args);
      }, delay - timeSinceLastRun);
    }
  }, [delay, ...deps]) as T;

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * 带立即执行选项的防抖 Hook
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setValueDebounced = useCallback((newValue: T) => {
    setValue(newValue);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(newValue);
    }, delay);
  }, [delay]);

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, debouncedValue, setValueDebounced];
}

/**
 * 防抖搜索 Hook
 * 专门用于搜索场景，带加载状态
 */
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay: number = 300
): {
  query: string;
  setQuery: (query: string) => void;
  results: T[];
  isLoading: boolean;
  error: Error | null;
} {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const debouncedQuery = useDebouncedValue(query, delay);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    searchFn(debouncedQuery)
      .then(data => {
        if (!cancelled) {
          setResults(data);
        }
      })
      .catch(err => {
        if (!cancelled) {
          setError(err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, searchFn]);

  return { query, setQuery, results, isLoading, error };
}

/**
 * 批量更新 Hook
 * 收集多次更新，批量处理
 */
export function useBatchedUpdates<T>(
  onBatch: (updates: T[]) => void,
  delay: number = 100
): (update: T) => void {
  const updatesRef = useRef<T[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onBatchRef = useRef(onBatch);

  useEffect(() => {
    onBatchRef.current = onBatch;
  }, [onBatch]);

  const addUpdate = useCallback((update: T) => {
    updatesRef.current.push(update);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (updatesRef.current.length > 0) {
        onBatchRef.current([...updatesRef.current]);
        updatesRef.current = [];
      }
    }, delay);
  }, [delay]);

  // 清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return addUpdate;
}

export default {
  useDebouncedValue,
  useDebouncedCallback,
  useThrottledCallback,
  useDebouncedState,
  useDebouncedSearch,
  useBatchedUpdates,
};
