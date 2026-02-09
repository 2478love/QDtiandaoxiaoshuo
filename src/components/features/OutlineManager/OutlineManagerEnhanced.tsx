import React, { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { OutlineNode, Chapter, Volume } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';
import { createOutlineId } from '../../../utils/id';

interface OutlineManagerEnhancedProps {
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
  { id: 'volume', label: '卷', color: 'bg-purple-100', icon: '📚' },
  { id: 'chapter', label: '章节', color: 'bg-blue-100', icon: '📖' },
  { id: 'scene', label: '场景', color: 'bg-green-100', icon: '🎬' },
  { id: 'note', label: '备注', color: 'bg-yellow-100', icon: '📝' },
];

// 状态配置
const STATUS_OPTIONS = [
  { id: 'planned', label: '计划中', color: 'text-slate-500', bg: 'bg-slate-100', icon: '📋' },
  { id: 'writing', label: '写作中', color: 'text-[#2C5F2D]', bg: 'bg-[#E8F5E8]', icon: '✍️' },
  { id: 'completed', label: '已完成', color: 'text-green-500', bg: 'bg-green-100', icon: '✅' },
];

// 可排序节点组件
interface SortableNodeProps {
  node: OutlineNode;
  level: number;
  isSelected: boolean;
  isExpanded: boolean;
  children: OutlineNode[];
  onSelect: (node: OutlineNode) => void;
  onToggleExpand: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onMove: (nodeId: string, direction: 'up' | 'down') => void;
  onDelete: (nodeId: string) => void;
  renderChildren: (parentId: string, level: number) => React.ReactNode;
}

const SortableNode: React.FC<SortableNodeProps> = ({
  node,
  level,
  isSelected,
  isExpanded,
  children,
  onSelect,
  onToggleExpand,
  onAddChild,
  onMove,
  onDelete,
  renderChildren,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const typeConfig = NODE_TYPES.find(t => t.id === node.type);
  const statusConfig = STATUS_OPTIONS.find(s => s.id === node.status);

  // 计算进度
  const calculateProgress = () => {
    if (node.type === 'chapter' || node.type === 'scene') {
      // 这里可以根据实际字数计算
      return 0;
    }
    return 0;
  };

  const progress = calculateProgress();

  return (
    <div ref={setNodeRef} style={style} className="select-none">
      <div
        className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
          isSelected
            ? 'bg-[#F0F7F0] border-2 border-[#2C5F2D] shadow-sm'
            : 'hover:bg-slate-50 border-2 border-transparent'
        } ${isDragging ? 'shadow-lg' : ''}`}
        style={{ marginLeft: `${level * 24}px` }}
        onClick={() => onSelect(node)}
      >
        {/* 拖拽手柄 */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8h16M4 16h16" />
          </svg>
        </div>

        {/* 展开/收起按钮 */}
        {children.length > 0 ? (
          <button
            className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            onClick={(e) => { e.stopPropagation(); onToggleExpand(node.id); }}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <span className="w-5" />
        )}

        {/* 类型图标 */}
        <span className="text-lg">{typeConfig?.icon}</span>

        {/* 标题 */}
        <span className="flex-1 text-sm font-medium text-slate-700 truncate">
          {node.title}
        </span>

        {/* 进度指示 */}
        {progress > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#2C5F2D] to-[#97BC62] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-slate-500">{progress}%</span>
          </div>
        )}

        {/* 状态标签 */}
        <div className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${statusConfig?.bg}`}>
          <span>{statusConfig?.icon}</span>
          <span className={statusConfig?.color}>{statusConfig?.label}</span>
        </div>

        {/* 操作按钮 */}
        <div className="hidden group-hover:flex items-center gap-1">
          <button
            className="p-1 text-slate-400 hover:text-[#2C5F2D] rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); onAddChild(node.id); }}
            title="添加子节点"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); onMove(node.id, 'up'); }}
            title="上移"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); onMove(node.id, 'down'); }}
            title="下移"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
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
          {renderChildren(node.id, level + 1)}
        </div>
      )}
    </div>
  );
};

const OutlineManagerEnhanced: React.FC<OutlineManagerEnhancedProps> = ({
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

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // 获取选中的节点
  const selectedNode = useMemo(() => {
    return outlineNodes.find(n => n.id === selectedNodeId) || null;
  }, [outlineNodes, selectedNodeId]);

  // 获取根节点
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

  // 处理拖拽结束
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeNode = outlineNodes.find(n => n.id === active.id);
      const overNode = outlineNodes.find(n => n.id === over.id);

      if (activeNode && overNode && activeNode.parentId === overNode.parentId) {
        // 同级节点排序
        const siblings = outlineNodes
          .filter(n => n.parentId === activeNode.parentId)
          .sort((a, b) => a.order - b.order);

        const oldIndex = siblings.findIndex(n => n.id === active.id);
        const newIndex = siblings.findIndex(n => n.id === over.id);

        const newSiblings = arrayMove(siblings, oldIndex, newIndex);
        
        // 更新顺序
        const updated = outlineNodes.map(n => {
          const newSibling = newSiblings.find(s => s.id === n.id);
          if (newSibling) {
            const newOrder = newSiblings.indexOf(newSibling);
            return { ...n, order: newOrder };
          }
          return n;
        });

        onUpdateOutlineNodes(updated);
      }
    }
  }, [outlineNodes, onUpdateOutlineNodes]);

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

  // 渲染节点树
  const renderChildren = useCallback((parentId: string, level: number) => {
    const children = getChildNodes(parentId);
    
    return (
      <SortableContext items={children.map(c => c.id)} strategy={verticalListSortingStrategy}>
        {children.map(child => (
          <SortableNode
            key={child.id}
            node={child}
            level={level}
            isSelected={selectedNodeId === child.id}
            isExpanded={expandedNodes.has(child.id)}
            children={getChildNodes(child.id)}
            onSelect={handleSelectNode}
            onToggleExpand={toggleExpand}
            onAddChild={handleStartAdd}
            onMove={handleMove}
            onDelete={handleDelete}
            renderChildren={renderChildren}
          />
        ))}
      </SortableContext>
    );
  }, [getChildNodes, selectedNodeId, expandedNodes, handleSelectNode, toggleExpand, handleStartAdd, handleMove, handleDelete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[1000px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#F0F7F0] to-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">📋 大纲管理器</h2>
            <span className="text-sm text-slate-400">{outlineNodes.length} 个节点</span>
          </div>
          <div className="flex items-center gap-2">
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
                className="px-3 py-1.5 bg-[#2C5F2D] text-white text-xs rounded-lg hover:bg-[#1E4620] transition-colors"
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
                  <p className="text-xs mt-1">点击上方按钮添加</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={rootNodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
                    {rootNodes.map(node => (
                      <SortableNode
                        key={node.id}
                        node={node}
                        level={0}
                        isSelected={selectedNodeId === node.id}
                        isExpanded={expandedNodes.has(node.id)}
                        children={getChildNodes(node.id)}
                        onSelect={handleSelectNode}
                        onToggleExpand={toggleExpand}
                        onAddChild={handleStartAdd}
                        onMove={handleMove}
                        onDelete={handleDelete}
                        renderChildren={renderChildren}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                    placeholder="请输入节点标题"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-500 mb-1.5 block">节点类型</label>
                    <select
                      value={form.type}
                      onChange={e => setForm(prev => ({ ...prev, type: e.target.value as OutlineNode['type'] }))}
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
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
                      className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                    >
                      {STATUS_OPTIONS.map(s => (
                        <option key={s.id} value={s.id}>{s.icon} {s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">父节点</label>
                  <select
                    value={form.parentId}
                    onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
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

                <div>
                  <label className="text-sm text-slate-500 mb-1.5 block">内容描述</label>
                  <textarea
                    value={form.content}
                    onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[150px] focus:border-[#97BC62] focus:outline-none"
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
                  className="px-8 py-2.5 bg-[#2C5F2D] text-white text-sm font-medium rounded-lg hover:bg-[#1E4620] transition-colors"
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

export default OutlineManagerEnhanced;
