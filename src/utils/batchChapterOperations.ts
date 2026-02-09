/**
 * 批量章节操作工具 - 提升批量处理效率
 * 
 * 核心能力：
 * 1. 批量选择章节
 * 2. 批量删除、移动、复制
 * 3. 批量导出
 * 4. 批量标签管理
 */

import type { Chapter } from '../types';

// ============ 类型定义 ============

export interface ChapterWithTags extends Chapter {
  tags?: string[];
}

export interface BatchOperation {
  type: 'delete' | 'move' | 'copy' | 'export' | 'tag';
  chapterIds: string[];
  params?: any;
}

export interface BatchOperationResult {
  success: boolean;
  affectedCount: number;
  errors: string[];
  results?: any[];
}

export interface ChapterTag {
  id: string;
  name: string;
  color: string;
}

export interface BatchSelectionState {
  selectedIds: Set<string>;
  selectAll: boolean;
  excludedIds: Set<string>;
}

// ============ 批量选择管理 ============

export class BatchSelectionManager {
  private state: BatchSelectionState;

  constructor() {
    this.state = {
      selectedIds: new Set(),
      selectAll: false,
      excludedIds: new Set(),
    };
  }

  /**
   * 选择章节
   */
  select(chapterId: string): void {
    if (this.state.selectAll) {
      this.state.excludedIds.delete(chapterId);
    } else {
      this.state.selectedIds.add(chapterId);
    }
  }

  /**
   * 取消选择章节
   */
  deselect(chapterId: string): void {
    if (this.state.selectAll) {
      this.state.excludedIds.add(chapterId);
    } else {
      this.state.selectedIds.delete(chapterId);
    }
  }

  /**
   * 切换选择状态
   */
  toggle(chapterId: string): void {
    if (this.isSelected(chapterId)) {
      this.deselect(chapterId);
    } else {
      this.select(chapterId);
    }
  }

  /**
   * 全选
   */
  selectAll(): void {
    this.state.selectAll = true;
    this.state.selectedIds.clear();
    this.state.excludedIds.clear();
  }

  /**
   * 取消全选
   */
  deselectAll(): void {
    this.state.selectAll = false;
    this.state.selectedIds.clear();
    this.state.excludedIds.clear();
  }

  /**
   * 反选
   */
  invert(allChapterIds: string[]): void {
    if (this.state.selectAll) {
      // 当前是全选状态，反选后变为只选择排除的
      const newSelected = new Set(this.state.excludedIds);
      this.state.selectAll = false;
      this.state.selectedIds = newSelected;
      this.state.excludedIds.clear();
    } else {
      // 当前是部分选择，反选
      const newSelected = new Set<string>();
      allChapterIds.forEach(id => {
        if (!this.state.selectedIds.has(id)) {
          newSelected.add(id);
        }
      });
      this.state.selectedIds = newSelected;
    }
  }

  /**
   * 检查是否选中
   */
  isSelected(chapterId: string): boolean {
    if (this.state.selectAll) {
      return !this.state.excludedIds.has(chapterId);
    } else {
      return this.state.selectedIds.has(chapterId);
    }
  }

  /**
   * 获取选中的章节ID列表
   */
  getSelectedIds(allChapterIds: string[]): string[] {
    if (this.state.selectAll) {
      return allChapterIds.filter(id => !this.state.excludedIds.has(id));
    } else {
      return Array.from(this.state.selectedIds);
    }
  }

  /**
   * 获取选中数量
   */
  getSelectedCount(totalCount: number): number {
    if (this.state.selectAll) {
      return totalCount - this.state.excludedIds.size;
    } else {
      return this.state.selectedIds.size;
    }
  }

  /**
   * 清空选择
   */
  clear(): void {
    this.deselectAll();
  }

  /**
   * 获取状态
   */
  getState(): BatchSelectionState {
    return {
      selectedIds: new Set(this.state.selectedIds),
      selectAll: this.state.selectAll,
      excludedIds: new Set(this.state.excludedIds),
    };
  }
}

// ============ 批量操作 ============

/**
 * 批量删除章节
 */
export function batchDeleteChapters(
  chapters: Chapter[],
  chapterIds: string[]
): BatchOperationResult {
  const errors: string[] = [];
  let affectedCount = 0;

  const remainingChapters = chapters.filter(chapter => {
    if (chapterIds.includes(chapter.id)) {
      affectedCount++;
      return false;
    }
    return true;
  });

  return {
    success: errors.length === 0,
    affectedCount,
    errors,
    results: remainingChapters,
  };
}

/**
 * 批量移动章节
 */
export function batchMoveChapters(
  chapters: Chapter[],
  chapterIds: string[],
  targetIndex: number
): BatchOperationResult {
  const errors: string[] = [];

  // 提取要移动的章节
  const toMove = chapters.filter(c => chapterIds.includes(c.id));
  const remaining = chapters.filter(c => !chapterIds.includes(c.id));

  // 插入到目标位置
  const result = [
    ...remaining.slice(0, targetIndex),
    ...toMove,
    ...remaining.slice(targetIndex),
  ];

  return {
    success: true,
    affectedCount: toMove.length,
    errors,
    results: result,
  };
}

/**
 * 批量复制章节
 */
export function batchCopyChapters(
  chapters: Chapter[],
  chapterIds: string[],
  generateId: () => string
): BatchOperationResult {
  const errors: string[] = [];
  const copied: Chapter[] = [];

  chapterIds.forEach(id => {
    const chapter = chapters.find(c => c.id === id);
    if (chapter) {
      const copy: Chapter = {
        ...chapter,
        id: generateId(),
        title: `${chapter.title} (副本)`,
      };
      copied.push(copy);
    } else {
      errors.push(`章节 ${id} 不存在`);
    }
  });

  return {
    success: errors.length === 0,
    affectedCount: copied.length,
    errors,
    results: [...chapters, ...copied],
  };
}

/**
 * 批量导出章节
 */
export function batchExportChapters(
  chapters: Chapter[],
  chapterIds: string[],
  format: 'txt' | 'markdown' = 'txt'
): BatchOperationResult {
  const errors: string[] = [];
  const exported: string[] = [];

  chapterIds.forEach(id => {
    const chapter = chapters.find(c => c.id === id);
    if (chapter) {
      if (format === 'markdown') {
        exported.push(`# ${chapter.title}\n\n${chapter.content}\n\n---\n`);
      } else {
        exported.push(`${chapter.title}\n\n${chapter.content}\n\n`);
      }
    } else {
      errors.push(`章节 ${id} 不存在`);
    }
  });

  const content = exported.join('\n');

  return {
    success: errors.length === 0,
    affectedCount: exported.length,
    errors,
    results: [content],
  };
}

/**
 * 批量添加标签
 */
export function batchAddTags(
  chapters: ChapterWithTags[],
  chapterIds: string[],
  tags: string[]
): BatchOperationResult {
  const errors: string[] = [];
  let affectedCount = 0;

  const updated = chapters.map(chapter => {
    if (chapterIds.includes(chapter.id)) {
      affectedCount++;
      return {
        ...chapter,
        tags: [...new Set([...(chapter.tags || []), ...tags])],
      };
    }
    return chapter;
  });

  return {
    success: true,
    affectedCount,
    errors,
    results: updated,
  };
}

/**
 * 批量移除标签
 */
export function batchRemoveTags(
  chapters: ChapterWithTags[],
  chapterIds: string[],
  tags: string[]
): BatchOperationResult {
  const errors: string[] = [];
  let affectedCount = 0;

  const updated = chapters.map(chapter => {
    if (chapterIds.includes(chapter.id)) {
      affectedCount++;
      return {
        ...chapter,
        tags: (chapter.tags || []).filter(t => !tags.includes(t)),
      };
    }
    return chapter;
  });

  return {
    success: true,
    affectedCount,
    errors,
    results: updated,
  };
}

/**
 * 批量设置卷
 */
export function batchSetVolume(
  chapters: Chapter[],
  chapterIds: string[],
  volumeId: string | undefined
): BatchOperationResult {
  const errors: string[] = [];
  let affectedCount = 0;

  const updated = chapters.map(chapter => {
    if (chapterIds.includes(chapter.id)) {
      affectedCount++;
      return {
        ...chapter,
        volumeId,
      };
    }
    return chapter;
  });

  return {
    success: true,
    affectedCount,
    errors,
    results: updated,
  };
}

/**
 * 批量排序章节
 */
export function batchSortChapters(
  chapters: Chapter[],
  sortBy: 'title' | 'wordCount' | 'createdAt' = 'title',
  order: 'asc' | 'desc' = 'asc'
): Chapter[] {
  const sorted = [...chapters].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'wordCount':
        comparison = a.wordCount - b.wordCount;
        break;
      case 'createdAt':
        // 假设有 createdAt 字段
        comparison = 0;
        break;
    }

    return order === 'asc' ? comparison : -comparison;
  });

  return sorted;
}

/**
 * 批量筛选章节
 */
export function batchFilterChapters(
  chapters: ChapterWithTags[],
  filters: {
    minWordCount?: number;
    maxWordCount?: number;
    volumeId?: string;
    tags?: string[];
    searchText?: string;
  }
): ChapterWithTags[] {
  return chapters.filter(chapter => {
    // 字数筛选
    if (filters.minWordCount !== undefined && chapter.wordCount < filters.minWordCount) {
      return false;
    }
    if (filters.maxWordCount !== undefined && chapter.wordCount > filters.maxWordCount) {
      return false;
    }

    // 卷筛选
    if (filters.volumeId !== undefined && chapter.volumeId !== filters.volumeId) {
      return false;
    }

    // 标签筛选
    if (filters.tags && filters.tags.length > 0) {
      const chapterTags = chapter.tags || [];
      const hasAllTags = filters.tags.every(tag => chapterTags.includes(tag));
      if (!hasAllTags) return false;
    }

    // 文本搜索
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const titleMatch = chapter.title.toLowerCase().includes(searchLower);
      const contentMatch = chapter.content.toLowerCase().includes(searchLower);
      if (!titleMatch && !contentMatch) return false;
    }

    return true;
  });
}

/**
 * 生成批量操作报告
 */
export function generateBatchOperationReport(
  operation: string,
  result: BatchOperationResult
): string {
  const lines: string[] = [];

  lines.push(`# 批量操作报告`);
  lines.push(`\n**操作类型：** ${operation}`);
  lines.push(`**状态：** ${result.success ? '✅ 成功' : '❌ 失败'}`);
  lines.push(`**影响章节数：** ${result.affectedCount}`);

  if (result.errors.length > 0) {
    lines.push(`\n## 错误信息`);
    result.errors.forEach((error, idx) => {
      lines.push(`${idx + 1}. ${error}`);
    });
  }

  return lines.join('\n');
}

/**
 * 批量操作撤销栈
 */
export class BatchOperationHistory {
  private history: Array<{
    operation: string;
    before: Chapter[];
    after: Chapter[];
    timestamp: number;
  }>;
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.history = [];
    this.maxSize = maxSize;
  }

  /**
   * 记录操作
   */
  record(operation: string, before: Chapter[], after: Chapter[]): void {
    this.history.push({
      operation,
      before: JSON.parse(JSON.stringify(before)),
      after: JSON.parse(JSON.stringify(after)),
      timestamp: Date.now(),
    });

    // 限制历史记录大小
    if (this.history.length > this.maxSize) {
      this.history.shift();
    }
  }

  /**
   * 撤销
   */
  undo(): Chapter[] | null {
    const last = this.history.pop();
    return last ? last.before : null;
  }

  /**
   * 清空历史
   */
  clear(): void {
    this.history = [];
  }

  /**
   * 获取历史记录
   */
  getHistory(): Array<{ operation: string; timestamp: number }> {
    return this.history.map(h => ({
      operation: h.operation,
      timestamp: h.timestamp,
    }));
  }
}
