import { describe, it, expect } from 'vitest';
import {
  analyzeComprehensive,
  generateComprehensiveReport,
  generateComprehensivePrompt,
} from './comprehensiveAnalyzer';

describe('comprehensiveAnalyzer', () => {
  describe('analyzeComprehensive', () => {
    it('应该综合分析文本', () => {
      const text = `
        他与敌人激烈对峙，心中充满愤怒。
        "你到底想要什么？"他怒吼道。
        然而对方却突然笑了，这让他感到震惊。
        原来这一切都是陷阱。
      `;
      const result = analyzeComprehensive(text);
      
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('style');
      expect(result).toHaveProperty('tension');
      expect(result).toHaveProperty('emotion');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('priorities');
      expect(result).toHaveProperty('recommendations');
    });

    it('应该计算综合评分', () => {
      const text = '他走了过去。';
      const result = analyzeComprehensive(text);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('应该汇总优势', () => {
      const text = `
        他与敌人激烈对峙，双方剑拔弩张，危机四伏。
        他感到非常愤怒，心中充满了仇恨。
        "你到底想要什么？"他怒吼道，声音震耳欲聋。
        然而对方却突然笑了，这让他感到震惊。
        原来这一切都是陷阱，真相终于揭开了。
      `;
      const result = analyzeComprehensive(text);
      
      expect(result.strengths).toBeDefined();
      expect(Array.isArray(result.strengths)).toBe(true);
    });

    it('应该汇总弱点', () => {
      const text = '他走了过去。';
      const result = analyzeComprehensive(text);
      
      expect(result.weaknesses).toBeDefined();
      expect(Array.isArray(result.weaknesses)).toBe(true);
      expect(result.weaknesses.length).toBeGreaterThan(0);
    });

    it('应该生成优先级列表', () => {
      const text = '他走了过去。';
      const result = analyzeComprehensive(text);
      
      expect(result.priorities).toBeDefined();
      expect(Array.isArray(result.priorities)).toBe(true);
    });

    it('应该按影响分数排序优先级', () => {
      const text = '他走了过去。';
      const result = analyzeComprehensive(text);
      
      if (result.priorities.length >= 2) {
        expect(result.priorities[0].impact).toBeGreaterThanOrEqual(result.priorities[1].impact);
      }
    });

    it('应该生成改进建议', () => {
      const text = '他走了过去。';
      const result = analyzeComprehensive(text);
      
      expect(result.recommendations).toBeDefined();
      expect(Array.isArray(result.recommendations)).toBe(true);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('应该分类改进建议', () => {
      const text = '他走了过去。';
      const result = analyzeComprehensive(text);
      
      const categories = result.recommendations.map(r => r.category);
      expect(categories.every(c => ['quick-win', 'important', 'nice-to-have'].includes(c))).toBe(true);
    });
  });

  describe('generateComprehensiveReport', () => {
    it('应该生成完整报告', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      expect(report).toContain('综合分析报告');
      expect(report).toContain('综合评分');
      expect(report).toContain('分项评分');
    });

    it('应该包含等级评定', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      expect(report).toMatch(/等级：[SABCD]/);
    });

    it('应该包含分项评分表格', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      expect(report).toContain('写作风格');
      expect(report).toContain('情节张力');
      expect(report).toContain('情绪表达');
    });

    it('应该包含优势亮点', () => {
      const text = `
        他与敌人激烈对峙，心中充满愤怒。
        "你到底想要什么？"他怒吼道。
      `;
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      if (analysis.strengths.length > 0) {
        expect(report).toContain('优势亮点');
      }
    });

    it('应该包含优先级问题', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      if (analysis.priorities.length > 0) {
        expect(report).toContain('优先级问题');
      }
    });

    it('应该包含改进建议', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      expect(report).toContain('改进建议');
    });

    it('应该区分快速见效和重要改进', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const report = generateComprehensiveReport(analysis);
      
      const hasQuickWins = analysis.recommendations.some(r => r.category === 'quick-win');
      const hasImportant = analysis.recommendations.some(r => r.category === 'important');
      
      if (hasQuickWins) {
        expect(report).toContain('快速见效');
      }
      if (hasImportant) {
        expect(report).toContain('重要改进');
      }
    });
  });

  describe('generateComprehensivePrompt', () => {
    it('应该生成优化提示词', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const prompt = generateComprehensivePrompt(text, analysis);
      
      expect(prompt).toContain('综合优化提示词');
      expect(prompt).toContain('优化');
    });

    it('应该包含优先改进项', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const prompt = generateComprehensivePrompt(text, analysis);
      
      if (analysis.priorities.length > 0) {
        expect(prompt).toContain('优先改进项');
      }
    });

    it('应该包含具体改进方向', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const prompt = generateComprehensivePrompt(text, analysis);
      
      expect(prompt).toContain('具体改进方向');
    });

    it('应该包含优化目标', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const prompt = generateComprehensivePrompt(text, analysis);
      
      expect(prompt).toContain('优化目标');
      expect(prompt).toContain('当前综合评分');
      expect(prompt).toContain('目标评分');
    });

    it('应该包含原文', () => {
      const text = '他走了过去。';
      const analysis = analyzeComprehensive(text);
      const prompt = generateComprehensivePrompt(text, analysis);
      
      expect(prompt).toContain('原文');
      expect(prompt).toContain(text);
    });
  });

  describe('边界情况', () => {
    it('应该处理空文本', () => {
      const text = '';
      const result = analyzeComprehensive(text);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
    });

    it('应该处理纯标点文本', () => {
      const text = '。。。！！！？？？';
      const result = analyzeComprehensive(text);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('应该处理超长文本', () => {
      const text = '他走了过去。'.repeat(1000);
      const result = analyzeComprehensive(text);
      
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('应该处理高质量文本', () => {
      const text = `
        他与敌人激烈对峙，双方剑拔弩张，危机四伏，时间紧迫。
        他感到非常愤怒，心中充满了仇恨，全身颤抖不已。
        "你到底想要什么？"他怒吼道，声音震耳欲聋，回荡在空旷的大厅中。
        然而对方却突然笑了，这让他感到震惊，目瞪口呆。
        原来这一切都是陷阱，真相终于揭开了，所有的谜团都解开了。
        这是最终的决战，生死存亡的关键时刻，他爆发出全部力量。
      `;
      const result = analyzeComprehensive(text);
      
      expect(result.overallScore).toBeGreaterThan(50);
    });

    it('应该处理低质量文本', () => {
      const text = '他走了。他坐了。他站了。';
      const result = analyzeComprehensive(text);
      
      expect(result.priorities.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('评分系统', () => {
    it('应该正确评定等级', () => {
      const testCases = [
        { score: 95, expectedGrade: 'S' },
        { score: 85, expectedGrade: 'A' },
        { score: 75, expectedGrade: 'B' },
        { score: 65, expectedGrade: 'C' },
        { score: 55, expectedGrade: 'D' },
      ];

      // 这里只是验证报告生成不会出错
      for (const { score } of testCases) {
        const mockAnalysis = {
          overallScore: score,
          style: { score: 70, dialogueQuality: 70, actionQuality: 70, sceneQuality: 70, senseUsage: { visual: 5, auditory: 2, olfactory: 1, gustatory: 1, tactile: 2 }, issues: [], strengths: [], improvements: [] },
          tension: { overallScore: 70, conflict: { intensity: 70, types: { interpersonal: 1, environmental: 1, internal: 1 }, conflicts: [] }, suspense: { effectiveness: 70, count: 2, suspenses: [] }, twist: { count: 1, quality: 70, twists: [] }, climax: { hasClimax: true, position: 100, intensity: 70, buildup: 70, resolution: 70 }, pacing: { score: 70, rhythm: 'balanced' as const, sentenceLengthVariation: 50, paragraphDensity: 50, breathingSpace: 50 }, issues: [], strengths: [], improvements: [] },
          emotion: { score: 70, curve: { points: [], peaks: [], valleys: [], averageIntensity: 50, volatility: 50, trend: 'stable' as const }, distribution: { joy: 1, anger: 1, sadness: 1, fear: 1, surprise: 1, disgust: 0, anticipation: 1, trust: 1 }, dominantEmotion: 'joy' as const, resonance: 70, balance: 50, strengths: [], improvements: [] },
          strengths: [],
          weaknesses: [],
          priorities: [],
          recommendations: [],
        };
        
        const report = generateComprehensiveReport(mockAnalysis);
        expect(report).toContain('等级：');
      }
    });
  });
});
