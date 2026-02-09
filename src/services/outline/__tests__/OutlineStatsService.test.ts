import { describe, it, expect } from 'vitest';
import { OutlineStatsService } from '../OutlineStatsService';
import { OutlineNode } from '../../../types/novel';

describe('OutlineStatsService', () => {
  const createMockNodes = (): OutlineNode[] => [
    {
      id: 'node_1',
      title: '第一卷',
      content: '开端',
      type: 'volume',
      order: 0,
      status: 'planned',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    },
    {
      id: 'node_2',
      title: '第一章',
      content: '主角登场',
      type: 'chapter',
      parentId: 'node_1',
      order: 1,
      status: 'completed',
      chapterId: 'chapter_1',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-05T00:00:00.000Z'
    } as any,
    {
      id: 'node_3',
      title: '第二章',
      content: '冒险开始',
      type: 'chapter',
      parentId: 'node_1',
      order: 2,
      status: 'writing',
      chapterId: 'chapter_2',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-10T00:00:00.000Z'
    } as any,
    {
      id: 'node_4',
      title: '第三章',
      content: '遇到困难',
      type: 'chapter',
      parentId: 'node_1',
      order: 3,
      status: 'planned',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z'
    }
  ];

  describe('calculate', () => {
    it('应该正确统计节点总数', () => {
      const nodes = createMockNodes();
      const stats = OutlineStatsService.calculate(nodes);

      expect(stats.totalNodes).toBe(4);
    });

    it('应该按类型统计节点', () => {
      const nodes = createMockNodes();
      const stats = OutlineStatsService.calculate(nodes);

      expect(stats.byType.volume).toBe(1);
      expect(stats.byType.chapter).toBe(3);
    });

    it('应该按状态统计节点', () => {
      const nodes = createMockNodes();
      const stats = OutlineStatsService.calculate(nodes);

      expect(stats.byStatus.planned).toBe(2);
      expect(stats.byStatus.writing).toBe(1);
      expect(stats.byStatus.completed).toBe(1);
    });

    it('应该统计章节状态', () => {
      const nodes = createMockNodes();
      const stats = OutlineStatsService.calculate(nodes);

      expect(stats.chaptersPlanned).toBe(1);
      expect(stats.chaptersWriting).toBe(1);
      expect(stats.chaptersCompleted).toBe(1);
    });

    it('应该统计关联状态', () => {
      const nodes = createMockNodes();
      const stats = OutlineStatsService.calculate(nodes);

      expect(stats.linkedChapters).toBe(2);
      expect(stats.unlinkedChapters).toBe(1);
    });

    it('应该统计字数', () => {
      const nodes = createMockNodes();
      nodes[1] = { ...nodes[1], targetWords: 3000, actualWords: 3000 } as any;
      nodes[2] = { ...nodes[2], targetWords: 3000, actualWords: 1500 } as any;
      nodes[3] = { ...nodes[3], targetWords: 3000, actualWords: 0 } as any;

      const stats = OutlineStatsService.calculate(nodes);

      expect(stats.targetWords).toBe(9000);
      expect(stats.actualWords).toBe(4500);
      expect(stats.completionRate).toBe(50);
    });
  });

  describe('calculateNodeStats', () => {
    it('应该计算单个节点的统计信息', () => {
      const nodes = createMockNodes();
      const volumeNode = nodes[0];

      const stats = OutlineStatsService.calculateNodeStats(volumeNode, nodes);

      expect(stats.node.id).toBe('node_1');
      expect(stats.childCount).toBe(3);
      expect(stats.descendantCount).toBe(3);
      expect(stats.depth).toBe(0);
    });

    it('应该计算子节点的深度', () => {
      const nodes = createMockNodes();
      const chapterNode = nodes[1];

      const stats = OutlineStatsService.calculateNodeStats(chapterNode, nodes);

      expect(stats.depth).toBe(1);
    });

    it('应该累计子节点的字数', () => {
      const nodes = createMockNodes();
      nodes[1] = { ...nodes[1], targetWords: 3000, actualWords: 3000 } as any;
      nodes[2] = { ...nodes[2], targetWords: 3000, actualWords: 1500 } as any;
      nodes[3] = { ...nodes[3], targetWords: 3000, actualWords: 0 } as any;

      const volumeNode = nodes[0];
      const stats = OutlineStatsService.calculateNodeStats(volumeNode, nodes);

      expect(stats.targetWords).toBe(9000);
      expect(stats.actualWords).toBe(4500);
      expect(stats.completionRate).toBe(50);
    });
  });

  describe('calculateVolumeStats', () => {
    it('应该计算卷的统计信息', () => {
      const nodes = createMockNodes();
      const volumeNode = nodes[0];

      const stats = OutlineStatsService.calculateVolumeStats(volumeNode, nodes);

      expect(stats.volume.id).toBe('node_1');
      expect(stats.chapterCount).toBe(3);
      expect(stats.statusBreakdown.planned).toBe(1);
      expect(stats.statusBreakdown.writing).toBe(1);
      expect(stats.statusBreakdown.completed).toBe(1);
    });

    it('非卷类型应该抛出错误', () => {
      const nodes = createMockNodes();
      const chapterNode = nodes[1];

      expect(() => {
        OutlineStatsService.calculateVolumeStats(chapterNode, nodes);
      }).toThrow('节点类型必须是 volume');
    });
  });

  describe('calculateAllVolumesStats', () => {
    it('应该计算所有卷的统计信息', () => {
      const nodes = createMockNodes();
      nodes.push({
        id: 'node_5',
        title: '第二卷',
        content: '新篇章',
        type: 'volume',
        order: 4,
        status: 'planned',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      });

      const allStats = OutlineStatsService.calculateAllVolumesStats(nodes);

      expect(allStats.length).toBe(2);
      expect(allStats[0].volume.title).toBe('第一卷');
      expect(allStats[1].volume.title).toBe('第二卷');
    });
  });

  describe('generateProgressReport', () => {
    it('应该生成进度报告', () => {
      const nodes = createMockNodes();
      nodes[1] = { ...nodes[1], targetWords: 3000, actualWords: 3000 } as any;
      nodes[2] = { ...nodes[2], targetWords: 3000, actualWords: 1500 } as any;

      const report = OutlineStatsService.generateProgressReport(nodes);

      expect(report.overall).toBeDefined();
      expect(report.volumes.length).toBe(1);
      expect(report.volumes[0].title).toBe('第一卷');
      expect(report.recentActivity.length).toBeGreaterThan(0);
    });

    it('最近活动应该按时间排序', () => {
      const nodes = createMockNodes();
      const report = OutlineStatsService.generateProgressReport(nodes);

      const dates = report.recentActivity.map(a => new Date(a.updatedAt).getTime());
      const sortedDates = [...dates].sort((a, b) => b - a);

      expect(dates).toEqual(sortedDates);
    });
  });

  describe('calculateWritingSpeed', () => {
    it('应该计算写作速度', () => {
      const nodes = createMockNodes();
      nodes[1] = { 
        ...nodes[1], 
        targetWords: 3000, 
        actualWords: 3000,
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as any;
      nodes[2] = { 
        ...nodes[2], 
        targetWords: 3000, 
        actualWords: 1500,
        updatedAt: '2024-01-11T00:00:00.000Z'
      } as any;

      const speed = OutlineStatsService.calculateWritingSpeed(nodes);

      expect(speed.wordsPerDay).toBeGreaterThan(0);
      expect(speed.chaptersPerWeek).toBeGreaterThan(0);
      expect(speed.estimatedCompletionDays).toBeGreaterThanOrEqual(0);
    });

    it('没有实际字数时应该返回0', () => {
      const nodes = createMockNodes();
      const speed = OutlineStatsService.calculateWritingSpeed(nodes);

      expect(speed.wordsPerDay).toBe(0);
      expect(speed.chaptersPerWeek).toBe(0);
      expect(speed.estimatedCompletionDays).toBe(0);
    });
  });

  describe('generateSummaryText', () => {
    it('应该生成统计摘要文本', () => {
      const nodes = createMockNodes();
      nodes[1] = { ...nodes[1], targetWords: 3000, actualWords: 3000 } as any;
      nodes[2] = { ...nodes[2], targetWords: 3000, actualWords: 1500 } as any;

      const summary = OutlineStatsService.generateSummaryText(nodes);

      expect(summary).toContain('📊 大纲统计摘要');
      expect(summary).toContain('总节点数：4');
      expect(summary).toContain('卷数：1');
      expect(summary).toContain('章节数：3');
      expect(summary).toContain('已关联章节：2');
      expect(summary).toContain('未关联章节：1');
    });
  });

  describe('exportStatsToCSV', () => {
    it('应该导出为CSV格式', () => {
      const nodes = createMockNodes();
      const csv = OutlineStatsService.exportStatsToCSV(nodes);

      expect(csv).toContain('节点ID,标题,类型,状态');
      expect(csv).toContain('node_1,"第一卷",volume,planned');
      expect(csv).toContain('node_2,"第一章",chapter,completed');
    });

    it('CSV应该包含所有节点', () => {
      const nodes = createMockNodes();
      const csv = OutlineStatsService.exportStatsToCSV(nodes);
      const lines = csv.split('\n');

      // 1行头部 + 4行数据
      expect(lines.length).toBe(5);
    });
  });

  describe('compareStats', () => {
    it('应该比较两个时间点的统计数据', () => {
      const oldNodes = createMockNodes();
      oldNodes[1] = { ...oldNodes[1], targetWords: 3000, actualWords: 1000 } as any;

      const newNodes = createMockNodes();
      newNodes[1] = { ...newNodes[1], targetWords: 3000, actualWords: 3000 } as any;

      const comparison = OutlineStatsService.compareStats(oldNodes, newNodes);

      expect(comparison.wordsDiff).toBe(2000);
      expect(comparison.completionDiff).toBeGreaterThan(0);
    });

    it('应该检测新增节点', () => {
      const oldNodes = createMockNodes();
      const newNodes = [...createMockNodes(), {
        id: 'node_5',
        title: '第四章',
        content: '新章节',
        type: 'chapter',
        parentId: 'node_1',
        order: 4,
        status: 'planned',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z'
      } as OutlineNode];

      const comparison = OutlineStatsService.compareStats(oldNodes, newNodes);

      expect(comparison.newNodesCount).toBe(1);
    });
  });
});
