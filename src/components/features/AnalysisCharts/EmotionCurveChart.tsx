/**
 * 情绪曲线图表组件
 * 
 * 可视化展示文本的情绪起伏曲线
 */

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { EmotionPoint } from '../../../utils/analyzers';

interface EmotionCurveChartProps {
  emotionPoints: EmotionPoint[];
  height?: number;
  showLegend?: boolean;
}

export const EmotionCurveChart: React.FC<EmotionCurveChartProps> = ({
  emotionPoints,
  height = 300,
  showLegend = true,
}) => {
  // 转换数据格式
  const chartData = emotionPoints.map((point, index) => ({
    position: index + 1,
    intensity: point.intensity,
    emotion: point.type,
    word: point.word,
  }));

  // 情绪类型映射
  const emotionNameMap: Record<string, string> = {
    joy: '喜悦',
    anger: '愤怒',
    sadness: '悲伤',
    fear: '恐惧',
    surprise: '惊讶',
    disgust: '厌恶',
    anticipation: '期待',
    trust: '信任',
  };

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            位置: {data.position}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            情绪: <span className="font-medium">{emotionNameMap[data.emotion] || data.emotion}</span>
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            强度: <span className="font-medium">{data.intensity}</span>
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            词汇: {data.word}
          </p>
        </div>
      );
    }
    return null;
  };

  // 根据情绪类型返回颜色
  const getEmotionColor = (emotion: string): string => {
    const colorMap: Record<string, string> = {
      joy: '#10b981', // green
      anger: '#ef4444', // red
      sadness: '#3b82f6', // blue
      fear: '#8b5cf6', // purple
      surprise: '#f59e0b', // amber
      disgust: '#6b7280', // gray
      anticipation: '#ec4899', // pink
      trust: '#06b6d4', // cyan
    };
    return colorMap[emotion] || '#6b7280';
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="position"
            label={{ value: '文本位置', position: 'insideBottom', offset: -5 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            label={{ value: '情绪强度', angle: -90, position: 'insideLeft' }}
            domain={[-100, 100]}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="line"
            />
          )}
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="intensity"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={(props: any) => {
              const { cx, cy, payload } = props;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill={getEmotionColor(payload.emotion)}
                  stroke="#fff"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6 }}
            name="情绪强度"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
