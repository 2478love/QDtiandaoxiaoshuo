/**
 * 进度模态框组件
 *
 * 用于显示长时间操作的进度，如：
 * - 文件导出
 * - 数据同步
 * - 批量操作
 */

import React from 'react';

export interface ProgressModalProps {
  /** 是否显示 */
  isOpen: boolean;
  /** 标题 */
  title: string;
  /** 描述文字 */
  description?: string;
  /** 进度 (0-100)，不传则显示不确定进度条 */
  progress?: number;
  /** 当前步骤描述 */
  currentStep?: string;
  /** 是否可取消 */
  cancelable?: boolean;
  /** 取消回调 */
  onCancel?: () => void;
  /** 自定义图标 */
  icon?: React.ReactNode;
}

export function ProgressModal({
  isOpen,
  title,
  description,
  progress,
  currentStep,
  cancelable = false,
  onCancel,
  icon,
}: ProgressModalProps) {
  if (!isOpen) return null;

  const isIndeterminate = progress === undefined;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* 模态框内容 */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 animate-in zoom-in-95 duration-200">
        {/* 图标 */}
        <div className="flex justify-center mb-4">
          {icon || (
            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-bold text-center text-slate-800 dark:text-slate-100 mb-2">
          {title}
        </h3>

        {/* 描述 */}
        {description && (
          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mb-4">
            {description}
          </p>
        )}

        {/* 进度条 */}
        <div className="mb-4">
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            {isIndeterminate ? (
              <div className="h-full bg-indigo-500 rounded-full animate-indeterminate-progress" />
            ) : (
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            )}
          </div>
          {!isIndeterminate && (
            <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-2">
              {Math.round(progress)}%
            </p>
          )}
        </div>

        {/* 当前步骤 */}
        {currentStep && (
          <p className="text-xs text-center text-slate-400 dark:text-slate-500 mb-4 truncate">
            {currentStep}
          </p>
        )}

        {/* 取消按钮 */}
        {cancelable && onCancel && (
          <div className="flex justify-center">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 添加不确定进度条动画样式 */}
      <style>{`
        @keyframes indeterminate-progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 30%;
            margin-left: 35%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-indeterminate-progress {
          animation: indeterminate-progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

/**
 * 确认对话框组件
 * 替代 window.confirm
 */
export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmType = 'primary',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const confirmStyles = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* 模态框内容 */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">
          {title}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors ${confirmStyles[confirmType]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * 离线指示器组件
 */
export interface OfflineIndicatorProps {
  isOnline: boolean;
}

export function OfflineIndicator({ isOnline }: OfflineIndicatorProps) {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] bg-amber-500 text-white text-center py-2 text-sm font-medium animate-in slide-in-from-top duration-300">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m-3.536-3.536a5 5 0 000-7.072M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
        </svg>
        <span>网络连接已断开，部分功能可能不可用</span>
      </div>
    </div>
  );
}

/**
 * 保存状态指示器组件
 */
export interface SaveStatusIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSavedAt?: Date | null;
  hasUnsavedChanges?: boolean;
}

export function SaveStatusIndicator({ status, lastSavedAt, hasUnsavedChanges }: SaveStatusIndicatorProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {status === 'saving' && (
        <>
          <svg className="w-3 h-3 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-slate-400">保存中...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-emerald-500">已保存</span>
        </>
      )}
      {status === 'error' && (
        <>
          <svg className="w-3 h-3 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-rose-500">保存失败</span>
        </>
      )}
      {status === 'idle' && hasUnsavedChanges && (
        <>
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span className="text-slate-400">未保存</span>
        </>
      )}
      {status === 'idle' && !hasUnsavedChanges && lastSavedAt && (
        <span className="text-slate-400">上次保存于 {formatTime(lastSavedAt)}</span>
      )}
    </div>
  );
}

export default ProgressModal;
