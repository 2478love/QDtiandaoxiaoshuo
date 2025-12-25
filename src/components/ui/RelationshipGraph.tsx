/**
 * 人物关系图可视化组件
 *
 * 使用 SVG 绘制人物关系网络图
 */

import React, { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { Character, CharacterRelation } from '../../types/novel';

/**
 * 关系类型配置
 */
const RELATION_COLORS: Record<string, string> = {
  '朋友': '#22c55e',
  '敌人': '#ef4444',
  '恋人': '#ec4899',
  '师徒': '#8b5cf6',
  '家人': '#f59e0b',
  '同门': '#06b6d4',
  '主仆': '#6366f1',
  '盟友': '#84cc16',
  '竞争': '#f97316',
  default: '#94a3b8',
};

/**
 * 角色类型颜色
 */
const ROLE_COLORS: Record<string, string> = {
  '主角': '#3b82f6',
  '配角': '#10b981',
  '反派': '#ef4444',
  '路人': '#9ca3af',
  default: '#64748b',
};

interface CharacterNode {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx?: number;
  fy?: number;
}

interface RelationEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  description: string;
}

interface RelationshipGraphProps {
  /** 人物列表 */
  characters: Character[];
  /** 关系列表 */
  relations: CharacterRelation[];
  /** 容器宽度 */
  width?: number;
  /** 容器高度 */
  height?: number;
  /** 点击人物回调 */
  onCharacterClick?: (character: Character) => void;
  /** 点击关系回调 */
  onRelationClick?: (relation: CharacterRelation) => void;
  /** 主题类 */
  themeClasses?: {
    bg: string;
    text: string;
    textMuted: string;
    border: string;
  };
}

/**
 * 简单的力导向布局算法
 */
const useForceLayout = (
  nodes: CharacterNode[],
  edges: RelationEdge[],
  width: number,
  height: number
) => {
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const animationRef = useRef<number | null>(null);
  const nodesRef = useRef<CharacterNode[]>([]);

  useEffect(() => {
    if (nodes.length === 0) {
      setPositions(new Map());
      return;
    }

    // 初始化节点位置（圆形布局）
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.35;

    nodesRef.current = nodes.map((node, i) => ({
      ...node,
      x: centerX + radius * Math.cos((2 * Math.PI * i) / nodes.length),
      y: centerY + radius * Math.sin((2 * Math.PI * i) / nodes.length),
      vx: 0,
      vy: 0,
    }));

    // 构建邻接表
    const adjacency = new Map<string, Set<string>>();
    edges.forEach((edge) => {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    });

    // 力导向模拟
    let iteration = 0;
    const maxIterations = 100;

    const simulate = () => {
      if (iteration >= maxIterations) {
        updatePositions();
        return;
      }

      const alpha = 1 - iteration / maxIterations;
      const k = Math.sqrt((width * height) / nodes.length) * 0.5;

      // 斥力（节点之间）
      for (let i = 0; i < nodesRef.current.length; i++) {
        for (let j = i + 1; j < nodesRef.current.length; j++) {
          const nodeA = nodesRef.current[i];
          const nodeB = nodesRef.current[j];

          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (k * k) / dist;

          const fx = (dx / dist) * force * alpha;
          const fy = (dy / dist) * force * alpha;

          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }

      // 引力（连接的节点之间）
      edges.forEach((edge) => {
        const sourceNode = nodesRef.current.find((n) => n.id === edge.source);
        const targetNode = nodesRef.current.find((n) => n.id === edge.target);

        if (sourceNode && targetNode) {
          const dx = targetNode.x - sourceNode.x;
          const dy = targetNode.y - sourceNode.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (dist * dist) / k;

          const fx = (dx / dist) * force * alpha * 0.1;
          const fy = (dy / dist) * force * alpha * 0.1;

          sourceNode.vx += fx;
          sourceNode.vy += fy;
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // 中心引力
      nodesRef.current.forEach((node) => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx += dx * 0.01 * alpha;
        node.vy += dy * 0.01 * alpha;
      });

      // 更新位置
      nodesRef.current.forEach((node) => {
        if (node.fx !== undefined) {
          node.x = node.fx;
          node.vx = 0;
        } else {
          node.vx *= 0.9;
          node.x += node.vx;
          node.x = Math.max(40, Math.min(width - 40, node.x));
        }

        if (node.fy !== undefined) {
          node.y = node.fy;
          node.vy = 0;
        } else {
          node.vy *= 0.9;
          node.y += node.vy;
          node.y = Math.max(40, Math.min(height - 40, node.y));
        }
      });

      iteration++;
      animationRef.current = requestAnimationFrame(simulate);
    };

    const updatePositions = () => {
      const newPositions = new Map<string, { x: number; y: number }>();
      nodesRef.current.forEach((node) => {
        newPositions.set(node.id, { x: node.x, y: node.y });
      });
      setPositions(newPositions);
    };

    simulate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [nodes, edges, width, height]);

  return positions;
};

/**
 * 人物关系图组件
 */
const RelationshipGraph: React.FC<RelationshipGraphProps> = ({
  characters,
  relations,
  width = 600,
  height = 400,
  onCharacterClick,
  onRelationClick,
  themeClasses = {
    bg: 'bg-white dark:bg-slate-900',
    text: 'text-slate-800 dark:text-slate-100',
    textMuted: 'text-slate-500 dark:text-slate-400',
    border: 'border-slate-200 dark:border-slate-700',
  },
}) => {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // 转换为内部节点格式
  const nodes: CharacterNode[] = useMemo(
    () =>
      characters.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
      })),
    [characters]
  );

  // 转换为内部边格式
  const edges: RelationEdge[] = useMemo(
    () =>
      relations.map((r) => ({
        id: r.id,
        source: r.sourceId,
        target: r.targetId,
        type: r.relationType,
        description: r.description,
      })),
    [relations]
  );

  // 使用力导向布局
  const positions = useForceLayout(nodes, edges, width, height);

  // 获取关系颜色
  const getRelationColor = useCallback((type: string) => {
    return RELATION_COLORS[type] || RELATION_COLORS.default;
  }, []);

  // 获取角色颜色
  const getRoleColor = useCallback((role: string) => {
    return ROLE_COLORS[role] || ROLE_COLORS.default;
  }, []);

  // 处理节点点击
  const handleNodeClick = useCallback(
    (characterId: string) => {
      setSelectedNode(characterId === selectedNode ? null : characterId);
      const character = characters.find((c) => c.id === characterId);
      if (character && onCharacterClick) {
        onCharacterClick(character);
      }
    },
    [characters, onCharacterClick, selectedNode]
  );

  // 处理边点击
  const handleEdgeClick = useCallback(
    (relationId: string) => {
      const relation = relations.find((r) => r.id === relationId);
      if (relation && onRelationClick) {
        onRelationClick(relation);
      }
    },
    [relations, onRelationClick]
  );

  // 渲染空状态
  if (characters.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center ${themeClasses.bg} ${themeClasses.textMuted}`}
        style={{ width, height }}
      >
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="text-sm">暂无人物数据</p>
        <p className="text-xs mt-1">添加人物后可查看关系图</p>
      </div>
    );
  }

  return (
    <div className={`relative ${themeClasses.bg}`} style={{ width, height }}>
      <svg ref={svgRef} width={width} height={height} className="overflow-visible">
        {/* 定义箭头标记 */}
        <defs>
          {Object.entries(RELATION_COLORS).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX="25"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill={color} />
            </marker>
          ))}
        </defs>

        {/* 绘制边（关系线） */}
        <g className="edges">
          {edges.map((edge) => {
            const sourcePos = positions.get(edge.source);
            const targetPos = positions.get(edge.target);
            if (!sourcePos || !targetPos) return null;

            const color = getRelationColor(edge.type);
            const isHovered = hoveredEdge === edge.id;
            const isConnectedToSelected =
              selectedNode === edge.source || selectedNode === edge.target;

            // 计算曲线控制点（如果有多条边）
            const dx = targetPos.x - sourcePos.x;
            const dy = targetPos.y - sourcePos.y;
            const midX = (sourcePos.x + targetPos.x) / 2;
            const midY = (sourcePos.y + targetPos.y) / 2;

            return (
              <g key={edge.id}>
                <line
                  x1={sourcePos.x}
                  y1={sourcePos.y}
                  x2={targetPos.x}
                  y2={targetPos.y}
                  stroke={color}
                  strokeWidth={isHovered || isConnectedToSelected ? 3 : 2}
                  strokeOpacity={
                    selectedNode && !isConnectedToSelected ? 0.2 : isHovered ? 1 : 0.6
                  }
                  markerEnd={`url(#arrow-${edge.type in RELATION_COLORS ? edge.type : 'default'})`}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() => setHoveredEdge(edge.id)}
                  onMouseLeave={() => setHoveredEdge(null)}
                  onClick={() => handleEdgeClick(edge.id)}
                />
                {/* 关系标签 */}
                {(isHovered || isConnectedToSelected) && (
                  <text
                    x={midX}
                    y={midY - 8}
                    textAnchor="middle"
                    className="text-xs fill-current pointer-events-none"
                    style={{ fill: color }}
                  >
                    {edge.type}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* 绘制节点（人物） */}
        <g className="nodes">
          {nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const color = getRoleColor(node.role);
            const isHovered = hoveredNode === node.id;
            const isSelected = selectedNode === node.id;
            const isConnected =
              selectedNode &&
              edges.some(
                (e) =>
                  (e.source === selectedNode && e.target === node.id) ||
                  (e.target === selectedNode && e.source === node.id)
              );

            const radius = isHovered || isSelected ? 28 : 24;
            const opacity = selectedNode && !isSelected && !isConnected ? 0.3 : 1;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-transform"
                style={{ opacity }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => handleNodeClick(node.id)}
              >
                {/* 外圈（选中状态） */}
                {isSelected && (
                  <circle r={radius + 4} fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
                )}
                {/* 节点圆 */}
                <circle
                  r={radius}
                  fill={color}
                  stroke="white"
                  strokeWidth="3"
                  className="transition-all"
                />
                {/* 人物名称 */}
                <text
                  y={4}
                  textAnchor="middle"
                  className="text-xs font-medium fill-white pointer-events-none"
                >
                  {node.name.slice(0, 3)}
                </text>
                {/* 角色标签 */}
                <text
                  y={radius + 16}
                  textAnchor="middle"
                  className="text-xs fill-current pointer-events-none"
                  style={{ fill: themeClasses.text.includes('dark') ? '#94a3b8' : '#64748b' }}
                >
                  {node.role}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* 图例 */}
      <div className={`absolute bottom-2 left-2 p-2 rounded-lg ${themeClasses.bg} ${themeClasses.border} border text-xs`}>
        <div className={`font-medium ${themeClasses.text} mb-1`}>关系类型</div>
        <div className="flex flex-wrap gap-2">
          {Object.entries(RELATION_COLORS)
            .filter(([key]) => key !== 'default')
            .slice(0, 5)
            .map(([type, color]) => (
              <div key={type} className="flex items-center gap-1">
                <div className="w-3 h-0.5" style={{ backgroundColor: color }} />
                <span className={themeClasses.textMuted}>{type}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default memo(RelationshipGraph);
