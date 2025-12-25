/**
 * @fileoverview 离线数据同步服务
 * @module services/sync/SyncService
 * @description 提供离线数据检测、队列管理和自动同步功能
 * @version 1.0.0
 */

import { storage } from '../storage/StorageService';
import { createId } from '../../utils/id';

// ==================== 类型定义 ====================

/**
 * 同步操作类型
 */
export type SyncOperationType = 'create' | 'update' | 'delete';

/**
 * 同步状态
 */
export type SyncStatus = 'pending' | 'syncing' | 'completed' | 'failed';

/**
 * 同步项目接口
 */
export interface SyncItem {
  /** 唯一标识 */
  id: string;
  /** 数据键名 */
  key: string;
  /** 操作类型 */
  operation: SyncOperationType;
  /** 待同步数据 */
  data: unknown;
  /** 创建时间 */
  createdAt: string;
  /** 同步状态 */
  status: SyncStatus;
  /** 重试次数 */
  retryCount: number;
  /** 最后尝试时间 */
  lastAttemptAt?: string;
  /** 错误信息 */
  errorMessage?: string;
}

/**
 * 同步队列状态
 */
export interface SyncQueueState {
  /** 待同步项目数 */
  pendingCount: number;
  /** 同步中项目数 */
  syncingCount: number;
  /** 失败项目数 */
  failedCount: number;
  /** 是否在线 */
  isOnline: boolean;
  /** 最后同步时间 */
  lastSyncAt?: string;
}

/**
 * 同步事件类型
 */
export type SyncEventType =
  | 'online'      // 恢复在线
  | 'offline'     // 变为离线
  | 'syncStart'   // 开始同步
  | 'syncComplete'// 同步完成
  | 'syncFailed'  // 同步失败
  | 'queueChange';// 队列变化

/**
 * 同步事件回调
 */
export type SyncEventCallback = (event: {
  type: SyncEventType;
  data?: unknown;
}) => void;

// ==================== 常量定义 ====================

const SYNC_QUEUE_KEY = 'tiandao_sync_queue';
const SYNC_STATE_KEY = 'tiandao_sync_state';
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 5000;
const SYNC_BATCH_SIZE = 10;

// ==================== 同步服务类 ====================

/**
 * 离线数据同步服务
 *
 * @description
 * 提供以下功能：
 * 1. 在线状态检测和监听
 * 2. 离线操作队列管理
 * 3. 恢复在线时自动同步
 * 4. 同步失败重试机制
 * 5. 同步状态事件通知
 *
 * @example
 * // 初始化同步服务
 * await syncService.init();
 *
 * // 监听同步事件
 * syncService.on('syncComplete', (event) => {
 *   console.log('同步完成', event.data);
 * });
 *
 * // 添加待同步项
 * syncService.addToQueue('novels', 'update', novelData);
 */
class SyncService {
  private queue: SyncItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private eventListeners: Map<SyncEventType, Set<SyncEventCallback>> = new Map();
  private initialized: boolean = false;
  private syncTimeout: ReturnType<typeof setTimeout> | null = null;

  /**
   * 初始化同步服务
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // 加载持久化的队列
    await this.loadQueue();

    // 设置在线状态监听
    this.setupOnlineListeners();

    // 初始状态检查
    this.isOnline = navigator.onLine;

    // 如果在线且有待同步项，开始同步
    if (this.isOnline && this.getPendingItems().length > 0) {
      this.scheduleSync();
    }

    this.initialized = true;
    console.log('[SyncService] 初始化完成', {
      isOnline: this.isOnline,
      pendingItems: this.getPendingItems().length
    });
  }

  /**
   * 设置在线状态监听器
   */
  private setupOnlineListeners(): void {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // 页面可见性变化时检查同步
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.scheduleSync();
      }
    });
  }

  /**
   * 处理在线事件
   */
  private handleOnline(): void {
    this.isOnline = true;
    this.emit('online', { timestamp: new Date().toISOString() });
    console.log('[SyncService] 恢复在线');

    // 开始同步
    this.scheduleSync();
  }

  /**
   * 处理离线事件
   */
  private handleOffline(): void {
    this.isOnline = false;
    this.emit('offline', { timestamp: new Date().toISOString() });
    console.log('[SyncService] 变为离线');

    // 取消待执行的同步
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
      this.syncTimeout = null;
    }
  }

  /**
   * 加载持久化的队列
   */
  private async loadQueue(): Promise<void> {
    try {
      const savedQueue = await storage.get<SyncItem[]>(SYNC_QUEUE_KEY, []);
      this.queue = savedQueue;
    } catch (error) {
      console.error('[SyncService] 加载队列失败:', error);
      this.queue = [];
    }
  }

  /**
   * 保存队列到持久化存储
   */
  private async saveQueue(): Promise<void> {
    try {
      await storage.set(SYNC_QUEUE_KEY, this.queue);
    } catch (error) {
      console.error('[SyncService] 保存队列失败:', error);
    }
  }

  /**
   * 添加项目到同步队列
   *
   * @param key - 数据键名
   * @param operation - 操作类型
   * @param data - 数据内容
   */
  async addToQueue(key: string, operation: SyncOperationType, data: unknown): Promise<string> {
    const item: SyncItem = {
      id: createId(),
      key,
      operation,
      data,
      createdAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    };

    // 检查是否有相同 key 的待处理项，进行合并
    const existingIndex = this.queue.findIndex(
      q => q.key === key && q.status === 'pending'
    );

    if (existingIndex !== -1) {
      // 更新现有项
      this.queue[existingIndex] = {
        ...this.queue[existingIndex],
        operation: operation === 'delete' ? 'delete' : this.queue[existingIndex].operation === 'create' ? 'create' : 'update',
        data,
        createdAt: new Date().toISOString()
      };
    } else {
      this.queue.push(item);
    }

    await this.saveQueue();
    this.emit('queueChange', this.getQueueState());

    // 如果在线，立即尝试同步
    if (this.isOnline && !this.isSyncing) {
      this.scheduleSync(100);
    }

    return item.id;
  }

  /**
   * 调度同步任务
   */
  private scheduleSync(delay: number = 1000): void {
    if (this.syncTimeout) {
      clearTimeout(this.syncTimeout);
    }

    this.syncTimeout = setTimeout(() => {
      this.syncTimeout = null;
      this.performSync();
    }, delay);
  }

  /**
   * 执行同步
   */
  private async performSync(): Promise<void> {
    if (this.isSyncing || !this.isOnline) return;

    const pendingItems = this.getPendingItems();
    if (pendingItems.length === 0) return;

    this.isSyncing = true;
    this.emit('syncStart', { count: pendingItems.length });

    const batch = pendingItems.slice(0, SYNC_BATCH_SIZE);
    const results: { success: number; failed: number } = { success: 0, failed: 0 };

    for (const item of batch) {
      try {
        // 更新状态为同步中
        item.status = 'syncing';
        item.lastAttemptAt = new Date().toISOString();

        // 执行实际的数据保存
        await this.syncItem(item);

        // 标记为完成并从队列移除
        item.status = 'completed';
        this.queue = this.queue.filter(q => q.id !== item.id);
        results.success++;

      } catch (error) {
        item.retryCount++;
        item.errorMessage = error instanceof Error ? error.message : '未知错误';

        if (item.retryCount >= MAX_RETRY_COUNT) {
          item.status = 'failed';
          results.failed++;
        } else {
          item.status = 'pending';
        }

        console.error('[SyncService] 同步项失败:', item.key, error);
      }
    }

    await this.saveQueue();
    this.isSyncing = false;

    // 更新同步状态
    const state = this.getQueueState();
    state.lastSyncAt = new Date().toISOString();

    if (results.failed > 0) {
      this.emit('syncFailed', { ...results, state });
    } else {
      this.emit('syncComplete', { ...results, state });
    }

    this.emit('queueChange', state);

    // 如果还有待处理项且在线，继续调度同步
    if (this.getPendingItems().length > 0 && this.isOnline) {
      this.scheduleSync(RETRY_DELAY_MS);
    }
  }

  /**
   * 同步单个项目
   */
  private async syncItem(item: SyncItem): Promise<void> {
    // 这里执行实际的数据同步逻辑
    // 在纯前端场景，主要是确保数据已保存到 IndexedDB/localStorage
    // 如果有远程服务器，这里会发送 HTTP 请求

    switch (item.operation) {
      case 'create':
      case 'update':
        await storage.set(item.key, item.data);
        break;
      case 'delete':
        await storage.remove(item.key);
        break;
    }
  }

  /**
   * 获取待处理项目
   */
  private getPendingItems(): SyncItem[] {
    return this.queue.filter(item => item.status === 'pending');
  }

  /**
   * 获取队列状态
   */
  getQueueState(): SyncQueueState {
    return {
      pendingCount: this.queue.filter(q => q.status === 'pending').length,
      syncingCount: this.queue.filter(q => q.status === 'syncing').length,
      failedCount: this.queue.filter(q => q.status === 'failed').length,
      isOnline: this.isOnline
    };
  }

  /**
   * 获取失败的项目
   */
  getFailedItems(): SyncItem[] {
    return this.queue.filter(item => item.status === 'failed');
  }

  /**
   * 重试失败的项目
   */
  async retryFailed(): Promise<void> {
    const failedItems = this.getFailedItems();

    for (const item of failedItems) {
      item.status = 'pending';
      item.retryCount = 0;
      item.errorMessage = undefined;
    }

    await this.saveQueue();
    this.emit('queueChange', this.getQueueState());

    if (this.isOnline) {
      this.scheduleSync();
    }
  }

  /**
   * 清除失败的项目
   */
  async clearFailed(): Promise<void> {
    this.queue = this.queue.filter(item => item.status !== 'failed');
    await this.saveQueue();
    this.emit('queueChange', this.getQueueState());
  }

  /**
   * 强制立即同步
   */
  async forceSync(): Promise<void> {
    if (!this.isOnline) {
      throw new Error('当前处于离线状态，无法同步');
    }

    await this.performSync();
  }

  /**
   * 检查是否在线
   */
  checkOnline(): boolean {
    return this.isOnline;
  }

  /**
   * 注册事件监听器
   */
  on(event: SyncEventType, callback: SyncEventCallback): () => void {
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
  private emit(type: SyncEventType, data?: unknown): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, data });
        } catch (error) {
          console.error('[SyncService] 事件回调错误:', error);
        }
      });
    }
  }
}

// 导出单例
export const syncService = new SyncService();

// 导出便捷函数
export const initSync = () => syncService.init();
export const addToSyncQueue = (key: string, operation: SyncOperationType, data: unknown) =>
  syncService.addToQueue(key, operation, data);
export const getSyncState = () => syncService.getQueueState();
export const forceSync = () => syncService.forceSync();
export const retryFailedSync = () => syncService.retryFailed();
export const clearFailedSync = () => syncService.clearFailed();
export const onSyncEvent = (event: SyncEventType, callback: SyncEventCallback) =>
  syncService.on(event, callback);

export default syncService;
