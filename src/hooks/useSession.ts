/**
 * 会话管理 Hook
 *
 * 提供 React 组件中使用会话管理的便捷接口
 */

import { useState, useEffect, useCallback } from 'react';
import {
  sessionService,
  SessionData,
  SessionState,
  SessionChangeEvent,
} from '../services/session/SessionService';

/**
 * useSession Hook 返回值
 */
interface UseSessionReturn {
  /** 当前会话数据 */
  session: SessionData | null;
  /** 会话状态 */
  state: SessionState;
  /** 当前用户 ID */
  userId: string | null;
  /** 是否已登录 */
  isLoggedIn: boolean;
  /** 登录 */
  login: (userId: string, durationMs?: number) => SessionData;
  /** 登出 */
  logout: () => void;
  /** 记录活跃（续期） */
  recordActivity: () => void;
  /** 刷新会话 */
  refreshSession: () => void;
}

/**
 * 会话管理 Hook
 *
 * 提供完整的会话管理功能：
 * - 会话状态订阅
 * - 登录/登出
 * - 自动续期
 * - 跨标签页同步
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isLoggedIn, userId, login, logout } = useSession();
 *
 *   if (!isLoggedIn) {
 *     return <LoginButton onClick={() => login('user-123')} />;
 *   }
 *
 *   return <div>Welcome, {userId}!</div>;
 * }
 * ```
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(() => sessionService.getSession());
  const [state, setState] = useState<SessionState>(() => sessionService.getState());

  // 订阅会话变更
  useEffect(() => {
    const unsubscribe = sessionService.subscribe((event: SessionChangeEvent) => {
      setSession(event.session);
      setState(sessionService.getState());
    });

    return unsubscribe;
  }, []);

  // 用户交互时记录活跃
  useEffect(() => {
    if (!session) return;

    const handleActivity = () => {
      sessionService.recordActivity();
    };

    // 监听用户交互事件
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [session]);

  const login = useCallback((userId: string, durationMs?: number) => {
    return sessionService.login(userId, durationMs);
  }, []);

  const logout = useCallback(() => {
    sessionService.logout();
  }, []);

  const recordActivity = useCallback(() => {
    sessionService.recordActivity();
  }, []);

  const refreshSession = useCallback(() => {
    sessionService.refreshSession();
  }, []);

  return {
    session,
    state,
    userId: session?.userId ?? null,
    isLoggedIn: state === 'active',
    login,
    logout,
    recordActivity,
    refreshSession,
  };
}

/**
 * 仅获取会话状态的轻量 Hook
 */
export function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>(() => sessionService.getState());

  useEffect(() => {
    const unsubscribe = sessionService.subscribe(() => {
      setState(sessionService.getState());
    });

    return unsubscribe;
  }, []);

  return state;
}

/**
 * 仅获取用户 ID 的轻量 Hook
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(() => sessionService.getUserId());

  useEffect(() => {
    const unsubscribe = sessionService.subscribe((event) => {
      setUserId(event.session?.userId ?? null);
    });

    return unsubscribe;
  }, []);

  return userId;
}

export default useSession;
