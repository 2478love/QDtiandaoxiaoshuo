import { describe, it, expect } from 'vitest';
import {
  analyzePacing,
  analyzeCoolPointDistribution,
  analyzeEmotionCurve,
  suggestNextChapterPacing,
  generatePacingReport,
  type ChapterPacingData,
} from './pacingSuggestionSystem';

describe('PacingSuggestionSystem', () => {
  const createChapter = (overrides: Partial<ChapterPacingData> = {}): ChapterPacingData => ({
    chapterNumber: 1,
    wordCount: 2000,
    dialogueRatio: 0.3,
    actionRatio: 0.4,
    descriptionRatio: 0.3,
    coolPointCount: 1,
    emotionIntensity: 50,
    ...overrides,
  });

  describe('analyzePacing', () => {
    it('should analyze pacing', () => {
      const chapters = [
        createChapter({ chapterNumber: 1 }),
        createChapter({ chapterNumber: 2 }),
        createChapter({ chapterNumber: 3 }),
      ];

      const analysis = analyzePacing(chapters);

      expect(analysis.currentPacing).toBeDefined();
      expect(analysis.pacingScore).toBeGreaterThanOrEqual(0);
      expect(analysis.pacingScore).toBeLessThanOrEqual(100);
      expect(analysis.issues).toBeDefined();
      expect(analysis.strengths).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should detect slow pacing', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.1,
        coolPointCount: 0,
        descriptionRatio: 0.7,
      }));

      const analysis = analyzePacing(chapters);

      expect(['very-slow', 'slow']).toContain(analysis.currentPacing);
      expect(analysis.pacingScore).toBeLessThan(50);
    });

    it('should detect fast pacing', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.8,
        coolPointCount: 2,
        descriptionRatio: 0.1,
      }));

      const analysis = analyzePacing(chapters);

      expect(['fast', 'very-fast']).toContain(analysis.currentPacing);
      expect(analysis.pacingScore).toBeGreaterThan(60);
    });

    it('should detect too-slow issue', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.1,
        coolPointCount: 0,
      }));

      const analysis = analyzePacing(chapters);

      const slowIssue = analysis.issues.find(i => i.type === 'too-slow');
      expect(slowIssue).toBeDefined();
    });

    it('should detect too-fast issue', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.8,
        descriptionRatio: 0.05,
      }));

      const analysis = analyzePacing(chapters);

      const fastIssue = analysis.issues.find(i => i.type === 'too-fast');
      expect(fastIssue).toBeDefined();
    });

    it('should detect monotonous pacing', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.5, // 完全相同
      }));

      const analysis = analyzePacing(chapters);

      const monotonousIssue = analysis.issues.find(i => i.type === 'monotonous');
      expect(monotonousIssue).toBeDefined();
    });

    it('should handle empty chapters', () => {
      const analysis = analyzePacing([]);

      expect(analysis.currentPacing).toBe('medium');
      expect(analysis.pacingScore).toBe(50);
      expect(analysis.issues).toHaveLength(0);
    });

    it('should generate recommendations', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.1,
      }));

      const analysis = analyzePacing(chapters);

      expect(analysis.recommendations.length).toBeGreaterThan(0);
      analysis.recommendations.forEach(rec => {
        expect(rec.type).toBeDefined();
        expect(rec.title).toBeTruthy();
        expect(rec.description).toBeTruthy();
        expect(rec.priority).toBeGreaterThan(0);
        expect(rec.actionItems.length).toBeGreaterThan(0);
      });
    });
  });

  describe('analyzeCoolPointDistribution', () => {
    it('should analyze cool point distribution', () => {
      const chapters = [
        createChapter({ chapterNumber: 1, coolPointCount: 1 }),
        createChapter({ chapterNumber: 2, coolPointCount: 0 }),
        createChapter({ chapterNumber: 3, coolPointCount: 2 }),
        createChapter({ chapterNumber: 4, coolPointCount: 1 }),
      ];

      const analysis = analyzeCoolPointDistribution(chapters);

      expect(analysis.totalCoolPoints).toBe(4);
      expect(analysis.density).toBe(1);
      expect(analysis.distribution).toEqual([1, 0, 2, 1]);
      expect(analysis.gaps).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should calculate gaps correctly', () => {
      const chapters = [
        createChapter({ chapterNumber: 1, coolPointCount: 1 }),
        createChapter({ chapterNumber: 2, coolPointCount: 0 }),
        createChapter({ chapterNumber: 3, coolPointCount: 0 }),
        createChapter({ chapterNumber: 4, coolPointCount: 1 }),
      ];

      const analysis = analyzeCoolPointDistribution(chapters);

      expect(analysis.gaps).toContain(3); // 间隔3章
    });

    it('should recommend when density is low', () => {
      const chapters = Array(10).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        coolPointCount: 0,
      }));

      const analysis = analyzeCoolPointDistribution(chapters);

      expect(analysis.density).toBe(0);
      expect(analysis.recommendations.some(r => r.includes('密度'))).toBe(true);
    });

    it('should recommend when gaps are too large', () => {
      const chapters = [
        createChapter({ chapterNumber: 1, coolPointCount: 1 }),
        ...Array(6).fill(null).map((_, i) => createChapter({
          chapterNumber: i + 2,
          coolPointCount: 0,
        })),
        createChapter({ chapterNumber: 8, coolPointCount: 1 }),
      ];

      const analysis = analyzeCoolPointDistribution(chapters);

      expect(analysis.recommendations.some(r => r.includes('间隔'))).toBe(true);
    });

    it('should recommend when density is too high', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        coolPointCount: 3,
      }));

      const analysis = analyzeCoolPointDistribution(chapters);

      expect(analysis.density).toBe(3);
      expect(analysis.recommendations.some(r => r.includes('密集'))).toBe(true);
    });
  });

  describe('analyzeEmotionCurve', () => {
    it('should analyze emotion curve', () => {
      const chapters = [
        createChapter({ chapterNumber: 1, emotionIntensity: 30 }),
        createChapter({ chapterNumber: 2, emotionIntensity: 60 }),
        createChapter({ chapterNumber: 3, emotionIntensity: 40 }),
        createChapter({ chapterNumber: 4, emotionIntensity: 80 }),
        createChapter({ chapterNumber: 5, emotionIntensity: 20 }),
      ];

      const analysis = analyzeEmotionCurve(chapters);

      expect(analysis.curve).toEqual([30, 60, 40, 80, 20]);
      expect(analysis.balance).toBeGreaterThanOrEqual(0);
      expect(analysis.balance).toBeLessThanOrEqual(100);
      expect(analysis.variety).toBeGreaterThanOrEqual(0);
      expect(analysis.variety).toBeLessThanOrEqual(100);
      expect(analysis.peaks).toBeDefined();
      expect(analysis.valleys).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
    });

    it('should detect peaks', () => {
      const chapters = [
        createChapter({ chapterNumber: 1, emotionIntensity: 30 }),
        createChapter({ chapterNumber: 2, emotionIntensity: 80 }),
        createChapter({ chapterNumber: 3, emotionIntensity: 40 }),
      ];

      const analysis = analyzeEmotionCurve(chapters);

      expect(analysis.peaks).toContain(1); // 第2章是高潮
    });

    it('should detect valleys', () => {
      const chapters = [
        createChapter({ chapterNumber: 1, emotionIntensity: 20 }),
        createChapter({ chapterNumber: 2, emotionIntensity: -50 }),
        createChapter({ chapterNumber: 3, emotionIntensity: 10 }),
      ];

      const analysis = analyzeEmotionCurve(chapters);

      expect(analysis.valleys).toContain(1); // 第2章是低谷
    });

    it('should recommend when emotions are too extreme', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        emotionIntensity: 90,
      }));

      const analysis = analyzeEmotionCurve(chapters);

      expect(analysis.balance).toBeLessThan(50);
      expect(analysis.recommendations.some(r => r.includes('极端'))).toBe(true);
    });

    it('should recommend when variety is low', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        emotionIntensity: 50,
      }));

      const analysis = analyzeEmotionCurve(chapters);

      expect(analysis.variety).toBeLessThan(30);
      expect(analysis.recommendations.some(r => r.includes('变化'))).toBe(true);
    });

    it('should recommend when no peaks', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        emotionIntensity: 30,
      }));

      const analysis = analyzeEmotionCurve(chapters);

      expect(analysis.peaks).toHaveLength(0);
      expect(analysis.recommendations.some(r => r.includes('高潮'))).toBe(true);
    });
  });

  describe('suggestNextChapterPacing', () => {
    it('should suggest medium pacing for first chapter', () => {
      const suggestion = suggestNextChapterPacing([]);

      expect(suggestion.suggestedPacing).toBe('medium');
      expect(suggestion.reasoning).toBeTruthy();
      expect(suggestion.suggestions.length).toBeGreaterThan(0);
    });

    it('should suggest slow pacing after fast chapters', () => {
      const chapters = Array(3).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.7,
      }));

      const suggestion = suggestNextChapterPacing(chapters);

      expect(suggestion.suggestedPacing).toBe('slow');
      expect(suggestion.reasoning).toContain('放缓');
    });

    it('should suggest fast pacing after slow chapters', () => {
      const chapters = Array(3).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.2,
      }));

      const suggestion = suggestNextChapterPacing(chapters);

      expect(suggestion.suggestedPacing).toBe('fast');
      expect(suggestion.reasoning).toContain('加快');
    });

    it('should suggest medium pacing when balanced', () => {
      const chapters = Array(3).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.4,
      }));

      const suggestion = suggestNextChapterPacing(chapters);

      expect(suggestion.suggestedPacing).toBe('medium');
    });

    it('should include actionable suggestions', () => {
      const chapters = [createChapter()];
      const suggestion = suggestNextChapterPacing(chapters);

      expect(suggestion.suggestions.length).toBeGreaterThan(0);
      suggestion.suggestions.forEach(s => {
        expect(typeof s).toBe('string');
        expect(s.length).toBeGreaterThan(0);
      });
    });
  });

  describe('generatePacingReport', () => {
    it('should generate a report', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
      }));

      const pacingAnalysis = analyzePacing(chapters);
      const coolPointAnalysis = analyzeCoolPointDistribution(chapters);
      const emotionAnalysis = analyzeEmotionCurve(chapters);

      const report = generatePacingReport(pacingAnalysis, coolPointAnalysis, emotionAnalysis);

      expect(report).toBeTruthy();
      expect(typeof report).toBe('string');
    });

    it('should include all sections', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
      }));

      const pacingAnalysis = analyzePacing(chapters);
      const coolPointAnalysis = analyzeCoolPointDistribution(chapters);
      const emotionAnalysis = analyzeEmotionCurve(chapters);

      const report = generatePacingReport(pacingAnalysis, coolPointAnalysis, emotionAnalysis);

      expect(report).toContain('节奏分析报告');
      expect(report).toContain('当前节奏');
      expect(report).toContain('爽点分布');
      expect(report).toContain('情绪曲线');
    });

    it('should format as markdown', () => {
      const chapters = [createChapter()];

      const pacingAnalysis = analyzePacing(chapters);
      const coolPointAnalysis = analyzeCoolPointDistribution(chapters);
      const emotionAnalysis = analyzeEmotionCurve(chapters);

      const report = generatePacingReport(pacingAnalysis, coolPointAnalysis, emotionAnalysis);

      expect(report).toContain('#');
      expect(report).toContain('##');
    });

    it('should include recommendations when present', () => {
      const chapters = Array(5).fill(null).map((_, i) => createChapter({
        chapterNumber: i + 1,
        actionRatio: 0.1,
      }));

      const pacingAnalysis = analyzePacing(chapters);
      const coolPointAnalysis = analyzeCoolPointDistribution(chapters);
      const emotionAnalysis = analyzeEmotionCurve(chapters);

      const report = generatePacingReport(pacingAnalysis, coolPointAnalysis, emotionAnalysis);

      if (pacingAnalysis.recommendations.length > 0) {
        expect(report).toContain('改进建议');
      }
    });
  });
});
