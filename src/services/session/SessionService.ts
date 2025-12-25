/**
 * @fileoverview 会话管理服务
 * @module services/session/SessionService
 * @description 提供用户会话管理功能，包括登录状态、跨标签页同步和自动续期
 * @version 1.0.0
 *
 * @features
 * - 会话过期时间管理（默认 7 天）
 * - 跨标签页同步（使用 BroadcastChannel）
 * - 活跃用户自动续期
 * - 安全登出（一处登出全部登出）
 * - 会话信息不包含敏感数据
 *
 * @example
 * // 登录创建会话
 * sessionService.createSession('user_123');
 *
 * // 检查会话状态
 * const state = sessionService.getSessionState();
 * if (state === 'active') {
 *   const session = sessionService.getSession();
 *   console.log('当前用户:', session?.userId);
 * }
 *
 * // 监听会话变化
 * sessionService.subscribe((event) => {
 *   if (event.type === 'logout') {
 *     router.navigate('/login');
 *   }
 * });
 *
 * // 登出
 * sessionService.logout();
 */

import { STORAGE_KEYS } from '../../config/constants';
import { createDeviceId } from '../../utils/id';

// ==================== 类型定义 ====================

/**
 * 会话数据
 */
export interface SessionData {
  /** 用户 ID */
  userId: string;
  /** 会话创建时间 */
  createdAt: string;
  /** 会话过期时间 */
  expiresAt: string;
  /** 最后活跃时间 */
  lastActiveAt: string;
  /** 设备标识（可选） */
  deviceId?: string;
}

/**
 * 会话状态
 */
export type SessionState = 'active' | 'expired' | 'none';

/**
 * 会话变更类型
 */
export type SessionChangeType = 'login' | 'logout' | 'expire' | 'refresh' | 'sync';

/**
 * 会话变更事件
 */
export interface SessionChangeEvent {
  type: SessionChangeType;
  session: SessionData | null;
  source: 'local' | 'remote';
}

/**
 * 会话监听器
 */
type SessionChangeListener = (event: SessionChangeEvent) => void;

// ==================== 常量配置 ====================

/** 会话存储 key */
const SESSION_STORAGE_KEY = STORAGE_KEYS.SESSION || 'tiandao_session';

/** 默认会话有效期（7 天） */
const DEFAULT_SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/** 自动续期阈值（剩余 1 天时续期） */
const AUTO_REFRESH_THRESHOLD_MS = 1 * 24 * 60 * 60 * 1000;

/** 活跃检测间隔（5 分钟） */
const ACTIVITY_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/** 广播频道名称 */
const BROADCAST_CHANNEL_NAME = 'tiandao_session_channel';

// ==================== 会话服务 ====================

class SessionService {
  private session: SessionData | null = null;
  private listeners: Set<SessionChangeListener> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;
  private activityCheckTimer: ReturnType<typeof setInterval> | null = null;
  private initialized = false;

  constructor() {
    // 延迟初始化，等待 DOM 加载
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  /**
   * 初始化会话服务
   */
  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // 从存储加载会话
    this.loadSession();

    // 设置跨标签页同步
    this.setupBroadcastChannel();

    // 监听存储变化（兼容旧浏览器）
    window.addEventListener('storage', this.handleStorageChange);

    // 监听页面可见性
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    // 启动活跃检测
    this.startActivityCheck();
  }

  /**
   * 订阅会话变更
   */
  subscribe(listener: SessionChangeListener): () => void {
    this.listeners.add(listener);

    // 如果已有会话，立即通知
    if (this.session) {
      listener({
        type: 'sync',
        session: this.session,
        source: 'local',
      });
    }

    return () => this.listeners.delete(listener);
  }

  /**
   * 创建新会话（登录）
   */
  login(userId: string, durationMs: number = DEFAULT_SESSION_DURATION_MS): SessionData {
    const now = new Date();
    const session: SessionData = {
      userId,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + durationMs).toISOString(),
      lastActiveAt: now.toISOString(),
      deviceId: this.getDeviceId(),
    };

    this.session = session;
    this.saveSession();
    this.notifyListeners('login', 'local');
    this.broadcastChange('login');

    return session;
  }

  /**
   * 销毁会话（登出）
   */
  logout(): void {
    this.session = null;
    this.clearSession();
    this.notifyListeners('logout', 'local');
    this.broadcastChange('logout');
  }

  /**
   * 获取当前会话
   */
  getSession(): SessionData | null {
    if (!this.session) return null;

    // 检查是否过期
    if (this.isExpired(this.session)) {
      this.handleExpiration();
      return null;
    }

    return this.session;
  }

  /**
   * 获取会话状态
   */
  getState(): SessionState {
    if (!this.session) return 'none';
    if (this.isExpired(this.session)) return 'expired';
    return 'active';
  }

  /**
   * 获取当前用户 ID
   */
  getUserId(): string | null {
    const session = this.getSession();
    return session?.userId ?? null;
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    return this.getState() === 'active';
  }

  /**
   * 记录用户活跃（自动续期）
   */
  recordActivity(): void {
    if (!this.session) return;

    const now = new Date();
    this.session.lastActiveAt = now.toISOString();

    // 检查是否需要续期
    const expiresAt = new Date(this.session.expiresAt).getTime();
    const remainingTime = expiresAt - now.getTime();

    if (remainingTime < AUTO_REFRESH_THRESHOLD_MS) {
      this.refreshSession();
    } else {
      // 只更新活跃时间
      this.saveSession();
    }
  }

  /**
   * 刷新会话（续期）
   */
  refreshSession(): void {
    if (!this.session) return;

    const now = new Date();
    this.session.expiresAt = new Date(now.getTime() + DEFAULT_SESSION_DURATION_MS).toISOString();
    this.session.lastActiveAt = now.toISOString();

    this.saveSession();
    this.notifyListeners('refresh', 'local');
  }

  /**
   * 销毁服务（清理资源）
   */
  destroy(): void {
    if (this.activityCheckTimer) {
      clearInterval(this.activityCheckTimer);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    window.removeEventListener('storage', this.handleStorageChange);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.listeners.clear();
  }

  // ==================== 私有方法 ====================

  /**
   * 从存储加载会话
   */
  private loadSession(): void {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!stored) {
        this.session = null;
        return;
      }

      const session = JSON.parse(stored) as SessionData;

      // 验证会话数据
      if (!this.isValidSession(session)) {
        console.warn('[Session] 无效的会话数据，已清除');
        this.clearSession();
        return;
      }

      // 检查是否过期
      if (this.isExpired(session)) {
        console.log('[Session] 会话已过期');
        this.clearSession();
        this.notifyListeners('expire', 'local');
        return;
      }

      this.session = session;
    } catch (e) {
      console.error('[Session] 加载会话失败:', e);
      this.clearSession();
    }
  }

  /**
   * 保存会话到存储
   */
  private saveSession(): void {
    if (!this.session) return;

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(this.session));
    } catch (e) {
      console.error('[Session] 保存会话失败:', e);
    }
  }

  /**
   * 清除会话存储
   */
  private clearSession(): void {
    this.session = null;
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.error('[Session] 清除会话失败:', e);
    }
  }

  /**
   * 验证会话数据结构
   */
  private isValidSession(session: unknown): session is SessionData {
    if (!session || typeof session !== 'object') return false;
    const s = session as Record<string, unknown>;
    return (
      typeof s.userId === 'string' &&
      typeof s.createdAt === 'string' &&
      typeof s.expiresAt === 'string' &&
      typeof s.lastActiveAt === 'string'
    );
  }

  /**
   * 检查会话是否过期
   */
  private isExpired(session: SessionData): boolean {
    const expiresAt = new Date(session.expiresAt).getTime();
    return Date.now() > expiresAt;
  }

  /**
   * 处理会话过期
   */
  private handleExpiration(): void {
    this.clearSession();
    this.notifyListeners('expire', 'local');
    this.broadcastChange('expire');
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(type: SessionChangeType, source: 'local' | 'remote'): void {
    const event: SessionChangeEvent = {
      type,
      session: this.session,
      source,
    };

    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('[Session] 监听器执行错误:', e);
      }
    });
  }

  /**
   * 设置跨标签页同步
   */
  private setupBroadcastChannel(): void {
    if (typeof BroadcastChannel === 'undefined') {
      console.log('[Session] BroadcastChannel 不可用，使用 storage 事件作为回退');
      return;
    }

    try {
      this.broadcastChannel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      this.broadcastChannel.onmessage = this.handleBroadcastMessage;
    } catch (e) {
      console.warn('[Session] 创建 BroadcastChannel 失败:', e);
    }
  }

  /**
   * 广播会话变更
   */
  private broadcastChange(type: SessionChangeType): void {
    if (!this.broadcastChannel) return;

    try {
      this.broadcastChannel.postMessage({
        type,
        session: this.session,
        timestamp: Date.now(),
      });
    } catch (e) {
      console.warn('[Session] 广播消息失败:', e);
    }
  }

  /**
   * 处理广播消息
   */
  private handleBroadcastMessage = (event: MessageEvent): void => {
    const { type, session } = event.data;

    if (type === 'logout' || type === 'expire') {
      this.session = null;
      this.clearSession();
      this.notifyListeners(type, 'remote');
    } else if (type === 'login' && session) {
      this.session = session;
      this.saveSession();
      this.notifyListeners('sync', 'remote');
    }
  };

  /**
   * 处理 storage 事件（跨标签页同步回退方案）
   */
  private handleStorageChange = (event: StorageEvent): void => {
    if (event.key !== SESSION_STORAGE_KEY) return;

    if (event.newValue === null) {
      // 会话被清除
      if (this.session) {
        this.session = null;
        this.notifyListeners('logout', 'remote');
      }
    } else {
      // 会话变更
      try {
        const newSession = JSON.parse(event.newValue) as SessionData;
        if (this.isValidSession(newSession)) {
          this.session = newSession;
          this.notifyListeners('sync', 'remote');
        }
      } catch (e) {
        console.warn('[Session] 解析 storage 事件失败:', e);
      }
    }
  };

  /**
   * 处理页面可见性变化
   */
  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'visible') {
      // 页面变为可见时，重新验证会话
      this.loadSession();
    }
  };

  /**
   * 启动活跃检测
   */
  private startActivityCheck(): void {
    this.activityCheckTimer = setInterval(() => {
      if (this.session && this.isExpired(this.session)) {
        this.handleExpiration();
      }
    }, ACTIVITY_CHECK_INTERVAL_MS);
  }

  /**
   * 获取设备标识
   */
  private getDeviceId(): string {
    const stored = localStorage.getItem('tiandao_device_id');
    if (stored) return stored;

    const newId = createDeviceId();
    try {
      localStorage.setItem('tiandao_device_id', newId);
    } catch {
      // 忽略
    }
    return newId;
  }
}

// 导出单例
export const sessionService = new SessionService();

// 便捷方法导出
export const login = sessionService.login.bind(sessionService);
export const logout = sessionService.logout.bind(sessionService);
export const getSession = sessionService.getSession.bind(sessionService);
export const getUserId = sessionService.getUserId.bind(sessionService);
export const isLoggedIn = sessionService.isLoggedIn.bind(sessionService);
export const recordActivity = sessionService.recordActivity.bind(sessionService);
export const subscribeToSession = sessionService.subscribe.bind(sessionService);

export default sessionService;
