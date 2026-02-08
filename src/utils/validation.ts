/**
 * 类型守卫和数据校验工具
 *
 * 用于从 localStorage/IndexedDB 读取数据时进行类型安全校验
 */

import type {
  Novel,
  Chapter,
  Volume,
  Character,
  Worldview,
  TimelineEvent,
  Reference,
  MindMap,
  OutlineNode,
  Foreshadowing,
  CharacterRelation,
  WritingGoal,
  WritingRecord,
  Location,
  Item,
  ChapterTemplate,
  ShortWork,
} from '../types';

// ============ 基础类型守卫 ============

/**
 * 检查是否为非空对象
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

/**
 * 检查是否为非空字符串
 */
export const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.length > 0;
};

/**
 * 检查是否为数组
 */
export const isArray = <T>(value: unknown, itemGuard?: (item: unknown) => item is T): value is T[] => {
  if (!Array.isArray(value)) return false;
  if (itemGuard) {
    return value.every(itemGuard);
  }
  return true;
};

/**
 * 检查是否为有效日期字符串
 */
export const isDateString = (value: unknown): value is string => {
  if (typeof value !== 'string') return false;
  const date = new Date(value);
  return !isNaN(date.getTime());
};

/**
 * 检查是否为非负数
 */
export const isNonNegativeNumber = (value: unknown): value is number => {
  return typeof value === 'number' && value >= 0 && !isNaN(value);
};

// ============ 实体类型守卫 ============

/**
 * 检查是否为有效的 Chapter
 */
export const isChapter = (value: unknown): value is Chapter => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    typeof obj.content === 'string' &&
    isNonNegativeNumber(obj.wordCount)
  );
};

/**
 * 检查是否为有效的 Volume
 */
export const isVolume = (value: unknown): value is Volume => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    isNonNegativeNumber(obj.order) &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 Character
 */
export const isCharacter = (value: unknown): value is Character => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isNonEmptyString(obj.role) &&
    typeof obj.description === 'string' &&
    isArray(obj.traits) &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 Worldview
 */
export const isWorldview = (value: unknown): value is Worldview => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    isNonEmptyString(obj.category) &&
    typeof obj.content === 'string' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 TimelineEvent
 */
export const isTimelineEvent = (value: unknown): value is TimelineEvent => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    isNonEmptyString(obj.time) &&
    typeof obj.description === 'string' &&
    isArray(obj.characters) &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 Reference
 */
export const isReference = (value: unknown): value is Reference => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    isNonEmptyString(obj.category) &&
    typeof obj.content === 'string' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 MindMap
 */
export const isMindMap = (value: unknown): value is MindMap => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isObject(obj.root) &&
    isDateString(obj.createdAt) &&
    isDateString(obj.updatedAt)
  );
};

/**
 * 检查是否为有效的 OutlineNode
 */
export const isOutlineNode = (value: unknown): value is OutlineNode => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  const validTypes = ['volume', 'chapter', 'scene', 'note'];
  const validStatuses = ['planned', 'writing', 'completed'];

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    typeof obj.content === 'string' &&
    typeof obj.type === 'string' &&
    validTypes.includes(obj.type) &&
    isNonNegativeNumber(obj.order) &&
    typeof obj.status === 'string' &&
    validStatuses.includes(obj.status) &&
    isDateString(obj.createdAt) &&
    isDateString(obj.updatedAt)
  );
};

/**
 * 检查是否为有效的 Foreshadowing
 */
export const isForeshadowing = (value: unknown): value is Foreshadowing => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  const validStatuses = ['planted', 'resolved', 'abandoned'];
  const validImportance = ['high', 'medium', 'low'];

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.title) &&
    typeof obj.description === 'string' &&
    typeof obj.status === 'string' &&
    validStatuses.includes(obj.status) &&
    typeof obj.importance === 'string' &&
    validImportance.includes(obj.importance) &&
    isArray(obj.relatedCharacters) &&
    typeof obj.notes === 'string' &&
    isDateString(obj.createdAt) &&
    isDateString(obj.updatedAt)
  );
};

/**
 * 检查是否为有效的 CharacterRelation
 */
export const isCharacterRelation = (value: unknown): value is CharacterRelation => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.sourceId) &&
    isNonEmptyString(obj.targetId) &&
    isNonEmptyString(obj.relationType) &&
    typeof obj.description === 'string' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 WritingGoal
 */
export const isWritingGoal = (value: unknown): value is WritingGoal => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  const validTypes = ['daily', 'weekly', 'monthly', 'total'];

  return (
    isNonEmptyString(obj.id) &&
    typeof obj.type === 'string' &&
    validTypes.includes(obj.type) &&
    isNonNegativeNumber(obj.targetWords) &&
    isNonNegativeNumber(obj.currentWords) &&
    isDateString(obj.startDate) &&
    typeof obj.isActive === 'boolean' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 WritingRecord
 */
export const isWritingRecord = (value: unknown): value is WritingRecord => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.date) &&
    isNonNegativeNumber(obj.wordsWritten) &&
    isNonNegativeNumber(obj.chaptersCompleted)
  );
};

/**
 * 检查是否为有效的 Location
 */
export const isLocation = (value: unknown): value is Location => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isNonEmptyString(obj.type) &&
    typeof obj.description === 'string' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 Item
 */
export const isItem = (value: unknown): value is Item => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  const validTypes = ['weapon', 'armor', 'accessory', 'skill', 'technique', 'artifact', 'other'];

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    typeof obj.type === 'string' &&
    validTypes.includes(obj.type) &&
    typeof obj.description === 'string' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 ChapterTemplate
 */
export const isChapterTemplate = (value: unknown): value is ChapterTemplate => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  return (
    isNonEmptyString(obj.id) &&
    isNonEmptyString(obj.name) &&
    isNonEmptyString(obj.category) &&
    typeof obj.content === 'string' &&
    isDateString(obj.createdAt)
  );
};

/**
 * 检查是否为有效的 Novel
 */
export const isNovel = (value: unknown): value is Novel => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  const validStatuses = ['ongoing', 'completed', 'draft'];

  // 必填字段检查
  if (
    !isNonEmptyString(obj.id) ||
    !isNonEmptyString(obj.title) ||
    typeof obj.description !== 'string' ||
    !isNonNegativeNumber(obj.wordCount) ||
    typeof obj.status !== 'string' ||
    !validStatuses.includes(obj.status) ||
    !isDateString(obj.updatedAt) ||
    !isArray(obj.tags)
  ) {
    return false;
  }

  // 可选数组字段检查
  if (obj.chapters !== undefined && !isArray(obj.chapters, isChapter)) return false;
  if (obj.volumes !== undefined && !isArray(obj.volumes, isVolume)) return false;
  if (obj.characters !== undefined && !isArray(obj.characters, isCharacter)) return false;
  if (obj.worldviews !== undefined && !isArray(obj.worldviews, isWorldview)) return false;
  if (obj.timelineEvents !== undefined && !isArray(obj.timelineEvents, isTimelineEvent)) return false;
  if (obj.references !== undefined && !isArray(obj.references, isReference)) return false;
  if (obj.mindMaps !== undefined && !isArray(obj.mindMaps, isMindMap)) return false;
  if (obj.outlineNodes !== undefined && !isArray(obj.outlineNodes, isOutlineNode)) return false;
  if (obj.foreshadowings !== undefined && !isArray(obj.foreshadowings, isForeshadowing)) return false;
  if (obj.characterRelations !== undefined && !isArray(obj.characterRelations, isCharacterRelation)) return false;
  if (obj.writingGoals !== undefined && !isArray(obj.writingGoals, isWritingGoal)) return false;
  if (obj.writingRecords !== undefined && !isArray(obj.writingRecords, isWritingRecord)) return false;
  if (obj.locations !== undefined && !isArray(obj.locations, isLocation)) return false;
  if (obj.items !== undefined && !isArray(obj.items, isItem)) return false;
  if (obj.chapterTemplates !== undefined && !isArray(obj.chapterTemplates, isChapterTemplate)) return false;

  return true;
};

/**
 * 检查是否为有效的 ShortWork
 */
export const isShortWork = (value: unknown): value is ShortWork => {
  if (!isObject(value)) return false;
  const obj = value as Record<string, unknown>;

  const validModes = ['article', 'story'];

  return (
    isNonEmptyString(obj.id) &&
    typeof obj.mode === 'string' &&
    validModes.includes(obj.mode) &&
    isNonEmptyString(obj.title) &&
    typeof obj.content === 'string' &&
    isNonNegativeNumber(obj.wordCount) &&
    isNonEmptyString(obj.model) &&
    isDateString(obj.createdAt) &&
    isDateString(obj.updatedAt)
  );
};

// ============ 数据校验和修复 ============

/**
 * 校验结果
 */
export interface ValidationResult<T> {
  valid: boolean;
  data: T | null;
  errors: string[];
}

/**
 * 安全解析 JSON
 */
export const safeParseJson = <T>(
  json: string,
  guard: (value: unknown) => value is T
): ValidationResult<T> => {
  const errors: string[] = [];

  try {
    const parsed = JSON.parse(json);

    if (guard(parsed)) {
      return { valid: true, data: parsed, errors: [] };
    } else {
      errors.push('数据格式不符合预期类型');
      return { valid: false, data: null, errors };
    }
  } catch (e) {
    errors.push(`JSON 解析失败: ${e instanceof Error ? e.message : '未知错误'}`);
    return { valid: false, data: null, errors };
  }
};

/**
 * 从 localStorage 安全读取数据
 */
export const safeReadFromStorage = <T>(
  key: string,
  guard: (value: unknown) => value is T,
  defaultValue: T
): T => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;

    const result = safeParseJson(stored, guard);
    if (result.valid && result.data !== null) {
      return result.data;
    }

    console.warn(`[Storage] 数据校验失败 (${key}):`, result.errors);
    return defaultValue;
  } catch (e) {
    console.error(`[Storage] 读取失败 (${key}):`, e);
    return defaultValue;
  }
};

/**
 * 安全读取数组数据
 */
export const safeReadArray = <T>(
  key: string,
  itemGuard: (value: unknown) => value is T
): T[] => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn(`[Storage] 预期数组但得到 ${typeof parsed} (${key})`);
      return [];
    }

    // 过滤有效项，记录无效项
    const validItems: T[] = [];
    const invalidIndices: number[] = [];

    parsed.forEach((item, index) => {
      if (itemGuard(item)) {
        validItems.push(item);
      } else {
        invalidIndices.push(index);
      }
    });

    if (invalidIndices.length > 0) {
      console.warn(`[Storage] 跳过无效项 (${key}): 索引 ${invalidIndices.join(', ')}`);
    }

    return validItems;
  } catch (e) {
    console.error(`[Storage] 读取数组失败 (${key}):`, e);
    return [];
  }
};

/**
 * 数据迁移辅助：为旧数据添加缺失字段
 */
export const migrateData = <T extends object>(
  data: Partial<T>,
  defaults: T
): T => {
  const result = { ...defaults };

  for (const key of Object.keys(data) as (keyof T)[]) {
    if (data[key] !== undefined) {
      result[key] = data[key] as T[keyof T];
    }
  }

  return result;
};

// ============ Zod Schemas for Form Validation ============

import { z } from 'zod';

/**
 * API 设置验证 Schema
 */
export const ApiSettingsSchema = z.object({
  apiMode: z.enum(['custom', 'membership']).default('custom'),
  provider: z.string().min(1, 'API 服务商不能为空'),
  apiKey: z.string().optional(),
  baseUrl: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  selectedModel: z.string().optional(),
});

export type ApiSettingsInput = z.infer<typeof ApiSettingsSchema>;

/**
 * 小说创建验证 Schema
 */
export const NovelCreateSchema = z.object({
  title: z.string()
    .min(1, '标题不能为空')
    .max(100, '标题不能超过 100 个字符'),
  description: z.string().max(2000, '描述不能超过 2000 个字符').default(''),
  genre: z.string().optional(),
  tags: z.array(z.string()).default([]),
});

export type NovelCreateInput = z.infer<typeof NovelCreateSchema>;

/**
 * 小说更新验证 Schema
 */
export const NovelUpdateSchema = NovelCreateSchema.partial();

export type NovelUpdateInput = z.infer<typeof NovelUpdateSchema>;

/**
 * 章节创建验证 Schema
 */
export const ChapterCreateSchema = z.object({
  title: z.string()
    .min(1, '章节标题不能为空')
    .max(100, '章节标题不能超过 100 个字符'),
  content: z.string().default(''),
  volumeId: z.string().optional(),
});

export type ChapterCreateInput = z.infer<typeof ChapterCreateSchema>;

/**
 * 章节更新验证 Schema
 */
export const ChapterUpdateSchema = z.object({
  title: z.string()
    .min(1, '章节标题不能为空')
    .max(100, '章节标题不能超过 100 个字符')
    .optional(),
  content: z.string().optional(),
});

export type ChapterUpdateInput = z.infer<typeof ChapterUpdateSchema>;

/**
 * 角色创建验证 Schema
 */
export const CharacterCreateSchema = z.object({
  name: z.string()
    .min(1, '角色名称不能为空')
    .max(50, '角色名称不能超过 50 个字符'),
  role: z.string().min(1, '角色定位不能为空'),
  description: z.string().max(5000, '描述不能超过 5000 个字符').default(''),
  traits: z.array(z.string()).default([]),
  avatar: z.string().url('请输入有效的头像 URL').optional().or(z.literal('')),
});

export type CharacterCreateInput = z.infer<typeof CharacterCreateSchema>;

/**
 * 短篇创作验证 Schema
 */
export const ShortWorkCreateSchema = z.object({
  mode: z.enum(['article', 'story']),
  title: z.string()
    .min(1, '标题不能为空')
    .max(100, '标题不能超过 100 个字符'),
  targetWordCount: z.number()
    .min(100, '目标字数至少 100 字')
    .max(50000, '目标字数不能超过 50000 字')
    .default(1000),
  reference: z.string().max(10000, '参考设定不能超过 10000 个字符').optional(),
});

export type ShortWorkCreateInput = z.infer<typeof ShortWorkCreateSchema>;

/**
 * AI 生成配置验证 Schema
 */
export const AIGenerateOptionsSchema = z.object({
  model: z.string().min(1, '请选择模型'),
  temperature: z.number().min(0).max(2).default(0.8),
  maxTokens: z.union([
    z.number().min(1).max(1000000),
    z.literal('unlimited'),
  ]).optional(),
  systemInstruction: z.string().max(10000).optional(),
});

export type AIGenerateOptionsInput = z.infer<typeof AIGenerateOptionsSchema>;

/**
 * 验证辅助函数
 */
export const validateInput = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: string[] } => {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors = result.error.issues.map(err => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });

  return { success: false, errors };
};

/**
 * 表单字段错误提取
 */
export const getFieldErrors = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): Record<string, string> => {
  const result = schema.safeParse(data);

  if (result.success) {
    return {};
  }

  const errors: Record<string, string> = {};
  result.error.issues.forEach(err => {
    const path = err.path.join('.');
    if (path && !errors[path]) {
      errors[path] = err.message;
    }
  });

  return errors;
};
