import React, { useState, useCallback, useMemo } from 'react';
import { Foreshadowing, Chapter, Character } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';
import { createForeshadowId } from '../../../utils/id';

interface ForeshadowingTrackerProps {
  isOpen: boolean;
  onClose: () => void;
  foreshadowings: Foreshadowing[];
  onUpdateForeshadowings: (items: Foreshadowing[]) => void;
  chapters: Chapter[];
  characters: Character[];
  novelTitle?: string;
  novelDescription?: string;
}

// 状态配置
const STATUS_OPTIONS = [
  { id: 'planted', label: '已埋设', color: 'text-amber-600', bg: 'bg-amber-100', icon: '🌱' },
  { id: 'resolved', label: '已回收', color: 'text-green-600', bg: 'bg-green-100', icon: '✅' },
  { id: 'abandoned', label: '已废弃', color: 'text-slate-500', bg: 'bg-slate-100', icon: '🗑️' },
];

// 重要程度配置
const IMPORTANCE_OPTIONS = [
  { id: 'high', label: '高', color: 'text-rose-600', bg: 'bg-rose-100' },
  { id: 'medium', label: '中', color: 'text-amber-600', bg: 'bg-amber-100' },
  { id: 'low', label: '低', color: 'text-slate-500', bg: 'bg-slate-100' },
];

const ForeshadowingTracker: React.FC<ForeshadowingTrackerProps> = ({
  isOpen,
  onClose,
  foreshadowings,
  onUpdateForeshadowings,
  chapters,
  characters,
  novelTitle,
  novelDescription,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // 表单状态
  const [form, setForm] = useState({
    title: '',
    description: '',
    plantedChapterId: '',
    plantedPosition: '',
    resolvedChapterId: '',
    resolvedPosition: '',
    status: 'planted' as Foreshadowing['status'],
    importance: 'medium' as Foreshadowing['importance'],
    relatedCharacters: [] as string[],
    notes: '',
  });

  // 筛选后的伏笔列表
  const filteredForeshadowings = useMemo(() => {
    if (filterStatus === 'all') return foreshadowings;
    return foreshadowings.filter(f => f.status === filterStatus);
  }, [foreshadowings, filterStatus]);

  // 统计数据
  const stats = useMemo(() => ({
    total: foreshadowings.length,
    planted: foreshadowings.filter(f => f.status === 'planted').length,
    resolved: foreshadowings.filter(f => f.status === 'resolved').length,
    abandoned: foreshadowings.filter(f => f.status === 'abandoned').length,
    highImportance: foreshadowings.filter(f => f.importance === 'high' && f.status === 'planted').length,
  }), [foreshadowings]);

  // 获取选中的伏笔
  const selectedItem = useMemo(() => {
    return foreshadowings.find(f => f.id === selectedId) || null;
  }, [foreshadowings, selectedId]);

  // 重置表单
  const resetForm = useCallback(() => {
    setForm({
      title: '',
      description: '',
      plantedChapterId: '',
      plantedPosition: '',
      resolvedChapterId: '',
      resolvedPosition: '',
      status: 'planted',
      importance: 'medium',
      relatedCharacters: [],
      notes: '',
    });
  }, []);

  // 开始添加
  const handleStartAdd = useCallback(() => {
    setSelectedId(null);
    setIsAdding(true);
    resetForm();
  }, [resetForm]);

  // 选择编辑
  const handleSelect = useCallback((item: Foreshadowing) => {
    setSelectedId(item.id);
    setIsAdding(false);
    setForm({
      title: item.title,
      description: item.description,
      plantedChapterId: item.plantedChapterId || '',
      plantedPosition: item.plantedPosition || '',
      resolvedChapterId: item.resolvedChapterId || '',
      resolvedPosition: item.resolvedPosition || '',
      status: item.status,
      importance: item.importance,
      relatedCharacters: item.relatedCharacters,
      notes: item.notes,
    });
  }, []);

  // 保存
  const handleSave = useCallback(() => {
    if (!form.title.trim()) {
      alert('请输入伏笔标题');
      return;
    }

    const now = new Date().toISOString();

    if (isAdding) {
      const newItem: Foreshadowing = {
        id: createForeshadowId(),
        title: form.title.trim(),
        description: form.description,
        plantedChapterId: form.plantedChapterId || undefined,
        plantedPosition: form.plantedPosition || undefined,
        resolvedChapterId: form.resolvedChapterId || undefined,
        resolvedPosition: form.resolvedPosition || undefined,
        status: form.status,
        importance: form.importance,
        relatedCharacters: form.relatedCharacters,
        notes: form.notes,
        createdAt: now,
        updatedAt: now,
      };
      onUpdateForeshadowings([...foreshadowings, newItem]);
      setSelectedId(newItem.id);
    } else if (selectedId) {
      const updated = foreshadowings.map(f =>
        f.id === selectedId
          ? {
              ...f,
              title: form.title.trim(),
              description: form.description,
              plantedChapterId: form.plantedChapterId || undefined,
              plantedPosition: form.plantedPosition || undefined,
              resolvedChapterId: form.resolvedChapterId || undefined,
              resolvedPosition: form.resolvedPosition || undefined,
              status: form.status,
              importance: form.importance,
              relatedCharacters: form.relatedCharacters,
              notes: form.notes,
              updatedAt: now,
            }
          : f
      );
      onUpdateForeshadowings(updated);
    }

    setIsAdding(false);
  }, [form, isAdding, selectedId, foreshadowings, onUpdateForeshadowings]);

  // 删除
  const handleDelete = useCallback((id: string) => {
    if (!window.confirm('确定要删除这个伏笔吗？')) return;
    onUpdateForeshadowings(foreshadowings.filter(f => f.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
      resetForm();
    }
  }, [foreshadowings, selectedId, onUpdateForeshadowings, resetForm]);

  // 快速标记为已回收
  const handleMarkResolved = useCallback((id: string) => {
    const updated = foreshadowings.map(f =>
      f.id === id
        ? { ...f, status: 'resolved' as const, updatedAt: new Date().toISOString() }
        : f
    );
    onUpdateForeshadowings(updated);
  }, [foreshadowings, onUpdateForeshadowings]);

  // 切换人物选择
  const toggleCharacter = useCallback((charId: string) => {
    setForm(prev => ({
      ...prev,
      relatedCharacters: prev.relatedCharacters.includes(charId)
        ? prev.relatedCharacters.filter(id => id !== charId)
        : [...prev.relatedCharacters, charId]
    }));
  }, []);

  // AI 分析伏笔
  const aiAnalyzeForeshadowing = useCallback(async () => {
    setIsAiGenerating(true);

    const plantedList = foreshadowings
      .filter(f => f.status === 'planted')
      .map(f => `- ${f.title}: ${f.description.slice(0, 50)}...`)
      .join('\n');

    const prompt = `你是一个专业的网络小说创作助手，擅长分析剧情伏笔。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

已埋设的伏笔：
${plantedList || '暂无已埋设的伏笔'}

章节列表：
${chapters.slice(0, 10).map((ch, i) => `${i + 1}. ${ch.title}`).join('\n')}

请分析现有伏笔，提出建议：
1. 哪些伏笔应该在后续章节回收
2. 还可以埋设哪些新的伏笔来增强剧情张力
3. 伏笔之间是否可以关联形成更大的情节线

请用简洁的文字回答（200字以内）。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.8 });

      alert('AI 分析建议：\n\n' + result);
    } catch (error) {
      console.error('AI 分析失败:', error);
      alert('AI 分析失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
    }
  }, [novelTitle, novelDescription, foreshadowings, chapters]);

  // AI 生成伏笔建议
  const aiSuggestForeshadowing = useCallback(async () => {
    setIsAiGenerating(true);

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

主要人物：
${characters.slice(0, 5).map(c => `- ${c.name}（${c.role}）`).join('\n') || '暂无'}

请为这部小说建议 3 个可以埋设的伏笔，输出格式：
【伏笔名称】| 描述 | 重要程度(高/中/低)

要求：
1. 伏笔要有悬念感和戏剧张力
2. 适合长线埋设和后期回收
3. 与人物命运相关`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.9 });

      // 解析并添加伏笔
      const lines = result.split('\n').filter(line => line.includes('【'));
      const now = new Date().toISOString();
      const newItems: Foreshadowing[] = [];

      for (const line of lines) {
        const match = line.match(/【(.+?)】\s*\|\s*(.+?)\s*\|\s*(.+)/);
        if (match) {
          const importanceMap: Record<string, Foreshadowing['importance']> = {
            '高': 'high',
            '中': 'medium',
            '低': 'low',
          };
          newItems.push({
            id: createForeshadowId(),
            title: match[1].trim(),
            description: match[2].trim(),
            status: 'planted',
            importance: importanceMap[match[3].trim()] || 'medium',
            relatedCharacters: [],
            notes: '',
            createdAt: now,
            updatedAt: now,
          });
        }
      }

      if (newItems.length > 0) {
        onUpdateForeshadowings([...foreshadowings, ...newItems]);
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
    }
  }, [novelTitle, novelDescription, characters, foreshadowings, onUpdateForeshadowings]);

  // 获取章节名称
  const getChapterName = useCallback((chapterId?: string) => {
    if (!chapterId) return '未指定';
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.title || '未知章节';
  }, [chapters]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[1000px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-bold text-slate-800">伏笔追踪</h2>
            {/* 统计标签 */}
            <div className="flex items-center gap-2 text-xs">
              <span className="px-2 py-1 bg-amber-100 text-amber-600 rounded-full">
                🌱 待回收 {stats.planted}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-600 rounded-full">
                ✅ 已回收 {stats.resolved}
              </span>
              {stats.highImportance > 0 && (
                <span className="px-2 py-1 bg-rose-100 text-rose-600 rounded-full">
                  ⚠️ 高优先 {stats.highImportance}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={aiSuggestForeshadowing}
              disabled={isAiGenerating}
              className="px-3 py-1.5 text-sm text-[#2C5F2D] border border-[#E8F5E8] rounded-lg hover:bg-[#F0F7F0] disabled:opacity-50"
            >
              AI 建议伏笔
            </button>
            <button
              onClick={aiAnalyzeForeshadowing}
              disabled={isAiGenerating || foreshadowings.length === 0}
              className="px-3 py-1.5 text-sm text-[#2C5F2D] border border-[#E8F5E8] rounded-lg hover:bg-[#F0F7F0] disabled:opacity-50"
            >
              AI 分析
            </button>
            <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 主体 */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧：伏笔列表 */}
          <div className="w-[380px] border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="text-sm border border-slate-200 rounded-lg px-2 py-1"
                >
                  <option value="all">全部 ({stats.total})</option>
                  <option value="planted">待回收 ({stats.planted})</option>
                  <option value="resolved">已回收 ({stats.resolved})</option>
                  <option value="abandoned">已废弃 ({stats.abandoned})</option>
                </select>
              </div>
              <button
                onClick={handleStartAdd}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800"
              >
                + 添加伏笔
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredForeshadowings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-sm">暂无伏笔记录</p>
                </div>
              ) : (
                filteredForeshadowings.map(item => {
                  const statusConfig = STATUS_OPTIONS.find(s => s.id === item.status);
                  const importanceConfig = IMPORTANCE_OPTIONS.find(i => i.id === item.importance);
                  const isSelected = selectedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-[#F0F7F0] border border-[#E8F5E8]'
                          : 'bg-white border border-slate-100 hover:border-[#E8F5E8]'
                      }`}
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span>{statusConfig?.icon}</span>
                            <span className="font-medium text-sm text-slate-800 truncate">{item.title}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`px-1.5 py-0.5 text-[10px] rounded ${importanceConfig?.bg} ${importanceConfig?.color}`}>
                              {importanceConfig?.label}优先
                            </span>
                            {item.plantedChapterId && (
                              <span className="text-[10px] text-slate-400">
                                埋于: {getChapterName(item.plantedChapterId)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          {item.status === 'planted' && (
                            <button
                              className="p-1 text-green-500 hover:bg-green-50 rounded opacity-0 group-hover:opacity-100"
                              onClick={(e) => { e.stopPropagation(); handleMarkResolved(item.id); }}
                              title="标记为已回收"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                          )}
                          <button
                            className="p-1 text-slate-400 hover:text-rose-500 rounded opacity-0 group-hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                            title="删除"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 右侧：编辑表单 */}
          <div className="flex-1 flex flex-col bg-white">
            {!selectedId && !isAdding ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-sm">选择或添加伏笔进行编辑</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">
                    <span className="text-rose-500">*</span> 伏笔标题
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                    placeholder="例如：神秘玉佩的来历"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">伏笔描述</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                    placeholder="描述这个伏笔的内容和用意..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">状态</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value as Foreshadowing['status'] }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">重要程度</label>
                    <select
                      value={form.importance}
                      onChange={e => setForm(prev => ({ ...prev, importance: e.target.value as Foreshadowing['importance'] }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                    >
                      {IMPORTANCE_OPTIONS.map(i => (
                        <option key={i.id} value={i.id}>{i.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 埋设信息 */}
                <div className="p-4 bg-amber-50 rounded-xl space-y-3">
                  <h4 className="text-sm font-medium text-amber-800 flex items-center gap-2">
                    🌱 埋设信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-amber-700 mb-1 block">埋设章节</label>
                      <select
                        value={form.plantedChapterId}
                        onChange={e => setForm(prev => ({ ...prev, plantedChapterId: e.target.value }))}
                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                      >
                        <option value="">选择章节</option>
                        {chapters.map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-amber-700 mb-1 block">埋设位置</label>
                      <input
                        value={form.plantedPosition}
                        onChange={e => setForm(prev => ({ ...prev, plantedPosition: e.target.value }))}
                        className="w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
                        placeholder="例如：第3段末尾"
                      />
                    </div>
                  </div>
                </div>

                {/* 回收信息 */}
                <div className="p-4 bg-green-50 rounded-xl space-y-3">
                  <h4 className="text-sm font-medium text-green-800 flex items-center gap-2">
                    ✅ 回收信息
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-green-700 mb-1 block">回收章节</label>
                      <select
                        value={form.resolvedChapterId}
                        onChange={e => setForm(prev => ({ ...prev, resolvedChapterId: e.target.value }))}
                        className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                      >
                        <option value="">选择章节</option>
                        {chapters.map(ch => (
                          <option key={ch.id} value={ch.id}>{ch.title}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-green-700 mb-1 block">回收位置</label>
                      <input
                        value={form.resolvedPosition}
                        onChange={e => setForm(prev => ({ ...prev, resolvedPosition: e.target.value }))}
                        className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm focus:border-green-400 focus:outline-none"
                        placeholder="例如：章节结尾揭晓"
                      />
                    </div>
                  </div>
                </div>

                {/* 相关人物 */}
                {characters.length > 0 && (
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">相关人物</label>
                    <div className="flex flex-wrap gap-2">
                      {characters.map(char => (
                        <button
                          key={char.id}
                          onClick={() => toggleCharacter(char.id)}
                          className={`px-3 py-1 text-xs rounded-full transition-colors ${
                            form.relatedCharacters.includes(char.id)
                              ? 'bg-[#2C5F2D] text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {char.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">备注</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[60px] focus:border-[#97BC62] focus:outline-none"
                    placeholder="其他备注信息..."
                  />
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            {(selectedId || isAdding) && (
              <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3">
                <button
                  onClick={handleSave}
                  className="px-8 py-2.5 bg-[#F0F7F0]0 text-white text-sm font-medium rounded-lg hover:bg-[#1E4620]"
                >
                  保存
                </button>
                <button
                  onClick={() => { setSelectedId(null); setIsAdding(false); resetForm(); }}
                  className="px-8 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForeshadowingTracker;
