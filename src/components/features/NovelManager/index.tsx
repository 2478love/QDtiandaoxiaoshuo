import React, { useMemo, useRef, useState } from 'react';
import { Novel, ViewState } from '../../../types';
import { createNovelId } from '../../../utils/id';

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

  if (viewMode === 'create') {
    return (
      <div className="max-w-5xl mx-auto space-y-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
        <button
          onClick={() => setViewMode('list')}
          className="text-sm text-slate-500 hover:text-indigo-500 flex items-center gap-1"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
          返回列表
        </button>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">创建新小说</h2>

        <form onSubmit={handleCreate} className="space-y-6">
          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>小说标题</span>
              <span>{form.title.length} / 100</span>
            </div>
            <input
              maxLength={100}
              value={form.title}
              onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
              placeholder="请输入小说标题"
              className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 text-sm bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1 block">小说类型</label>
            <select
              value={form.type}
              onChange={(e) => setForm(prev => ({ ...prev, type: e.target.value }))}
              className="w-full h-12 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 text-sm bg-white dark:bg-slate-900"
            >
              <option value="">请选择</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex justify-between text-sm text-slate-400 mb-1">
              <span>简介</span>
              <span>{form.description.length} / 1000</span>
            </div>
            <textarea
              maxLength={1000}
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="请输入小说简介"
              className="w-full min-h-[120px] rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-white dark:bg-slate-900"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">目标字数</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={50000}
                max={1000000}
                step={50000}
                value={form.targetWordCount}
                onChange={(e) => setForm(prev => ({ ...prev, targetWordCount: Number(e.target.value) }))}
                className="flex-1 accent-indigo-500"
              />
              <span className="w-24 text-right text-sm text-indigo-600">{form.targetWordCount.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">封面上传</label>
            <div className="flex items-center gap-4">
              <div className="w-40 h-40 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-slate-900/40">
                {form.cover ? (
                  <img src={form.cover} alt="cover" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <span className="text-slate-400 text-xl">+</span>
                )}
              </div>
              <div className="space-y-2 text-xs text-slate-400">
                <p>支持 JPG/PNG/GIF/WEBP 格式，文件不超过 5 MB</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    点击上传
                  </button>
                  {form.cover && (
                    <button type="button" className="text-sm text-rose-500" onClick={() => setForm(prev => ({ ...prev, cover: '' }))}>
                      移除封面
                    </button>
                  )}
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleCoverUpload} />
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">标签</label>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="添加标签"
                className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 text-sm bg-white dark:bg-slate-900"
              />
              <button type="button" className="px-4 py-2 text-sm rounded-2xl border border-slate-200 dark:border-slate-700" onClick={handleTagAdd}>
                添加
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-xs rounded-full text-slate-500 dark:text-slate-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button type="button" className="flex-1 h-11 rounded-2xl border border-slate-200 dark:border-slate-700" onClick={() => setViewMode('list')}>
              取消
            </button>
            <button type="submit" className="flex-1 h-11 rounded-2xl bg-indigo-600 text-white font-semibold">
              创建小说
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">小说管理</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">共 {novels.length} 部作品</p>
        </div>
        <div className="flex gap-3">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索作品"
            className="px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900"
          />
          <button className="px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm" onClick={() => setViewMode('create')}>
            新建小说
          </button>
        </div>
      </div>

      <div className="flex gap-2 text-xs">
        {['all', 'ongoing', 'completed'].map(key => (
          <button
            key={key}
            onClick={() => setStatusFilter(key as typeof statusFilter)}
            className={`px-3 py-1 rounded-full border ${statusFilter === key ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}
          >
            {key === 'all' ? '全部' : key === 'ongoing' ? '连载中' : '已完结'}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredNovels.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 dark:border-slate-800 h-64 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
            暂无作品，点击"新建小说"开始创作。
          </div>
        ) : (
          filteredNovels.map(novel => (
            <div key={novel.id} className="border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-slate-900 p-6 flex flex-col gap-3 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{novel.title}</h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">更新于 {novel.updatedAt}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-sm text-indigo-500 hover:text-indigo-600" onClick={() => onNovelClick(novel)}>
                    进入编辑
                  </button>
                  {onDeleteNovel && (
                    <button
                      className="text-sm text-rose-500 hover:text-rose-600"
                      onClick={() => {
                        if (window.confirm(`确定要删除《${novel.title}》吗？此操作不可撤销。`)) {
                          onDeleteNovel(novel.id);
                        }
                      }}
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{novel.description}</p>
              <div className="text-xs text-slate-400 dark:text-slate-500">
                {novel.type} · {novel.wordCount} 字
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default NovelManager;
