/**
 * @fileoverview React Hooks 统一导出模块
 * @module hooks
 * @description 天道 AI 写作助手的自定义 React Hooks 集合
 * @version 1.0.0
 *
 * @hooks
 * - usePersistentState: 持久化状态管理
 * - useAutoSave: 自动保存功能
 * - useUndoRedo: 撤销/重做功能
 * - useDebounce: 防抖/节流工具
 * - useKeyboardShortcuts: 键盘快捷键
 * - useOnlineStatus: 在线状态检测
 * - useVersionHistory: 版本历史管理
 * - useWritingRecord: 写作统计记录
 * - useSession: 会话管理
 * - useSync: 离线同步
 * - usePerformance: 性能监测
 * - useAcl: 访问控制
 * - useCollaboration: 多人协作
 * - useExport: 文档导出
 */

export { usePersistentState, usePersistentStateWithLoading, forceSaveAll, getPendingSaveCount } from './usePersistentState';
export { useAsyncPersistentState } from './useAsyncPersistentState';
export { useUndoRedo } from './useUndoRedo';
export { useAutoSave } from './useAutoSave';
export { useKeyboardShortcuts, commonShortcuts, formatShortcut, getModifierSymbol } from './useKeyboardShortcuts';
export { useOnlineStatus } from './useOnlineStatus';
export {
  useDebouncedValue,
  useDebouncedCallback,
  useThrottledCallback,
  useDebouncedState,
  useDebouncedSearch,
  useBatchedUpdates,
} from './useDebounce';
export { useVersionHistory } from './useVersionHistory';
export { useWritingRecord } from './useWritingRecord';
export { useSession, useSessionState, useUserId } from './useSession';
export { useSync, useSyncEvent } from './useSync';
export { usePerformance, useRenderTracking, usePerformanceEvent, useApiTracking } from './usePerformance';
export { useAcl, useUserAccess, usePermissionGuard, useAclEvent, useBatchPermissions } from './useAcl';
export {
  useCollaboration,
  useCollaboratorCursors,
  useCollaboratorSelections,
  useCollaborationOperations,
  useCollaborationEvent,
  useOnlineCollaboratorCount
} from './useCollaboration';
export { useExport, useQuickExport, useExportEvent, useBatchExport } from './useExport';

// 类型导出
export type { AutoSaveStatus } from './useAutoSave';
export type { KeyboardShortcut } from './useKeyboardShortcuts';
export type { OfflineIndicatorProps } from './useOnlineStatus';
export type { VersionDiff, DiffChange } from './useVersionHistory';
export type { WritingStats } from './useWritingRecord';
export type { UseSyncReturn } from './useSync';
export type { UsePerformanceReturn } from './usePerformance';
export type { UseAclReturn } from './useAcl';
export type { UseCollaborationReturn } from './useCollaboration';
export type { UseExportReturn } from './useExport';
