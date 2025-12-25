/**
 * @fileoverview 协作功能 Hook
 * @module hooks/useCollaboration
 * @description 提供协作功能的 React Hook
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collaborationService,
  Collaborator,
  CollaborationState,
  CursorPosition,
  SelectionRange,
  CollaborationOperation,
  CollaborationEventType,
  ResourceLock
} from '../services/collaboration/CollaborationService';

/**
 * 协作 Hook 返回值
 */
export interface UseCollaborationReturn {
  /** 协作状态 */
  state: CollaborationState | null;
  /** 协作者列表 */
  collaborators: Collaborator[];
  /** 当前用户 */
  currentUser: Collaborator | null;
  /** 是否已连接 */
  isConnected: boolean;
  /** 加入协作 */
  join: (resourceType: string, resourceId: string) => Promise<void>;
  /** 离开协作 */
  leave: () => Promise<void>;
  /** 更新光标 */
  updateCursor: (cursor: CursorPosition) => void;
  /** 更新选区 */
  updateSelection: (selection: SelectionRange | null) => void;
  /** 发送操作 */
  sendOperation: (operation: Omit<CollaborationOperation, 'id' | 'userId' | 'timestamp' | 'version'>) => void;
  /** 锁定资源 */
  lock: (resourceType: string, resourceId: string, reason?: string, expiresIn?: number) => boolean;
  /** 解锁资源 */
  unlock: (resourceType: string, resourceId: string) => boolean;
  /** 获取锁定信息 */
  getLock: (resourceType: string, resourceId: string) => ResourceLock | null;
}

/**
 * 协作功能 Hook
 *
 * @description
 * 提供完整的协作功能访问
 *
 * @param options - 初始化选项
 *
 * @returns {UseCollaborationReturn} 协作功能方法
 *
 * @example
 * function CollaborativeEditor({ novelId }: { novelId: string }) {
 *   const {
 *     collaborators,
 *     isConnected,
 *     join,
 *     leave,
 *     updateCursor,
 *     sendOperation
 *   } = useCollaboration({
 *     userId: 'user_123',
 *     username: '张三'
 *   });
 *
 *   useEffect(() => {
 *     join('novel', novelId);
 *     return () => leave();
 *   }, [novelId]);
 *
 *   return (
 *     <div>
 *       <CollaboratorAvatars collaborators={collaborators} />
 *       <Editor
 *         onCursorChange={updateCursor}
 *         onOperation={sendOperation}
 *       />
 *     </div>
 *   );
 * }
 */
export function useCollaboration(options?: {
  userId?: string;
  username?: string;
  avatar?: string;
}): UseCollaborationReturn {
  const [state, setState] = useState<CollaborationState | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [currentUser, setCurrentUser] = useState<Collaborator | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const initializedRef = useRef(false);

  // 初始化服务
  useEffect(() => {
    if (options?.userId && options?.username && !initializedRef.current) {
      collaborationService.init({
        userId: options.userId,
        username: options.username,
        avatar: options.avatar
      });
      initializedRef.current = true;
      setCurrentUser(collaborationService.getCurrentUser());
    }
  }, [options?.userId, options?.username, options?.avatar]);

  // 订阅事件
  useEffect(() => {
    const updateState = () => {
      setState(collaborationService.getState());
      setCollaborators(collaborationService.getCollaborators());
      setCurrentUser(collaborationService.getCurrentUser());
    };

    const unsubscribeConnected = collaborationService.on('connected', () => {
      setIsConnected(true);
      updateState();
    });

    const unsubscribeDisconnected = collaborationService.on('disconnected', () => {
      setIsConnected(false);
      setState(null);
      setCollaborators([]);
    });

    const unsubscribeJoin = collaborationService.on('collaborator_join', () => {
      updateState();
    });

    const unsubscribeLeave = collaborationService.on('collaborator_leave', () => {
      updateState();
    });

    const unsubscribeCursor = collaborationService.on('cursor_update', () => {
      setCollaborators(collaborationService.getCollaborators());
    });

    const unsubscribeSelection = collaborationService.on('selection_update', () => {
      setCollaborators(collaborationService.getCollaborators());
    });

    return () => {
      unsubscribeConnected();
      unsubscribeDisconnected();
      unsubscribeJoin();
      unsubscribeLeave();
      unsubscribeCursor();
      unsubscribeSelection();
    };
  }, []);

  const join = useCallback(async (resourceType: string, resourceId: string) => {
    await collaborationService.join(resourceType, resourceId);
  }, []);

  const leave = useCallback(async () => {
    await collaborationService.leave();
  }, []);

  const updateCursor = useCallback((cursor: CursorPosition) => {
    collaborationService.updateCursor(cursor);
  }, []);

  const updateSelection = useCallback((selection: SelectionRange | null) => {
    collaborationService.updateSelection(selection);
  }, []);

  const sendOperation = useCallback((
    operation: Omit<CollaborationOperation, 'id' | 'userId' | 'timestamp' | 'version'>
  ) => {
    collaborationService.sendOperation(operation);
  }, []);

  const lock = useCallback((
    resourceType: string,
    resourceId: string,
    reason?: string,
    expiresIn?: number
  ) => {
    return collaborationService.lock(resourceType, resourceId, reason, expiresIn);
  }, []);

  const unlock = useCallback((resourceType: string, resourceId: string) => {
    return collaborationService.unlock(resourceType, resourceId);
  }, []);

  const getLock = useCallback((resourceType: string, resourceId: string) => {
    return collaborationService.getLock(resourceType, resourceId);
  }, []);

  return {
    state,
    collaborators,
    currentUser,
    isConnected,
    join,
    leave,
    updateCursor,
    updateSelection,
    sendOperation,
    lock,
    unlock,
    getLock
  };
}

/**
 * 协作者光标 Hook
 *
 * @description
 * 订阅并获取所有协作者的光标位置
 *
 * @param chapterId - 章节 ID（可选，用于过滤）
 *
 * @returns 协作者光标列表
 *
 * @example
 * function CursorOverlay({ chapterId }: { chapterId: string }) {
 *   const cursors = useCollaboratorCursors(chapterId);
 *
 *   return (
 *     <>
 *       {cursors.map(({ userId, cursor, color, username }) => (
 *         <Cursor
 *           key={userId}
 *           position={cursor}
 *           color={color}
 *           label={username}
 *         />
 *       ))}
 *     </>
 *   );
 * }
 */
export function useCollaboratorCursors(chapterId?: string): Array<{
  userId: string;
  username: string;
  cursor: CursorPosition;
  color: string;
}> {
  const [cursors, setCursors] = useState<Array<{
    userId: string;
    username: string;
    cursor: CursorPosition;
    color: string;
  }>>([]);

  useEffect(() => {
    const updateCursors = () => {
      const collaborators = collaborationService.getCollaborators();
      const cursorList = collaborators
        .filter(c => c.cursor && (!chapterId || c.cursor.chapterId === chapterId))
        .map(c => ({
          userId: c.userId,
          username: c.username,
          cursor: c.cursor!,
          color: c.color
        }));
      setCursors(cursorList);
    };

    updateCursors();

    const unsubscribeCursor = collaborationService.on('cursor_update', updateCursors);
    const unsubscribeJoin = collaborationService.on('collaborator_join', updateCursors);
    const unsubscribeLeave = collaborationService.on('collaborator_leave', updateCursors);

    return () => {
      unsubscribeCursor();
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, [chapterId]);

  return cursors;
}

/**
 * 协作者选区 Hook
 *
 * @description
 * 订阅并获取所有协作者的选区
 *
 * @param chapterId - 章节 ID（可选，用于过滤）
 *
 * @returns 协作者选区列表
 */
export function useCollaboratorSelections(chapterId?: string): Array<{
  userId: string;
  username: string;
  selection: SelectionRange;
  color: string;
}> {
  const [selections, setSelections] = useState<Array<{
    userId: string;
    username: string;
    selection: SelectionRange;
    color: string;
  }>>([]);

  useEffect(() => {
    const updateSelections = () => {
      const collaborators = collaborationService.getCollaborators();
      const selectionList = collaborators
        .filter(c => c.selection && (!chapterId || c.selection.start.chapterId === chapterId))
        .map(c => ({
          userId: c.userId,
          username: c.username,
          selection: c.selection!,
          color: c.color
        }));
      setSelections(selectionList);
    };

    updateSelections();

    const unsubscribeSelection = collaborationService.on('selection_update', updateSelections);
    const unsubscribeJoin = collaborationService.on('collaborator_join', updateSelections);
    const unsubscribeLeave = collaborationService.on('collaborator_leave', updateSelections);

    return () => {
      unsubscribeSelection();
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, [chapterId]);

  return selections;
}

/**
 * 协作操作监听 Hook
 *
 * @description
 * 监听收到的协作操作
 *
 * @param callback - 操作回调
 *
 * @example
 * useCollaborationOperations((operation) => {
 *   switch (operation.type) {
 *     case 'insert':
 *       editor.insertText(operation.position, operation.data.content);
 *       break;
 *     case 'delete':
 *       editor.deleteText(operation.position, operation.data.length);
 *       break;
 *   }
 * });
 */
export function useCollaborationOperations(
  callback: (operation: CollaborationOperation) => void
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = collaborationService.on('operation_received', (event) => {
      const { operation } = event.data as { operation: CollaborationOperation };
      callbackRef.current(operation);
    });

    return unsubscribe;
  }, []);
}

/**
 * 协作事件监听 Hook
 *
 * @param event - 事件类型
 * @param callback - 回调函数
 *
 * @example
 * useCollaborationEvent('conflict_detected', (event) => {
 *   console.warn('检测到冲突:', event.data);
 *   showConflictResolutionDialog(event.data);
 * });
 */
export function useCollaborationEvent(
  event: CollaborationEventType,
  callback: (event: { type: CollaborationEventType; data?: unknown }) => void
): void {
  useEffect(() => {
    const unsubscribe = collaborationService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

/**
 * 在线协作者计数 Hook
 *
 * @returns 在线协作者数量
 *
 * @example
 * function CollaboratorBadge() {
 *   const count = useOnlineCollaboratorCount();
 *   if (count === 0) return null;
 *   return <Badge>{count} 人在线</Badge>;
 * }
 */
export function useOnlineCollaboratorCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      setCount(collaborationService.getCollaborators().filter(c => c.isOnline).length);
    };

    updateCount();

    const unsubscribeJoin = collaborationService.on('collaborator_join', updateCount);
    const unsubscribeLeave = collaborationService.on('collaborator_leave', updateCount);

    return () => {
      unsubscribeJoin();
      unsubscribeLeave();
    };
  }, []);

  return count;
}

export default useCollaboration;
