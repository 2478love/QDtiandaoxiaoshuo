export interface Chapter {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  volumeId?: string; // 所属卷 ID
  versions?: ChapterVersion[]; // 版本历史
}

// 章节版本历史
export interface ChapterVersion {
  id: string;
  chapterId: string;
  content: string;
  wordCount: number;
  createdAt: string;
  note?: string; // 版本备注
}

// 大纲节点接口
export interface OutlineNode {
  id: string;
  title: string;
  content: string;
  type: 'volume' | 'chapter' | 'scene' | 'note'; // 节点类型
  parentId?: string; // 父节点ID
  order: number; // 排序
  chapterId?: string; // 关联的章节ID
  status: 'planned' | 'writing' | 'completed'; // 状态
  createdAt: string;
  updatedAt: string;
}

// 伏笔接口
export interface Foreshadowing {
  id: string;
  title: string;
  description: string;
  plantedChapterId?: string; // 埋设章节ID
  plantedPosition?: string; // 埋设位置描述
  resolvedChapterId?: string; // 回收章节ID
  resolvedPosition?: string; // 回收位置描述
  status: 'planted' | 'resolved' | 'abandoned'; // 状态：已埋设/已回收/已废弃
  importance: 'high' | 'medium' | 'low'; // 重要程度
  relatedCharacters: string[]; // 相关人物ID
  notes: string; // 备注
  createdAt: string;
  updatedAt: string;
}

// 人物关系接口
export interface CharacterRelation {
  id: string;
  sourceId: string; // 源人物ID
  targetId: string; // 目标人物ID
  relationType: string; // 关系类型：朋友、敌人、师徒、恋人等
  description: string; // 关系描述
  startChapterId?: string; // 关系开始章节
  endChapterId?: string; // 关系结束章节（如有变化）
  createdAt: string;
}

// 写作目标接口
export interface WritingGoal {
  id: string;
  type: 'daily' | 'weekly' | 'monthly' | 'total'; // 目标类型
  targetWords: number; // 目标字数
  currentWords: number; // 当前字数
  startDate: string; // 开始日期
  endDate?: string; // 结束日期
  isActive: boolean; // 是否激活
  createdAt: string;
}

// 写作记录（用于统计）
export interface WritingRecord {
  id: string;
  date: string; // 日期 YYYY-MM-DD
  wordsWritten: number; // 当日写作字数
  chaptersCompleted: number; // 完成章节数
  writingTime?: number; // 写作时长（分钟）
}

// 卷接口
export interface Volume {
  id: string;
  title: string;
  order: number;
  createdAt: string;
}

// 人物接口
export interface Character {
  id: string;
  name: string;
  age?: string;
  gender?: string;
  role: string; // 主角、配角、反派等
  appearance?: string; // 外貌特征
  personality?: string; // 性格特点
  description: string;
  background?: string; // 背景故事
  traits: string[];
  createdAt: string;
}

// 世界观接口
export interface Worldview {
  id: string;
  title: string;
  category: string; // 力量体系、社会结构、地理等
  geography?: string; // 地理环境
  history?: string; // 历史背景
  culture?: string; // 文化特色
  magicSystem?: string; // 魔法体系
  content: string;
  createdAt: string;
}

// 事件线接口
export interface TimelineEvent {
  id: string;
  title: string;
  time: string; // 时间点描述
  description: string;
  eventType?: string; // 事件类型
  location?: string; // 关键地点
  keyEvent?: string; // 关键事件/转折点
  characters: string[]; // 关联人物ID
  createdAt: string;
}

// 语料库接口 (原资料库)
export interface Reference {
  id: string;
  title: string; // 素材标题
  category: string; // 内容类型
  content: string; // 素材内容
  createdAt: string;
}

// 场景/地点接口
export interface Location {
  id: string;
  name: string;
  type: string; // 城市、村庄、秘境、宗门等
  region?: string; // 所属区域
  description: string;
  features?: string; // 特色描述
  significance?: string; // 剧情重要性
  relatedCharacters?: string[]; // 关联人物ID
  createdAt: string;
}

// 道具/技能接口
export interface Item {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory' | 'skill' | 'technique' | 'artifact' | 'other'; // 类型
  category?: string; // 子类型/品级
  description: string;
  effects?: string; // 效果说明
  origin?: string; // 来源
  owner?: string; // 拥有者人物ID
  relatedCharacters?: string[]; // 关联人物ID
  createdAt: string;
}

// 章节模板接口
export interface ChapterTemplate {
  id: string;
  name: string;
  category: string; // 战斗、日常、回忆、升级等
  content: string;
  description?: string;
  isBuiltIn?: boolean; // 是否为内置模板
  createdAt: string;
}

// 思维导图节点接口
export interface MindMapNode {
  id: string;
  title: string;
  color: string;
  children: MindMapNode[];
}

// 思维导图接口
export interface MindMap {
  id: string;
  name: string;
  root: MindMapNode;
  createdAt: string;
  updatedAt: string;
}

export interface Novel {
  id: string;
  ownerId?: string;
  title: string;
  description: string;
  type?: string;
  targetWordCount?: number;
  cover?: string;
  wordCount: number;
  status: 'ongoing' | 'completed' | 'draft';
  updatedAt: string;
  tags: string[];
  outline?: string;
  chapters?: Chapter[];
  volumes?: Volume[];
  // 创作管理数据
  characters?: Character[];
  worldviews?: Worldview[];
  timelineEvents?: TimelineEvent[];
  references?: Reference[];
  // 思维导图数据
  mindMaps?: MindMap[];
  // 新增：大纲节点
  outlineNodes?: OutlineNode[];
  // 新增：伏笔追踪
  foreshadowings?: Foreshadowing[];
  // 新增：人物关系
  characterRelations?: CharacterRelation[];
  // 新增：写作目标
  writingGoals?: WritingGoal[];
  // 新增：写作记录
  writingRecords?: WritingRecord[];
  // 新增：场景/地点
  locations?: Location[];
  // 新增：道具/技能
  items?: Item[];
  // 新增：章节模板
  chapterTemplates?: ChapterTemplate[];
}

export interface ShortWork {
  id: string;
  ownerId?: string;
  mode: 'article' | 'story';
  title: string;
  content: string;
  wordCount: number;
  model: string;
  createdAt: string;
  updatedAt: string;
}
