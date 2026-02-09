import React, { useMemo, useRef, useState } from 'react';
import { Novel, ViewState, Chapter } from '../../../types';
import { createNovelId, createChapterId } from '../../../utils/id';
import { BookOpen, Upload, Search, Copy, Trash2, Edit3 } from 'lucide-react';

interface NovelManagerProps {
  onNavigate: (view: ViewState) => void;
  novels: Novel[];
  onSaveNovel: (novel: Novel) => void;
  onNovelClick: (novel: Novel) => void;
  onCreateNovel?: (novel: Omit<Novel, 'id' | 'ownerId' | 'updatedAt'>) => void;
  onDeleteNovel?: (novelId: string) => void;
  isAuthenticated: boolean;
}

const CATEGORIES = [
  '玄幻奇幻', '武侠仙侠', '都市生活', '历史军事', '游戏竞技', '科幻未来', '悬疑灵异', '二次元'
];

// 章节标题匹配正则
const CHAPTER_PATTERNS = [
  /^第[一二三四五六七八九十百千万零0-9]+[章节回卷][\s\S]*$/,
  /^[第][0-9]+[章节回卷][\s\S]*$/,
  /^Chapter\s*[0-9]+[\s\S]*/i,
  /^[0-9]+[\.、．]\s*.+$/,
  /^【第[一二三四五六七八九十百千万零0-9]+[章节回卷]】[\s\S]*$/,
];

// 解析 TXT 内容并自动分章
const parseTxtToChapters = (content: string, novelTitle: string): Chapter[] => {
  const lines = content.split('\n');
  const chapters: Chapter[] = [];
  let currentChapter: { title: string; content: string[] } | null = null;
  let chapterIndex = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 检查是否是章节标题
    const isChapterTitle = CHAPTER_PATTERNS.some(pattern => pattern.test(trimmedLine));

    if (isChapterTitle && trimmedLine.length > 0 && trimmedLine.length < 100) {
      // 保存之前的章节
      if (currentChapter && currentChapter.content.length > 0) {
        const chapterContent = currentChapter.content.join('\n').trim();
        if (chapterContent.length > 0) {
          chapters.push({
            id: createChapterId(),
            title: currentChapter.title,
            content: chapterContent,
            wordCount: chapterContent.length,
          });
        }
      }
      // 开始新章节
      currentChapter = {
        title: trimmedLine,
        content: []
      };
      chapterIndex++;
    } else if (currentChapter) {
      // 添加到当前章节
      currentChapter.content.push(line);
    } else if (trimmedLine.length > 0) {
      // 第一个章节之前的内容，创建一个序章
      if (!currentChapter) {
        currentChapter = {
          title: '序章',
          content: [line]
        };
      }
    }
  }

  // 保存最后一个章节
  if (currentChapter && currentChapter.content.length > 0) {
    const chapterContent = currentChapter.content.join('\n').trim();
    if (chapterContent.length > 0) {
      chapters.push({
        id: createChapterId(),
        title: currentChapter.title,
        content: chapterContent,
        wordCount: chapterContent.length,
      });
    }
  }

  // 如果没有找到任何章节标题，将整个内容作为一个章节
  if (chapters.length === 0 && content.trim().length > 0) {
    chapters.push({
      id: createChapterId(),
      title: '第一章',
      content: content.trim(),
      wordCount: content.trim().length,
    });
  }

  return chapters;
};

const NovelManager: React.FC<NovelManagerProps> = ({
  onNavigate,
  novels,
  onSaveNovel,
  onNovelClick,
  onCreateNovel,
  onDeleteNovel,
  isAuthenticated
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [form, setForm] = useState({
    title: '',
    type: '',
    description: '',
    targetWordCount: 1000000,
    tags: [] as string[],
    cover: '' as string
  });
  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const txtImportRef = useRef<HTMLInputElement>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    filename: string;
    chapters: { title: string; wordCount: number }[];
    totalWords: number;
  } | null>(null);
  const [pendingImportContent, setPendingImportContent] = useState<string>('');

  const filteredNovels = useMemo(() => {
    return novels.filter(n => {
      const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
      const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [novels, statusFilter, searchQuery]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('请先登录再创建作品');
      return;
    }
    const payload = {
      title: form.title || '未命名作品',
      description: form.description || '暂无简介',
      type: form.type || '未分类',
      targetWordCount: form.targetWordCount,
      wordCount: 0,
      status: 'ongoing' as const,
      tags: form.tags.length > 0 ? form.tags : ['新书'],
      cover: form.cover || undefined
    };
    if (onCreateNovel) {
      onCreateNovel(payload);
    } else {
      onSaveNovel({
        ...payload,
        id: createNovelId(),
        updatedAt: new Date().toLocaleDateString('zh-CN')
      });
    }
    setForm({ title: '', type: '', description: '', targetWordCount: 1000000, tags: [], cover: '' });
    setTagInput('');
    setViewMode('list');
  };

  const handleTagAdd = () => {
    if (!tagInput.trim()) return;
    if (form.tags.includes(tagInput.trim())) {
      setTagInput('');
      return;
    }
    setForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
    setTagInput('');
  };

  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, cover: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  // TXT 文件导入处理
  const handleTxtImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;

      // 解析章节
      const filename = file.name.replace(/\.txt$/i, '');
      const chapters = parseTxtToChapters(content, filename);
      const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);

      // 设置预览
      setImportPreview({
        filename,
        chapters: chapters.map(ch => ({ title: ch.title, wordCount: ch.wordCount })),
        totalWords
      });
      setPendingImportContent(content);
      setShowImportModal(true);
    };

    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  };

  // 确认导入 TXT
  const confirmTxtImport = () => {
    if (!importPreview || !pendingImportContent) return;

    const chapters = parseTxtToChapters(pendingImportContent, importPreview.filename);

    const newNovel: Novel = {
      id: createNovelId(),
      title: importPreview.filename,
      description: `从 TXT 文件导入，共 ${chapters.length} 章`,
      type: '未分类',
      targetWordCount: importPreview.totalWords * 1.5,
      wordCount: importPreview.totalWords,
      status: 'ongoing',
      tags: ['导入'],
      chapters,
      updatedAt: new Date().toLocaleDateString('zh-CN')
    };

    onSaveNovel(newNovel);
    setShowImportModal(false);
    setImportPreview(null);
    setPendingImportContent('');
    alert(`成功导入《${importPreview.filename}》，共 ${chapters.length} 章，${importPreview.totalWords.toLocaleString()} 字`);
  };

  // 项目副本（复制小说）
  const duplicateNovel = (novel: Novel) => {
    const newNovel: Novel = {
      ...novel,
      id: createNovelId(),
      title: `${novel.title} (副本)`,
      description: novel.description,
      chapters: novel.chapters?.map(ch => ({
        ...ch,
        id: createChapterId()
      })) || [],
      updatedAt: new Date().toLocaleDateString('zh-CN')
    };

    onSaveNovel(newNovel);
    alert(`已创建《${novel.title}》的副本`);
  };

  if (viewMode === 'create') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <button
          onClick={() => setViewMode('list')}
          className="text-sm text-slate-500 hover:text-[#2C5F2D] dark:hover:text-[#97BC62] flex items-center gap-2 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          返回列表
        </button>
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">创建新小说</h2>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
              <label>小说标题</label>
              <span className="text-xs">{form.title.length} / 100</span>
            </div>
            <input
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入小说标题"
              className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 px-4 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 mb-2 block">小说类型</label>
            <select
              value={form.type}
              onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full h-12 rounded-lg border border-slate-200 dark:border-slate-700 px-4 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-transparent transition-all"
            >
              <option value="">请选择</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mb-2">
              <label>简介</label>
              <span className="text-xs">{form.description.length} / 1000</span>
            </div>
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入小说简介"
              className="w-full min-h-[120px] rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-transparent transition-all resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 mb-3 block">目标字数</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min={50000}
                max={1000000}
                step={50000}
                value={form.targetWordCount}
                onChange={(e) => setForm(prev => ({ ...prev, targetWordCount: Number(e.target.value) }))}
                className="flex-1 accent-[#2C5F2D]"
              />
              <span className="w-28 text-right text-sm font-medium text-[#2C5F2D]">{form.targetWordCount.toLocaleString()} 字</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 mb-3 block">封面上传</label>
            <div className="flex items-start gap-6">
              <div className="w-32 h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-center bg-slate-50 dark:bg-slate-900/40 overflow-hidden">
                {form.cover ? (
                  <img src={form.cover} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">支持 JPG/PNG/GIF/WEBP 格式，文件不超过 5 MB</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    选择文件
                  </button>
                  {form.cover && (
                    <button 
                      type="button" 
                      className="text-sm text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 transition-colors" 
                      onClick={() => setForm(prev => ({ ...prev, cover: '' }))}
                    >
                      移除封面
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-500 dark:text-slate-400 mb-3 block">标签</label>
            <div className="flex gap-3">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleTagAdd())}
                placeholder="添加标签后按回车"
                className="flex-1 h-11 rounded-lg border border-slate-200 dark:border-slate-700 px-4 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-transparent transition-all"
              />
              <button 
                type="button" 
                className="px-6 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium" 
                onClick={handleTagAdd}
              >
                添加
              </button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.tags.map(tag => (
                  <span 
                    key={tag} 
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-xs rounded-full text-slate-600 dark:text-slate-300 flex items-center gap-2"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))}
                      className="hover:text-rose-600 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="button" 
              className="flex-1 h-12 rounded-lg border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" 
              onClick={() => setViewMode('list')}
            >
              取消
            </button>
            <button 
              type="submit" 
              className="flex-1 h-12 rounded-lg bg-[#2C5F2D] text-white font-medium hover:bg-[#1E4620] transition-colors shadow-sm"
            >
              创建小说
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* TXT 导入预览模态框 */}
      {showImportModal && importPreview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl p-8 max-w-lg w-full space-y-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">确认导入</h3>
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                文件：<span className="font-medium text-slate-900 dark:text-slate-100">{importPreview.filename}.txt</span>
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                检测到 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{importPreview.chapters.length}</span> 个章节，
                共 <span className="font-semibold text-indigo-600 dark:text-indigo-400">{importPreview.totalWords.toLocaleString()}</span> 字
              </p>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              {importPreview.chapters.slice(0, 20).map((ch, idx) => (
                <div key={idx} className="flex justify-between text-xs py-1">
                  <span className="text-slate-700 dark:text-slate-300 truncate flex-1">{ch.title}</span>
                  <span className="text-slate-500 dark:text-slate-400 ml-3 flex-shrink-0">{ch.wordCount.toLocaleString()} 字</span>
                </div>
              ))}
              {importPreview.chapters.length > 20 && (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2 border-t border-slate-200 dark:border-slate-700">
                  ... 还有 {importPreview.chapters.length - 20} 个章节
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setShowImportModal(false); setImportPreview(null); setPendingImportContent(''); }}
                className="flex-1 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                取消
              </button>
              <button
                onClick={confirmTxtImport}
                className="flex-1 py-3 rounded-lg bg-[#2C5F2D] text-white text-sm font-medium hover:bg-[#1E4620] transition-colors shadow-sm"
              >
                确认导入
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">小说管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">共 {novels.length} 部作品</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索作品"
              className="pl-10 pr-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2C5F2D] focus:border-transparent transition-all w-48"
            />
          </div>
          <input
            ref={txtImportRef}
            type="file"
            accept=".txt"
            onChange={handleTxtImport}
            className="hidden"
          />
          <button
            className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 font-medium"
            onClick={() => txtImportRef.current?.click()}
          >
            <Upload className="w-4 h-4" />
            导入TXT
          </button>
          <button 
            className="px-6 py-3 rounded-lg bg-[#2C5F2D] text-white text-sm font-medium hover:bg-[#1E4620] transition-colors shadow-sm" 
            onClick={() => setViewMode('create')}
          >
            新建小说
          </button>
        </div>
      </div>

      <div className="flex gap-2">
        {(['all', 'ongoing', 'completed'] as const).map(key => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              statusFilter === key 
                ? 'bg-[#2C5F2D] text-white shadow-sm' 
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {key === 'all' ? '全部' : key === 'ongoing' ? '连载中' : '已完结'}
          </button>
        ))}
      </div>

      <div className="grid gap-6">
        {filteredNovels.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 h-80 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
            <BookOpen className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-medium mb-2">暂无作品</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">点击"新建小说"开始你的创作之旅</p>
            <button 
              className="px-6 py-3 rounded-lg bg-[#2C5F2D] text-white text-sm font-medium hover:bg-[#1E4620] transition-colors shadow-sm" 
              onClick={() => setViewMode('create')}
            >
              开始创作
            </button>
          </div>
        ) : (
          filteredNovels.map(novel => (
            <div 
              key={novel.id} 
              className="border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-6 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{novel.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">更新于 {novel.updatedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    className="p-2 text-[#2C5F2D] hover:bg-[#97BC62]/10 rounded-lg transition-colors" 
                    onClick={() => onNovelClick(novel)}
                    title="进入编辑"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-[#97BC62] hover:bg-[#97BC62]/10 rounded-lg transition-colors"
                    onClick={() => duplicateNovel(novel)}
                    title="复制"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  {onDeleteNovel && (
                    <button
                      className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                      onClick={() => {
                        if (window.confirm(`确定要删除《${novel.title}》吗？此操作不可撤销。`)) {
                          onDeleteNovel(novel.id);
                        }
                      }}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{novel.description}</p>
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">{novel.type}</span>
                <span>{novel.wordCount?.toLocaleString() || 0} 字</span>
                {novel.chapters && novel.chapters.length > 0 && (
                  <span>{novel.chapters.length} 章</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NovelManager;
