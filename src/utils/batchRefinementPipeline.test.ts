import { describe, it, expect } from 'vitest';
import {
  createRefinementTask,
  createRefinementPipeline,
  getStagePrompt,
  getStageName,
  updateTaskStatus,
  completeTaskStage,
  updatePipelineProgress,
  getNextTask,
  pausePipeline,
  resumePipeline,
  stopPipeline,
  retryFailedTasks,
  generatePipelineReport,
  exportRefinementResults,
  DEFAULT_REFINEMENT_PROMPTS,
  type RefinementStage,
  type RefinementPromptConfig,
} from './batchRefinementPipeline';

describe('batchRefinementPipeline', () => {
  const sampleChapters = [
    { id: 'ch1', title: '第一章', content: '这是第一章的内容。' },
    { id: 'ch2', title: '第二章', content: '这是第二章的内容。' },
  ];

  const allStages: RefinementStage[] = [
    'remove-ai-flavor',
    'enhance-tension',
    'improve-character',
    'add-techniques',
  ];

  describe('createRefinementTask', () => {
    it('should create a refinement task', () => {
      const task = createRefinementTask('ch1', '第一章', '内容', allStages);
      
      expect(task.id).toBeTruthy();
      expect(task.chapterId).toBe('ch1');
      expect(task.chapterTitle).toBe('第一章');
      expect(task.originalContent).toBe('内容');
      expect(task.currentContent).toBe('内容');
      expect(task.currentStage).toBe('remove-ai-flavor');
      expect(task.completedStages).toEqual([]);
      expect(task.status).toBe('pending');
    });

    it('should generate unique task IDs', () => {
      const task1 = createRefinementTask('ch1', '第一章', '内容', allStages);
      const task2 = createRefinementTask('ch1', '第一章', '内容', allStages);
      
      expect(task1.id).not.toBe(task2.id);
    });
  });

  describe('createRefinementPipeline', () => {
    it('should create a pipeline with default stages', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      
      expect(pipeline.id).toBeTruthy();
      expect(pipeline.tasks).toHaveLength(2);
      expect(pipeline.stages).toEqual(allStages);
      expect(pipeline.currentTaskIndex).toBe(0);
      expect(pipeline.status).toBe('idle');
      expect(pipeline.progress.total).toBe(8); // 2 tasks * 4 stages
      expect(pipeline.progress.completed).toBe(0);
    });

    it('should create a pipeline with custom stages', () => {
      const customStages: RefinementStage[] = ['remove-ai-flavor', 'enhance-tension'];
      const pipeline = createRefinementPipeline(sampleChapters, { stages: customStages });
      
      expect(pipeline.stages).toEqual(customStages);
      expect(pipeline.progress.total).toBe(4); // 2 tasks * 2 stages
    });

    it('should handle empty chapters array', () => {
      const pipeline = createRefinementPipeline([]);
      
      expect(pipeline.tasks).toEqual([]);
      expect(pipeline.progress.total).toBe(0);
    });
  });

  describe('getStagePrompt', () => {
    it('should generate prompt for remove-ai-flavor stage', () => {
      const prompt = getStagePrompt('remove-ai-flavor', '测试内容');
      
      expect(prompt).toContain('测试内容');
      expect(prompt).toContain('AI味');
    });

    it('should generate prompt for enhance-tension stage', () => {
      const prompt = getStagePrompt('enhance-tension', '测试内容');
      
      expect(prompt).toContain('测试内容');
      expect(prompt).toContain('张力');
    });

    it('should generate prompt for improve-character stage', () => {
      const prompt = getStagePrompt('improve-character', '测试内容');
      
      expect(prompt).toContain('测试内容');
      expect(prompt).toContain('人物');
    });

    it('should generate prompt for add-techniques stage', () => {
      const prompt = getStagePrompt('add-techniques', '测试内容');
      
      expect(prompt).toContain('测试内容');
      expect(prompt).toContain('文学手法');
    });

    it('should use custom prompts', () => {
      const customPrompts: RefinementPromptConfig = {
        removeAiFlavor: '自定义提示词：{content}',
        enhanceTension: DEFAULT_REFINEMENT_PROMPTS.enhanceTension,
        improveCharacter: DEFAULT_REFINEMENT_PROMPTS.improveCharacter,
        addTechniques: DEFAULT_REFINEMENT_PROMPTS.addTechniques,
      };
      
      const prompt = getStagePrompt('remove-ai-flavor', '测试', customPrompts);
      expect(prompt).toBe('自定义提示词：测试');
    });
  });

  describe('getStageName', () => {
    it('should return Chinese name for each stage', () => {
      expect(getStageName('remove-ai-flavor')).toBe('去 AI 味');
      expect(getStageName('enhance-tension')).toBe('增强张力');
      expect(getStageName('improve-character')).toBe('改善人物');
      expect(getStageName('add-techniques')).toBe('添加手法');
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status', () => {
      const task = createRefinementTask('ch1', '第一章', '内容', allStages);
      const updated = updateTaskStatus(task, 'processing');
      
      expect(updated.status).toBe('processing');
      expect(updated.startTime).toBeTruthy();
    });

    it('should set end time for completed status', () => {
      const task = createRefinementTask('ch1', '第一章', '内容', allStages);
      const updated = updateTaskStatus(task, 'completed');
      
      expect(updated.status).toBe('completed');
      expect(updated.endTime).toBeTruthy();
    });

    it('should set error message for failed status', () => {
      const task = createRefinementTask('ch1', '第一章', '内容', allStages);
      const updated = updateTaskStatus(task, 'failed', '测试错误');
      
      expect(updated.status).toBe('failed');
      expect(updated.error).toBe('测试错误');
      expect(updated.endTime).toBeTruthy();
    });
  });

  describe('completeTaskStage', () => {
    it('should complete current stage and move to next', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      const task = pipeline.tasks[0];
      const updated = completeTaskStage(task, '精修后的内容', pipeline);
      
      expect(updated.currentContent).toBe('精修后的内容');
      expect(updated.completedStages).toContain('remove-ai-flavor');
      expect(updated.currentStage).toBe('enhance-tension');
      expect(updated.status).toBe('pending');
    });

    it('should mark task as completed after last stage', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      let task = pipeline.tasks[0];
      
      // Complete all stages
      for (let i = 0; i < pipeline.stages.length; i++) {
        task = completeTaskStage(task, `精修${i + 1}`, pipeline);
      }
      
      expect(task.status).toBe('completed');
      expect(task.completedStages).toHaveLength(4);
      expect(task.endTime).toBeTruthy();
    });
  });

  describe('updatePipelineProgress', () => {
    it('should calculate progress correctly', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      
      // Complete first stage of first task
      pipeline.tasks[0] = completeTaskStage(pipeline.tasks[0], '精修1', pipeline);
      
      const updated = updatePipelineProgress(pipeline);
      
      expect(updated.progress.completed).toBe(1);
      expect(updated.progress.percentage).toBe(13); // 1/8 * 100 ≈ 13
    });

    it('should count failed tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'failed', '错误');
      
      const updated = updatePipelineProgress(pipeline);
      
      expect(updated.progress.failed).toBe(1);
    });

    it('should handle 100% completion', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      
      // Complete all tasks
      pipeline.tasks.forEach((task, i) => {
        for (let j = 0; j < pipeline.stages.length; j++) {
          pipeline.tasks[i] = completeTaskStage(pipeline.tasks[i], `精修${j}`, pipeline);
        }
      });
      
      const updated = updatePipelineProgress(pipeline);
      
      expect(updated.progress.completed).toBe(8);
      expect(updated.progress.percentage).toBe(100);
    });
  });

  describe('getNextTask', () => {
    it('should return first pending task', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      const next = getNextTask(pipeline);
      
      expect(next).toBeTruthy();
      expect(next?.chapterId).toBe('ch1');
    });

    it('should skip completed tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      
      const next = getNextTask(pipeline);
      
      expect(next?.chapterId).toBe('ch2');
    });

    it('should return null when all tasks are completed', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks.forEach((_, i) => {
        pipeline.tasks[i] = updateTaskStatus(pipeline.tasks[i], 'completed');
      });
      
      const next = getNextTask(pipeline);
      
      expect(next).toBeNull();
    });

    it('should return paused tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'paused');
      
      const next = getNextTask(pipeline);
      
      expect(next?.status).toBe('paused');
    });
  });

  describe('pausePipeline', () => {
    it('should pause pipeline and processing tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.status = 'running';
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'processing');
      
      const paused = pausePipeline(pipeline);
      
      expect(paused.status).toBe('paused');
      expect(paused.tasks[0].status).toBe('paused');
    });

    it('should not affect completed tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      
      const paused = pausePipeline(pipeline);
      
      expect(paused.tasks[0].status).toBe('completed');
    });
  });

  describe('resumePipeline', () => {
    it('should resume paused pipeline', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.status = 'paused';
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'paused');
      
      const resumed = resumePipeline(pipeline);
      
      expect(resumed.status).toBe('running');
      expect(resumed.tasks[0].status).toBe('pending');
    });
  });

  describe('stopPipeline', () => {
    it('should stop pipeline and pause active tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.status = 'running';
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'processing');
      
      const stopped = stopPipeline(pipeline);
      
      expect(stopped.status).toBe('completed');
      expect(stopped.endTime).toBeTruthy();
      expect(stopped.tasks[0].status).toBe('paused');
    });
  });

  describe('retryFailedTasks', () => {
    it('should reset failed tasks to pending', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'failed', '错误');
      
      const retried = retryFailedTasks(pipeline);
      
      expect(retried.tasks[0].status).toBe('pending');
      expect(retried.tasks[0].error).toBeUndefined();
    });

    it('should not affect non-failed tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      
      const retried = retryFailedTasks(pipeline);
      
      expect(retried.tasks[0].status).toBe('completed');
    });
  });

  describe('generatePipelineReport', () => {
    it('should generate comprehensive report', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.startTime = Date.now();
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      
      const report = generatePipelineReport(pipeline);
      
      expect(report).toContain('批量精修流水线报告');
      expect(report).toContain(pipeline.id);
      expect(report).toContain('第一章');
      expect(report).toContain('第二章');
      expect(report).toContain('去 AI 味');
    });

    it('should include timing information', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.startTime = Date.now() - 10000;
      pipeline.endTime = Date.now();
      
      const report = generatePipelineReport(pipeline);
      
      expect(report).toContain('开始时间');
      expect(report).toContain('完成时间');
      expect(report).toContain('总耗时');
    });

    it('should show task statistics', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'completed');
      pipeline.tasks[1] = updateTaskStatus(pipeline.tasks[1], 'failed', '错误');
      
      const updated = updatePipelineProgress(pipeline);
      const report = generatePipelineReport(updated);
      
      expect(report).toContain('已完成：');
      expect(report).toContain('失败：');
    });
  });

  describe('exportRefinementResults', () => {
    it('should export completed tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      
      // Complete first task
      for (let i = 0; i < pipeline.stages.length; i++) {
        pipeline.tasks[0] = completeTaskStage(pipeline.tasks[0], `精修${i}`, pipeline);
      }
      
      const results = exportRefinementResults(pipeline);
      
      expect(results).toHaveLength(1);
      expect(results[0].chapterId).toBe('ch1');
      expect(results[0].chapterTitle).toBe('第一章');
      expect(results[0].originalContent).toBe('这是第一章的内容。');
      expect(results[0].refinedContent).toBeTruthy();
      expect(results[0].completedStages).toHaveLength(4);
    });

    it('should not export incomplete tasks', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      pipeline.tasks[0] = updateTaskStatus(pipeline.tasks[0], 'processing');
      
      const results = exportRefinementResults(pipeline);
      
      expect(results).toEqual([]);
    });

    it('should include stage names in Chinese', () => {
      const pipeline = createRefinementPipeline(sampleChapters);
      
      for (let i = 0; i < pipeline.stages.length; i++) {
        pipeline.tasks[0] = completeTaskStage(pipeline.tasks[0], `精修${i}`, pipeline);
      }
      
      const results = exportRefinementResults(pipeline);
      
      expect(results[0].completedStages).toContain('去 AI 味');
      expect(results[0].completedStages).toContain('增强张力');
    });
  });
});
