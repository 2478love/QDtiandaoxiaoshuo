/**
 * AI 优化建议生成器 - 基于分析结果生成针对性优化提示词
 * 
 * 核心能力：
 * 1. 自动识别章节问题
 * 2. 生成针对性优化提示词
 * 3. 提供多种优化策略
 * 4. 支持批量优化建议
 */

import {
  analyzeComprehensive,
  type ComprehensiveAnalysis,
  type StyleAnalysis,
  type PlotTensionAnalysis,
  type EmotionAnalysis,
} from './analyzers';

// ============ 类型定义 ============

export type OptimizationFocus = 
  | 'dialogue' // 对话优化
  | 'action' // 动作描写
  | 'scene' // 场景渲染
  | 'emotion' // 情绪表达
  | 'tension' // 情节张力
  | 'pacing' // 节奏控制
  | 'sense' // 五感描写
  | 'comprehensive'; // 综合优化

export interface OptimizationPrompt {
  focus: OptimizationFocus;
  title: string;
  description: string;
  prompt: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImprovement: number; // 预期提升分数 0-100
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface OptimizationSuggestion {
  chapterTitle: string;
  overallScore: number;
  mainIssues: string[];
  prompts: OptimizationPrompt[];
  quickWins: OptimizationPrompt[]; // 快速见效的优化
  strategicImprovements: OptimizationPrompt[]; // 战略性改进
}

// ============ 提示词模板 ============

const PROMPT_TEMPLATES = {
  dialogue: {
    waterDialogue: `请优化以下章节中的对话部分，要求：
1. 删除无意义的寒暄和水对话
2. 每句对话都要推动剧情或展现性格
3. 增加对话的张力和冲突感
4. 保持对话简洁有力，避免啰嗦

原文：
{content}

请直接输出优化后的内容。`,

    lackPersonality: `请优化以下章节中的对话，让不同角色的说话方式更有个性：
1. 根据角色性格调整用词和语气
2. 主角、配角、反派的说话方式要有明显区别
3. 通过对话展现角色的身份、教育背景、情绪状态
4. 避免所有人说话方式相同

原文：
{content}

请直接输出优化后的内容。`,
  },

  action: {
    flatNarration: `请优化以下章节中的动作描写，增强画面感：
1. 增加动作细节，让读者"看到"动作过程
2. 使用更具体的动词，避免"走、跑、打"等笼统词汇
3. 加入力量感、速度感、节奏感
4. 适当使用镜头语言（特写、全景、慢镜头等）

原文：
{content}

请直接输出优化后的内容。`,

    lackRhythm: `请优化以下章节的动作节奏：
1. 战斗场景：短句快节奏，长短句结合
2. 日常场景：适当放慢节奏，增加细节
3. 紧张场景：加快节奏，制造紧迫感
4. 避免节奏单调，注意张弛有度

原文：
{content}

请直接输出优化后的内容。`,
  },

  scene: {
    lackDetail: `请优化以下章节的场景描写，增加细节和氛围：
1. 增加环境细节描写（光线、声音、气味等）
2. 通过场景渲染情绪和氛围
3. 避免过度描写，点到为止
4. 让场景为剧情服务，不要为描写而描写

原文：
{content}

请直接输出优化后的内容。`,

    staticDescription: `请优化以下章节的场景描写，让场景"动"起来：
1. 加入动态元素（风吹、水流、人物移动等）
2. 通过人物视角观察场景变化
3. 场景与情节互动，不要静态堆砌
4. 适当使用比喻和联想

原文：
{content}

请直接输出优化后的内容。`,
  },

  emotion: {
    lowResonance: `请优化以下章节的情绪表达，增强共鸣度：
1. 通过具体细节展现情绪（而非直接说"他很生气"）
2. 使用身体反应、环境渲染来传递情绪
3. 让读者感同身受，而非旁观者
4. 情绪要有层次和变化，避免平铺直叙

原文：
{content}

请直接输出优化后的内容。`,

    imbalanced: `请优化以下章节的情绪平衡：
1. 避免单一情绪持续过长
2. 适当加入情绪对比和转折
3. 在紧张后给予放松，在低谷后给予希望
4. 让情绪曲线有起伏，更符合人性

原文：
{content}

请直接输出优化后的内容。`,
  },

  tension: {
    lowConflict: `请优化以下章节的冲突设置：
1. 增强人物之间的对立和矛盾
2. 加入环境压力和时间限制
3. 展现角色的内心挣扎和两难选择
4. 让冲突更加尖锐和不可调和

原文：
{content}

请直接输出优化后的内容。`,

    lackSuspense: `请优化以下章节的悬念设置：
1. 在关键处留下疑问和未解之谜
2. 适当使用伏笔和暗示
3. 制造危机感和紧迫感
4. 章末留钩子，吸引读者继续阅读

原文：
{content}

请直接输出优化后的内容。`,
  },

  sense: {
    lackSense: `请优化以下章节的五感描写：
1. 增加视觉细节（颜色、形状、光影）
2. 加入听觉元素（声音、音调、节奏）
3. 适当使用嗅觉、味觉、触觉
4. 通过五感让场景更立体、更真实

原文：
{content}

请直接输出优化后的内容。`,
  },

  pacing: {
    tooFast: `请优化以下章节的节奏，适当放慢：
1. 增加必要的细节描写和铺垫
2. 给读者喘息和思考的空间
3. 重要情节不要一笔带过
4. 适当增加对话和心理描写

原文：
{content}

请直接输出优化后的内容。`,

    tooSlow: `请优化以下章节的节奏，适当加快：
1. 删减冗余描写和无关情节
2. 使用短句和动词，增加动感
3. 减少过度的心理描写
4. 让情节推进更紧凑

原文：
{content}

请直接输出优化后的内容。`,
  },

  comprehensive: `请对以下章节进行综合优化，重点关注：
{focusAreas}

优化要求：
1. 保持原文的核心情节和人物设定
2. 提升整体可读性和画面感
3. 增强情绪感染力和代入感
4. 避免 AI 味，使用自然流畅的表达
5. 字数可适当增加，但不要过度扩写

原文：
{content}

请直接输出优化后的内容。`,
};

// ============ 核心功能 ============

/**
 * 生成优化建议
 */
export function generateOptimizationSuggestion(
  chapterTitle: string,
  content: string
): OptimizationSuggestion {
  // 执行综合分析
  const analysis = analyzeComprehensive(content);

  // 识别主要问题
  const mainIssues = identifyMainIssues(analysis);

  // 生成优化提示词
  const prompts = generateOptimizationPrompts(content, analysis);

  // 分类提示词
  const quickWins = prompts.filter(p => p.difficulty === 'easy' && p.priority === 'high');
  const strategicImprovements = prompts.filter(p => p.difficulty !== 'easy' && p.estimatedImprovement >= 10);

  return {
    chapterTitle,
    overallScore: analysis.overallScore,
    mainIssues,
    prompts,
    quickWins,
    strategicImprovements,
  };
}

/**
 * 识别主要问题
 */
function identifyMainIssues(analysis: ComprehensiveAnalysis): string[] {
  const issues: string[] = [];

  // 从优先级列表中提取问题
  analysis.priorities
    .filter(p => p.severity === 'critical' || p.severity === 'major')
    .slice(0, 5)
    .forEach(p => {
      issues.push(p.issue);
    });

  // 从弱点中提取
  if (issues.length < 5) {
    analysis.weaknesses.slice(0, 5 - issues.length).forEach(w => {
      if (!issues.includes(w)) {
        issues.push(w);
      }
    });
  }

  return issues;
}

/**
 * 生成优化提示词
 */
function generateOptimizationPrompts(
  content: string,
  analysis: ComprehensiveAnalysis
): OptimizationPrompt[] {
  const prompts: OptimizationPrompt[] = [];

  // 对话优化
  if (analysis.style.dialogueQuality < 70) {
    prompts.push({
      focus: 'dialogue',
      title: '对话优化',
      description: '提升对话质量，增强个性和张力',
      prompt: PROMPT_TEMPLATES.dialogue.lackPersonality.replace('{content}', content),
      priority: 'high',
      estimatedImprovement: 15,
      difficulty: 'medium',
    });
  }

  // 动作描写优化
  if (analysis.style.actionQuality < 70) {
    prompts.push({
      focus: 'action',
      title: '动作描写优化',
      description: '增强动作画面感和镜头感',
      prompt: PROMPT_TEMPLATES.action.flatNarration.replace('{content}', content),
      priority: 'high',
      estimatedImprovement: 12,
      difficulty: 'medium',
    });
  }

  // 场景渲染优化
  if (analysis.style.sceneQuality < 70) {
    prompts.push({
      focus: 'scene',
      title: '场景渲染优化',
      description: '增加场景细节和氛围营造',
      prompt: PROMPT_TEMPLATES.scene.lackDetail.replace('{content}', content),
      priority: 'medium',
      estimatedImprovement: 10,
      difficulty: 'easy',
    });
  }

  // 情绪表达优化
  if (analysis.emotion.resonance < 70) {
    prompts.push({
      focus: 'emotion',
      title: '情绪表达优化',
      description: '增强情绪共鸣度和感染力',
      prompt: PROMPT_TEMPLATES.emotion.lowResonance.replace('{content}', content),
      priority: 'high',
      estimatedImprovement: 15,
      difficulty: 'hard',
    });
  }

  // 情节张力优化
  if (analysis.tension.conflict.intensity < 60) {
    prompts.push({
      focus: 'tension',
      title: '冲突强度优化',
      description: '增强冲突和对立，提升张力',
      prompt: PROMPT_TEMPLATES.tension.lowConflict.replace('{content}', content),
      priority: 'high',
      estimatedImprovement: 18,
      difficulty: 'hard',
    });
  }

  // 悬念设置优化
  if (analysis.tension.suspense.effectiveness < 60) {
    prompts.push({
      focus: 'tension',
      title: '悬念设置优化',
      description: '增加悬念和钩子，吸引读者',
      prompt: PROMPT_TEMPLATES.tension.lackSuspense.replace('{content}', content),
      priority: 'medium',
      estimatedImprovement: 12,
      difficulty: 'medium',
    });
  }

  // 五感描写优化
  const avgSense = Object.values(analysis.style.senseUsage).reduce((a, b) => a + b, 0) / 5;
  if (avgSense < 50) {
    prompts.push({
      focus: 'sense',
      title: '五感描写优化',
      description: '增加五感细节，提升沉浸感',
      prompt: PROMPT_TEMPLATES.sense.lackSense.replace('{content}', content),
      priority: 'medium',
      estimatedImprovement: 10,
      difficulty: 'easy',
    });
  }

  // 节奏控制优化
  if (analysis.tension.pacing.rhythm === 'too-fast') {
    prompts.push({
      focus: 'pacing',
      title: '节奏优化（放慢）',
      description: '适当放慢节奏，增加铺垫',
      prompt: PROMPT_TEMPLATES.pacing.tooFast.replace('{content}', content),
      priority: 'low',
      estimatedImprovement: 8,
      difficulty: 'easy',
    });
  } else if (analysis.tension.pacing.rhythm === 'too-slow') {
    prompts.push({
      focus: 'pacing',
      title: '节奏优化（加快）',
      description: '加快节奏，删减冗余',
      prompt: PROMPT_TEMPLATES.pacing.tooSlow.replace('{content}', content),
      priority: 'medium',
      estimatedImprovement: 10,
      difficulty: 'easy',
    });
  }

  // 综合优化（当分数较低时）
  if (analysis.overallScore < 70) {
    const focusAreas = prompts.slice(0, 3).map(p => `- ${p.title}: ${p.description}`).join('\n');
    prompts.push({
      focus: 'comprehensive',
      title: '综合优化',
      description: '全方位提升章节质量',
      prompt: PROMPT_TEMPLATES.comprehensive
        .replace('{focusAreas}', focusAreas)
        .replace('{content}', content),
      priority: 'high',
      estimatedImprovement: 20,
      difficulty: 'hard',
    });
  }

  // 按优先级和预期提升排序
  return prompts.sort((a, b) => {
    const priorityWeight = { high: 3, medium: 2, low: 1 };
    const aPriority = priorityWeight[a.priority];
    const bPriority = priorityWeight[b.priority];
    
    if (aPriority !== bPriority) {
      return bPriority - aPriority;
    }
    
    return b.estimatedImprovement - a.estimatedImprovement;
  });
}

/**
 * 批量生成优化建议
 */
export function batchGenerateOptimizationSuggestions(
  chapters: Array<{ title: string; content: string }>
): OptimizationSuggestion[] {
  return chapters.map(chapter => 
    generateOptimizationSuggestion(chapter.title, chapter.content)
  );
}

/**
 * 生成优化报告
 */
export function generateOptimizationReport(suggestion: OptimizationSuggestion): string {
  const lines: string[] = [];

  lines.push(`# ${suggestion.chapterTitle} - 优化建议报告`);
  lines.push(`\n**综合评分：** ${suggestion.overallScore}/100`);

  lines.push(`\n## 主要问题`);
  suggestion.mainIssues.forEach((issue, idx) => {
    lines.push(`${idx + 1}. ${issue}`);
  });

  lines.push(`\n## 快速见效优化（${suggestion.quickWins.length}项）`);
  suggestion.quickWins.forEach((prompt, idx) => {
    lines.push(`\n### ${idx + 1}. ${prompt.title}`);
    lines.push(`- **描述：** ${prompt.description}`);
    lines.push(`- **预期提升：** +${prompt.estimatedImprovement}分`);
    lines.push(`- **难度：** ${prompt.difficulty}`);
    lines.push(`- **优先级：** ${prompt.priority}`);
  });

  lines.push(`\n## 战略性改进（${suggestion.strategicImprovements.length}项）`);
  suggestion.strategicImprovements.forEach((prompt, idx) => {
    lines.push(`\n### ${idx + 1}. ${prompt.title}`);
    lines.push(`- **描述：** ${prompt.description}`);
    lines.push(`- **预期提升：** +${prompt.estimatedImprovement}分`);
    lines.push(`- **难度：** ${prompt.difficulty}`);
    lines.push(`- **优先级：** ${prompt.priority}`);
  });

  lines.push(`\n## 所有优化提示词（${suggestion.prompts.length}项）`);
  suggestion.prompts.forEach((prompt, idx) => {
    lines.push(`\n### ${idx + 1}. ${prompt.title}`);
    lines.push(`**描述：** ${prompt.description}`);
    lines.push(`**预期提升：** +${prompt.estimatedImprovement}分 | **难度：** ${prompt.difficulty} | **优先级：** ${prompt.priority}`);
    lines.push(`\n**提示词：**`);
    lines.push('```');
    lines.push(prompt.prompt);
    lines.push('```');
  });

  return lines.join('\n');
}

/**
 * 导出优化建议为 JSON
 */
export function exportOptimizationSuggestionAsJSON(suggestion: OptimizationSuggestion): string {
  return JSON.stringify(suggestion, null, 2);
}

/**
 * 获取最优先的优化提示词
 */
export function getTopPriorityPrompt(suggestion: OptimizationSuggestion): OptimizationPrompt | null {
  if (suggestion.prompts.length === 0) return null;
  return suggestion.prompts[0];
}

/**
 * 按焦点筛选提示词
 */
export function filterPromptsByFocus(
  suggestion: OptimizationSuggestion,
  focus: OptimizationFocus
): OptimizationPrompt[] {
  return suggestion.prompts.filter(p => p.focus === focus);
}
