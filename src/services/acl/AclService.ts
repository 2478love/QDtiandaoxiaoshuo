/**
 * @fileoverview 访问控制列表服务
 * @module services/acl/AclService
 * @description 提供基于角色的访问控制（RBAC）和权限管理功能
 * @version 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * 资源类型
 */
export type ResourceType =
  | 'novel'      // 小说
  | 'chapter'    // 章节
  | 'volume'     // 卷
  | 'character'  // 角色
  | 'worldview'  // 世界观
  | 'outline'    // 大纲
  | 'timeline'   // 时间线
  | 'mindmap'    // 思维导图
  | 'template'   // 模板
  | 'prompt'     // 提示词
  | 'workspace'; // 工作区

/**
 * 操作类型
 */
export type ActionType =
  | 'create'  // 创建
  | 'read'    // 读取
  | 'update'  // 更新
  | 'delete'  // 删除
  | 'share'   // 分享
  | 'export'  // 导出
  | 'import'  // 导入
  | 'manage'; // 管理（包含所有权限）

/**
 * 角色类型
 */
export type RoleType =
  | 'owner'    // 所有者（完全控制）
  | 'admin'    // 管理员（除转让所有权外的所有权限）
  | 'editor'   // 编辑者（创建、读取、更新）
  | 'viewer'   // 查看者（只读）
  | 'guest';   // 访客（受限只读）

/**
 * 权限定义
 */
export interface Permission {
  /** 资源类型 */
  resource: ResourceType;
  /** 允许的操作 */
  actions: ActionType[];
}

/**
 * 角色权限配置
 */
export interface RolePermissions {
  /** 角色类型 */
  role: RoleType;
  /** 角色名称 */
  name: string;
  /** 角色描述 */
  description: string;
  /** 权限列表 */
  permissions: Permission[];
}

/**
 * 访问控制条目
 */
export interface AclEntry {
  /** 条目 ID */
  id: string;
  /** 用户 ID */
  userId: string;
  /** 资源类型 */
  resourceType: ResourceType;
  /** 资源 ID */
  resourceId: string;
  /** 角色 */
  role: RoleType;
  /** 授权者 ID */
  grantedBy: string;
  /** 授权时间 */
  grantedAt: number;
  /** 过期时间（可选） */
  expiresAt?: number;
  /** 额外权限（覆盖角色默认权限） */
  additionalPermissions?: ActionType[];
  /** 移除的权限（从角色默认权限中移除） */
  removedPermissions?: ActionType[];
}

/**
 * 权限检查结果
 */
export interface PermissionCheckResult {
  /** 是否允许 */
  allowed: boolean;
  /** 原因说明 */
  reason: string;
  /** 匹配的 ACL 条目 */
  matchedEntry?: AclEntry;
  /** 有效角色 */
  effectiveRole?: RoleType;
}

/**
 * ACL 事件类型
 */
export type AclEventType =
  | 'granted'   // 权限授予
  | 'revoked'   // 权限撤销
  | 'updated'   // 权限更新
  | 'expired'   // 权限过期
  | 'denied';   // 访问拒绝

/**
 * ACL 事件回调
 */
export type AclEventCallback = (event: {
  type: AclEventType;
  data: {
    userId: string;
    resourceType: ResourceType;
    resourceId: string;
    action?: ActionType;
    entry?: AclEntry;
  };
}) => void;

// ==================== 常量定义 ====================

const ACL_STORAGE_KEY = 'tiandao_acl_entries';
const ROLE_HIERARCHY: Record<RoleType, number> = {
  owner: 100,
  admin: 80,
  editor: 60,
  viewer: 40,
  guest: 20
};

/**
 * 默认角色权限配置
 */
const DEFAULT_ROLE_PERMISSIONS: RolePermissions[] = [
  {
    role: 'owner',
    name: '所有者',
    description: '拥有资源的完全控制权，包括转让所有权',
    permissions: [
      { resource: 'novel', actions: ['create', 'read', 'update', 'delete', 'share', 'export', 'import', 'manage'] },
      { resource: 'chapter', actions: ['create', 'read', 'update', 'delete', 'share', 'export', 'import', 'manage'] },
      { resource: 'volume', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'character', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'worldview', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'outline', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'timeline', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'mindmap', actions: ['create', 'read', 'update', 'delete', 'manage'] },
      { resource: 'template', actions: ['create', 'read', 'update', 'delete', 'share', 'manage'] },
      { resource: 'prompt', actions: ['create', 'read', 'update', 'delete', 'share', 'manage'] },
      { resource: 'workspace', actions: ['create', 'read', 'update', 'delete', 'share', 'manage'] }
    ]
  },
  {
    role: 'admin',
    name: '管理员',
    description: '拥有除转让所有权外的所有管理权限',
    permissions: [
      { resource: 'novel', actions: ['create', 'read', 'update', 'delete', 'share', 'export', 'import'] },
      { resource: 'chapter', actions: ['create', 'read', 'update', 'delete', 'share', 'export', 'import'] },
      { resource: 'volume', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'character', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'worldview', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'outline', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'timeline', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'mindmap', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'template', actions: ['create', 'read', 'update', 'delete', 'share'] },
      { resource: 'prompt', actions: ['create', 'read', 'update', 'delete', 'share'] },
      { resource: 'workspace', actions: ['read', 'update', 'share'] }
    ]
  },
  {
    role: 'editor',
    name: '编辑者',
    description: '可以创建、编辑和查看内容',
    permissions: [
      { resource: 'novel', actions: ['read', 'update'] },
      { resource: 'chapter', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'volume', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'character', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'worldview', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'outline', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'timeline', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'mindmap', actions: ['create', 'read', 'update', 'delete'] },
      { resource: 'template', actions: ['read'] },
      { resource: 'prompt', actions: ['read'] },
      { resource: 'workspace', actions: ['read'] }
    ]
  },
  {
    role: 'viewer',
    name: '查看者',
    description: '只能查看内容，无法编辑',
    permissions: [
      { resource: 'novel', actions: ['read'] },
      { resource: 'chapter', actions: ['read'] },
      { resource: 'volume', actions: ['read'] },
      { resource: 'character', actions: ['read'] },
      { resource: 'worldview', actions: ['read'] },
      { resource: 'outline', actions: ['read'] },
      { resource: 'timeline', actions: ['read'] },
      { resource: 'mindmap', actions: ['read'] },
      { resource: 'template', actions: ['read'] },
      { resource: 'prompt', actions: ['read'] },
      { resource: 'workspace', actions: ['read'] }
    ]
  },
  {
    role: 'guest',
    name: '访客',
    description: '受限的只读访问',
    permissions: [
      { resource: 'novel', actions: ['read'] },
      { resource: 'chapter', actions: ['read'] }
    ]
  }
];

// ==================== ACL 服务类 ====================

/**
 * 访问控制列表服务
 *
 * @description
 * 提供以下功能：
 * 1. 基于角色的访问控制（RBAC）
 * 2. 细粒度权限管理
 * 3. 权限继承和覆盖
 * 4. 权限过期管理
 * 5. 访问审计日志
 *
 * @example
 * // 授予权限
 * aclService.grant({
 *   userId: 'user_123',
 *   resourceType: 'novel',
 *   resourceId: 'novel_456',
 *   role: 'editor',
 *   grantedBy: 'owner_789'
 * });
 *
 * // 检查权限
 * const result = aclService.check('user_123', 'novel', 'novel_456', 'update');
 * if (result.allowed) {
 *   // 执行更新操作
 * }
 */
class AclService {
  private entries: Map<string, AclEntry> = new Map();
  private eventListeners: Map<AclEventType, Set<AclEventCallback>> = new Map();
  private currentUserId: string = '';
  private initialized: boolean = false;

  /**
   * 初始化 ACL 服务
   */
  init(currentUserId: string): void {
    if (this.initialized && this.currentUserId === currentUserId) return;

    this.currentUserId = currentUserId;
    this.loadFromStorage();
    this.cleanExpiredEntries();
    this.initialized = true;
    console.log('[AclService] 初始化完成');
  }

  /**
   * 从存储加载 ACL 条目
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(ACL_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as AclEntry[];
        this.entries.clear();
        data.forEach(entry => {
          this.entries.set(this.getEntryKey(entry.userId, entry.resourceType, entry.resourceId), entry);
        });
      }
    } catch (error) {
      console.error('[AclService] 加载 ACL 数据失败:', error);
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const data = Array.from(this.entries.values());
      localStorage.setItem(ACL_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('[AclService] 保存 ACL 数据失败:', error);
    }
  }

  /**
   * 生成条目键
   */
  private getEntryKey(userId: string, resourceType: ResourceType, resourceId: string): string {
    return `${userId}:${resourceType}:${resourceId}`;
  }

  /**
   * 清理过期条目
   */
  private cleanExpiredEntries(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.entries.forEach((entry, key) => {
      if (entry.expiresAt && entry.expiresAt < now) {
        expiredKeys.push(key);
        this.emit('expired', {
          userId: entry.userId,
          resourceType: entry.resourceType,
          resourceId: entry.resourceId,
          entry
        });
      }
    });

    expiredKeys.forEach(key => this.entries.delete(key));
    if (expiredKeys.length > 0) {
      this.saveToStorage();
    }
  }

  /**
   * 获取角色权限配置
   *
   * @param role - 角色类型
   * @returns 角色权限配置
   */
  getRolePermissions(role: RoleType): RolePermissions | undefined {
    return DEFAULT_ROLE_PERMISSIONS.find(rp => rp.role === role);
  }

  /**
   * 获取所有角色配置
   */
  getAllRoles(): RolePermissions[] {
    return [...DEFAULT_ROLE_PERMISSIONS];
  }

  /**
   * 授予权限
   *
   * @param params - 授权参数
   * @returns 创建的 ACL 条目
   *
   * @example
   * const entry = aclService.grant({
   *   userId: 'user_123',
   *   resourceType: 'novel',
   *   resourceId: 'novel_456',
   *   role: 'editor',
   *   grantedBy: 'owner_789'
   * });
   */
  grant(params: {
    userId: string;
    resourceType: ResourceType;
    resourceId: string;
    role: RoleType;
    grantedBy: string;
    expiresAt?: number;
    additionalPermissions?: ActionType[];
    removedPermissions?: ActionType[];
  }): AclEntry {
    const { userId, resourceType, resourceId, role, grantedBy, expiresAt, additionalPermissions, removedPermissions } = params;

    // 验证授权者权限
    const granterCheck = this.check(grantedBy, resourceType, resourceId, 'manage');
    if (!granterCheck.allowed) {
      // 如果不是 manage 权限，至少需要 share 权限
      const shareCheck = this.check(grantedBy, resourceType, resourceId, 'share');
      if (!shareCheck.allowed) {
        throw new Error(`授权者 ${grantedBy} 没有权限授予访问权`);
      }
      // 有 share 权限的用户只能授予低于自己角色的权限
      if (granterCheck.effectiveRole) {
        const granterLevel = ROLE_HIERARCHY[granterCheck.effectiveRole];
        const targetLevel = ROLE_HIERARCHY[role];
        if (targetLevel >= granterLevel) {
          throw new Error('不能授予高于或等于自己的角色权限');
        }
      }
    }

    const entry: AclEntry = {
      id: `acl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId,
      resourceType,
      resourceId,
      role,
      grantedBy,
      grantedAt: Date.now(),
      expiresAt,
      additionalPermissions,
      removedPermissions
    };

    const key = this.getEntryKey(userId, resourceType, resourceId);
    this.entries.set(key, entry);
    this.saveToStorage();

    this.emit('granted', {
      userId,
      resourceType,
      resourceId,
      entry
    });

    return entry;
  }

  /**
   * 撤销权限
   *
   * @param userId - 用户 ID
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @param revokedBy - 撤销者 ID
   */
  revoke(userId: string, resourceType: ResourceType, resourceId: string, revokedBy: string): boolean {
    // 验证撤销者权限
    const revokerCheck = this.check(revokedBy, resourceType, resourceId, 'manage');
    if (!revokerCheck.allowed) {
      throw new Error(`撤销者 ${revokedBy} 没有权限撤销访问权`);
    }

    const key = this.getEntryKey(userId, resourceType, resourceId);
    const entry = this.entries.get(key);

    if (!entry) {
      return false;
    }

    // 不能撤销所有者的权限
    if (entry.role === 'owner' && entry.userId !== revokedBy) {
      throw new Error('不能撤销所有者的权限');
    }

    this.entries.delete(key);
    this.saveToStorage();

    this.emit('revoked', {
      userId,
      resourceType,
      resourceId,
      entry
    });

    return true;
  }

  /**
   * 更新权限
   *
   * @param userId - 用户 ID
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @param updates - 更新内容
   * @param updatedBy - 更新者 ID
   */
  update(
    userId: string,
    resourceType: ResourceType,
    resourceId: string,
    updates: Partial<Pick<AclEntry, 'role' | 'expiresAt' | 'additionalPermissions' | 'removedPermissions'>>,
    updatedBy: string
  ): AclEntry | null {
    const key = this.getEntryKey(userId, resourceType, resourceId);
    const entry = this.entries.get(key);

    if (!entry) {
      return null;
    }

    // 验证更新者权限
    const updaterCheck = this.check(updatedBy, resourceType, resourceId, 'manage');
    if (!updaterCheck.allowed) {
      throw new Error(`更新者 ${updatedBy} 没有权限修改访问权`);
    }

    // 不能修改所有者的角色
    if (entry.role === 'owner' && updates.role && updates.role !== 'owner') {
      throw new Error('不能修改所有者的角色');
    }

    const updatedEntry: AclEntry = {
      ...entry,
      ...updates
    };

    this.entries.set(key, updatedEntry);
    this.saveToStorage();

    this.emit('updated', {
      userId,
      resourceType,
      resourceId,
      entry: updatedEntry
    });

    return updatedEntry;
  }

  /**
   * 检查权限
   *
   * @param userId - 用户 ID
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @param action - 操作类型
   * @returns 权限检查结果
   *
   * @example
   * const result = aclService.check('user_123', 'novel', 'novel_456', 'update');
   * if (result.allowed) {
   *   // 允许操作
   * } else {
   *   console.log('拒绝原因:', result.reason);
   * }
   */
  check(userId: string, resourceType: ResourceType, resourceId: string, action: ActionType): PermissionCheckResult {
    // 清理过期条目
    this.cleanExpiredEntries();

    const key = this.getEntryKey(userId, resourceType, resourceId);
    const entry = this.entries.get(key);

    if (!entry) {
      this.emit('denied', {
        userId,
        resourceType,
        resourceId,
        action
      });
      return {
        allowed: false,
        reason: '未找到访问权限'
      };
    }

    // 检查是否过期
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.emit('denied', {
        userId,
        resourceType,
        resourceId,
        action
      });
      return {
        allowed: false,
        reason: '权限已过期',
        matchedEntry: entry,
        effectiveRole: entry.role
      };
    }

    // 获取角色默认权限
    const roleConfig = this.getRolePermissions(entry.role);
    if (!roleConfig) {
      return {
        allowed: false,
        reason: '无效的角色',
        matchedEntry: entry,
        effectiveRole: entry.role
      };
    }

    // 查找资源权限
    const resourcePermission = roleConfig.permissions.find(p => p.resource === resourceType);
    let allowedActions = resourcePermission?.actions || [];

    // 应用额外权限
    if (entry.additionalPermissions) {
      allowedActions = [...new Set([...allowedActions, ...entry.additionalPermissions])];
    }

    // 应用移除的权限
    if (entry.removedPermissions) {
      allowedActions = allowedActions.filter(a => !entry.removedPermissions!.includes(a));
    }

    // 检查是否包含 manage 权限（manage 包含所有权限）
    if (allowedActions.includes('manage')) {
      return {
        allowed: true,
        reason: '拥有管理权限',
        matchedEntry: entry,
        effectiveRole: entry.role
      };
    }

    // 检查具体操作权限
    const allowed = allowedActions.includes(action);

    if (!allowed) {
      this.emit('denied', {
        userId,
        resourceType,
        resourceId,
        action
      });
    }

    return {
      allowed,
      reason: allowed ? '权限验证通过' : `没有 ${action} 权限`,
      matchedEntry: entry,
      effectiveRole: entry.role
    };
  }

  /**
   * 批量检查权限
   *
   * @param userId - 用户 ID
   * @param checks - 检查列表
   * @returns 检查结果映射
   */
  checkBatch(
    userId: string,
    checks: Array<{ resourceType: ResourceType; resourceId: string; action: ActionType }>
  ): Map<string, PermissionCheckResult> {
    const results = new Map<string, PermissionCheckResult>();

    checks.forEach(({ resourceType, resourceId, action }) => {
      const key = `${resourceType}:${resourceId}:${action}`;
      results.set(key, this.check(userId, resourceType, resourceId, action));
    });

    return results;
  }

  /**
   * 获取用户对资源的所有权限
   *
   * @param userId - 用户 ID
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @returns 允许的操作列表
   */
  getPermissions(userId: string, resourceType: ResourceType, resourceId: string): ActionType[] {
    const key = this.getEntryKey(userId, resourceType, resourceId);
    const entry = this.entries.get(key);

    if (!entry || (entry.expiresAt && entry.expiresAt < Date.now())) {
      return [];
    }

    const roleConfig = this.getRolePermissions(entry.role);
    if (!roleConfig) {
      return [];
    }

    const resourcePermission = roleConfig.permissions.find(p => p.resource === resourceType);
    let allowedActions = resourcePermission?.actions || [];

    if (entry.additionalPermissions) {
      allowedActions = [...new Set([...allowedActions, ...entry.additionalPermissions])];
    }

    if (entry.removedPermissions) {
      allowedActions = allowedActions.filter(a => !entry.removedPermissions!.includes(a));
    }

    return allowedActions;
  }

  /**
   * 获取资源的所有访问者
   *
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @returns ACL 条目列表
   */
  getResourceAccessors(resourceType: ResourceType, resourceId: string): AclEntry[] {
    const accessors: AclEntry[] = [];

    this.entries.forEach(entry => {
      if (entry.resourceType === resourceType && entry.resourceId === resourceId) {
        if (!entry.expiresAt || entry.expiresAt >= Date.now()) {
          accessors.push(entry);
        }
      }
    });

    return accessors.sort((a, b) => ROLE_HIERARCHY[b.role] - ROLE_HIERARCHY[a.role]);
  }

  /**
   * 获取用户的所有访问权限
   *
   * @param userId - 用户 ID
   * @returns ACL 条目列表
   */
  getUserAccess(userId: string): AclEntry[] {
    const access: AclEntry[] = [];

    this.entries.forEach(entry => {
      if (entry.userId === userId) {
        if (!entry.expiresAt || entry.expiresAt >= Date.now()) {
          access.push(entry);
        }
      }
    });

    return access;
  }

  /**
   * 转让所有权
   *
   * @param resourceType - 资源类型
   * @param resourceId - 资源 ID
   * @param currentOwnerId - 当前所有者 ID
   * @param newOwnerId - 新所有者 ID
   */
  transferOwnership(
    resourceType: ResourceType,
    resourceId: string,
    currentOwnerId: string,
    newOwnerId: string
  ): void {
    // 验证当前所有者
    const currentOwnerCheck = this.check(currentOwnerId, resourceType, resourceId, 'manage');
    if (!currentOwnerCheck.allowed || currentOwnerCheck.effectiveRole !== 'owner') {
      throw new Error('只有所有者可以转让所有权');
    }

    // 撤销当前所有者权限
    const currentKey = this.getEntryKey(currentOwnerId, resourceType, resourceId);
    const currentEntry = this.entries.get(currentKey);

    // 将当前所有者降级为管理员
    if (currentEntry) {
      currentEntry.role = 'admin';
      this.entries.set(currentKey, currentEntry);
    }

    // 授予新所有者权限
    this.grant({
      userId: newOwnerId,
      resourceType,
      resourceId,
      role: 'owner',
      grantedBy: currentOwnerId
    });
  }

  /**
   * 注册事件监听器
   *
   * @param event - 事件类型
   * @param callback - 回调函数
   * @returns 取消订阅函数
   */
  on(event: AclEventType, callback: AclEventCallback): () => void {
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
  private emit(type: AclEventType, data: {
    userId: string;
    resourceType: ResourceType;
    resourceId: string;
    action?: ActionType;
    entry?: AclEntry;
  }): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, data });
        } catch (error) {
          console.error('[AclService] 事件回调错误:', error);
        }
      });
    }
  }

  /**
   * 获取当前用户 ID
   */
  getCurrentUserId(): string {
    return this.currentUserId;
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    this.entries.clear();
    this.eventListeners.clear();
    this.initialized = false;
  }
}

// 导出单例
export const aclService = new AclService();

// 导出便捷函数
export const initAcl = (userId: string) => aclService.init(userId);
export const checkPermission = (
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  action: ActionType
) => aclService.check(userId, resourceType, resourceId, action);
export const grantAccess = (params: Parameters<typeof aclService.grant>[0]) => aclService.grant(params);
export const revokeAccess = (
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  revokedBy: string
) => aclService.revoke(userId, resourceType, resourceId, revokedBy);

export default aclService;
