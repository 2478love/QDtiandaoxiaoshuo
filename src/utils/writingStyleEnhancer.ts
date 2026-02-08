/**
 * 写作风格增强器 - 提升描写质量和画面感
 * 
 * 核心能力：
 * 1. 五感描写增强（视觉、听觉、嗅觉、味觉、触觉）
 * 2. 对话优化（去水分、增张力、显性格）
 * 3. 动作描写（镜头感、节奏感、力量感）
 * 4. 心理描写（去直白、增层次、显冲突）
 * 5. 场景渲染（氛围营造、细节点缀、情绪传递）
 */

// ============ 类型定义 ============

export interface WritingIssue {
  type: 'dialogue' | 'action' | 'psychology' | 'scene' | 'sense';
  severity: 'critical' | 'major' | 'minor';
  position: { start: number; end: number };
  context: string;
  problem: string;
  suggestion: string;
  example?: string;
}

export interface StyleAnalysis {
  score: number; // 0-100
  issues: WritingIssue[];
  strengths: string[];
  improvements: string[];
  senseUsage: {
    visual: number;
    auditory: number;
    olfactory: number;
    gustatory: number;
    tactile: number;
  };
  dialogueQuality: number; // 0-100
  actionQuality: number; // 0-100
  sceneQuality: number; // 0-100
}

export interface EnhancementOptions {
  focusAreas?: ('dialogue' | 'action' | 'psychology' | 'scene' | 'sense')[];
  targetStyle?: 'cinematic' | 'literary' | 'fast-paced' | 'immersive';
  senseEmphasis?: ('visual' | 'auditory' | 'olfactory' | 'gustatory' | 'tactile')[];
}

// ============ 问题检测模式 ============

/** 对话问题模式 */
const DIALOGUE_ISSUES = {
  // 水对话：无意义的日常寒暄
  waterDialogue: {
    patterns: [
      /["""「『]你好[。！？"""」』]/,
      /["""「『]再见[。！？"""」』]/,
      /["""「『]是的[。！？"""」』]/,
      /["""「『]好的[。！？"""」』]/,
      /["""「『]嗯[。！？"""」』]/,
      /["""「『]哦[。！？"""」』]/,
    ],
    problem: '对话过于日常化，缺乏推动剧情的作用',
    suggestion: '每句对话都应该推动剧情、展现性格或制造冲突',
  },
  
  // 说明书对话：角色像在念说明书
  expositoryDialogue: {
    patterns: [
      /["""「『][^"""」』]{50,}(因为|所以|首先|其次|然后|最后)[^"""」』]{50,}[」』"""]/,
      /["""「『].*?的原理是.*?[」』"""]/,
      /["""「『].*?让我来解释.*?[」』"""]/,
    ],
    problem: '对话过长且说教化，像在背书',
    suggestion: '拆分长对话，用动作、表情、环境描写打断，增加自然感',
  },
  
  // 缺乏个性：所有角色说话方式相同
  lackPersonality: {
    patterns: [
      /["""「『]我认为[」』"""]/,
      /["""「『]依我之见[」』"""]/,
    ],
    problem: '对话缺乏角色个性，所有人说话方式相同',
    suggestion: '根据角色性格、身份、情绪调整说话方式（用词、语气、句式）',
  },
};

/** 动作描写问题 */
const ACTION_ISSUES = {
  // 平铺直叙：缺乏镜头感
  flatNarration: {
    patterns: [
      /他(走|跑|跳|打|踢|砍|刺)了/,
      /她(说|笑|哭|叫|喊)了/,
    ],
    problem: '动作描写过于简单，缺乏画面感',
    suggestion: '增加动作细节、力量感、节奏感，让读者"看到"动作',
  },
  
  // 缺乏节奏：动作描写没有快慢变化
  lackRhythm: {
    patterns: [
      /(他|她).*?，(他|她).*?，(他|她).*?，(他|她).*?/,
    ],
    problem: '动作描写节奏单调，缺乏张力',
    suggestion: '战斗/紧张场景用短句，平静场景用长句，制造节奏变化',
  },
};

/** 心理描写问题 */
const PSYCHOLOGY_ISSUES = {
  // 直白心理：直接说"他想"
  directThought: {
    patterns: [
      /(他|她)(想|觉得|认为|感到|心想)[:：]/,
      /(他|她)的内心/,
      /(他|她)心里想/,
    ],
    problem: '心理描写过于直白，缺乏文学性',
    suggestion: '通过动作、表情、环境反应暗示心理，而非直接陈述',
  },
  
  // 过度心理：大段内心独白
  excessiveThought: {
    patterns: [
      /(他|她)(想|觉得|认为|感到)[^。]{100,}。/,
    ],
    problem: '心理描写过长，拖慢节奏',
    suggestion: '精简心理描写，关键时刻才展开，平时用动作暗示',
  },
};

/** 场景描写问题 */
const SCENE_ISSUES = {
  // 缺乏细节：场景描写空洞
  lackDetail: {
    patterns: [
      /这是一个(美丽|漂亮|宏伟|壮观)的地方/,
      /环境(很|非常)(好|美|差)/,
    ],
    problem: '场景描写过于笼统，缺乏具体细节',
    suggestion: '用具体的视觉、听觉、嗅觉细节描绘场景，让读者身临其境',
  },
  
  // 静态描写：场景像照片，缺乏动态
  staticScene: {
    patterns: [
      /^[^。]{50,}(是|有|在)[^。]{50,}。$/,
    ],
    problem: '场景描写过于静态，缺乏生命力',
    suggestion: '加入动态元素（风吹、光影变化、人物活动）让场景"活"起来',
  },
};

/** 五感使用检测 */
const SENSE_PATTERNS = {
  visual: [
    /看(到|见|着)/,
    /(颜色|光|影|形状|大小|高|矮|胖|瘦)/,
    /(红|橙|黄|绿|青|蓝|紫|黑|白|灰)色/,
    /(明亮|昏暗|闪烁|耀眼)/,
  ],
  auditory: [
    /听(到|见)/,
    /(声音|响|叫|喊|吼|啸|鸣|响)/,
    /(轰|砰|咔|嗒|哗|沙|嘶|呼)/,
    /(安静|嘈杂|喧闹|寂静)/,
  ],
  olfactory: [
    /闻(到|着)/,
    /(香|臭|腥|腐|清新|芬芳)/,
    /(气味|味道|香气|臭味)/,
  ],
  gustatory: [
    /尝(到|着)/,
    /(甜|酸|苦|辣|咸|鲜|涩)/,
    /(味道|滋味|口感)/,
  ],
  tactile: [
    /触(到|摸|碰)/,
    /(冷|热|温|凉|烫|冰)/,
    /(软|硬|粗|细|滑|糙)/,
    /(疼|痛|麻|痒|酸|胀)/,
  ],
};

// ============ 分析函数 ============

/**
 * 分析文本的五感使用情况
 */
export function analyzeSenseUsage(text: string): StyleAnalysis['senseUsage'] {
  const usage = {
    visual: 0,
    auditory: 0,
    olfactory: 0,
    gustatory: 0,
    tactile: 0,
  };

  for (const [sense, patterns] of Object.entries(SENSE_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) {
        usage[sense as keyof typeof usage] += matches.length;
      }
    }
  }

  return usage;
}

/**
 * 检测对话质量
 */
export function analyzeDialogueQuality(text: string): { score: number; issues: WritingIssue[] } {
  const issues: WritingIssue[] = [];
  let score = 100;

  // 提取所有对话（支持中英文引号）
  const dialogues = text.match(/["""「『][^"""」』]+[」』"""]/g) || [];
  
  if (dialogues.length === 0) {
    return { score: 100, issues: [] };
  }

  // 检测水对话
  let waterCount = 0;
  for (const dialogue of dialogues) {
    for (const pattern of DIALOGUE_ISSUES.waterDialogue.patterns) {
      if (pattern.test(dialogue)) {
        waterCount++;
        const index = text.indexOf(dialogue);
        issues.push({
          type: 'dialogue',
          severity: 'minor',
          position: { start: index, end: index + dialogue.length },
          context: dialogue,
          problem: DIALOGUE_ISSUES.waterDialogue.problem,
          suggestion: DIALOGUE_ISSUES.waterDialogue.suggestion,
          example: '改为有信息量的对话，如："你知道那个秘密吗？"',
        });
        score -= 5; // 每个水对话扣5分
      }
    }
  }

  // 检测说明书对话
  for (const pattern of DIALOGUE_ISSUES.expositoryDialogue.patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      issues.push({
        type: 'dialogue',
        severity: 'major',
        position: { start: match.index!, end: match.index! + match[0].length },
        context: match[0].slice(0, 100) + '...',
        problem: DIALOGUE_ISSUES.expositoryDialogue.problem,
        suggestion: DIALOGUE_ISSUES.expositoryDialogue.suggestion,
        example: '拆分为："这个..."他顿了顿，"原理很复杂。"',
      });
      score -= 10;
    }
  }

  // 水对话扣分
  const waterRatio = waterCount / dialogues.length;
  score -= Math.floor(waterRatio * 30);

  return { score: Math.max(0, score), issues };
}

/**
 * 检测动作描写质量
 */
export function analyzeActionQuality(text: string): { score: number; issues: WritingIssue[] } {
  const issues: WritingIssue[] = [];
  let score = 100;

  // 检测平铺直叙
  for (const pattern of ACTION_ISSUES.flatNarration.patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      issues.push({
        type: 'action',
        severity: 'minor',
        position: { start: match.index!, end: match.index! + match[0].length },
        context: match[0],
        problem: ACTION_ISSUES.flatNarration.problem,
        suggestion: ACTION_ISSUES.flatNarration.suggestion,
        example: '改为："他脚下一蹬，身形如箭般射出"',
      });
      score -= 5; // 每个平铺直叙扣5分
    }
  }

  // 检测节奏单调
  for (const pattern of ACTION_ISSUES.lackRhythm.patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      issues.push({
        type: 'action',
        severity: 'major',
        position: { start: match.index!, end: match.index! + match[0].length },
        context: match[0].slice(0, 100) + '...',
        problem: ACTION_ISSUES.lackRhythm.problem,
        suggestion: ACTION_ISSUES.lackRhythm.suggestion,
        example: '变化句式长度，制造节奏感',
      });
      score -= 10;
    }
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 检测场景描写质量
 */
export function analyzeSceneQuality(text: string): { score: number; issues: WritingIssue[] } {
  const issues: WritingIssue[] = [];
  let score = 100;

  // 检测缺乏细节
  for (const pattern of SCENE_ISSUES.lackDetail.patterns) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      issues.push({
        type: 'scene',
        severity: 'major',
        position: { start: match.index!, end: match.index! + match[0].length },
        context: match[0],
        problem: SCENE_ISSUES.lackDetail.problem,
        suggestion: SCENE_ISSUES.lackDetail.suggestion,
        example: '改为具体描写："青石板路蜿蜒向前，两旁古树参天，阳光透过枝叶洒下斑驳光影"',
      });
      score -= 10;
    }
  }

  return { score: Math.max(0, score), issues };
}

/**
 * 综合分析写作风格
 */
export function analyzeWritingStyle(text: string): StyleAnalysis {
  const senseUsage = analyzeSenseUsage(text);
  const dialogueAnalysis = analyzeDialogueQuality(text);
  const actionAnalysis = analyzeActionQuality(text);
  const sceneAnalysis = analyzeSceneQuality(text);

  const allIssues = [
    ...dialogueAnalysis.issues,
    ...actionAnalysis.issues,
    ...sceneAnalysis.issues,
  ];

  // 计算五感使用均衡度
  const senseValues = Object.values(senseUsage);
  const senseTotal = senseValues.reduce((a, b) => a + b, 0);
  const senseBalance = senseTotal > 0 
    ? 100 - (Math.max(...senseValues) - Math.min(...senseValues)) / senseTotal * 100
    : 0;

  // 综合评分
  const score = Math.floor(
    (dialogueAnalysis.score * 0.3 +
     actionAnalysis.score * 0.3 +
     sceneAnalysis.score * 0.2 +
     senseBalance * 0.2)
  );

  // 生成优势和改进建议
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (dialogueAnalysis.score >= 80) strengths.push('对话质量较高，推动剧情有力');
  else improvements.push('优化对话，减少水分，增加信息量');

  if (actionAnalysis.score >= 80) strengths.push('动作描写生动，有画面感');
  else improvements.push('增强动作描写的镜头感和节奏变化');

  if (sceneAnalysis.score >= 80) strengths.push('场景描写细腻，氛围营造到位');
  else improvements.push('丰富场景细节，增加五感描写');

  if (senseUsage.visual > 5) strengths.push('视觉描写丰富');
  if (senseUsage.auditory < 2) improvements.push('增加听觉描写，丰富感官体验');
  if (senseUsage.olfactory < 1 && senseUsage.gustatory < 1 && senseUsage.tactile < 2) {
    improvements.push('增加嗅觉、味觉、触觉描写，提升沉浸感');
  }

  return {
    score,
    issues: allIssues,
    strengths,
    improvements,
    senseUsage,
    dialogueQuality: dialogueAnalysis.score,
    actionQuality: actionAnalysis.score,
    sceneQuality: sceneAnalysis.score,
  };
}

/**
 * 生成风格增强提示词
 */
export function generateEnhancementPrompt(
  text: string,
  analysis: StyleAnalysis,
  options: EnhancementOptions = {}
): string {
  const { focusAreas = [], targetStyle = 'immersive', senseEmphasis = [] } = options;

  let prompt = '请优化以下文本的写作风格，重点改进：\n\n';

  // 根据分析结果生成针对性建议
  if (analysis.dialogueQuality < 80 || focusAreas.includes('dialogue')) {
    prompt += '【对话优化】\n';
    prompt += '- 删除无意义的日常寒暄\n';
    prompt += '- 每句对话都要推动剧情或展现性格\n';
    prompt += '- 拆分过长的说明性对话，用动作打断\n';
    prompt += '- 根据角色性格调整说话方式\n\n';
  }

  if (analysis.actionQuality < 80 || focusAreas.includes('action')) {
    prompt += '【动作描写】\n';
    prompt += '- 增加动作细节和力量感\n';
    prompt += '- 用短句制造紧张节奏，长句营造舒缓氛围\n';
    prompt += '- 加入镜头感，让读者"看到"动作\n\n';
  }

  if (analysis.sceneQuality < 70 || focusAreas.includes('scene')) {
    prompt += '【场景渲染】\n';
    prompt += '- 用具体细节替代笼统形容\n';
    prompt += '- 加入动态元素（风、光影、人物活动）\n';
    prompt += '- 通过环境烘托情绪和氛围\n\n';
  }

  // 五感强化
  const weakSenses = Object.entries(analysis.senseUsage)
    .filter(([_, count]) => count < 2)
    .map(([sense]) => sense);

  if (weakSenses.length > 0 || focusAreas.includes('sense')) {
    prompt += '【五感描写】\n';
    if (weakSenses.includes('auditory') || senseEmphasis.includes('auditory')) {
      prompt += '- 增加听觉描写（声音、音效、环境音）\n';
    }
    if (weakSenses.includes('olfactory') || senseEmphasis.includes('olfactory')) {
      prompt += '- 增加嗅觉描写（气味、香气、特殊味道）\n';
    }
    if (weakSenses.includes('tactile') || senseEmphasis.includes('tactile')) {
      prompt += '- 增加触觉描写（温度、质感、痛感）\n';
    }
    prompt += '\n';
  }

  // 目标风格
  const styleGuides = {
    cinematic: '采用电影镜头般的描写，注重画面感和节奏',
    literary: '采用文学化的表达，注重意境和韵味',
    'fast-paced': '采用快节奏叙事，短句为主，信息密集',
    immersive: '采用沉浸式描写，丰富五感，让读者身临其境',
  };

  prompt += `【目标风格】${styleGuides[targetStyle]}\n\n`;
  prompt += '原文：\n' + text;

  return prompt;
}

/**
 * 生成写作风格报告
 */
export function generateStyleReport(analysis: StyleAnalysis): string {
  let report = '# 写作风格分析报告\n\n';
  report += `## 综合评分：${analysis.score}/100\n\n`;

  // 各项评分
  report += '## 分项评分\n\n';
  report += `- 对话质量：${analysis.dialogueQuality}/100\n`;
  report += `- 动作描写：${analysis.actionQuality}/100\n`;
  report += `- 场景渲染：${analysis.sceneQuality}/100\n\n`;

  // 五感使用
  report += '## 五感使用情况\n\n';
  report += `- 视觉：${analysis.senseUsage.visual} 次\n`;
  report += `- 听觉：${analysis.senseUsage.auditory} 次\n`;
  report += `- 嗅觉：${analysis.senseUsage.olfactory} 次\n`;
  report += `- 味觉：${analysis.senseUsage.gustatory} 次\n`;
  report += `- 触觉：${analysis.senseUsage.tactile} 次\n\n`;

  // 优势
  if (analysis.strengths.length > 0) {
    report += '## ✅ 优势\n\n';
    analysis.strengths.forEach(s => report += `- ${s}\n`);
    report += '\n';
  }

  // 改进建议
  if (analysis.improvements.length > 0) {
    report += '## 📈 改进建议\n\n';
    analysis.improvements.forEach(i => report += `- ${i}\n`);
    report += '\n';
  }

  // 具体问题
  if (analysis.issues.length > 0) {
    report += '## 🔍 具体问题\n\n';
    const criticalIssues = analysis.issues.filter(i => i.severity === 'critical');
    const majorIssues = analysis.issues.filter(i => i.severity === 'major');
    const minorIssues = analysis.issues.filter(i => i.severity === 'minor');

    if (criticalIssues.length > 0) {
      report += `### 严重问题 (${criticalIssues.length})\n\n`;
      criticalIssues.slice(0, 3).forEach(issue => {
        report += `**${issue.problem}**\n`;
        report += `位置：${issue.context}\n`;
        report += `建议：${issue.suggestion}\n`;
        if (issue.example) report += `示例：${issue.example}\n`;
        report += '\n';
      });
    }

    if (majorIssues.length > 0) {
      report += `### 主要问题 (${majorIssues.length})\n\n`;
      majorIssues.slice(0, 5).forEach(issue => {
        report += `**${issue.problem}**\n`;
        report += `建议：${issue.suggestion}\n\n`;
      });
    }

    if (minorIssues.length > 0) {
      report += `### 次要问题 (${minorIssues.length})\n\n`;
      report += `共发现 ${minorIssues.length} 处可优化的地方\n\n`;
    }
  }

  return report;
}
