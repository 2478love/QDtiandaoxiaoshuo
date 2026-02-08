import { describe, it, expect } from 'vitest';
import {
  batchAnalyze,
  generateBatchReport,
  exportToCSV,
  compareBatchResults,
  type ChapterInput,
} from './batchAnalyzer';

describe('batchAnalyzer', () => {
  const sampleChapters: ChapterInput[] = [
    {
      id: 'ch1',
      title: '第一章',
      content: '他与敌人激烈对峙，心中充满愤怒。"你到底想要什么？"他怒吼道。',
    },
    {
      id: 'ch2',
      title: '第二章',
      content: '他走了过去。他坐了下来。',
    },
    {
      id: 'ch3',
      title: '第三章',
      content: '他与敌人激烈对峙，双方剑拔弩张，危机四伏。他感到非常愤怒，心中充满了仇恨。"你到底想要什么？"他怒吼道，声音震耳欲聋。然而对方却突然笑了，这让他感到震惊。原来这一切都是陷阱。',
    },
  ];

  describe('batchAnalyze', () => {
    it('应该分析所有章节', () => {
      const result = batchAnalyze(sampleChapters);
      
      expect(result.chapters.length).toBe(3);
      expect(result.chapters[0].id).toBe('ch1');
      expect(result.chapters[1].id).toBe('ch2');
      expect(result.chapters[2].id).toBe('ch3');
    });

    it('应该为每个章节生成分析结果', () => {
      const result = batchAnalyze(sampleChapters);
      
      result.chapters.forEach(chapter => {
        expect(chapter).toHaveProperty('analysis');
        expect(chapter.analysis).toHaveProperty('overallScore');
        expect(chapter.analysis.overallScore).toBeGreaterThanOrEqual(0);
        expect(chapter.analysis.overallScore).toBeLessThanOrEqual(100);
      });
    });

    it('应该正确排名章节', () => {
      const result = batchAnalyze(sampleChapters);
      
      // 排名应该从1开始
      const ranks = result.chapters.map(c => c.rank);
      expect(Math.min(...ranks)).toBe(1);
      expect(Math.max(...ranks)).toBe(3);
      
      // 排名应该唯一
      const uniqueRanks = new Set(ranks);
      expect(uniqueRanks.size).toBe(3);
    });

    it('应该标记需要改进的章节', () => {
      const result = batchAnalyze(sampleChapters);
      
      result.chapters.forEach(chapter => {
        if (chapter.analysis.overallScore < 70) {
          expect(chapter.needsImprovement).toBe(true);
        } else {
          expect(chapter.needsImprovement).toBe(false);
        }
      });
    });

    it('应该生成汇总信息', () => {
      const result = batchAnalyze(sampleChapters);
      
      expect(result.summary.totalChapters).toBe(3);
      expect(result.summary.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageScore).toBeLessThanOrEqual(100);
      expect(result.summary.excellentCount).toBeGreaterThanOrEqual(0);
      expect(result.summary.goodCount).toBeGreaterThanOrEqual(0);
      expect(result.summary.averageCount).toBeGreaterThanOrEqual(0);
      expect(result.summary.poorCount).toBeGreaterThanOrEqual(0);
    });

    it('应该统计常见问题', () => {
      const result = batchAnalyze(sampleChapters);
      
      expect(Array.isArray(result.summary.commonIssues)).toBe(true);
      result.summary.commonIssues.forEach(issue => {
        expect(issue).toHaveProperty('issue');
        expect(issue).toHaveProperty('count');
        expect(issue.count).toBeGreaterThan(0);
      });
    });

    it('应该统计常见优势', () => {
      const result = batchAnalyze(sampleChapters);
      
      expect(Array.isArray(result.summary.topStrengths)).toBe(true);
    });

    it('应该生成建议', () => {
      const result = batchAnalyze(sampleChapters);
      
      expect(result.recommendations).toHaveProperty('priorityChapters');
      expect(result.recommendations).toHaveProperty('quickWins');
      expect(result.recommendations).toHaveProperty('overallAdvice');
      
      expect(Array.isArray(result.recommendations.priorityChapters)).toBe(true);
      expect(Array.isArray(result.recommendations.quickWins)).toBe(true);
      expect(Array.isArray(result.recommendations.overallAdvice)).toBe(true);
    });

    it('应该识别优先优化章节', () => {
      const result = batchAnalyze(sampleChapters);
      
      // 优先章节应该是评分最低的
      const priorityChapters = result.recommendations.priorityChapters;
      expect(priorityChapters.length).toBeGreaterThan(0);
      expect(priorityChapters.length).toBeLessThanOrEqual(3);
      
      if (priorityChapters.length >= 2) {
        expect(priorityChapters[0].analysis.overallScore)
          .toBeLessThanOrEqual(priorityChapters[1].analysis.overallScore);
      }
    });
  });

  describe('generateBatchReport', () => {
    it('应该生成完整报告', () => {
      const result = batchAnalyze(sampleChapters);
      const report = generateBatchReport(result);
      
      expect(report).toContain('批量分析报告');
      expect(report).toContain('整体概况');
      expect(report).toContain('章节排名');
    });

    it('应该包含汇总信息', () => {
      const result = batchAnalyze(sampleChapters);
      const report = generateBatchReport(result);
      
      expect(report).toContain('总章节数');
      expect(report).toContain('平均评分');
      expect(report).toContain('优秀章节');
    });

    it('应该包含章节排名表格', () => {
      const result = batchAnalyze(sampleChapters);
      const report = generateBatchReport(result);
      
      expect(report).toContain('| 排名 | 章节 | 评分 | 状态 |');
      sampleChapters.forEach(chapter => {
        expect(report).toContain(chapter.title);
      });
    });

    it('应该包含常见问题', () => {
      const result = batchAnalyze(sampleChapters);
      const report = generateBatchReport(result);
      
      if (result.summary.commonIssues.length > 0) {
        expect(report).toContain('常见问题');
      }
    });

    it('应该包含优先优化章节', () => {
      const result = batchAnalyze(sampleChapters);
      const report = generateBatchReport(result);
      
      if (result.recommendations.priorityChapters.length > 0) {
        expect(report).toContain('优先优化章节');
      }
    });
  });

  describe('exportToCSV', () => {
    it('应该导出CSV格式', () => {
      const result = batchAnalyze(sampleChapters);
      const csv = exportToCSV(result);
      
      expect(csv).toContain('ID,标题,综合评分');
      expect(csv).toContain('风格评分,张力评分,情绪评分');
    });

    it('应该包含所有章节数据', () => {
      const result = batchAnalyze(sampleChapters);
      const csv = exportToCSV(result);
      
      sampleChapters.forEach(chapter => {
        expect(csv).toContain(chapter.id);
        expect(csv).toContain(chapter.title);
      });
    });

    it('应该包含评分数据', () => {
      const result = batchAnalyze(sampleChapters);
      const csv = exportToCSV(result);
      
      const lines = csv.split('\n');
      expect(lines.length).toBeGreaterThan(1); // 至少有标题行和数据行
      
      // 检查数据行格式
      const dataLines = lines.slice(1).filter(line => line.trim());
      expect(dataLines.length).toBe(3);
    });
  });

  describe('compareBatchResults', () => {
    it('应该对比两次分析结果', () => {
      const before = batchAnalyze(sampleChapters);
      
      // 模拟优化后的章节（评分提高）
      const improvedChapters = sampleChapters.map(ch => ({
        ...ch,
        content: ch.content + ' 他与敌人激烈对峙，心中充满愤怒。',
      }));
      const after = batchAnalyze(improvedChapters);
      
      const comparison = compareBatchResults(before, after);
      
      expect(comparison).toContain('批量分析对比报告');
      expect(comparison).toContain('整体对比');
      expect(comparison).toContain('章节对比');
    });

    it('应该显示评分变化', () => {
      const before = batchAnalyze(sampleChapters);
      const after = batchAnalyze(sampleChapters);
      
      const comparison = compareBatchResults(before, after);
      
      expect(comparison).toContain('平均评分');
      expect(comparison).toContain('优秀章节');
      expect(comparison).toContain('较差章节');
    });

    it('应该显示章节对比', () => {
      const before = batchAnalyze(sampleChapters);
      const after = batchAnalyze(sampleChapters);
      
      const comparison = compareBatchResults(before, after);
      
      sampleChapters.forEach(chapter => {
        expect(comparison).toContain(chapter.title);
      });
    });
  });

  describe('边界情况', () => {
    it('应该处理单个章节', () => {
      const singleChapter = [sampleChapters[0]];
      const result = batchAnalyze(singleChapter);
      
      expect(result.chapters.length).toBe(1);
      expect(result.summary.totalChapters).toBe(1);
    });

    it('应该处理空内容章节', () => {
      const emptyChapters: ChapterInput[] = [
        { id: 'empty', title: '空章节', content: '' },
      ];
      const result = batchAnalyze(emptyChapters);
      
      expect(result.chapters.length).toBe(1);
      expect(result.chapters[0].analysis.overallScore).toBeGreaterThanOrEqual(0);
    });

    it('应该处理大量章节', () => {
      const manyChapters = Array.from({ length: 50 }, (_, i) => ({
        id: `ch${i}`,
        title: `第${i + 1}章`,
        content: '他走了过去。',
      }));
      
      const result = batchAnalyze(manyChapters);
      
      expect(result.chapters.length).toBe(50);
      expect(result.summary.totalChapters).toBe(50);
    });
  });
});
