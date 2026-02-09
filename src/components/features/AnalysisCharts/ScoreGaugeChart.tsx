/**
 * 评分仪表盘组件
 * 
 * 可视化展示综合评分和等级
 */

import React from 'react';

interface ScoreGaugeChartProps {
  score: number;
  grade: 'S' | 'A' | 'B' | 'C' | 'D';
  label?: string;
  size?: number;
}

export const ScoreGaugeChart: React.FC<ScoreGaugeChartProps> = ({
  score,
  grade,
  label = '综合评分',
  size = 200,
}) => {
  // 计算角度（0-180度）
  const angle = (score / 100) * 180;
  const radius = size / 2;
  const strokeWidth = size / 10;
  const innerRadius = radius - strokeWidth;

  // 根据等级返回颜色
  const getGradeColor = (grade: string): string => {
    const colorMap: Record<string, string> = {
      S: '#10b981', // green
      A: '#3b82f6', // blue
      B: '#f59e0b', // amber
      C: '#f97316', // orange
      D: '#ef4444', // red
    };
    return colorMap[grade] || '#6b7280';
  };

  const color = getGradeColor(grade);

  // 计算指针位置
  const needleLength = innerRadius - 10;
  const needleAngle = (angle - 90) * (Math.PI / 180);
  const needleX = radius + needleLength * Math.cos(needleAngle);
  const needleY = radius + needleLength * Math.sin(needleAngle);

  // 生成弧形路径
  const generateArc = (startAngle: number, endAngle: number, radius: number) => {
    const start = (startAngle - 90) * (Math.PI / 180);
    const end = (endAngle - 90) * (Math.PI / 180);
    const x1 = radius + radius * Math.cos(start);
    const y1 = radius + radius * Math.sin(start);
    const x2 = radius + radius * Math.cos(end);
    const y2 = radius + radius * Math.sin(end);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 0.7} className="overflow-visible">
        {/* 背景弧 */}
        <path
          d={generateArc(0, 180, innerRadius)}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="dark:stroke-gray-700"
        />
        
        {/* 进度弧 */}
        <path
          d={generateArc(0, angle, innerRadius)}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        
        {/* 刻度 */}
        {[0, 45, 90, 135, 180].map((deg) => {
          const rad = (deg - 90) * (Math.PI / 180);
          const x1 = radius + (innerRadius - strokeWidth / 2) * Math.cos(rad);
          const y1 = radius + (innerRadius - strokeWidth / 2) * Math.sin(rad);
          const x2 = radius + (innerRadius + strokeWidth / 2) * Math.cos(rad);
          const y2 = radius + (innerRadius + strokeWidth / 2) * Math.sin(rad);
          return (
            <line
              key={deg}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#9ca3af"
              strokeWidth={2}
              className="dark:stroke-gray-600"
            />
          );
        })}
        
        {/* 指针 */}
        <line
          x1={radius}
          y1={radius}
          x2={needleX}
          y2={needleY}
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={radius} cy={radius} r={6} fill={color} />
        
        {/* 分数文本 */}
        <text
          x={radius}
          y={radius + 30}
          textAnchor="middle"
          className="text-3xl font-bold fill-gray-900 dark:fill-gray-100"
        >
          {score}
        </text>
        
        {/* 等级文本 */}
        <text
          x={radius}
          y={radius + 55}
          textAnchor="middle"
          className="text-xl font-semibold"
          fill={color}
        >
          {grade} 级
        </text>
      </svg>
      
      {/* 标签 */}
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
        {label}
      </p>
    </div>
  );
};
