/**
 * 灵感生成器
 * 
 * 功能：
 * - 基于当前剧情生成下一步可能性
 * - 随机事件生成器
 * - 冲突点生成器
 * - 转折点建议
 */

export interface InspirationOptions {
  currentContext: string; // 当前剧情上下文
  genre?: string; // 类型
  characters?: string[]; // 当前角色
  location?: string; // 当前地点
  mood?: string; // 当前氛围
  previousEvents?: string[]; // 之前的事件
}

export interface Inspiration {
  type: 'next-step' | 'random-event' | 'conflict' | 'twist' | 'dialogue' | 'scene';
  title: string;
  description: string;
  details: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  impact: 'low' | 'medium' | 'high';
  tags: string[];
  relatedCharacters?: string[];
  estimatedWords?: number;
}

export interface ConflictInspiration extends Inspiration {
  type: 'conflict';
  conflictType: 'internal' | 'interpersonal' | 'external' | 'ideological';
  stakes: string;
  resolution?: string;
}

export interface TwistInspiration extends Inspiration {
  type: 'twist';
  twistType: 'reveal' | 'betrayal' | 'reversal' | 'discovery';
  setup: string;
  payoff: string;
}

/**
 * 生成下一步可能性
 */
export function generateNextStepIdeas(options: InspirationOptions): Inspiration[] {
  const ideas: Inspiration[] = [];
  const { currentContext, genre = '玄幻', characters = [], location = '' } = options;

  // 基于类型生成不同的可能性
  if (genre.includes('玄幻') || genre.includes('修真')) {
    ideas.push(
      {
        type: 'next-step',
        title: '突破境界',
        description: '主角在关键时刻突破当前境界',
        details: [
          '感悟天地法则',
          '吸收灵气突破',
          '战斗中顿悟',
          '获得机缘相助',
        ],
        difficulty: 'medium',
        impact: 'high',
        tags: ['修炼', '突破', '爽点'],
        estimatedWords: 2000,
      },
      {
        type: 'next-step',
        title: '遇到强敌',
        description: '出现实力强大的对手',
        details: [
          '敌人展现压倒性实力',
          '主角陷入危机',
          '需要智取或逃脱',
          '为后续复仇埋下伏笔',
        ],
        difficulty: 'hard',
        impact: 'high',
        tags: ['冲突', '危机', '伏笔'],
        estimatedWords: 2500,
      },
      {
        type: 'next-step',
        title: '发现宝物',
        description: '意外发现珍贵的宝物或功法',
        details: [
          '探索秘境',
          '击败守护者',
          '获得传承',
          '实力提升',
        ],
        difficulty: 'easy',
        impact: 'medium',
        tags: ['机缘', '宝物', '爽点'],
        estimatedWords: 1800,
      }
    );
  }

  if (genre.includes('都市')) {
    ideas.push(
      {
        type: 'next-step',
        title: '商业对决',
        description: '与竞争对手展开商业竞争',
        details: [
          '策划商业计划',
          '智斗对手',
          '展现商业才能',
          '获得胜利',
        ],
        difficulty: 'medium',
        impact: 'medium',
        tags: ['商战', '智斗', '爽点'],
        estimatedWords: 2200,
      },
      {
        type: 'next-step',
        title: '打脸装逼',
        description: '在社交场合展现实力',
        details: [
          '被人轻视',
          '展现真实身份',
          '众人震惊',
          '获得尊重',
        ],
        difficulty: 'easy',
        impact: 'high',
        tags: ['打脸', '装逼', '爽点'],
        estimatedWords: 1500,
      }
    );
  }

  // 通用可能性
  ideas.push(
    {
      type: 'next-step',
      title: '新角色登场',
      description: '引入新的重要角色',
      details: [
        '神秘人物出现',
        '展现独特能力',
        '与主角产生联系',
        '推动剧情发展',
      ],
      difficulty: 'medium',
      impact: 'medium',
      tags: ['角色', '剧情'],
      estimatedWords: 1800,
    },
    {
      type: 'next-step',
      title: '揭示秘密',
      description: '揭露之前埋下的伏笔',
      details: [
        '真相浮出水面',
        '角色反应',
        '剧情转折',
        '新的目标',
      ],
      difficulty: 'hard',
      impact: 'high',
      tags: ['伏笔', '转折', '剧情'],
      estimatedWords: 2000,
    }
  );

  return ideas;
}

/**
 * 生成随机事件
 */
export function generateRandomEvent(options: InspirationOptions): Inspiration {
  const events = [
    {
      type: 'random-event' as const,
      title: '意外相遇',
      description: '主角偶然遇到重要人物',
      details: [
        '在意想不到的地方',
        '对方有特殊身份',
        '可能是敌是友',
        '改变后续走向',
      ],
      difficulty: 'easy' as const,
      impact: 'medium' as const,
      tags: ['偶遇', '剧情'],
      estimatedWords: 1500,
    },
    {
      type: 'random-event' as const,
      title: '突发危机',
      description: '突然出现的危险情况',
      details: [
        '环境突变',
        '敌人袭击',
        '自然灾害',
        '需要应对',
      ],
      difficulty: 'medium' as const,
      impact: 'high' as const,
      tags: ['危机', '冲突'],
      estimatedWords: 2000,
    },
    {
      type: 'random-event' as const,
      title: '意外收获',
      description: '获得意想不到的好处',
      details: [
        '偶然发现',
        '他人赠予',
        '任务奖励',
        '实力提升',
      ],
      difficulty: 'easy' as const,
      impact: 'medium' as const,
      tags: ['机缘', '爽点'],
      estimatedWords: 1200,
    },
    {
      type: 'random-event' as const,
      title: '误会冲突',
      description: '因误会产生的冲突',
      details: [
        '信息不对称',
        '产生误解',
        '冲突升级',
        '最终解开',
      ],
      difficulty: 'medium' as const,
      impact: 'medium' as const,
      tags: ['冲突', '误会'],
      estimatedWords: 1800,
    },
    {
      type: 'random-event' as const,
      title: '神秘线索',
      description: '发现指向更大秘密的线索',
      details: [
        '偶然获得',
        '引发好奇',
        '开始调查',
        '埋下伏笔',
      ],
      difficulty: 'easy' as const,
      impact: 'low' as const,
      tags: ['伏笔', '悬念'],
      estimatedWords: 1000,
    },
  ];

  return events[Math.floor(Math.random() * events.length)];
}

/**
 * 生成冲突点
 */
export function generateConflict(options: InspirationOptions): ConflictInspiration {
  const conflicts: ConflictInspiration[] = [
    {
      type: 'conflict',
      conflictType: 'interpersonal',
      title: '利益冲突',
      description: '与他人因利益产生矛盾',
      details: [
        '双方目标相悖',
        '资源有限',
        '必须竞争',
        '产生对立',
      ],
      stakes: '失败将失去重要资源或机会',
      resolution: '通过实力或智慧获胜',
      difficulty: 'medium',
      impact: 'high',
      tags: ['冲突', '竞争'],
      estimatedWords: 2500,
    },
    {
      type: 'conflict',
      conflictType: 'internal',
      title: '内心挣扎',
      description: '面临艰难的道德选择',
      details: [
        '两难境地',
        '价值观冲突',
        '内心煎熬',
        '最终抉择',
      ],
      stakes: '选择将影响人物性格和后续发展',
      resolution: '做出符合人设的选择',
      difficulty: 'hard',
      impact: 'high',
      tags: ['内心', '成长'],
      estimatedWords: 2000,
    },
    {
      type: 'conflict',
      conflictType: 'external',
      title: '环境挑战',
      description: '面对恶劣环境或强大敌人',
      details: [
        '处境危险',
        '实力不足',
        '需要突破',
        '绝地求生',
      ],
      stakes: '失败可能导致生命危险',
      resolution: '突破极限，化险为夷',
      difficulty: 'hard',
      impact: 'high',
      tags: ['危机', '突破'],
      estimatedWords: 3000,
    },
    {
      type: 'conflict',
      conflictType: 'ideological',
      title: '理念对立',
      description: '与他人理念不合产生冲突',
      details: [
        '价值观差异',
        '互不认同',
        '言语交锋',
        '可能动手',
      ],
      stakes: '关系到未来的道路选择',
      resolution: '坚持自己的理念',
      difficulty: 'medium',
      impact: 'medium',
      tags: ['理念', '对立'],
      estimatedWords: 2200,
    },
  ];

  return conflicts[Math.floor(Math.random() * conflicts.length)];
}

/**
 * 生成转折点
 */
export function generateTwist(options: InspirationOptions): TwistInspiration {
  const twists: TwistInspiration[] = [
    {
      type: 'twist',
      twistType: 'reveal',
      title: '身份揭露',
      description: '某个角色的真实身份被揭露',
      details: [
        '隐藏的身份',
        '意外暴露',
        '众人震惊',
        '剧情转折',
      ],
      setup: '之前埋下身份疑点',
      payoff: '真相大白，改变局势',
      difficulty: 'medium',
      impact: 'high',
      tags: ['转折', '身份', '反转'],
      estimatedWords: 2000,
    },
    {
      type: 'twist',
      twistType: 'betrayal',
      title: '背叛反转',
      description: '信任的人突然背叛',
      details: [
        '看似忠诚',
        '突然反水',
        '主角受创',
        '寻求复仇',
      ],
      setup: '建立信任关系',
      payoff: '背叛带来巨大冲击',
      difficulty: 'hard',
      impact: 'high',
      tags: ['背叛', '反转', '冲突'],
      estimatedWords: 2500,
    },
    {
      type: 'twist',
      twistType: 'reversal',
      title: '局势逆转',
      description: '看似必败的局面突然逆转',
      details: [
        '陷入绝境',
        '隐藏底牌',
        '突然反击',
        '绝地翻盘',
      ],
      setup: '营造绝望氛围',
      payoff: '反转带来爽感',
      difficulty: 'medium',
      impact: 'high',
      tags: ['反转', '爽点', '高潮'],
      estimatedWords: 2200,
    },
    {
      type: 'twist',
      twistType: 'discovery',
      title: '真相发现',
      description: '发现事件背后的真相',
      details: [
        '调查线索',
        '拼凑真相',
        '恍然大悟',
        '改变认知',
      ],
      setup: '散布疑点和线索',
      payoff: '真相揭示，推动剧情',
      difficulty: 'hard',
      impact: 'medium',
      tags: ['真相', '悬念', '剧情'],
      estimatedWords: 1800,
    },
  ];

  return twists[Math.floor(Math.random() * twists.length)];
}

/**
 * 生成对话灵感
 */
export function generateDialogueIdea(options: InspirationOptions): Inspiration {
  const dialogues = [
    {
      type: 'dialogue' as const,
      title: '激烈争论',
      description: '角色之间的激烈辩论',
      details: [
        '观点对立',
        '言辞激烈',
        '互不相让',
        '展现性格',
      ],
      difficulty: 'medium' as const,
      impact: 'medium' as const,
      tags: ['对话', '冲突'],
      estimatedWords: 1500,
    },
    {
      type: 'dialogue' as const,
      title: '幽默调侃',
      description: '轻松幽默的对话',
      details: [
        '缓解紧张',
        '展现关系',
        '增加趣味',
        '调节节奏',
      ],
      difficulty: 'easy' as const,
      impact: 'low' as const,
      tags: ['对话', '幽默'],
      estimatedWords: 800,
    },
    {
      type: 'dialogue' as const,
      title: '深度交流',
      description: '角色之间的深入对话',
      details: [
        '敞开心扉',
        '分享秘密',
        '增进理解',
        '深化关系',
      ],
      difficulty: 'hard' as const,
      impact: 'medium' as const,
      tags: ['对话', '情感'],
      estimatedWords: 2000,
    },
  ];

  return dialogues[Math.floor(Math.random() * dialogues.length)];
}

/**
 * 生成场景灵感
 */
export function generateSceneIdea(options: InspirationOptions): Inspiration {
  const scenes = [
    {
      type: 'scene' as const,
      title: '激烈战斗',
      description: '精彩的战斗场面',
      details: [
        '招式对决',
        '实力展现',
        '战术运用',
        '决出胜负',
      ],
      difficulty: 'hard' as const,
      impact: 'high' as const,
      tags: ['战斗', '动作', '爽点'],
      estimatedWords: 3000,
    },
    {
      type: 'scene' as const,
      title: '温馨日常',
      description: '日常生活场景',
      details: [
        '放松氛围',
        '角色互动',
        '展现性格',
        '调节节奏',
      ],
      difficulty: 'easy' as const,
      impact: 'low' as const,
      tags: ['日常', '轻松'],
      estimatedWords: 1200,
    },
    {
      type: 'scene' as const,
      title: '紧张追逐',
      description: '追逐或逃亡场景',
      details: [
        '紧张刺激',
        '环境利用',
        '智慧应对',
        '惊险脱困',
      ],
      difficulty: 'medium' as const,
      impact: 'high' as const,
      tags: ['追逐', '紧张', '动作'],
      estimatedWords: 2500,
    },
  ];

  return scenes[Math.floor(Math.random() * scenes.length)];
}

/**
 * 批量生成灵感
 */
export function generateInspirationBatch(
  options: InspirationOptions,
  count: number = 10
): Inspiration[] {
  const inspirations: Inspiration[] = [];

  // 生成各种类型的灵感
  const types = ['next-step', 'random-event', 'conflict', 'twist', 'dialogue', 'scene'];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    
    switch (type) {
      case 'next-step':
        inspirations.push(...generateNextStepIdeas(options).slice(0, 1));
        break;
      case 'random-event':
        inspirations.push(generateRandomEvent(options));
        break;
      case 'conflict':
        inspirations.push(generateConflict(options));
        break;
      case 'twist':
        inspirations.push(generateTwist(options));
        break;
      case 'dialogue':
        inspirations.push(generateDialogueIdea(options));
        break;
      case 'scene':
        inspirations.push(generateSceneIdea(options));
        break;
    }
  }

  return inspirations;
}

/**
 * 根据标签筛选灵感
 */
export function filterInspirationsByTags(
  inspirations: Inspiration[],
  tags: string[]
): Inspiration[] {
  return inspirations.filter(insp =>
    tags.some(tag => insp.tags.includes(tag))
  );
}

/**
 * 根据影响力排序
 */
export function sortByImpact(inspirations: Inspiration[]): Inspiration[] {
  const impactOrder = { high: 3, medium: 2, low: 1 };
  return [...inspirations].sort((a, b) => impactOrder[b.impact] - impactOrder[a.impact]);
}

/**
 * 根据难度排序
 */
export function sortByDifficulty(inspirations: Inspiration[]): Inspiration[] {
  const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
  return [...inspirations].sort((a, b) => difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]);
}
