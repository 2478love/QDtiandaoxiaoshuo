/**
 * 写作记录追踪 Hook
 *
 * 自动记录每日写作字数、完成章节数、写作时长
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { WritingRecord, WritingGoal } from '../types/novel';
import { createRecordId, createGoalId } from '../utils/id';

/**
 * 获取今日日期字符串 YYYY-MM-DD
 */
const getTodayString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

/**
 * 获取本周开始日期
 */
const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

/**
 * 获取本月开始日期
 */
const getMonthStart = (date: Date): Date => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

/**
 * 写作记录配置
 */
interface WritingRecordOptions {
  /** 初始记录 */
  initialRecords?: WritingRecord[];
  /** 初始目标 */
  initialGoals?: WritingGoal[];
  /** 记录变化回调 */
  onRecordsChange?: (records: WritingRecord[]) => void;
  /** 目标变化回调 */
  onGoalsChange?: (goals: WritingGoal[]) => void;
}

/**
 * 写作统计数据
 */
export interface WritingStats {
  /** 今日字数 */
  todayWords: number;
  /** 今日完成章节 */
  todayChapters: number;
  /** 今日写作时长（分钟） */
  todayTime: number;
  /** 本周字数 */
  weekWords: number;
  /** 本月字数 */
  monthWords: number;
  /** 总字数 */
  totalWords: number;
  /** 连续写作天数 */
  streakDays: number;
  /** 日均字数（最近7天） */
  averageDaily: number;
  /** 最高日字数 */
  maxDaily: number;
}

/**
 * 写作记录追踪 Hook
 */
export function useWritingRecord(options: WritingRecordOptions = {}) {
  const {
    initialRecords = [],
    initialGoals = [],
    onRecordsChange,
    onGoalsChange,
  } = options;

  const [records, setRecords] = useState<WritingRecord[]>(initialRecords);
  const [goals, setGoals] = useState<WritingGoal[]>(initialGoals);

  // 写作时间追踪
  const sessionStartRef = useRef<number | null>(null);
  const lastWordCountRef = useRef<number>(0);
  const writingTimeRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 同步外部数据
  useEffect(() => {
    setRecords(initialRecords);
  }, [initialRecords]);

  useEffect(() => {
    setGoals(initialGoals);
  }, [initialGoals]);

  // 获取今日记录
  const getTodayRecord = useCallback((): WritingRecord | undefined => {
    const today = getTodayString();
    return records.find((r) => r.date === today);
  }, [records]);

  // 创建或更新今日记录
  const updateTodayRecord = useCallback(
    (updates: Partial<Omit<WritingRecord, 'id' | 'date'>>) => {
      const today = getTodayString();

      setRecords((prev) => {
        const existingIndex = prev.findIndex((r) => r.date === today);

        if (existingIndex >= 0) {
          // 更新现有记录
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...updates,
            wordsWritten: updates.wordsWritten ?? updated[existingIndex].wordsWritten,
            chaptersCompleted: updates.chaptersCompleted ?? updated[existingIndex].chaptersCompleted,
            writingTime: updates.writingTime ?? updated[existingIndex].writingTime,
          };
          onRecordsChange?.(updated);
          return updated;
        } else {
          // 创建新记录
          const newRecord: WritingRecord = {
            id: createRecordId(),
            date: today,
            wordsWritten: updates.wordsWritten ?? 0,
            chaptersCompleted: updates.chaptersCompleted ?? 0,
            writingTime: updates.writingTime ?? 0,
          };
          const updated = [newRecord, ...prev];
          onRecordsChange?.(updated);
          return updated;
        }
      });
    },
    [onRecordsChange]
  );

  // 记录字数变化
  const recordWordCount = useCallback(
    (currentWordCount: number) => {
      const diff = currentWordCount - lastWordCountRef.current;

      if (diff > 0) {
        // 只记录新增的字数
        const todayRecord = getTodayRecord();
        updateTodayRecord({
          wordsWritten: (todayRecord?.wordsWritten ?? 0) + diff,
        });

        // 更新目标进度
        updateGoalProgress(diff);
      }

      lastWordCountRef.current = currentWordCount;
    },
    [getTodayRecord, updateTodayRecord]
  );

  // 开始写作会话
  const startWritingSession = useCallback((initialWordCount: number = 0) => {
    sessionStartRef.current = Date.now();
    lastWordCountRef.current = initialWordCount;

    // 清除之前的空闲计时器
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }
  }, []);

  // 结束写作会话
  const endWritingSession = useCallback(() => {
    if (sessionStartRef.current) {
      const duration = Math.floor((Date.now() - sessionStartRef.current) / 60000);
      writingTimeRef.current += duration;

      const todayRecord = getTodayRecord();
      updateTodayRecord({
        writingTime: (todayRecord?.writingTime ?? 0) + duration,
      });

      sessionStartRef.current = null;
    }
  }, [getTodayRecord, updateTodayRecord]);

  // 记录活动（用于检测空闲）
  const recordActivity = useCallback(() => {
    // 如果没有开始会话，开始一个新的
    if (!sessionStartRef.current) {
      startWritingSession(lastWordCountRef.current);
    }

    // 重置空闲计时器（5分钟无活动视为结束会话）
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
    }

    idleTimerRef.current = setTimeout(() => {
      endWritingSession();
    }, 5 * 60 * 1000);
  }, [startWritingSession, endWritingSession]);

  // 记录完成章节
  const recordChapterComplete = useCallback(() => {
    const todayRecord = getTodayRecord();
    updateTodayRecord({
      chaptersCompleted: (todayRecord?.chaptersCompleted ?? 0) + 1,
    });
  }, [getTodayRecord, updateTodayRecord]);

  // 更新目标进度
  const updateGoalProgress = useCallback(
    (addedWords: number) => {
      setGoals((prev) => {
        const updated = prev.map((goal) => {
          if (!goal.isActive) return goal;

          const now = new Date();
          const startDate = new Date(goal.startDate);

          // 检查目标是否在有效期内
          if (goal.endDate && new Date(goal.endDate) < now) {
            return { ...goal, isActive: false };
          }

          // 根据目标类型检查日期范围
          let isInRange = false;
          switch (goal.type) {
            case 'daily':
              isInRange = startDate.toDateString() === now.toDateString();
              break;
            case 'weekly':
              const weekStart = getWeekStart(now);
              isInRange = startDate >= weekStart;
              break;
            case 'monthly':
              const monthStart = getMonthStart(now);
              isInRange = startDate >= monthStart;
              break;
            case 'total':
              isInRange = true;
              break;
          }

          if (isInRange) {
            return {
              ...goal,
              currentWords: goal.currentWords + addedWords,
            };
          }

          return goal;
        });

        onGoalsChange?.(updated);
        return updated;
      });
    },
    [onGoalsChange]
  );

  // 创建新目标
  const createGoal = useCallback(
    (goal: Omit<WritingGoal, 'id' | 'currentWords' | 'createdAt'>) => {
      const newGoal: WritingGoal = {
        ...goal,
        id: createGoalId(),
        currentWords: 0,
        createdAt: new Date().toISOString(),
      };

      setGoals((prev) => {
        const updated = [...prev, newGoal];
        onGoalsChange?.(updated);
        return updated;
      });

      return newGoal;
    },
    [onGoalsChange]
  );

  // 更新目标
  const updateGoal = useCallback(
    (goalId: string, updates: Partial<WritingGoal>) => {
      setGoals((prev) => {
        const updated = prev.map((g) =>
          g.id === goalId ? { ...g, ...updates } : g
        );
        onGoalsChange?.(updated);
        return updated;
      });
    },
    [onGoalsChange]
  );

  // 删除目标
  const deleteGoal = useCallback(
    (goalId: string) => {
      setGoals((prev) => {
        const updated = prev.filter((g) => g.id !== goalId);
        onGoalsChange?.(updated);
        return updated;
      });
    },
    [onGoalsChange]
  );

  // 计算统计数据
  const stats = useMemo<WritingStats>(() => {
    const today = getTodayString();
    const now = new Date();
    const weekStart = getWeekStart(now);
    const monthStart = getMonthStart(now);

    const todayRecord = records.find((r) => r.date === today);

    // 计算本周字数
    const weekWords = records
      .filter((r) => new Date(r.date) >= weekStart)
      .reduce((sum, r) => sum + r.wordsWritten, 0);

    // 计算本月字数
    const monthWords = records
      .filter((r) => new Date(r.date) >= monthStart)
      .reduce((sum, r) => sum + r.wordsWritten, 0);

    // 计算总字数
    const totalWords = records.reduce((sum, r) => sum + r.wordsWritten, 0);

    // 计算连续写作天数
    let streakDays = 0;
    const sortedRecords = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    if (sortedRecords.length > 0) {
      const checkDate = new Date();
      for (const record of sortedRecords) {
        const recordDate = new Date(record.date);
        const diffDays = Math.floor(
          (checkDate.getTime() - recordDate.getTime()) / 86400000
        );

        if (diffDays <= 1 && record.wordsWritten > 0) {
          streakDays++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // 计算最近7天日均字数
    const last7Days = records
      .filter((r) => {
        const diff = (now.getTime() - new Date(r.date).getTime()) / 86400000;
        return diff <= 7;
      })
      .reduce((sum, r) => sum + r.wordsWritten, 0);
    const averageDaily = Math.round(last7Days / 7);

    // 最高日字数
    const maxDaily = Math.max(...records.map((r) => r.wordsWritten), 0);

    return {
      todayWords: todayRecord?.wordsWritten ?? 0,
      todayChapters: todayRecord?.chaptersCompleted ?? 0,
      todayTime: todayRecord?.writingTime ?? 0,
      weekWords,
      monthWords,
      totalWords,
      streakDays,
      averageDaily,
      maxDaily,
    };
  }, [records]);

  // 清理
  useEffect(() => {
    return () => {
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
      // 组件卸载时结束会话
      if (sessionStartRef.current) {
        endWritingSession();
      }
    };
  }, [endWritingSession]);

  return {
    // 状态
    records,
    goals,
    stats,

    // 记录操作
    recordWordCount,
    recordChapterComplete,
    recordActivity,
    startWritingSession,
    endWritingSession,

    // 目标操作
    createGoal,
    updateGoal,
    deleteGoal,

    // 辅助
    getTodayRecord,
  };
}

export default useWritingRecord;
