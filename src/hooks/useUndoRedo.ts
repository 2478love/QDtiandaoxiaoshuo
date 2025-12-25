/**
 * 撤销/重做 Hook
 *
 * 提供通用的撤销重做功能，支持：
 * - 历史记录堆栈
 * - Ctrl+Z / Ctrl+Y 快捷键
 * - 可配置的历史记录大小
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface UndoRedoOptions {
  /** 最大历史记录数量 */
  maxHistory?: number;
  /** 防抖延迟（毫秒），避免频繁记录 */
  debounceMs?: number;
}

interface UndoRedoState<T> {
  /** 当前值 */
  value: T;
  /** 是否可以撤销 */
  canUndo: boolean;
  /** 是否可以重做 */
  canRedo: boolean;
  /** 历史记录数量 */
  historyLength: number;
}

interface UndoRedoActions<T> {
  /** 更新值（会记录到历史） */
  setValue: (value: T | ((prev: T) => T)) => void;
  /** 撤销 */
  undo: () => void;
  /** 重做 */
  redo: () => void;
  /** 清空历史 */
  clearHistory: () => void;
  /** 重置到指定值（清空历史） */
  reset: (value: T) => void;
}

export function useUndoRedo<T>(
  initialValue: T,
  options: UndoRedoOptions = {}
): [UndoRedoState<T>, UndoRedoActions<T>] {
  const { maxHistory = 50, debounceMs = 300 } = options;

  // 当前值
  const [current, setCurrent] = useState<T>(initialValue);

  // 历史记录（过去的状态）
  const [past, setPast] = useState<T[]>([]);

  // 未来记录（撤销后的状态）
  const [future, setFuture] = useState<T[]>([]);

  // 防抖定时器
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 上一次记录的值（用于防抖）
  const lastRecordedRef = useRef<T>(initialValue);

  // 是否正在执行撤销/重做
  const isUndoRedoRef = useRef(false);

  // 设置新值
  const setValue = useCallback((valueOrUpdater: T | ((prev: T) => T)) => {
    setCurrent(prev => {
      const newValue = typeof valueOrUpdater === 'function'
        ? (valueOrUpdater as (prev: T) => T)(prev)
        : valueOrUpdater;

      // 如果是撤销/重做操作触发的，不记录历史
      if (isUndoRedoRef.current) {
        return newValue;
      }

      // 防抖记录历史
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      debounceRef.current = setTimeout(() => {
        // 只有值真正改变时才记录
        if (JSON.stringify(newValue) !== JSON.stringify(lastRecordedRef.current)) {
          setPast(p => {
            const newPast = [...p, lastRecordedRef.current];
            // 限制历史记录大小
            return newPast.slice(-maxHistory);
          });
          // 新操作清空重做栈
          setFuture([]);
          lastRecordedRef.current = newValue;
        }
      }, debounceMs);

      return newValue;
    });
  }, [maxHistory, debounceMs]);

  // 撤销
  const undo = useCallback(() => {
    if (past.length === 0) return;

    isUndoRedoRef.current = true;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setPast(newPast);
    setFuture(f => [current, ...f]);
    setCurrent(previous);
    lastRecordedRef.current = previous;

    // 下一帧重置标志
    requestAnimationFrame(() => {
      isUndoRedoRef.current = false;
    });
  }, [past, current]);

  // 重做
  const redo = useCallback(() => {
    if (future.length === 0) return;

    isUndoRedoRef.current = true;

    const next = future[0];
    const newFuture = future.slice(1);

    setFuture(newFuture);
    setPast(p => [...p, current]);
    setCurrent(next);
    lastRecordedRef.current = next;

    // 下一帧重置标志
    requestAnimationFrame(() => {
      isUndoRedoRef.current = false;
    });
  }, [future, current]);

  // 清空历史
  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  // 重置
  const reset = useCallback((value: T) => {
    setCurrent(value);
    setPast([]);
    setFuture([]);
    lastRecordedRef.current = value;
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const state: UndoRedoState<T> = {
    value: current,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    historyLength: past.length,
  };

  const actions: UndoRedoActions<T> = {
    setValue,
    undo,
    redo,
    clearHistory,
    reset,
  };

  return [state, actions];
}

export default useUndoRedo;
