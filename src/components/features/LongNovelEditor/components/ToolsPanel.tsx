import React, { useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { useEditorStore, SearchResult, CreativeManagementTab } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';
import { Chapter, WritingGoal, WritingRecord, ChapterTemplate } from '../../../../types';
import { createChapterId } from '../../../../utils/id';

// 格式化番茄钟时间
const formatPomodoroTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const ToolsPanel: React.FC = () => {
  const { themeClasses, effectiveTheme, chapters, currentChapter, onUpdateNovel, novel } = useEditorContext();

  const {
    characters,
    worldviews,
    timelineEvents,
    references,
    setCreativeModalType,
    showOutlineManager,
    setShowOutlineManager,
    outlineNodes,
    showForeshadowingTracker,
    setShowForeshadowingTracker,
    foreshadowings,
    showWritingGoal,
    setShowWritingGoal,
    writingGoals,
    writingRecords,
    showSearchReplace,
    setShowSearchReplace,
    searchText,
    setSearchText,
    replaceText,
    setReplaceText,
    searchResults,
    setSearchResults,
    currentSearchIndex,
    setCurrentSearchIndex,
    searchScope,
    setSearchScope,
    setSelectedChapterId,
    isSpeaking,
    setIsSpeaking,
    voice,
    setVoice,
    voiceRate,
    setVoiceRate,
    locations,
    setShowLocationManager,
    items,
    setShowItemManager,
    chapterTemplates,
    setChapterTemplates,
    showTemplateManager,
    setShowTemplateManager,
    showStatsPanel,
    setShowStatsPanel,
    showDialogGenerator,
    setShowDialogGenerator,
    pomodoroTime,
    setPomodoroTime,
    pomodoroRunning,
    setPomodoroRunning,
    pomodoroMode,
    setPomodoroMode,
    pomodoroCount,
    setPomodoroCount,
  } = useEditorStore();

  // 文件输入 ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // 语音合成
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 获取可用语音
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis?.getVoices() || [];
      const chineseVoices = voices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
      setAvailableVoices(chineseVoices.length > 0 ? chineseVoices : voices.slice(0, 10));
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  // 获取活跃写作目标
  const activeGoal = useMemo(() => {
    return writingGoals.find(g => g.isActive) || null;
  }, [writingGoals]);

  // 获取连续写作天数
  const getStreakDays = useCallback((): number => {
    if (writingRecords.length === 0) return 0;
    const sortedRecords = [...writingRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    for (const record of sortedRecords) {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === streak || (diffDays === 0 && streak === 0)) {
        streak++;
        currentDate = recordDate;
      } else {
        break;
      }
    }
    return streak;
  }, [writingRecords]);

  // 获取今日已写字数
  const getTodayWrittenWords = useCallback((): number => {
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = writingRecords.find(r => r.date === today);
    return todayRecord?.wordCount || 0;
  }, [writingRecords]);

  // 执行搜索
  const performSearch = useCallback(() => {
    if (!searchText.trim()) return;
    const results: SearchResult[] = [];
    const searchIn = searchScope === 'current' && currentChapter
      ? [currentChapter]
      : chapters;
    searchIn.forEach(chapter => {
      let index = chapter.content.indexOf(searchText);
      while (index !== -1) {
        const start = Math.max(0, index - 20);
        const end = Math.min(chapter.content.length, index + searchText.length + 20);
        results.push({
          chapterId: chapter.id,
          index,
          text: chapter.content.slice(start, end)
        });
        index = chapter.content.indexOf(searchText, index + 1);
      }
    });
    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchText, searchScope, currentChapter, chapters, setSearchResults, setCurrentSearchIndex]);

  // 替换当前结果
  const replaceCurrentResult = useCallback(() => {
    if (searchResults.length === 0) return;
    const result = searchResults[currentSearchIndex];
    const chapter = chapters.find(c => c.id === result.chapterId);
    if (!chapter) return;
    const newContent = chapter.content.slice(0, result.index) + replaceText + chapter.content.slice(result.index + searchText.length);
    const updatedChapters = chapters.map(c =>
      c.id === chapter.id ? { ...c, content: newContent, wordCount: newContent.length } : c
    );
    onUpdateNovel({ chapters: updatedChapters, wordCount: updatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0) });
    performSearch();
  }, [searchResults, currentSearchIndex, chapters, searchText, replaceText, onUpdateNovel, performSearch]);

  // 替换所有结果
  const replaceAllResults = useCallback(() => {
    if (searchResults.length === 0) return;
    if (!window.confirm(`确定要替换所有 ${searchResults.length} 个结果吗？`)) return;
    let updatedChapters = [...chapters];
    const searchIn = searchScope === 'current' && currentChapter
      ? [currentChapter]
      : chapters;
    searchIn.forEach(chapter => {
      const newContent = chapter.content.split(searchText).join(replaceText);
      updatedChapters = updatedChapters.map(c =>
        c.id === chapter.id ? { ...c, content: newContent, wordCount: newContent.length } : c
      );
    });
    onUpdateNovel({ chapters: updatedChapters, wordCount: updatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0) });
    setSearchResults([]);
    setCurrentSearchIndex(0);
  }, [searchResults, chapters, searchScope, currentChapter, searchText, replaceText, onUpdateNovel, setSearchResults, setCurrentSearchIndex]);

  // 跳转到搜索结果
  const goToSearchResult = useCallback((index: number) => {
    if (index < 0 || index >= searchResults.length) return;
    setCurrentSearchIndex(index);
    const result = searchResults[index];
    setSelectedChapterId(result.chapterId);
  }, [searchResults, setCurrentSearchIndex, setSelectedChapterId]);

  // 切换语音朗读
  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    } else if (currentChapter) {
      const utterance = new SpeechSynthesisUtterance(currentChapter.content);
      utterance.rate = voiceRate;
      const selectedVoice = availableVoices.find(v => v.name === voice);
      if (selectedVoice) utterance.voice = selectedVoice;
      utterance.onend = () => setIsSpeaking(false);
      speechRef.current = utterance;
      window.speechSynthesis?.speak(utterance);
      setIsSpeaking(true);
    }
  }, [isSpeaking, currentChapter, voiceRate, voice, availableVoices, setIsSpeaking]);

  // 导出函数
  const exportToTXT = useCallback(() => {
    if (!currentChapter) return;
    const blob = new Blob([currentChapter.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentChapter]);

  const exportToMarkdown = useCallback(() => {
    if (!currentChapter) return;
    const content = `# ${currentChapter.title}\n\n${currentChapter.content}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentChapter]);

  const exportToWord = useCallback(() => {
    if (!currentChapter) return;
    const content = `<html><head><meta charset="utf-8"></head><body><h1>${currentChapter.title}</h1><p>${currentChapter.content.replace(/\n/g, '</p><p>')}</p></body></html>`;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentChapter]);

  const exportToPDF = useCallback(() => {
    if (!currentChapter) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${currentChapter.title}</title><style>body{font-family:sans-serif;padding:40px;line-height:1.8;}h1{margin-bottom:20px;}</style></head><body><h1>${currentChapter.title}</h1><p>${currentChapter.content.replace(/\n/g, '</p><p>')}</p></body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  }, [currentChapter]);

  const exportAllChapters = useCallback((format: 'txt' | 'md') => {
    const content = chapters.map(ch => format === 'md' ? `# ${ch.title}\n\n${ch.content}` : `${ch.title}\n\n${ch.content}`).join('\n\n---\n\n');
    const blob = new Blob([content], { type: format === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `全部章节.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chapters]);

  // 模板相关
  const deleteTemplate = useCallback((id: string) => {
    setChapterTemplates(chapterTemplates.filter(t => t.id !== id));
  }, [chapterTemplates, setChapterTemplates]);

  const applyTemplate = useCallback((templateId: string) => {
    if (!currentChapter) {
      alert('请先选择一个章节');
      return;
    }
    const template = chapterTemplates.find(t => t.id === templateId);
    if (!template) return;
    if (!window.confirm('应用模板将覆盖当前章节内容，是否继续？')) return;
    const updatedChapters = chapters.map(c =>
      c.id === currentChapter.id ? { ...c, content: template.content, wordCount: template.content.length } : c
    );
    onUpdateNovel({ chapters: updatedChapters, wordCount: updatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0) });
  }, [currentChapter, chapterTemplates, chapters, onUpdateNovel]);

  // 统计相关
  const getTotalStats = useMemo(() => {
    const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
    const totalDays = writingRecords.length;
    const avgDaily = totalDays > 0 ? Math.round(writingRecords.reduce((sum, r) => sum + r.wordCount, 0) / totalDays) : 0;
    const maxDaily = writingRecords.length > 0 ? Math.max(...writingRecords.map(r => r.wordCount)) : 0;
    return { totalWords, totalDays, avgDaily, maxDaily };
  }, [chapters, writingRecords]);

  const getWeeklyStats = useCallback(() => {
    const stats: { date: string; words: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = writingRecords.find(r => r.date === dateStr);
      stats.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        words: record?.wordCount || 0
      });
    }
    return stats;
  }, [writingRecords]);

  // 检查工具
  const checkProperNouns = useCallback(() => {
    alert('专有名词检查功能开发中...\n将检测人物名、地名等专有名词的一致性');
  }, []);

  const checkSensitiveWords = useCallback(() => {
    alert('敏感词检测功能开发中...\n将检测可能存在问题的敏感词汇');
  }, []);

  // 文件导入
  const handleFileImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target?.result as string;
        const title = file.name.replace(/\.(txt|md)$/, '');
        const newChapter: Chapter = {
          id: createChapterId(),
          title,
          content,
          wordCount: content.length,
        };
        const updatedChapters = [...chapters, newChapter];
        onUpdateNovel({ chapters: updatedChapters, wordCount: updatedChapters.reduce((sum, ch) => sum + ch.wordCount, 0) });
      };
      reader.readAsText(file);
    });
    e.target.value = '';
  }, [chapters, onUpdateNovel]);

  // 番茄钟
  const pomodoroRef = useRef<NodeJS.Timeout | null>(null);

  const startPomodoro = useCallback(() => {
    setPomodoroRunning(true);
    pomodoroRef.current = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          clearInterval(pomodoroRef.current!);
          setPomodoroRunning(false);
          const currentMode = useEditorStore.getState().pomodoroMode;
          if (currentMode === 'work') {
            setPomodoroMode('break');
            setPomodoroCount(useEditorStore.getState().pomodoroCount + 1);
            return 5 * 60;
          } else {
            setPomodoroMode('work');
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
  }, [setPomodoroRunning, setPomodoroTime, setPomodoroMode, setPomodoroCount]);

  const pausePomodoro = useCallback(() => {
    if (pomodoroRef.current) {
      clearInterval(pomodoroRef.current);
    }
    setPomodoroRunning(false);
  }, [setPomodoroRunning]);

  const resetPomodoro = useCallback(() => {
    if (pomodoroRef.current) {
      clearInterval(pomodoroRef.current);
    }
    setPomodoroRunning(false);
    setPomodoroTime(25 * 60);
    setPomodoroMode('work');
  }, [setPomodoroRunning, setPomodoroTime, setPomodoroMode]);

  useEffect(() => {
    return () => {
      if (pomodoroRef.current) {
        clearInterval(pomodoroRef.current);
      }
    };
  }, []);

  // 备份导出
  const exportBackup = useCallback(() => {
    if (!novel) return;
    const backup = {
      ...novel,
      characters,
      worldviews,
      timelineEvents,
      references,
      outlineNodes,
      foreshadowings,
      locations,
      items,
      writingGoals,
      writingRecords,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${novel.title || '小说'}_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [novel, characters, worldviews, timelineEvents, references, outlineNodes, foreshadowings, locations, items, writingGoals, writingRecords]);

  const handleBackupImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const backup = JSON.parse(ev.target?.result as string);
        if (!window.confirm('导入备份将覆盖当前所有数据，是否继续？')) return;
        onUpdateNovel(backup);
        alert('备份恢复成功！');
      } catch {
        alert('备份文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [onUpdateNovel]);

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-6 text-sm ${themeClasses.text}`}>
      {/* 创作管理 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>创作管理</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'characters', label: '人物', count: characters.length },
            { key: 'worldview', label: '世界观', count: worldviews.length },
            { key: 'events', label: '事件线', count: timelineEvents.length },
            { key: 'references', label: '语料库', count: references.length }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setCreativeModalType(item.key as CreativeManagementTab)}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
            >
              <p className={`text-xs ${themeClasses.textMuted}`}>{item.label}</p>
              <p className="text-xl font-semibold mt-1">{item.count}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 大纲与伏笔 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>规划工具</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowOutlineManager(true)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>📋</span>
              <p className={`text-xs ${themeClasses.textMuted}`}>大纲管理</p>
            </div>
            <p className="text-xl font-semibold">{outlineNodes.length}</p>
          </button>
          <button
            onClick={() => setShowForeshadowingTracker(true)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>🌱</span>
              <p className={`text-xs ${themeClasses.textMuted}`}>伏笔追踪</p>
            </div>
            <p className="text-xl font-semibold">{foreshadowings.filter(f => f.status === 'planted').length}</p>
          </button>
        </div>
      </section>

      {/* 写作目标 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${themeClasses.text}`}>写作目标</p>
            <p className={`text-xs ${themeClasses.textMuted}`}>连续 {getStreakDays()} 天</p>
          </div>
          <button
            className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
            onClick={() => setShowWritingGoal(true)}
          >
            设置目标
          </button>
        </div>
        {activeGoal ? (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className={themeClasses.textMuted}>今日进度</span>
              <span>{getTodayWrittenWords()} / {activeGoal.targetWords} 字</span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${effectiveTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
              <div
                className={`h-full transition-all duration-500 ${
                  getTodayWrittenWords() >= activeGoal.targetWords ? 'bg-green-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, (getTodayWrittenWords() / activeGoal.targetWords) * 100)}%` }}
              />
            </div>
            {getTodayWrittenWords() >= activeGoal.targetWords && (
              <p className="text-xs text-green-500 text-center">今日目标已完成!</p>
            )}
          </div>
        ) : (
          <p className={`text-xs ${themeClasses.textMuted}`}>尚未设置写作目标</p>
        )}
      </section>

      {/* 查找替换 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${themeClasses.text}`}>查找替换</p>
          <button
            className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
            onClick={() => setShowSearchReplace(!showSearchReplace)}
          >
            {showSearchReplace ? '收起' : '展开'}
          </button>
        </div>
        {showSearchReplace && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                  searchScope === 'current'
                    ? 'bg-indigo-500 text-white'
                    : `border ${themeClasses.border}`
                }`}
                onClick={() => setSearchScope('current')}
              >
                当前章节
              </button>
              <button
                className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                  searchScope === 'all'
                    ? 'bg-indigo-500 text-white'
                    : `border ${themeClasses.border}`
                }`}
                onClick={() => setSearchScope('all')}
              >
                全部章节
              </button>
            </div>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="查找内容..."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${themeClasses.input}`}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            />
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="替换为..."
              className={`w-full px-3 py-2 text-sm rounded-lg border ${themeClasses.input}`}
            />
            <div className="flex gap-2">
              <button
                onClick={performSearch}
                className="flex-1 py-2 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
              >
                查找
              </button>
              <button
                onClick={replaceCurrentResult}
                disabled={searchResults.length === 0}
                className="flex-1 py-2 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
              >
                替换
              </button>
              <button
                onClick={replaceAllResults}
                disabled={searchResults.length === 0}
                className="flex-1 py-2 text-xs bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
              >
                全部替换
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className={themeClasses.textMuted}>
                    找到 {searchResults.length} 个结果
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => goToSearchResult(currentSearchIndex - 1)}
                      disabled={currentSearchIndex === 0}
                      className={`px-2 py-1 rounded border ${themeClasses.border} disabled:opacity-50`}
                    >
                      上一个
                    </button>
                    <button
                      onClick={() => goToSearchResult(currentSearchIndex + 1)}
                      disabled={currentSearchIndex >= searchResults.length - 1}
                      className={`px-2 py-1 rounded border ${themeClasses.border} disabled:opacity-50`}
                    >
                      下一个
                    </button>
                  </div>
                </div>
                <div className={`max-h-32 overflow-y-auto space-y-1 text-xs ${themeClasses.textMuted}`}>
                  {searchResults.slice(0, 10).map((result, idx) => (
                    <div
                      key={idx}
                      onClick={() => goToSearchResult(idx)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        idx === currentSearchIndex
                          ? 'bg-indigo-500/20 border border-indigo-500/30'
                          : `hover:${effectiveTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`
                      }`}
                    >
                      <span className="font-medium">
                        {chapters.find(c => c.id === result.chapterId)?.title || '未知章节'}
                      </span>
                      <p className="truncate mt-0.5">{result.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* 语音朗读 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${themeClasses.text}`}>语音朗读</p>
            <p className={`text-xs ${themeClasses.textMuted}`}>将当前章节转换为语音</p>
          </div>
          <button
            className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
              isSpeaking
                ? 'bg-rose-500 text-white'
                : `border ${themeClasses.border} hover:border-indigo-400`
            }`}
            onClick={toggleSpeaking}
          >
            {isSpeaking ? '停止朗读' : '开始朗读'}
          </button>
        </div>
        <div>
          <p className={`text-xs ${themeClasses.textMuted} mb-1`}>可用语音 ({availableVoices.length})</p>
          <select
            value={voice}
            onChange={(e) => setVoice(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 text-sm ${themeClasses.input}`}
          >
            {availableVoices.length > 0 ? (
              availableVoices.map((v, i) => (
                <option key={i} value={v.name}>{v.name}</option>
              ))
            ) : (
              <>
                <option>系统默认语音</option>
                <option>Microsoft Yunxi Online (Natural)</option>
              </>
            )}
          </select>
        </div>
        <div>
          <p className={`text-xs ${themeClasses.textMuted} mb-1`}>语速调节</p>
          <div className="flex items-center gap-3">
            <span className={`text-xs ${themeClasses.textMuted} w-8`}>{voiceRate.toFixed(1)}x</span>
            <input
              type="range"
              min={0.5}
              max={2}
              step={0.1}
              value={voiceRate}
              onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
          </div>
        </div>
      </section>

      {/* 导出工具 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${themeClasses.text}`}>导出工具</p>
          <span className={`text-xs ${themeClasses.textMuted}`}>导出当前章节</span>
        </div>
        <button
          onClick={exportToTXT}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>📄</span>
          导出为 TXT
        </button>
        <button
          onClick={exportToMarkdown}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>📝</span>
          导出为 Markdown
        </button>
        <button
          onClick={exportToWord}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>📘</span>
          导出为 Word
        </button>
        <button
          onClick={exportToPDF}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>📕</span>
          导出为 PDF
        </button>
        <div className={`border-t ${themeClasses.border} pt-3 mt-3`}>
          <p className={`text-xs ${themeClasses.textMuted} mb-2`}>导出全部章节</p>
          <div className="flex gap-2">
            <button
              onClick={() => exportAllChapters('txt')}
              className={`flex-1 px-3 py-1.5 rounded-xl border ${themeClasses.border} text-xs hover:border-indigo-400`}
            >
              全部 TXT
            </button>
            <button
              onClick={() => exportAllChapters('md')}
              className={`flex-1 px-3 py-1.5 rounded-xl border ${themeClasses.border} text-xs hover:border-indigo-400`}
            >
              全部 Markdown
            </button>
          </div>
        </div>
      </section>

      {/* 场景/道具管理 */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>设定管理</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowLocationManager(true)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>🏔️</span>
              <p className={`text-xs ${themeClasses.textMuted}`}>场景地点</p>
            </div>
            <p className="text-xl font-semibold">{locations.length}</p>
          </button>
          <button
            onClick={() => setShowItemManager(true)}
            className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span>⚔️</span>
              <p className={`text-xs ${themeClasses.textMuted}`}>道具技能</p>
            </div>
            <p className="text-xl font-semibold">{items.length}</p>
          </button>
        </div>
      </section>

      {/* 章节模板 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${themeClasses.text}`}>章节模板</p>
            <p className={`text-xs ${themeClasses.textMuted}`}>{chapterTemplates.length} 个模板</p>
          </div>
          <button
            className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
            onClick={() => setShowTemplateManager(!showTemplateManager)}
          >
            {showTemplateManager ? '收起' : '展开'}
          </button>
        </div>
        {showTemplateManager && (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {chapterTemplates.map(template => (
              <div
                key={template.id}
                className={`p-2 rounded-xl border ${themeClasses.border} hover:border-indigo-400/50 transition-colors`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{template.name}</span>
                  <div className="flex items-center gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${themeClasses.sidebar} ${themeClasses.textMuted}`}>
                      {template.category}
                    </span>
                    {!template.isBuiltIn && (
                      <button
                        onClick={() => deleteTemplate(template.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                <p className={`text-xs ${themeClasses.textMuted} line-clamp-2`}>{template.description || template.content.slice(0, 50)}...</p>
                <button
                  onClick={() => applyTemplate(template.id)}
                  className="mt-2 w-full py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  应用到当前章节
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 写作统计 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${themeClasses.text}`}>写作统计</p>
          <button
            className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
            onClick={() => setShowStatsPanel(!showStatsPanel)}
          >
            {showStatsPanel ? '收起' : '查看详情'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
            <p className={themeClasses.textMuted}>总字数</p>
            <p className="text-lg font-semibold">{getTotalStats.totalWords.toLocaleString()}</p>
          </div>
          <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
            <p className={themeClasses.textMuted}>写作天数</p>
            <p className="text-lg font-semibold">{getTotalStats.totalDays}</p>
          </div>
          <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
            <p className={themeClasses.textMuted}>日均字数</p>
            <p className="text-lg font-semibold">{getTotalStats.avgDaily.toLocaleString()}</p>
          </div>
          <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
            <p className={themeClasses.textMuted}>最高纪录</p>
            <p className="text-lg font-semibold">{getTotalStats.maxDaily.toLocaleString()}</p>
          </div>
        </div>
        {showStatsPanel && (
          <div className="space-y-3 pt-2">
            <p className={`text-xs font-medium ${themeClasses.text}`}>近7天写作趋势</p>
            <div className="flex items-end gap-1 h-20">
              {getWeeklyStats().map((stat, idx) => {
                const maxWords = Math.max(...getWeeklyStats().map(s => s.words), 1);
                const height = (stat.words / maxWords) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-t transition-all ${stat.words > 0 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                      style={{ height: `${Math.max(height, 4)}%` }}
                      title={`${stat.date}: ${stat.words}字`}
                    />
                    <span className={`text-[9px] ${themeClasses.textMuted}`}>{stat.date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* AI 角色对话生成 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-semibold ${themeClasses.text}`}>AI 对话生成</p>
            <p className={`text-xs ${themeClasses.textMuted}`}>基于人物设定生成对话</p>
          </div>
          <button
            className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
            onClick={() => setShowDialogGenerator(true)}
            disabled={characters.length < 2}
          >
            {characters.length < 2 ? '需要2+人物' : '生成对话'}
          </button>
        </div>
      </section>

      {/* 检查工具 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <p className={`text-sm font-semibold ${themeClasses.text}`}>检查工具</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={checkProperNouns}
            className={`px-3 py-2 text-xs rounded-xl border ${themeClasses.border} hover:border-amber-400 transition-colors flex flex-col items-center gap-1`}
          >
            <span>📝</span>
            <span>专有名词检查</span>
          </button>
          <button
            onClick={checkSensitiveWords}
            className={`px-3 py-2 text-xs rounded-xl border ${themeClasses.border} hover:border-rose-400 transition-colors flex flex-col items-center gap-1`}
          >
            <span>🚨</span>
            <span>敏感词检测</span>
          </button>
        </div>
      </section>

      {/* 导入工具 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${themeClasses.text}`}>导入工具</p>
          <span className={`text-xs ${themeClasses.textMuted}`}>批量导入章节</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".txt,.md"
          onChange={handleFileImport}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>📥</span>
          导入 TXT/Markdown 文件
        </button>
        <p className={`text-[10px] ${themeClasses.textMuted}`}>
          支持多选，每个文件将作为一个新章节导入
        </p>
      </section>

      {/* 番茄钟 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${themeClasses.text}`}>番茄钟</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${pomodoroMode === 'work' ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'}`}>
            {pomodoroMode === 'work' ? '专注' : '休息'}
          </span>
        </div>
        <div className="text-center">
          <p className={`text-4xl font-mono font-bold ${pomodoroMode === 'work' ? 'text-rose-500' : 'text-green-500'}`}>
            {formatPomodoroTime(pomodoroTime)}
          </p>
          <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
            已完成 {pomodoroCount} 个番茄
          </p>
        </div>
        <div className="flex gap-2">
          {!pomodoroRunning ? (
            <button
              onClick={startPomodoro}
              className="flex-1 py-2 text-sm bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
            >
              开始
            </button>
          ) : (
            <button
              onClick={pausePomodoro}
              className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
            >
              暂停
            </button>
          )}
          <button
            onClick={resetPomodoro}
            className={`flex-1 py-2 text-sm rounded-xl border ${themeClasses.border} hover:border-slate-400 transition-colors`}
          >
            重置
          </button>
        </div>
        <p className={`text-[10px] ${themeClasses.textMuted} text-center`}>
          专注25分钟，休息5分钟
        </p>
      </section>

      {/* 备份恢复 */}
      <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
        <div className="flex items-center justify-between">
          <p className={`text-sm font-semibold ${themeClasses.text}`}>备份恢复</p>
          <span className={`text-xs ${themeClasses.textMuted}`}>完整项目</span>
        </div>
        <button
          onClick={exportBackup}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-green-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>💾</span>
          导出完整备份
        </button>
        <input
          ref={backupInputRef}
          type="file"
          accept=".json"
          onChange={handleBackupImport}
          className="hidden"
        />
        <button
          onClick={() => backupInputRef.current?.click()}
          className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-blue-400 transition-colors`}
        >
          <span className={themeClasses.textMuted}>📂</span>
          从备份恢复
        </button>
        <p className={`text-[10px] ${themeClasses.textMuted}`}>
          备份包含：章节、人物、大纲、伏笔等所有数据
        </p>
      </section>
    </div>
  );
};

export default ToolsPanel;
