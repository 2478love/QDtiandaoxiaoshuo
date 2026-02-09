/**
 * 节奏建议系统
 * 
 * 功能：
 * - 分析当前节奏（快/慢）
 * - 建议下一章节奏调整
 * - 爽点分布优化建议
 * - 情绪曲线平衡建议
 */

export interface PacingAnalysis {
  currentPacing: 'very-slow' | 'slow' | 'medium' | 'fast' | 'very-fast';
  pacingScore: number; // 0-100
  issues: PacingIssue[];
  strengths: string[];
  recommendations: PacingRecommendation[];
}

export interface PacingIssue {
  type: 'too-slow' | 'too-fast' | 'inconsistent' | 'monotonous';
  description: string;
  severity: 'low' | 'medium' | 'high';
  affectedSections: string[];
}

export interface PacingRecommendation {
  type: 'speed-up' | 'slow-down' | 'add-variety' | 'balance';
  title: string;
  description: string;
  priority: number; // 1-10
  actionItems: string[];
}

export interface CoolPointDistributionAnalysis {
  totalCoolPoints: number;
  density: number; // 每章平均爽点数
  distribution: number[]; // 每章爽点数
  gaps: number[]; // 爽点间隔（章节数）
  recommendations: string[];
}

export interface EmotionCurveAnalysis {
  curve: number[]; // 情绪强度曲线 -100 到 100
  balance: number; // 平衡度 0-100
  variety: number; // 多样性 0-100
  peaks: number[]; // 高潮位置
  valleys: number[]; // 低谷位置
  recommendations: string[];
}

export interface ChapterPacingData {
  chapterNumber: number;
  wordCount: number;
  dialogueRatio: number; // 对话占比
  actionRatio: number; // 动作占比
  descriptionRatio: number; // 描写占比
  coolPointCount: number;
  emotionIntensity: number; // -100 到 100
}

/**
 * 分析当前节奏
 */
export function analyzePacing(chapters: ChapterPacingData[]): PacingAnalysis {
  if (chapters.length === 0) {
    return {
      currentPacing: 'medium',
      pacingScore: 50,
      issues: [],
      strengths: [],
      recommendations: [],
    };
  }

  const recentChapters = chapters.slice(-5);
  const avgDialogue = recentChapters.reduce((sum, ch) => sum + ch.dialogueRatio, 0) / recentChapters.length;
  const avgAction = recentChapters.reduce((sum, ch) => sum + ch.actionRatio, 0) / recentChapters.length;
  const avgCoolPoints = recentChapters.reduce((sum, ch) => sum + ch.coolPointCount, 0) / recentChapters.length;

  // 计算节奏
  let pacingScore = 50;
  pacingScore += avgAction * 30; // 动作多=快
  pacingScore += avgCoolPoints * 10; // 爽点多=快
  pacingScore -= (1 - avgDialogue - avgAction) * 20; // 描写多=慢

  pacingScore = Math.max(0, Math.min(100, pacingScore));

  let currentPacing: PacingAnalysis['currentPacing'];
  if (pacingScore < 30) currentPacing = 'very-slow';
  else if (pacingScore < 45) currentPacing = 'slow';
  else if (pacingScore < 65) currentPacing = 'medium';
  else if (pacingScore < 80) currentPacing = 'fast';
  else currentPacing = 'very-fast';

  const issues = detectPacingIssues(chapters);
  const strengths = detectPacingStrengths(chapters);
  const recommendations = generatePacingRecommendations(chapters, currentPacing, issues);

  return {
    currentPacing,
    pacingScore,
    issues,
    strengths,
    recommendations,
  };
}

/**
 * 检测节奏问题
 */
function detectPacingIssues(chapters: ChapterPacingData[]): PacingIssue[] {
  const issues: PacingIssue[] = [];
  const recentChapters = chapters.slice(-5);

  // 检查是否过慢
  const slowChapters = recentChapters.filter(ch => 
    ch.actionRatio < 0.2 && ch.coolPointCount === 0
  );
  if (slowChapters.length >= 3) {
    issues.push({
      type: 'too-slow',
      description: '最近章节节奏过慢，缺乏动作和爽点',
      severity: 'high',
      affectedSections: slowChapters.map(ch => `第${ch.chapterNumber}章`),
    });
  }

  // 检查是否过快
  const fastChapters = recentChapters.filter(ch => 
    ch.actionRatio > 0.7 && ch.descriptionRatio < 0.1
  );
  if (fastChapters.length >= 3) {
    issues.push({
      type: 'too-fast',
      description: '节奏过快，缺乏必要的描写和铺垫',
      severity: 'medium',
      affectedSections: fastChapters.map(ch => `第${ch.chapterNumber}章`),
    });
  }

  // 检查是否单调
  const pacingVariance = calculateVariance(recentChapters.map(ch => ch.actionRatio));
  if (pacingVariance < 0.01) {
    issues.push({
      type: 'monotonous',
      description: '节奏过于单调，缺乏变化',
      severity: 'medium',
      affectedSections: ['最近5章'],
    });
  }

  return issues;
}

/**
 * 检测节奏优点
 */
function detectPacingStrengths(chapters: ChapterPacingData[]): string[] {
  const strengths: string[] = [];
  const recentChapters = chapters.slice(-5);

  const avgCoolPoints = recentChapters.reduce((sum, ch) => sum + ch.coolPointCount, 0) / recentChapters.length;
  if (avgCoolPoints >= 1) {
    strengths.push('爽点密度适中，保持读者兴趣');
  }

  const pacingVariance = calculateVariance(recentChapters.map(ch => ch.actionRatio));
  if (pacingVariance > 0.05) {
    strengths.push('节奏富有变化，张弛有度');
  }

  return strengths;
}

/**
 * 生成节奏建议
 */
function generatePacingRecommendations(
  chapters: ChapterPacingData[],
  currentPacing: PacingAnalysis['currentPacing'],
  issues: PacingIssue[]
): PacingRecommendation[] {
  const recommendations: PacingRecommendation[] = [];

  if (currentPacing === 'very-slow' || currentPacing === 'slow') {
    recommendations.push({
      type: 'speed-up',
      title: '加快节奏',
      description: '当前节奏偏慢，建议增加动作和冲突',
      priority: 8,
      actionItems: [
        '增加动作场景和战斗描写',
        '减少冗长的环境描写',
        '加入突发事件或转折',
        '增加对话的紧张感',
        '每2-3章安排一个爽点',
      ],
    });
  }

  if (currentPacing === 'very-fast' || currentPacing === 'fast') {
    recommendations.push({
      type: 'slow-down',
      title: '适当放缓',
      description: '节奏过快可能导致读者疲劳',
      priority: 7,
      actionItems: [
        '增加必要的场景描写',
        '加入角色内心活动',
        '安排轻松的日常场景',
        '深化人物关系',
        '为后续剧情做铺垫',
      ],
    });
  }

  if (issues.some(i => i.type === 'monotonous')) {
    recommendations.push({
      type: 'add-variety',
      title: '增加变化',
      description: '节奏过于单调，需要增加起伏',
      priority: 9,
      actionItems: [
        '交替使用快慢节奏',
        '在紧张场景后安排缓和章节',
        '变换场景和氛围',
        '调整对话和动作的比例',
      ],
    });
  }

  return recommendations;
}

/**
 * 分析爽点分布
 */
export function analyzeCoolPointDistribution(chapters: ChapterPacingData[]): CoolPointDistributionAnalysis {
  const distribution = chapters.map(ch => ch.coolPointCount);
  const totalCoolPoints = distribution.reduce((sum, count) => sum + count, 0);
  const density = chapters.length > 0 ? totalCoolPoints / chapters.length : 0;

  // 计算爽点间隔
  const gaps: number[] = [];
  let lastCoolPointChapter = -1;
  chapters.forEach((ch, index) => {
    if (ch.coolPointCount > 0) {
      if (lastCoolPointChapter >= 0) {
        gaps.push(index - lastCoolPointChapter);
      }
      lastCoolPointChapter = index;
    }
  });

  const recommendations: string[] = [];

  if (density < 0.5) {
    recommendations.push('爽点密度偏低，建议每2-3章安排一个爽点');
  }

  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
  if (maxGap > 5) {
    recommendations.push(`最长爽点间隔${maxGap}章，建议缩短间隔避免读者流失`);
  }

  if (density > 2) {
    recommendations.push('爽点过于密集，可能导致审美疲劳，建议适当减少');
  }

  return {
    totalCoolPoints,
    density,
    distribution,
    gaps,
    recommendations,
  };
}

/**
 * 分析情绪曲线
 */
export function analyzeEmotionCurve(chapters: ChapterPacingData[]): EmotionCurveAnalysis {
  const curve = chapters.map(ch => ch.emotionIntensity);
  
  // 计算平衡度（避免极端情绪过多）
  const extremeCount = curve.filter(e => Math.abs(e) > 70).length;
  const balance = Math.max(0, 100 - (extremeCount / curve.length) * 100);

  // 计算多样性
  const variance = calculateVariance(curve);
  const variety = Math.min(100, variance * 2);

  // 找出高潮和低谷
  const peaks: number[] = [];
  const valleys: number[] = [];
  for (let i = 1; i < curve.length - 1; i++) {
    if (curve[i] > curve[i - 1] && curve[i] > curve[i + 1] && curve[i] > 50) {
      peaks.push(i);
    }
    if (curve[i] < curve[i - 1] && curve[i] < curve[i + 1] && curve[i] < -30) {
      valleys.push(i);
    }
  }

  const recommendations: string[] = [];

  if (balance < 50) {
    recommendations.push('情绪过于极端，建议增加平和的过渡章节');
  }

  if (variety < 30) {
    recommendations.push('情绪变化不足，建议增加情绪起伏');
  }

  if (peaks.length === 0) {
    recommendations.push('缺少情绪高潮，建议安排激动人心的场景');
  }

  if (peaks.length > chapters.length / 3) {
    recommendations.push('高潮过多可能导致疲劳，建议适当减少');
  }

  return {
    curve,
    balance,
    variety,
    peaks,
    valleys,
    recommendations,
  };
}

/**
 * 生成下一章节奏建议
 */
export function suggestNextChapterPacing(chapters: ChapterPacingData[]): {
  suggestedPacing: 'slow' | 'medium' | 'fast';
  reasoning: string;
  suggestions: string[];
} {
  if (chapters.length === 0) {
    return {
      suggestedPacing: 'medium',
      reasoning: '首章建议中等节奏，平衡介绍和吸引力',
      suggestions: ['设置钩子吸引读者', '适当介绍背景', '引入主要角色'],
    };
  }

  const lastChapter = chapters[chapters.length - 1];
  const recentChapters = chapters.slice(-3);
  const avgAction = recentChapters.reduce((sum, ch) => sum + ch.actionRatio, 0) / recentChapters.length;

  // 如果最近都是快节奏，建议放缓
  if (avgAction > 0.6) {
    return {
      suggestedPacing: 'slow',
      reasoning: '最近章节节奏较快，建议放缓让读者休息',
      suggestions: [
        '安排日常场景',
        '深化人物关系',
        '为后续剧情铺垫',
        '增加环境和氛围描写',
      ],
    };
  }

  // 如果最近都是慢节奏，建议加快
  if (avgAction < 0.3) {
    return {
      suggestedPacing: 'fast',
      reasoning: '最近章节节奏较慢，建议加快避免读者流失',
      suggestions: [
        '安排冲突或战斗',
        '引入转折或意外',
        '增加爽点',
        '推进主线剧情',
      ],
    };
  }

  return {
    suggestedPacing: 'medium',
    reasoning: '当前节奏适中，建议保持',
    suggestions: [
      '保持动作和描写的平衡',
      '适当安排爽点',
      '注意情绪变化',
    ],
  };
}

/**
 * 计算方差
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
}

/**
 * 生成节奏报告
 */
export function generatePacingReport(
  pacingAnalysis: PacingAnalysis,
  coolPointAnalysis: CoolPointDistributionAnalysis,
  emotionAnalysis: EmotionCurveAnalysis
): string {
  const lines: string[] = [];

  lines.push('# 节奏分析报告\n');

  lines.push('## 当前节奏');
  lines.push(`- 节奏类型：${pacingAnalysis.currentPacing}`);
  lines.push(`- 节奏评分：${pacingAnalysis.pacingScore}/100\n`);

  if (pacingAnalysis.strengths.length > 0) {
    lines.push('### 优点');
    pacingAnalysis.strengths.forEach(s => lines.push(`- ${s}`));
    lines.push('');
  }

  if (pacingAnalysis.issues.length > 0) {
    lines.push('### 问题');
    pacingAnalysis.issues.forEach(issue => {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
    lines.push('');
  }

  lines.push('## 爽点分布');
  lines.push(`- 总爽点数：${coolPointAnalysis.totalCoolPoints}`);
  lines.push(`- 平均密度：${coolPointAnalysis.density.toFixed(2)}/章`);
  if (coolPointAnalysis.gaps.length > 0) {
    const avgGap = coolPointAnalysis.gaps.reduce((a, b) => a + b, 0) / coolPointAnalysis.gaps.length;
    lines.push(`- 平均间隔：${avgGap.toFixed(1)}章\n`);
  }

  if (coolPointAnalysis.recommendations.length > 0) {
    lines.push('### 建议');
    coolPointAnalysis.recommendations.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }

  lines.push('## 情绪曲线');
  lines.push(`- 平衡度：${emotionAnalysis.balance.toFixed(0)}/100`);
  lines.push(`- 多样性：${emotionAnalysis.variety.toFixed(0)}/100`);
  lines.push(`- 高潮数量：${emotionAnalysis.peaks.length}`);
  lines.push(`- 低谷数量：${emotionAnalysis.valleys.length}\n`);

  if (emotionAnalysis.recommendations.length > 0) {
    lines.push('### 建议');
    emotionAnalysis.recommendations.forEach(r => lines.push(`- ${r}`));
    lines.push('');
  }

  if (pacingAnalysis.recommendations.length > 0) {
    lines.push('## 改进建议\n');
    pacingAnalysis.recommendations
      .sort((a, b) => b.priority - a.priority)
      .forEach(rec => {
        lines.push(`### ${rec.title} (优先级: ${rec.priority}/10)`);
        lines.push(rec.description);
        lines.push('\n行动项：');
        rec.actionItems.forEach(item => lines.push(`- ${item}`));
        lines.push('');
      });
  }

  return lines.join('\n');
}
