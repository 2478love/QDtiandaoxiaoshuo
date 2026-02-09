/**
 * @fileoverview 写作统计服务
 * @module services/stats/StatsService
 */

import { WritingStats, DailyStat, WritingSession } from '../../types/stats';
import { Novel } from '../../types/novel';
import { createId } from '../../utils/id';

const STATS_STORAGE_KEY = 'tiandao_writing_stats';
const GOALS_STORAGE_KEY = 'tiandao_writing_goals';
const SESSION_STORAGE_KEY = 'tiandao_writing_session';

export class StatsService {
  /**
   * 获取写作统计数据
   */
  static getStats(novels: Novel[]): WritingStats {
    const dailyStats = this.getDailyStats();
    const goals = this.getGoals();
    const today = new Date().toISOString().split('T')[0];
    
    // 计算总字数
    const totalWords = this.getTotalWords(novels);
    
    // 计算今日字数
    const todayStats = dailyStats.find(s => s.date === today);
    const todayWords = todayStats?.words || 0;
    
    // 计算本周字数
    const weekWords = this.getWeekWords(dailyStats);
    
    // 计算本月字数
    const monthWords = this.getMonthWords(dailyStats);

    return {
      totalWords,
      todayWords,
      weekWords,
      monthWords,
      dailyStats: dailyStats.slice(-30), // 最近30天
      goals
    };
  }

  /**
   * 计算总字数
   */
  static getTotalWords(novels: Novel[]): number {
    return novels.reduce((total, novel) => {
      const novelWords = novel.wordCount || 0;
      const chaptersWords = (novel.chapters || []).reduce((sum, chapter) => 
        sum + (chapter.wordCount || 0), 0
      );
      return total + Math.max(novelWords, chaptersWords);
    }, 0);
  }

  /**
   * 获取今日字数
   */
  static getTodayWords(): number {
    const today = new Date().toISOString().split('T')[0];
    const stats = this.getDailyStats();
    const todayStats = stats.find(s => s.date === today);
    return todayStats?.words || 0;
  }

  /**
   * 获取本周字数
   */
  static getWeekWords(dailyStats?: DailyStat[]): number {
    const stats = dailyStats || this.getDailyStats();
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    
    return stats
      .filter(s => {
        const statDate = new Date(s.date);
        return statDate >= weekAgo && statDate <= today;
      })
      .reduce((sum, s) => sum + s.words, 0);
  }

  /**
   * 获取本月字数
   */
  static getMonthWords(dailyStats?: DailyStat[]): number {
    const stats = dailyStats || this.getDailyStats();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    return stats
      .filter(s => {
        const statDate = new Date(s.date);
        return statDate.getMonth() === currentMonth && 
               statDate.getFullYear() === currentYear;
      })
      .reduce((sum, s) => sum + s.words, 0);
  }

  /**
   * 记录写作活动
   */
  static recordWriting(words: number, duration: number = 0): void {
    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = this.getDailyStats();
      const todayIndex = stats.findIndex(s => s.date === today);

      if (todayIndex >= 0) {
        stats[todayIndex].words += words;
        stats[todayIndex].duration += duration;
      } else {
        stats.push({
          date: today,
          words,
          duration
        });
      }

      // 只保留最近90天的数据
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const filtered = stats.filter(s => new Date(s.date) >= ninetyDaysAgo);

      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('记录写作活动失败:', error);
    }
  }

  /**
   * 获取每日统计
   */
  static getDailyStats(): DailyStat[] {
    try {
      const data = localStorage.getItem(STATS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取每日统计失败:', error);
      return [];
    }
  }

  /**
   * 获取写作目标
   */
  static getGoals(): { dailyWords: number; weeklyWords: number } {
    try {
      const data = localStorage.getItem(GOALS_STORAGE_KEY);
      return data ? JSON.parse(data) : { dailyWords: 2000, weeklyWords: 10000 };
    } catch (error) {
      console.error('获取写作目标失败:', error);
      return { dailyWords: 2000, weeklyWords: 10000 };
    }
  }

  /**
   * 设置写作目标
   */
  static setGoals(dailyWords: number, weeklyWords: number): void {
    try {
      const goals = { dailyWords, weeklyWords };
      localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    } catch (error) {
      console.error('设置写作目标失败:', error);
    }
  }

  /**
   * 开始写作会话
   */
  static startSession(novelId: string): WritingSession {
    const session: WritingSession = {
      id: createId(),
      novelId,
      startTime: new Date().toISOString(),
      wordsWritten: 0,
      duration: 0
    };

    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('开始写作会话失败:', error);
    }

    return session;
  }

  /**
   * 结束写作会话
   */
  static endSession(wordsWritten: number): void {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!data) return;

      const session: WritingSession = JSON.parse(data);
      const endTime = new Date();
      const startTime = new Date(session.startTime);
      const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // 分钟

      // 记录写作活动
      this.recordWriting(wordsWritten, duration);

      // 清除会话
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('结束写作会话失败:', error);
    }
  }

  /**
   * 获取当前会话
   */
  static getCurrentSession(): WritingSession | null {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('获取当前会话失败:', error);
      return null;
    }
  }

  /**
   * 获取写作趋势（最近N天）
   */
  static getWritingTrend(days: number = 7): DailyStat[] {
    const stats = this.getDailyStats();
    const today = new Date();
    const result: DailyStat[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const stat = stats.find(s => s.date === dateStr);
      result.push(stat || { date: dateStr, words: 0, duration: 0 });
    }

    return result;
  }

  /**
   * 获取写作热力图数据（最近N天）
   */
  static getHeatmapData(days: number = 90): DailyStat[] {
    const stats = this.getDailyStats();
    const today = new Date();
    const result: DailyStat[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const stat = stats.find(s => s.date === dateStr);
      result.push(stat || { date: dateStr, words: 0, duration: 0 });
    }

    return result;
  }

  /**
   * 计算完成度
   */
  static calculateProgress(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  /**
   * 获取写作统计摘要
   */
  static getSummary(novels: Novel[]): {
    totalNovels: number;
    totalChapters: number;
    totalWords: number;
    avgWordsPerNovel: number;
    avgWordsPerChapter: number;
    completedNovels: number;
    ongoingNovels: number;
  } {
    const totalNovels = novels.length;
    const totalChapters = novels.reduce((sum, n) => sum + (n.chapters?.length || 0), 0);
    const totalWords = this.getTotalWords(novels);
    const completedNovels = novels.filter(n => n.status === 'completed').length;
    const ongoingNovels = novels.filter(n => n.status === 'ongoing').length;

    return {
      totalNovels,
      totalChapters,
      totalWords,
      avgWordsPerNovel: totalNovels > 0 ? Math.round(totalWords / totalNovels) : 0,
      avgWordsPerChapter: totalChapters > 0 ? Math.round(totalWords / totalChapters) : 0,
      completedNovels,
      ongoingNovels
    };
  }

  /**
   * 清空统计数据
   */
  static clearStats(): void {
    try {
      localStorage.removeItem(STATS_STORAGE_KEY);
      localStorage.removeItem(GOALS_STORAGE_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.error('清空统计数据失败:', error);
    }
  }

  /**
   * 导出统计数据
   */
  static exportStats(): string {
    const stats = this.getDailyStats();
    const goals = this.getGoals();
    
    return JSON.stringify({
      stats,
      goals,
      exportDate: new Date().toISOString()
    }, null, 2);
  }

  /**
   * 导入统计数据
   */
  static importStats(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.stats) {
        localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(data.stats));
      }
      
      if (data.goals) {
        localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(data.goals));
      }
      
      return true;
    } catch (error) {
      console.error('导入统计数据失败:', error);
      return false;
    }
  }
}
