/**
 * 张力波动图表组件
 * 
 * 可视化展示情节张力的波动情况
 */

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TensionDataPoint {
  position: number;
  conflict: number;
  suspense: number;
  overall: number;
  label?: string;
}

interface TensionWaveChartProps {
  data: TensionDataPoint[];
  height?: number;
  showLegend?: boolean;
}

export const TensionWaveChart: React.FC<TensionWaveChartProps> = ({
  data,
  height = 300,
  showLegend = true,
}) => {
  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            位置: {label}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm text-gray-700 dark:text-gray-300">
              <span style={{ color: entry.color }}>●</span> {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorConflict" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="colorSuspense" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="position"
            label={{ value: '章节进度', position: 'insideBottom', offset: -5 }}
            className="text-gray-600 dark:text-gray-400"
          />
          <YAxis
            label={{ value: '张力强度', angle: -90, position: 'insideLeft' }}
            domain={[0, 100]}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend
              wrapperStyle={{ paddingTop: '10px' }}
              iconType="rect"
            />
          )}
          <Area
            type="monotone"
            dataKey="overall"
            stroke="#3b82f6"
            fillOpacity={1}
            fill="url(#colorOverall)"
            name="整体张力"
          />
          <Area
            type="monotone"
            dataKey="conflict"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorConflict)"
            name="冲突强度"
          />
          <Area
            type="monotone"
            dataKey="suspense"
            stroke="#8b5cf6"
            fillOpacity={1}
            fill="url(#colorSuspense)"
            name="悬念程度"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
