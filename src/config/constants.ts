/**
 * 应用常量配置
 *
 * 集中管理所有硬编码的字符串常量，便于维护和修改
 */

// ============ AI 模型常量 ============

/**
 * 默认 AI 模型
 */
export const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * 模型 ID 常量
 */
export const MODEL_IDS = {
  // Google Gemini
  GEMINI_2_FLASH: 'gemini-2.0-flash',
  GEMINI_2_5_FLASH_PREVIEW: 'gemini-2.5-flash-preview-05-20',
  GEMINI_2_5_PRO_PREVIEW: 'gemini-2.5-pro-preview-05-06',
  GEMINI_1_5_PRO: 'gemini-1.5-pro',
  GEMINI_1_5_FLASH: 'gemini-1.5-flash',

  // DeepSeek
  DEEPSEEK_V3: 'deepseek-ai/DeepSeek-V3',
  DEEPSEEK_V3_0324: 'deepseek-ai/DeepSeek-V3-0324',
  DEEPSEEK_CHAT: 'deepseek-chat',
  DEEPSEEK_CODER: 'deepseek-coder',

  // Qwen
  QWEN_72B: 'Qwen/Qwen2.5-72B-Instruct',
  QWEN_7B: 'Pro/Qwen/Qwen2.5-7B-Instruct',

  // OpenAI
  GPT_4O: 'gpt-4o',
  GPT_4O_MINI: 'gpt-4o-mini',
  GPT_4_TURBO: 'gpt-4-turbo',

  // 天道平台
  TIANDAO_CREATIVE_V1: 'tiandao-creative-v1',
  TIANDAO_CREATIVE_PRO: 'tiandao-creative-pro',
  TIANDAO_PLOT_MASTER: 'tiandao-plot-master',
} as const;

/**
 * AI 生成参数默认值
 */
export const AI_DEFAULTS = {
  temperature: 0.8,
  maxTokens: 2048,
  creativeTemperature: 0.9, // 创意内容用更高温度
  analysisTemperature: 0.7, // 分析内容用较低温度
} as const;

// ============ 存储 Key 常量 ============

/**
 * LocalStorage / IndexedDB 键名
 */
export const STORAGE_KEYS = {
  // 用户相关
  USERS: 'tiandao_users',
  CURRENT_USER: 'tiandao_current_user',
  USER_SESSION: 'tiandao_session',
  SESSION: 'tiandao_session', // 别名

  // API 设置
  API_SETTINGS: 'tiandao_api_settings',

  // 小说数据
  NOVELS: 'tiandao_novels',
  NOVELS_PREFIX: 'tiandao_novel_', // 单个小说前缀
  SHORT_WORKS: 'tiandao_short_works',

  // 模块化存储（新）
  NOVEL_META: 'tiandao_novel_meta_',
  NOVEL_CHAPTERS: 'tiandao_novel_chapters_',
  NOVEL_CHARACTERS: 'tiandao_novel_characters_',
  NOVEL_WORLDVIEWS: 'tiandao_novel_worldviews_',
  NOVEL_TIMELINE: 'tiandao_novel_timeline_',
  NOVEL_FORESHADOWING: 'tiandao_novel_foreshadowing_',
  NOVEL_RELATIONS: 'tiandao_novel_relations_',
  NOVEL_GOALS: 'tiandao_novel_goals_',
  NOVEL_RECORDS: 'tiandao_novel_records_',

  // 提示词
  PROMPTS: 'tiandao_prompts',
  CUSTOM_PROMPTS: 'tiandao_custom_prompts',

  // 设置
  SETTINGS: 'tiandao_settings',
  THEME: 'tiandao_theme',
  EDITOR_SETTINGS: 'tiandao_editor_settings',

  // 邀请码
  INVITE_CODES: 'tiandao_invite_codes',
} as const;

// ============ 小说类型和状态 ============

/**
 * 小说状态
 */
export const NOVEL_STATUS = {
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  DRAFT: 'draft',
} as const;

/**
 * 小说类型/分类
 */
export const NOVEL_GENRES = [
  '玄幻',
  '仙侠',
  '都市',
  '历史',
  '科幻',
  '游戏',
  '悬疑',
  '言情',
  '军事',
  '其他',
] as const;

/**
 * 角色类型
 */
export const CHARACTER_ROLES = [
  '主角',
  '女主',
  '配角',
  '反派',
  '龙套',
  '工具人',
  '其他',
] as const;

/**
 * 大纲节点类型
 */
export const OUTLINE_NODE_TYPES = {
  VOLUME: 'volume',
  CHAPTER: 'chapter',
  SCENE: 'scene',
  NOTE: 'note',
} as const;

/**
 * 大纲节点状态
 */
export const OUTLINE_STATUS = {
  PLANNED: 'planned',
  WRITING: 'writing',
  COMPLETED: 'completed',
} as const;

/**
 * 伏笔状态
 */
export const FORESHADOWING_STATUS = {
  PLANTED: 'planted',
  RESOLVED: 'resolved',
  ABANDONED: 'abandoned',
} as const;

/**
 * 伏笔重要程度
 */
export const FORESHADOWING_IMPORTANCE = {
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

/**
 * 道具/技能类型
 */
export const ITEM_TYPES = {
  WEAPON: 'weapon',
  ARMOR: 'armor',
  ACCESSORY: 'accessory',
  SKILL: 'skill',
  TECHNIQUE: 'technique',
  ARTIFACT: 'artifact',
  OTHER: 'other',
} as const;

/**
 * 写作目标类型
 */
export const GOAL_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  TOTAL: 'total',
} as const;

// ============ 人物关系类型 ============

/**
 * 预定义的人物关系类型
 */
export const RELATION_TYPES = [
  '朋友',
  '敌人',
  '恋人',
  '师徒',
  '家人',
  '同门',
  '主仆',
  '盟友',
  '对手',
  '仇人',
  '暗恋',
  '前任',
  '上下级',
  '同事',
  '邻居',
  '其他',
] as const;

/**
 * 关系类型对应的颜色
 */
export const RELATION_COLORS: Record<string, string> = {
  朋友: '#22c55e',
  敌人: '#ef4444',
  恋人: '#ec4899',
  师徒: '#8b5cf6',
  家人: '#f59e0b',
  同门: '#06b6d4',
  主仆: '#6366f1',
  盟友: '#10b981',
  对手: '#f97316',
  仇人: '#dc2626',
  暗恋: '#f472b6',
  前任: '#9ca3af',
  上下级: '#3b82f6',
  同事: '#14b8a6',
  邻居: '#84cc16',
  其他: '#6b7280',
};

// ============ 世界观分类 ============

/**
 * 世界观分类
 */
export const WORLDVIEW_CATEGORIES = [
  '力量体系',
  '社会结构',
  '地理环境',
  '历史背景',
  '文化风俗',
  '种族势力',
  '物品装备',
  '其他设定',
] as const;

// ============ 章节模板分类 ============

/**
 * 章节模板分类
 */
export const TEMPLATE_CATEGORIES = [
  '战斗',
  '日常',
  '回忆',
  '升级',
  '修炼',
  '探险',
  '对话',
  '情感',
  '转折',
  '结尾',
  '其他',
] as const;

// ============ UI 相关常量 ============

/**
 * 主题类型
 */
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  GRAY: 'gray',
  SYSTEM: 'system',
} as const;

/**
 * 编辑器默认字体
 */
export const EDITOR_FONTS = [
  { id: 'system', name: '系统默认', value: 'system-ui, -apple-system, sans-serif' },
  { id: 'noto-serif', name: '思源宋体', value: '"Noto Serif SC", "Source Han Serif SC", serif' },
  { id: 'noto-sans', name: '思源黑体', value: '"Noto Sans SC", "Source Han Sans SC", sans-serif' },
  { id: 'fangsong', name: '仿宋', value: 'FangSong, STFangsong, serif' },
  { id: 'kaiti', name: '楷体', value: 'KaiTi, STKaiti, serif' },
] as const;

/**
 * 默认编辑器设置
 */
export const EDITOR_DEFAULTS = {
  fontSize: 16,
  lineHeight: 1.8,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  autoSaveInterval: 30000, // 30秒
  wordCountGoal: 2000, // 每日目标字数
} as const;

// ============ 限制常量 ============

/**
 * 各种限制
 */
export const LIMITS = {
  // 内容限制
  MAX_CHAPTER_LENGTH: 50000, // 单章最大字数
  MAX_TITLE_LENGTH: 100,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_TAGS: 10,

  // 存储限制
  MAX_VERSIONS_PER_CHAPTER: 50,
  MAX_CHARACTERS: 500,
  MAX_WORLDVIEWS: 100,
  MAX_FORESHADOWINGS: 500,

  // UI 限制
  DEBOUNCE_MS: 500,
  AUTOSAVE_INTERVAL_MS: 30000,
  IDLE_TIMEOUT_MS: 300000, // 5分钟无操作
} as const;

// ============ 正则表达式 ============

/**
 * 常用正则表达式
 */
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^1[3-9]\d{9}$/,
  PASSWORD: /^(?=.*[a-zA-Z])(?=.*\d).{6,}$/, // 至少6位，包含字母和数字
  DATE: /^\d{4}-\d{2}-\d{2}$/,
  TIME: /^\d{2}:\d{2}$/,
  URL: /^https?:\/\/[^\s]+$/,
} as const;
