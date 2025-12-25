/**
 * @fileoverview 离线同步状态 Hook
 * @module hooks/useSync
 * @description 提供同步状态访问和同步操作的 React Hook
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  syncService,
  SyncQueueState,
  SyncEventType,
  SyncItem
} from '../services/sync/SyncService';

/**
 * 同步状态 Hook 返回值
 */
export interface UseSyncReturn {
  /** 队列状态 */
  state: SyncQueueState;
  /** 是否在线 */
  isOnline: boolean;
  /** 是否有待同步项 */
  hasPending: boolean;
  /** 失败的同步项 */
  failedItems: SyncItem[];
  /** 强制同步 */
  forceSync: () => Promise<void>;
  /** 重试失败项 */
  retryFailed: () => Promise<void>;
  /** 清除失败项 */
  clearFailed: () => Promise<void>;
}

/**
 * 离线同步状态 Hook
 *
 * @description
 * 提供同步服务的状态访问和操作方法
 *
 * @returns {UseSyncReturn} 同步状态和操作方法
 *
 * @example
 * function SyncIndicator() {
 *   const { state, isOnline, hasPending, forceSync } = useSync();
 *
 *   return (
 *     <div>
 *       <span>{isOnline ? '在线' : '离线'}</span>
 *       {hasPending && <span>待同步: {state.pendingCount}</span>}
 *       <button onClick={forceSync} disabled={!isOnline}>
 *         立即同步
 *       </button>
 *     </div>
 *   );
 * }
 */
export function useSync(): UseSyncReturn {
  const [state, setState] = useState<SyncQueueState>(() => syncService.getQueueState());
  const [failedItems, setFailedItems] = useState<SyncItem[]>(() => syncService.getFailedItems());

  useEffect(() => {
    // 初始化同步服务
    syncService.init();

    // 订阅状态变化
    const unsubscribeQueue = syncService.on('queueChange', (event) => {
      setState(event.data as SyncQueueState);
      setFailedItems(syncService.getFailedItems());
    });

    const unsubscribeOnline = syncService.on('online', () => {
      setState(prev => ({ ...prev, isOnline: true }));
    });

    const unsubscribeOffline = syncService.on('offline', () => {
      setState(prev => ({ ...prev, isOnline: false }));
    });

    return () => {
      unsubscribeQueue();
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  const forceSync = useCallback(async () => {
    try {
      await syncService.forceSync();
    } catch (error) {
      console.error('强制同步失败:', error);
      throw error;
    }
  }, []);

  const retryFailed = useCallback(async () => {
    await syncService.retryFailed();
  }, []);

  const clearFailed = useCallback(async () => {
    await syncService.clearFailed();
  }, []);

  return {
    state,
    isOnline: state.isOnline,
    hasPending: state.pendingCount > 0,
    failedItems,
    forceSync,
    retryFailed,
    clearFailed
  };
}

/**
 * 同步事件监听 Hook
 *
 * @param event - 要监听的事件类型
 * @param callback - 事件回调函数
 *
 * @example
 * useSyncEvent('syncComplete', (event) => {
 *   console.log('同步完成', event.data);
 * });
 */
export function useSyncEvent(
  event: SyncEventType,
  callback: (event: { type: SyncEventType; data?: unknown }) => void
): void {
  useEffect(() => {
    const unsubscribe = syncService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

export default useSync;
