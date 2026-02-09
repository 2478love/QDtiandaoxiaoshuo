/**
 * 批量初稿生成器 - 基于大纲批量生成章节初稿
 * 
 * 核心能力：
 * 1. 基于大纲节点批量生成章节内容
 * 2. 支持暂停/继续/停止
 * 3. 自动保存进度
 * 4. 可调整生成参数（字数、风格等）
 * 5. 失败重试机制
 */

import { OutlineNode } from '../types';

// ============ 类型定义 ============

export type DraftStatus = 'pending' | 'generating' | 'completed' | 'failed' | 'paused';

export interface DraftTask {
  id: string;
  outlineNodeId: string;
  title: string;
  description: string;
  targetWords: number;
  status: DraftStatus;
  progress: number; // 0-100
  generatedContent: string;
  error?: string;
  retryCount: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface DraftGenerationOptions {
  targetWords: number; // 目标字数
  style?: string; // 文风（如：网文轻小说、古典文学、硬科幻）
  tone?: string; // 语气（如：轻松、严肃、幽默）
  pov?: 'first' | 'third'; // 人称视角
  detailLevel?: 'concise' | 'moderate' | 'detailed'; // 详细程度
  includeDialogue?: boolean; // 是否包含对话
  includeDescription?: boolean; // 是否包含环境描写
  temperature?: number; // AI 温度参数
  maxRetries?: number; // 最大重试次数
}

export interface BatchDraftPipeline {
  id: string;
  name: string;
  tasks: DraftTask[];
  options: DraftGenerationOptions;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'stopped';
  currentTaskIndex: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  progress: number; // 0-100
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number; // 秒
}

export interface DraftGenerationProgress {
  taskId: string;
  status: DraftStatus;
  progress: number;
  generatedContent: string;
  error?: string;
}

// ============ 默认配置 ============

export const DEFAULT_DRAFT_OPTIONS: DraftGenerationOptions = {
  targetWords: 2000,
  style: '网文轻小说',
  tone: '轻松',
  pov: 'third',
  detailLevel: 'moderate',
  includeDialogue: true,
  includeDescription: true,
  temperature: 0.8,
  maxRetries: 3,
};

// ============ 任务管理 ============

/**
 * 创建初稿生成任务
 */
export function createDraftTask(
  outlineNode: OutlineNode,
  options: Partial<DraftGenerationOptions> = {}
): DraftTask {
  const mergedOptions = { ...DEFAULT_DRAFT_OPTIONS, ...options };
  
  return {
    id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    outlineNodeId: outlineNode.id,
    title: outlineNode.title,
    description: outlineNode.content || '',
    targetWords: mergedOptions.targetWords,
    status: 'pending',
    progress: 0,
    generatedContent: '',
    retryCount: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 创建批量初稿生成流水线
 */
export function createBatchDraftPipeline(
  name: string,
  outlineNodes: OutlineNode[],
  options: Partial<DraftGenerationOptions> = {}
): BatchDraftPipeline {
  const mergedOptions = { ...DEFAULT_DRAFT_OPTIONS, ...options };
  const tasks = outlineNodes.map(node => createDraftTask(node, mergedOptions));

  return {
    id: `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    tasks,
    options: mergedOptions,
    status: 'idle',
    currentTaskIndex: 0,
    totalTasks: tasks.length,
    completedTasks: 0,
    failedTasks: 0,
    progress: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(
  task: DraftTask,
  status: DraftStatus,
  updates: Partial<DraftTask> = {}
): DraftTask {
  const now = new Date().toISOString();
  const updatedTask: DraftTask = {
    ...task,
    ...updates,
    status,
  };

  if (status === 'generating' && !task.startedAt) {
    updatedTask.startedAt = now;
  }

  if (status === 'completed' || status === 'failed') {
    updatedTask.completedAt = now;
    updatedTask.progress = status === 'completed' ? 100 : task.progress;
  }

  return updatedTask;
}

/**
 * 更新流水线进度
 */
export function updatePipelineProgress(pipeline: BatchDraftPipeline): BatchDraftPipeline {
  const completedTasks = pipeline.tasks.filter(t => t.status === 'completed').length;
  const failedTasks = pipeline.tasks.filter(t => t.status === 'failed').length;
  const progress = pipeline.totalTasks > 0
    ? Math.floor((completedTasks / pipeline.totalTasks) * 100)
    : 0;

  // 计算预计剩余时间
  let estimatedTimeRemaining: number | undefined;
  if (pipeline.startedAt && completedTasks > 0) {
    const elapsed = Date.now() - new Date(pipeline.startedAt).getTime();
    const avgTimePerTask = elapsed / completedTasks;
    const remainingTasks = pipeline.totalTasks - completedTasks - failedTasks;
    estimatedTimeRemaining = Math.floor((avgTimePerTask * remainingTasks) / 1000);
  }

  return {
    ...pipeline,
    completedTasks,
    failedTasks,
    progress,
    estimatedTimeRemaining,
  };
}

/**
 * 获取下一个待处理任务
 */
export function getNextTask(pipeline: BatchDraftPipeline): DraftTask | null {
  return pipeline.tasks.find(t => t.status === 'pending') || null;
}

/**
 * 暂停流水线
 */
export function pausePipeline(pipeline: BatchDraftPipeline): BatchDraftPipeline {
  return {
    ...pipeline,
    status: 'paused',
  };
}

/**
 * 恢复流水线
 */
export function resumePipeline(pipeline: BatchDraftPipeline): BatchDraftPipeline {
  return {
    ...pipeline,
    status: 'running',
  };
}

/**
 * 停止流水线
 */
export function stopPipeline(pipeline: BatchDraftPipeline): BatchDraftPipeline {
  const now = new Date().toISOString();
  return {
    ...pipeline,
    status: 'stopped',
    completedAt: now,
  };
}

/**
 * 重试失败的任务
 */
export function retryFailedTasks(pipeline: BatchDraftPipeline): BatchDraftPipeline {
  const updatedTasks = pipeline.tasks.map(task => {
    if (task.status === 'failed' && task.retryCount < (pipeline.options.maxRetries || 3)) {
      return {
        ...task,
        status: 'pending' as DraftStatus,
        error: undefined,
        retryCount: task.retryCount + 1,
      };
    }
    return task;
  });

  return {
    ...pipeline,
    tasks: updatedTasks,
    status: 'idle',
  };
}

// ============ 提示词生成 ============

/**
 * 生成初稿生成提示词
 */
export function generateDraftPrompt(
  task: DraftTask,
  options: DraftGenerationOptions,
  context?: {
    previousChapters?: string[];
    characters?: string[];
    worldSettings?: string[];
  }
): string {
  const parts: string[] = [];

  // 基础指令
  parts.push(`请根据以下大纲生成一个章节的初稿内容。`);
  parts.push(`\n**章节标题：** ${task.title}`);
  
  if (task.description) {
    parts.push(`\n**章节大纲：**\n${task.description}`);
  }

  // 写作要求
  parts.push(`\n**写作要求：**`);
  parts.push(`- 目标字数：约 ${options.targetWords} 字`);
  parts.push(`- 文风：${options.style || '网文轻小说'}`);
  parts.push(`- 语气：${options.tone || '轻松'}`);
  parts.push(`- 视角：${options.pov === 'first' ? '第一人称' : '第三人称'}`);
  
  const detailLevelMap = {
    concise: '精炼简洁，重点突出',
    moderate: '适中详细，张弛有度',
    detailed: '详细丰富，画面感强',
  };
  parts.push(`- 详细程度：${detailLevelMap[options.detailLevel || 'moderate']}`);

  if (options.includeDialogue) {
    parts.push(`- 包含对话：是（对话要有个性，推动剧情）`);
  }

  if (options.includeDescription) {
    parts.push(`- 环境描写：是（适当渲染氛围，不要过度）`);
  }

  // 上下文信息
  if (context) {
    if (context.previousChapters && context.previousChapters.length > 0) {
      parts.push(`\n**前文回顾：**`);
      context.previousChapters.forEach((chapter, idx) => {
        parts.push(`${idx + 1}. ${chapter}`);
      });
    }

    if (context.characters && context.characters.length > 0) {
      parts.push(`\n**相关人物：**`);
      context.characters.forEach(char => {
        parts.push(`- ${char}`);
      });
    }

    if (context.worldSettings && context.worldSettings.length > 0) {
      parts.push(`\n**世界设定：**`);
      context.worldSettings.forEach(setting => {
        parts.push(`- ${setting}`);
      });
    }
  }

  // 注意事项
  parts.push(`\n**注意事项：**`);
  parts.push(`1. 严格按照大纲内容展开，不要偏离主线`);
  parts.push(`2. 保持与前文的连贯性和一致性`);
  parts.push(`3. 避免 AI 味，使用自然流畅的表达`);
  parts.push(`4. 适当留白，为后续章节埋下伏笔`);
  parts.push(`5. 直接输出章节内容，不要添加额外说明`);

  return parts.join('\n');
}

/**
 * 生成批量初稿报告
 */
export function generateBatchDraftReport(pipeline: BatchDraftPipeline): string {
  const lines: string[] = [];

  lines.push(`# 批量初稿生成报告`);
  lines.push(`\n**流水线名称：** ${pipeline.name}`);
  lines.push(`**创建时间：** ${new Date(pipeline.createdAt).toLocaleString('zh-CN')}`);
  
  if (pipeline.startedAt) {
    lines.push(`**开始时间：** ${new Date(pipeline.startedAt).toLocaleString('zh-CN')}`);
  }
  
  if (pipeline.completedAt) {
    lines.push(`**完成时间：** ${new Date(pipeline.completedAt).toLocaleString('zh-CN')}`);
  }

  lines.push(`\n## 统计信息`);
  lines.push(`- 总任务数：${pipeline.totalTasks}`);
  lines.push(`- 已完成：${pipeline.completedTasks}`);
  lines.push(`- 失败：${pipeline.failedTasks}`);
  lines.push(`- 进度：${pipeline.progress}%`);

  if (pipeline.estimatedTimeRemaining) {
    const minutes = Math.floor(pipeline.estimatedTimeRemaining / 60);
    const seconds = pipeline.estimatedTimeRemaining % 60;
    lines.push(`- 预计剩余时间：${minutes}分${seconds}秒`);
  }

  lines.push(`\n## 任务详情`);
  pipeline.tasks.forEach((task, idx) => {
    const statusEmoji = {
      pending: '⏳',
      generating: '🔄',
      completed: '✅',
      failed: '❌',
      paused: '⏸️',
    }[task.status];

    lines.push(`\n### ${idx + 1}. ${task.title} ${statusEmoji}`);
    lines.push(`- 状态：${task.status}`);
    lines.push(`- 进度：${task.progress}%`);
    lines.push(`- 目标字数：${task.targetWords}`);
    
    if (task.generatedContent) {
      lines.push(`- 已生成字数：${task.generatedContent.length}`);
    }

    if (task.error) {
      lines.push(`- 错误信息：${task.error}`);
      lines.push(`- 重试次数：${task.retryCount}`);
    }

    if (task.completedAt) {
      lines.push(`- 完成时间：${new Date(task.completedAt).toLocaleString('zh-CN')}`);
    }
  });

  lines.push(`\n## 生成选项`);
  lines.push(`- 目标字数：${pipeline.options.targetWords}`);
  lines.push(`- 文风：${pipeline.options.style}`);
  lines.push(`- 语气：${pipeline.options.tone}`);
  lines.push(`- 视角：${pipeline.options.pov === 'first' ? '第一人称' : '第三人称'}`);
  lines.push(`- 详细程度：${pipeline.options.detailLevel}`);
  lines.push(`- 包含对话：${pipeline.options.includeDialogue ? '是' : '否'}`);
  lines.push(`- 环境描写：${pipeline.options.includeDescription ? '是' : '否'}`);

  return lines.join('\n');
}

/**
 * 导出生成结果
 */
export function exportDraftResults(
  pipeline: BatchDraftPipeline,
  format: 'txt' | 'markdown' = 'txt'
): string {
  const completedTasks = pipeline.tasks.filter(t => t.status === 'completed');

  if (format === 'markdown') {
    const lines: string[] = [];
    lines.push(`# ${pipeline.name}\n`);
    
    completedTasks.forEach((task, idx) => {
      lines.push(`## ${idx + 1}. ${task.title}\n`);
      lines.push(task.generatedContent);
      lines.push('\n---\n');
    });

    return lines.join('\n');
  } else {
    // TXT 格式
    const lines: string[] = [];
    
    completedTasks.forEach((task, idx) => {
      lines.push(`第${idx + 1}章 ${task.title}\n`);
      lines.push(task.generatedContent);
      lines.push('\n\n');
    });

    return lines.join('\n');
  }
}

/**
 * 保存进度到本地存储
 */
export function savePipelineProgress(pipeline: BatchDraftPipeline): void {
  try {
    const key = `draft-pipeline-${pipeline.id}`;
    localStorage.setItem(key, JSON.stringify(pipeline));
  } catch (error) {
    console.error('保存进度失败:', error);
  }
}

/**
 * 从本地存储恢复进度
 */
export function loadPipelineProgress(pipelineId: string): BatchDraftPipeline | null {
  try {
    const key = `draft-pipeline-${pipelineId}`;
    const data = localStorage.getItem(key);
    if (data) {
      return JSON.parse(data) as BatchDraftPipeline;
    }
  } catch (error) {
    console.error('加载进度失败:', error);
  }
  return null;
}

/**
 * 清除保存的进度
 */
export function clearPipelineProgress(pipelineId: string): void {
  try {
    const key = `draft-pipeline-${pipelineId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('清除进度失败:', error);
  }
}
