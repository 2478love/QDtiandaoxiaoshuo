import React, { createContext, useContext, useMemo, useEffect, useState, useCallback } from 'react';
import { Novel, Chapter, ActivityEntry, PromptEntry } from '../../../../types';
import { useEditorStore, ThemeOption } from '../store/editorStore';
import { createChapterId } from '../../../../utils/id';

// 主题样式类型
export interface ThemeClasses {
  main: string;
  sidebar: string;
  card: string;
  input: string;
  text: string;
  textMuted: string;
  border: string;
}

// Context 值类型
interface EditorContextValue {
  // Novel 数据
  novel: Novel | null;
  chapters: Chapter[];
  currentChapter: Chapter | null;

  // 主题
  effectiveTheme: 'light' | 'gray' | 'dark';
  themeClasses: ThemeClasses;

  // 回调函数
  onUpdateNovel: (updates: Partial<Novel>) => void;
  onBack: () => void;
  onRecordActivity?: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;

  // 提示词
  prompts: PromptEntry[];

  // 章节操作
  addChapter: (volumeId?: string) => void;
  updateChapter: (chapterId: string, updates: Partial<Chapter>) => void;
  deleteChapter: (chapterId: string) => void;
  moveChapterUp: (chapterId: string) => void;
  moveChapterDown: (chapterId: string) => void;
  moveChapterToVolume: (chapterId: string, volumeId: string | undefined) => void;
  duplicateChapter: (chapterId: string) => void;
  renameChapter: (chapterId: string, newTitle: string) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

interface EditorProviderProps {
  children: React.ReactNode;
  novel: Novel | null;
  onUpdateNovel: (updates: Partial<Novel>) => void;
  onBack: () => void;
  onRecordActivity?: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;
  prompts?: PromptEntry[];
}

export const EditorProvider: React.FC<EditorProviderProps> = ({
  children,
  novel,
  onUpdateNovel,
  onBack,
  onRecordActivity,
  prompts = []
}) => {
  const {
    themeOption,
    selectedChapterId,
    setSelectedChapterId,
  } = useEditorStore();

  // 系统主题偏好
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 计算实际主题
  const effectiveTheme = useMemo(() => {
    if (themeOption === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return themeOption as 'light' | 'gray' | 'dark';
  }, [themeOption, systemDark]);

  // 主题样式类
  const themeClasses = useMemo((): ThemeClasses => {
    switch (effectiveTheme) {
      case 'dark':
        return {
          main: 'bg-slate-900 text-slate-100 border-slate-700',
          sidebar: 'bg-slate-800 border-slate-700',
          card: 'bg-slate-800 border-slate-700',
          input: 'bg-slate-800 border-slate-600 text-slate-100',
          text: 'text-slate-100',
          textMuted: 'text-slate-400',
          border: 'border-slate-700'
        };
      case 'gray':
        return {
          main: 'bg-[#e8e6e3] text-slate-800 border-slate-300',
          sidebar: 'bg-[#d9d7d4] border-slate-300',
          card: 'bg-[#f0eeeb] border-slate-300',
          input: 'bg-[#f5f3f0] border-slate-300 text-slate-800',
          text: 'text-slate-800',
          textMuted: 'text-slate-500',
          border: 'border-slate-300'
        };
      default:
        return {
          main: 'bg-white text-slate-800 border-slate-100',
          sidebar: 'bg-slate-50/90 border-slate-100',
          card: 'bg-white border-slate-200',
          input: 'bg-white border-slate-200 text-slate-800',
          text: 'text-slate-800',
          textMuted: 'text-slate-400',
          border: 'border-slate-100'
        };
    }
  }, [effectiveTheme]);

  // 章节数据
  const chapters = useMemo(() => novel?.chapters || [], [novel?.chapters]);

  const currentChapter = useMemo(
    () => chapters.find((c) => c.id === selectedChapterId) || null,
    [chapters, selectedChapterId]
  );

  // 添加章节
  const addChapter = useCallback((volumeId?: string) => {
    const chapter: Chapter = {
      id: createChapterId(),
      title: `第 ${chapters.length + 1} 章`,
      content: '',
      wordCount: 0,
      volumeId
    };
    const next = [...chapters, chapter];
    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });
    setSelectedChapterId(chapter.id);
  }, [chapters, onUpdateNovel, setSelectedChapterId]);

  // 更新章节
  const updateChapter = useCallback((chapterId: string, updates: Partial<Chapter>) => {
    const next = chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, ...updates, wordCount: (updates.content ?? ch.content).length } : ch
    );
    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });
  }, [chapters, onUpdateNovel]);

  // 删除章节
  const deleteChapter = useCallback((chapterId: string) => {
    if (chapters.length <= 1) {
      alert('至少保留一个章节');
      return;
    }
    const chapter = chapters.find(c => c.id === chapterId);
    if (!window.confirm(`确定要删除"${chapter?.title}"吗？此操作不可撤销。`)) return;

    const next = chapters.filter(ch => ch.id !== chapterId);
    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });

    if (selectedChapterId === chapterId) {
      setSelectedChapterId(next[0]?.id || null);
    }
  }, [chapters, selectedChapterId, onUpdateNovel, setSelectedChapterId]);

  // 上移章节
  const moveChapterUp = useCallback((chapterId: string) => {
    const index = chapters.findIndex(ch => ch.id === chapterId);
    if (index <= 0) return;

    const newChapters = [...chapters];
    [newChapters[index - 1], newChapters[index]] = [newChapters[index], newChapters[index - 1]];
    onUpdateNovel({ chapters: newChapters });
  }, [chapters, onUpdateNovel]);

  // 下移章节
  const moveChapterDown = useCallback((chapterId: string) => {
    const index = chapters.findIndex(ch => ch.id === chapterId);
    if (index < 0 || index >= chapters.length - 1) return;

    const newChapters = [...chapters];
    [newChapters[index], newChapters[index + 1]] = [newChapters[index + 1], newChapters[index]];
    onUpdateNovel({ chapters: newChapters });
  }, [chapters, onUpdateNovel]);

  // 移动章节到卷
  const moveChapterToVolume = useCallback((chapterId: string, volumeId: string | undefined) => {
    const next = chapters.map(ch =>
      ch.id === chapterId ? { ...ch, volumeId } : ch
    );
    onUpdateNovel({ chapters: next });
  }, [chapters, onUpdateNovel]);

  // 复制章节
  const duplicateChapter = useCallback((chapterId: string) => {
    const chapter = chapters.find(ch => ch.id === chapterId);
    if (!chapter) return;

    const newChapter: Chapter = {
      ...chapter,
      id: createChapterId(),
      title: `${chapter.title} (副本)`
    };

    const index = chapters.findIndex(ch => ch.id === chapterId);
    const newChapters = [...chapters];
    newChapters.splice(index + 1, 0, newChapter);

    onUpdateNovel({ chapters: newChapters, wordCount: newChapters.reduce((sum, ch) => sum + ch.wordCount, 0) });
    setSelectedChapterId(newChapter.id);
  }, [chapters, onUpdateNovel, setSelectedChapterId]);

  // 重命名章节
  const renameChapter = useCallback((chapterId: string, newTitle: string) => {
    const next = chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, title: newTitle } : ch
    );
    onUpdateNovel({ chapters: next });
  }, [chapters, onUpdateNovel]);

  const value: EditorContextValue = {
    novel,
    chapters,
    currentChapter,
    effectiveTheme,
    themeClasses,
    onUpdateNovel,
    onBack,
    onRecordActivity,
    prompts,
    addChapter,
    updateChapter,
    deleteChapter,
    moveChapterUp,
    moveChapterDown,
    moveChapterToVolume,
    duplicateChapter,
    renameChapter,
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
};

// Hook 用于访问 Context
export const useEditorContext = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditorContext must be used within EditorProvider');
  }
  return context;
};

export default EditorContext;
