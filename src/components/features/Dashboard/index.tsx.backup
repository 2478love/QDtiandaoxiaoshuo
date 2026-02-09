import React, { useState, useEffect } from 'react';
import { ActivityEntry, Novel, ShortWork, User } from '../../../types';
import { getApiSettings, ApiSettings } from '../../../config/apiConfig';
import { BookOpen, FileText, Sparkles, TrendingUp } from 'lucide-react';

interface DashboardProps {
  user: User | null;
  novels: Novel[];
  shortWorks: ShortWork[];
  activityLog: ActivityEntry[];
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, novels, shortWorks, activityLog, onLogout }) => {
  // API 模式状态
  const [apiSettings, setApiSettings] = useState<ApiSettings>(getApiSettings);

  // 加载 API 设置
  useEffect(() => {
    setApiSettings(getApiSettings());
  }, []);

  const currentDate = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  const EmptyState = ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-slate-400">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl mb-4">
        {icon || (
          <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )}
      </div>
      <span className="text-sm font-medium text-slate-400 dark:text-slate-500">{label}</span>
      <button className="mt-4 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-[#2C5F2D] dark:hover:text-[#97BC62] transition-colors">
        开始你的第一篇创作 →
      </button>
    </div>
  );

  const aiCalls = user?.aiCalls ?? activityLog.filter(item => item.type === 'ai_call').length;
  const totalNovels = novels.length;
  const totalShorts = shortWorks.length;
  const totalWorks = totalNovels + totalShorts;
  const totalWords = (user?.totalWords ?? 0) + novels.reduce((acc, n) => acc + (n.wordCount || 0), 0) + shortWorks.reduce((acc, w) => acc + w.wordCount, 0);
  const lastActivities = activityLog.slice(0, 5);
  const recentNovels = novels.slice(0, 3);

  const isCustomMode = apiSettings.apiMode === 'custom';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">仪表盘</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{currentDate}</p>
        </div>
        <div className="flex gap-3">
          {user && (
            <button
              onClick={onLogout}
              className="px-6 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
            >
              退出登录
            </button>
          )}
          <button className="px-6 py-3 bg-[#2C5F2D] text-white text-sm font-medium rounded-lg hover:bg-[#1E4620] transition-all flex items-center gap-2 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            新建创作
          </button>
        </div>
      </div>

      {/* User Welcome Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-500 overflow-hidden border border-slate-200 dark:border-slate-700">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
                {user ? `你好, ${user.name}` : '你好, 访客'}
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${user ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                  {user ? (user.plan === 'pro' ? 'PRO 会员' : '基础用户') : '未登录'}
                </span>
              </h2>
              <div className="flex flex-wrap gap-6 mt-3 text-sm">
                {/* 积分显示 - 根据 API 模式显示不同内容 */}
                {isCustomMode ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 dark:text-slate-400">API 模式</span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      自定义 API
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <span className="text-slate-500 dark:text-slate-400">可用积分</span>
                    <span className="text-amber-600 dark:text-amber-500 font-semibold text-base">{user ? (user.points ?? 0) : '--'}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                  <span className="text-slate-500 dark:text-slate-400">AI 调用</span>
                  <span className="text-[#2C5F2D] dark:text-[#97BC62] font-semibold text-base">{aiCalls}</span>
                </div>
              </div>
            </div>
          </div>

          {/* API 模式指示器 */}
          <div className={`px-4 py-3 rounded-xl border ${
            isCustomMode
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-center gap-2">
              {isCustomMode ? (
                <>
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">自定义 API 模式</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">不消耗平台积分</p>
                  </div>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-xs font-medium text-amber-700 dark:text-amber-400">会员模式</p>
                    <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">即将上线</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {([
          { 
            label: '长篇小说', 
            value: totalNovels, 
            sub: `累计 ${(novels.reduce((acc, n) => acc + (n.wordCount || 0), 0)).toLocaleString()} 字`, 
            icon: <BookOpen className="w-5 h-5" />,
            color: 'text-[#2C5F2D]',
            bgColor: 'bg-[#97BC62]/10'
          },
          { 
            label: '短篇作品', 
            value: totalShorts, 
            sub: shortWorks[0]?.title ? `最新《${shortWorks[0].title}》` : '暂无作品', 
            icon: <FileText className="w-5 h-5" />,
            color: 'text-[#F4A460]',
            bgColor: 'bg-[#F4A460]/10'
          },
          { 
            label: '总作品数', 
            value: totalWorks, 
            sub: `总字数 ${totalWords.toLocaleString()}`, 
            icon: <TrendingUp className="w-5 h-5" />,
            color: 'text-[#2C5F2D]',
            bgColor: 'bg-[#97BC62]/10'
          },
          {
            label: 'AI 调用次数',
            value: aiCalls,
            sub: isCustomMode ? '使用自定义 API' : `本周新增 ${activityLog.filter(item => item.type === 'ai_call').length}`,
            icon: <Sparkles className="w-5 h-5" />,
            color: 'text-[#97BC62]',
            bgColor: 'bg-[#2C5F2D]/10',
            badge: isCustomMode ? '自定义' : undefined
          }
        ]).map((stat, idx) => (
          <div 
            key={idx} 
            className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 relative group"
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                <div className={stat.color}>
                  {stat.icon}
                </div>
              </div>
              {stat.badge && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                  {stat.badge}
                </span>
              )}
            </div>
            <h3 className="text-5xl font-bold text-slate-900 dark:text-slate-100 mb-2">{stat.value}</h3>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{stat.label}</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Activity and Recent Works */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm min-h-[320px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">最近活动</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {isCustomMode
                  ? '记录 AI 调用与作品变动'
                  : '记录 AI 调用、积分变化与作品变动'
                }
              </p>
            </div>
            {isCustomMode && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-medium">
                自定义 API
              </span>
            )}
          </div>
          {lastActivities.length > 0 ? (
            <div className="space-y-3">
              {lastActivities.map(item => (
                <div key={item.id} className="flex items-center justify-between border border-slate-100 dark:border-slate-800 rounded-xl px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{item.description}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  {item.deltaPoints !== undefined && !isCustomMode && (
                    <span className={`text-sm font-semibold ${item.deltaPoints >= 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                      {item.deltaPoints >= 0 ? '+' : ''}
                      {item.deltaPoints}
                    </span>
                  )}
                  {item.deltaPoints !== undefined && isCustomMode && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      --
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="还没有生成任何数据" />
          )}
        </div>

        {/* Recent Works */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col min-h-[320px]">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">最近作品</h3>
          {recentNovels.length > 0 ? (
            <div className="space-y-3">
              {recentNovels.map(novel => (
                <div key={novel.id} className="border border-slate-100 dark:border-slate-800 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 line-clamp-1">{novel.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{novel.updatedAt}</span>
                    <span>·</span>
                    <span>{novel.wordCount || 0} 字</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState label="暂无作品" icon={<BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600" />} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
