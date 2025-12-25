/**
 * 版本历史管理 Hook
 *
 * 用于章节内容的版本历史记录和恢复
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { Chapter, ChapterVersion } from '../types/novel';
import { createVersionId } from '../utils/id';

/**
 * 版本历史配置
 */
interface VersionHistoryOptions {
  /** 最大版本数量，默认 50 */
  maxVersions?: number;
  /** 自动保存间隔(ms)，0 表示不自动保存，默认 60000 (1分钟) */
  autoSaveInterval?: number;
  /** 最小字数变化才创建新版本，默认 50 */
  minChangeThreshold?: number;
  /** 保存版本时的回调 */
  onVersionSave?: (version: ChapterVersion) => void;
}

/**
 * 版本历史状态
 */
interface VersionHistoryState {
  /** 当前章节的所有版本 */
  versions: ChapterVersion[];
  /** 是否正在加载 */
  isLoading: boolean;
  /** 选中的版本 ID（用于预览） */
  selectedVersionId: string | null;
  /** 是否有未保存的更改 */
  hasUnsavedChanges: boolean;
}

/**
 * 版本历史操作
 */
interface VersionHistoryActions {
  /** 保存当前内容为新版本 */
  saveVersion: (content: string, note?: string) => ChapterVersion | null;
  /** 恢复到指定版本 */
  restoreVersion: (versionId: string) => ChapterVersion | null;
  /** 删除指定版本 */
  deleteVersion: (versionId: string) => void;
  /** 选择版本进行预览 */
  selectVersion: (versionId: string | null) => void;
  /** 获取两个版本之间的差异 */
  getDiff: (versionId1: string, versionId2: string) => VersionDiff | null;
  /** 清空所有版本 */
  clearAllVersions: () => void;
  /** 标记有未保存的更改 */
  markUnsaved: () => void;
}

/**
 * 版本差异信息
 */
export interface VersionDiff {
  addedLines: number;
  removedLines: number;
  addedWords: number;
  removedWords: number;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  content: string;
  lineNumber: number;
}

/**
 * 计算字数
 */
const countWords = (text: string): number => {
  // 中文字符按字数计算，英文按单词计算
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
};

/**
 * 简单的行级别差异计算
 */
const calculateDiff = (oldContent: string, newContent: string): VersionDiff => {
  const oldLines = oldContent.split('\n');
  const newLines = newContent.split('\n');

  const changes: DiffChange[] = [];
  let addedLines = 0;
  let removedLines = 0;

  // 简化的差异算法：使用最长公共子序列的思想
  const lcs = new Map<string, number>();

  // 标记旧行
  oldLines.forEach((line, i) => {
    const key = line.trim();
    if (!lcs.has(key)) {
      lcs.set(key, i);
    }
  });

  // 比较新行
  const usedOldLines = new Set<number>();

  newLines.forEach((line, i) => {
    const key = line.trim();
    const oldIndex = lcs.get(key);

    if (oldIndex !== undefined && !usedOldLines.has(oldIndex)) {
      usedOldLines.add(oldIndex);
      changes.push({ type: 'unchanged', content: line, lineNumber: i + 1 });
    } else {
      changes.push({ type: 'add', content: line, lineNumber: i + 1 });
      addedLines++;
    }
  });

  // 找出被删除的行
  oldLines.forEach((line, i) => {
    if (!usedOldLines.has(i)) {
      removedLines++;
    }
  });

  return {
    addedLines,
    removedLines,
    addedWords: countWords(newContent) - countWords(oldContent),
    removedWords: Math.max(0, countWords(oldContent) - countWords(newContent)),
    changes,
  };
};

/**
 * 版本历史管理 Hook
 */
export function useVersionHistory(
  chapter: Chapter | null,
  options: VersionHistoryOptions = {}
): [VersionHistoryState, VersionHistoryActions] {
  const {
    maxVersions = 50,
    autoSaveInterval = 60000,
    minChangeThreshold = 50,
    onVersionSave,
  } = options;

  const [versions, setVersions] = useState<ChapterVersion[]>(chapter?.versions || []);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const lastSavedContentRef = useRef<string>(chapter?.content || '');
  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 同步章节变化
  useEffect(() => {
    if (chapter) {
      setVersions(chapter.versions || []);
      lastSavedContentRef.current = chapter.content;
    }
  }, [chapter?.id]);

  // 自动保存定时器
  useEffect(() => {
    if (autoSaveInterval > 0 && chapter) {
      autoSaveTimerRef.current = setInterval(() => {
        if (hasUnsavedChanges && chapter.content !== lastSavedContentRef.current) {
          const wordDiff = Math.abs(
            countWords(chapter.content) - countWords(lastSavedContentRef.current)
          );
          if (wordDiff >= minChangeThreshold) {
            saveVersion(chapter.content, '自动保存');
          }
        }
      }, autoSaveInterval);

      return () => {
        if (autoSaveTimerRef.current) {
          clearInterval(autoSaveTimerRef.current);
        }
      };
    }
  }, [autoSaveInterval, chapter, hasUnsavedChanges, minChangeThreshold]);

  // 保存新版本
  const saveVersion = useCallback(
    (content: string, note?: string): ChapterVersion | null => {
      if (!chapter) return null;

      // 检查是否有足够的变化
      const wordDiff = Math.abs(countWords(content) - countWords(lastSavedContentRef.current));
      if (wordDiff < minChangeThreshold && versions.length > 0) {
        return null;
      }

      const newVersion: ChapterVersion = {
        id: createVersionId(),
        chapterId: chapter.id,
        content,
        wordCount: countWords(content),
        createdAt: new Date().toISOString(),
        note,
      };

      setVersions((prev) => {
        const updated = [newVersion, ...prev];
        // 限制版本数量
        if (updated.length > maxVersions) {
          return updated.slice(0, maxVersions);
        }
        return updated;
      });

      lastSavedContentRef.current = content;
      setHasUnsavedChanges(false);
      onVersionSave?.(newVersion);

      return newVersion;
    },
    [chapter, maxVersions, minChangeThreshold, versions.length, onVersionSave]
  );

  // 恢复到指定版本
  const restoreVersion = useCallback(
    (versionId: string): ChapterVersion | null => {
      const version = versions.find((v) => v.id === versionId);
      if (!version) return null;

      // 在恢复之前，先保存当前版本
      if (chapter && chapter.content !== lastSavedContentRef.current) {
        saveVersion(chapter.content, '恢复前自动保存');
      }

      return version;
    },
    [versions, chapter, saveVersion]
  );

  // 删除指定版本
  const deleteVersion = useCallback((versionId: string) => {
    setVersions((prev) => prev.filter((v) => v.id !== versionId));
    if (selectedVersionId === versionId) {
      setSelectedVersionId(null);
    }
  }, [selectedVersionId]);

  // 选择版本预览
  const selectVersion = useCallback((versionId: string | null) => {
    setSelectedVersionId(versionId);
  }, []);

  // 获取版本差异
  const getDiff = useCallback(
    (versionId1: string, versionId2: string): VersionDiff | null => {
      const v1 = versions.find((v) => v.id === versionId1);
      const v2 = versions.find((v) => v.id === versionId2);

      if (!v1 || !v2) return null;

      return calculateDiff(v1.content, v2.content);
    },
    [versions]
  );

  // 清空所有版本
  const clearAllVersions = useCallback(() => {
    setVersions([]);
    setSelectedVersionId(null);
  }, []);

  // 标记未保存
  const markUnsaved = useCallback(() => {
    setHasUnsavedChanges(true);
  }, []);

  const state: VersionHistoryState = {
    versions,
    isLoading,
    selectedVersionId,
    hasUnsavedChanges,
  };

  const actions: VersionHistoryActions = {
    saveVersion,
    restoreVersion,
    deleteVersion,
    selectVersion,
    getDiff,
    clearAllVersions,
    markUnsaved,
  };

  return [state, actions];
}

export default useVersionHistory;
