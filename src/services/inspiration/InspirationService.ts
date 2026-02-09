// 灵感卡片类型定义
export interface InspirationCard {
  id: string;
  type: 'plot' | 'character' | 'scene' | 'dialogue' | 'conflict' | 'emotion' | 'twist';
  title: string;
  content: string;
  tags: string[];
  examples: string[];
  usageCount: number;
  createdAt: string;
}

// 预设灵感卡片库
export const inspirationCards: InspirationCard[] = [
  // 情节类
  {
    id: 'plot-001',
    type: 'plot',
    title: '意外重逢',
    content: '主角与多年未见的故人意外重逢，揭开尘封的往事',
    tags: ['重逢', '回忆', '情感'],
    examples: [
      '在繁华的都市街头，主角偶遇曾经的初恋，往事如潮水般涌来',
      '修炼大会上，主角发现昔日的师兄弟，却已物是人非',
      '任务途中，主角遇到失散多年的亲人，却发现对方已成为敌对势力'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'plot-002',
    type: 'plot',
    title: '绝境反击',
    content: '主角陷入绝境，在生死关头爆发潜力，实现逆转',
    tags: ['逆转', '爆发', '高潮'],
    examples: [
      '被强敌逼入绝境，主角突破境界，一举反败为胜',
      '面对必死之局，主角领悟新的技能，绝地反击',
      '在众人绝望之时，主角挺身而出，力挽狂澜'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'plot-003',
    type: 'plot',
    title: '真相揭露',
    content: '隐藏已久的真相被揭开，改变主角对世界的认知',
    tags: ['真相', '反转', '震撼'],
    examples: [
      '主角发现自己的身世之谜，原来是某个大势力的后裔',
      '一直信任的师父，竟然是幕后黑手',
      '世界的真实面目被揭开，原来一切都是阴谋'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'plot-004',
    type: 'plot',
    title: '获得奇遇',
    content: '主角意外获得强大的机缘，实力大增',
    tags: ['奇遇', '机缘', '提升'],
    examples: [
      '在古老遗迹中，主角获得上古传承',
      '误入秘境，得到神秘老者的指点',
      '偶然发现天材地宝，修为突飞猛进'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'plot-005',
    type: 'plot',
    title: '背叛与复仇',
    content: '主角遭受背叛，踏上复仇之路',
    tags: ['背叛', '复仇', '黑化'],
    examples: [
      '被最信任的兄弟出卖，主角发誓要讨回公道',
      '家族被灭，主角隐忍多年，终于等到复仇的机会',
      '爱人被夺，主角性情大变，走上复仇之路'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },

  // 人物类
  {
    id: 'character-001',
    type: 'character',
    title: '神秘高手',
    content: '看似普通的人物，实则隐藏着惊人的实力',
    tags: ['高手', '隐藏', '反差'],
    examples: [
      '街边的乞丐，竟是隐世的绝世高手',
      '不起眼的店小二，实则是某个大势力的暗哨',
      '看似柔弱的少女，却拥有毁天灭地的力量'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'character-002',
    type: 'character',
    title: '亦敌亦友',
    content: '与主角关系复杂，时而合作时而对立的角色',
    tags: ['复杂', '对手', '伙伴'],
    examples: [
      '实力相当的对手，在关键时刻选择联手',
      '立场不同但惺惺相惜的宿敌',
      '为了共同目标暂时合作的竞争者'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'character-003',
    type: 'character',
    title: '忠诚追随者',
    content: '对主角忠心耿耿，愿意付出一切的伙伴',
    tags: ['忠诚', '伙伴', '感动'],
    examples: [
      '从小一起长大的兄弟，生死与共',
      '被主角救下的少年，发誓终生追随',
      '看透主角潜力的智者，甘愿辅佐'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },

  // 场景类
  {
    id: 'scene-001',
    type: 'scene',
    title: '生死决战',
    content: '紧张刺激的战斗场面，决定命运的关键一战',
    tags: ['战斗', '紧张', '高潮'],
    examples: [
      '在擂台上，两位绝世高手展开巅峰对决',
      '生死擂台，败者必死，胜者为王',
      '在众目睽睽之下，主角与宿敌展开最终决战'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scene-002',
    type: 'scene',
    title: '温馨日常',
    content: '轻松愉快的日常场景，展现人物关系',
    tags: ['日常', '温馨', '轻松'],
    examples: [
      '在客栈中，众人围坐一桌，谈笑风生',
      '修炼之余，主角与伙伴们闲聊往事',
      '在集市上闲逛，体验人间烟火'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'scene-003',
    type: 'scene',
    title: '探索秘境',
    content: '进入神秘未知的区域，充满危险与机遇',
    tags: ['探险', '神秘', '危险'],
    examples: [
      '深入古老的遗迹，寻找传说中的宝藏',
      '误入禁地，遭遇各种机关陷阱',
      '在秘境深处，发现惊人的秘密'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },

  // 对话类
  {
    id: 'dialogue-001',
    type: 'dialogue',
    title: '霸气宣言',
    content: '主角展现强大气场，震慑全场的台词',
    tags: ['霸气', '震撼', '气场'],
    examples: [
      '"今日之后，再无人敢小觑我！"',
      '"我命由我不由天，谁敢阻我，杀无赦！"',
      '"区区蝼蚁，也敢在我面前放肆？"'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'dialogue-002',
    type: 'dialogue',
    title: '深情告白',
    content: '感人至深的情感表达',
    tags: ['情感', '告白', '感动'],
    examples: [
      '"无论天涯海角，我都会找到你。"',
      '"这一生，我只为你而活。"',
      '"即使全世界与你为敌，我也会站在你身边。"'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'dialogue-003',
    type: 'dialogue',
    title: '智慧箴言',
    content: '富含哲理的对话，引人深思',
    tags: ['哲理', '智慧', '深刻'],
    examples: [
      '"真正的强者，不是战胜别人，而是战胜自己。"',
      '"力量本身没有善恶，关键在于使用它的人。"',
      '"有些路，注定要一个人走。"'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },

  // 冲突类
  {
    id: 'conflict-001',
    type: 'conflict',
    title: '道德困境',
    content: '主角面临两难选择，必须在正义与亲情之间抉择',
    tags: ['两难', '抉择', '道德'],
    examples: [
      '为了拯救苍生，必须牺牲至亲',
      '发现真相后，是揭露还是隐瞒',
      '正义与亲情的冲突，如何选择'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'conflict-002',
    type: 'conflict',
    title: '立场对立',
    content: '因立场不同而产生的冲突',
    tags: ['立场', '对立', '矛盾'],
    examples: [
      '正邪两道的对立，没有对错只有立场',
      '为了各自的信念，昔日好友反目成仇',
      '家族利益与个人理想的冲突'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },

  // 情感类
  {
    id: 'emotion-001',
    type: 'emotion',
    title: '悲痛欲绝',
    content: '失去重要之人的痛苦与悲伤',
    tags: ['悲伤', '痛苦', '失去'],
    examples: [
      '眼睁睁看着亲人离世，却无能为力',
      '爱人为保护自己而死，主角悲痛欲绝',
      '师父惨死，主角发誓要为其报仇'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'emotion-002',
    type: 'emotion',
    title: '狂喜若狂',
    content: '达成目标或获得成功的喜悦',
    tags: ['喜悦', '成功', '兴奋'],
    examples: [
      '终于突破瓶颈，实力大增',
      '完成不可能的任务，获得认可',
      '找到失散多年的亲人，喜极而泣'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },

  // 转折类
  {
    id: 'twist-001',
    type: 'twist',
    title: '身份反转',
    content: '角色的真实身份被揭露，出人意料',
    tags: ['反转', '身份', '惊讶'],
    examples: [
      '一直以为的敌人，竟是失散多年的亲人',
      '看似弱小的角色，实则是隐藏的大BOSS',
      '主角的真实身份震惊所有人'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  },
  {
    id: 'twist-002',
    type: 'twist',
    title: '计划反转',
    content: '精心策划的计划出现意外变化',
    tags: ['反转', '计划', '意外'],
    examples: [
      '以为万无一失的计划，却被对手识破',
      '主角将计就计，反而利用敌人的阴谋',
      '看似失败的行动，实则是更大计划的一部分'
    ],
    usageCount: 0,
    createdAt: new Date().toISOString()
  }
];

// 灵感库服务
export class InspirationService {
  // 获取所有卡片
  static getAllCards(): InspirationCard[] {
    return inspirationCards;
  }

  // 按类型筛选
  static getCardsByType(type: InspirationCard['type']): InspirationCard[] {
    return inspirationCards.filter(card => card.type === type);
  }

  // 按标签筛选
  static getCardsByTag(tag: string): InspirationCard[] {
    return inspirationCards.filter(card => card.tags.includes(tag));
  }

  // 搜索卡片
  static searchCards(keyword: string): InspirationCard[] {
    const lowerKeyword = keyword.toLowerCase();
    return inspirationCards.filter(card => 
      card.title.toLowerCase().includes(lowerKeyword) ||
      card.content.toLowerCase().includes(lowerKeyword) ||
      card.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
    );
  }

  // 随机获取卡片
  static getRandomCard(type?: InspirationCard['type']): InspirationCard {
    const cards = type ? this.getCardsByType(type) : inspirationCards;
    const randomIndex = Math.floor(Math.random() * cards.length);
    return cards[randomIndex];
  }

  // 获取多张随机卡片
  static getRandomCards(count: number, type?: InspirationCard['type']): InspirationCard[] {
    const cards = type ? this.getCardsByType(type) : inspirationCards;
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  }

  // 获取所有类型
  static getAllTypes(): Array<{ id: InspirationCard['type']; label: string; icon: string }> {
    return [
      { id: 'plot', label: '情节', icon: '📖' },
      { id: 'character', label: '人物', icon: '👤' },
      { id: 'scene', label: '场景', icon: '🎬' },
      { id: 'dialogue', label: '对话', icon: '💬' },
      { id: 'conflict', label: '冲突', icon: '⚔️' },
      { id: 'emotion', label: '情感', icon: '❤️' },
      { id: 'twist', label: '转折', icon: '🔄' }
    ];
  }

  // 获取所有标签
  static getAllTags(): string[] {
    const tagsSet = new Set<string>();
    inspirationCards.forEach(card => {
      card.tags.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }

  // 增加使用次数
  static incrementUsage(cardId: string): void {
    const card = inspirationCards.find(c => c.id === cardId);
    if (card) {
      card.usageCount++;
    }
  }

  // 获取热门卡片
  static getPopularCards(limit: number = 10): InspirationCard[] {
    return [...inspirationCards]
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }
}
