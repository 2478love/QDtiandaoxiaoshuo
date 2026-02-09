/**
 * 写作目标面板组件
 *
 * 显示和管理写作目标，展示进度统计
 */

import React, { useState, useCallback, memo } from 'react';
import { WritingGoal } from '../../types/novel';
import type { WritingStats } from '../../hooks/useWritingRecord';

interface WritingGoalsPanelProps {
  /** 目标列表 */
  goals: WritingGoal[];
  /** 写作统计 */
  stats: WritingStats;
  /** 创建目标回调 */
  onCreateGoal: (goal: Omit<WritingGoal, 'id' | 'currentWords' | 'createdAt'>) => void;
  /** 更新目标回调 */
  onUpdateGoal: (goalId: string, updates: Partial<WritingGoal>) => void;
  /** 删除目标回调 */
  onDeleteGoal: (goalId: string) => void;
  /** 主题类 */
  themeClasses?: {
    bg: string;
    text: string;
    textMuted: string;
    border: string;
  };
}

/**
 * 目标类型标签
 */
const GOAL_TYPE_LABELS: Record<WritingGoal['type'], string> = {
  daily: '日目标',
  weekly: '周目标',
  monthly: '月目标',
  total: '总目标',
};

/**
 * 格式化时间
 */
const formatTime = (minutes: number): string => {
  if (minutes < 60) return `${minutes}分钟`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
};

/**
 * 进度环组件
 */
const ProgressRing = memo<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
}>(({ progress, size = 60, strokeWidth = 6, color = '#6366f1' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - Math.min(progress, 100) / 100 * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* 背景圆 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
      />
      {/* 进度圆 */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-500"
      />
    </svg>
  );
});

ProgressRing.displayName = 'ProgressRing';

/**
 * 目标卡片组件
 */
const GoalCard = memo<{
  goal: WritingGoal;
  onUpdate: (updates: Partial<WritingGoal>) => void;
  onDelete: () => void;
  textClass: string;
  textMutedClass: string;
  borderClass: string;
}>(({ goal, onUpdate, onDelete, textClass, textMutedClass, borderClass }) => {
  const progress = Math.min((goal.currentWords / goal.targetWords) * 100, 100);
  const isCompleted = goal.currentWords >= goal.targetWords;

  return (
    <div className={`p-4 rounded-xl border ${borderClass} ${isCompleted ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="relative">
          <ProgressRing
            progress={progress}
            color={isCompleted ? '#10b981' : '#6366f1'}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${textClass}`}>
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-sm font-medium ${textClass}`}>
              {GOAL_TYPE_LABELS[goal.type]}
            </span>
            {isCompleted && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                已完成
              </span>
            )}
            {!goal.isActive && (
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500">
                已暂停
              </span>
            )}
          </div>

          <div className={`text-xs ${textMutedClass} mb-2`}>
            {goal.currentWords.toLocaleString()} / {goal.targetWords.toLocaleString()} 字
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ isActive: !goal.isActive })}
              className={`text-xs px-2 py-1 rounded ${
                goal.isActive
                  ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
                  : 'bg-[#E8F5E8] dark:bg-[#2C5F2D]/20 text-[#2C5F2D] dark:text-[#97BC62]'
              }`}
            >
              {goal.isActive ? '暂停' : '激活'}
            </button>
            <button
              onClick={onDelete}
              className="text-xs px-2 py-1 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

GoalCard.displayName = 'GoalCard';

/**
 * 写作目标面板
 */
const WritingGoalsPanel: React.FC<WritingGoalsPanelProps> = ({
  goals,
  stats,
  onCreateGoal,
  onUpdateGoal,
  onDeleteGoal,
  themeClasses = {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-slate-800 dark:text-slate-100',
    textMuted: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGoal, setNewGoal] = useState<{
    type: WritingGoal['type'];
    targetWords: number;
  }>({
    type: 'daily',
    targetWords: 1000,
  });

  const handleCreateGoal = useCallback(() => {
    onCreateGoal({
      type: newGoal.type,
      targetWords: newGoal.targetWords,
      startDate: new Date().toISOString(),
      isActive: true,
    });
    setShowCreateModal(false);
    setNewGoal({ type: 'daily', targetWords: 1000 });
  }, [newGoal, onCreateGoal]);

  const activeGoals = goals.filter((g) => g.isActive);

  return (
    <div className={`${themeClasses.bg} rounded-xl border ${themeClasses.border} overflow-hidden`}>
      {/* 统计概览 */}
      <div className={`p-4 border-b ${themeClasses.border} bg-gradient-to-r from-[#F0F7F0] to-[#F0F7F0] dark:from-indigo-900/20 dark:to-violet-900/20`}>
        <h3 className={`font-semibold ${themeClasses.text} mb-3`}>写作统计</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold text-[#2C5F2D] dark:text-[#97BC62]`}>
              {stats.todayWords.toLocaleString()}
            </p>
            <p className={`text-xs ${themeClasses.textMuted}`}>今日字数</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold text-emerald-600 dark:text-emerald-400`}>
              {stats.streakDays}
            </p>
            <p className={`text-xs ${themeClasses.textMuted}`}>连续天数</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold text-amber-600 dark:text-amber-400`}>
              {formatTime(stats.todayTime)}
            </p>
            <p className={`text-xs ${themeClasses.textMuted}`}>今日时长</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#F0F7F0] dark:border-[#1E4620]">
          <div>
            <p className={`text-sm font-medium ${themeClasses.text}`}>
              {stats.weekWords.toLocaleString()} <span className={`text-xs ${themeClasses.textMuted}`}>本周字数</span>
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${themeClasses.text}`}>
              {stats.monthWords.toLocaleString()} <span className={`text-xs ${themeClasses.textMuted}`}>本月字数</span>
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${themeClasses.text}`}>
              {stats.averageDaily.toLocaleString()} <span className={`text-xs ${themeClasses.textMuted}`}>日均(7天)</span>
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${themeClasses.text}`}>
              {stats.maxDaily.toLocaleString()} <span className={`text-xs ${themeClasses.textMuted}`}>最高日字数</span>
            </p>
          </div>
        </div>
      </div>

      {/* 目标列表 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className={`font-semibold ${themeClasses.text}`}>
            写作目标 ({activeGoals.length})
          </h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2C5F2D] text-white hover:bg-[#2C5F2D] transition-colors"
          >
            + 新建目标
          </button>
        </div>

        {goals.length === 0 ? (
          <div className={`text-center py-8 ${themeClasses.textMuted}`}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <p className="text-sm">暂无写作目标</p>
            <p className="text-xs mt-1">设定目标，激励自己持续创作</p>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={(updates) => onUpdateGoal(goal.id, updates)}
                onDelete={() => onDeleteGoal(goal.id)}
                textClass={themeClasses.text}
                textMutedClass={themeClasses.textMuted}
                borderClass={themeClasses.border}
              />
            ))}
          </div>
        )}
      </div>

      {/* 创建目标弹窗 */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className={`${themeClasses.bg} rounded-2xl shadow-xl w-[360px] p-6`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold ${themeClasses.text} mb-4`}>新建写作目标</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                  目标类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['daily', 'weekly', 'monthly', 'total'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewGoal((prev) => ({ ...prev, type }))}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        newGoal.type === type
                          ? 'border-[#2C5F2D] bg-[#F0F7F0] dark:bg-[#2C5F2D]/10 text-[#2C5F2D] dark:text-[#97BC62]'
                          : `${themeClasses.border} ${themeClasses.textMuted} hover:border-[#97BC62]`
                      }`}
                    >
                      {GOAL_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                  目标字数
                </label>
                <input
                  type="number"
                  value={newGoal.targetWords}
                  onChange={(e) =>
                    setNewGoal((prev) => ({
                      ...prev,
                      targetWords: Math.max(0, parseInt(e.target.value) || 0),
                    }))
                  }
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${themeClasses.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C5F2D]/20 focus:border-[#2C5F2D] ${themeClasses.text}`}
                  placeholder="1000"
                />
                <div className="flex gap-2 mt-2">
                  {[500, 1000, 2000, 5000].map((words) => (
                    <button
                      key={words}
                      onClick={() => setNewGoal((prev) => ({ ...prev, targetWords: words }))}
                      className={`px-2 py-1 text-xs rounded ${themeClasses.border} border ${themeClasses.textMuted} hover:border-[#97BC62]`}
                    >
                      {words}字
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className={`flex-1 py-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.textMuted} text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
              >
                取消
              </button>
              <button
                onClick={handleCreateGoal}
                disabled={newGoal.targetWords <= 0}
                className="flex-1 py-2.5 rounded-xl bg-[#2C5F2D] text-white text-sm font-medium hover:bg-[#1E4620] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(WritingGoalsPanel);
