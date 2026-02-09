/**
 * 五感雷达图组件
 * 
 * 可视化展示五感描写的使用情况
 */

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface SenseData {
  visual: number;
  auditory: number;
  olfactory: number;
  gustatory: number;
  tactile: number;
}

interface SenseRadarChartProps {
  data: SenseData;
  height?: number;
  showLegend?: boolean;
}

export const SenseRadarChart: React.FC<SenseRadarChartProps> = ({
  data,
  height = 300,
  showLegend = false,
}) => {
  // 转换数据格式
  const chartData = [
    { sense: '视觉', value: data.visual, fullMark: 100 },
    { sense: '听觉', value: data.auditory, fullMark: 100 },
    { sense: '嗅觉', value: data.olfactory, fullMark: 100 },
    { sense: '味觉', value: data.gustatory, fullMark: 100 },
    { sense: '触觉', value: data.tactile, fullMark: 100 },
  ];

  // 自定义 Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {data.sense}
          </p>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            使用度: <span className="font-medium">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RadarChart data={chartData}>
          <PolarGrid className="stroke-gray-200 dark:stroke-gray-700" />
          <PolarAngleAxis
            dataKey="sense"
            className="text-gray-600 dark:text-gray-400"
            tick={{ fill: 'currentColor', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            className="text-gray-600 dark:text-gray-400"
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          <Radar
            name="五感使用度"
            dataKey="value"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
