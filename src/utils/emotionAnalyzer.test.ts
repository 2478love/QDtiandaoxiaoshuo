import { describe, it, expect } from 'vitest';
import {
  detectEmotionPoints,
  analyzeEmotionCurve,
  analyzeEmotionDistribution,
  calculateResonance,
  calculateBalance,
  analyzeEmotion,
  generateEmotionReport,
  generateEmotionPrompt,
} from './emotionAnalyzer';

describe('emotionAnalyzer', () => {
  describe('detectEmotionPoints', () => {
    it('应该检测喜悦情绪', () => {
      const text = '他非常高兴，开心地笑了起来。';
      const points = detectEmotionPoints(text);
      expect(points.some(p => p.type === 'joy')).toBe(true);
      expect(points.some(p => p.intensity > 0)).toBe(true);
    });

    it('应该检测愤怒情绪', () => {
      const text = '他非常愤怒，怒不可遏地咆哮起来。';
      const points = detectEmotionPoints(text);
      expect(points.some(p => p.type === 'anger')).toBe(true);
      expect(points.some(p => p.intensity < 0)).toBe(true);
    });

    it('应该检测悲伤情绪', () => {
      const text = '他非常悲伤，忍不住流下了眼泪。';
      const points = detectEmotionPoints(text);
      expect(points.some(p => p.type === 'sadness')).toBe(true);
    });

    it('应该检测恐惧情绪', () => {
      const text = '他感到非常害怕，全身颤抖不已。';
      const points = detectEmotionPoints(text);
      expect(points.some(p => p.type === 'fear')).toBe(true);
    });

    it('应该检测惊讶情绪', () => {
      const text = '他非常震惊，目瞪口呆地看着眼前的一切。';
      const points = detectEmotionPoints(text);
      expect(points.some(p => p.type === 'surprise')).toBe(true);
    });

    it('应该按位置排序', () => {
      const text = '他先高兴，然后愤怒，最后悲伤。';
      const points = detectEmotionPoints(text);
      if (points.length >= 2) {
        expect(points[0].position).toBeLessThan(points[points.length - 1].position);
      }
    });

    it('应该处理无情绪文本', () => {
      const text = '今天天气很好。';
      const points = detectEmotionPoints(text);
      expect(points.length).toBe(0);
    });
  });

  describe('analyzeEmotionCurve', () => {
    it('应该分析情绪曲线', () => {
      const text = '他高兴，然后愤怒，最后悲伤。';
      const points = detectEmotionPoints(text);
      const curve = analyzeEmotionCurve(points);
      
      expect(curve).toHaveProperty('averageIntensity');
      expect(curve).toHaveProperty('volatility');
      expect(curve).toHaveProperty('trend');
    });

    it('应该识别波峰', () => {
      const text = '他有点高兴，非常高兴，然后又有点高兴。';
      const points = detectEmotionPoints(text);
      const curve = analyzeEmotionCurve(points);
      
      expect(curve.peaks).toBeDefined();
    });

    it('应该识别波谷', () => {
      const text = '他有点悲伤，非常悲伤，然后又有点悲伤。';
      const points = detectEmotionPoints(text);
      const curve = analyzeEmotionCurve(points);
      
      expect(curve.valleys).toBeDefined();
    });

    it('应该判断情绪趋势', () => {
      const risingText = '他有点高兴，很高兴，非常高兴，狂喜。';
      const risingPoints = detectEmotionPoints(risingText);
      const risingCurve = analyzeEmotionCurve(risingPoints);
      
      expect(['rising', 'stable', 'falling']).toContain(risingCurve.trend);
    });

    it('应该处理空情绪点', () => {
      const curve = analyzeEmotionCurve([]);
      
      expect(curve.averageIntensity).toBe(0);
      expect(curve.volatility).toBe(0);
      expect(curve.trend).toBe('stable');
    });
  });

  describe('analyzeEmotionDistribution', () => {
    it('应该统计情绪分布', () => {
      const text = '他高兴，愤怒，悲伤，害怕。';
      const points = detectEmotionPoints(text);
      const distribution = analyzeEmotionDistribution(points);
      
      expect(distribution).toHaveProperty('joy');
      expect(distribution).toHaveProperty('anger');
      expect(distribution).toHaveProperty('sadness');
      expect(distribution).toHaveProperty('fear');
    });

    it('应该正确计数', () => {
      const text = '他高兴，高兴，高兴。';
      const points = detectEmotionPoints(text);
      const distribution = analyzeEmotionDistribution(points);
      
      expect(distribution.joy).toBeGreaterThan(0);
    });
  });

  describe('calculateResonance', () => {
    it('应该计算共鸣度', () => {
      const text = '他非常高兴，然后非常愤怒，最后非常悲伤。';
      const points = detectEmotionPoints(text);
      const curve = analyzeEmotionCurve(points);
      const resonance = calculateResonance(curve);
      
      expect(resonance).toBeGreaterThanOrEqual(0);
      expect(resonance).toBeLessThanOrEqual(100);
    });

    it('应该处理空曲线', () => {
      const curve = analyzeEmotionCurve([]);
      const resonance = calculateResonance(curve);
      
      expect(resonance).toBe(0);
    });
  });

  describe('calculateBalance', () => {
    it('应该计算情绪平衡度', () => {
      const text = '他高兴，也悲伤。';
      const points = detectEmotionPoints(text);
      const distribution = analyzeEmotionDistribution(points);
      const balance = calculateBalance(distribution);
      
      expect(balance).toBeGreaterThanOrEqual(0);
      expect(balance).toBeLessThanOrEqual(100);
    });

    it('应该处理纯正面情绪', () => {
      const text = '他高兴，开心，快乐。';
      const points = detectEmotionPoints(text);
      const distribution = analyzeEmotionDistribution(points);
      const balance = calculateBalance(distribution);
      
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    it('应该处理纯负面情绪', () => {
      const text = '他愤怒，悲伤，害怕。';
      const points = detectEmotionPoints(text);
      const distribution = analyzeEmotionDistribution(points);
      const balance = calculateBalance(distribution);
      
      expect(balance).toBeGreaterThanOrEqual(0);
    });

    it('应该处理无情绪', () => {
      const distribution = {
        joy: 0,
        anger: 0,
        sadness: 0,
        fear: 0,
        surprise: 0,
        disgust: 0,
        anticipation: 0,
        trust: 0,
      };
      const balance = calculateBalance(distribution);
      
      expect(balance).toBe(50);
    });
  });

  describe('analyzeEmotion', () => {
    it('应该综合分析情绪', () => {
      const text = '他非常高兴，然后愤怒，最后悲伤。';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(analysis).toHaveProperty('curve');
      expect(analysis).toHaveProperty('distribution');
      expect(analysis).toHaveProperty('dominantEmotion');
      expect(analysis).toHaveProperty('resonance');
      expect(analysis).toHaveProperty('balance');
    });

    it('应该识别主导情绪', () => {
      const text = '他高兴，高兴，高兴，愤怒。';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.dominantEmotion).toBe('joy');
    });

    it('应该提供优势', () => {
      const text = '他非常高兴，激动不已，然后又有点悲伤，最后期待未来。';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.strengths).toBeDefined();
    });

    it('应该提供改进建议', () => {
      const text = '他走了过去。';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.improvements).toBeDefined();
    });
  });

  describe('generateEmotionReport', () => {
    it('应该生成完整报告', () => {
      const text = '他高兴，愤怒，悲伤。';
      const analysis = analyzeEmotion(text);
      const report = generateEmotionReport(analysis);
      
      expect(report).toContain('情绪曲线分析报告');
      expect(report).toContain('综合评分');
      expect(report).toContain('核心指标');
    });

    it('应该包含情绪分布', () => {
      const text = '他高兴，愤怒。';
      const analysis = analyzeEmotion(text);
      const report = generateEmotionReport(analysis);
      
      expect(report).toContain('情绪分布');
    });

    it('应该包含情绪曲线信息', () => {
      const text = '他高兴，愤怒。';
      const analysis = analyzeEmotion(text);
      const report = generateEmotionReport(analysis);
      
      expect(report).toContain('情绪曲线');
    });

    it('应该包含优势和改进建议', () => {
      const text = '他高兴。';
      const analysis = analyzeEmotion(text);
      const report = generateEmotionReport(analysis);
      
      if (analysis.strengths.length > 0) {
        expect(report).toContain('优势');
      }
      if (analysis.improvements.length > 0) {
        expect(report).toContain('改进建议');
      }
    });
  });

  describe('generateEmotionPrompt', () => {
    it('应该生成优化提示词', () => {
      const text = '他走了过去。';
      const analysis = analyzeEmotion(text);
      const prompt = generateEmotionPrompt(text, analysis);
      
      expect(prompt).toContain('优化');
      expect(prompt).toContain('情绪');
    });

    it('应该根据共鸣度生成建议', () => {
      const text = '他走了过去。';
      const analysis = analyzeEmotion(text);
      const prompt = generateEmotionPrompt(text, analysis);
      
      expect(prompt).toContain('情绪');
    });

    it('应该包含主导情绪信息', () => {
      const text = '他高兴。';
      const analysis = analyzeEmotion(text);
      const prompt = generateEmotionPrompt(text, analysis);
      
      expect(prompt).toContain('主导情绪');
    });

    it('应该包含情绪趋势信息', () => {
      const text = '他高兴。';
      const analysis = analyzeEmotion(text);
      const prompt = generateEmotionPrompt(text, analysis);
      
      expect(prompt).toContain('情绪趋势');
    });
  });

  describe('边界情况', () => {
    it('应该处理空文本', () => {
      const text = '';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('应该处理纯标点文本', () => {
      const text = '。。。！！！？？？';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('应该处理超长文本', () => {
      const text = '他高兴。'.repeat(1000);
      const analysis = analyzeEmotion(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
    });

    it('应该处理混合情绪', () => {
      const text = '他又高兴又悲伤，既愤怒又害怕，感到震惊和期待。';
      const analysis = analyzeEmotion(text);
      
      expect(analysis.distribution.joy).toBeGreaterThan(0);
      expect(analysis.distribution.sadness).toBeGreaterThan(0);
    });
  });
});
