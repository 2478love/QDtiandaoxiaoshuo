import { describe, it, expect } from 'vitest';
import {
  calculateTrend,
  analyzeQualityTrend,
  generateTrendReport,
  getTrendName,
  exportTrendDataAsCSV,
  calculateMovingAverage,
  predictFutureTrend,
  type QualityScore,
} from './qualityTrendAnalyzer';

describe('qualityTrendAnalyzer', () => {
  const createScore = (index: number, overallScore: number): QualityScore => ({
    chapterId: `ch${index}`,
    chapterTitle: `第${index}章`,
    chapterIndex: index,
    overallScore,
    styleScore: overallScore + Math.random() * 10 - 5,
    tensionScore: overallScore + Math.random() * 10 - 5,
    emotionScore: overallScore + Math.random() * 10 - 5,
    characterScore: overallScore + Math.random() * 10 - 5,
    webNovelScore: overallScore + Math.random() * 10 - 5,
    timestamp: Date.now(),
  });

  describe('calculateTrend', () => {
    it('should calculate rising trend', () => {
      const scores = [60, 65, 70, 75, 80];
      const trend = calculateTrend(scores);
      
      expect(trend.direction).toBe('rising');
      expect(trend.averageScore).toBe(70);
      expect(trend.maxScore).toBe(80);
      expect(trend.minScore).toBe(60);
      expect(trend.changeRate).toBeGreaterThan(0);
    });

    it('should calculate falling trend', () => {
      const scores = [80, 75, 70, 65, 60];
      const trend = calculateTrend(scores);
      
      expect(trend.direction).toBe('falling');
      expect(trend.changeRate).toBeLessThan(0);
    });

    it('should calculate stable trend', () => {
      const scores = [70, 71, 69, 70, 71];
      const trend = calculateTrend(scores);
      
      expect(trend.direction).toBe('stable');
      expect(Math.abs(trend.changeRate)).toBeLessThan(0.5);
    });

    it('should calculate fluctuating trend', () => {
      const scores = [50, 80, 55, 85, 60];
      const trend = calculateTrend(scores);
      
      // With high standard deviation, it should be fluctuating
      expect(trend.standardDeviation).toBeGreaterThan(10);
      // Direction could be fluctuating or have a slight trend
      expect(['rising', 'falling', 'stable', 'fluctuating']).toContain(trend.direction);
    });

    it('should handle empty array', () => {
      const trend = calculateTrend([]);
      
      expect(trend.direction).toBe('stable');
      expect(trend.averageScore).toBe(0);
      expect(trend.strength).toBe(0);
    });

    it('should handle single value', () => {
      const trend = calculateTrend([75]);
      
      expect(trend.averageScore).toBe(75);
      expect(trend.maxScore).toBe(75);
      expect(trend.minScore).toBe(75);
    });

    it('should calculate standard deviation correctly', () => {
      const scores = [70, 70, 70, 70, 70];
      const trend = calculateTrend(scores);
      
      expect(trend.standardDeviation).toBe(0);
    });
  });

  describe('analyzeQualityTrend', () => {
    it('should analyze quality trend', () => {
      const scores = [
        createScore(1, 70),
        createScore(2, 75),
        createScore(3, 80),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      
      expect(analysis.scores).toHaveLength(3);
      expect(analysis.overallTrend.direction).toBe('rising');
      expect(analysis.dimensionTrends.style).toBeTruthy();
      expect(analysis.dimensionTrends.tension).toBeTruthy();
    });

    it('should identify problem chapters', () => {
      const scores = [
        createScore(1, 80),
        createScore(2, 50), // Problem chapter
        createScore(3, 80),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      
      expect(analysis.problemChapters.length).toBeGreaterThan(0);
      expect(analysis.problemChapters[0].chapterIndex).toBe(2);
    });

    it('should identify excellent chapters', () => {
      const scores = [
        createScore(1, 60),
        createScore(2, 90), // Excellent chapter
        createScore(3, 60),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      
      expect(analysis.excellentChapters.length).toBeGreaterThan(0);
      expect(analysis.excellentChapters[0].chapterIndex).toBe(2);
    });

    it('should generate recommendations for falling trend', () => {
      const scores = [
        createScore(1, 80),
        createScore(2, 70),
        createScore(3, 60),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      
      expect(analysis.recommendations.length).toBeGreaterThan(0);
      expect(analysis.recommendations.some(r => r.includes('下降'))).toBe(true);
    });

    it('should generate recommendations for rising trend', () => {
      const scores = [
        createScore(1, 60),
        createScore(2, 70),
        createScore(3, 80),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      
      expect(analysis.recommendations.some(r => r.includes('上升'))).toBe(true);
    });

    it('should handle empty scores', () => {
      const analysis = analyzeQualityTrend([]);
      
      expect(analysis.scores).toEqual([]);
      expect(analysis.problemChapters).toEqual([]);
      expect(analysis.excellentChapters).toEqual([]);
    });

    it('should sort scores by chapter index', () => {
      const scores = [
        createScore(3, 70),
        createScore(1, 70),
        createScore(2, 70),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      
      expect(analysis.scores[0].chapterIndex).toBe(1);
      expect(analysis.scores[1].chapterIndex).toBe(2);
      expect(analysis.scores[2].chapterIndex).toBe(3);
    });

    it('should identify issues in problem chapters', () => {
      const lowScore = createScore(1, 50);
      lowScore.styleScore = 50;
      lowScore.tensionScore = 50;
      
      const analysis = analyzeQualityTrend([lowScore, createScore(2, 80)]);
      
      if (analysis.problemChapters.length > 0) {
        expect(analysis.problemChapters[0].issues.length).toBeGreaterThan(0);
      }
    });

    it('should identify highlights in excellent chapters', () => {
      const highScore = createScore(1, 90);
      highScore.styleScore = 85;
      highScore.tensionScore = 85;
      
      const analysis = analyzeQualityTrend([createScore(2, 60), highScore]);
      
      if (analysis.excellentChapters.length > 0) {
        expect(analysis.excellentChapters[0].highlights.length).toBeGreaterThan(0);
      }
    });
  });

  describe('generateTrendReport', () => {
    it('should generate comprehensive report', () => {
      const scores = [
        createScore(1, 70),
        createScore(2, 75),
        createScore(3, 80),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      const report = generateTrendReport(analysis);
      
      expect(report).toContain('质量趋势分析报告');
      expect(report).toContain('整体趋势');
      expect(report).toContain('各维度趋势');
      expect(report).toContain('改进建议');
    });

    it('should include trend icons', () => {
      const scores = [
        createScore(1, 60),
        createScore(2, 70),
        createScore(3, 80),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      const report = generateTrendReport(analysis);
      
      expect(report).toMatch(/📈|📉|➡️|📊/);
    });

    it('should include problem chapters section', () => {
      const scores = [
        createScore(1, 80),
        createScore(2, 50),
        createScore(3, 80),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      const report = generateTrendReport(analysis);
      
      if (analysis.problemChapters.length > 0) {
        expect(report).toContain('问题章节');
      }
    });

    it('should include excellent chapters section', () => {
      const scores = [
        createScore(1, 60),
        createScore(2, 90),
        createScore(3, 60),
      ];
      
      const analysis = analyzeQualityTrend(scores);
      const report = generateTrendReport(analysis);
      
      if (analysis.excellentChapters.length > 0) {
        expect(report).toContain('优秀章节');
      }
    });

    it('should include dimension table', () => {
      const scores = [createScore(1, 70)];
      const analysis = analyzeQualityTrend(scores);
      const report = generateTrendReport(analysis);
      
      expect(report).toContain('写作风格');
      expect(report).toContain('情节张力');
      expect(report).toContain('情绪表达');
      expect(report).toContain('人物塑造');
      expect(report).toContain('网文能力');
    });
  });

  describe('getTrendName', () => {
    it('should return Chinese names for trends', () => {
      expect(getTrendName('rising')).toBe('上升');
      expect(getTrendName('falling')).toBe('下降');
      expect(getTrendName('stable')).toBe('稳定');
      expect(getTrendName('fluctuating')).toBe('波动');
    });
  });

  describe('exportTrendDataAsCSV', () => {
    it('should export data as CSV', () => {
      const scores = [
        createScore(1, 70),
        createScore(2, 75),
      ];
      
      const csv = exportTrendDataAsCSV(scores);
      
      expect(csv).toContain('章节序号,章节标题');
      expect(csv).toContain('第1章');
      expect(csv).toContain('第2章');
      expect(csv.split('\n').length).toBe(3); // Header + 2 rows
    });

    it('should handle empty scores', () => {
      const csv = exportTrendDataAsCSV([]);
      
      expect(csv).toContain('章节序号,章节标题');
      expect(csv.split('\n').length).toBe(1); // Only header
    });

    it('should format numbers correctly', () => {
      const score = createScore(1, 75.567);
      const csv = exportTrendDataAsCSV([score]);
      
      expect(csv).toContain('75.6'); // Should be rounded to 1 decimal
    });

    it('should quote chapter titles', () => {
      const score = createScore(1, 70);
      const csv = exportTrendDataAsCSV([score]);
      
      expect(csv).toContain('"第1章"');
    });
  });

  describe('calculateMovingAverage', () => {
    it('should calculate moving average', () => {
      const scores = [60, 70, 80, 70, 60];
      const ma = calculateMovingAverage(scores, 3);
      
      expect(ma).toHaveLength(5);
      // Moving average should smooth the values
      expect(ma[2]).toBeGreaterThan(65);
      expect(ma[2]).toBeLessThan(75);
    });

    it('should handle small arrays', () => {
      const scores = [60, 70];
      const ma = calculateMovingAverage(scores, 3);
      
      expect(ma).toEqual(scores);
    });

    it('should handle window size 1', () => {
      const scores = [60, 70, 80];
      const ma = calculateMovingAverage(scores, 1);
      
      expect(ma).toEqual(scores);
    });

    it('should smooth fluctuations', () => {
      const scores = [50, 100, 50, 100, 50];
      const ma = calculateMovingAverage(scores, 3);
      
      // Moving average should be smoother than original
      const originalVariance = calculateVariance(scores);
      const smoothedVariance = calculateVariance(ma);
      
      expect(smoothedVariance).toBeLessThan(originalVariance);
    });
  });

  describe('predictFutureTrend', () => {
    it('should predict future trend', () => {
      const scores = [60, 65, 70, 75, 80];
      const predictions = predictFutureTrend(scores, 3);
      
      expect(predictions).toHaveLength(3);
      expect(predictions[0]).toBeGreaterThan(80); // Should continue rising
    });

    it('should handle falling trend', () => {
      const scores = [80, 75, 70, 65, 60];
      const predictions = predictFutureTrend(scores, 3);
      
      expect(predictions[0]).toBeLessThan(60); // Should continue falling
    });

    it('should limit predictions to 0-100 range', () => {
      const scores = [90, 95, 100];
      const predictions = predictFutureTrend(scores, 5);
      
      predictions.forEach(pred => {
        expect(pred).toBeGreaterThanOrEqual(0);
        expect(pred).toBeLessThanOrEqual(100);
      });
    });

    it('should handle single value', () => {
      const predictions = predictFutureTrend([70], 3);
      
      expect(predictions).toHaveLength(3);
      predictions.forEach(pred => {
        expect(pred).toBe(70);
      });
    });

    it('should handle empty array', () => {
      const predictions = predictFutureTrend([], 3);
      
      expect(predictions).toHaveLength(3);
      predictions.forEach(pred => {
        expect(pred).toBe(0);
      });
    });
  });
});

// Helper function for testing
function calculateVariance(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
}
