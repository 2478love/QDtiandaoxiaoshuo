/**
 * 网文能力系统 - 基于现象级网文成功要素的创作辅助工具
 * 
 * 核心理念：
 * 1. 爽点设计：压抑→释放的情绪落差
 * 2. 节奏控制：小高潮→大高潮的波浪式推进
 * 3. 钩子设置：每章末尾的悬念和期待
 * 4. 角色成长：可见的进步和突破
 * 5. 伏笔回收：前后呼应的闭环设计
 */

// ============ 类型定义 ============

export interface WebNovelPattern {
  id: string;
  name: string;
  category: 'opening' | 'rhythm' | 'climax' | 'conflict' | 'growth' | 'hook';
  description: string;
  structure: string[];
  examples: string[];
  tips: string[];
}

export interface ChapterStructure {
  chapterNumber: number;
  title: string;
  purpose: string; // 本章目的
  hook: string; // 开篇钩子
  conflict: string; // 核心冲突
  climax: string; // 高潮点
  cliffhanger: string; // 章末悬念
  emotionalArc: 'rising' | 'falling' | 'stable'; // 情绪曲线
}

export interface PlotArc {
  name: string;
  startChapter: number;
  endChapter: number;
  type: 'main' | 'sub' | 'character' | 'foreshadowing';
  stages: {
    setup: string; // 铺垫
    development: string; // 发展
    climax: string; // 高潮
    resolution: string; // 解决
  };
}

export interface CoolPoint {
  type: 'power' | 'face-slap' | 'treasure' | 'breakthrough' | 'recognition' | 'revenge';
  intensity: 'small' | 'medium' | 'large';
  setup: string; // 铺垫内容
  trigger: string; // 触发条件
  payoff: string; // 爽点释放
  timing: number; // 建议出现的章节
}

export interface WebNovelAnalysis {
  goldenThreeChapters: {
    chapter1: { hook: string; worldview: string; protagonist: string };
    chapter2: { conflict: string; stakes: string; twist: string };
    chapter3: { climax: string; resolution: string; nextHook: string };
  };
  rhythmScore: number; // 节奏评分 0-100
  coolPointDensity: number; // 爽点密度（每万字）
  hookEffectiveness: number; // 钩子有效性 0-100
  suggestions: string[];
}

// ============ 网文写作模式库 ============

export const WEB_NOVEL_PATTERNS: WebNovelPattern[] = [
  {
    id: 'golden-three-chapters',
    name: '黄金三章',
    category: 'opening',
    description: '开篇三章的标准结构，用于快速抓住读者',
    structure: [
      '第一章：强钩子开场 + 主角亮相 + 世界观初现',
      '第二章：冲突升级 + 困境加深 + 转折铺垫',
      '第三章：第一个小高潮 + 初步爽点 + 下一阶段悬念'
    ],
    examples: [
      '开篇对话/战斗场景直接切入',
      '主角遭遇不公/危机，展现特质',
      '获得金手指/机遇，初试锋芒'
    ],
    tips: [
      '第一章必须在3000字内出现明确的吸引点',
      '避免大段世界观设定，用情节带出',
      '每章结尾留悬念，让读者想看下一章'
    ]
  },
  {
    id: 'face-slap-cycle',
    name: '打脸循环',
    category: 'conflict',
    description: '经典的冲突-反转-爽点循环结构',
    structure: [
      '制造冲突：反派/配角挑衅、嘲讽、打压',
      '围观者嘲讽：强化压抑感，积累情绪',
      '反转打脸：主角亮出底牌，众人震惊',
      '事后清算：解决后续，收获资源/名声'
    ],
    examples: [
      '富二代看不起主角 → 主角展示实力 → 富二代跪地求饶',
      '前辈质疑主角 → 主角当场证明 → 前辈惊为天人',
      '考核被刁难 → 超常发挥 → 考官震撼'
    ],
    tips: [
      '平均每3-5章完成一次完整循环',
      '压抑要充分，但不要过度（避免读者弃书）',
      '反转要合理，有铺垫支撑'
    ]
  },
  {
    id: 'power-progression',
    name: '力量进阶',
    category: 'growth',
    description: '主角实力提升的节奏设计',
    structure: [
      '当前瓶颈：明确当前实力上限',
      '机遇铺垫：埋下突破的契机',
      '突破过程：描写突破的紧张感',
      '实力展示：用战斗/事件展现新实力'
    ],
    examples: [
      '修炼遇到瓶颈 → 获得丹药/功法 → 闭关突破 → 击败之前打不过的敌人',
      '技能不足 → 名师指点 → 顿悟 → 技能大成',
      '境界停滞 → 生死危机 → 破而后立 → 境界飞跃'
    ],
    tips: [
      '每次突破要有充分铺垫，不能太突兀',
      '突破后要有实力展示，让读者感受到成长',
      '控制突破频率，避免通货膨胀'
    ]
  },
  {
    id: 'foreshadowing-payoff',
    name: '伏笔回收',
    category: 'hook',
    description: '伏笔的埋设和回收技巧',
    structure: [
      '种因：埋下伏笔，引起好奇',
      '提醒：中途强化存在感',
      '连环：多个伏笔相互关联',
      '回收：在合适时机揭晓答案'
    ],
    examples: [
      '神秘老人赠送玉佩 → 多次提到玉佩异常 → 危机时玉佩显威',
      '主角身世之谜 → 不断出现线索 → 真相大白',
      '反派的阴谋 → 逐步揭露 → 最终对决'
    ],
    tips: [
      '伏笔不要埋太久（不超过50章）',
      '定期提醒读者伏笔的存在',
      '回收时要有惊喜感，超出预期'
    ]
  },
  {
    id: 'rhythm-wave',
    name: '波浪式节奏',
    category: 'rhythm',
    description: '小高潮和大高潮的交替设计',
    structure: [
      '小高潮（每3-5章）：解决一个小冲突',
      '过渡章节：铺垫下一个冲突',
      '中高潮（每10-15章）：完成一个小阶段',
      '大高潮（每30-50章）：完成一个大篇章'
    ],
    examples: [
      '小高潮：击败小反派、获得小宝物、通过小考验',
      '中高潮：完成一次试炼、解决一个阴谋、突破一个境界',
      '大高潮：击败大反派、完成主线任务、重大转折'
    ],
    tips: [
      '高潮之间要有缓冲，不能一直紧张',
      '每个高潮要比上一个更强',
      '大高潮后可以有短暂的日常过渡'
    ]
  },
  {
    id: 'golden-finger',
    name: '金手指设计',
    category: 'growth',
    description: '主角外挂的合理设计',
    structure: [
      '获得方式：合理的机遇',
      '能力边界：明确的限制和代价',
      '成长性：随主角成长而进化',
      '独特性：区别于其他作品的特色'
    ],
    examples: [
      '系统类：任务系统、签到系统、抽奖系统',
      '空间类：随身空间、时间加速、储物空间',
      '知识类：穿越者优势、前世记忆、预知能力',
      '特殊类：特殊体质、神秘传承、异能觉醒'
    ],
    tips: [
      '金手指要有限制，不能无敌',
      '要有成长空间，不能一步到位',
      '使用要有代价或冷却，增加紧张感'
    ]
  },
  {
    id: 'chapter-hook',
    name: '章末钩子',
    category: 'hook',
    description: '每章结尾的悬念设置',
    structure: [
      '问题型：抛出一个问题',
      '危机型：主角陷入危险',
      '惊喜型：出现意外收获',
      '转折型：剧情突然反转'
    ],
    examples: [
      '"就在这时，一道冷笑声从身后传来..."',
      '"他打开盒子，里面竟然是..."',
      '"系统提示：检测到未知威胁正在接近"',
      '"没想到，那个人竟然是..."'
    ],
    tips: [
      '不要每章都用同一种钩子',
      '钩子要在下一章尽快回应',
      '避免过度使用，否则失去效果'
    ]
  }
];

// ============ 爽点类型库 ============

export const COOL_POINT_TYPES = {
  power: {
    name: '力量爽点',
    description: '主角实力提升、展示强大力量',
    triggers: ['突破境界', '获得神器', '学会绝技', '觉醒血脉'],
    payoffs: ['秒杀敌人', '震惊众人', '名声大噪', '获得尊重']
  },
  faceSlap: {
    name: '打脸爽点',
    description: '反转打脸，让看不起主角的人震惊',
    triggers: ['被嘲讽', '被轻视', '被挑衅', '被质疑'],
    payoffs: ['展示实力', '身份曝光', '成就展示', '后台亮相']
  },
  treasure: {
    name: '宝物爽点',
    description: '获得珍贵物品、资源',
    triggers: ['探索秘境', '击败强敌', '完成任务', '意外发现'],
    payoffs: ['神器到手', '功法获得', '资源暴富', '机缘巧合']
  },
  breakthrough: {
    name: '突破爽点',
    description: '境界突破、能力飞跃',
    triggers: ['生死危机', '顿悟', '资源充足', '机缘巧合'],
    payoffs: ['实力暴涨', '寿命延长', '地位提升', '新能力解锁']
  },
  recognition: {
    name: '认可爽点',
    description: '获得他人认可、尊重',
    triggers: ['展示实力', '完成壮举', '身份曝光', '贡献巨大'],
    payoffs: ['众人敬仰', '美人青睐', '势力拉拢', '名扬天下']
  },
  revenge: {
    name: '复仇爽点',
    description: '报仇雪恨、讨回公道',
    triggers: ['实力足够', '机会来临', '真相大白', '盟友相助'],
    payoffs: ['仇人伏诛', '冤屈昭雪', '正义伸张', '因果循环']
  }
};

// ============ 黄金三章分析 ============

/**
 * 分析文本是否符合黄金三章结构
 */
export function analyzeGoldenThreeChapters(chapters: string[]): {
  score: number;
  analysis: {
    chapter1: { hasHook: boolean; hasProtagonist: boolean; hasWorldview: boolean };
    chapter2: { hasConflict: boolean; hasStakes: boolean; hasTwist: boolean };
    chapter3: { hasClimax: boolean; hasResolution: boolean; hasNextHook: boolean };
  };
  suggestions: string[];
} {
  const suggestions: string[] = [];
  
  if (chapters.length < 3) {
    return {
      score: 0,
      analysis: {
        chapter1: { hasHook: false, hasProtagonist: false, hasWorldview: false },
        chapter2: { hasConflict: false, hasStakes: false, hasTwist: false },
        chapter3: { hasClimax: false, hasResolution: false, hasNextHook: false }
      },
      suggestions: ['需要至少三章内容才能分析']
    };
  }
  
  // 第一章分析
  const ch1 = chapters[0];
  const ch1Analysis = {
    hasHook: /^["「『]|^[^\n]{0,100}[？！。]/.test(ch1) || ch1.length < 500, // 开篇对话或短句
    hasProtagonist: /主角|我|他|她/.test(ch1.slice(0, 1000)),
    hasWorldview: /世界|大陆|宗门|学院|城市/.test(ch1)
  };
  
  if (!ch1Analysis.hasHook) {
    suggestions.push('第一章建议用对话或动作场景开场，快速抓住读者');
  }
  
  // 第二章分析
  const ch2 = chapters[1];
  const ch2Analysis = {
    hasConflict: /冲突|矛盾|敌人|对手|挑战/.test(ch2) || /嘲讽|轻视|看不起/.test(ch2),
    hasStakes: /危险|危机|生死|重要|关键/.test(ch2),
    hasTwist: /突然|没想到|竟然|居然/.test(ch2)
  };
  
  if (!ch2Analysis.hasConflict) {
    suggestions.push('第二章应该引入明确的冲突或挑战');
  }
  
  // 第三章分析
  const ch3 = chapters[2];
  const ch3Analysis = {
    hasClimax: /爆发|突破|反转|震惊/.test(ch3),
    hasResolution: /解决|完成|成功|胜利/.test(ch3),
    hasNextHook: /接下来|然而|但是|就在这时/.test(ch3.slice(-500))
  };
  
  if (!ch3Analysis.hasClimax) {
    suggestions.push('第三章应该有一个小高潮，给读者初步的满足感');
  }
  
  if (!ch3Analysis.hasNextHook) {
    suggestions.push('第三章结尾应该留下悬念，引导读者继续阅读');
  }
  
  // 计算得分
  const totalChecks = 9;
  const passedChecks = 
    (ch1Analysis.hasHook ? 1 : 0) +
    (ch1Analysis.hasProtagonist ? 1 : 0) +
    (ch1Analysis.hasWorldview ? 1 : 0) +
    (ch2Analysis.hasConflict ? 1 : 0) +
    (ch2Analysis.hasStakes ? 1 : 0) +
    (ch2Analysis.hasTwist ? 1 : 0) +
    (ch3Analysis.hasClimax ? 1 : 0) +
    (ch3Analysis.hasResolution ? 1 : 0) +
    (ch3Analysis.hasNextHook ? 1 : 0);
  
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  return {
    score,
    analysis: {
      chapter1: ch1Analysis,
      chapter2: ch2Analysis,
      chapter3: ch3Analysis
    },
    suggestions
  };
}

// ============ 爽点密度分析 ============

/**
 * 分析文本中的爽点密度
 */
export function analyzeCoolPointDensity(content: string): {
  density: number; // 每万字爽点数
  coolPoints: Array<{ type: string; position: number; text: string }>;
  score: number; // 0-100
} {
  const coolPoints: Array<{ type: string; position: number; text: string }> = [];
  
  // 检测各类爽点关键词
  const patterns = [
    { type: '力量展示', keywords: ['秒杀', '碾压', '震惊', '恐怖如斯', '强大', '无敌'] },
    { type: '打脸反转', keywords: ['打脸', '震撼', '不可能', '怎么可能', '竟然', '没想到'] },
    { type: '获得宝物', keywords: ['获得', '得到', '宝物', '神器', '功法', '秘籍'] },
    { type: '境界突破', keywords: ['突破', '晋级', '进阶', '飞跃', '破境'] },
    { type: '获得认可', keywords: ['佩服', '敬仰', '崇拜', '尊敬', '认可', '赞叹'] },
    { type: '复仇成功', keywords: ['报仇', '复仇', '雪恨', '讨回', '偿还'] }
  ];
  
  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      let index = 0;
      while ((index = content.indexOf(keyword, index)) !== -1) {
        const context = content.slice(Math.max(0, index - 20), Math.min(content.length, index + 20));
        coolPoints.push({
          type: pattern.type,
          position: index,
          text: context
        });
        index += keyword.length;
      }
    }
  }
  
  // 计算密度（每万字）
  const wordCount = content.length;
  const density = wordCount > 0 ? (coolPoints.length / wordCount) * 10000 : 0;
  
  // 评分：理想密度是每万字3-5个爽点
  let score = 0;
  if (density >= 3 && density <= 5) {
    score = 100;
  } else if (density >= 2 && density < 3) {
    score = 80;
  } else if (density > 5 && density <= 7) {
    score = 80;
  } else if (density >= 1 && density < 2) {
    score = 60;
  } else if (density > 7 && density <= 10) {
    score = 60;
  } else {
    score = 40;
  }
  
  return { density, coolPoints, score };
}

// ============ 章末钩子检测 ============

/**
 * 检测章节结尾是否有有效的钩子
 */
export function detectChapterHook(chapterContent: string): {
  hasHook: boolean;
  hookType: 'question' | 'crisis' | 'surprise' | 'twist' | 'none';
  hookText: string;
  effectiveness: number; // 0-100
} {
  const lastPart = chapterContent.slice(-300); // 检查最后300字
  
  // 问题型钩子
  if (/[？?]$/.test(lastPart) || /到底|究竟|为何|为什么/.test(lastPart)) {
    return {
      hasHook: true,
      hookType: 'question',
      hookText: lastPart.slice(-100),
      effectiveness: 70
    };
  }
  
  // 危机型钩子
  if (/就在这时|突然|忽然|危险|不好/.test(lastPart)) {
    return {
      hasHook: true,
      hookType: 'crisis',
      hookText: lastPart.slice(-100),
      effectiveness: 85
    };
  }
  
  // 惊喜型钩子
  if (/竟然|居然|没想到|原来/.test(lastPart)) {
    return {
      hasHook: true,
      hookType: 'surprise',
      hookText: lastPart.slice(-100),
      effectiveness: 80
    };
  }
  
  // 转折型钩子
  if (/然而|但是|可是|不过/.test(lastPart)) {
    return {
      hasHook: true,
      hookType: 'twist',
      hookText: lastPart.slice(-100),
      effectiveness: 75
    };
  }
  
  return {
    hasHook: false,
    hookType: 'none',
    hookText: '',
    effectiveness: 0
  };
}

// ============ 综合分析 ============

/**
 * 对小说进行综合的网文能力分析
 */
export function analyzeWebNovelCapability(chapters: Array<{ title: string; content: string }>): WebNovelAnalysis {
  const allContent = chapters.map(c => c.content).join('\n');
  
  // 黄金三章分析
  const goldenThree = analyzeGoldenThreeChapters(chapters.slice(0, 3).map(c => c.content));
  
  // 爽点密度分析
  const coolPointAnalysis = analyzeCoolPointDensity(allContent);
  
  // 钩子有效性分析
  let totalHookScore = 0;
  let hookCount = 0;
  for (const chapter of chapters) {
    const hookAnalysis = detectChapterHook(chapter.content);
    if (hookAnalysis.hasHook) {
      totalHookScore += hookAnalysis.effectiveness;
      hookCount++;
    }
  }
  const hookEffectiveness = hookCount > 0 ? Math.round(totalHookScore / hookCount) : 0;
  
  // 节奏评分（基于章节长度变化和爽点分布）
  const rhythmScore = calculateRhythmScore(chapters, coolPointAnalysis.coolPoints);
  
  // 综合建议
  const suggestions: string[] = [];
  
  if (goldenThree.score < 70) {
    suggestions.push('开篇三章需要优化，建议增强钩子和冲突设计');
  }
  
  if (coolPointAnalysis.density < 2) {
    suggestions.push('爽点密度偏低，建议增加更多的高潮和反转');
  } else if (coolPointAnalysis.density > 7) {
    suggestions.push('爽点密度过高，可能导致疲劳，建议适当增加铺垫');
  }
  
  if (hookEffectiveness < 60) {
    suggestions.push('章末钩子不够有效，建议在每章结尾增加悬念');
  }
  
  if (rhythmScore < 60) {
    suggestions.push('节奏控制需要改进，建议设计小高潮-大高潮的波浪式结构');
  }
  
  return {
    goldenThreeChapters: {
      chapter1: {
        hook: goldenThree.analysis.chapter1.hasHook ? '✓ 有效钩子' : '✗ 缺少钩子',
        worldview: goldenThree.analysis.chapter1.hasWorldview ? '✓ 世界观呈现' : '✗ 世界观不明',
        protagonist: goldenThree.analysis.chapter1.hasProtagonist ? '✓ 主角登场' : '✗ 主角不突出'
      },
      chapter2: {
        conflict: goldenThree.analysis.chapter2.hasConflict ? '✓ 冲突明确' : '✗ 冲突不足',
        stakes: goldenThree.analysis.chapter2.hasStakes ? '✓ 风险清晰' : '✗ 风险不明',
        twist: goldenThree.analysis.chapter2.hasTwist ? '✓ 有转折' : '✗ 缺少转折'
      },
      chapter3: {
        climax: goldenThree.analysis.chapter3.hasClimax ? '✓ 有高潮' : '✗ 缺少高潮',
        resolution: goldenThree.analysis.chapter3.hasResolution ? '✓ 有解决' : '✗ 缺少解决',
        nextHook: goldenThree.analysis.chapter3.hasNextHook ? '✓ 有后续钩子' : '✗ 缺少后续钩子'
      }
    },
    rhythmScore,
    coolPointDensity: Math.round(coolPointAnalysis.density * 10) / 10,
    hookEffectiveness,
    suggestions
  };
}

/**
 * 计算节奏评分
 */
function calculateRhythmScore(
  chapters: Array<{ title: string; content: string }>,
  coolPoints: Array<{ type: string; position: number; text: string }>
): number {
  if (chapters.length === 0) return 0;
  
  // 检查章节长度变化（理想情况下应该有变化）
  const lengths = chapters.map(c => c.content.length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const lengthScore = Math.min(100, (variance / avgLength) * 100);
  
  // 检查爽点分布（理想情况下应该均匀分布）
  const chapterCoolPoints = chapters.map(() => 0);
  let currentPos = 0;
  for (let i = 0; i < chapters.length; i++) {
    const chapterEnd = currentPos + chapters[i].content.length;
    const pointsInChapter = coolPoints.filter(p => p.position >= currentPos && p.position < chapterEnd).length;
    chapterCoolPoints[i] = pointsInChapter;
    currentPos = chapterEnd;
  }
  
  const avgCoolPoints = chapterCoolPoints.reduce((a, b) => a + b, 0) / chapterCoolPoints.length;
  const coolPointVariance = chapterCoolPoints.reduce((sum, count) => sum + Math.pow(count - avgCoolPoints, 2), 0) / chapterCoolPoints.length;
  const distributionScore = Math.max(0, 100 - coolPointVariance * 20);
  
  return Math.round((lengthScore * 0.3 + distributionScore * 0.7));
}

// ============ 导出 ============

export default {
  WEB_NOVEL_PATTERNS,
  COOL_POINT_TYPES,
  analyzeGoldenThreeChapters,
  analyzeCoolPointDensity,
  detectChapterHook,
  analyzeWebNovelCapability
};
