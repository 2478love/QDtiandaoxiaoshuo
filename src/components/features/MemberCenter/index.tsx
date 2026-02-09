import React, { useState, useEffect } from 'react';
import { ActivityEntry, User } from '../../../types';
import { getApiSettings, ApiSettings, API_PROVIDERS } from '../../../config/apiConfig';

interface MemberCenterProps {
  user: User | null;
  activityLog: ActivityEntry[];
  onPlanChange: (plan: User['plan']) => void;
  onNavigateToSettings?: () => void;
}

const PLANS: Array<{ id: User['plan']; name: string; price: string; desc: string; features: string[] }> = [
  {
    id: 'free',
    name: '基础版',
    price: '¥0 / 月',
    desc: '体验核心功能，适合偶尔创作',
    features: ['每日 10 次 AI 调用', '短篇助手', '本地数据存储']
  },
  {
    id: 'pro',
    name: '专业版',
    price: '¥39 / 月',
    desc: '进阶创作者首选，提升效率',
    features: ['每日 500 次 AI 调用', '长篇笔灵 & 拆书器', '优先响应通道']
  }
];

// 获取服务商显示名称
const getProviderDisplayName = (providerId: string): string => {
  const provider = API_PROVIDERS.find(p => p.id === providerId);
  return provider?.name || providerId;
};

// 遮蔽 API Key 显示
const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '未配置';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

const MemberCenter: React.FC<MemberCenterProps> = ({ user, activityLog, onPlanChange, onNavigateToSettings }) => {
  // API 设置状态（只读）
  const [apiSettings, setApiSettings] = useState<ApiSettings>(getApiSettings);

  // 加载 API 设置
  useEffect(() => {
    setApiSettings(getApiSettings());
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-160px)] bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <div className="text-center space-y-4">
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-200">请登录后查看会员中心</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">注册账号即可同步作品、积分和邀约记录。</p>
        </div>
      </div>
    );
  }

  const recentActivities = activityLog.slice(0, 6);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* 用户信息卡片 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg overflow-hidden shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#E8F5E8] dark:bg-[#2C5F2D]/20 text-[#2C5F2D] dark:text-[#97BC62] text-2xl font-bold">
                {user.name?.[0] || 'U'}
              </div>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
              {user.name}
              <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300">
                {user.plan === 'pro' ? 'PRO 会员' : 'FREE 会员'}
              </span>
            </h2>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">{user.email}</p>
            <div className="flex gap-6 mt-4 text-sm">
              <div>
                <p className="text-slate-400 dark:text-slate-500">积分余额</p>
                <p className="text-2xl font-bold text-amber-500">{user.points ?? 0}</p>
              </div>
              <div>
                <p className="text-slate-400 dark:text-slate-500">AI 调用</p>
                <p className="text-2xl font-bold text-[#2C5F2D]">{user.aiCalls ?? 0}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 当前 API 使用状态（只读展示） */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-900/20 dark:to-violet-900/20 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200">当前 API 配置</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">查看当前使用的 AI 服务配置</p>
          </div>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              className="px-4 py-2 rounded-xl bg-[#2C5F2D] text-white text-sm font-medium hover:bg-[#1E4620] transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              前往设置
            </button>
          )}
        </div>
        <div className="p-6">
          {/* 当前配置状态卡片 */}
          <div className={`p-5 rounded-xl border-2 ${
            apiSettings.apiMode === 'custom' && apiSettings.apiKey
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
              : 'border-amber-500 bg-amber-50 dark:bg-amber-500/10'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                apiSettings.apiMode === 'custom' && apiSettings.apiKey
                  ? 'bg-emerald-100 dark:bg-emerald-900/50'
                  : 'bg-amber-100 dark:bg-amber-900/50'
              }`}>
                {apiSettings.apiMode === 'custom' && apiSettings.apiKey ? (
                  <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className={`text-lg font-bold ${
                    apiSettings.apiMode === 'custom' && apiSettings.apiKey
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}>
                    {apiSettings.apiMode === 'membership' ? '会员模式' : '自定义 API 模式'}
                  </h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    apiSettings.apiMode === 'custom' && apiSettings.apiKey
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400'
                  }`}>
                    {apiSettings.apiMode === 'custom' && apiSettings.apiKey ? '已配置' : '未配置'}
                  </span>
                </div>

                {apiSettings.apiMode === 'membership' ? (
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    会员服务即将上线，敬请期待。请前往设置切换到「自定义 API」模式并配置您的 API Key。
                  </p>
                ) : apiSettings.apiKey ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">服务商</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {getProviderDisplayName(apiSettings.provider)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">API Key</p>
                        <p className="font-mono text-slate-700 dark:text-slate-200">
                          {maskApiKey(apiSettings.apiKey)}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">当前模型</p>
                        <p className="font-medium text-slate-700 dark:text-slate-200">
                          {apiSettings.selectedModel || '未选择'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">计费方式</p>
                        <p className="font-medium text-emerald-600 dark:text-emerald-400">
                          使用自己的 API，不消耗平台积分
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-amber-600 dark:text-amber-500">
                    您尚未配置 API Key。请前往「设置 → API 设置」配置您的 API Key 以使用 AI 功能。
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 快捷操作提示 */}
          <div className="mt-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-[#2C5F2D] mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">如何配置 API？</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  前往「设置 → API 设置」，选择服务商（如 Google Gemini、OpenAI、DeepSeek 等），输入您的 API Key 即可开始使用。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 会员方案选择（仅展示，暂不可用） */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-700 dark:text-slate-200">会员方案</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">会员积分服务即将上线</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium">
            即将上线
          </span>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.id}
                className={`rounded-2xl border ${user.plan === plan.id ? 'border-[#2C5F2D]' : 'border-slate-200 dark:border-slate-700'} p-6 opacity-60`}
              >
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{plan.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{plan.desc}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{plan.price}</span>
                </div>
                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300 mb-4">
                  {plan.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="w-full py-2 rounded-xl text-center text-sm text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800">
                  {user.plan === plan.id ? '当前方案' : '即将开放'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 积分 & 调用记录 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-700 dark:text-slate-200">活动记录</h3>
          {apiSettings.apiMode === 'custom' && (
            <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              自定义 API 模式不消耗积分
            </span>
          )}
        </div>
        {recentActivities.length > 0 ? (
          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            {recentActivities.map(item => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{item.description}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
                {item.deltaPoints !== undefined && (
                  <span className={`font-mono text-sm ${item.deltaPoints >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {item.deltaPoints >= 0 ? '+' : ''}{item.deltaPoints}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 text-sm">暂无记录</div>
        )}
      </div>
    </div>
  );
};

export default MemberCenter;
