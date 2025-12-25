/**
 * @fileoverview 访问控制 Hook
 * @module hooks/useAcl
 * @description 提供访问控制功能的 React Hook
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  aclService,
  ResourceType,
  ActionType,
  RoleType,
  AclEntry,
  PermissionCheckResult,
  AclEventType
} from '../services/acl/AclService';

/**
 * ACL Hook 返回值
 */
export interface UseAclReturn {
  /** 检查权限 */
  can: (action: ActionType) => boolean;
  /** 获取完整的权限检查结果 */
  checkPermission: (action: ActionType) => PermissionCheckResult;
  /** 用户的有效角色 */
  role: RoleType | null;
  /** 允许的操作列表 */
  permissions: ActionType[];
  /** 是否为所有者 */
  isOwner: boolean;
  /** 是否可以管理 */
  canManage: boolean;
  /** 是否可以分享 */
  canShare: boolean;
  /** 授予权限 */
  grant: (userId: string, role: RoleType, options?: {
    expiresAt?: number;
    additionalPermissions?: ActionType[];
    removedPermissions?: ActionType[];
  }) => Promise<AclEntry>;
  /** 撤销权限 */
  revoke: (userId: string) => Promise<boolean>;
  /** 获取资源的所有访问者 */
  getAccessors: () => AclEntry[];
  /** 转让所有权 */
  transferOwnership: (newOwnerId: string) => Promise<void>;
}

/**
 * 资源访问控制 Hook
 *
 * @description
 * 提供针对特定资源的访问控制功能
 *
 * @param resourceType - 资源类型
 * @param resourceId - 资源 ID
 * @param userId - 用户 ID（可选，默认使用当前用户）
 *
 * @returns {UseAclReturn} ACL 操作方法
 *
 * @example
 * function NovelEditor({ novelId }: { novelId: string }) {
 *   const { can, isOwner, canManage } = useAcl('novel', novelId);
 *
 *   return (
 *     <div>
 *       {can('update') && <button>编辑</button>}
 *       {can('delete') && <button>删除</button>}
 *       {canManage && <button>管理权限</button>}
 *       {isOwner && <button>转让所有权</button>}
 *     </div>
 *   );
 * }
 */
export function useAcl(
  resourceType: ResourceType,
  resourceId: string,
  userId?: string
): UseAclReturn {
  const effectiveUserId = userId || aclService.getCurrentUserId();
  const [permissions, setPermissions] = useState<ActionType[]>([]);
  const [role, setRole] = useState<RoleType | null>(null);
  const [, forceUpdate] = useState({});

  // 加载权限
  useEffect(() => {
    const loadPermissions = () => {
      const perms = aclService.getPermissions(effectiveUserId, resourceType, resourceId);
      setPermissions(perms);

      // 获取角色
      const checkResult = aclService.check(effectiveUserId, resourceType, resourceId, 'read');
      setRole(checkResult.effectiveRole || null);
    };

    loadPermissions();

    // 订阅权限变化
    const unsubscribeGranted = aclService.on('granted', (event) => {
      if (event.data.userId === effectiveUserId &&
          event.data.resourceType === resourceType &&
          event.data.resourceId === resourceId) {
        loadPermissions();
      }
    });

    const unsubscribeRevoked = aclService.on('revoked', (event) => {
      if (event.data.userId === effectiveUserId &&
          event.data.resourceType === resourceType &&
          event.data.resourceId === resourceId) {
        loadPermissions();
      }
    });

    const unsubscribeUpdated = aclService.on('updated', (event) => {
      if (event.data.userId === effectiveUserId &&
          event.data.resourceType === resourceType &&
          event.data.resourceId === resourceId) {
        loadPermissions();
      }
    });

    return () => {
      unsubscribeGranted();
      unsubscribeRevoked();
      unsubscribeUpdated();
    };
  }, [effectiveUserId, resourceType, resourceId]);

  const can = useCallback((action: ActionType): boolean => {
    return aclService.check(effectiveUserId, resourceType, resourceId, action).allowed;
  }, [effectiveUserId, resourceType, resourceId]);

  const checkPermission = useCallback((action: ActionType): PermissionCheckResult => {
    return aclService.check(effectiveUserId, resourceType, resourceId, action);
  }, [effectiveUserId, resourceType, resourceId]);

  const isOwner = useMemo(() => role === 'owner', [role]);
  const canManage = useMemo(() => permissions.includes('manage'), [permissions]);
  const canShare = useMemo(() => permissions.includes('share') || canManage, [permissions, canManage]);

  const grant = useCallback(async (
    targetUserId: string,
    targetRole: RoleType,
    options?: {
      expiresAt?: number;
      additionalPermissions?: ActionType[];
      removedPermissions?: ActionType[];
    }
  ): Promise<AclEntry> => {
    return aclService.grant({
      userId: targetUserId,
      resourceType,
      resourceId,
      role: targetRole,
      grantedBy: effectiveUserId,
      ...options
    });
  }, [effectiveUserId, resourceType, resourceId]);

  const revoke = useCallback(async (targetUserId: string): Promise<boolean> => {
    return aclService.revoke(targetUserId, resourceType, resourceId, effectiveUserId);
  }, [effectiveUserId, resourceType, resourceId]);

  const getAccessors = useCallback((): AclEntry[] => {
    return aclService.getResourceAccessors(resourceType, resourceId);
  }, [resourceType, resourceId]);

  const transferOwnership = useCallback(async (newOwnerId: string): Promise<void> => {
    aclService.transferOwnership(resourceType, resourceId, effectiveUserId, newOwnerId);
    forceUpdate({});
  }, [effectiveUserId, resourceType, resourceId]);

  return {
    can,
    checkPermission,
    role,
    permissions,
    isOwner,
    canManage,
    canShare,
    grant,
    revoke,
    getAccessors,
    transferOwnership
  };
}

/**
 * 用户访问权限 Hook
 *
 * @description
 * 获取用户的所有访问权限
 *
 * @param userId - 用户 ID（可选，默认使用当前用户）
 *
 * @returns 用户的所有 ACL 条目
 *
 * @example
 * function UserAccessList() {
 *   const { access, refresh } = useUserAccess();
 *
 *   return (
 *     <ul>
 *       {access.map(entry => (
 *         <li key={entry.id}>
 *           {entry.resourceType}: {entry.resourceId} - {entry.role}
 *         </li>
 *       ))}
 *     </ul>
 *   );
 * }
 */
export function useUserAccess(userId?: string): {
  access: AclEntry[];
  refresh: () => void;
} {
  const effectiveUserId = userId || aclService.getCurrentUserId();
  const [access, setAccess] = useState<AclEntry[]>([]);

  const refresh = useCallback(() => {
    setAccess(aclService.getUserAccess(effectiveUserId));
  }, [effectiveUserId]);

  useEffect(() => {
    refresh();

    // 订阅变化
    const unsubscribeGranted = aclService.on('granted', (event) => {
      if (event.data.userId === effectiveUserId) {
        refresh();
      }
    });

    const unsubscribeRevoked = aclService.on('revoked', (event) => {
      if (event.data.userId === effectiveUserId) {
        refresh();
      }
    });

    return () => {
      unsubscribeGranted();
      unsubscribeRevoked();
    };
  }, [effectiveUserId, refresh]);

  return { access, refresh };
}

/**
 * 权限守卫 Hook
 *
 * @description
 * 用于在组件挂载时检查权限，如果没有权限则返回错误信息
 *
 * @param resourceType - 资源类型
 * @param resourceId - 资源 ID
 * @param requiredAction - 必需的操作权限
 *
 * @returns 权限检查结果
 *
 * @example
 * function ProtectedEditor({ novelId }: { novelId: string }) {
 *   const { allowed, loading, error } = usePermissionGuard('novel', novelId, 'update');
 *
 *   if (loading) return <Loading />;
 *   if (!allowed) return <AccessDenied message={error} />;
 *
 *   return <Editor novelId={novelId} />;
 * }
 */
export function usePermissionGuard(
  resourceType: ResourceType,
  resourceId: string,
  requiredAction: ActionType
): {
  allowed: boolean;
  loading: boolean;
  error: string | null;
  result: PermissionCheckResult | null;
} {
  const [state, setState] = useState<{
    allowed: boolean;
    loading: boolean;
    error: string | null;
    result: PermissionCheckResult | null;
  }>({
    allowed: false,
    loading: true,
    error: null,
    result: null
  });

  useEffect(() => {
    const userId = aclService.getCurrentUserId();
    const result = aclService.check(userId, resourceType, resourceId, requiredAction);

    setState({
      allowed: result.allowed,
      loading: false,
      error: result.allowed ? null : result.reason,
      result
    });
  }, [resourceType, resourceId, requiredAction]);

  return state;
}

/**
 * ACL 事件监听 Hook
 *
 * @param event - 事件类型
 * @param callback - 回调函数
 *
 * @example
 * useAclEvent('denied', (event) => {
 *   console.warn('访问被拒绝:', event.data);
 *   showToast('您没有权限执行此操作');
 * });
 */
export function useAclEvent(
  event: AclEventType,
  callback: (event: { type: AclEventType; data: unknown }) => void
): void {
  useEffect(() => {
    const unsubscribe = aclService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

/**
 * 批量权限检查 Hook
 *
 * @description
 * 一次性检查多个权限，减少重复调用
 *
 * @param checks - 需要检查的权限列表
 *
 * @returns 权限检查结果映射
 *
 * @example
 * function Toolbar({ novelId, chapterId }: Props) {
 *   const permissions = useBatchPermissions([
 *     { resourceType: 'novel', resourceId: novelId, action: 'update' },
 *     { resourceType: 'novel', resourceId: novelId, action: 'delete' },
 *     { resourceType: 'chapter', resourceId: chapterId, action: 'update' },
 *   ]);
 *
 *   const canEditNovel = permissions.get('novel:novelId:update')?.allowed;
 *   // ...
 * }
 */
export function useBatchPermissions(
  checks: Array<{ resourceType: ResourceType; resourceId: string; action: ActionType }>
): Map<string, PermissionCheckResult> {
  const [results, setResults] = useState<Map<string, PermissionCheckResult>>(new Map());

  useEffect(() => {
    const userId = aclService.getCurrentUserId();
    const newResults = aclService.checkBatch(userId, checks);
    setResults(newResults);
  }, [JSON.stringify(checks)]);

  return results;
}

export default useAcl;
