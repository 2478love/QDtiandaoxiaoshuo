/**
 * 会话过期提示组件
 *
 * 在会话即将过期时显示提醒，让用户可以选择续期或重新登录
 */

import React, { useState, useEffect, useCallback } from 'react';
import { sessionService, SessionChangeEvent } from '../../services/session/SessionService';

interface SessionExpiryWarningProps {
  /** 提前多少毫秒开始警告（默认 5 分钟） */
  warningThresholdMs?: number;
  /** 会话过期后的回调 */
  onExpired?: () => void;
  /** 用户选择续期后的回调 */
  onRefreshed?: () => void;
}

/** 会话剩余时间警告阈值（5 分钟） */
const DEFAULT_WARNING_THRESHOLD_MS = 5 * 60 * 1000;

/** 检查间隔（30 秒） */
const CHECK_INTERVAL_MS = 30 * 1000;

export const SessionExpiryWarning: React.FC<SessionExpiryWarningProps> = ({
  warningThresholdMs = DEFAULT_WARNING_THRESHOLD_MS,
  onExpired,
  onRefreshed,
}) => {
  const [showWarning, setShowWarning] = useState(false);
  const [showExpired, setShowExpired] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState(0);

  // 计算剩余时间
  const calculateRemainingTime = useCallback(() => {
    const session = sessionService.getSession();
    if (!session) {
      setShowWarning(false);
      return;
    }

    const expiresAt = new Date(session.expiresAt).getTime();
    const now = Date.now();
    const remainingMs = expiresAt - now;

    if (remainingMs <= 0) {
      // 会话已过期
      setShowWarning(false);
      setShowExpired(true);
      onExpired?.();
      return;
    }

    if (remainingMs <= warningThresholdMs) {
      // 会话即将过期
      setRemainingMinutes(Math.ceil(remainingMs / (60 * 1000)));
      setShowWarning(true);
    } else {
      setShowWarning(false);
    }
  }, [warningThresholdMs, onExpired]);

  // 定期检查会话状态
  useEffect(() => {
    calculateRemainingTime();

    const intervalId = setInterval(calculateRemainingTime, CHECK_INTERVAL_MS);

    // 监听会话变化
    const unsubscribe = sessionService.subscribe((event: SessionChangeEvent) => {
      if (event.type === 'expire') {
        setShowWarning(false);
        setShowExpired(true);
        onExpired?.();
      } else if (event.type === 'refresh') {
        setShowWarning(false);
        setShowExpired(false);
      } else if (event.type === 'logout') {
        setShowWarning(false);
        setShowExpired(false);
      } else if (event.type === 'login') {
        setShowWarning(false);
        setShowExpired(false);
      }
    });

    return () => {
      clearInterval(intervalId);
      unsubscribe();
    };
  }, [calculateRemainingTime, onExpired]);

  // 处理续期
  const handleRefresh = useCallback(() => {
    sessionService.refreshSession();
    setShowWarning(false);
    onRefreshed?.();
  }, [onRefreshed]);

  // 处理关闭过期提示
  const handleCloseExpired = useCallback(() => {
    setShowExpired(false);
  }, []);

  // 即将过期警告
  if (showWarning) {
    return (
      <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
        <div className="bg-amber-50 dark:bg-amber-900/90 border border-amber-200 dark:border-amber-700 rounded-2xl shadow-lg shadow-amber-100/50 dark:shadow-none p-4 max-w-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-amber-800 dark:text-amber-200">
                会话即将过期
              </h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                您的登录会话将在 <span className="font-semibold">{remainingMinutes}</span> 分钟后过期。
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-amber-600 text-white text-sm font-medium rounded-xl hover:bg-amber-700 transition-colors"
                >
                  立即续期
                </button>
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 text-amber-700 dark:text-amber-300 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-800/50 rounded-xl transition-colors"
                >
                  稍后提醒
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 会话已过期
  if (showExpired) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-slate-900/20 dark:shadow-black/50 p-8 max-w-md w-full border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-300">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-rose-500 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              会话已过期
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">
              您的登录会话已过期，为了保护您的账号安全，请重新登录。
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  handleCloseExpired();
                  // 这里可以触发打开登录模态框的操作
                  window.dispatchEvent(new CustomEvent('tiandao:openLogin'));
                }}
                className="w-full py-3 bg-gradient-to-r from-[#2C5F2D] to-[#1E4620] text-white font-bold rounded-xl shadow-lg shadow-[#E8F5E8] dark:shadow-none hover:shadow-[#97BC62] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                重新登录
              </button>
              <button
                onClick={handleCloseExpired}
                className="w-full py-3 text-slate-500 dark:text-slate-400 font-medium hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default SessionExpiryWarning;
