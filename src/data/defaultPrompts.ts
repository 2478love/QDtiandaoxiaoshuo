import { PromptEntry } from '../types';

/**
 * 默认提示词库数据
 * 包含拆书分析、正文推进、简介策略、短篇灵感四大分类
 */
export const defaultPrompts: PromptEntry[] = [
  // ==================== 拆书分析 (analysis) ====================
  {
    id: 'default-analysis-1',
    title: '小说结构深度拆解',
    description: '分析一本小说的整体结构，包括起承转合、高潮设置、伏笔回收等要素',
    author: '天道官方',
    category: 'analysis',
    visibility: 'public',
    usageCount: 1280,
    iconType: 'book',
    isFavorite: false,
    tags: ['结构分析', '写作技巧'],
    content: `请对以下小说内容进行深度结构拆解分析：

【分析维度】
1. **三幕式结构**：识别开端、发展、高潮、结局的分界点
2. **情节节奏**：分析张弛有度的节奏把控，紧张与舒缓的交替
3. **伏笔与呼应**：找出文中的伏笔设置及其回收方式
4. **冲突层次**：分析主要冲突、次要冲突的设置与解决
5. **转折点**：识别关键的情节转折及其作用

【输出格式】
- 结构图谱（用文字描述）
- 各部分字数占比分析
- 亮点技巧总结
- 可借鉴的写作手法

【待分析内容】
{{content}}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-analysis-2',
    title: '人物塑造技法分析',
    description: '深入分析小说中人物的塑造方法，包括性格刻画、成长弧线、人物关系等',
    author: '天道官方',
    category: 'analysis',
    visibility: 'public',
    usageCount: 956,
    iconType: 'pen',
    isFavorite: false,
    tags: ['人物分析', '角色塑造'],
    content: `请分析以下小说中的人物塑造技法：

【分析要点】
1. **人物出场方式**：首次登场的描写技巧
2. **性格展现手法**：
   - 直接描写 vs 间接描写
   - 语言风格与性格匹配度
   - 行为动作的性格暗示
3. **人物弧光**：角色的成长变化轨迹
4. **人物关系网**：主要角色之间的关系与张力
5. **金句与标签**：令人印象深刻的台词或特征

【输出要求】
- 列出主要人物及其核心特征
- 分析每个角色的塑造手法
- 总结值得学习的技巧
- 指出可以改进的地方

【待分析内容】
{{content}}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-analysis-3',
    title: '爽点与钩子提取',
    description: '提取网文中的爽点设计和阅读钩子，学习如何抓住读者注意力',
    author: '天道官方',
    category: 'analysis',
    visibility: 'public',
    usageCount: 1543,
    iconType: 'star',
    isFavorite: false,
    tags: ['网文技巧', '爽点分析'],
    content: `请从以下内容中提取爽点设计和阅读钩子：

【爽点类型识别】
1. **打脸爽**：主角反击、逆袭的桥段
2. **升级爽**：实力提升、获得机缘的设计
3. **情感爽**：感情线的甜蜜或虐心设计
4. **智商爽**：主角展现智慧、计谋得逞
5. **装逼爽**：主角展示实力、惊艳众人

【钩子类型分析】
1. **悬念钩子**：未解之谜，吸引继续阅读
2. **期待钩子**：铺垫即将到来的精彩
3. **情感钩子**：牵动读者情绪的设计
4. **节奏钩子**：章末卡点技巧

【输出格式】
- 爽点清单（标注类型和位置）
- 钩子设计列表
- 节奏分析图
- 可复用的套路总结

【待分析内容】
{{content}}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-analysis-4',
    title: '世界观架构分析',
    description: '分析小说的世界观设定，包括力量体系、社会结构、历史背景等',
    author: '天道官方',
    category: 'analysis',
    visibility: 'public',
    usageCount: 872,
    iconType: 'box',
    isFavorite: false,
    tags: ['世界观', '设定分析'],
    content: `请分析以下小说的世界观架构：

【分析维度】
1. **力量体系**
   - 等级划分与晋升条件
   - 能力来源与限制
   - 体系的合理性与创新性

2. **社会结构**
   - 势力分布与权力格局
   - 社会阶层与流动性
   - 经济系统设定

3. **地理与历史**
   - 地图/区域划分
   - 重要历史事件
   - 文化差异设定

4. **规则与禁忌**
   - 世界运行的基本规则
   - 独特的设定亮点

【输出要求】
- 世界观框架图
- 设定的内在逻辑分析
- 创新点与借鉴价值
- 潜在的设定漏洞

【待分析内容】
{{content}}`,
    updatedAt: new Date().toISOString(),
  },

  // ==================== 正文推进 (text) ====================
  {
    id: 'default-text-1',
    title: '战斗场景生成器',
    description: '生成紧张刺激的战斗场景，包含动作描写、心理活动、环境互动',
    author: '天道官方',
    category: 'text',
    visibility: 'public',
    usageCount: 2341,
    iconType: 'sparkles',
    isFavorite: false,
    tags: ['战斗描写', '动作场景'],
    content: `请根据以下设定生成一段精彩的战斗场景：

【战斗设定】
- 主角：{{protagonist}}
- 对手：{{antagonist}}
- 战斗地点：{{location}}
- 主角当前状态：{{status}}
- 战斗目的：{{purpose}}

【写作要求】
1. **动作描写**：招式清晰，动作流畅，避免流水账
2. **节奏把控**：张弛有度，有快有慢
3. **感官调动**：视觉、听觉、触觉多维度描写
4. **心理刻画**：穿插角色的内心活动
5. **环境互动**：利用环境元素增加变数
6. **转折设计**：至少一个意外转折

【字数要求】约 {{word_count}} 字

【风格偏好】{{style}}`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-text-2',
    title: '情感对话场景',
    description: '生成细腻的情感对话，展现人物关系和情感变化',
    author: '天道官方',
    category: 'text',
    visibility: 'public',
    usageCount: 1876,
    iconType: 'pen',
    isFavorite: false,
    tags: ['对话写作', '情感描写'],
    content: `请根据以下设定生成一段情感对话场景：

【场景设定】
- 角色A：{{character_a}}（性格：{{personality_a}}）
- 角色B：{{character_b}}（性格：{{personality_b}}）
- 两人关系：{{relationship}}
- 当前情境：{{situation}}
- 情感基调：{{emotion_tone}}

【写作要求】
1. **对话特色**：每个角色有独特的说话方式
2. **潜台词**：对话中要有言外之意
3. **动作穿插**：适当加入表情、动作、小细节
4. **情感递进**：情感要有起伏变化
5. **留白艺术**：适当的沉默和省略

【输出格式】
场景描写 + 对话（带动作和心理描写）

【字数要求】约 {{word_count}} 字`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-text-3',
    title: '环境氛围渲染',
    description: '生成沉浸感强的环境描写，营造特定氛围',
    author: '天道官方',
    category: 'text',
    visibility: 'public',
    usageCount: 1234,
    iconType: 'sparkles',
    isFavorite: false,
    tags: ['环境描写', '氛围营造'],
    content: `请根据以下要求生成环境氛围描写：

【场景类型】{{scene_type}}
（如：废弃古堡、繁华都市、神秘森林、末世废墟等）

【氛围基调】{{atmosphere}}
（如：阴森恐怖、温馨治愈、紧张压抑、神秘莫测等）

【时间设定】{{time}}

【天气状况】{{weather}}

【写作要求】
1. **多感官描写**：
   - 视觉：色彩、光影、形状
   - 听觉：声音、寂静
   - 嗅觉：气味
   - 触觉：温度、质感
   - 味觉：（如适用）

2. **动静结合**：静态环境与动态元素

3. **情景交融**：环境暗示角色心境

4. **细节点睛**：独特的小细节增加真实感

【字数要求】约 {{word_count}} 字`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-text-4',
    title: '剧情转折推进',
    description: '根据当前剧情生成意想不到又合情合理的转折',
    author: '天道官方',
    category: 'text',
    visibility: 'public',
    usageCount: 1567,
    iconType: 'star',
    isFavorite: false,
    tags: ['剧情转折', '情节推进'],
    content: `请根据当前剧情设计一个精彩的转折：

【当前剧情概要】
{{current_plot}}

【主要角色状态】
{{characters_status}}

【已铺设的伏笔】
{{foreshadowing}}

【转折要求】
1. **意外性**：读者意料之外
2. **合理性**：情理之中，有前期铺垫
3. **影响力**：转折后对剧情有重大影响
4. **情感冲击**：能引发读者情绪波动

【转折类型偏好】{{twist_type}}
（如：反转身份、背叛揭露、真相大白、意外援助、隐藏实力等）

【输出内容】
1. 转折设计说明
2. 转折场景正文（约 {{word_count}} 字）
3. 后续剧情走向建议`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-text-5',
    title: '升级打怪桥段',
    description: '生成主角获得机缘、实力提升的精彩桥段',
    author: '天道官方',
    category: 'text',
    visibility: 'public',
    usageCount: 1892,
    iconType: 'star',
    isFavorite: false,
    tags: ['升级流', '爽文'],
    content: `请生成一段主角升级的精彩桥段：

【主角信息】
- 名字：{{protagonist_name}}
- 当前境界：{{current_level}}
- 即将突破：{{next_level}}
- 修炼体系：{{power_system}}

【升级契机】{{opportunity}}
（如：奇遇、顿悟、生死激发、丹药辅助等）

【场景设定】{{scene}}

【写作要求】
1. **突破过程**：
   - 瓶颈的感受描写
   - 突破时的异象
   - 力量蜕变的体验

2. **爽点设计**：
   - 实力提升的具体表现
   - 周围人的震惊反应
   - 新能力的初次展示

3. **铺垫后续**：为下一阶段埋下伏笔

【字数要求】约 {{word_count}} 字`,
    updatedAt: new Date().toISOString(),
  },

  // ==================== 简介策略 (synopsis) ====================
  {
    id: 'default-synopsis-1',
    title: '黄金三段式简介',
    description: '用经典三段式结构撰写吸引读者的小说简介',
    author: '天道官方',
    category: 'synopsis',
    visibility: 'public',
    usageCount: 2156,
    iconType: 'file',
    isFavorite: false,
    tags: ['简介模板', '吸引读者'],
    content: `请为以下小说撰写黄金三段式简介：

【小说信息】
- 书名：{{book_title}}
- 类型：{{genre}}
- 主角：{{protagonist}}
- 核心卖点：{{selling_point}}
- 主要剧情：{{main_plot}}

【三段式结构】

**第一段：悬念钩子（1-2句）**
- 用最吸引人的设定或冲突开场
- 制造好奇心和阅读欲望

**第二段：核心看点（2-3句）**
- 展示主角的独特之处
- 突出本书最大的爽点/卖点
- 暗示精彩的剧情走向

**第三段：情绪共鸣（1-2句）**
- 引发读者情感共鸣
- 或以金句收尾，留下深刻印象

【要求】
- 总字数控制在100-150字
- 语言要有画面感和冲击力
- 避免剧透关键情节
- 突出与同类作品的差异化`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-synopsis-2',
    title: '悬念钩子简介',
    description: '用强悬念开头抓住读者眼球的简介写法',
    author: '天道官方',
    category: 'synopsis',
    visibility: 'public',
    usageCount: 1678,
    iconType: 'sparkles',
    isFavorite: false,
    tags: ['悬念设计', '开篇吸引'],
    content: `请为小说撰写悬念钩子式简介：

【小说信息】
- 书名：{{book_title}}
- 类型：{{genre}}
- 核心悬念：{{mystery}}
- 主角设定：{{protagonist}}

【悬念类型选择】
1. **问题式**：抛出一个引人深思的问题
2. **矛盾式**：展示一个看似不可能的矛盾
3. **预言式**：暗示一个震撼的结局
4. **倒叙式**：从结果开始，引发对过程的好奇

【输出要求】
- 开头第一句必须抓住眼球
- 制造3个以上的悬念点
- 让读者产生"这怎么可能"的好奇
- 字数100-120字`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-synopsis-3',
    title: '情绪共鸣简介',
    description: '通过情感共鸣打动读者的简介写法',
    author: '天道官方',
    category: 'synopsis',
    visibility: 'public',
    usageCount: 1432,
    iconType: 'pen',
    isFavorite: false,
    tags: ['情感共鸣', '走心简介'],
    content: `请为小说撰写情绪共鸣式简介：

【小说信息】
- 书名：{{book_title}}
- 类型：{{genre}}
- 情感主线：{{emotion_line}}
- 目标读者：{{target_audience}}
- 核心情感：{{core_emotion}}
（如：孤独感、逆袭欲、爱情向往、家国情怀等）

【写作策略】
1. **代入感开头**：让读者看到自己的影子
2. **痛点触发**：戳中目标读者的情感痛点
3. **希望给予**：暗示故事能带来的情感满足
4. **金句收尾**：一句话引发共鸣

【输出要求】
- 语言要走心，不要太商业化
- 让读者感觉"这就是为我写的"
- 字数80-120字`,
    updatedAt: new Date().toISOString(),
  },

  // ==================== 短篇灵感 (short) ====================
  {
    id: 'default-short-1',
    title: '微型小说生成器',
    description: '生成完整的500-1000字微型小说，含起承转合',
    author: '天道官方',
    category: 'short',
    visibility: 'public',
    usageCount: 1987,
    iconType: 'sparkles',
    isFavorite: false,
    tags: ['微型小说', '完整故事'],
    content: `请生成一篇完整的微型小说：

【故事设定】
- 题材：{{genre}}
- 主题：{{theme}}
- 情感基调：{{tone}}
- 结局类型：{{ending_type}}
（如：反转结局、温馨结局、开放结局、悲剧结局）

【结构要求】
1. **开头（约100字）**：快速建立场景和人物
2. **发展（约300字）**：推进情节，制造矛盾
3. **高潮（约200字）**：矛盾激化或转折
4. **结尾（约100字）**：收束故事，点明主题

【写作要求】
- 人物不超过3个
- 场景集中，不要太分散
- 对话精炼有力
- 结尾要有余味

【字数】约700字`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-short-2',
    title: '创意故事种子',
    description: '生成独特的故事创意和开头，激发创作灵感',
    author: '天道官方',
    category: 'short',
    visibility: 'public',
    usageCount: 2234,
    iconType: 'box',
    isFavorite: false,
    tags: ['创意灵感', '故事种子'],
    content: `请为我生成独特的故事创意：

【偏好设定】
- 类型偏好：{{genre_preference}}
- 元素关键词：{{keywords}}
- 创新程度：{{innovation_level}}
（1-保守融合 2-适度创新 3-大胆突破）

【输出内容】
1. **故事概念**（一句话描述核心创意）

2. **独特设定**（与众不同的世界观或规则）

3. **角色雏形**
   - 主角：背景、特点、动机
   - 关键配角：作用和关系

4. **核心冲突**（推动故事的主要矛盾）

5. **开篇示例**（200字左右的开头）

6. **发展方向建议**（3个可能的剧情走向）

【要求】
- 创意要有新意，避免俗套
- 设定要有内在逻辑
- 具有展开成长篇的潜力`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-short-3',
    title: '反转结局短篇',
    description: '生成带有精彩反转的短篇故事',
    author: '天道官方',
    category: 'short',
    visibility: 'public',
    usageCount: 1756,
    iconType: 'star',
    isFavorite: false,
    tags: ['反转', '悬疑'],
    content: `请生成一篇带有精彩反转的短篇故事：

【反转类型】{{twist_type}}
（如：身份反转、视角反转、时间反转、真相反转、情感反转）

【故事基调】{{tone}}

【表面剧情】
故事表面看起来是：{{surface_story}}

【隐藏真相】
实际上的真相是：{{hidden_truth}}
（如不填写，请AI自行设计）

【写作要求】
1. **铺垫自然**：反转前的伏笔要自然不刻意
2. **逻辑严密**：反转后重读要处处有暗示
3. **冲击力强**：反转要有足够的震撼效果
4. **回味无穷**：结尾留有思考空间

【字数】约800-1000字`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-short-4',
    title: '一句话故事扩写',
    description: '从一句话概念扩展成完整短篇',
    author: '天道官方',
    category: 'short',
    visibility: 'public',
    usageCount: 1543,
    iconType: 'pen',
    isFavorite: false,
    tags: ['扩写', '创意发散'],
    content: `请将以下一句话扩写成完整短篇：

【故事种子】
{{one_sentence}}

【扩写要求】
1. **保留核心**：故事必须围绕这句话的核心概念
2. **丰富细节**：添加人物、场景、情节细节
3. **情感饱满**：让故事有情感厚度
4. **结构完整**：有清晰的开始、发展、结尾

【风格偏好】{{style}}
（如：文艺抒情、黑色幽默、温暖治愈、冷峻现实）

【字数要求】{{word_count}}字

【输出】
直接输出扩写后的完整短篇故事`,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'default-short-5',
    title: '命题创作挑战',
    description: '根据随机命题元素创作短篇，锻炼创作能力',
    author: '天道官方',
    category: 'short',
    visibility: 'public',
    usageCount: 1234,
    iconType: 'box',
    isFavorite: false,
    tags: ['写作练习', '命题创作'],
    content: `请根据以下命题元素创作短篇：

【必须包含的元素】
- 人物：{{character}}
- 物品：{{item}}
- 地点：{{location}}
- 情感：{{emotion}}
- 关键词：{{keyword}}

【限制条件】
- 故事必须在24小时内发生
- 至少有一次对话
- 结尾必须与开头呼应

【创作挑战等级】{{difficulty}}
- 简单：元素自然融入即可
- 中等：元素要成为推动情节的关键
- 困难：所有元素必须有因果关联

【字数】约600-800字

【输出】
直接输出完整短篇，并在文末简述创作思路`,
    updatedAt: new Date().toISOString(),
  },
];
