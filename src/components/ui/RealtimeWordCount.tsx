import React, { useState, useEffect, useCallback, useRef } from 'react';

interface RealtimeWordCountProps {
  content: string;
  goal: number;
  onGoalChange?: (goal: number) => void;
}

interface WritingStats {
  currentWords: number;
  speed: number; // 字/分钟
  progress: number; // 百分比
  sessionWords: number; // 本次会话写作字数
  sessionTime: number; // 本次会话时长（秒）
}

export const RealtimeWordCount: React.FC<RealtimeWordCountProps> = ({ 
  content, 
  goal,
  onGoalChange 
}) => {
  const [stats, setStats] = useState<WritingStats>({
    currentWords: 0,
    speed: 0,
    progress: 0,
    sessionWords: 0,
    sessionTime: 0
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal.toString());
  
  // 记录会话开始时的字数和时间
  const sessionStartWords = useRef(content.length);
  const sessionStartTime = useRef(Date.now());
  const lastUpdateTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 计算写作速度
  const calculateSpeed = useCallback((currentWords: number, sessionTime: number): number => {
    if (sessionTime === 0) return 0;
    const minutes = sessionTime / 60;
    const wordsWritten = currentWords - sessionStartWords.current;
    return Math.round(wordsWritten / minutes);
  }, []);

  // 更新统计数据
  useEffect(() => {
    const words = content.length;
    const now = Date.now();
    const sessionTime = Math.floor((now - sessionStartTime.current) / 1000);
    const speed = calculateSpeed(words, sessionTime);
    const progress = goal > 0 ? (words / goal) * 100 : 0;
    const sessionWords = words - sessionStartWords.current;

    setStats({
      currentWords: words,
      speed: speed,
      progress: progress,
      sessionWords: sessionWords,
      sessionTime: sessionTime
    });

    lastUpdateTime.current = now;
  }, [content, goal, calculateSpeed]);

  // 定时更新会话时长
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      const sessionTime = Math.floor((now - sessionStartTime.current) / 1000);
      const speed = calculateSpeed(stats.currentWords, sessionTime);
      
      setStats(prev => ({
        ...prev,
        sessionTime,
        speed
      }));
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [stats.currentWords, calculateSpeed]);

  // 格式化时间
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理目标修改
  const handleGoalEdit = () => {
    setIsEditing(true);
    setTempGoal(goal.toString());
  };

  const handleGoalSave = () => {
    const newGoal = parseInt(tempGoal);
    if (!isNaN(newGoal) && newGoal > 0) {
      onGoalChange?.(newGoal);
    }
    setIsEditing(false);
  };

  const handleGoalCancel = () => {
    setIsEditing(false);
    setTempGoal(goal.toString());
  };

  return (
    <div className="fixed bottom-6 right-6 bg-white/95 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-gray-200 z-40 min-w-[320px]">
      {/* 主要统计 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600">
            当前字数: 
            <span className="font-bold text-[#2C5F2D] text-xl ml-2">
              {stats.currentWords.toLocaleString()}
            </span>
          </div>
          <div className="text-gray-300">|</div>
          <div className="text-sm text-gray-500">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(e.target.value)}
                  className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:border-[#2C5F2D]"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGoalSave();
                    if (e.key === 'Escape') handleGoalCancel();
                  }}
                />
                <button
                  onClick={handleGoalSave}
                  className="text-green-600 hover:text-green-700"
                  title="保存"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={handleGoalCancel}
                  className="text-gray-400 hover:text-gray-600"
                  title="取消"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span>目标: {goal.toLocaleString()}</span>
                <button
                  onClick={handleGoalEdit}
                  className="text-gray-400 hover:text-gray-600"
                  title="修改目标"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 进度条 */}
      <div className="mb-3">
        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-[#2C5F2D] to-[#97BC62] h-2.5 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${Math.min(stats.progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-500">
            {stats.progress.toFixed(1)}% 完成
          </span>
          {stats.progress >= 100 && (
            <span className="text-xs text-[#2C5F2D] font-medium flex items-center gap-1">
              <span>🎉</span>
              <span>已完成目标！</span>
            </span>
          )}
        </div>
      </div>

      {/* 详细统计 */}
      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-100">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">写作速度</div>
          <div className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1">
            <span className="text-base">⚡</span>
            <span>{stats.speed}</span>
            <span className="text-xs text-gray-400">字/分</span>
          </div>
        </div>
        
        <div className="text-center border-l border-r border-gray-100">
          <div className="text-xs text-gray-500 mb-1">本次写作</div>
          <div className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1">
            <span className="text-base">✍️</span>
            <span>{stats.sessionWords}</span>
            <span className="text-xs text-gray-400">字</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">写作时长</div>
          <div className="text-sm font-semibold text-gray-700 flex items-center justify-center gap-1">
            <span className="text-base">⏱️</span>
            <span>{formatTime(stats.sessionTime)}</span>
          </div>
        </div>
      </div>

      {/* 剩余字数提示 */}
      {stats.progress < 100 && goal > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100 text-center">
          <span className="text-xs text-gray-500">
            还需 <span className="font-semibold text-[#2C5F2D]">{(goal - stats.currentWords).toLocaleString()}</span> 字完成目标
          </span>
        </div>
      )}
    </div>
  );
};

export default RealtimeWordCount;
