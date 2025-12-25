/**
 * 在线状态检测 Hook
 *
 * 功能：
 * - 检测网络连接状态
 * - 离线/上线事件通知
 * - 可选的自动提醒
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseOnlineStatusOptions {
  /** 离线时的回调 */
  onOffline?: () => void;
  /** 上线时的回调 */
  onOnline?: () => void;
  /** 检测间隔（毫秒），用于主动检测，默认不启用 */
  pingInterval?: number;
  /** 用于 ping 的 URL */
  pingUrl?: string;
}

interface OnlineStatus {
  /** 是否在线 */
  isOnline: boolean;
  /** 上次检测时间 */
  lastChecked: Date | null;
  /** 离线持续时间（毫秒） */
  offlineDuration: number | null;
}

export function useOnlineStatus(options: UseOnlineStatusOptions = {}): OnlineStatus {
  const { onOffline, onOnline, pingInterval, pingUrl } = options;

  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [offlineStartTime, setOfflineStartTime] = useState<Date | null>(null);

  const onOfflineRef = useRef(onOffline);
  const onOnlineRef = useRef(onOnline);

  // 更新回调引用
  useEffect(() => {
    onOfflineRef.current = onOffline;
    onOnlineRef.current = onOnline;
  }, [onOffline, onOnline]);

  // 处理离线事件
  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setOfflineStartTime(new Date());
    setLastChecked(new Date());
    onOfflineRef.current?.();
  }, []);

  // 处理上线事件
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setOfflineStartTime(null);
    setLastChecked(new Date());
    onOnlineRef.current?.();
  }, []);

  // 主动检测网络状态
  const checkConnection = useCallback(async () => {
    if (!pingUrl) return;

    try {
      const response = await fetch(pingUrl, {
        method: 'HEAD',
        cache: 'no-cache',
        mode: 'no-cors',
      });
      if (!isOnline) {
        handleOnline();
      }
    } catch {
      if (isOnline) {
        handleOffline();
      }
    }
    setLastChecked(new Date());
  }, [pingUrl, isOnline, handleOnline, handleOffline]);

  // 监听浏览器在线/离线事件
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // 定时 ping 检测
  useEffect(() => {
    if (!pingInterval || !pingUrl) return;

    const intervalId = setInterval(checkConnection, pingInterval);
    return () => clearInterval(intervalId);
  }, [pingInterval, pingUrl, checkConnection]);

  // 计算离线持续时间
  const offlineDuration = offlineStartTime
    ? Date.now() - offlineStartTime.getTime()
    : null;

  return {
    isOnline,
    lastChecked,
    offlineDuration,
  };
}

/**
 * 离线提醒组件的 Props
 */
export interface OfflineIndicatorProps {
  isOnline: boolean;
  offlineDuration: number | null;
}

export default useOnlineStatus;
