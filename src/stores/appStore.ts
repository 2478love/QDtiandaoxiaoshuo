/**
 * 应用全局状态管理 (Zustand)
 *
 * 优势：
 * 1. 细粒度更新 - 只重渲染使用特定状态的组件
 * 2. 无需 Provider - 任何地方都可以使用
 * 3. 支持中间件 - 持久化、devtools 等
 * 4. TypeScript 友好
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { ViewState, Theme, StoredUser, Novel, ActivityEntry, PromptEntry, InviteRecord, ShortWork, User } from '../types';
import { createId } from '../utils';
import { STORAGE_KEYS } from '../config/constants';

// ==================== 类型定义 ====================

/**
 * UI 状态 - 不持久化
 */
interface UIState {
  currentView: ViewState;
  selectedNovelId: string | null;
  isAuthModalOpen: boolean;
  authError: string | null;
  theme: Theme;
  isOnline: boolean;
}

/**
 * 用户状态 - 持久化
 */
interface UserState {
  users: StoredUser[];
  sessionId: string | null;
}

/**
 * 数据状态 - 持久化
 */
interface DataState {
  novels: Novel[];
  activityLog: ActivityEntry[];
  prompts: PromptEntry[];
  invites: InviteRecord[];
  shortWorks: ShortWork[];
}

/**
 * 完整状态
 */
interface AppState extends UIState, UserState, DataState {
  // 计算属性
  getCurrentUser: () => User | null;
  getOwnedNovels: () => Novel[];
  getUserInvites: () => InviteRecord[];
  getUserShortWorks: () => ShortWork[];
  getSelectedNovel: () => Novel | null;
}

/**
 * 状态操作
 */
interface AppActions {
  // UI 操作
  setCurrentView: (view: ViewState) => void;
  setSelectedNovelId: (id: string | null) => void;
  setIsAuthModalOpen: (open: boolean) => void;
  setAuthError: (error: string | null) => void;
  setTheme: (theme: Theme) => void;
  setIsOnline: (online: boolean) => void;

  // 用户操作
  setSessionId: (id: string | null) => void;
  addUser: (user: StoredUser) => void;
  updateUser: (userId: string, updates: Partial<StoredUser>) => void;
  logout: () => void;

  // 小说操作
  addNovel: (novel: Novel) => void;
  updateNovel: (novelId: string, updates: Partial<Novel>) => void;
  deleteNovel: (novelId: string) => void;

  // 活动日志
  recordActivity: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;

  // 提示词
  setPrompts: (prompts: PromptEntry[]) => void;
  addPrompt: (prompt: PromptEntry) => void;
  updatePrompt: (promptId: string, updates: Partial<PromptEntry>) => void;
  deletePrompt: (promptId: string) => void;

  // 邀请码
  setInvites: (invites: InviteRecord[]) => void;

  // 短篇作品
  setShortWorks: (works: ShortWork[]) => void;

  // 重置
  reset: () => void;
}

// ==================== 初始状态 ====================

const initialUIState: UIState = {
  currentView: ViewState.DASHBOARD,
  selectedNovelId: null,
  isAuthModalOpen: false,
  authError: null,
  theme: 'light',
  isOnline: true,
};

const initialUserState: UserState = {
  users: [],
  sessionId: null,
};

const initialDataState: DataState = {
  novels: [],
  activityLog: [],
  prompts: [],
  invites: [],
  shortWorks: [],
};

// ==================== Store 创建 ====================

export const useAppStore = create<AppState & AppActions>()(
  persist(
    immer((set, get) => ({
      // 初始状态
      ...initialUIState,
      ...initialUserState,
      ...initialDataState,

      // ==================== 计算属性 ====================

      getCurrentUser: () => {
        const { sessionId, users } = get();
        if (!sessionId) return null;
        return users.find(u => u.id === sessionId) || null;
      },

      getOwnedNovels: () => {
        const user = get().getCurrentUser();
        const { novels } = get();
        if (!user) return [];
        return novels.filter(n => !n.ownerId || n.ownerId === user.id);
      },

      getUserInvites: () => {
        const user = get().getCurrentUser();
        const { invites } = get();
        if (!user) return [];
        return invites.filter(inv => inv.ownerId === user.id);
      },

      getUserShortWorks: () => {
        const user = get().getCurrentUser();
        const { shortWorks } = get();
        if (!user) return shortWorks;
        return shortWorks.filter(work => work.ownerId === user.id);
      },

      getSelectedNovel: () => {
        const { selectedNovelId, novels } = get();
        if (!selectedNovelId) return null;
        return novels.find(n => n.id === selectedNovelId) || null;
      },

      // ==================== UI 操作 ====================

      setCurrentView: (view) => set({ currentView: view }),
      setSelectedNovelId: (id) => set({ selectedNovelId: id }),
      setIsAuthModalOpen: (open) => set({ isAuthModalOpen: open }),
      setAuthError: (error) => set({ authError: error }),
      setTheme: (theme) => set({ theme }),
      setIsOnline: (online) => set({ isOnline: online }),

      // ==================== 用户操作 ====================

      setSessionId: (id) => set({ sessionId: id }),

      addUser: (user) => set((state) => {
        state.users.push(user);
      }),

      updateUser: (userId, updates) => set((state) => {
        const index = state.users.findIndex(u => u.id === userId);
        if (index !== -1) {
          state.users[index] = { ...state.users[index], ...updates };
        }
      }),

      logout: () => set({ sessionId: null }),

      // ==================== 小说操作 ====================

      addNovel: (novel) => set((state) => {
        state.novels.unshift(novel);
      }),

      updateNovel: (novelId, updates) => set((state) => {
        const index = state.novels.findIndex(n => n.id === novelId);
        if (index !== -1) {
          state.novels[index] = {
            ...state.novels[index],
            ...updates,
            updatedAt: new Date().toLocaleDateString('zh-CN'),
          };
        }
      }),

      deleteNovel: (novelId) => set((state) => {
        state.novels = state.novels.filter(n => n.id !== novelId);
        if (state.selectedNovelId === novelId) {
          state.selectedNovelId = null;
        }
      }),

      // ==================== 活动日志 ====================

      recordActivity: (entry) => set((state) => {
        const fullEntry: ActivityEntry = {
          id: createId(),
          createdAt: entry.createdAt || new Date().toISOString(),
          ...entry,
        };

        // 添加到日志（最多保留 300 条）
        state.activityLog = [fullEntry, ...state.activityLog].slice(0, 300);

        // 更新用户积分等
        const user = state.users.find(u => u.id === state.sessionId);
        if (user) {
          user.points = (user.points ?? 0) + (entry.deltaPoints ?? 0);
          if (entry.type === 'ai_call') {
            user.aiCalls = (user.aiCalls ?? 0) + 1;
          }
          if (entry.metadata?.words) {
            user.totalWords = (user.totalWords ?? 0) + entry.metadata.words;
          }
        }
      }),

      // ==================== 提示词 ====================

      setPrompts: (prompts) => set({ prompts }),

      addPrompt: (prompt) => set((state) => {
        state.prompts.push(prompt);
      }),

      updatePrompt: (promptId, updates) => set((state) => {
        const index = state.prompts.findIndex(p => p.id === promptId);
        if (index !== -1) {
          state.prompts[index] = { ...state.prompts[index], ...updates };
        }
      }),

      deletePrompt: (promptId) => set((state) => {
        state.prompts = state.prompts.filter(p => p.id !== promptId);
      }),

      // ==================== 邀请码 ====================

      setInvites: (invites) => set({ invites }),

      // ==================== 短篇作品 ====================

      setShortWorks: (works) => set({ shortWorks: works }),

      // ==================== 重置 ====================

      reset: () => set({
        ...initialUIState,
        ...initialUserState,
        ...initialDataState,
      }),
    })),
    {
      name: STORAGE_KEYS.SETTINGS,
      storage: createJSONStorage(() => localStorage),
      // 只持久化部分状态
      partialize: (state) => ({
        users: state.users,
        sessionId: state.sessionId,
        novels: state.novels,
        activityLog: state.activityLog,
        prompts: state.prompts,
        invites: state.invites,
        shortWorks: state.shortWorks,
        theme: state.theme,
      }),
    }
  )
);

// ==================== 便捷 Hooks ====================

/**
 * 获取当前用户
 */
export const useCurrentUser = () => useAppStore((state) => state.getCurrentUser());

/**
 * 获取 UI 状态
 */
export const useUIState = () => useAppStore((state) => ({
  currentView: state.currentView,
  selectedNovelId: state.selectedNovelId,
  isAuthModalOpen: state.isAuthModalOpen,
  authError: state.authError,
  theme: state.theme,
  isOnline: state.isOnline,
}));

/**
 * 获取小说列表
 */
export const useNovels = () => useAppStore((state) => state.getOwnedNovels());

/**
 * 获取选中的小说
 */
export const useSelectedNovel = () => useAppStore((state) => state.getSelectedNovel());

/**
 * 获取活动日志
 */
export const useActivityLog = () => useAppStore((state) => state.activityLog);

/**
 * 获取提示词
 */
export const usePrompts = () => useAppStore((state) => state.prompts);

export default useAppStore;
