/**
 * 批量初稿生成器测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDraftTask,
  createBatchDraftPipeline,
  updateTaskStatus,
  updatePipelineProgress,
  getNextTask,
  pausePipeline,
  resumePipeline,
  stopPipeline,
  retryFailedTasks,
  generateDraftPrompt,
  generateBatchDraftReport,
  exportDraftResults,
  DEFAULT_DRAFT_OPTIONS,
  type DraftTask,
  type BatchDraftPipeline,
} from './batchDraftGenerator';
import type { OutlineNode } from '../types';

describe('utils/batchDraftGenerator', () => {
  const mockOutlineNodes: OutlineNode[] = [
    {
      id: 'outline-1',
      title: '第一章 初入江湖',
      content: '主角离开家乡，踏上修仙之路',
      type: 'chapter',
      order: 0,
      status: 'planned',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'outline-2',
      title: '第二章 奇遇',
      content: '主角在山中遇到神秘老者，获得传承',
      type: 'chapter',
      order: 1,
      status: 'planned',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: 'outline-3',
      title: '第三章 修炼',
      content: '主角开始修炼，突破第一个境界',
      type: 'chapter',
      order: 2,
      status: 'planned',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  describe('createDraftTask', () => {
    it('should create a draft task with default options', () => {
      const task = createDraftTask(mockOutlineNodes[0]);

      expect(task.id).toMatch(/^draft-/);
      expect(task.outlineNodeId).toBe('outline-1');
      expect(task.title).toBe('第一章 初入江湖');
      expect(task.description).toBe('主角离开家乡，踏上修仙之路');
      expect(task.targetWords).toBe(DEFAULT_DRAFT_OPTIONS.targetWords);
      expect(task.status).toBe('pending');
      expect(task.progress).toBe(0);
      expect(task.generatedContent).toBe('');
      expect(task.retryCount).toBe(0);
    });

    it('should create a draft task with custom options', () => {
      const task = createDraftTask(mockOutlineNodes[0], {
        targetWords: 3000,
        style: '古典文学',
      });

      expect(task.targetWords).toBe(3000);
    });

    it('should handle outline node without description', () => {
      const nodeWithoutDesc: OutlineNode = {
        ...mockOutlineNodes[0],
        content: '',
      };
      const task = createDraftTask(nodeWithoutDesc);

      expect(task.description).toBe('');
    });
  });

  describe('createBatchDraftPipeline', () => {
    it('should create a pipeline with multiple tasks', () => {
      const pipeline = createBatchDraftPipeline('测试流水线', mockOutlineNodes);

      expect(pipeline.id).toMatch(/^pipeline-/);
      expect(pipeline.name).toBe('测试流水线');
      expect(pipeline.tasks).toHaveLength(3);
      expect(pipeline.status).toBe('idle');
      expect(pipeline.currentTaskIndex).toBe(0);
      expect(pipeline.totalTasks).toBe(3);
      expect(pipeline.completedTasks).toBe(0);
      expect(pipeline.failedTasks).toBe(0);
      expect(pipeline.progress).toBe(0);
    });

    it('should create tasks with custom options', () => {
      const pipeline = createBatchDraftPipeline('测试流水线', mockOutlineNodes, {
        targetWords: 2500,
        style: '硬科幻',
      });

      expect(pipeline.options.targetWords).toBe(2500);
      expect(pipeline.options.style).toBe('硬科幻');
      expect(pipeline.tasks[0].targetWords).toBe(2500);
    });

    it('should handle empty outline nodes', () => {
      const pipeline = createBatchDraftPipeline('空流水线', []);

      expect(pipeline.tasks).toHaveLength(0);
      expect(pipeline.totalTasks).toBe(0);
    });
  });

  describe('updateTaskStatus', () => {
    let task: DraftTask;

    beforeEach(() => {
      task = createDraftTask(mockOutlineNodes[0]);
    });

    it('should update task to generating status', () => {
      const updated = updateTaskStatus(task, 'generating');

      expect(updated.status).toBe('generating');
      expect(updated.startedAt).toBeDefined();
    });

    it('should update task to completed status', () => {
      const updated = updateTaskStatus(task, 'completed', {
        generatedContent: '这是生成的内容',
      });

      expect(updated.status).toBe('completed');
      expect(updated.progress).toBe(100);
      expect(updated.completedAt).toBeDefined();
      expect(updated.generatedContent).toBe('这是生成的内容');
    });

    it('should update task to failed status', () => {
      const updated = updateTaskStatus(task, 'failed', {
        error: '生成失败',
      });

      expect(updated.status).toBe('failed');
      expect(updated.completedAt).toBeDefined();
      expect(updated.error).toBe('生成失败');
    });

    it('should not overwrite startedAt if already set', () => {
      const startedTask = updateTaskStatus(task, 'generating');
      const originalStartedAt = startedTask.startedAt;
      
      const updated = updateTaskStatus(startedTask, 'generating', {
        progress: 50,
      });

      expect(updated.startedAt).toBe(originalStartedAt);
    });
  });

  describe('updatePipelineProgress', () => {
    it('should calculate progress correctly', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'generating');

      const updated = updatePipelineProgress(pipeline);

      expect(updated.completedTasks).toBe(1);
      expect(updated.failedTasks).toBe(0);
      expect(updated.progress).toBe(33); // 1/3 = 33%
    });

    it('should count failed tasks', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'failed');

      const updated = updatePipelineProgress(pipeline);

      expect(updated.completedTasks).toBe(1);
      expect(updated.failedTasks).toBe(1);
    });

    it('should estimate remaining time', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.startedAt = new Date(Date.now() - 60000).toISOString(); // 1分钟前
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');

      const updated = updatePipelineProgress(pipeline);

      expect(updated.estimatedTimeRemaining).toBeGreaterThan(0);
    });

    it('should handle empty pipeline', () => {
      const pipeline = createBatchDraftPipeline('空', []);

      const updated = updatePipelineProgress(pipeline);

      expect(updated.progress).toBe(0);
      expect(updated.completedTasks).toBe(0);
    });
  });

  describe('getNextTask', () => {
    it('should return first pending task', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');

      const nextTask = getNextTask(pipeline);

      expect(nextTask).toBeDefined();
      expect(nextTask?.id).toBe(pipeline.tasks[1].id);
      expect(nextTask?.status).toBe('pending');
    });

    it('should return null if no pending tasks', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks.forEach((task, idx) => {
        pipeline.tasks[idx] = updateTaskStatus(task, 'completed');
      });

      const nextTask = getNextTask(pipeline);

      expect(nextTask).toBeNull();
    });
  });

  describe('pausePipeline', () => {
    it('should pause the pipeline', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.status = 'running';

      const paused = pausePipeline(pipeline);

      expect(paused.status).toBe('paused');
    });
  });

  describe('resumePipeline', () => {
    it('should resume the pipeline', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.status = 'paused';

      const resumed = resumePipeline(pipeline);

      expect(resumed.status).toBe('running');
    });
  });

  describe('stopPipeline', () => {
    it('should stop the pipeline', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.status = 'running';

      const stopped = stopPipeline(pipeline);

      expect(stopped.status).toBe('stopped');
      expect(stopped.completedAt).toBeDefined();
    });
  });

  describe('retryFailedTasks', () => {
    it('should reset failed tasks to pending', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'failed', {
        error: '生成失败',
      });
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'completed');

      const retried = retryFailedTasks(pipeline);

      expect(retried.tasks[0].status).toBe('pending');
      expect(retried.tasks[0].error).toBeUndefined();
      expect(retried.tasks[0].retryCount).toBe(1);
      expect(retried.tasks[1].status).toBe('completed');
      expect(retried.status).toBe('idle');
    });

    it('should not retry tasks exceeding max retries', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes, {
        maxRetries: 2,
      });
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'failed');
      pipeline.tasks[0].retryCount = 2;

      const retried = retryFailedTasks(pipeline);

      expect(retried.tasks[0].status).toBe('failed');
      expect(retried.tasks[0].retryCount).toBe(2);
    });
  });

  describe('generateDraftPrompt', () => {
    let task: DraftTask;

    beforeEach(() => {
      task = createDraftTask(mockOutlineNodes[0]);
    });

    it('should generate basic prompt', () => {
      const prompt = generateDraftPrompt(task, DEFAULT_DRAFT_OPTIONS);

      expect(prompt).toContain('第一章 初入江湖');
      expect(prompt).toContain('主角离开家乡，踏上修仙之路');
      expect(prompt).toContain('2000 字');
      expect(prompt).toContain('网文轻小说');
    });

    it('should include context information', () => {
      const prompt = generateDraftPrompt(task, DEFAULT_DRAFT_OPTIONS, {
        previousChapters: ['前文概要1', '前文概要2'],
        characters: ['主角：张三', '配角：李四'],
        worldSettings: ['修仙世界', '境界体系'],
      });

      expect(prompt).toContain('前文回顾');
      expect(prompt).toContain('前文概要1');
      expect(prompt).toContain('相关人物');
      expect(prompt).toContain('张三');
      expect(prompt).toContain('世界设定');
      expect(prompt).toContain('修仙世界');
    });

    it('should respect custom options', () => {
      const customOptions = {
        ...DEFAULT_DRAFT_OPTIONS,
        targetWords: 3000,
        style: '古典文学',
        tone: '严肃',
        pov: 'first' as const,
        detailLevel: 'detailed' as const,
      };

      const prompt = generateDraftPrompt(task, customOptions);

      expect(prompt).toContain('3000 字');
      expect(prompt).toContain('古典文学');
      expect(prompt).toContain('严肃');
      expect(prompt).toContain('第一人称');
      expect(prompt).toContain('详细丰富');
    });
  });

  describe('generateBatchDraftReport', () => {
    it('should generate comprehensive report', () => {
      const pipeline = createBatchDraftPipeline('测试流水线', mockOutlineNodes);
      pipeline.startedAt = new Date().toISOString();
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed', {
        generatedContent: '这是第一章的内容',
      });
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'failed', {
        error: '生成失败',
      });

      const report = generateBatchDraftReport(updatePipelineProgress(pipeline));

      expect(report).toContain('批量初稿生成报告');
      expect(report).toContain('测试流水线');
      expect(report).toContain('总任务数：3');
      expect(report).toContain('已完成：1');
      expect(report).toContain('失败：1');
      expect(report).toContain('第一章 初入江湖');
      expect(report).toContain('✅');
      expect(report).toContain('❌');
    });
  });

  describe('exportDraftResults', () => {
    it('should export as TXT format', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed', {
        generatedContent: '第一章内容',
      });
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'completed', {
        generatedContent: '第二章内容',
      });

      const result = exportDraftResults(pipeline, 'txt');

      expect(result).toContain('第1章 第一章 初入江湖');
      expect(result).toContain('第一章内容');
      expect(result).toContain('第2章 第二章 奇遇');
      expect(result).toContain('第二章内容');
    });

    it('should export as Markdown format', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed', {
        generatedContent: '第一章内容',
      });

      const result = exportDraftResults(pipeline, 'markdown');

      expect(result).toContain('# 测试');
      expect(result).toContain('## 1. 第一章 初入江湖');
      expect(result).toContain('第一章内容');
      expect(result).toContain('---');
    });

    it('should only export completed tasks', () => {
      const pipeline = createBatchDraftPipeline('测试', mockOutlineNodes);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed', {
        generatedContent: '第一章内容',
      });
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'failed');

      const result = exportDraftResults(pipeline, 'txt');

      expect(result).toContain('第一章内容');
      expect(result).not.toContain('第二章');
    });
  });
});
