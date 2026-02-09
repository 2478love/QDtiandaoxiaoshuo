import { useState, useEffect, useCallback, useRef } from 'react';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface AutoSaveOptions {
  delay?: number; // 自动保存延迟（毫秒）
  maxRetries?: number; // 最大重试次数
  retryDelay?: number; // 重试延迟（毫秒）
  onSaveSuccess?: () => void;
  onSaveError?: (error: Error) => void;
}

export interface AutoSaveState {
  status: SaveStatus;
  lastSaveTime: Date | null;
  error: Error | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export function useAutoSaveWithStatus<T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  options: AutoSaveOptions = {}
) {
  const {
    delay = 3000,
    maxRetries = 3,
    retryDelay = 2000,
    onSaveSuccess,
    onSaveError
  } = options;

  const [status, setStatus] = useState<SaveStatus>('saved');
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T>(data);
  const isSavingRef = useRef(false);

  // 执行保存
  const performSave = useCallback(async (dataToSave: T) => {
    if (isSavingRef.current) return;

    isSavingRef.current = true;
    setStatus('saving');
    setError(null);

    try {
      // 尝试在线保存
      await onSave(dataToSave);
      
      setStatus('saved');
      setLastSaveTime(new Date());
      setRetryCount(0);
      lastDataRef.current = dataToSave;
      
      onSaveSuccess?.();
    } catch (err) {
      const error = err instanceof Error ? err : new Error('保存失败');
      setError(error);
      setStatus('error');
      
      onSaveError?.(error);

      // 自动重试
      if (retryCount < maxRetries) {
        console.log(`保存失败，${retryDelay / 1000}秒后重试 (${retryCount + 1}/${maxRetries})`);
        
        retryTimerRef.current = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          isSavingRef.current = false;
          performSave(dataToSave);
        }, retryDelay * (retryCount + 1)); // 递增延迟
      } else {
        console.error('保存失败，已达到最大重试次数');
        // 保存到本地存储作为备份
        try {
          localStorage.setItem('unsaved_backup', JSON.stringify({
            data: dataToSave,
            timestamp: new Date().toISOString()
          }));
          console.log('数据已保存到本地备份');
        } catch (localError) {
          console.error('本地备份也失败了:', localError);
        }
      }
    } finally {
      isSavingRef.current = false;
    }
  }, [onSave, retryCount, maxRetries, retryDelay, onSaveSuccess, onSaveError]);

  // 手动保存
  const save = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    performSave(data);
  }, [data, performSave]);

  // 手动重试
  const retry = useCallback(() => {
    setRetryCount(0);
    save();
  }, [save]);

  // 检查是否有未保存的更改
  const hasUnsavedChanges = useCallback(() => {
    return JSON.stringify(data) !== JSON.stringify(lastDataRef.current);
  }, [data]);

  // 数据变化时自动保存
  useEffect(() => {
    // 清除之前的定时器
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    // 检查是否有变化
    if (hasUnsavedChanges() && !isSavingRef.current) {
      setStatus('unsaved');
      
      // 设置新的定时器
      saveTimerRef.current = setTimeout(() => {
        performSave(data);
      }, delay);
    }

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [data, delay, performSave, hasUnsavedChanges]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, []);

  // 页面关闭前保存
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges() && status !== 'saving') {
        e.preventDefault();
        e.returnValue = '您有未保存的更改，确定要离开吗？';
        
        // 尝试同步保存
        try {
          localStorage.setItem('unsaved_backup', JSON.stringify({
            data,
            timestamp: new Date().toISOString()
          }));
        } catch (error) {
          console.error('保存备份失败:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, status, hasUnsavedChanges]);

  // 恢复本地备份
  const restoreBackup = useCallback(() => {
    try {
      const backup = localStorage.getItem('unsaved_backup');
      if (backup) {
        const { data: backupData, timestamp } = JSON.parse(backup);
        console.log('发现本地备份，时间:', timestamp);
        return backupData as T;
      }
    } catch (error) {
      console.error('恢复备份失败:', error);
    }
    return null;
  }, []);

  // 清除本地备份
  const clearBackup = useCallback(() => {
    try {
      localStorage.removeItem('unsaved_backup');
    } catch (error) {
      console.error('清除备份失败:', error);
    }
  }, []);

  return {
    status,
    lastSaveTime,
    error,
    isSaving: isSavingRef.current,
    hasUnsavedChanges: hasUnsavedChanges(),
    save,
    retry,
    restoreBackup,
    clearBackup,
    retryCount,
    maxRetries
  };
}

export default useAutoSaveWithStatus;
