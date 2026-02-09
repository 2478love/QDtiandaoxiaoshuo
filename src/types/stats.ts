/**
 * @fileoverview 写作统计类型定义
 * @module types/stats
 */

export interface DailyStat {
  date: string; // YYYY-MM-DD
  words: number;
  duration: number; // 分钟
}

export interface WritingStats {
  totalWords: number;
  todayWords: number;
  weekWords: number;
  monthWords: number;
  dailyStats: DailyStat[];
  goals: {
    dailyWords: number;
    weeklyWords: number;
  };
}

export interface WritingSession {
  id: string;
  novelId: string;
  startTime: string;
  endTime?: string;
  wordsWritten: number;
  duration: number; // 分钟
}
