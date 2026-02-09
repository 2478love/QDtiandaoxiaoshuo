/**
 * 批量精修流水线
 * 支持多轮精修：去 AI 味 → 张力 → 人物 → 手法
 */

export type RefinementStage = 
  | 'remove-ai-flavor'  // 去 AI 味
  | 'enhance-tension'   // 增强张力
  | 'improve-character' // 改善人物
  | 'add-techniques';   // 添加手法

export interface RefinementTask {
  /** 任务ID */
  id: string;
  /** 章节ID */
  chapterId: string;
  /** 章节标题 */
  chapterTitle: string;
  /** 原始内容 */
  originalContent: string;
  /** 当前内容 */
  currentContent: string;
  /** 当前阶段 */
  currentStage: RefinementStage;
  /** 已完成的阶段 */
  completedStages: RefinementStage[];
  /** 状态 */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'paused';
  /** 错误信息 */
  error?: string;
  /** 开始时间 */
  startTime?: number;
  /** 完成时间 */
  endTime?: number;
}

export interface RefinementPipeline {
  /** 流水线ID */
  id: string;
  /** 任务列表 */
  tasks: RefinementTask[];
  /** 精修阶段顺序 */
  stages: RefinementStage[];
  /** 当前任务索引 */
  currentTaskIndex: number;
  /** 状态 */
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  /** 开始时间 */
  startTime?: number;
  /** 完成时间 */
  endTime?: number;
  /** 进度 */
  progress: {
    total: number;
    completed: number;
    failed: number;
    percentage: number;
  };
}

export interface RefinementOptions {
  /** 精修阶段（默认全部） */
  stages?: RefinementStage[];
  /** 是否自动继续下一个任务 */
  autoContinue?: boolean;
  /** 任务间延迟（毫秒） */
  delayBetweenTasks?: number;
  /** 失败后是否继续 */
  continueOnError?: boolean;
}

export interface RefinementPromptConfig {
  /** 去 AI 味提示词 */
  removeAiFlavor: string;
  /** 增强张力提示词 */
  enhanceTension: string;
  /** 改善人物提示词 */
  improveCharacter: string;
  /** 添加手法提示词 */
  addTechniques: string;
}

/**
 * 默认精修提示词配置
 */
export const DEFAULT_REFINEMENT_PROMPTS: RefinementPromptConfig = {
  removeAiFlavor: `请去除以下文本中的"AI味"，使其更加自然流畅：

【要求】
1. 去除过度修饰和堆砌的形容词
2. 简化复杂的句式结构
3. 减少"仿佛"、"似乎"、"好像"等模糊词汇
4. 避免过度的心理描写
5. 使用更口语化、更接地气的表达

【原文】
{content}

【精修后】`,

  enhanceTension: `请增强以下文本的情节张力：

【要求】
1. 强化冲突和对立
2. 增加悬念和未知感
3. 加快节奏，减少冗余
4. 突出关键转折点
5. 增强情绪起伏

【原文】
{content}

【精修后】`,

  improveCharacter: `请改善以下文本中的人物塑造：

【要求】
1. 让对话更有个性和特色
2. 通过动作展现性格
3. 避免人物OOC（性格不一致）
4. 增加人物间的互动和化学反应
5. 让人物行为更有动机和逻辑

【原文】
{content}

【精修后】`,

  addTechniques: `请为以下文本添加文学手法：

【要求】
1. 适当使用比喻、拟人等修辞
2. 增加对比和反差
3. 运用伏笔和呼应
4. 使用排比增强气势
5. 注意节奏和韵律感

【原文】
{content}

【精修后】`,
};

/**
 * 创建精修任务
 */
export function createRefinementTask(
  chapterId: string,
  chapterTitle: string,
  content: string,
  stages: RefinementStage[]
): RefinementTask {
  return {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    chapterId,
    chapterTitle,
    originalContent: content,
    currentContent: content,
    currentStage: stages[0],
    completedStages: [],
    status: 'pending',
  };
}

/**
 * 创建批量精修流水线
 */
export function createRefinementPipeline(
  chapters: Array<{ id: string; title: string; content: string }>,
  options: RefinementOptions = {}
): RefinementPipeline {
  const stages = options.stages || [
    'remove-ai-flavor',
    'enhance-tension',
    'improve-character',
    'add-techniques',
  ];

  const tasks = chapters.map(chapter =>
    createRefinementTask(chapter.id, chapter.title, chapter.content, stages)
  );

  return {
    id: `pipeline-${Date.now()}`,
    tasks,
    stages,
    currentTaskIndex: 0,
    status: 'idle',
    progress: {
      total: tasks.length * stages.length,
      completed: 0,
      failed: 0,
      percentage: 0,
    },
  };
}

/**
 * 获取阶段的提示词
 */
export function getStagePrompt(
  stage: RefinementStage,
  content: string,
  prompts: RefinementPromptConfig = DEFAULT_REFINEMENT_PROMPTS
): string {
  const promptTemplate = {
    'remove-ai-flavor': prompts.removeAiFlavor,
    'enhance-tension': prompts.enhanceTension,
    'improve-character': prompts.improveCharacter,
    'add-techniques': prompts.addTechniques,
  }[stage];

  return promptTemplate.replace('{content}', content);
}

/**
 * 获取阶段的中文名称
 */
export function getStageName(stage: RefinementStage): string {
  const names: Record<RefinementStage, string> = {
    'remove-ai-flavor': '去 AI 味',
    'enhance-tension': '增强张力',
    'improve-character': '改善人物',
    'add-techniques': '添加手法',
  };
  return names[stage];
}

/**
 * 更新任务状态
 */
export function updateTaskStatus(
  task: RefinementTask,
  status: RefinementTask['status'],
  error?: string
): RefinementTask {
  return {
    ...task,
    status,
    error,
    startTime: status === 'processing' ? Date.now() : task.startTime,
    endTime: status === 'completed' || status === 'failed' ? Date.now() : task.endTime,
  };
}

/**
 * 完成任务的当前阶段
 */
export function completeTaskStage(
  task: RefinementTask,
  refinedContent: string,
  pipeline: RefinementPipeline
): RefinementTask {
  const completedStages = [...task.completedStages, task.currentStage];
  const nextStageIndex = pipeline.stages.indexOf(task.currentStage) + 1;
  const hasMoreStages = nextStageIndex < pipeline.stages.length;

  return {
    ...task,
    currentContent: refinedContent,
    completedStages,
    currentStage: hasMoreStages ? pipeline.stages[nextStageIndex] : task.currentStage,
    status: hasMoreStages ? 'pending' : 'completed',
    endTime: hasMoreStages ? task.endTime : Date.now(),
  };
}

/**
 * 更新流水线进度
 */
export function updatePipelineProgress(pipeline: RefinementPipeline): RefinementPipeline {
  const completed = pipeline.tasks.reduce((sum, task) => {
    return sum + task.completedStages.length;
  }, 0);

  const failed = pipeline.tasks.filter(task => task.status === 'failed').length;

  const percentage = pipeline.progress.total > 0
    ? Math.round((completed / pipeline.progress.total) * 100)
    : 0;

  return {
    ...pipeline,
    progress: {
      ...pipeline.progress,
      completed,
      failed,
      percentage,
    },
  };
}

/**
 * 获取下一个待处理的任务
 */
export function getNextTask(pipeline: RefinementPipeline): RefinementTask | null {
  for (let i = pipeline.currentTaskIndex; i < pipeline.tasks.length; i++) {
    const task = pipeline.tasks[i];
    if (task.status === 'pending' || task.status === 'paused') {
      return task;
    }
  }
  return null;
}

/**
 * 暂停流水线
 */
export function pausePipeline(pipeline: RefinementPipeline): RefinementPipeline {
  return {
    ...pipeline,
    status: 'paused',
    tasks: pipeline.tasks.map(task =>
      task.status === 'processing' ? { ...task, status: 'paused' } : task
    ),
  };
}

/**
 * 恢复流水线
 */
export function resumePipeline(pipeline: RefinementPipeline): RefinementPipeline {
  return {
    ...pipeline,
    status: 'running',
    tasks: pipeline.tasks.map(task =>
      task.status === 'paused' ? { ...task, status: 'pending' } : task
    ),
  };
}

/**
 * 停止流水线
 */
export function stopPipeline(pipeline: RefinementPipeline): RefinementPipeline {
  return {
    ...pipeline,
    status: 'completed',
    endTime: Date.now(),
    tasks: pipeline.tasks.map(task =>
      task.status === 'processing' || task.status === 'pending'
        ? { ...task, status: 'paused' }
        : task
    ),
  };
}

/**
 * 重试失败的任务
 */
export function retryFailedTasks(pipeline: RefinementPipeline): RefinementPipeline {
  return {
    ...pipeline,
    tasks: pipeline.tasks.map(task =>
      task.status === 'failed'
        ? { ...task, status: 'pending', error: undefined }
        : task
    ),
  };
}

/**
 * 生成流水线报告
 */
export function generatePipelineReport(pipeline: RefinementPipeline): string {
  const lines: string[] = [];
  
  lines.push('# 批量精修流水线报告');
  lines.push('');
  lines.push(`**流水线ID：** ${pipeline.id}`);
  lines.push(`**状态：** ${pipeline.status}`);
  lines.push(`**进度：** ${pipeline.progress.completed}/${pipeline.progress.total} (${pipeline.progress.percentage}%)`);
  
  if (pipeline.startTime) {
    lines.push(`**开始时间：** ${new Date(pipeline.startTime).toLocaleString()}`);
  }
  
  if (pipeline.endTime) {
    lines.push(`**完成时间：** ${new Date(pipeline.endTime).toLocaleString()}`);
    const duration = Math.round((pipeline.endTime - (pipeline.startTime || 0)) / 1000);
    lines.push(`**总耗时：** ${duration}秒`);
  }
  
  lines.push('');
  lines.push('## 精修阶段');
  pipeline.stages.forEach((stage, i) => {
    lines.push(`${i + 1}. ${getStageName(stage)}`);
  });
  
  lines.push('');
  lines.push('## 任务列表');
  lines.push('');
  
  pipeline.tasks.forEach((task, i) => {
    const statusIcon = {
      pending: '⏳',
      processing: '🔄',
      completed: '✅',
      failed: '❌',
      paused: '⏸️',
    }[task.status];
    
    lines.push(`### ${i + 1}. ${task.chapterTitle} ${statusIcon}`);
    lines.push('');
    lines.push(`- **状态：** ${task.status}`);
    lines.push(`- **当前阶段：** ${getStageName(task.currentStage)}`);
    lines.push(`- **已完成阶段：** ${task.completedStages.map(getStageName).join('、') || '无'}`);
    
    if (task.error) {
      lines.push(`- **错误：** ${task.error}`);
    }
    
    if (task.startTime) {
      lines.push(`- **开始时间：** ${new Date(task.startTime).toLocaleString()}`);
    }
    
    if (task.endTime) {
      lines.push(`- **完成时间：** ${new Date(task.endTime).toLocaleString()}`);
      const duration = Math.round((task.endTime - (task.startTime || 0)) / 1000);
      lines.push(`- **耗时：** ${duration}秒`);
    }
    
    lines.push('');
  });
  
  lines.push('## 统计信息');
  lines.push('');
  lines.push(`- **总任务数：** ${pipeline.tasks.length}`);
  lines.push(`- **已完成：** ${pipeline.tasks.filter(t => t.status === 'completed').length}`);
  lines.push(`- **进行中：** ${pipeline.tasks.filter(t => t.status === 'processing').length}`);
  lines.push(`- **待处理：** ${pipeline.tasks.filter(t => t.status === 'pending').length}`);
  lines.push(`- **已暂停：** ${pipeline.tasks.filter(t => t.status === 'paused').length}`);
  lines.push(`- **失败：** ${pipeline.progress.failed}`);
  
  return lines.join('\n');
}

/**
 * 导出精修结果
 */
export function exportRefinementResults(pipeline: RefinementPipeline): Array<{
  chapterId: string;
  chapterTitle: string;
  originalContent: string;
  refinedContent: string;
  completedStages: string[];
}> {
  return pipeline.tasks
    .filter(task => task.status === 'completed')
    .map(task => ({
      chapterId: task.chapterId,
      chapterTitle: task.chapterTitle,
      originalContent: task.originalContent,
      refinedContent: task.currentContent,
      completedStages: task.completedStages.map(getStageName),
    }));
}
