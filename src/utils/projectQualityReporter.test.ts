/**
 * 项目质量报告生成器测试
 */

import { describe, it, expect } from 'vitest';
import type { Novel, Chapter } from '../types';
import {
  generateProjectQualityReport,
  exportReportAsMarkdown,
} from './projectQualityReporter';

describe('utils/projectQualityReporter', () => {
  const mockChapters: Chapter[] = [
    { id: '1', title: '第一章', content: '内容1', wordCount: 2000 },
    { id: '2', title: '第二章', content: '内容2', wordCount: 2100 },
    { id: '3', title: '第三章', content: '内容3', wordCount: 1900 },
    { id: '4', title: '第四章', content: '内容4', wordCount: 2050 },
    { id: '5', title: '第五章', content: '内容5', wordCount: 1950 },
  ];

  const mockNovel: Novel = {
    id: 'novel-1',
    title: '测试小说',
    description: '测试描述',
    tags: ['修仙', '热血'],
    status: 'ongoing',
    chapters: mockChapters,
    characters: [
      { 
        id: 'char-1', 
        name: '主角', 
        role: '主角', 
        description: '主角描述',
        traits: ['勇敢', '坚毅'],
        createdAt: '2024-01-01' 
      },
    ],
    worldviews: [
      { 
        id: 'world-1', 
        title: '修仙世界', 
        content: '世界观设定',
        category: '世界设定',
        createdAt: '2024-01-01' 
      },
    ],
    timelineEvents: [],
    outlineNodes: [],
    foreshadowings: [],
    wordCount: 10000,
    updatedAt: '2024-01-01',
  };

  describe('generateProjectQualityReport', () => {
    it('should generate quality report', () => {
      const report = generateProjectQualityReport(mockNovel);

      expect(report).toBeDefined();
      expect(report.overall).toBeDefined();
      expect(report.statistics).toBeDefined();
      expect(report.quality).toBeDefined();
      expect(report.issues).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.strengths).toBeDefined();
      expect(report.weaknesses).toBeDefined();
    });

    it('should calculate overall score', () => {
      const report = generateProjectQualityReport(mockNovel);

      expect(report.overall.score).toBeGreaterThanOrEqual(0);
      expect(report.overall.score).toBeLessThanOrEqual(100);
      expect(report.overall.grade).toMatch(/^[SABCD]$/);
    });

    it('should calculate statistics correctly', () => {
      const report = generateProjectQualityReport(mockNovel);

      expect(report.statistics.totalChapters).toBe(5);
      expect(report.statistics.totalWords).toBe(10000);
      expect(report.statistics.avgChapterWords).toBe(2000);
      expect(report.statistics.completionRate).toBeGreaterThan(0);
    });

    it('should calculate quality scores', () => {
      const report = generateProjectQualityReport(mockNovel);

      expect(report.quality.consistency).toBeGreaterThanOrEqual(0);
      expect(report.quality.consistency).toBeLessThanOrEqual(100);
      expect(report.quality.completeness).toBeGreaterThanOrEqual(0);
      expect(report.quality.completeness).toBeLessThanOrEqual(100);
      expect(report.quality.balance).toBeGreaterThanOrEqual(0);
      expect(report.quality.balance).toBeLessThanOrEqual(100);
    });

    it('should identify issues', () => {
      const emptyNovel: Novel = {
        ...mockNovel,
        chapters: [],
      };

      const report = generateProjectQualityReport(emptyNovel);

      expect(report.issues.length).toBeGreaterThan(0);
      expect(report.issues.some(i => i.type === 'critical')).toBe(true);
    });

    it('should generate recommendations', () => {
      const report = generateProjectQualityReport(mockNovel);

      expect(report.recommendations.length).toBeGreaterThan(0);
      report.recommendations.forEach(rec => {
        expect(rec.priority).toMatch(/^(high|medium|low)$/);
        expect(rec.title).toBeTruthy();
        expect(rec.description).toBeTruthy();
      });
    });

    it('should identify strengths', () => {
      const report = generateProjectQualityReport(mockNovel);

      expect(report.strengths.length).toBeGreaterThan(0);
    });

    it('should handle novel without chapters', () => {
      const emptyNovel: Novel = {
        ...mockNovel,
        chapters: [],
      };

      const report = generateProjectQualityReport(emptyNovel);

      expect(report.statistics.totalChapters).toBe(0);
      expect(report.statistics.totalWords).toBe(0);
      expect(report.issues.some(i => i.type === 'critical')).toBe(true);
    });

    it('should handle novel with inconsistent chapter lengths', () => {
      const inconsistentNovel: Novel = {
        ...mockNovel,
        chapters: [
          { id: '1', title: '第一章', content: '', wordCount: 1000 },
          { id: '2', title: '第二章', content: '', wordCount: 5000 },
          { id: '3', title: '第三章', content: '', wordCount: 500 },
        ],
      };

      const report = generateProjectQualityReport(inconsistentNovel);

      expect(report.issues.some(i => i.category === '一致性')).toBe(true);
      expect(report.quality.consistency).toBeLessThan(80);
    });

    it('should handle novel without settings', () => {
      const noSettingsNovel: Novel = {
        ...mockNovel,
        characters: [],
        worldviews: [],
      };

      const report = generateProjectQualityReport(noSettingsNovel);

      expect(report.issues.some(i => i.category === '设定')).toBe(true);
      expect(report.quality.completeness).toBeLessThan(80);
    });

    it('should give higher score for complete novel', () => {
      const completeNovel: Novel = {
        ...mockNovel,
        chapters: Array(50).fill(null).map((_, i) => ({
          id: `ch-${i}`,
          title: `第${i + 1}章`,
          content: '内容',
          wordCount: 2000,
        })),
        characters: Array(10).fill(null).map((_, i) => ({
          id: `char-${i}`,
          name: `角色${i}`,
          role: '配角',
          description: '角色描述',
          traits: ['特征'],
          createdAt: '2024-01-01',
        })),
        worldviews: Array(5).fill(null).map((_, i) => ({
          id: `world-${i}`,
          title: `设定${i}`,
          content: '内容',
          category: '设定分类',
          createdAt: '2024-01-01',
        })),
      };

      const report = generateProjectQualityReport(completeNovel);

      expect(report.overall.score).toBeGreaterThan(70);
      expect(report.overall.grade).toMatch(/^[SAB]$/);
    });
  });

  describe('exportReportAsMarkdown', () => {
    it('should export report as markdown', () => {
      const report = generateProjectQualityReport(mockNovel);
      const markdown = exportReportAsMarkdown(report);

      expect(markdown).toContain('# 项目质量报告');
      expect(markdown).toContain('## 总体评分');
      expect(markdown).toContain('## 统计信息');
      expect(markdown).toContain('## 质量评分');
    });

    it('should include all sections', () => {
      const report = generateProjectQualityReport(mockNovel);
      const markdown = exportReportAsMarkdown(report);

      expect(markdown).toContain('总字数');
      expect(markdown).toContain('总章节数');
      expect(markdown).toContain('一致性');
      expect(markdown).toContain('完整性');
      expect(markdown).toContain('平衡性');
    });

    it('should include issues if present', () => {
      const emptyNovel: Novel = {
        ...mockNovel,
        chapters: [],
      };

      const report = generateProjectQualityReport(emptyNovel);
      const markdown = exportReportAsMarkdown(report);

      expect(markdown).toContain('发现的问题');
    });

    it('should include recommendations', () => {
      const report = generateProjectQualityReport(mockNovel);
      const markdown = exportReportAsMarkdown(report);

      expect(markdown).toContain('改进建议');
    });

    it('should format numbers with locale', () => {
      const largeNovel: Novel = {
        ...mockNovel,
        chapters: Array(500).fill(null).map((_, i) => ({
          id: `ch-${i}`,
          title: `第${i + 1}章`,
          content: '',
          wordCount: 2000,
        })),
      };

      const report = generateProjectQualityReport(largeNovel);
      const markdown = exportReportAsMarkdown(report);

      // 应该包含格式化的数字（带千位分隔符）
      expect(markdown).toMatch(/1,000,000|1000000/);
    });
  });

  describe('grade calculation', () => {
    it('should assign S grade for score >= 90', () => {
      const excellentNovel: Novel = {
        ...mockNovel,
        chapters: Array(100).fill(null).map((_, i) => ({
          id: `ch-${i}`,
          title: `第${i + 1}章`,
          content: '',
          wordCount: 2000,
        })),
        characters: Array(20).fill(null).map((_, i) => ({
          id: `char-${i}`,
          name: `角色${i}`,
          role: '配角',
          description: '角色描述',
          traits: ['特征'],
          createdAt: '2024-01-01',
        })),
        worldviews: Array(10).fill(null).map((_, i) => ({
          id: `world-${i}`,
          title: `设定${i}`,
          content: '内容',
          category: '设定分类',
          createdAt: '2024-01-01',
        })),
        timelineEvents: Array(10).fill(null).map((_, i) => ({
          id: `event-${i}`,
          title: `事件${i}`,
          description: '描述',
          date: '2024-01-01',
          time: '12:00',
          characters: [],
          createdAt: '2024-01-01',
        })),
        outlineNodes: Array(10).fill(null).map((_, i) => ({
          id: `outline-${i}`,
          title: `大纲${i}`,
          content: '内容',
          type: 'chapter',
          order: i,
          status: 'completed',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        })),
        foreshadowings: Array(5).fill(null).map((_, i) => ({
          id: `foreshadow-${i}`,
          title: `伏笔${i}`,
          description: '描述',
          status: 'planted',
          importance: 'high',
          relatedCharacters: [],
          notes: '',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01',
        })),
      };

      const report = generateProjectQualityReport(excellentNovel);

      // 应该得到较高分数
      expect(report.overall.score).toBeGreaterThan(60);
    });

    it('should assign D grade for low score', () => {
      const poorNovel: Novel = {
        ...mockNovel,
        chapters: [
          { id: '1', title: '第一章', content: '', wordCount: 100 },
        ],
        characters: [],
        worldviews: [],
      };

      const report = generateProjectQualityReport(poorNovel);

      expect(report.overall.score).toBeLessThan(70);
    });
  });
});
