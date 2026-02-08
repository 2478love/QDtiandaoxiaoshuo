import { describe, it, expect } from 'vitest';
import {
  analyzeConflict,
  analyzeSuspense,
  analyzeTwist,
  analyzeClimax,
  analyzePacing,
  analyzePlotTension,
  generateTensionReport,
  generateTensionPrompt,
} from './plotTensionAnalyzer';

describe('plotTensionAnalyzer', () => {
  describe('analyzeConflict', () => {
    it('应该检测人物冲突', () => {
      const text = '他与敌人对峙，双方剑拔弩张，随时可能爆发战斗。';
      const result = analyzeConflict(text);
      expect(result.types.interpersonal).toBeGreaterThan(0);
      expect(result.conflicts.some(c => c.type === 'interpersonal')).toBe(true);
    });

    it('应该检测环境冲突', () => {
      const text = '危机四伏，时间紧迫，他必须在天黑前逃出这个险境。';
      const result = analyzeConflict(text);
      expect(result.types.environmental).toBeGreaterThan(0);
      expect(result.conflicts.some(c => c.type === 'environmental')).toBe(true);
    });

    it('应该检测内心冲突', () => {
      const text = '他内心挣扎，陷入两难抉择，不知该如何是好。';
      const result = analyzeConflict(text);
      expect(result.types.internal).toBeGreaterThan(0);
      expect(result.conflicts.some(c => c.type === 'internal')).toBe(true);
    });

    it('应该计算冲突强度', () => {
      const text = '他与敌人对峙，危机四伏，内心挣扎不已。';
      const result = analyzeConflict(text);
      expect(result.intensity).toBeGreaterThanOrEqual(0);
      expect(result.intensity).toBeLessThanOrEqual(100);
    });

    it('应该处理无冲突文本', () => {
      const text = '今天天气很好，阳光明媚。';
      const result = analyzeConflict(text);
      expect(result.intensity).toBe(0);
      expect(result.conflicts.length).toBe(0);
    });
  });

  describe('analyzeSuspense', () => {
    it('应该检测疑问句', () => {
      const text = '他到底去了哪里？为什么还不回来？';
      const result = analyzeSuspense(text);
      expect(result.suspenses.some(s => s.type === 'question')).toBe(true);
    });

    it('应该检测未解之谜', () => {
      const text = '这个秘密隐藏了多年，真相究竟是什么？';
      const result = analyzeSuspense(text);
      expect(result.suspenses.some(s => s.type === 'mystery')).toBe(true);
    });

    it('应该检测危机预告', () => {
      const text = '危险即将来临，他必须尽快离开。';
      const result = analyzeSuspense(text);
      expect(result.suspenses.some(s => s.type === 'crisis')).toBe(true);
    });

    it('应该检测伏笔', () => {
      const text = '他有种不祥的预感，似乎有什么事情即将发生。';
      const result = analyzeSuspense(text);
      expect(result.suspenses.some(s => s.type === 'foreshadowing')).toBe(true);
    });

    it('应该计算悬念有效性', () => {
      const text = '他到底去了哪里？这个秘密隐藏了多年。危险即将来临。';
      const result = analyzeSuspense(text);
      expect(result.effectiveness).toBeGreaterThanOrEqual(0);
      expect(result.effectiveness).toBeLessThanOrEqual(100);
      expect(result.count).toBeGreaterThan(0);
    });
  });

  describe('analyzeTwist', () => {
    it('应该检测反转', () => {
      const text = '他以为胜券在握，然而事情突然发生了变化。';
      const result = analyzeTwist(text);
      expect(result.twists.some(t => t.type === 'reversal')).toBe(true);
    });

    it('应该检测意外', () => {
      const text = '没想到他竟然是幕后黑手，所有人都震惊了。';
      const result = analyzeTwist(text);
      expect(result.twists.some(t => t.type === 'surprise')).toBe(true);
    });

    it('应该检测揭秘', () => {
      const text = '原来真相是这样的，所有的谜团都揭开了。';
      const result = analyzeTwist(text);
      expect(result.twists.some(t => t.type === 'revelation')).toBe(true);
    });

    it('应该计算转折质量', () => {
      const text = '然而事情突然变化，没想到竟然如此，原来真相是这样。';
      const result = analyzeTwist(text);
      expect(result.quality).toBeGreaterThanOrEqual(0);
      expect(result.quality).toBeLessThanOrEqual(100);
      expect(result.count).toBeGreaterThan(0);
    });

    it('应该处理无转折文本', () => {
      const text = '他走了过去，坐了下来，喝了一口水。';
      const result = analyzeTwist(text);
      expect(result.count).toBe(0);
    });
  });

  describe('analyzeClimax', () => {
    it('应该检测高潮', () => {
      const text = '这是最终的决战，生死存亡的关键时刻，他爆发出全部力量。';
      const result = analyzeClimax(text);
      expect(result.hasClimax).toBe(true);
      expect(result.intensity).toBeGreaterThan(0);
    });

    it('应该评估铺垫充分度', () => {
      const text = '前面很长的铺垫内容...' + '这是最终的决战。';
      const result = analyzeClimax(text);
      expect(result.buildup).toBeGreaterThanOrEqual(0);
      expect(result.buildup).toBeLessThanOrEqual(100);
    });

    it('应该处理无高潮文本', () => {
      const text = '他走了过去，坐了下来，喝了一口水。';
      const result = analyzeClimax(text);
      expect(result.hasClimax).toBe(false);
    });
  });

  describe('analyzePacing', () => {
    it('应该分析句式长度变化', () => {
      const text = '他跑。他飞快地跑过街道。他用尽全力奔跑，仿佛身后有什么可怕的东西在追赶。';
      const result = analyzePacing(text);
      expect(result.sentenceLengthVariation).toBeGreaterThanOrEqual(0);
      expect(result.sentenceLengthVariation).toBeLessThanOrEqual(100);
    });

    it('应该判断节奏类型', () => {
      const fastText = '他跑。他跳。他飞。他冲。';
      const fastResult = analyzePacing(fastText);
      expect(fastResult.rhythm).toBe('too-fast');

      const slowText = '他慢慢地走过那条长长的街道，心中思绪万千，回想起过去的种种往事。';
      const slowResult = analyzePacing(slowText);
      expect(slowResult.rhythm).toBe('too-slow');
    });

    it('应该计算呼吸感', () => {
      const text = '他跑。他飞快地跑过街道。他用尽全力奔跑。';
      const result = analyzePacing(text);
      expect(result.breathingSpace).toBeGreaterThanOrEqual(0);
      expect(result.breathingSpace).toBeLessThanOrEqual(100);
    });

    it('应该给出综合评分', () => {
      const text = '他跑。他飞快地跑过街道。他用尽全力奔跑，仿佛身后有什么可怕的东西在追赶。';
      const result = analyzePacing(text);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });
  });

  describe('analyzePlotTension', () => {
    it('应该综合分析情节张力', () => {
      const text = `
        他与敌人对峙，危机四伏。
        他到底该怎么办？
        然而事情突然发生了变化。
        这是最终的决战！
      `;
      const result = analyzePlotTension(text);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result).toHaveProperty('conflict');
      expect(result).toHaveProperty('suspense');
      expect(result).toHaveProperty('twist');
      expect(result).toHaveProperty('climax');
      expect(result).toHaveProperty('pacing');
    });

    it('应该识别优势', () => {
      const text = `
        他与敌人激烈对峙，双方剑拔弩张。
        危机四伏，时间紧迫。
        他到底该怎么办？为什么会这样？
        然而事情突然发生了变化，没想到竟然如此。
        这是最终的决战，生死存亡的关键时刻！
      `;
      const result = analyzePlotTension(text);
      expect(result.strengths.length).toBeGreaterThan(0);
    });

    it('应该提供改进建议', () => {
      const text = '他走了过去，坐了下来，喝了一口水。';
      const result = analyzePlotTension(text);
      expect(result.improvements.length).toBeGreaterThan(0);
    });

    it('应该检测具体问题', () => {
      const text = '他走了过去，坐了下来，喝了一口水。';
      const result = analyzePlotTension(text);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('generateTensionReport', () => {
    it('应该生成完整报告', () => {
      const text = '他与敌人对峙，危机四伏。他到底该怎么办？';
      const analysis = analyzePlotTension(text);
      const report = generateTensionReport(analysis);
      
      expect(report).toContain('情节张力分析报告');
      expect(report).toContain('综合评分');
      expect(report).toContain('分项评分');
    });

    it('应该包含优势和改进建议', () => {
      const text = '他与敌人对峙，危机四伏。';
      const analysis = analyzePlotTension(text);
      const report = generateTensionReport(analysis);
      
      if (analysis.strengths.length > 0) {
        expect(report).toContain('优势');
      }
      if (analysis.improvements.length > 0) {
        expect(report).toContain('改进建议');
      }
    });

    it('应该列出具体问题', () => {
      const text = '他走了过去。';
      const analysis = analyzePlotTension(text);
      const report = generateTensionReport(analysis);
      
      if (analysis.issues.length > 0) {
        expect(report).toContain('具体问题');
      }
    });
  });

  describe('generateTensionPrompt', () => {
    it('应该生成优化提示词', () => {
      const text = '他走了过去。';
      const analysis = analyzePlotTension(text);
      const prompt = generateTensionPrompt(text, analysis);
      
      expect(prompt).toContain('优化');
      expect(prompt).toContain('情节张力');
    });

    it('应该根据冲突强度生成建议', () => {
      const text = '他走了过去，坐了下来。';
      const analysis = analyzePlotTension(text);
      const prompt = generateTensionPrompt(text, analysis);
      
      expect(prompt).toContain('冲突');
    });

    it('应该根据悬念有效性生成建议', () => {
      const text = '他走了过去，坐了下来。';
      const analysis = analyzePlotTension(text);
      const prompt = generateTensionPrompt(text, analysis);
      
      expect(prompt).toContain('悬念');
    });

    it('应该根据转折数量生成建议', () => {
      const text = '他走了过去，坐了下来。';
      const analysis = analyzePlotTension(text);
      const prompt = generateTensionPrompt(text, analysis);
      
      expect(prompt).toContain('转折');
    });

    it('应该根据高潮情况生成建议', () => {
      const text = '他走了过去，坐了下来。';
      const analysis = analyzePlotTension(text);
      const prompt = generateTensionPrompt(text, analysis);
      
      expect(prompt).toContain('高潮');
    });
  });

  describe('边界情况', () => {
    it('应该处理空文本', () => {
      const text = '';
      const result = analyzePlotTension(text);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('应该处理纯对话文本', () => {
      const text = '"你好。""你好。""再见。""再见。"';
      const result = analyzePlotTension(text);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('应该处理超长文本', () => {
      const text = '他走了过去。'.repeat(1000);
      const result = analyzePlotTension(text);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('应该处理只有标点的文本', () => {
      const text = '。。。！！！？？？';
      const result = analyzePlotTension(text);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });
  });
});
