/**
 * 质量趋势分析器
 * 可视化各章节评分曲线，追踪质量变化趋势
 */

export interface QualityScore {
  /** 章节ID */
  chapterId: string;
  /** 章节标题 */
  chapterTitle: string;
  /** 章节序号 */
  chapterIndex: number;
  /** 综合评分 (0-100) */
  overallScore: number;
  /** 写作风格评分 */
  styleScore: number;
  /** 情节张力评分 */
  tensionScore: number;
  /** 情绪表达评分 */
  emotionScore: number;
  /** 人物塑造评分 */
  characterScore: number;
  /** 网文能力评分 */
  webNovelScore: number;
  /** 时间戳 */
  timestamp: number;
}

export interface QualityTrend {
  /** 趋势方向 */
  direction: 'rising' | 'falling' | 'stable' | 'fluctuating';
  /** 趋势强度 (0-1) */
  strength: number;
  /** 平均分 */
  averageScore: number;
  /** 最高分 */
  maxScore: number;
  /** 最低分 */
  minScore: number;
  /** 标准差 */
  standardDeviation: number;
  /** 变化率 */
  changeRate: number;
}

export interface QualityTrendAnalysis {
  /** 评分列表 */
  scores: QualityScore[];
  /** 整体趋势 */
  overallTrend: QualityTrend;
  /** 各维度趋势 */
  dimensionTrends: {
    style: QualityTrend;
    tension: QualityTrend;
    emotion: QualityTrend;
    character: QualityTrend;
    webNovel: QualityTrend;
  };
  /** 问题章节 */
  problemChapters: Array<{
    chapterId: string;
    chapterTitle: string;
    chapterIndex: number;
    score: number;
    issues: string[];
  }>;
  /** 优秀章节 */
  excellentChapters: Array<{
    chapterId: string;
    chapterTitle: string;
    chapterIndex: number;
    score: number;
    highlights: string[];
  }>;
  /** 建议 */
  recommendations: string[];
}

/**
 * 计算趋势
 */
export function calculateTrend(scores: number[]): QualityTrend {
  if (scores.length === 0) {
    return {
      direction: 'stable',
      strength: 0,
      averageScore: 0,
      maxScore: 0,
      minScore: 0,
      standardDeviation: 0,
      changeRate: 0,
    };
  }

  // 计算基本统计
  const sum = scores.reduce((a, b) => a + b, 0);
  const averageScore = sum / scores.length;
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);

  // 计算标准差
  const variance = scores.reduce((sum, score) => {
    return sum + Math.pow(score - averageScore, 2);
  }, 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);

  // 计算线性回归斜率（趋势方向）
  const n = scores.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += scores[i];
    sumXY += i * scores[i];
    sumX2 += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const changeRate = slope;

  // 判断趋势方向
  let direction: QualityTrend['direction'];
  if (Math.abs(slope) < 0.5) {
    direction = 'stable';
  } else if (slope > 0) {
    direction = 'rising';
  } else {
    direction = 'falling';
  }

  // 如果标准差很大，说明波动剧烈
  if (standardDeviation > 15 && direction === 'stable') {
    direction = 'fluctuating';
  }

  // 计算趋势强度
  const strength = Math.min(Math.abs(slope) / 2, 1);

  return {
    direction,
    strength,
    averageScore,
    maxScore,
    minScore,
    standardDeviation,
    changeRate,
  };
}

/**
 * 分析质量趋势
 */
export function analyzeQualityTrend(scores: QualityScore[]): QualityTrendAnalysis {
  if (scores.length === 0) {
    return {
      scores: [],
      overallTrend: calculateTrend([]),
      dimensionTrends: {
        style: calculateTrend([]),
        tension: calculateTrend([]),
        emotion: calculateTrend([]),
        character: calculateTrend([]),
        webNovel: calculateTrend([]),
      },
      problemChapters: [],
      excellentChapters: [],
      recommendations: [],
    };
  }

  // 按章节序号排序
  const sortedScores = [...scores].sort((a, b) => a.chapterIndex - b.chapterIndex);

  // 提取各维度分数
  const overallScores = sortedScores.map(s => s.overallScore);
  const styleScores = sortedScores.map(s => s.styleScore);
  const tensionScores = sortedScores.map(s => s.tensionScore);
  const emotionScores = sortedScores.map(s => s.emotionScore);
  const characterScores = sortedScores.map(s => s.characterScore);
  const webNovelScores = sortedScores.map(s => s.webNovelScore);

  // 计算趋势
  const overallTrend = calculateTrend(overallScores);
  const dimensionTrends = {
    style: calculateTrend(styleScores),
    tension: calculateTrend(tensionScores),
    emotion: calculateTrend(emotionScores),
    character: calculateTrend(characterScores),
    webNovel: calculateTrend(webNovelScores),
  };

  // 识别问题章节（低于平均分10分以上）
  const problemThreshold = overallTrend.averageScore - 10;
  const problemChapters = sortedScores
    .filter(s => s.overallScore < problemThreshold)
    .map(s => {
      const issues: string[] = [];
      if (s.styleScore < 60) issues.push('写作风格需改进');
      if (s.tensionScore < 60) issues.push('情节张力不足');
      if (s.emotionScore < 60) issues.push('情绪表达平淡');
      if (s.characterScore < 60) issues.push('人物塑造薄弱');
      if (s.webNovelScore < 60) issues.push('网文能力欠缺');
      
      return {
        chapterId: s.chapterId,
        chapterTitle: s.chapterTitle,
        chapterIndex: s.chapterIndex,
        score: s.overallScore,
        issues,
      };
    });

  // 识别优秀章节（高于平均分10分以上）
  const excellentThreshold = overallTrend.averageScore + 10;
  const excellentChapters = sortedScores
    .filter(s => s.overallScore > excellentThreshold)
    .map(s => {
      const highlights: string[] = [];
      if (s.styleScore > 80) highlights.push('写作风格优秀');
      if (s.tensionScore > 80) highlights.push('情节张力强');
      if (s.emotionScore > 80) highlights.push('情绪表达到位');
      if (s.characterScore > 80) highlights.push('人物塑造生动');
      if (s.webNovelScore > 80) highlights.push('网文能力强');
      
      return {
        chapterId: s.chapterId,
        chapterTitle: s.chapterTitle,
        chapterIndex: s.chapterIndex,
        score: s.overallScore,
        highlights,
      };
    });

  // 生成建议
  const recommendations: string[] = [];

  if (overallTrend.direction === 'falling') {
    recommendations.push('⚠️ 整体质量呈下降趋势，需要重点关注');
    recommendations.push('建议：回顾优秀章节的写作方法，保持质量稳定');
  } else if (overallTrend.direction === 'rising') {
    recommendations.push('✅ 整体质量呈上升趋势，继续保持');
  } else if (overallTrend.direction === 'fluctuating') {
    recommendations.push('⚠️ 质量波动较大，需要稳定输出');
    recommendations.push('建议：建立写作规范，保持风格一致性');
  }

  // 针对各维度给出建议
  if (dimensionTrends.style.averageScore < 70) {
    recommendations.push('📝 写作风格需要提升，注意五感描写和场景渲染');
  }
  if (dimensionTrends.tension.averageScore < 70) {
    recommendations.push('⚡ 情节张力不足，增加冲突和悬念');
  }
  if (dimensionTrends.emotion.averageScore < 70) {
    recommendations.push('💭 情绪表达需要加强，让读者产生共鸣');
  }
  if (dimensionTrends.character.averageScore < 70) {
    recommendations.push('👤 人物塑造需要改进，让角色更有个性');
  }
  if (dimensionTrends.webNovel.averageScore < 70) {
    recommendations.push('📖 网文能力需要提升，注意节奏和爽点');
  }

  if (problemChapters.length > 0) {
    recommendations.push(`🔧 发现 ${problemChapters.length} 个问题章节，建议优先精修`);
  }

  return {
    scores: sortedScores,
    overallTrend,
    dimensionTrends,
    problemChapters,
    excellentChapters,
    recommendations,
  };
}

/**
 * 生成趋势报告
 */
export function generateTrendReport(analysis: QualityTrendAnalysis): string {
  const lines: string[] = [];

  lines.push('# 质量趋势分析报告');
  lines.push('');

  // 整体趋势
  lines.push('## 整体趋势');
  lines.push('');
  const trend = analysis.overallTrend;
  const trendIcon = {
    rising: '📈',
    falling: '📉',
    stable: '➡️',
    fluctuating: '📊',
  }[trend.direction];
  
  lines.push(`**趋势方向：** ${trendIcon} ${getTrendName(trend.direction)}`);
  lines.push(`**趋势强度：** ${(trend.strength * 100).toFixed(0)}%`);
  lines.push(`**平均分：** ${trend.averageScore.toFixed(1)}`);
  lines.push(`**最高分：** ${trend.maxScore.toFixed(1)}`);
  lines.push(`**最低分：** ${trend.minScore.toFixed(1)}`);
  lines.push(`**标准差：** ${trend.standardDeviation.toFixed(1)}`);
  lines.push('');

  // 各维度趋势
  lines.push('## 各维度趋势');
  lines.push('');
  lines.push('| 维度 | 平均分 | 趋势 | 最高分 | 最低分 |');
  lines.push('|------|--------|------|--------|--------|');
  
  const dimensions = [
    { name: '写作风格', key: 'style' as const },
    { name: '情节张力', key: 'tension' as const },
    { name: '情绪表达', key: 'emotion' as const },
    { name: '人物塑造', key: 'character' as const },
    { name: '网文能力', key: 'webNovel' as const },
  ];

  dimensions.forEach(({ name, key }) => {
    const dimTrend = analysis.dimensionTrends[key];
    const icon = {
      rising: '↗️',
      falling: '↘️',
      stable: '→',
      fluctuating: '↕️',
    }[dimTrend.direction];
    
    lines.push(
      `| ${name} | ${dimTrend.averageScore.toFixed(1)} | ${icon} | ${dimTrend.maxScore.toFixed(1)} | ${dimTrend.minScore.toFixed(1)} |`
    );
  });
  lines.push('');

  // 问题章节
  if (analysis.problemChapters.length > 0) {
    lines.push('## 问题章节');
    lines.push('');
    analysis.problemChapters.forEach(chapter => {
      lines.push(`### ${chapter.chapterTitle} (评分: ${chapter.score.toFixed(1)})`);
      lines.push('');
      lines.push('**问题：**');
      chapter.issues.forEach(issue => {
        lines.push(`- ${issue}`);
      });
      lines.push('');
    });
  }

  // 优秀章节
  if (analysis.excellentChapters.length > 0) {
    lines.push('## 优秀章节');
    lines.push('');
    analysis.excellentChapters.forEach(chapter => {
      lines.push(`### ${chapter.chapterTitle} (评分: ${chapter.score.toFixed(1)})`);
      lines.push('');
      lines.push('**亮点：**');
      chapter.highlights.forEach(highlight => {
        lines.push(`- ${highlight}`);
      });
      lines.push('');
    });
  }

  // 建议
  if (analysis.recommendations.length > 0) {
    lines.push('## 改进建议');
    lines.push('');
    analysis.recommendations.forEach(rec => {
      lines.push(`- ${rec}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 获取趋势名称
 */
export function getTrendName(direction: QualityTrend['direction']): string {
  const names = {
    rising: '上升',
    falling: '下降',
    stable: '稳定',
    fluctuating: '波动',
  };
  return names[direction];
}

/**
 * 导出趋势数据为 CSV
 */
export function exportTrendDataAsCSV(scores: QualityScore[]): string {
  const lines: string[] = [];
  
  // 表头
  lines.push('章节序号,章节标题,综合评分,写作风格,情节张力,情绪表达,人物塑造,网文能力');
  
  // 数据行
  scores.forEach(score => {
    lines.push([
      score.chapterIndex,
      `"${score.chapterTitle}"`,
      score.overallScore.toFixed(1),
      score.styleScore.toFixed(1),
      score.tensionScore.toFixed(1),
      score.emotionScore.toFixed(1),
      score.characterScore.toFixed(1),
      score.webNovelScore.toFixed(1),
    ].join(','));
  });
  
  return lines.join('\n');
}

/**
 * 计算移动平均（平滑曲线）
 */
export function calculateMovingAverage(scores: number[], windowSize: number = 3): number[] {
  if (scores.length < windowSize) {
    return scores;
  }

  const result: number[] = [];
  
  for (let i = 0; i < scores.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(scores.length, i + Math.ceil(windowSize / 2));
    const window = scores.slice(start, end);
    const avg = window.reduce((a, b) => a + b, 0) / window.length;
    result.push(avg);
  }
  
  return result;
}

/**
 * 预测未来趋势（简单线性预测）
 */
export function predictFutureTrend(scores: number[], steps: number = 5): number[] {
  if (scores.length < 2) {
    return Array(steps).fill(scores[0] || 0);
  }

  const trend = calculateTrend(scores);
  const lastScore = scores[scores.length - 1];
  const predictions: number[] = [];

  for (let i = 1; i <= steps; i++) {
    const predicted = lastScore + trend.changeRate * i;
    // 限制在 0-100 范围内
    predictions.push(Math.max(0, Math.min(100, predicted)));
  }

  return predictions;
}
