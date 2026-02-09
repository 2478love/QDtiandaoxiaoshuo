/**
 * 分析图表组件测试
 */

import { describe, it, expect } from 'vitest';

describe('AnalysisCharts', () => {
  describe('ScoreGaugeChart', () => {
    it('应该导出 ScoreGaugeChart 组件', async () => {
      const module = await import('./ScoreGaugeChart');
      expect(module.ScoreGaugeChart).toBeDefined();
    });
  });

  describe('EmotionCurveChart', () => {
    it('应该导出 EmotionCurveChart 组件', async () => {
      const module = await import('./EmotionCurveChart');
      expect(module.EmotionCurveChart).toBeDefined();
    });
  });

  describe('TensionWaveChart', () => {
    it('应该导出 TensionWaveChart 组件', async () => {
      const module = await import('./TensionWaveChart');
      expect(module.TensionWaveChart).toBeDefined();
    });
  });

  describe('SenseRadarChart', () => {
    it('应该导出 SenseRadarChart 组件', async () => {
      const module = await import('./SenseRadarChart');
      expect(module.SenseRadarChart).toBeDefined();
    });
  });

  describe('index exports', () => {
    it('应该导出所有图表组件', async () => {
      const module = await import('./index');
      expect(module.ScoreGaugeChart).toBeDefined();
      expect(module.EmotionCurveChart).toBeDefined();
      expect(module.TensionWaveChart).toBeDefined();
      expect(module.SenseRadarChart).toBeDefined();
    });
  });
});
