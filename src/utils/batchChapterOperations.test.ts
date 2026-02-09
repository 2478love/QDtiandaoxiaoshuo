/**
 * 批量章节操作测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import type { Chapter } from '../types';
import {
  BatchSelectionManager,
  batchDeleteChapters,
  batchMoveChapters,
  batchCopyChapters,
  batchExportChapters,
  batchAddTags,
  batchRemoveTags,
  batchSetVolume,
  batchSortChapters,
  batchFilterChapters,
  generateBatchOperationReport,
  BatchOperationHistory,
} from './batchChapterOperations';

describe('utils/batchChapterOperations', () => {
  const mockChapters: Chapter[] = [
    { id: '1', title: '第一章', content: '内容1', wordCount: 100 },
    { id: '2', title: '第二章', content: '内容2', wordCount: 200 },
    { id: '3', title: '第三章', content: '内容3', wordCount: 300 },
    { id: '4', title: '第四章', content: '内容4', wordCount: 400 },
    { id: '5', title: '第五章', content: '内容5', wordCount: 500 },
  ];

  describe('BatchSelectionManager', () => {
    let manager: BatchSelectionManager;

    beforeEach(() => {
      manager = new BatchSelectionManager();
    });

    it('should select and deselect chapters', () => {
      manager.select('1');
      expect(manager.isSelected('1')).toBe(true);

      manager.deselect('1');
      expect(manager.isSelected('1')).toBe(false);
    });

    it('should toggle selection', () => {
      manager.toggle('1');
      expect(manager.isSelected('1')).toBe(true);

      manager.toggle('1');
      expect(manager.isSelected('1')).toBe(false);
    });

    it('should select all', () => {
      manager.selectAll();

      expect(manager.isSelected('1')).toBe(true);
      expect(manager.isSelected('2')).toBe(true);
      expect(manager.getSelectedCount(5)).toBe(5);
    });

    it('should deselect all', () => {
      manager.select('1');
      manager.select('2');
      manager.deselectAll();

      expect(manager.isSelected('1')).toBe(false);
      expect(manager.isSelected('2')).toBe(false);
      expect(manager.getSelectedCount(5)).toBe(0);
    });

    it('should invert selection', () => {
      manager.select('1');
      manager.select('2');

      manager.invert(['1', '2', '3', '4', '5']);

      expect(manager.isSelected('1')).toBe(false);
      expect(manager.isSelected('2')).toBe(false);
      expect(manager.isSelected('3')).toBe(true);
      expect(manager.isSelected('4')).toBe(true);
      expect(manager.isSelected('5')).toBe(true);
    });

    it('should get selected IDs', () => {
      manager.select('1');
      manager.select('3');

      const selected = manager.getSelectedIds(['1', '2', '3', '4', '5']);
      expect(selected).toEqual(['1', '3']);
    });

    it('should handle select all with exclusions', () => {
      manager.selectAll();
      manager.deselect('2');
      manager.deselect('4');

      expect(manager.isSelected('1')).toBe(true);
      expect(manager.isSelected('2')).toBe(false);
      expect(manager.isSelected('3')).toBe(true);
      expect(manager.isSelected('4')).toBe(false);
      expect(manager.isSelected('5')).toBe(true);
      expect(manager.getSelectedCount(5)).toBe(3);
    });

    it('should clear selection', () => {
      manager.select('1');
      manager.select('2');
      manager.clear();

      expect(manager.getSelectedCount(5)).toBe(0);
    });
  });

  describe('batchDeleteChapters', () => {
    it('should delete selected chapters', () => {
      const result = batchDeleteChapters(mockChapters, ['1', '3']);

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(result.results).toHaveLength(3);
      expect(result.results?.find(c => c.id === '1')).toBeUndefined();
      expect(result.results?.find(c => c.id === '3')).toBeUndefined();
    });

    it('should handle empty selection', () => {
      const result = batchDeleteChapters(mockChapters, []);

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(0);
      expect(result.results).toHaveLength(5);
    });
  });

  describe('batchMoveChapters', () => {
    it('should move chapters to target position', () => {
      const result = batchMoveChapters(mockChapters, ['1', '2'], 3);

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(result.results?.[3].id).toBe('1');
      expect(result.results?.[4].id).toBe('2');
    });

    it('should move to beginning', () => {
      const result = batchMoveChapters(mockChapters, ['4', '5'], 0);

      expect(result.results?.[0].id).toBe('4');
      expect(result.results?.[1].id).toBe('5');
    });
  });

  describe('batchCopyChapters', () => {
    it('should copy selected chapters', () => {
      let idCounter = 6;
      const generateId = () => String(idCounter++);

      const result = batchCopyChapters(mockChapters, ['1', '2'], generateId);

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(result.results).toHaveLength(7);
      expect(result.results?.[5].title).toContain('副本');
      expect(result.results?.[6].title).toContain('副本');
    });

    it('should handle non-existent chapters', () => {
      const generateId = () => 'new-id';
      const result = batchCopyChapters(mockChapters, ['999'], generateId);

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('batchExportChapters', () => {
    it('should export as TXT', () => {
      const result = batchExportChapters(mockChapters, ['1', '2'], 'txt');

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(result.results?.[0]).toContain('第一章');
      expect(result.results?.[0]).toContain('第二章');
    });

    it('should export as Markdown', () => {
      const result = batchExportChapters(mockChapters, ['1'], 'markdown');

      expect(result.success).toBe(true);
      expect(result.results?.[0]).toContain('# 第一章');
      expect(result.results?.[0]).toContain('---');
    });
  });

  describe('batchAddTags', () => {
    it('should add tags to chapters', () => {
      const result = batchAddTags(mockChapters, ['1', '2'], ['重要', '待修改']);

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(result.results?.[0].tags).toContain('重要');
      expect(result.results?.[0].tags).toContain('待修改');
    });

    it('should not duplicate tags', () => {
      const chaptersWithTags = mockChapters.map(c => ({
        ...c,
        tags: c.id === '1' ? ['重要'] : [],
      }));

      const result = batchAddTags(chaptersWithTags, ['1'], ['重要', '新标签']);

      expect(result.results?.[0].tags).toHaveLength(2);
      expect(result.results?.[0].tags).toContain('重要');
      expect(result.results?.[0].tags).toContain('新标签');
    });
  });

  describe('batchRemoveTags', () => {
    it('should remove tags from chapters', () => {
      const chaptersWithTags = mockChapters.map(c => ({
        ...c,
        tags: ['重要', '待修改', '草稿'],
      }));

      const result = batchRemoveTags(chaptersWithTags, ['1', '2'], ['待修改', '草稿']);

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(2);
      expect(result.results?.[0].tags).toEqual(['重要']);
    });
  });

  describe('batchSetVolume', () => {
    it('should set volume for chapters', () => {
      const result = batchSetVolume(mockChapters, ['1', '2', '3'], 'volume-1');

      expect(result.success).toBe(true);
      expect(result.affectedCount).toBe(3);
      expect(result.results?.[0].volumeId).toBe('volume-1');
      expect(result.results?.[1].volumeId).toBe('volume-1');
      expect(result.results?.[2].volumeId).toBe('volume-1');
    });

    it('should clear volume', () => {
      const chaptersWithVolume = mockChapters.map(c => ({
        ...c,
        volumeId: 'volume-1',
      }));

      const result = batchSetVolume(chaptersWithVolume, ['1'], undefined);

      expect(result.results?.[0].volumeId).toBeUndefined();
    });
  });

  describe('batchSortChapters', () => {
    it('should sort by title ascending', () => {
      const unsorted = [
        { id: '1', title: 'C章', content: '', wordCount: 100 },
        { id: '2', title: 'A章', content: '', wordCount: 100 },
        { id: '3', title: 'B章', content: '', wordCount: 100 },
      ];

      const sorted = batchSortChapters(unsorted, 'title', 'asc');

      expect(sorted[0].title).toBe('A章');
      expect(sorted[1].title).toBe('B章');
      expect(sorted[2].title).toBe('C章');
    });

    it('should sort by wordCount descending', () => {
      const sorted = batchSortChapters(mockChapters, 'wordCount', 'desc');

      expect(sorted[0].wordCount).toBe(500);
      expect(sorted[4].wordCount).toBe(100);
    });
  });

  describe('batchFilterChapters', () => {
    it('should filter by word count', () => {
      const filtered = batchFilterChapters(mockChapters, {
        minWordCount: 200,
        maxWordCount: 400,
      });

      expect(filtered).toHaveLength(3);
      expect(filtered.every(c => c.wordCount >= 200 && c.wordCount <= 400)).toBe(true);
    });

    it('should filter by volume', () => {
      const chaptersWithVolume = mockChapters.map(c => ({
        ...c,
        volumeId: c.id === '1' || c.id === '2' ? 'vol-1' : 'vol-2',
      }));

      const filtered = batchFilterChapters(chaptersWithVolume, {
        volumeId: 'vol-1',
      });

      expect(filtered).toHaveLength(2);
    });

    it('should filter by tags', () => {
      const chaptersWithTags = mockChapters.map(c => ({
        ...c,
        tags: c.id === '1' ? ['重要', '完成'] : ['草稿'],
      }));

      const filtered = batchFilterChapters(chaptersWithTags, {
        tags: ['重要', '完成'],
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should filter by search text', () => {
      const filtered = batchFilterChapters(mockChapters, {
        searchText: '第一',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toContain('第一');
    });

    it('should combine multiple filters', () => {
      const chaptersWithTags = mockChapters.map(c => ({
        ...c,
        tags: c.wordCount >= 300 ? ['长章节'] : [],
      }));

      const filtered = batchFilterChapters(chaptersWithTags, {
        minWordCount: 200,
        tags: ['长章节'],
      });

      expect(filtered).toHaveLength(3);
    });
  });

  describe('generateBatchOperationReport', () => {
    it('should generate success report', () => {
      const result = {
        success: true,
        affectedCount: 3,
        errors: [],
      };

      const report = generateBatchOperationReport('批量删除', result);

      expect(report).toContain('批量删除');
      expect(report).toContain('✅ 成功');
      expect(report).toContain('3');
    });

    it('should generate error report', () => {
      const result = {
        success: false,
        affectedCount: 1,
        errors: ['错误1', '错误2'],
      };

      const report = generateBatchOperationReport('批量复制', result);

      expect(report).toContain('❌ 失败');
      expect(report).toContain('错误信息');
      expect(report).toContain('错误1');
      expect(report).toContain('错误2');
    });
  });

  describe('BatchOperationHistory', () => {
    let history: BatchOperationHistory;

    beforeEach(() => {
      history = new BatchOperationHistory(3);
    });

    it('should record operations', () => {
      history.record('删除', mockChapters, mockChapters.slice(1));

      const records = history.getHistory();
      expect(records).toHaveLength(1);
      expect(records[0].operation).toBe('删除');
    });

    it('should undo operation', () => {
      const before = [...mockChapters];
      const after = mockChapters.slice(1);

      history.record('删除', before, after);

      const undone = history.undo();
      expect(undone).toHaveLength(5);
    });

    it('should limit history size', () => {
      history.record('op1', mockChapters, mockChapters);
      history.record('op2', mockChapters, mockChapters);
      history.record('op3', mockChapters, mockChapters);
      history.record('op4', mockChapters, mockChapters);

      const records = history.getHistory();
      expect(records).toHaveLength(3);
      expect(records[0].operation).toBe('op2');
    });

    it('should clear history', () => {
      history.record('op1', mockChapters, mockChapters);
      history.clear();

      const records = history.getHistory();
      expect(records).toHaveLength(0);
    });

    it('should return null when undoing empty history', () => {
      const undone = history.undo();
      expect(undone).toBeNull();
    });
  });
});
