import React, { useMemo, useState } from 'react';
import { PromptEntry, User } from '../../../types';
import { createPromptId } from '../../../utils/id';

interface PromptsLibraryProps {
  prompts: PromptEntry[];
  onPromptsChange: React.Dispatch<React.SetStateAction<PromptEntry[]>>;
  currentUser: User | null;
}

const categories = [
  { id: 'all', label: '全部' },
  { id: 'analysis', label: '拆书分析' },
  { id: 'text', label: '正文推进' },
  { id: 'synopsis', label: '简介策略' },
  { id: 'short', label: '短篇灵感' }
];

const iconMap: Record<PromptEntry['iconType'], string> = {
  book: '📘',
  file: '📄',
  sparkles: '✨',
  pen: '✒️',
  star: '⭐',
  box: '🧩'
};

const PromptsLibrary: React.FC<PromptsLibraryProps> = ({ prompts, onPromptsChange, currentUser }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'analysis',
    visibility: 'public' as PromptEntry['visibility'],
    content: '',
  });

  const filteredPrompts = useMemo(() => {
    return prompts.filter(prompt => {
      const categoryPass = activeCategory === 'all' || prompt.category === activeCategory;
      const keywordPass = keyword.trim().length === 0 || prompt.title.toLowerCase().includes(keyword.toLowerCase());
      return categoryPass && keywordPass;
    });
  }, [prompts, activeCategory, keyword]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const entry: PromptEntry = {
      id: createPromptId(),
      title: form.title,
      description: form.description,
      author: currentUser?.name || '匿名作者',
      category: form.category,
      visibility: form.visibility,
      usageCount: 0,
      iconType: 'sparkles',
      isFavorite: false,
      tags: [],
      content: form.content,
      updatedAt: new Date().toISOString(),
    };
    onPromptsChange(prev => [entry, ...prev]);
    setForm({ title: '', description: '', category: 'analysis', visibility: 'public', content: '' });
  };

  const toggleFavorite = (id: string) => {
    onPromptsChange(prev => prev.map(item => item.id === id ? { ...item, isFavorite: !item.isFavorite } : item));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium border ${activeCategory === cat.id ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
            >
              {cat.label}
            </button>
          ))}
          <input
            className="ml-auto px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            placeholder="搜索提示词"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 space-y-4">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">创建提示词</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            placeholder="标题"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <select
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            {categories.filter(cat => cat.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
          <select
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            value={form.visibility}
            onChange={(e) => setForm({ ...form, visibility: e.target.value as PromptEntry['visibility'] })}
          >
            <option value="public">公开</option>
            <option value="private">私有</option>
          </select>
        </div>
        <textarea
          className="w-full min-h-[60px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          placeholder="描述"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <textarea
          className="w-full min-h-[120px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          placeholder="提示词内容（可含变量）"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
        />
        <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-semibold">保存提示词</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPrompts.length === 0 ? (
          <div className="col-span-full text-center text-sm text-slate-500 dark:text-slate-400 py-12">
            暂无提示词，试着创建一个吧。
          </div>
        ) : (
          filteredPrompts.map(prompt => (
            <div key={prompt.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-2xl">{iconMap[prompt.iconType]}</p>
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-100 mt-2">{prompt.title}</h4>
                </div>
                <button onClick={() => toggleFavorite(prompt.id)} className="text-sm text-rose-500">
                  {prompt.isFavorite ? '❤️' : '🤍'}
                </button>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">{prompt.description}</p>
              <div className="text-xs text-slate-400 dark:text-slate-500">作者：{prompt.author}</div>
              <button
                onClick={() => navigator.clipboard.writeText(prompt.content)}
                className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 underline"
              >
                复制提示词
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PromptsLibrary;
