/**
 * 情节张力分析器 - 检测冲突、悬念、转折、高潮
 * 
 * 核心能力：
 * 1. 冲突强度检测（人物冲突、环境冲突、内心冲突）
 * 2. 悬念设置评估（疑问句、未解之谜、危机预告）
 * 3. 转折点识别（反转、意外、揭秘）
 * 4. 高潮布局分析（情绪峰值、冲突爆发、结局走向）
 * 5. 节奏控制评估（张弛有度、波浪式推进）
 */

// ============ 类型定义 ============

export interface TensionIssue {
  type: 'conflict' | 'suspense' | 'twist' | 'climax' | 'pacing';
  severity: 'critical' | 'major' | 'minor';
  position: { start: number; end: number };
  context: string;
  problem: string;
  suggestion: string;
  example?: string;
}

export interface ConflictAnalysis {
  intensity: number; // 0-100
  types: {
    interpersonal: number; // 人物冲突
    environmental: number; // 环境冲突
    internal: number; // 内心冲突
  };
  conflicts: Array<{
    type: string;
    description: string;
    position: number;
  }>;
}

export interface SuspenseAnalysis {
  effectiveness: number; // 0-100
  count: number;
  suspenses: Array<{
    type: 'question' | 'mystery' | 'crisis' | 'foreshadowing';
    content: string;
    position: number;
    resolved: boolean;
  }>;
}

export interface TwistAnalysis {
  count: number;
  quality: number; // 0-100
  twists: Array<{
    type: 'reversal' | 'surprise' | 'revelation';
    description: string;
    position: number;
    impact: 'small' | 'medium' | 'large';
  }>;
}

export interface ClimaxAnalysis {
  hasClimax: boolean;
  position: number;
  intensity: number; // 0-100
  buildup: number; // 铺垫充分度 0-100
  resolution: number; // 解决完整度 0-100
}

export interface PacingAnalysis {
  score: number; // 0-100
  rhythm: 'too-fast' | 'balanced' | 'too-slow';
  sentenceLengthVariation: number; // 句式长度变化度
  paragraphDensity: number; // 段落密度
  breathingSpace: number; // 呼吸感 0-100
}

export interface PlotTensionAnalysis {
  overallScore: number; // 0-100
  conflict: ConflictAnalysis;
  suspense: SuspenseAnalysis;
  twist: TwistAnalysis;
  climax: ClimaxAnalysis;
  pacing: PacingAnalysis;
  issues: TensionIssue[];
  strengths: string[];
  improvements: string[];
}

// ============ 检测模式 ============

/** 冲突关键词 */
const CONFLICT_PATTERNS = {
  interpersonal: [
    /对抗|对峙|冲突|争执|争吵|打斗|战斗|厮杀|较量/,
    /敌人|仇人|对手|敌对|仇恨|报复|复仇/,
    /威胁|挑衅|嘲讽|羞辱|侮辱|欺负|压迫/,
    /阻止|阻挠|妨碍|破坏|陷害|暗算/,
  ],
  environmental: [
    /危险|危机|困境|绝境|险境|死地/,
    /灾难|灾害|天灾|劫难|浩劫/,
    /追杀|追捕|围攻|包围|陷阱/,
    /时间紧迫|迫在眉睫|刻不容缓|千钧一发/,
  ],
  internal: [
    /挣扎|纠结|矛盾|犹豫|迷茫|困惑/,
    /痛苦|煎熬|折磨|挣扎|内疚|自责/,
    /选择|抉择|两难|进退两难|左右为难/,
    /恐惧|害怕|担心|忧虑|不安|焦虑/,
  ],
};

/** 悬念关键词 */
const SUSPENSE_PATTERNS = {
  question: [
    /[？?]$/,
    /到底|究竟|为什么|怎么回事|什么原因/,
    /难道|莫非|是否|会不会|能不能/,
  ],
  mystery: [
    /秘密|谜团|疑团|谜底|真相|隐藏/,
    /神秘|诡异|奇怪|蹊跷|不对劲/,
    /不知道|不清楚|不明白|搞不懂|想不通/,
  ],
  crisis: [
    /危险|危机|麻烦|大事不好|不妙/,
    /来不及|太晚了|完了|糟了|坏了/,
    /必须|一定要|不得不|只能|别无选择/,
  ],
  foreshadowing: [
    /预感|感觉|似乎|好像|仿佛/,
    /将要|即将|马上|很快|不久/,
    /不祥|不安|预兆|征兆|暗示/,
  ],
};

/** 转折关键词 */
const TWIST_PATTERNS = {
  reversal: [
    /然而|但是|可是|不料|谁知|岂料/,
    /突然|忽然|猛然|陡然|骤然/,
    /没想到|想不到|出乎意料|始料未及/,
  ],
  surprise: [
    /竟然|居然|竟|竟是|原来是/,
    /震惊|惊讶|惊愕|愕然|错愕/,
    /不可能|怎么可能|这不可能/,
  ],
  revelation: [
    /原来|其实|实际上|事实上|真相是/,
    /揭开|揭露|揭穿|暴露|发现/,
    /真正的|真实的|背后的|隐藏的/,
  ],
};

/** 高潮关键词 */
const CLIMAX_PATTERNS = [
  /决战|决斗|最终|终极|巅峰/,
  /生死|存亡|成败|胜负|关键/,
  /爆发|迸发|释放|倾泻|宣泄/,
  /极致|极限|顶点|巅峰|最强/,
];

// ============ 分析函数 ============

/**
 * 分析冲突强度
 */
export function analyzeConflict(text: string): ConflictAnalysis {
  const conflicts: ConflictAnalysis['conflicts'] = [];
  const types = {
    interpersonal: 0,
    environmental: 0,
    internal: 0,
  };

  // 检测人物冲突
  for (const pattern of CONFLICT_PATTERNS.interpersonal) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      types.interpersonal++;
      conflicts.push({
        type: 'interpersonal',
        description: match[0],
        position: match.index!,
      });
    }
  }

  // 检测环境冲突
  for (const pattern of CONFLICT_PATTERNS.environmental) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      types.environmental++;
      conflicts.push({
        type: 'environmental',
        description: match[0],
        position: match.index!,
      });
    }
  }

  // 检测内心冲突
  for (const pattern of CONFLICT_PATTERNS.internal) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      types.internal++;
      conflicts.push({
        type: 'internal',
        description: match[0],
        position: match.index!,
      });
    }
  }

  // 计算冲突强度（每1000字至少2-3个冲突点）
  const textLength = text.length;
  const conflictDensity = (conflicts.length / textLength) * 1000;
  const intensity = Math.min(100, Math.floor(conflictDensity * 40));

  return {
    intensity,
    types,
    conflicts,
  };
}

/**
 * 分析悬念设置
 */
export function analyzeSuspense(text: string): SuspenseAnalysis {
  const suspenses: SuspenseAnalysis['suspenses'] = [];

  // 检测疑问句
  for (const pattern of SUSPENSE_PATTERNS.question) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      suspenses.push({
        type: 'question',
        content: match[0],
        position: match.index!,
        resolved: false,
      });
    }
  }

  // 检测未解之谜
  for (const pattern of SUSPENSE_PATTERNS.mystery) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      suspenses.push({
        type: 'mystery',
        content: match[0],
        position: match.index!,
        resolved: false,
      });
    }
  }

  // 检测危机预告
  for (const pattern of SUSPENSE_PATTERNS.crisis) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      suspenses.push({
        type: 'crisis',
        content: match[0],
        position: match.index!,
        resolved: false,
      });
    }
  }

  // 检测伏笔
  for (const pattern of SUSPENSE_PATTERNS.foreshadowing) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      suspenses.push({
        type: 'foreshadowing',
        content: match[0],
        position: match.index!,
        resolved: false,
      });
    }
  }

  // 计算悬念有效性（每章至少1-2个悬念）
  const textLength = text.length;
  const suspenseDensity = (suspenses.length / textLength) * 3000;
  const effectiveness = Math.min(100, Math.floor(suspenseDensity * 50));

  return {
    effectiveness,
    count: suspenses.length,
    suspenses,
  };
}

/**
 * 分析转折点
 */
export function analyzeTwist(text: string): TwistAnalysis {
  const twists: TwistAnalysis['twists'] = [];

  // 检测反转
  for (const pattern of TWIST_PATTERNS.reversal) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      twists.push({
        type: 'reversal',
        description: match[0],
        position: match.index!,
        impact: 'medium',
      });
    }
  }

  // 检测意外
  for (const pattern of TWIST_PATTERNS.surprise) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      twists.push({
        type: 'surprise',
        description: match[0],
        position: match.index!,
        impact: 'medium',
      });
    }
  }

  // 检测揭秘
  for (const pattern of TWIST_PATTERNS.revelation) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      twists.push({
        type: 'revelation',
        description: match[0],
        position: match.index!,
        impact: 'large',
      });
    }
  }

  // 计算转折质量（每3000字至少1个转折）
  const textLength = text.length;
  const twistDensity = (twists.length / textLength) * 3000;
  const quality = Math.min(100, Math.floor(twistDensity * 80));

  return {
    count: twists.length,
    quality,
    twists,
  };
}

/**
 * 分析高潮布局
 */
export function analyzeClimax(text: string): ClimaxAnalysis {
  let hasClimax = false;
  let position = -1;
  let intensity = 0;

  // 检测高潮关键词
  for (const pattern of CLIMAX_PATTERNS) {
    const matches = text.matchAll(new RegExp(pattern, 'g'));
    for (const match of matches) {
      hasClimax = true;
      if (position === -1) {
        position = match.index!;
      }
      intensity += 10;
    }
  }

  intensity = Math.min(100, intensity);

  // 评估铺垫充分度（高潮应该在后半部分）
  const textLength = text.length;
  const climaxPosition = position / textLength;
  const buildup = climaxPosition > 0.6 ? 80 : Math.floor(climaxPosition * 100);

  // 评估解决完整度（高潮后应该有收尾）
  const afterClimax = text.slice(position);
  const resolution = afterClimax.length > textLength * 0.1 ? 80 : 40;

  return {
    hasClimax,
    position,
    intensity,
    buildup,
    resolution,
  };
}

/**
 * 分析节奏控制
 */
export function analyzePacing(text: string): PacingAnalysis {
  // 分句
  const sentences = text.split(/[。！？!?]/);
  const validSentences = sentences.filter(s => s.trim().length > 0);

  // 处理空文本
  if (validSentences.length === 0) {
    return {
      score: 0,
      rhythm: 'balanced',
      sentenceLengthVariation: 0,
      paragraphDensity: 0,
      breathingSpace: 0,
    };
  }

  // 计算句式长度变化度
  const lengths = validSentences.map(s => s.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  const sentenceLengthVariation = avgLength > 0 ? Math.min(100, Math.floor((stdDev / avgLength) * 100)) : 0;

  // 分段
  const paragraphs = text.split(/\n\n+/);
  const validParagraphs = paragraphs.filter(p => p.trim().length > 0);

  // 计算段落密度
  const avgParagraphLength = validParagraphs.length > 0 ? text.length / validParagraphs.length : 0;
  const paragraphDensity = avgParagraphLength > 300 ? 50 : Math.floor((avgParagraphLength / 300) * 100);

  // 计算呼吸感（短句和长句的比例）
  const shortSentences = lengths.filter(l => l < 20).length;
  const longSentences = lengths.filter(l => l > 50).length;
  const breathingSpace = Math.floor((shortSentences / validSentences.length) * 100);

  // 判断节奏
  let rhythm: PacingAnalysis['rhythm'] = 'balanced';
  if (avgLength < 15) rhythm = 'too-fast';
  if (avgLength > 30) rhythm = 'too-slow';

  // 综合评分
  const score = Math.floor((sentenceLengthVariation + paragraphDensity + breathingSpace) / 3);

  return {
    score,
    rhythm,
    sentenceLengthVariation,
    paragraphDensity,
    breathingSpace,
  };
}

/**
 * 综合分析情节张力
 */
export function analyzePlotTension(text: string): PlotTensionAnalysis {
  const conflict = analyzeConflict(text);
  const suspense = analyzeSuspense(text);
  const twist = analyzeTwist(text);
  const climax = analyzeClimax(text);
  const pacing = analyzePacing(text);

  const issues: TensionIssue[] = [];
  const strengths: string[] = [];
  const improvements: string[] = [];

  // 冲突评估
  if (conflict.intensity >= 70) {
    strengths.push('冲突设置充分，张力十足');
  } else if (conflict.intensity < 40) {
    improvements.push('增加冲突点，提升情节张力');
    issues.push({
      type: 'conflict',
      severity: 'major',
      position: { start: 0, end: text.length },
      context: '全文',
      problem: '冲突强度不足，情节平淡',
      suggestion: '增加人物对抗、环境危机或内心挣扎',
      example: '制造对手挑衅、时间紧迫、两难抉择等冲突',
    });
  }

  // 悬念评估
  if (suspense.effectiveness >= 70) {
    strengths.push('悬念设置有效，吸引读者');
  } else if (suspense.effectiveness < 40) {
    improvements.push('增加悬念设置，制造期待感');
    issues.push({
      type: 'suspense',
      severity: 'major',
      position: { start: 0, end: text.length },
      context: '全文',
      problem: '悬念不足，缺乏吸引力',
      suggestion: '在章节末尾设置疑问、危机或伏笔',
      example: '用疑问句、未解之谜、危机预告制造悬念',
    });
  }

  // 转折评估
  if (twist.count >= 2) {
    strengths.push('转折设置合理，情节曲折');
  } else if (twist.count === 0) {
    improvements.push('增加转折点，避免情节单调');
    issues.push({
      type: 'twist',
      severity: 'minor',
      position: { start: 0, end: text.length },
      context: '全文',
      problem: '缺乏转折，情节过于平直',
      suggestion: '设置反转、意外或揭秘',
      example: '用"然而""没想到""原来"等词引导转折',
    });
  }

  // 高潮评估
  if (climax.hasClimax && climax.intensity >= 60) {
    strengths.push('高潮设置到位，情绪饱满');
  } else if (!climax.hasClimax) {
    improvements.push('设置明确的高潮点');
    issues.push({
      type: 'climax',
      severity: 'critical',
      position: { start: 0, end: text.length },
      context: '全文',
      problem: '缺乏高潮，情节缺少爆发点',
      suggestion: '在适当位置设置冲突爆发、情绪宣泄的高潮',
      example: '决战、揭秘、生死关头等高潮场景',
    });
  }

  // 节奏评估
  if (pacing.score >= 70) {
    strengths.push('节奏控制得当，张弛有度');
  } else {
    if (pacing.rhythm === 'too-fast') {
      improvements.push('适当放慢节奏，增加描写和铺垫');
    } else if (pacing.rhythm === 'too-slow') {
      improvements.push('加快节奏，减少冗余描写');
    }
    if (pacing.sentenceLengthVariation < 30) {
      improvements.push('变化句式长度，制造节奏感');
    }
  }

  // 综合评分
  const overallScore = Math.floor(
    (conflict.intensity * 0.25 +
     suspense.effectiveness * 0.25 +
     twist.quality * 0.2 +
     (climax.hasClimax ? climax.intensity : 0) * 0.15 +
     pacing.score * 0.15)
  );

  // 处理NaN情况
  const finalScore = isNaN(overallScore) ? 0 : overallScore;

  return {
    overallScore: finalScore,
    conflict,
    suspense,
    twist,
    climax,
    pacing,
    issues,
    strengths,
    improvements,
  };
}

/**
 * 生成情节张力报告
 */
export function generateTensionReport(analysis: PlotTensionAnalysis): string {
  let report = '# 情节张力分析报告\n\n';
  report += `## 综合评分：${analysis.overallScore}/100\n\n`;

  // 分项评分
  report += '## 分项评分\n\n';
  report += `- 冲突强度：${analysis.conflict.intensity}/100\n`;
  report += `  - 人物冲突：${analysis.conflict.types.interpersonal} 处\n`;
  report += `  - 环境冲突：${analysis.conflict.types.environmental} 处\n`;
  report += `  - 内心冲突：${analysis.conflict.types.internal} 处\n`;
  report += `- 悬念有效性：${analysis.suspense.effectiveness}/100 (${analysis.suspense.count} 处)\n`;
  report += `- 转折质量：${analysis.twist.quality}/100 (${analysis.twist.count} 处)\n`;
  report += `- 高潮强度：${analysis.climax.hasClimax ? analysis.climax.intensity : 0}/100\n`;
  report += `- 节奏控制：${analysis.pacing.score}/100 (${analysis.pacing.rhythm})\n\n`;

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
      criticalIssues.forEach(issue => {
        report += `**${issue.problem}**\n`;
        report += `建议：${issue.suggestion}\n`;
        if (issue.example) report += `示例：${issue.example}\n`;
        report += '\n';
      });
    }

    if (majorIssues.length > 0) {
      report += `### 主要问题 (${majorIssues.length})\n\n`;
      majorIssues.forEach(issue => {
        report += `**${issue.problem}**\n`;
        report += `建议：${issue.suggestion}\n\n`;
      });
    }

    if (minorIssues.length > 0) {
      report += `### 次要问题 (${minorIssues.length})\n\n`;
      minorIssues.forEach(issue => {
        report += `- ${issue.problem}\n`;
      });
      report += '\n';
    }
  }

  return report;
}

/**
 * 生成情节优化提示词
 */
export function generateTensionPrompt(text: string, analysis: PlotTensionAnalysis): string {
  let prompt = '请优化以下文本的情节张力，重点改进：\n\n';

  if (analysis.conflict.intensity < 60) {
    prompt += '【冲突设置】\n';
    prompt += '- 增加人物对抗、环境危机或内心挣扎\n';
    prompt += '- 制造对手挑衅、时间紧迫、两难抉择等冲突\n';
    prompt += '- 冲突要有层次，从小冲突到大冲突逐步升级\n\n';
  }

  if (analysis.suspense.effectiveness < 60) {
    prompt += '【悬念制造】\n';
    prompt += '- 在章节末尾设置疑问、危机或伏笔\n';
    prompt += '- 用疑问句、未解之谜、危机预告制造悬念\n';
    prompt += '- 悬念要有回收，不能只埋不挖\n\n';
  }

  if (analysis.twist.count < 2) {
    prompt += '【转折设计】\n';
    prompt += '- 设置反转、意外或揭秘\n';
    prompt += '- 用"然而""没想到""原来"等词引导转折\n';
    prompt += '- 转折要合理，有铺垫支撑\n\n';
  }

  if (!analysis.climax.hasClimax) {
    prompt += '【高潮布局】\n';
    prompt += '- 在适当位置设置冲突爆发、情绪宣泄的高潮\n';
    prompt += '- 高潮前要有充分铺垫，高潮后要有收尾\n';
    prompt += '- 决战、揭秘、生死关头等高潮场景\n\n';
  }

  if (analysis.pacing.score < 60) {
    prompt += '【节奏控制】\n';
    if (analysis.pacing.rhythm === 'too-fast') {
      prompt += '- 适当放慢节奏，增加描写和铺垫\n';
    } else if (analysis.pacing.rhythm === 'too-slow') {
      prompt += '- 加快节奏，减少冗余描写\n';
    }
    prompt += '- 变化句式长度，制造节奏感\n';
    prompt += '- 紧张场景用短句，舒缓场景用长句\n\n';
  }

  prompt += '原文：\n' + text;

  return prompt;
}
