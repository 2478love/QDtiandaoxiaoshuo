/**
 * 情绪曲线追踪器 - 分析文本情绪起伏和传递效果
 * 
 * 核心能力：
 * 1. 情绪词汇识别（正面、负面、中性）
 * 2. 情绪强度评分（0-100）
 * 3. 情绪起伏曲线（波峰波谷）
 * 4. 情绪传递效果（共鸣度）
 * 5. 情绪类型分析（喜怒哀惧等）
 */

// ============ 类型定义 ============

export interface EmotionPoint {
  position: number;
  intensity: number; // -100 到 100，负数为负面情绪，正数为正面情绪
  type: EmotionType;
  word: string;
}

export type EmotionType = 
  | 'joy' // 喜悦
  | 'anger' // 愤怒
  | 'sadness' // 悲伤
  | 'fear' // 恐惧
  | 'surprise' // 惊讶
  | 'disgust' // 厌恶
  | 'anticipation' // 期待
  | 'trust'; // 信任

export interface EmotionCurve {
  points: EmotionPoint[];
  peaks: EmotionPoint[]; // 波峰
  valleys: EmotionPoint[]; // 波谷
  averageIntensity: number;
  volatility: number; // 波动性 0-100
  trend: 'rising' | 'falling' | 'stable'; // 趋势
}

export interface EmotionDistribution {
  joy: number;
  anger: number;
  sadness: number;
  fear: number;
  surprise: number;
  disgust: number;
  anticipation: number;
  trust: number;
}

export interface EmotionAnalysis {
  score: number; // 情绪传递效果 0-100
  curve: EmotionCurve;
  distribution: EmotionDistribution;
  dominantEmotion: EmotionType;
  resonance: number; // 共鸣度 0-100
  balance: number; // 情绪平衡度 0-100
  strengths: string[];
  improvements: string[];
}

// ============ 情绪词典 ============

const EMOTION_LEXICON: Record<EmotionType, { words: RegExp[]; intensity: number }[]> = {
  joy: [
    { words: [/高兴|开心|快乐|愉快|欢喜|喜悦/], intensity: 60 },
    { words: [/兴奋|激动|狂喜|欣喜若狂|喜出望外/], intensity: 80 },
    { words: [/满意|欣慰|舒心|畅快|痛快/], intensity: 50 },
    { words: [/笑|微笑|大笑|哈哈|嘿嘿/], intensity: 40 },
  ],
  anger: [
    { words: [/生气|愤怒|恼火|火大|气愤/], intensity: 60 },
    { words: [/暴怒|狂怒|怒不可遏|勃然大怒/], intensity: 90 },
    { words: [/不满|不爽|烦躁|厌烦|恼怒/], intensity: 40 },
    { words: [/咆哮|怒吼|怒骂|大骂/], intensity: 70 },
  ],
  sadness: [
    { words: [/悲伤|难过|伤心|痛苦|哀伤/], intensity: 60 },
    { words: [/绝望|悲痛|心碎|痛不欲生/], intensity: 90 },
    { words: [/失落|沮丧|低落|消沉|郁闷/], intensity: 50 },
    { words: [/哭|流泪|泪水|哽咽|抽泣/], intensity: 70 },
  ],
  fear: [
    { words: [/害怕|恐惧|惊恐|畏惧|胆怯/], intensity: 60 },
    { words: [/恐怖|惊骇|毛骨悚然|胆战心惊/], intensity: 90 },
    { words: [/担心|忧虑|不安|焦虑|紧张/], intensity: 40 },
    { words: [/颤抖|发抖|哆嗦|战栗/], intensity: 70 },
  ],
  surprise: [
    { words: [/惊讶|吃惊|惊奇|诧异|意外/], intensity: 60 },
    { words: [/震惊|震撼|惊愕|目瞪口呆/], intensity: 80 },
    { words: [/惊喜|惊叹|惊艳/], intensity: 70 },
  ],
  disgust: [
    { words: [/厌恶|恶心|反感|讨厌|憎恨/], intensity: 60 },
    { words: [/恶心|作呕|呕吐|反胃/], intensity: 70 },
    { words: [/鄙视|轻蔑|不屑|嫌弃/], intensity: 50 },
  ],
  anticipation: [
    { words: [/期待|期盼|盼望|渴望|向往/], intensity: 60 },
    { words: [/迫不及待|翘首以盼|望眼欲穿/], intensity: 80 },
    { words: [/希望|憧憬|幻想|梦想/], intensity: 50 },
  ],
  trust: [
    { words: [/信任|相信|信赖|依赖|托付/], intensity: 60 },
    { words: [/坚信|深信不疑|笃信/], intensity: 80 },
    { words: [/放心|安心|踏实/], intensity: 50 },
  ],
};

// 情绪极性（正面/负面）
const EMOTION_POLARITY: Record<EmotionType, number> = {
  joy: 1,
  anger: -1,
  sadness: -1,
  fear: -1,
  surprise: 0,
  disgust: -1,
  anticipation: 1,
  trust: 1,
};

// ============ 分析函数 ============

/**
 * 识别文本中的情绪点
 */
export function detectEmotionPoints(text: string): EmotionPoint[] {
  const points: EmotionPoint[] = [];

  for (const [emotionType, patterns] of Object.entries(EMOTION_LEXICON)) {
    for (const { words, intensity } of patterns) {
      for (const pattern of words) {
        const matches = text.matchAll(new RegExp(pattern, 'g'));
        for (const match of matches) {
          const polarity = EMOTION_POLARITY[emotionType as EmotionType];
          points.push({
            position: match.index!,
            intensity: intensity * polarity,
            type: emotionType as EmotionType,
            word: match[0],
          });
        }
      }
    }
  }

  // 按位置排序
  points.sort((a, b) => a.position - b.position);

  return points;
}

/**
 * 分析情绪曲线
 */
export function analyzeEmotionCurve(points: EmotionPoint[]): EmotionCurve {
  if (points.length === 0) {
    return {
      points: [],
      peaks: [],
      valleys: [],
      averageIntensity: 0,
      volatility: 0,
      trend: 'stable',
    };
  }

  // 计算平均强度
  const averageIntensity = points.reduce((sum, p) => sum + p.intensity, 0) / points.length;

  // 找波峰和波谷
  const peaks: EmotionPoint[] = [];
  const valleys: EmotionPoint[] = [];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    // 波峰：比前后都高
    if (curr.intensity > prev.intensity && curr.intensity > next.intensity) {
      peaks.push(curr);
    }

    // 波谷：比前后都低
    if (curr.intensity < prev.intensity && curr.intensity < next.intensity) {
      valleys.push(curr);
    }
  }

  // 计算波动性（标准差）
  const variance = points.reduce((sum, p) => sum + Math.pow(p.intensity - averageIntensity, 2), 0) / points.length;
  const stdDev = Math.sqrt(variance);
  const volatility = Math.min(100, Math.floor(stdDev));

  // 判断趋势
  let trend: EmotionCurve['trend'] = 'stable';
  if (points.length >= 3) {
    const firstThird = points.slice(0, Math.floor(points.length / 3));
    const lastThird = points.slice(-Math.floor(points.length / 3));
    const firstAvg = firstThird.reduce((sum, p) => sum + p.intensity, 0) / firstThird.length;
    const lastAvg = lastThird.reduce((sum, p) => sum + p.intensity, 0) / lastThird.length;

    if (lastAvg - firstAvg > 10) trend = 'rising';
    else if (firstAvg - lastAvg > 10) trend = 'falling';
  }

  return {
    points,
    peaks,
    valleys,
    averageIntensity,
    volatility,
    trend,
  };
}

/**
 * 分析情绪分布
 */
export function analyzeEmotionDistribution(points: EmotionPoint[]): EmotionDistribution {
  const distribution: EmotionDistribution = {
    joy: 0,
    anger: 0,
    sadness: 0,
    fear: 0,
    surprise: 0,
    disgust: 0,
    anticipation: 0,
    trust: 0,
  };

  for (const point of points) {
    distribution[point.type]++;
  }

  return distribution;
}

/**
 * 计算情绪共鸣度
 */
export function calculateResonance(curve: EmotionCurve): number {
  // 共鸣度基于：
  // 1. 情绪强度（越强越容易共鸣）
  // 2. 波动性（适度波动更有感染力）
  // 3. 波峰波谷数量（起伏越多越有张力）

  const intensityScore = Math.min(100, Math.abs(curve.averageIntensity));
  const volatilityScore = curve.volatility > 80 ? 60 : curve.volatility; // 过度波动反而不好
  const fluctuationScore = Math.min(100, (curve.peaks.length + curve.valleys.length) * 10);

  return Math.floor((intensityScore * 0.4 + volatilityScore * 0.3 + fluctuationScore * 0.3));
}

/**
 * 计算情绪平衡度
 */
export function calculateBalance(distribution: EmotionDistribution): number {
  // 平衡度：正面和负面情绪的比例
  const positive = distribution.joy + distribution.anticipation + distribution.trust;
  const negative = distribution.anger + distribution.sadness + distribution.fear + distribution.disgust;
  const total = positive + negative;

  if (total === 0) return 50;

  const ratio = Math.min(positive, negative) / total;
  return Math.floor(ratio * 100);
}

/**
 * 综合分析情绪
 */
export function analyzeEmotion(text: string): EmotionAnalysis {
  const points = detectEmotionPoints(text);
  const curve = analyzeEmotionCurve(points);
  const distribution = analyzeEmotionDistribution(points);
  const resonance = calculateResonance(curve);
  const balance = calculateBalance(distribution);

  // 找出主导情绪
  let dominantEmotion: EmotionType = 'joy';
  let maxCount = 0;
  for (const [emotion, count] of Object.entries(distribution)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion as EmotionType;
    }
  }

  // 生成优势和改进建议
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (resonance >= 70) {
    strengths.push('情绪传递有力，容易引起共鸣');
  } else if (resonance < 40) {
    improvements.push('增强情绪表达，提升感染力');
  }

  if (curve.volatility >= 40 && curve.volatility <= 70) {
    strengths.push('情绪起伏适度，节奏把控得当');
  } else if (curve.volatility < 30) {
    improvements.push('增加情绪波动，避免平淡');
  } else if (curve.volatility > 80) {
    improvements.push('控制情绪波动，避免过于激烈');
  }

  if (balance >= 40 && balance <= 60) {
    strengths.push('正负情绪平衡，情感层次丰富');
  } else if (balance < 30) {
    improvements.push('增加情绪多样性，避免单一情感');
  }

  if (curve.peaks.length >= 2) {
    strengths.push('情绪高潮设置合理，有起有伏');
  } else if (curve.peaks.length === 0) {
    improvements.push('设置情绪高潮点，增强感染力');
  }

  // 综合评分
  const score = Math.floor((resonance * 0.5 + balance * 0.3 + Math.min(100, curve.volatility) * 0.2));

  return {
    score,
    curve,
    distribution,
    dominantEmotion,
    resonance,
    balance,
    strengths,
    improvements,
  };
}

/**
 * 生成情绪分析报告
 */
export function generateEmotionReport(analysis: EmotionAnalysis): string {
  let report = '# 情绪曲线分析报告\n\n';
  report += `## 综合评分：${analysis.score}/100\n\n`;

  // 核心指标
  report += '## 核心指标\n\n';
  report += `- 共鸣度：${analysis.resonance}/100\n`;
  report += `- 平衡度：${analysis.balance}/100\n`;
  report += `- 波动性：${analysis.curve.volatility}/100\n`;
  report += `- 主导情绪：${getEmotionName(analysis.dominantEmotion)}\n`;
  report += `- 情绪趋势：${getTrendName(analysis.curve.trend)}\n\n`;

  // 情绪分布
  report += '## 情绪分布\n\n';
  const emotionNames: Record<EmotionType, string> = {
    joy: '喜悦',
    anger: '愤怒',
    sadness: '悲伤',
    fear: '恐惧',
    surprise: '惊讶',
    disgust: '厌恶',
    anticipation: '期待',
    trust: '信任',
  };

  for (const [emotion, count] of Object.entries(analysis.distribution)) {
    if (count > 0) {
      report += `- ${emotionNames[emotion as EmotionType]}：${count} 次\n`;
    }
  }
  report += '\n';

  // 情绪曲线
  report += '## 情绪曲线\n\n';
  report += `- 平均强度：${analysis.curve.averageIntensity.toFixed(1)}\n`;
  report += `- 波峰数量：${analysis.curve.peaks.length}\n`;
  report += `- 波谷数量：${analysis.curve.valleys.length}\n`;
  report += `- 情绪点总数：${analysis.curve.points.length}\n\n`;

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

  return report;
}

/**
 * 生成情绪优化提示词
 */
export function generateEmotionPrompt(text: string, analysis: EmotionAnalysis): string {
  let prompt = '请优化以下文本的情绪表达，重点改进：\n\n';

  if (analysis.resonance < 60) {
    prompt += '【情绪强化】\n';
    prompt += '- 增强情绪词汇的使用，提升感染力\n';
    prompt += '- 通过动作、表情、环境描写传递情绪\n';
    prompt += '- 让读者感同身受，产生共鸣\n\n';
  }

  if (analysis.curve.volatility < 30) {
    prompt += '【情绪起伏】\n';
    prompt += '- 增加情绪波动，制造起伏感\n';
    prompt += '- 设置情绪高潮和低谷\n';
    prompt += '- 避免情绪平淡单调\n\n';
  } else if (analysis.curve.volatility > 80) {
    prompt += '【情绪控制】\n';
    prompt += '- 适度控制情绪波动，避免过于激烈\n';
    prompt += '- 给读者喘息的空间\n';
    prompt += '- 张弛有度，节奏把控\n\n';
  }

  if (analysis.balance < 30) {
    prompt += '【情绪多样性】\n';
    prompt += '- 增加不同类型的情绪表达\n';
    prompt += '- 正负情绪交织，层次更丰富\n';
    prompt += '- 避免单一情感基调\n\n';
  }

  if (analysis.curve.peaks.length === 0) {
    prompt += '【情绪高潮】\n';
    prompt += '- 设置明确的情绪高潮点\n';
    prompt += '- 在关键时刻释放情绪\n';
    prompt += '- 让情感达到顶点\n\n';
  }

  prompt += `当前主导情绪：${getEmotionName(analysis.dominantEmotion)}\n`;
  prompt += `情绪趋势：${getTrendName(analysis.curve.trend)}\n\n`;
  prompt += '原文：\n' + text;

  return prompt;
}

// ============ 辅助函数 ============

function getEmotionName(emotion: EmotionType): string {
  const names: Record<EmotionType, string> = {
    joy: '喜悦',
    anger: '愤怒',
    sadness: '悲伤',
    fear: '恐惧',
    surprise: '惊讶',
    disgust: '厌恶',
    anticipation: '期待',
    trust: '信任',
  };
  return names[emotion];
}

function getTrendName(trend: EmotionCurve['trend']): string {
  const names = {
    rising: '上升（情绪逐渐高涨）',
    falling: '下降（情绪逐渐低落）',
    stable: '平稳（情绪相对稳定）',
  };
  return names[trend];
}
