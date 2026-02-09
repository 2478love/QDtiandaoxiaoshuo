import React, { useState, useEffect } from 'react';
import { BackupService } from '../../services/backup/BackupService';

/**
 * 备份提醒组件
 * 当用户超过 7 天未备份时显示提醒
 */
export function BackupReminder() {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 检查是否需要显示提醒
    const needsReminder = BackupService.needsBackupReminder();
    
    // 检查用户是否已经关闭过提醒（当前会话）
    const sessionDismissed = sessionStorage.getItem('backup_reminder_dismissed');
    
    setShow(needsReminder && !sessionDismissed);
  }, []);

  const handleBackup = () => {
    try {
      BackupService.downloadBackup();
      setShow(false);
      setDismissed(true);
    } catch (error) {
      console.error('备份失败:', error);
      alert('备份失败，请稍后重试');
    }
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    // 记录到 sessionStorage，本次会话不再显示
    sessionStorage.setItem('backup_reminder_dismissed', 'true');
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 max-w-sm z-50 animate-in slide-in-from-bottom-4 fade-in duration-500">
      {/* 关闭按钮 */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        aria-label="关闭"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 图标 */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#E8F5E8] to-[#F0F7F0] dark:from-[#2C5F2D]/20 dark:to-[#2C5F2D]/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-[#2C5F2D] dark:text-[#97BC62]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </div>

        <div className="flex-1 pt-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
            💾 备份提醒
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            您已经超过 7 天没有备份数据了，建议立即备份以防止数据丢失。
          </p>

          {/* 操作按钮 */}
          <div className="flex gap-2">
            <button
              onClick={handleBackup}
              className="flex-1 px-4 py-2.5 bg-[#2C5F2D] hover:bg-[#1E4620] text-white text-sm font-medium rounded-xl transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
            >
              立即备份
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-sm font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              稍后提醒
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
