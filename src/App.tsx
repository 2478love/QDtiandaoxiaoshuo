import React, { Suspense, lazy, useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/layout/Sidebar';
import AuthModal from './components/layout/AuthModal';
import { AuthPayload } from './components/layout/AuthModal';

const Dashboard = lazy(() => import('./components/features/Dashboard'));
const WritingTool = lazy(() => import('./components/features/WritingTool'));
const NovelManager = lazy(() => import('./components/features/NovelManager'));
const ShortNovel = lazy(() => import('./components/features/ShortNovel'));
const BookBreaker = lazy(() => import('./components/features/BookBreaker'));
const MemberCenter = lazy(() => import('./components/features/MemberCenter'));
const InviteManager = lazy(() => import('./components/features/InviteManager'));
const Settings = lazy(() => import('./components/features/Settings'));
const PromptsLibrary = lazy(() => import('./components/features/PromptsLibrary'));
const LongNovelEditor = lazy(() => import('./components/features/LongNovelEditor'));
import { ToastProvider } from './components/ui/Toast';
import { OfflineIndicator } from './components/ui/ProgressModal';
import { SessionExpiryWarning } from './components/ui/SessionExpiryWarning';
import { usePersistentState, useOnlineStatus } from './hooks';
import { ViewState, User, Theme, Novel, ActivityEntry, InviteRecord, PromptEntry, ShortWork, StoredUser, LoginHistoryEntry, LOGIN_MAX_ATTEMPTS, LOGIN_LOCKOUT_MINUTES } from './types';
import { createId, createInviteCode, hashPassword, verifyPassword, passwordNeedsUpgrade } from './utils';
import { defaultPrompts } from './data/defaultPrompts';

// 检查用户是否被锁定
const isUserLocked = (user: StoredUser): { isLocked: boolean; remainingMinutes: number } => {
  if (!user.lockoutUntil) return { isLocked: false, remainingMinutes: 0 };
  const lockoutTime = new Date(user.lockoutUntil).getTime();
  const now = Date.now();
  if (now >= lockoutTime) {
    return { isLocked: false, remainingMinutes: 0 };
  }
  const remainingMs = lockoutTime - now;
  const remainingMinutes = Math.ceil(remainingMs / (1000 * 60));
  return { isLocked: true, remainingMinutes };
};

function App() {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>('light');
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [lockoutInfo, setLockoutInfo] = useState<{ isLocked: boolean; remainingMinutes: number } | null>(null);

  // 在线状态检测
  const { isOnline } = useOnlineStatus();

  const [users, setUsers] = usePersistentState<StoredUser[]>('tiandao_users', []);
  const [sessionId, setSessionId] = usePersistentState<string | null>('tiandao_session_id', null);
  const [novels, setNovels] = usePersistentState<Novel[]>('tiandao_novels', []);
  const [activityLog, setActivityLog] = usePersistentState<ActivityEntry[]>('tiandao_activity_log', []);
  const [prompts, setPrompts] = usePersistentState<PromptEntry[]>('tiandao_prompts', defaultPrompts);
  const [invites, setInvites] = usePersistentState<InviteRecord[]>('tiandao_invites', []);
  const [shortWorks, setShortWorks] = usePersistentState<ShortWork[]>('tiandao_short_works', []);

  const user = useMemo<User | null>(() => {
    if (!sessionId) return null;
    return users.find(u => u.id === sessionId) || null;
  }, [sessionId, users]);

  // 获取完整的 StoredUser（包含敏感信息，仅用于设置页面）
  const storedUser = useMemo<StoredUser | null>(() => {
    if (!sessionId) return null;
    return users.find(u => u.id === sessionId) || null;
  }, [sessionId, users]);

  const persistUsers = useCallback((updater: (prev: StoredUser[]) => StoredUser[]) => {
    setUsers(prev => updater(prev));
  }, [setUsers]);

  const updateUser = useCallback((userId: string, updates: Partial<StoredUser>) => {
    persistUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  }, [persistUsers]);

  const handleSaveNovel = (novel: Novel) => {
    setNovels(prev => [novel, ...prev]);
  };

  const updateNovel = useCallback((novelId: string, updates: Partial<Novel>) => {
    setNovels(prev => prev.map(n => n.id === novelId ? { ...n, ...updates, updatedAt: new Date().toLocaleDateString('zh-CN') } : n));
  }, []);

  const deleteNovel = useCallback((novelId: string) => {
    setNovels(prev => prev.filter(n => n.id !== novelId));
    if (selectedNovelId === novelId) {
      setSelectedNovelId(null);
    }
  }, [selectedNovelId]);

  const handleNovelClick = (novel: Novel) => {
    setSelectedNovelId(novel.id);
    setCurrentView(ViewState.LONG_NOVEL);
  };

  const selectedNovel = novels.find(n => n.id === selectedNovelId) || null;

  // 初始化默认提示词（如果用户的提示词库为空）
  useEffect(() => {
    if (prompts.length === 0) {
      setPrompts(defaultPrompts);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  // 监听会话过期事件，打开登录模态框
  useEffect(() => {
    const handleOpenLogin = () => {
      setIsAuthModalOpen(true);
    };

    window.addEventListener('tiandao:openLogin', handleOpenLogin);
    return () => {
      window.removeEventListener('tiandao:openLogin', handleOpenLogin);
    };
  }, []);

  const recordActivity = useCallback((entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => {
    const fullEntry: ActivityEntry = {
      id: createId(),
      createdAt: entry.createdAt || new Date().toISOString(),
      ...entry,
    };
    setActivityLog(prev => [fullEntry, ...prev].slice(0, 300));
    if (user) {
      const nextPoints = (user.points ?? 0) + (entry.deltaPoints ?? 0);
      const nextAiCalls = entry.type === 'ai_call' ? (user.aiCalls ?? 0) + 1 : (user.aiCalls ?? 0);
      const nextWords = entry.metadata?.words
        ? (user.totalWords ?? 0) + entry.metadata.words
        : user.totalWords;
      updateUser(user.id, {
        points: nextPoints,
        aiCalls: nextAiCalls,
        totalWords: nextWords,
      });
    }
  }, [setActivityLog, updateUser, user]);

  const handleAuthenticate = useCallback(async (payload: AuthPayload) => {
    setAuthError(null);
    setLockoutInfo(null);

    if (!payload.email || !payload.password) {
      setAuthError('请输入完整的登录信息');
      return;
    }

    if (payload.mode === 'register') {
      if (!payload.name.trim()) {
        setAuthError('请输入昵称');
        return;
      }
      if (users.some(u => u.email.toLowerCase() === payload.email.toLowerCase())) {
        setAuthError('该邮箱已注册');
        return;
      }
      // 使用安全的异步哈希
      const passwordHash = await hashPassword(payload.password);
      const newUser: StoredUser = {
        id: createId(),
        name: payload.name.trim(),
        email: payload.email.toLowerCase(),
        plan: 'free',
        passwordHash,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(payload.name.trim())}`,
        createdAt: new Date().toISOString(),
        inviteCode: createInviteCode(),
        points: 100,
        aiCalls: 0,
        totalWords: 0,
        membershipValidUntil: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
        loginAttempts: 0,
        loginHistory: [{
          timestamp: new Date().toISOString(),
          success: true,
          userAgent: navigator.userAgent,
        }],
      };
      setUsers(prev => [...prev, newUser]);
      setSessionId(newUser.id);
      setIsAuthModalOpen(false);
      recordActivity({ type: 'general', description: '注册成功，系统赠送积分', deltaPoints: 100 });
      return;
    }

    const existing = users.find(u => u.email.toLowerCase() === payload.email.toLowerCase());
    if (!existing) {
      setAuthError('账户不存在');
      return;
    }

    // 检查账户是否被锁定
    const lockStatus = isUserLocked(existing);
    if (lockStatus.isLocked) {
      setLockoutInfo(lockStatus);
      setAuthError(`账户已被临时锁定，请 ${lockStatus.remainingMinutes} 分钟后重试`);
      return;
    }

    // 使用安全的异步密码验证
    const isValid = await verifyPassword(payload.password, existing.passwordHash);

    // 创建登录历史记录
    const loginEntry: LoginHistoryEntry = {
      timestamp: new Date().toISOString(),
      success: isValid,
      userAgent: navigator.userAgent,
    };

    if (!isValid) {
      // 增加失败次数
      const newAttempts = (existing.loginAttempts || 0) + 1;
      const updates: Partial<StoredUser> = {
        loginAttempts: newAttempts,
        loginHistory: [...(existing.loginHistory || []).slice(-49), loginEntry],
      };

      // 如果达到最大尝试次数，锁定账户
      if (newAttempts >= LOGIN_MAX_ATTEMPTS) {
        const lockoutUntil = new Date(Date.now() + LOGIN_LOCKOUT_MINUTES * 60 * 1000).toISOString();
        updates.lockoutUntil = lockoutUntil;
        updates.loginAttempts = 0; // 重置尝试次数
        setLockoutInfo({ isLocked: true, remainingMinutes: LOGIN_LOCKOUT_MINUTES });
        setAuthError(`登录失败次数过多，账户已被锁定 ${LOGIN_LOCKOUT_MINUTES} 分钟`);
      } else {
        const remaining = LOGIN_MAX_ATTEMPTS - newAttempts;
        setAuthError(`密码不正确，还剩 ${remaining} 次尝试机会`);
      }

      updateUser(existing.id, updates);
      return;
    }

    // 登录成功
    const successUpdates: Partial<StoredUser> = {
      loginAttempts: 0,
      lockoutUntil: undefined,
      lastLoginAt: new Date().toISOString(),
      loginHistory: [...(existing.loginHistory || []).slice(-49), loginEntry],
    };

    // 如果密码哈希需要升级，在登录成功后自动升级
    if (passwordNeedsUpgrade(existing.passwordHash)) {
      const newHash = await hashPassword(payload.password);
      successUpdates.passwordHash = newHash;
    }

    updateUser(existing.id, successUpdates);
    setSessionId(existing.id);
    setIsAuthModalOpen(false);

    // 如果用户选择"记住我"，可以延长会话时间（这里只是记录，实际逻辑需要SessionService支持）
    if (payload.rememberMe) {
      localStorage.setItem('tiandao_remember_me', 'true');
    } else {
      localStorage.removeItem('tiandao_remember_me');
    }
  }, [recordActivity, setSessionId, setUsers, updateUser, users]);

  // 处理密码重置请求
  const handlePasswordReset = useCallback(async (email: string) => {
    const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!existing) {
      // 为了安全，不透露邮箱是否存在
      console.log('密码重置请求：', email);
      return;
    }

    // 在纯前端应用中，我们只能提供本地重置功能
    // 这里记录重置请求，实际的重置需要用户通过其他方式验证身份
    recordActivity({
      type: 'general',
      description: `密码重置请求已发送至 ${email.slice(0, 3)}***${email.slice(-10)}`
    });
  }, [users, recordActivity]);

  // 处理密码修改（在设置页面中使用）
  const handlePasswordChange = useCallback(async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; message: string }> => {
    if (!storedUser) {
      return { success: false, message: '用户未登录' };
    }

    // 验证当前密码
    const isValid = await verifyPassword(currentPassword, storedUser.passwordHash);
    if (!isValid) {
      return { success: false, message: '当前密码不正确' };
    }

    // 验证新密码长度
    if (newPassword.length < 8) {
      return { success: false, message: '新密码至少需要 8 个字符' };
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await verifyPassword(newPassword, storedUser.passwordHash);
    if (isSamePassword) {
      return { success: false, message: '新密码不能与当前密码相同' };
    }

    try {
      // 生成新的密码哈希
      const newPasswordHash = await hashPassword(newPassword);

      // 更新用户密码
      updateUser(storedUser.id, { passwordHash: newPasswordHash });

      // 记录活动
      recordActivity({
        type: 'general',
        description: '密码已成功修改'
      });

      return { success: true, message: '密码修改成功' };
    } catch (error) {
      console.error('密码修改失败:', error);
      return { success: false, message: '密码修改失败，请稍后重试' };
    }
  }, [storedUser, updateUser, recordActivity]);

  const handleLogout = () => {
    setSessionId(null);
  };

  const ownedNovels = useMemo(() => {
    if (!user) return [];
    return novels.filter(n => !n.ownerId || n.ownerId === user.id);
  }, [novels, user]);

  const userInvites = useMemo(() => {
    if (!user) return [];
    return invites.filter(inv => inv.ownerId === user.id);
  }, [invites, user]);

  const userShortWorks = useMemo(() => {
    if (!user) return shortWorks;
    return shortWorks.filter(work => work.ownerId === user.id);
  }, [shortWorks, user]);

  const handleInvitesChange: React.Dispatch<React.SetStateAction<InviteRecord[]>> = (next) => {
    if (!user) return;
    setInvites(prev => {
      const others = prev.filter(inv => inv.ownerId && inv.ownerId !== user.id);
      const current = prev.filter(inv => inv.ownerId === user.id);
      const updated = typeof next === 'function' ? (next as (prev: InviteRecord[]) => InviteRecord[])(current) : next;
      const normalized = updated.map(invite => ({ ...invite, ownerId: user.id }));
      return [...others, ...normalized];
    });
  };

  const handleShortWorksChange: React.Dispatch<React.SetStateAction<ShortWork[]>> = (next) => {
    if (!user) return;
    setShortWorks(prev => {
      const others = prev.filter(work => work.ownerId && work.ownerId !== user.id);
      const current = prev.filter(work => work.ownerId === user.id);
      const updated = typeof next === 'function' ? (next as (prev: ShortWork[]) => ShortWork[])(current) : next;
      const normalized = updated.map(work => ({ ...work, ownerId: user.id }));
      return [...others, ...normalized];
    });
  };

  const handleCreateNovel = (novel: Omit<Novel, 'id' | 'ownerId' | 'updatedAt'>) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }
    const newNovel: Novel = {
      ...novel,
      id: createId(),
      ownerId: user.id,
      updatedAt: new Date().toLocaleDateString('zh-CN'),
    };
    handleSaveNovel(newNovel);
    recordActivity({ type: 'novel', description: `创建作品《${novel.title}》`, deltaPoints: 5 });
  };

  const contentFallback = (
    <div className="flex items-center justify-center py-16 text-sm text-slate-500 dark:text-slate-400">
      正在加载模块...
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard user={user} novels={ownedNovels} shortWorks={userShortWorks} activityLog={activityLog} onLogout={handleLogout} />;
      case ViewState.WRITING_TOOL:
        return <WritingTool onRecordActivity={recordActivity} />;
      case ViewState.NOVEL_MANAGER:
        return (
          <NovelManager
            onNavigate={setCurrentView}
            novels={ownedNovels}
            onSaveNovel={handleSaveNovel}
            onNovelClick={handleNovelClick}
            onCreateNovel={handleCreateNovel}
            onDeleteNovel={deleteNovel}
            isAuthenticated={!!user}
          />
        );
      case ViewState.SHORT_NOVEL:
        return <ShortNovel onSaveWork={handleShortWorksChange} works={userShortWorks} onRecordActivity={recordActivity} />;
      case ViewState.LONG_NOVEL:
        return <LongNovelEditor novel={selectedNovel} onUpdateNovel={(updates) => selectedNovelId && updateNovel(selectedNovelId, updates)} onBack={() => setCurrentView(ViewState.NOVEL_MANAGER)} onRecordActivity={recordActivity} prompts={prompts} />;
      case ViewState.BOOK_BREAKER:
        return <BookBreaker onRecordActivity={recordActivity} />;
      case ViewState.PROMPTS:
        return <PromptsLibrary prompts={prompts} onPromptsChange={setPrompts} currentUser={user} />;
      case ViewState.MEMBER:
        return <MemberCenter user={user} activityLog={activityLog} onPlanChange={(plan) => user && updateUser(user.id, { plan })} onNavigateToSettings={() => setCurrentView(ViewState.SETTINGS)} />;
      case ViewState.INVITE:
        return <InviteManager user={user} invites={userInvites} onInvitesChange={handleInvitesChange} />;
      case ViewState.SETTINGS: return <Settings user={user} storedUser={storedUser} theme={theme} onThemeChange={setTheme} onPasswordChange={handlePasswordChange} />;
      default: return null;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300">
        {/* 离线提醒 */}
        <OfflineIndicator isOnline={isOnline} />

        {/* 会话过期提醒 */}
        {user && (
          <SessionExpiryWarning
            onExpired={handleLogout}
            onRefreshed={() => recordActivity({ type: 'general', description: '会话已续期' })}
          />
        )}

        <Sidebar currentView={currentView} onNavigate={setCurrentView} user={user} onLoginClick={() => setIsAuthModalOpen(true)} />
        <main className={`ml-64 min-h-screen transition-all duration-300`}>
          {currentView !== ViewState.LONG_NOVEL && (
              <header className="flex justify-between items-center p-6 lg:px-10 lg:pt-10 mb-4">
                  <div className="flex items-center gap-3">
                      <div className="flex items-center text-sm font-medium text-slate-400 dark:text-slate-500">
                          <span>天道</span>
                          <svg className="w-4 h-4 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" /></svg>
                          <span className="text-slate-800 dark:text-slate-200">
                               {currentView === ViewState.DASHBOARD && '仪表盘'}
                               {currentView === ViewState.NOVEL_MANAGER && '小说管理'}
                               {currentView === ViewState.WRITING_TOOL && '创作工具'}
                          </span>
                      </div>
                  </div>
              </header>
          )}
          <div className={currentView === ViewState.LONG_NOVEL ? "" : "px-6 lg:px-10 pb-10"}>
              <Suspense fallback={contentFallback}>
                {renderContent()}
              </Suspense>
          </div>
        </main>
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthenticate={handleAuthenticate}
          onPasswordReset={handlePasswordReset}
          error={authError}
          lockoutInfo={lockoutInfo}
        />
      </div>
    </ToastProvider>
  );
}

export default App;
