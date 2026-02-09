/**
 * 版本历史面板组件
 *
 * 显示章节的版本历史，支持预览、恢复和删除版本
 */

import React, { useState, useCallback, memo } from 'react';
import { ChapterVersion } from '../../types/novel';
import { ConfirmModal } from './ProgressModal';

interface VersionHistoryPanelProps {
  /** 版本列表 */
  versions: ChapterVersion[];
  /** 当前选中的版本 ID */
  selectedVersionId: string | null;
  /** 当前章节内容（用于对比） */
  currentContent?: string;
  /** 选择版本回调 */
  onSelectVersion: (versionId: string | null) => void;
  /** 恢复版本回调 */
  onRestoreVersion: (versionId: string) => void;
  /** 删除版本回调 */
  onDeleteVersion: (versionId: string) => void;
  /** 保存当前版本回调 */
  onSaveVersion?: (note?: string) => void;
  /** 关闭面板回调 */
  onClose?: () => void;
  /** 主题类 */
  themeClasses?: {
    bg: string;
    text: string;
    textMuted: string;
    border: string;
  };
}

/**
 * 格式化日期时间
 */
const formatDateTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins}分钟前`;
  if (diffHours < 24) return `${diffHours}小时前`;
  if (diffDays < 7) return `${diffDays}天前`;

  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * 版本列表项组件
 */
const VersionItem = memo<{
  version: ChapterVersion;
  isSelected: boolean;
  onSelect: () => void;
  onRestore: () => void;
  onDelete: () => void;
  textClass: string;
  textMutedClass: string;
  borderClass: string;
}>(({ version, isSelected, onSelect, onRestore, onDelete, textClass, textMutedClass, borderClass }) => (
  <div
    className={`p-3 rounded-lg border cursor-pointer transition-all ${
      isSelected
        ? 'border-[#2C5F2D] bg-[#F0F7F0] dark:bg-[#2C5F2D]/10'
        : `${borderClass} hover:border-[#97BC62] dark:hover:border-[#2C5F2D]/30`
    }`}
    onClick={onSelect}
  >
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${textClass}`}>
            {formatDateTime(version.createdAt)}
          </span>
          {version.note && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
              {version.note}
            </span>
          )}
        </div>
        <p className={`text-xs ${textMutedClass} mt-1`}>
          {version.wordCount} 字
        </p>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRestore();
          }}
          className="p-1.5 rounded hover:bg-[#E8F5E8] dark:hover:bg-[#2C5F2D]/20 text-[#2C5F2D] transition-colors"
          title="恢复此版本"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-500 transition-colors"
          title="删除此版本"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  </div>
));

VersionItem.displayName = 'VersionItem';

/**
 * 版本历史面板
 */
const VersionHistoryPanel: React.FC<VersionHistoryPanelProps> = ({
  versions,
  selectedVersionId,
  currentContent,
  onSelectVersion,
  onRestoreVersion,
  onDeleteVersion,
  onSaveVersion,
  onClose,
  themeClasses = {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-slate-800 dark:text-slate-100',
    textMuted: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [restoreTargetId, setRestoreTargetId] = useState<string | null>(null);
  const [saveNote, setSaveNote] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId);

  const handleDeleteClick = useCallback((versionId: string) => {
    setDeleteTargetId(versionId);
    setShowDeleteConfirm(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (deleteTargetId) {
      onDeleteVersion(deleteTargetId);
    }
    setShowDeleteConfirm(false);
    setDeleteTargetId(null);
  }, [deleteTargetId, onDeleteVersion]);

  const handleRestoreClick = useCallback((versionId: string) => {
    setRestoreTargetId(versionId);
    setShowRestoreConfirm(true);
  }, []);

  const handleConfirmRestore = useCallback(() => {
    if (restoreTargetId) {
      onRestoreVersion(restoreTargetId);
    }
    setShowRestoreConfirm(false);
    setRestoreTargetId(null);
  }, [restoreTargetId, onRestoreVersion]);

  const handleSaveVersion = useCallback(() => {
    onSaveVersion?.(saveNote || undefined);
    setShowSaveModal(false);
    setSaveNote('');
  }, [onSaveVersion, saveNote]);

  return (
    <div className={`flex flex-col h-full ${themeClasses.bg}`}>
      {/* 头部 */}
      <div className={`px-4 py-3 border-b ${themeClasses.border} flex items-center justify-between`}>
        <div>
          <h3 className={`font-semibold ${themeClasses.text}`}>版本历史</h3>
          <p className={`text-xs ${themeClasses.textMuted}`}>
            共 {versions.length} 个版本
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onSaveVersion && (
            <button
              onClick={() => setShowSaveModal(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2C5F2D] text-white hover:bg-[#2C5F2D] transition-colors"
            >
              保存版本
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 ${themeClasses.textMuted}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* 版本列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {versions.length === 0 ? (
          <div className={`text-center py-8 ${themeClasses.textMuted}`}>
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">暂无版本历史</p>
            <p className="text-xs mt-1">编辑内容后会自动保存版本</p>
          </div>
        ) : (
          versions.map((version) => (
            <VersionItem
              key={version.id}
              version={version}
              isSelected={version.id === selectedVersionId}
              onSelect={() => onSelectVersion(version.id === selectedVersionId ? null : version.id)}
              onRestore={() => handleRestoreClick(version.id)}
              onDelete={() => handleDeleteClick(version.id)}
              textClass={themeClasses.text}
              textMutedClass={themeClasses.textMuted}
              borderClass={themeClasses.border}
            />
          ))
        )}
      </div>

      {/* 预览区域 */}
      {selectedVersion && (
        <div className={`border-t ${themeClasses.border} p-4`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${themeClasses.text}`}>版本预览</span>
            <button
              onClick={() => onSelectVersion(null)}
              className={`text-xs ${themeClasses.textMuted} hover:text-[#2C5F2D]`}
            >
              关闭预览
            </button>
          </div>
          <div className={`max-h-48 overflow-y-auto p-3 rounded-lg ${themeClasses.border} border bg-slate-50 dark:bg-slate-800`}>
            <pre className={`text-xs whitespace-pre-wrap font-sans ${themeClasses.text}`}>
              {selectedVersion.content.slice(0, 500)}
              {selectedVersion.content.length > 500 && '...'}
            </pre>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="删除版本"
        message="确定要删除此版本吗？此操作不可撤销。"
        confirmText="删除"
        confirmType="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* 恢复确认弹窗 */}
      <ConfirmModal
        isOpen={showRestoreConfirm}
        title="恢复版本"
        message="确定要恢复到此版本吗？当前内容将被替换。"
        confirmText="恢复"
        confirmType="primary"
        onConfirm={handleConfirmRestore}
        onCancel={() => setShowRestoreConfirm(false)}
      />

      {/* 保存版本弹窗 */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSaveModal(false)}>
          <div className={`${themeClasses.bg} rounded-2xl shadow-xl w-[360px] p-6`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold ${themeClasses.text} mb-4`}>保存版本</h3>
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${themeClasses.textMuted} mb-2`}>
                  版本备注 (可选)
                </label>
                <input
                  type="text"
                  value={saveNote}
                  onChange={(e) => setSaveNote(e.target.value)}
                  placeholder="如：完成第一节修改"
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border ${themeClasses.border} rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2C5F2D]/20 focus:border-[#2C5F2D] ${themeClasses.text}`}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSaveModal(false)}
                className={`flex-1 py-2.5 rounded-xl border ${themeClasses.border} ${themeClasses.textMuted} text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
              >
                取消
              </button>
              <button
                onClick={handleSaveVersion}
                className="flex-1 py-2.5 rounded-xl bg-[#2C5F2D] text-white text-sm font-medium hover:bg-[#1E4620] transition-colors"
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

export default memo(VersionHistoryPanel);
