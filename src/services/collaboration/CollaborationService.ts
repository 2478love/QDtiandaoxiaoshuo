/**
 * @fileoverview 协作服务
 * @module services/collaboration/CollaborationService
 * @description 提供多用户协作功能，包括实时状态同步、光标位置、在线用户等
 * @version 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * 协作者信息
 */
export interface Collaborator {
  /** 用户 ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 头像 URL */
  avatar?: string;
  /** 用户颜色（用于标识光标等） */
  color: string;
  /** 是否在线 */
  isOnline: boolean;
  /** 最后活跃时间 */
  lastActiveAt: number;
  /** 当前所在资源 */
  currentResource?: {
    type: string;
    id: string;
  };
  /** 光标位置 */
  cursor?: CursorPosition;
  /** 选区 */
  selection?: SelectionRange;
}

/**
 * 光标位置
 */
export interface CursorPosition {
  /** 章节 ID */
  chapterId: string;
  /** 段落索引 */
  paragraphIndex: number;
  /** 字符偏移量 */
  offset: number;
}

/**
 * 选区范围
 */
export interface SelectionRange {
  /** 起始位置 */
  start: CursorPosition;
  /** 结束位置 */
  end: CursorPosition;
}

/**
 * 协作状态
 */
export interface CollaborationState {
  /** 会话 ID */
  sessionId: string;
  /** 资源类型 */
  resourceType: string;
  /** 资源 ID */
  resourceId: string;
  /** 当前协作者列表 */
  collaborators: Collaborator[];
  /** 是否已连接 */
  isConnected: boolean;
  /** 最后同步时间 */
  lastSyncAt: number;
}

/**
 * 协作操作类型
 */
export type OperationType =
  | 'insert'   // 插入
  | 'delete'   // 删除
  | 'replace'  // 替换
  | 'format'   // 格式化
  | 'move';    // 移动

/**
 * 协作操作
 */
export interface CollaborationOperation {
  /** 操作 ID */
  id: string;
  /** 操作类型 */
  type: OperationType;
  /** 操作者 ID */
  userId: string;
  /** 资源类型 */
  resourceType: string;
  /** 资源 ID */
  resourceId: string;
  /** 操作位置 */
  position: CursorPosition;
  /** 操作数据 */
  data: {
    content?: string;
    length?: number;
    format?: Record<string, unknown>;
    targetPosition?: CursorPosition;
  };
  /** 操作时间戳 */
  timestamp: number;
  /** 版本号 */
  version: number;
}

/**
 * 协作消息类型
 */
export type CollaborationMessageType =
  | 'join'           // 加入协作
  | 'leave'          // 离开协作
  | 'cursor_move'    // 光标移动
  | 'selection'      // 选区变化
  | 'operation'      // 操作同步
  | 'presence'       // 状态更新
  | 'sync_request'   // 同步请求
  | 'sync_response'  // 同步响应
  | 'conflict'       // 冲突通知
  | 'lock'           // 锁定资源
  | 'unlock';        // 解锁资源

/**
 * 协作消息
 */
export interface CollaborationMessage {
  /** 消息类型 */
  type: CollaborationMessageType;
  /** 发送者 ID */
  senderId: string;
  /** 资源类型 */
  resourceType: string;
  /** 资源 ID */
  resourceId: string;
  /** 消息数据 */
  data: unknown;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 协作事件类型
 */
export type CollaborationEventType =
  | 'connected'        // 连接成功
  | 'disconnected'     // 连接断开
  | 'collaborator_join'    // 协作者加入
  | 'collaborator_leave'   // 协作者离开
  | 'cursor_update'    // 光标更新
  | 'selection_update' // 选区更新
  | 'operation_received'   // 收到操作
  | 'conflict_detected'    // 检测到冲突
  | 'sync_complete'    // 同步完成
  | 'error';           // 错误

/**
 * 协作事件回调
 */
export type CollaborationEventCallback = (event: {
  type: CollaborationEventType;
  data?: unknown;
}) => void;

/**
 * 资源锁定信息
 */
export interface ResourceLock {
  /** 资源类型 */
  resourceType: string;
  /** 资源 ID */
  resourceId: string;
  /** 锁定者 ID */
  lockedBy: string;
  /** 锁定时间 */
  lockedAt: number;
  /** 锁定原因 */
  reason?: string;
  /** 过期时间 */
  expiresAt?: number;
}

// ==================== 常量定义 ====================

const COLLABORATION_STORAGE_KEY = 'tiandao_collaboration_state';
const PRESENCE_INTERVAL_MS = 30000; // 30秒发送一次存在信号
const INACTIVE_THRESHOLD_MS = 120000; // 2分钟不活跃视为离线
const OPERATION_BATCH_INTERVAL_MS = 100; // 操作批处理间隔

// 预定义的协作者颜色
const COLLABORATOR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
  '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

// ==================== 协作服务类 ====================

/**
 * 协作服务
 *
 * @description
 * 提供以下功能：
 * 1. 实时协作者状态管理
 * 2. 光标和选区同步
 * 3. 操作同步与冲突解决
 * 4. 资源锁定机制
 * 5. 离线支持与重连
 *
 * @example
 * // 初始化并加入协作
 * collaborationService.init({ userId: 'user_123', username: '张三' });
 * await collaborationService.join('novel', 'novel_456');
 *
 * // 发送光标位置
 * collaborationService.updateCursor({
 *   chapterId: 'chapter_1',
 *   paragraphIndex: 5,
 *   offset: 100
 * });
 *
 * // 发送操作
 * collaborationService.sendOperation({
 *   type: 'insert',
 *   position: { chapterId: 'chapter_1', paragraphIndex: 5, offset: 100 },
 *   data: { content: '新内容' }
 * });
 */
class CollaborationService {
  private currentUser: Collaborator | null = null;
  private collaborators: Map<string, Collaborator> = new Map();
  private operationQueue: CollaborationOperation[] = [];
  private localVersion: number = 0;
  private serverVersion: number = 0;
  private currentResource: { type: string; id: string } | null = null;
  private eventListeners: Map<CollaborationEventType, Set<CollaborationEventCallback>> = new Map();
  private broadcastChannel: BroadcastChannel | null = null;
  private presenceInterval: ReturnType<typeof setInterval> | null = null;
  private operationBatchTimeout: ReturnType<typeof setTimeout> | null = null;
  private locks: Map<string, ResourceLock> = new Map();
  private pendingOperations: CollaborationOperation[] = [];
  private initialized: boolean = false;
  private isConnected: boolean = false;

  /**
   * 初始化协作服务
   *
   * @param user - 当前用户信息
   */
  init(user: { userId: string; username: string; avatar?: string }): void {
    if (this.initialized) return;

    this.currentUser = {
      ...user,
      color: this.assignColor(user.userId),
      isOnline: true,
      lastActiveAt: Date.now()
    };

    // 设置 BroadcastChannel 用于跨标签页同步
    try {
      this.broadcastChannel = new BroadcastChannel('tiandao_collaboration');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    } catch (e) {
      console.warn('[CollaborationService] BroadcastChannel 不可用');
    }

    this.loadFromStorage();
    this.startPresenceHeartbeat();

    this.initialized = true;
    console.log('[CollaborationService] 初始化完成');
  }

  /**
   * 分配协作者颜色
   */
  private assignColor(userId: string): string {
    // 基于用户 ID 生成稳定的颜色索引
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return COLLABORATOR_COLORS[Math.abs(hash) % COLLABORATOR_COLORS.length];
  }

  /**
   * 从存储加载状态
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(COLLABORATION_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        this.localVersion = data.localVersion || 0;
        this.pendingOperations = data.pendingOperations || [];
      }
    } catch (error) {
      console.error('[CollaborationService] 加载状态失败:', error);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const data = {
        localVersion: this.localVersion,
        pendingOperations: this.pendingOperations
      };
      localStorage.setItem(COLLABORATION_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[CollaborationService] 保存状态失败:', error);
    }
  }

  /**
   * 启动存在心跳
   */
  private startPresenceHeartbeat(): void {
    this.presenceInterval = setInterval(() => {
      if (this.currentResource && this.currentUser) {
        this.broadcastMessage({
          type: 'presence',
          senderId: this.currentUser.userId,
          resourceType: this.currentResource.type,
          resourceId: this.currentResource.id,
          data: {
            user: this.currentUser
          },
          timestamp: Date.now()
        });

        // 清理不活跃的协作者
        this.cleanInactiveCollaborators();
      }
    }, PRESENCE_INTERVAL_MS);
  }

  /**
   * 清理不活跃的协作者
   */
  private cleanInactiveCollaborators(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    this.collaborators.forEach((collaborator, id) => {
      if (now - collaborator.lastActiveAt > INACTIVE_THRESHOLD_MS) {
        toRemove.push(id);
      }
    });

    toRemove.forEach(id => {
      const collaborator = this.collaborators.get(id);
      this.collaborators.delete(id);
      if (collaborator) {
        this.emit('collaborator_leave', { collaborator });
      }
    });
  }

  /**
   * 加入协作会话
   *
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   */
  async join(resourceType: string, resourceId: string): Promise<void> {
    if (!this.currentUser) {
      throw new Error('服务未初始化');
    }

    // 如果已在其他资源中，先离开
    if (this.currentResource) {
      await this.leave();
    }

    this.currentResource = { type: resourceType, id: resourceId };
    this.currentUser.currentResource = this.currentResource;
    this.isConnected = true;

    // 广播加入消息
    this.broadcastMessage({
      type: 'join',
      senderId: this.currentUser.userId,
      resourceType,
      resourceId,
      data: {
        user: this.currentUser
      },
      timestamp: Date.now()
    });

    // 请求同步
    this.broadcastMessage({
      type: 'sync_request',
      senderId: this.currentUser.userId,
      resourceType,
      resourceId,
      data: {
        version: this.localVersion
      },
      timestamp: Date.now()
    });

    this.emit('connected', { resourceType, resourceId });
  }

  /**
   * 离开协作会话
   */
  async leave(): Promise<void> {
    if (!this.currentResource || !this.currentUser) return;

    // 广播离开消息
    this.broadcastMessage({
      type: 'leave',
      senderId: this.currentUser.userId,
      resourceType: this.currentResource.type,
      resourceId: this.currentResource.id,
      data: {
        userId: this.currentUser.userId
      },
      timestamp: Date.now()
    });

    // 释放所有锁定
    this.locks.forEach((lock, key) => {
      if (lock.lockedBy === this.currentUser!.userId) {
        this.unlock(lock.resourceType, lock.resourceId);
      }
    });

    this.collaborators.clear();
    this.currentResource = null;
    this.currentUser.currentResource = undefined;
    this.isConnected = false;

    this.emit('disconnected', {});
  }

  /**
   * 更新光标位置
   *
   * @param cursor - 光标位置
   */
  updateCursor(cursor: CursorPosition): void {
    if (!this.currentUser || !this.currentResource) return;

    this.currentUser.cursor = cursor;
    this.currentUser.lastActiveAt = Date.now();

    this.broadcastMessage({
      type: 'cursor_move',
      senderId: this.currentUser.userId,
      resourceType: this.currentResource.type,
      resourceId: this.currentResource.id,
      data: { cursor },
      timestamp: Date.now()
    });
  }

  /**
   * 更新选区
   *
   * @param selection - 选区范围
   */
  updateSelection(selection: SelectionRange | null): void {
    if (!this.currentUser || !this.currentResource) return;

    this.currentUser.selection = selection || undefined;
    this.currentUser.lastActiveAt = Date.now();

    this.broadcastMessage({
      type: 'selection',
      senderId: this.currentUser.userId,
      resourceType: this.currentResource.type,
      resourceId: this.currentResource.id,
      data: { selection },
      timestamp: Date.now()
    });
  }

  /**
   * 发送操作
   *
   * @param operation - 操作信息（不含 id、userId、timestamp、version）
   */
  sendOperation(operation: Omit<CollaborationOperation, 'id' | 'userId' | 'timestamp' | 'version'>): void {
    if (!this.currentUser || !this.currentResource) return;

    const fullOperation: CollaborationOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: this.currentUser.userId,
      timestamp: Date.now(),
      version: ++this.localVersion
    };

    // 添加到待处理队列
    this.pendingOperations.push(fullOperation);
    this.operationQueue.push(fullOperation);
    this.saveToStorage();

    // 批量发送操作
    this.scheduleBatchSend();
  }

  /**
   * 调度批量发送
   */
  private scheduleBatchSend(): void {
    if (this.operationBatchTimeout) return;

    this.operationBatchTimeout = setTimeout(() => {
      this.flushOperations();
      this.operationBatchTimeout = null;
    }, OPERATION_BATCH_INTERVAL_MS);
  }

  /**
   * 刷新操作队列
   */
  private flushOperations(): void {
    if (this.operationQueue.length === 0 || !this.currentResource) return;

    const operations = [...this.operationQueue];
    this.operationQueue = [];

    this.broadcastMessage({
      type: 'operation',
      senderId: this.currentUser!.userId,
      resourceType: this.currentResource.type,
      resourceId: this.currentResource.id,
      data: { operations },
      timestamp: Date.now()
    });
  }

  /**
   * 锁定资源
   *
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @param reason - 锁定原因
   * @param expiresIn - 过期时间（毫秒）
   */
  lock(resourceType: string, resourceId: string, reason?: string, expiresIn?: number): boolean {
    if (!this.currentUser) return false;

    const key = `${resourceType}:${resourceId}`;
    const existingLock = this.locks.get(key);

    // 检查是否已被其他人锁定
    if (existingLock && existingLock.lockedBy !== this.currentUser.userId) {
      if (!existingLock.expiresAt || existingLock.expiresAt > Date.now()) {
        return false; // 资源被锁定
      }
    }

    const lock: ResourceLock = {
      resourceType,
      resourceId,
      lockedBy: this.currentUser.userId,
      lockedAt: Date.now(),
      reason,
      expiresAt: expiresIn ? Date.now() + expiresIn : undefined
    };

    this.locks.set(key, lock);

    // 广播锁定消息
    if (this.currentResource) {
      this.broadcastMessage({
        type: 'lock',
        senderId: this.currentUser.userId,
        resourceType: this.currentResource.type,
        resourceId: this.currentResource.id,
        data: { lock },
        timestamp: Date.now()
      });
    }

    return true;
  }

  /**
   * 解锁资源
   *
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   */
  unlock(resourceType: string, resourceId: string): boolean {
    if (!this.currentUser) return false;

    const key = `${resourceType}:${resourceId}`;
    const lock = this.locks.get(key);

    if (!lock || lock.lockedBy !== this.currentUser.userId) {
      return false;
    }

    this.locks.delete(key);

    // 广播解锁消息
    if (this.currentResource) {
      this.broadcastMessage({
        type: 'unlock',
        senderId: this.currentUser.userId,
        resourceType: this.currentResource.type,
        resourceId: this.currentResource.id,
        data: { resourceType, resourceId },
        timestamp: Date.now()
      });
    }

    return true;
  }

  /**
   * 检查资源是否被锁定
   *
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @returns 锁定信息或 null
   */
  getLock(resourceType: string, resourceId: string): ResourceLock | null {
    const key = `${resourceType}:${resourceId}`;
    const lock = this.locks.get(key);

    if (!lock) return null;

    // 检查是否过期
    if (lock.expiresAt && lock.expiresAt < Date.now()) {
      this.locks.delete(key);
      return null;
    }

    return lock;
  }

  /**
   * 广播消息
   */
  private broadcastMessage(message: CollaborationMessage): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage(message);
      } catch (error) {
        console.error('[CollaborationService] 广播消息失败:', error);
      }
    }
  }

  /**
   * 处理广播消息
   */
  private handleBroadcastMessage(message: CollaborationMessage): void {
    // 忽略自己发送的消息
    if (message.senderId === this.currentUser?.userId) return;

    // 忽略不属于当前资源的消息
    if (this.currentResource &&
        (message.resourceType !== this.currentResource.type ||
         message.resourceId !== this.currentResource.id)) {
      return;
    }

    switch (message.type) {
      case 'join':
        this.handleJoin(message);
        break;
      case 'leave':
        this.handleLeave(message);
        break;
      case 'cursor_move':
        this.handleCursorMove(message);
        break;
      case 'selection':
        this.handleSelection(message);
        break;
      case 'operation':
        this.handleOperation(message);
        break;
      case 'presence':
        this.handlePresence(message);
        break;
      case 'sync_request':
        this.handleSyncRequest(message);
        break;
      case 'sync_response':
        this.handleSyncResponse(message);
        break;
      case 'lock':
        this.handleLock(message);
        break;
      case 'unlock':
        this.handleUnlock(message);
        break;
    }
  }

  /**
   * 处理加入消息
   */
  private handleJoin(message: CollaborationMessage): void {
    const { user } = message.data as { user: Collaborator };
    this.collaborators.set(user.userId, user);
    this.emit('collaborator_join', { collaborator: user });

    // 回复自己的存在信息
    if (this.currentUser && this.currentResource) {
      this.broadcastMessage({
        type: 'presence',
        senderId: this.currentUser.userId,
        resourceType: this.currentResource.type,
        resourceId: this.currentResource.id,
        data: { user: this.currentUser },
        timestamp: Date.now()
      });
    }
  }

  /**
   * 处理离开消息
   */
  private handleLeave(message: CollaborationMessage): void {
    const { userId } = message.data as { userId: string };
    const collaborator = this.collaborators.get(userId);
    this.collaborators.delete(userId);
    if (collaborator) {
      this.emit('collaborator_leave', { collaborator });
    }
  }

  /**
   * 处理光标移动
   */
  private handleCursorMove(message: CollaborationMessage): void {
    const { cursor } = message.data as { cursor: CursorPosition };
    const collaborator = this.collaborators.get(message.senderId);
    if (collaborator) {
      collaborator.cursor = cursor;
      collaborator.lastActiveAt = Date.now();
      this.emit('cursor_update', { userId: message.senderId, cursor });
    }
  }

  /**
   * 处理选区变化
   */
  private handleSelection(message: CollaborationMessage): void {
    const { selection } = message.data as { selection: SelectionRange | null };
    const collaborator = this.collaborators.get(message.senderId);
    if (collaborator) {
      collaborator.selection = selection || undefined;
      collaborator.lastActiveAt = Date.now();
      this.emit('selection_update', { userId: message.senderId, selection });
    }
  }

  /**
   * 处理操作同步
   */
  private handleOperation(message: CollaborationMessage): void {
    const { operations } = message.data as { operations: CollaborationOperation[] };

    operations.forEach(op => {
      // 检测冲突
      if (op.version <= this.serverVersion) {
        this.emit('conflict_detected', { operation: op });
        return;
      }

      this.serverVersion = Math.max(this.serverVersion, op.version);
      this.emit('operation_received', { operation: op });
    });
  }

  /**
   * 处理存在信息
   */
  private handlePresence(message: CollaborationMessage): void {
    const { user } = message.data as { user: Collaborator };
    this.collaborators.set(user.userId, {
      ...user,
      lastActiveAt: Date.now()
    });
  }

  /**
   * 处理同步请求
   */
  private handleSyncRequest(message: CollaborationMessage): void {
    const { version } = message.data as { version: number };

    // 发送当前版本之后的所有待处理操作
    const relevantOps = this.pendingOperations.filter(op => op.version > version);

    if (relevantOps.length > 0 && this.currentUser && this.currentResource) {
      this.broadcastMessage({
        type: 'sync_response',
        senderId: this.currentUser.userId,
        resourceType: this.currentResource.type,
        resourceId: this.currentResource.id,
        data: {
          operations: relevantOps,
          version: this.localVersion
        },
        timestamp: Date.now()
      });
    }
  }

  /**
   * 处理同步响应
   */
  private handleSyncResponse(message: CollaborationMessage): void {
    const { operations, version } = message.data as {
      operations: CollaborationOperation[];
      version: number;
    };

    // 应用缺失的操作
    operations.forEach(op => {
      if (op.version > this.serverVersion) {
        this.serverVersion = op.version;
        this.emit('operation_received', { operation: op });
      }
    });

    this.emit('sync_complete', { version });
  }

  /**
   * 处理锁定消息
   */
  private handleLock(message: CollaborationMessage): void {
    const { lock } = message.data as { lock: ResourceLock };
    const key = `${lock.resourceType}:${lock.resourceId}`;
    this.locks.set(key, lock);
  }

  /**
   * 处理解锁消息
   */
  private handleUnlock(message: CollaborationMessage): void {
    const { resourceType, resourceId } = message.data as {
      resourceType: string;
      resourceId: string;
    };
    const key = `${resourceType}:${resourceId}`;
    this.locks.delete(key);
  }

  /**
   * 获取当前协作者列表
   */
  getCollaborators(): Collaborator[] {
    return Array.from(this.collaborators.values());
  }

  /**
   * 获取当前用户
   */
  getCurrentUser(): Collaborator | null {
    return this.currentUser;
  }

  /**
   * 获取当前资源
   */
  getCurrentResource(): { type: string; id: string } | null {
    return this.currentResource;
  }

  /**
   * 获取协作状态
   */
  getState(): CollaborationState | null {
    if (!this.currentResource || !this.currentUser) return null;

    return {
      sessionId: `collab_${this.currentUser.userId}_${this.currentResource.id}`,
      resourceType: this.currentResource.type,
      resourceId: this.currentResource.id,
      collaborators: this.getCollaborators(),
      isConnected: this.isConnected,
      lastSyncAt: Date.now()
    };
  }

  /**
   * 注册事件监听器
   */
  on(event: CollaborationEventType, callback: CollaborationEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * 触发事件
   */
  private emit(type: CollaborationEventType, data?: unknown): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, data });
        } catch (error) {
          console.error('[CollaborationService] 事件回调错误:', error);
        }
      });
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
    }
    if (this.operationBatchTimeout) {
      clearTimeout(this.operationBatchTimeout);
    }
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
    }
    this.collaborators.clear();
    this.eventListeners.clear();
    this.initialized = false;
  }
}

// 导出单例
export const collaborationService = new CollaborationService();

// 导出便捷函数
export const initCollaboration = (user: { userId: string; username: string; avatar?: string }) =>
  collaborationService.init(user);
export const joinCollaboration = (resourceType: string, resourceId: string) =>
  collaborationService.join(resourceType, resourceId);
export const leaveCollaboration = () => collaborationService.leave();
export const getCollaborators = () => collaborationService.getCollaborators();

export default collaborationService;
