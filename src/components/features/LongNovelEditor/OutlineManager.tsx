import React, { useState, useCallback, useMemo } from 'react';
import { OutlineNode, Chapter, Volume } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';
import { createOutlineId } from '../../../utils/id';

interface OutlineManagerProps {
  isOpen: boolean;
  onClose: () => void;
  outlineNodes: OutlineNode[];
  onUpdateOutlineNodes: (nodes: OutlineNode[]) => void;
  chapters: Chapter[];
  volumes: Volume[];
  novelTitle?: string;
  novelDescription?: string;
}

// 节点类型配置
const NODE_TYPES = [
  { id: 'volume', label: '卷', color: 'bg-purple-500', icon: '📚' },
  { id: 'chapter', label: '章节', color: 'bg-blue-500', icon: '📖' },
  { id: 'scene', label: '场景', color: 'bg-green-500', icon: '🎬' },
  { id: 'note', label: '备注', color: 'bg-yellow-500', icon: '📝' },
];

// 状态配置
const STATUS_OPTIONS = [
  { id: 'planned', label: '计划中', color: 'text-slate-500', bg: 'bg-slate-100' },
  { id: 'writing', label: '写作中', color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'completed', label: '已完成', color: 'text-green-500', bg: 'bg-green-100' },
];

const OutlineManager: React.FC<OutlineManagerProps> = ({
  isOpen,
  onClose,
  outlineNodes,
  onUpdateOutlineNodes,
  chapters,
  volumes,
  novelTitle,
  novelDescription,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // 表单状态
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: 'chapter' as OutlineNode['type'],
    parentId: '',
    status: 'planned' as OutlineNode['status'],
    chapterId: '',
  });

  // 获取选中的节点
  const selectedNode = useMemo(() => {
    return outlineNodes.find(n => n.id === selectedNodeId) || null;
  }, [outlineNodes, selectedNodeId]);

  // 获取根节点（没有parentId的节点）
  const rootNodes = useMemo(() => {
    return outlineNodes
      .filter(n => !n.parentId)
      .sort((a, b) => a.order - b.order);
  }, [outlineNodes]);

  // 获取子节点
  const getChildNodes = useCallback((parentId: string) => {
    return outlineNodes
      .filter(n => n.parentId === parentId)
      .sort((a, b) => a.order - b.order);
  }, [outlineNodes]);

  // 切换节点展开状态
  const toggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // 重置表单
  const resetForm = useCallback(() => {
    setForm({
      title: '',
      content: '',
      type: 'chapter',
      parentId: '',
      status: 'planned',
      chapterId: '',
    });
  }, []);

  // 开始添加
  const handleStartAdd = useCallback((parentId?: string) => {
    setSelectedNodeId(null);
    setIsAdding(true);
    resetForm();
    if (parentId) {
      setForm(prev => ({ ...prev, parentId }));
    }
  }, [resetForm]);

  // 选择节点进行编辑
  const handleSelectNode = useCallback((node: OutlineNode) => {
    setSelectedNodeId(node.id);
    setIsAdding(false);
    setForm({
      title: node.title,
      content: node.content,
      type: node.type,
      parentId: node.parentId || '',
      status: node.status,
      chapterId: node.chapterId || '',
    });
  }, []);

  // 保存节点
  const handleSave = useCallback(() => {
    if (!form.title.trim()) {
      alert('请输入标题');
      return;
    }

    const now = new Date().toISOString();

    if (isAdding) {
      // 添加新节点
      const maxOrder = outlineNodes
        .filter(n => n.parentId === (form.parentId || undefined))
        .reduce((max, n) => Math.max(max, n.order), -1);

      const newNode: OutlineNode = {
        id: createOutlineId(),
        title: form.title.trim(),
        content: form.content,
        type: form.type,
        parentId: form.parentId || undefined,
        order: maxOrder + 1,
        status: form.status,
        chapterId: form.chapterId || undefined,
        createdAt: now,
        updatedAt: now,
      };
      onUpdateOutlineNodes([...outlineNodes, newNode]);
      setSelectedNodeId(newNode.id);
    } else if (selectedNodeId) {
      // 更新节点
      const updated = outlineNodes.map(n =>
        n.id === selectedNodeId
          ? {
              ...n,
              title: form.title.trim(),
              content: form.content,
              type: form.type,
              parentId: form.parentId || undefined,
              status: form.status,
              chapterId: form.chapterId || undefined,
              updatedAt: now,
            }
          : n
      );
      onUpdateOutlineNodes(updated);
    }

    setIsAdding(false);
  }, [form, isAdding, selectedNodeId, outlineNodes, onUpdateOutlineNodes]);

  // 删除节点
  const handleDelete = useCallback((nodeId: string) => {
    if (!window.confirm('确定要删除这个大纲节点吗？子节点也会被删除。')) return;

    // 递归获取所有子节点ID
    const getDescendantIds = (id: string): string[] => {
      const children = outlineNodes.filter(n => n.parentId === id);
      return [id, ...children.flatMap(c => getDescendantIds(c.id))];
    };

    const idsToDelete = new Set(getDescendantIds(nodeId));
    const updated = outlineNodes.filter(n => !idsToDelete.has(n.id));
    onUpdateOutlineNodes(updated);

    if (selectedNodeId === nodeId) {
      setSelectedNodeId(null);
      resetForm();
    }
  }, [outlineNodes, selectedNodeId, onUpdateOutlineNodes, resetForm]);

  // 移动节点
  const handleMove = useCallback((nodeId: string, direction: 'up' | 'down') => {
    const node = outlineNodes.find(n => n.id === nodeId);
    if (!node) return;

    const siblings = outlineNodes
      .filter(n => n.parentId === node.parentId)
      .sort((a, b) => a.order - b.order);

    const currentIndex = siblings.findIndex(s => s.id === nodeId);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    // 交换顺序
    const updated = outlineNodes.map(n => {
      if (n.id === nodeId) {
        return { ...n, order: siblings[targetIndex].order };
      }
      if (n.id === siblings[targetIndex].id) {
        return { ...n, order: node.order };
      }
      return n;
    });

    onUpdateOutlineNodes(updated);
  }, [outlineNodes, onUpdateOutlineNodes]);

  // AI 生成大纲
  const aiGenerateOutline = useCallback(async () => {
    setIsAiGenerating(true);

    const existingOutline = outlineNodes
      .filter(n => !n.parentId)
      .map(n => `- ${n.title}: ${n.content.slice(0, 50)}...`)
      .join('\n');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

${existingOutline ? `已有大纲：\n${existingOutline}\n` : ''}

请为这部小说生成一个详细的大纲，包含卷、章节和场景的规划。

输出格式要求（每行一个节点，使用缩进表示层级）：
【卷】卷名称 | 卷简介
  【章】章节名称 | 章节简介
    【景】场景名称 | 场景简介

请生成 2-3 个卷，每卷 3-5 个章节，每章 1-2 个场景。直接输出，不要有其他说明。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.9 });

      // 解析生成的大纲
      const lines = result.split('\n').filter(line => line.trim());
      const newNodes: OutlineNode[] = [];
      let currentVolumeId: string | undefined;
      let currentChapterId: string | undefined;
      let volumeOrder = outlineNodes.filter(n => !n.parentId && n.type === 'volume').length;
      let chapterOrder = 0;
      let sceneOrder = 0;

      for (const line of lines) {
        const now = new Date().toISOString();
        const volumeMatch = line.match(/【卷】(.+?)\s*\|\s*(.+)/);
        const chapterMatch = line.match(/【章】(.+?)\s*\|\s*(.+)/);
        const sceneMatch = line.match(/【景】(.+?)\s*\|\s*(.+)/);

        if (volumeMatch) {
          const node: OutlineNode = {
            id: createOutlineId(),
            title: volumeMatch[1].trim(),
            content: volumeMatch[2].trim(),
            type: 'volume',
            order: volumeOrder++,
            status: 'planned',
            createdAt: now,
            updatedAt: now,
          };
          newNodes.push(node);
          currentVolumeId = node.id;
          chapterOrder = 0;
        } else if (chapterMatch && currentVolumeId) {
          const node: OutlineNode = {
            id: createOutlineId(),
            title: chapterMatch[1].trim(),
            content: chapterMatch[2].trim(),
            type: 'chapter',
            parentId: currentVolumeId,
            order: chapterOrder++,
            status: 'planned',
            createdAt: now,
            updatedAt: now,
          };
          newNodes.push(node);
          currentChapterId = node.id;
          sceneOrder = 0;
        } else if (sceneMatch && currentChapterId) {
          const node: OutlineNode = {
            id: createOutlineId(),
            title: sceneMatch[1].trim(),
            content: sceneMatch[2].trim(),
            type: 'scene',
            parentId: currentChapterId,
            order: sceneOrder++,
            status: 'planned',
            createdAt: now,
            updatedAt: now,
          };
          newNodes.push(node);
        }
      }

      if (newNodes.length > 0) {
        onUpdateOutlineNodes([...outlineNodes, ...newNodes]);
        // 展开新生成的卷
        setExpandedNodes(prev => {
          const next = new Set(prev);
          newNodes.filter(n => n.type === 'volume').forEach(n => next.add(n.id));
          return next;
        });
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
    }
  }, [novelTitle, novelDescription, outlineNodes, onUpdateOutlineNodes]);

  // 渲染节点树
  const renderNode = (node: OutlineNode, level: number = 0): React.ReactNode => {
    const children = getChildNodes(node.id);
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const typeConfig = NODE_TYPES.find(t => t.id === node.type);
    const statusConfig = STATUS_OPTIONS.find(s => s.id === node.status);

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-slate-50 border border-transparent'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => handleSelectNode(node)}
        >
          {/* 展开/收起按钮 */}
          {children.length > 0 ? (
            <button
              className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600"
              onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
            >
              <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-5" />
          )}

          {/* 类型图标 */}
          <span className="text-base">{typeConfig?.icon}</span>

          {/* 标题 */}
          <span className="flex-1 text-sm font-medium text-slate-700 truncate">{node.title}</span>

          {/* 状态标签 */}
          <span className={`px-2 py-0.5 text-[10px] rounded-full ${statusConfig?.bg} ${statusConfig?.color}`}>
            {statusConfig?.label}
          </span>

          {/* 操作按钮 */}
          <div className="hidden group-hover:flex items-center gap-1">
            <button
              className="p-1 text-slate-400 hover:text-blue-500 rounded"
              onClick={(e) => { e.stopPropagation(); handleStartAdd(node.id); }}
              title="添加子节点"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              onClick={(e) => { e.stopPropagation(); handleMove(node.id, 'up'); }}
              title="上移"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              className="p-1 text-slate-400 hover:text-slate-600 rounded"
              onClick={(e) => { e.stopPropagation(); handleMove(node.id, 'down'); }}
              title="下移"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button
              className="p-1 text-slate-400 hover:text-rose-500 rounded"
              onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
              title="删除"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* 子节点 */}
        {isExpanded && children.length > 0 && (
          <div className="mt-1">
            {children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[1000px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">大纲管理器</h2>
            <span className="text-sm text-slate-400">{outlineNodes.length} 个节点</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={aiGenerateOutline}
              disabled={isAiGenerating}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isAiGenerating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 生成大纲
                </>
              )}
            </button>
            <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 主体 */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧：大纲树 */}
          <div className="w-[400px] border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">大纲结构</span>
              <button
                onClick={() => handleStartAdd()}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800 transition-colors"
              >
                + 添加根节点
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {rootNodes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm">暂无大纲</p>
                  <p className="text-xs mt-1">点击上方按钮添加或使用 AI 生成</p>
                </div>
              ) : (
                rootNodes.map(node => renderNode(node))
              )}
            </div>
          </div>

          {/* 右侧：编辑表单 */}
          <div className="flex-1 flex flex-col bg-white">
            {!selectedNodeId && !isAdding ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <p className="text-sm">选择节点进行编辑</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">
                    <span className="text-rose-500">*</span> 标题
                  </label>
                  <input
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    placeholder="请输入节点标题"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">节点类型</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(prev => ({ ...prev, type: e.target.value as OutlineNode['type'] }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      {NODE_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.icon} {t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">状态</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value as OutlineNode['status'] }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">父节点</label>
                  <select
                    value={form.parentId}
                    onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                  >
                    <option value="">无（根节点）</option>
                    {outlineNodes
                      .filter(n => n.id !== selectedNodeId)
                      .map(n => (
                        <option key={n.id} value={n.id}>
                          {NODE_TYPES.find(t => t.id === n.type)?.icon} {n.title}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {form.type === 'chapter' && (
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">关联章节</label>
                    <select
                      value={form.chapterId}
                      onChange={e => setForm(prev => ({ ...prev, chapterId: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-400 focus:outline-none"
                    >
                      <option value="">不关联</option>
                      {chapters.map(ch => (
                        <option key={ch.id} value={ch.id}>{ch.title}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">内容描述</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[150px] focus:border-blue-400 focus:outline-none"
                    placeholder="请输入节点的详细内容描述..."
                  />
                </div>
              </div>
            )}

            {/* 底部按钮 */}
            {(selectedNodeId || isAdding) && (
              <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3">
                <button
                  onClick={handleSave}
                  className="px-8 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={() => { setSelectedNodeId(null); setIsAdding(false); resetForm(); }}
                  className="px-8 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
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

export default OutlineManager;
