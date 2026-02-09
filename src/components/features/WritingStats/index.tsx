/**
 * @fileoverview 写作统计组件
 * @module components/features/WritingStats
 */

import React, { useState, useEffect } from 'react';
import { Novel } from '../../../types/novel';
import { WritingStats as IWritingStats, DailyStat } from '../../../types/stats';
import { StatsService } from '../../../services/stats/StatsService';
import { TrendingUp, Target, Calendar, Clock, BookOpen, FileText } from 'lucide-react';

interface WritingStatsProps {
  novels: Novel[];
}

const WritingStats: React.FC<WritingStatsProps> = ({ novels }) => {
  const [stats, setStats] = useState<IWritingStats | null>(null);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ dailyWords: 2000, weeklyWords: 10000 });

  useEffect(() => {
    loadStats();
  }, [novels]);

  const loadStats = () => {
    const writingStats = StatsService.getStats(novels);
    setStats(writingStats);
    setGoalForm(writingStats.goals);
  };

  const handleSaveGoals = () => {
    StatsService.setGoals(goalForm.dailyWords, goalForm.weeklyWords);
    loadStats();
    setShowGoalsModal(false);
  };

  if (!stats) {
    return <div className="p-8 text-center text-slate-500">加载中...</div>;
  }

  const summary = StatsService.getSummary(novels);
  const trendData = StatsService.getWritingTrend(7);
  const dailyProgress = StatsService.calculateProgress(stats.todayWords, stats.goals.dailyWords);
  const weeklyProgress = StatsService.calculateProgress(stats.weekWords, stats.goals.weeklyWords);

  // 计算最大值用于图表缩放
  const maxWords = Math.max(...trendData.map(d => d.words), stats.goals.dailyWords);

  return (
    <div className="space-y-6">
      {/* 核心统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen className="w-6 h-6" />}
          label="总字数"
          value={stats.totalWords.toLocaleString()}
          color="text-[#2C5F2D]"
          bgColor="bg-[#2C5F2D]/10"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="今日字数"
          value={stats.todayWords.toLocaleString()}
          color="text-blue-600"
          bgColor="bg-blue-100"
          progress={dailyProgress}
          target={stats.goals.dailyWords}
        />
        <StatCard
          icon={<Calendar className="w-6 h-6" />}
          label="本周字数"
          value={stats.weekWords.toLocaleString()}
          color="text-purple-600"
          bgColor="bg-purple-100"
          progress={weeklyProgress}
          target={stats.goals.weeklyWords}
        />
        <StatCard
          icon={<FileText className="w-6 h-6" />}
          label="作品数量"
          value={summary.totalNovels.toString()}
          color="text-orange-600"
          bgColor="bg-orange-100"
          subtitle={`${summary.completedNovels} 完结 / ${summary.ongoingNovels} 连载`}
        />
      </div>

      {/* 写作趋势图 */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            📈 写作趋势（最近7天）
          </h3>
          <button
            onClick={() => setShowGoalsModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#2C5F2D] dark:text-[#97BC62] hover:bg-[#2C5F2D]/10 dark:hover:bg-[#97BC62]/10 rounded-lg transition-colors"
          >
            <Target className="w-4 h-4" />
            设置目标
          </button>
        </div>

        {/* 简单柱状图 */}
        <div className="space-y-3">
          {trendData.map((day, index) => {
            const date = new Date(day.date);
            const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
            const percentage = maxWords > 0 ? (day.words / maxWords) * 100 : 0;
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div key={day.date} className="flex items-center gap-3">
                <div className="w-16 text-sm text-slate-600 dark:text-slate-400">
                  {dayName}
                </div>
                <div className="flex-1 relative h-8 bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      isToday 
                        ? 'bg-[#2C5F2D]' 
                        : 'bg-[#97BC62]'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                  {day.words > 0 && (
                    <div className="absolute inset-0 flex items-center px-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                      {day.words.toLocaleString()} 字
                    </div>
                  )}
                </div>
                {day.duration > 0 && (
                  <div className="w-20 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {day.duration}分
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 目标线 */}
        {stats.goals.dailyWords > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Target className="w-4 h-4" />
              <span>每日目标: {stats.goals.dailyWords.toLocaleString()} 字</span>
              <span className="mx-2">|</span>
              <span>每周目标: {stats.goals.weeklyWords.toLocaleString()} 字</span>
            </div>
          </div>
        )}
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            📊 作品统计
          </h3>
          <div className="space-y-3">
            <StatRow label="总作品数" value={summary.totalNovels} />
            <StatRow label="总章节数" value={summary.totalChapters} />
            <StatRow label="完结作品" value={summary.completedNovels} />
            <StatRow label="连载作品" value={summary.ongoingNovels} />
            <StatRow label="平均每部字数" value={summary.avgWordsPerNovel.toLocaleString()} />
            <StatRow label="平均每章字数" value={summary.avgWordsPerChapter.toLocaleString()} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
            🎯 目标进度
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">今日目标</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {stats.todayWords} / {stats.goals.dailyWords}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2C5F2D] transition-all"
                  style={{ width: `${Math.min(dailyProgress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {dailyProgress}% 完成
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600 dark:text-slate-400">本周目标</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {stats.weekWords} / {stats.goals.weeklyWords}
                </span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 transition-all"
                  style={{ width: `${Math.min(weeklyProgress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {weeklyProgress}% 完成
              </div>
            </div>

            {dailyProgress >= 100 && (
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                  🎉 恭喜！今日目标已完成！
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 设置目标模态框 */}
      {showGoalsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                设置写作目标
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每日目标（字）
                </label>
                <input
                  type="number"
                  value={goalForm.dailyWords}
                  onChange={e => setGoalForm({ ...goalForm, dailyWords: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  每周目标（字）
                </label>
                <input
                  type="number"
                  value={goalForm.weeklyWords}
                  onChange={e => setGoalForm({ ...goalForm, weeklyWords: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  min="0"
                  step="500"
                />
              </div>

              <div className="text-sm text-slate-500 dark:text-slate-400">
                💡 建议：每日 2000-3000 字，每周 10000-15000 字
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => setShowGoalsModal(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSaveGoals}
                className="px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 统计卡片组件
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
  bgColor: string;
  progress?: number;
  target?: number;
  subtitle?: string;
}> = ({ icon, label, value, color, bgColor, progress, target, subtitle }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={color}>{icon}</div>
        </div>
      </div>
      <div className={`text-3xl font-bold ${color} mb-1`}>{value}</div>
      <div className="text-sm text-slate-600 dark:text-slate-400">{label}</div>
      {subtitle && (
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{subtitle}</div>
      )}
      {progress !== undefined && target !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${bgColor.replace('/10', '')} transition-all`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            目标: {target.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// 统计行组件
const StatRow: React.FC<{ label: string; value: string | number }> = ({ label, value }) => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
};

export default WritingStats;
