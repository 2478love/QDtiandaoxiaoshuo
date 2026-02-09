import React, { useCallback, useMemo, useState } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';
import { MindMap, MindMapNode } from '../../../../types';
import { generateCreativeContentStream } from '../../../../services/api/gemini';
import { createMindMapId } from '../../../../utils/id';

// 节点颜色选项
const NODE_COLORS = [
  { id: 'rose', bg: 'bg-rose-500', label: '玫红' },
  { id: 'indigo', bg: 'bg-[#2C5F2D]', label: '靛蓝' },
  { id: 'emerald', bg: 'bg-emerald-500', label: '翠绿' },
  { id: 'amber', bg: 'bg-amber-500', label: '琥珀' },
  { id: 'violet', bg: 'bg-violet-500', label: '紫罗兰' },
  { id: 'cyan', bg: 'bg-cyan-500', label: '青色' },
  { id: 'slate', bg: 'bg-slate-500', label: '灰色' },
];

// 创建新节点
const createNode = (title: string, color?: string): MindMapNode => ({
  id: createMindMapId(),
  title,
  color: color || NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].bg,
  children: []
});

// 创建新思维导图
const createMindMap = (name: string, rootTitle: string): MindMap => ({
  id: createMindMapId(),
  name,
  root: createNode(rootTitle, 'bg-rose-500'),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// 在树中查找节点
const findNodeInTree = (root: MindMapNode, nodeId: string): MindMapNode | null => {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeInTree(child, nodeId);
    if (found) return found;
  }
  return null;
};

// 在树中查找父节点
const findParentNode = (root: MindMapNode, nodeId: string): MindMapNode | null => {
  for (const child of root.children) {
    if (child.id === nodeId) return root;
    const found = findParentNode(child, nodeId);
    if (found) return found;
  }
  return null;
};

// 更新树中的节点
const updateNodeInTree = (root: MindMapNode, nodeId: string, updates: Partial<MindMapNode>): MindMapNode => {
  if (root.id === nodeId) {
    return { ...root, ...updates, children: updates.children || root.children };
  }
  return {
    ...root,
    children: root.children.map(child => updateNodeInTree(child, nodeId, updates))
  };
};

// 删除树中的节点
const deleteNodeFromTree = (root: MindMapNode, nodeId: string): MindMapNode => {
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== nodeId)
      .map(child => deleteNodeFromTree(child, nodeId))
  };
};

// 添加子节点到指定节点
const addChildToNode = (root: MindMapNode, parentId: string, newNode: MindMapNode): MindMapNode => {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, newNode] };
  }
  return {
    ...root,
    children: root.children.map(child => addChildToNode(child, parentId, newNode))
  };
};

// 添加同级节点
const addSiblingNodeToTree = (root: MindMapNode, siblingId: string, newNode: MindMapNode): MindMapNode => {
  const newChildren = [];
  for (const child of root.children) {
    newChildren.push(child);
    if (child.id === siblingId) {
      newChildren.push(newNode);
    }
  }
  if (newChildren.length !== root.children.length) {
    return { ...root, children: newChildren.map(c => c.id === newNode.id ? c : addSiblingNodeToTree(c, siblingId, newNode)) };
  }
  return {
    ...root,
    children: root.children.map(child => addSiblingNodeToTree(child, siblingId, newNode))
  };
};

const MindMapView: React.FC = () => {
  const { novel, onRecordActivity } = useEditorContext();

  const {
    mindMaps,
    setMindMaps,
    selectedMapId,
    setSelectedMapId,
    selectedNodeId,
    setSelectedNodeId,
    mindMapScale,
    setMindMapScale,
    isAiGenerating,
    setIsAiGenerating,
    aiGeneratingType,
    setAiGeneratingType,
    characters,
    worldviews,
    showAiMindMapDialog,
    setShowAiMindMapDialog,
    aiMindMapPrompt,
    setAiMindMapPrompt,
  } = useEditorStore();

  // 当前选中的思维导图
  const currentMap = useMemo(() => {
    return mindMaps.find(m => m.id === selectedMapId) || null;
  }, [mindMaps, selectedMapId]);

  // 当前选中的节点
  const selectedNode = useMemo(() => {
    if (!currentMap || !selectedNodeId) return null;
    return findNodeInTree(currentMap.root, selectedNodeId);
  }, [currentMap, selectedNodeId]);

  // 更新思维导图
  const updateMindMap = useCallback((mapId: string, updater: (map: MindMap) => MindMap) => {
    setMindMaps(mindMaps.map(m =>
      m.id === mapId ? { ...updater(m), updatedAt: new Date().toISOString() } : m
    ));
  }, [mindMaps, setMindMaps]);

  // 添加子节点
  const addChildNode = useCallback(() => {
    if (!currentMap || !selectedNodeId) return;
    const newNode = createNode('新节点');
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: addChildToNode(map.root, selectedNodeId, newNode)
    }));
    setSelectedNodeId(newNode.id);
  }, [currentMap, selectedNodeId, updateMindMap, setSelectedNodeId]);

  // 添加同级节点
  const addSibling = useCallback(() => {
    if (!currentMap || !selectedNodeId) return;
    if (selectedNodeId === currentMap.root.id) {
      alert('根节点不能添加同级节点');
      return;
    }
    const newNode = createNode('新节点');
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: addSiblingNodeToTree(map.root, selectedNodeId, newNode)
    }));
    setSelectedNodeId(newNode.id);
  }, [currentMap, selectedNodeId, updateMindMap, setSelectedNodeId]);

  // 删除节点
  const deleteNode = useCallback(() => {
    if (!currentMap || !selectedNodeId) return;
    if (selectedNodeId === currentMap.root.id) {
      alert('不能删除根节点');
      return;
    }
    if (!window.confirm('确定要删除这个节点及其所有子节点吗？')) return;
    const parent = findParentNode(currentMap.root, selectedNodeId);
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: deleteNodeFromTree(map.root, selectedNodeId)
    }));
    setSelectedNodeId(parent?.id || currentMap.root.id);
  }, [currentMap, selectedNodeId, updateMindMap, setSelectedNodeId]);

  // 更新节点标题
  const updateNodeTitle = useCallback((title: string) => {
    if (!currentMap || !selectedNodeId) return;
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: updateNodeInTree(map.root, selectedNodeId, { title })
    }));
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 更新节点颜色
  const updateNodeColor = useCallback((color: string) => {
    if (!currentMap || !selectedNodeId) return;
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: updateNodeInTree(map.root, selectedNodeId, { color })
    }));
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 导出思维导图为JSON
  const exportMindMap = useCallback(() => {
    if (!currentMap) return;
    const data = JSON.stringify(currentMap, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentMap]);

  // 导入思维导图
  const importMindMap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as MindMap;
          data.id = createMindMapId();
          data.name = `${data.name} (导入)`;
          setMindMaps([...mindMaps, data]);
          setSelectedMapId(data.id);
          setSelectedNodeId(data.root.id);
          alert('导入成功！');
        } catch {
          alert('导入失败，请确保文件格式正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [mindMaps, setMindMaps, setSelectedMapId, setSelectedNodeId]);

  // 手动保存
  const saveMindMaps = useCallback(() => {
    alert('数据已自动保存！');
  }, []);

  // 构建创作上下文
  const buildCreativeContext = useCallback(() => {
    let context = '';
    if (characters.length > 0) {
      context += `\n已有人物：${characters.slice(0, 5).map(c => c.name).join('、')}`;
    }
    if (worldviews.length > 0) {
      context += `\n已有世界观：${worldviews.slice(0, 3).map(w => w.title).join('、')}`;
    }
    return context;
  }, [characters, worldviews]);

  // 打开 AI 生成对话框
  const openAiGenerateDialog = useCallback(() => {
    if (!currentMap || !selectedNode) return;
    setAiMindMapPrompt('');
    setShowAiMindMapDialog(true);
  }, [currentMap, selectedNode, setAiMindMapPrompt, setShowAiMindMapDialog]);

  // AI 生成思维导图子节点
  const aiGenerateMindMapNodes = useCallback(async () => {
    if (!currentMap || !selectedNode || isAiGenerating) return;

    setShowAiMindMapDialog(false);
    setIsAiGenerating(true);
    setAiGeneratingType('mindmap');

    const context = buildCreativeContext();
    const currentNodePath = selectedNode.title;
    const userDirection = aiMindMapPrompt.trim();

    const prompt = `你是一个专业的网络小说创作助手，正在帮助作者构建思维导图。

小说标题：${novel?.title || '未命名'}
${context}

当前思维导图主题：${currentMap.name}
当前选中节点：${currentNodePath}
${selectedNode.children.length > 0 ? `已有子节点：${selectedNode.children.map(c => c.title).join('、')}` : '该节点暂无子节点'}
${userDirection ? `\n用户希望的生成方向：${userDirection}` : ''}

请为当前节点生成 3-5 个合适的子节点标题，这些子节点应该：
1. 与当前节点主题相关且有逻辑联系
2. 适合网络小说创作场景
3. 简洁明了，每个标题 2-8 个字
${userDirection ? `4. 重点围绕用户指定的方向进行扩展` : ''}

请直接输出子节点标题，每行一个，不要加序号或其他符号。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.8 });

      const newTitles = result.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length <= 20);

      if (newTitles.length > 0) {
        let updatedRoot = currentMap.root;
        newTitles.forEach(title => {
          const newNode = createNode(title);
          updatedRoot = addChildToNode(updatedRoot, selectedNodeId!, newNode);
        });

        updateMindMap(currentMap.id, (map) => ({
          ...map,
          root: updatedRoot
        }));

        onRecordActivity?.({
          type: 'ai_call',
          description: 'AI 生成思维导图节点',
          deltaPoints: -2,
          createdAt: new Date().toISOString(),
          metadata: { count: newTitles.length }
        });
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingType(null);
    }
  }, [currentMap, selectedNode, selectedNodeId, isAiGenerating, novel?.title, aiMindMapPrompt, buildCreativeContext, updateMindMap, onRecordActivity, setIsAiGenerating, setAiGeneratingType, setShowAiMindMapDialog]);

  // 渲染思维导图节点
  const renderMindMapNode = (node: MindMapNode, level: number = 0, isLast: boolean = true, parentPath: boolean[] = []): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex items-start">
        {/* 连接线 */}
        {level > 0 && (
          <div className="flex items-center h-full mr-2">
            <div className="flex flex-col items-center">
              {parentPath.map((showLine, idx) => (
                <div
                  key={idx}
                  className={`w-px h-4 ${showLine ? 'bg-slate-300' : 'bg-transparent'}`}
                />
              ))}
            </div>
            <div className="w-6 border-t-2 border-dashed border-slate-300" />
          </div>
        )}

        <div className="flex flex-col">
          {/* 节点本身 */}
          <button
            onClick={() => setSelectedNodeId(node.id)}
            className={`px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md transition-all duration-200 whitespace-nowrap ${node.color} ${
              isSelected
                ? 'ring-4 ring-[#97BC62] ring-offset-2 scale-105'
                : 'hover:scale-102 hover:shadow-lg'
            }`}
          >
            {node.title}
          </button>

          {/* 子节点 */}
          {hasChildren && (
            <div className="mt-3 ml-4 space-y-2">
              {node.children.map((child, idx) =>
                renderMindMapNode(
                  child,
                  level + 1,
                  idx === node.children.length - 1,
                  [...parentPath, !isLast]
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 min-h-0">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="text-sm text-slate-600">
          <span className="text-slate-400">当前导图：</span>
          <span className="font-medium">{currentMap?.name || '未选择'}</span>
          {selectedNode && (
            <span className="ml-3 text-slate-400">
              已选节点：<span className="text-[#2C5F2D]">{selectedNode.title}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2 text-xs">
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-slate-100 rounded-lg">
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
              onClick={() => setMindMapScale(Math.max(0.25, mindMapScale - 0.1))}
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-12 text-center text-xs font-medium text-slate-600">
              {Math.round(mindMapScale * 100)}%
            </span>
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
              onClick={() => setMindMapScale(Math.min(2, mindMapScale + 0.1))}
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors ml-1"
              onClick={() => setMindMapScale(1)}
              title="重置缩放"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <button
            className="px-3 py-1.5 border rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={saveMindMaps}
          >
            手动保存
          </button>
          <button
            className="px-3 py-1.5 border rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={importMindMap}
          >
            导入
          </button>
          <button
            className="px-3 py-1.5 border rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={exportMindMap}
          >
            导出
          </button>
        </div>
      </div>

      {/* 思维导图画布 */}
      <div className="flex-1 min-h-0 overflow-auto">
        {currentMap ? (
          <div
            className="inline-flex min-w-full min-h-full p-12 pt-16"
            style={{ transform: `scale(${mindMapScale})`, transformOrigin: 'top left' }}
          >
            {renderMindMapNode(currentMap.root)}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            请从左侧选择或创建一个思维导图
          </div>
        )}
      </div>

      {/* 底部节点编辑栏 */}
      <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-4">
          {/* 节点标题编辑 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">节点标题</span>
            <input
              value={selectedNode?.title || ''}
              onChange={(e) => updateNodeTitle(e.target.value)}
              disabled={!selectedNode}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm w-40 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="选择节点后编辑"
            />
          </div>

          {/* 节点颜色选择 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">颜色</span>
            <div className="flex gap-1">
              {NODE_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => updateNodeColor(color.bg)}
                  disabled={!selectedNode}
                  className={`w-6 h-6 rounded-full ${color.bg} transition-transform hover:scale-110 disabled:opacity-40 ${
                    selectedNode?.color === color.bg ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* 节点操作按钮 */}
          <div className="flex gap-2 ml-auto">
            <button
              className="px-4 py-2 rounded-xl bg-[#2C5F2D] text-white text-xs hover:bg-[#1E4620] transition-colors disabled:opacity-40 flex items-center gap-1.5"
              onClick={openAiGenerateDialog}
              disabled={!selectedNode || isAiGenerating}
            >
              {isAiGenerating && aiGeneratingType === 'mindmap' ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 生成子节点
                </>
              )}
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={addChildNode}
              disabled={!selectedNode}
            >
              + 子节点
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={addSibling}
              disabled={!selectedNode || selectedNodeId === currentMap?.root.id}
            >
              + 同级节点
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs hover:bg-rose-50 transition-colors disabled:opacity-40"
              onClick={deleteNode}
              disabled={!selectedNode || selectedNodeId === currentMap?.root.id}
            >
              删除节点
            </button>
          </div>
        </div>
      </div>

      {/* AI 生成方向对话框 */}
      {showAiMindMapDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">AI 生成子节点</h3>
              <p className="text-sm text-slate-500 mt-1">
                当前节点：<span className="text-[#2C5F2D] font-medium">{selectedNode?.title}</span>
              </p>
            </div>
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                生成方向（可选）
              </label>
              <textarea
                value={aiMindMapPrompt}
                onChange={(e) => setAiMindMapPrompt(e.target.value)}
                placeholder="例如：围绕主角的成长经历展开、添加反派势力的分支、细化这个情节的发展..."
                className="w-full h-32 px-4 py-3 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2C5F2D]/20 focus:border-[#2C5F2D]"
              />
              <p className="text-xs text-slate-400 mt-2">
                留空则由 AI 自动分析节点内容并生成相关子节点
              </p>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex gap-3 justify-end">
              <button
                onClick={() => setShowAiMindMapDialog(false)}
                className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                取消
              </button>
              <button
                onClick={aiGenerateMindMapNodes}
                disabled={isAiGenerating}
                className="px-4 py-2 text-sm bg-[#2C5F2D] text-white rounded-xl hover:bg-[#1E4620] transition-colors disabled:opacity-50 flex items-center gap-2"
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
                    开始生成
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MindMapView;
