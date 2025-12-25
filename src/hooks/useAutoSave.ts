/**
 * @fileoverview 自动保存 Hook
 * @module hooks/useAutoSave
 * @description 提供智能自动保存功能，支持定时保存、变化检测和页面关闭前保存
 * @version 1.0.0
 *
 * @features
 * - 定时自动保存（可配置间隔）
 * - 内容变化时防抖自动保存
 * - 保存状态实时反馈
 * - 页面关闭前强制保存
 * - 错误处理和重试
 *
 * @example
 * const { status, hasUnsavedChanges, save, setData } = useAutoSave({
 *   onSave: async (data) => {
 *     await api.saveDocument(data);
 *   },
 *   interval: 30000, // 30秒自动保存
 *   debounceMs: 2000  // 变化后2秒保存
 * });
 */

import { useState, useCallback, useRef, useEffect } from 'react';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions<T> {
  /** 保存函数 */
  onSave: (data: T) => Promise<void> | void;
  /** 自动保存间隔（毫秒），默认 30 秒 */
  interval?: number;
  /** 内容变化后延迟保存（毫秒），默认 2 秒 */
  debounceMs?: number;
  /** 是否启用自动保存，默认 true */
  enabled?: boolean;
  /** 页面关闭前是否保存，默认 true */
  saveOnUnload?: boolean;
  /** 保存成功提示持续时间（毫秒） */
  savedDuration?: number;
}

interface AutoSaveState {
  /** 当前保存状态 */
  status: AutoSaveStatus;
  /** 上次保存时间 */
  lastSavedAt: Date | null;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
  /** 错误信息 */
  error: string | null;
}

interface AutoSaveActions<T> {
  /** 标记数据已更改 */
  markChanged: (data: T) => void;
  /** 立即保存 */
  saveNow: () => Promise<void>;
  /** 重置状态 */
  reset: () => void;
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions<T>
): [AutoSaveState, AutoSaveActions<T>] {
  const {
    onSave,
    interval = 30000,
    debounceMs = 2000,
    enabled = true,
    saveOnUnload = true,
    savedDuration = 3000,
  } = options;

  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 保存当前数据的引用
  const dataRef = useRef<T>(data);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // 更新数据引用
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // 执行保存
  const doSave = useCallback(async () => {
    if (isSavingRef.current || !hasUnsavedChanges) return;

    isSavingRef.current = true;
    setStatus('saving');
    setError(null);

    try {
      await onSave(dataRef.current);
      setStatus('saved');
      setLastSavedAt(new Date());
      setHasUnsavedChanges(false);

      // 几秒后重置状态
      if (savedTimeoutRef.current) {
        clearTimeout(savedTimeoutRef.current);
      }
      savedTimeoutRef.current = setTimeout(() => {
        setStatus('idle');
      }, savedDuration);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, hasUnsavedChanges, savedDuration]);

  // 标记数据已更改
  const markChanged = useCallback((newData: T) => {
    dataRef.current = newData;
    setHasUnsavedChanges(true);

    if (!enabled) return;

    // 防抖保存
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      doSave();
    }, debounceMs);
  }, [enabled, debounceMs, doSave]);

  // 立即保存
  const saveNow = useCallback(async () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setHasUnsavedChanges(true);
    await doSave();
  }, [doSave]);

  // 重置状态
  const reset = useCallback(() => {
    setStatus('idle');
    setHasUnsavedChanges(false);
    setError(null);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // 定时自动保存
  useEffect(() => {
    if (!enabled || interval <= 0) return;

    intervalRef.current = setInterval(() => {
      if (hasUnsavedChanges) {
        doSave();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, interval, hasUnsavedChanges, doSave]);

  // 页面关闭前保存
  useEffect(() => {
    if (!saveOnUnload) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        // 同步保存（尽力而为）
        try {
          onSave(dataRef.current);
        } catch {
          // 忽略错误
        }

        // 显示确认对话框
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [saveOnUnload, hasUnsavedChanges, onSave]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  const state: AutoSaveState = {
    status,
    lastSavedAt,
    hasUnsavedChanges,
    error,
  };

  const actions: AutoSaveActions<T> = {
    markChanged,
    saveNow,
    reset,
  };

  return [state, actions];
}

export default useAutoSave;
