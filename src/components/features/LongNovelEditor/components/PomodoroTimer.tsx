import React, { useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';
import { formatTime } from '../utils/editorUtils';

const PomodoroTimer: React.FC = () => {
  const { themeClasses } = useEditorContext();
  const {
    pomodoroTime,
    pomodoroRunning,
    pomodoroMode,
    pomodoroCount,
    setPomodoroTime,
    setPomodoroRunning,
    setPomodoroMode,
    setPomodoroCount,
  } = useEditorStore();

  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 开始番茄钟计时
  const startPomodoro = useCallback(() => {
    setPomodoroRunning(true);
    pomodoroIntervalRef.current = setInterval(() => {
      setPomodoroTime(useEditorStore.getState().pomodoroTime - 1);

      const currentTime = useEditorStore.getState().pomodoroTime;
      if (currentTime <= 1) {
        // 计时结束
        if (pomodoroIntervalRef.current) {
          clearInterval(pomodoroIntervalRef.current);
        }
        setPomodoroRunning(false);

        // 播放提示音
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAACtdr/umwPBg==');
          audio.play().catch(() => {});
        } catch {}

        // 切换模式
        const currentMode = useEditorStore.getState().pomodoroMode;
        if (currentMode === 'work') {
          setPomodoroCount(useEditorStore.getState().pomodoroCount + 1);
          setPomodoroMode('break');
          setPomodoroTime(5 * 60); // 休息5分钟
        } else {
          setPomodoroMode('work');
          setPomodoroTime(25 * 60); // 工作25分钟
        }
      }
    }, 1000);
  }, [setPomodoroTime, setPomodoroRunning, setPomodoroMode, setPomodoroCount]);

  // 暂停番茄钟
  const pausePomodoro = useCallback(() => {
    if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
    }
    setPomodoroRunning(false);
  }, [setPomodoroRunning]);

  // 重置番茄钟
  const resetPomodoro = useCallback(() => {
    if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
    }
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroTime(25 * 60);
  }, [setPomodoroRunning, setPomodoroMode, setPomodoroTime]);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }
    };
  }, []);

  return (
    <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${themeClasses.text}`}>番茄钟</p>
        <span className={`text-xs px-2 py-0.5 rounded-full ${pomodoroMode === 'work' ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'}`}>
          {pomodoroMode === 'work' ? '专注' : '休息'}
        </span>
      </div>
      <div className="text-center py-4">
        <p className={`text-4xl font-mono font-bold ${pomodoroMode === 'work' ? 'text-rose-500' : 'text-green-500'}`}>
          {formatTime(pomodoroTime)}
        </p>
        <p className={`text-xs ${themeClasses.textMuted} mt-2`}>
          已完成 {pomodoroCount} 个番茄
        </p>
      </div>
      <div className="flex gap-2">
        {!pomodoroRunning ? (
          <button
            onClick={startPomodoro}
            className="flex-1 py-2 text-sm bg-rose-500 text-white rounded-lg hover:bg-rose-600"
          >
            开始专注
          </button>
        ) : (
          <button
            onClick={pausePomodoro}
            className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            暂停
          </button>
        )}
        <button
          onClick={resetPomodoro}
          className={`px-4 py-2 text-sm rounded-lg border ${themeClasses.border} hover:border-rose-400`}
        >
          重置
        </button>
      </div>
    </section>
  );
};

export default PomodoroTimer;
