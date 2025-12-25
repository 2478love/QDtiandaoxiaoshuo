/**
 * @fileoverview 统一 ID 生成工具模块
 * @module utils/id
 * @description 提供带前缀的唯一 ID 生成功能，确保全局一致性和可追溯性
 * @version 1.0.0
 */

/**
 * ID 前缀类型枚举
 * @description 定义所有支持的 ID 前缀，用于标识不同类型的实体
 */
export type IdPrefix =
  | 'novel'      // 小说
  | 'chapter'    // 章节
  | 'volume'     // 卷
  | 'character'  // 人物
  | 'worldview'  // 世界观
  | 'timeline'   // 时间线
  | 'reference'  // 参考资料
  | 'mindmap'    // 思维导图
  | 'outline'    // 大纲
  | 'foreshadow' // 伏笔
  | 'relation'   // 关系
  | 'goal'       // 目标
  | 'record'     // 记录
  | 'location'   // 地点
  | 'item'       // 道具
  | 'template'   // 模板
  | 'version'    // 版本
  | 'work'       // 作品
  | 'prompt'     // 提示词
  | 'invite'     // 邀请
  | 'toast'      // 消息提示
  | 'msg'        // 消息
  | 'user'       // 用户
  | 'device'     // 设备
  | 'session'    // 会话
  | 'node';      // 节点（思维导图等）

/**
 * 生成基础唯一 ID
 * @private
 * @returns {string} UUID 格式或时间戳+随机字符串格式的唯一 ID
 * @example
 * // 可能返回:
 * // "550e8400-e29b-41d4-a716-446655440000" (UUID)
 * // "lxyz1234-a1b2c3d4" (降级格式)
 */
const generateBaseId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 时间戳 + 随机字符串
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `${timestamp}-${random}`;
};

/**
 * 生成唯一 ID（无前缀）
 * @returns {string} 唯一标识符
 * @example
 * const id = createId();
 * console.log(id); // "550e8400-e29b-41d4-a716-446655440000"
 */
export const createId = (): string => {
  return generateBaseId();
};

/**
 * 生成带前缀的唯一 ID
 * @param {IdPrefix} prefix - ID 前缀类型
 * @returns {string} 格式为 "{prefix}_{shortId}" 的唯一 ID
 * @example
 * const novelId = createPrefixedId('novel');
 * console.log(novelId); // "novel_550e8400e29b41d4"
 *
 * const chapterId = createPrefixedId('chapter');
 * console.log(chapterId); // "chapter_a716446655440000"
 */
export const createPrefixedId = (prefix: IdPrefix): string => {
  const base = generateBaseId();
  // 使用短格式避免 ID 过长
  const shortBase = base.replace(/-/g, '').slice(0, 16);
  return `${prefix}_${shortBase}`;
};

/**
 * 批量生成 ID
 * @param {number} count - 生成数量
 * @param {IdPrefix} [prefix] - 可选的前缀类型
 * @returns {string[]} ID 数组
 * @example
 * // 生成 5 个无前缀 ID
 * const ids = createIds(5);
 *
 * // 生成 3 个带前缀的 ID
 * const chapterIds = createIds(3, 'chapter');
 */
export const createIds = (count: number, prefix?: IdPrefix): string[] => {
  return Array.from({ length: count }, () =>
    prefix ? createPrefixedId(prefix) : createId()
  );
};

/**
 * 检查是否为有效的 ID 格式
 * @param {unknown} id - 待检查的值
 * @returns {boolean} 是否为有效的 ID 格式
 * @example
 * isValidId('novel_550e8400e29b41d4'); // true
 * isValidId('550e8400-e29b-41d4-a716-446655440000'); // true
 * isValidId(''); // false
 * isValidId(123); // false
 */
export const isValidId = (id: unknown): id is string => {
  if (typeof id !== 'string' || id.length === 0) {
    return false;
  }
  // UUID 格式或自定义格式
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const customPattern = /^[a-z]+_[a-z0-9]+$/i;
  const legacyPattern = /^(id-)?[0-9]+-[a-z0-9]+$/i;

  return uuidPattern.test(id) || customPattern.test(id) || legacyPattern.test(id);
};

/**
 * 从 ID 提取前缀
 * @param {string} id - 要解析的 ID
 * @returns {IdPrefix | null} 提取的前缀，如果无法提取则返回 null
 * @example
 * getIdPrefix('novel_550e8400e29b41d4'); // 'novel'
 * getIdPrefix('550e8400-e29b-41d4-a716-446655440000'); // null
 */
export const getIdPrefix = (id: string): IdPrefix | null => {
  const match = id.match(/^([a-z]+)_/i);
  if (match && match[1]) {
    return match[1].toLowerCase() as IdPrefix;
  }
  return null;
};

/**
 * 生成邀请码
 * @description 生成用于邀请的短码，格式为 "TD" + 6位大写字母数字
 * @returns {string} 邀请码，例如 "TDABC123"
 * @example
 * const code = createInviteCode();
 * console.log(code); // "TDXYZ789"
 */
export const createInviteCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'TD';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ==================== 便捷函数 - 各类型专用 ID 生成器 ====================

/**
 * 创建小说 ID
 * @returns {string} 格式为 "novel_xxx" 的唯一 ID
 */
export const createNovelId = () => createPrefixedId('novel');

/**
 * 创建章节 ID
 * @returns {string} 格式为 "chapter_xxx" 的唯一 ID
 */
export const createChapterId = () => createPrefixedId('chapter');

/**
 * 创建卷 ID
 * @returns {string} 格式为 "volume_xxx" 的唯一 ID
 */
export const createVolumeId = () => createPrefixedId('volume');

/**
 * 创建人物 ID
 * @returns {string} 格式为 "character_xxx" 的唯一 ID
 */
export const createCharacterId = () => createPrefixedId('character');

/**
 * 创建世界观 ID
 * @returns {string} 格式为 "worldview_xxx" 的唯一 ID
 */
export const createWorldviewId = () => createPrefixedId('worldview');

/**
 * 创建时间线 ID
 * @returns {string} 格式为 "timeline_xxx" 的唯一 ID
 */
export const createTimelineId = () => createPrefixedId('timeline');

/**
 * 创建参考资料 ID
 * @returns {string} 格式为 "reference_xxx" 的唯一 ID
 */
export const createReferenceId = () => createPrefixedId('reference');

/**
 * 创建思维导图 ID
 * @returns {string} 格式为 "mindmap_xxx" 的唯一 ID
 */
export const createMindMapId = () => createPrefixedId('mindmap');

/**
 * 创建大纲 ID
 * @returns {string} 格式为 "outline_xxx" 的唯一 ID
 */
export const createOutlineId = () => createPrefixedId('outline');

/**
 * 创建伏笔 ID
 * @returns {string} 格式为 "foreshadow_xxx" 的唯一 ID
 */
export const createForeshadowId = () => createPrefixedId('foreshadow');

/**
 * 创建关系 ID
 * @returns {string} 格式为 "relation_xxx" 的唯一 ID
 */
export const createRelationId = () => createPrefixedId('relation');

/**
 * 创建目标 ID
 * @returns {string} 格式为 "goal_xxx" 的唯一 ID
 */
export const createGoalId = () => createPrefixedId('goal');

/**
 * 创建记录 ID
 * @returns {string} 格式为 "record_xxx" 的唯一 ID
 */
export const createRecordId = () => createPrefixedId('record');

/**
 * 创建地点 ID
 * @returns {string} 格式为 "location_xxx" 的唯一 ID
 */
export const createLocationId = () => createPrefixedId('location');

/**
 * 创建道具 ID
 * @returns {string} 格式为 "item_xxx" 的唯一 ID
 */
export const createItemId = () => createPrefixedId('item');

/**
 * 创建模板 ID
 * @returns {string} 格式为 "template_xxx" 的唯一 ID
 */
export const createTemplateId = () => createPrefixedId('template');

/**
 * 创建版本 ID
 * @returns {string} 格式为 "version_xxx" 的唯一 ID
 */
export const createVersionId = () => createPrefixedId('version');

/**
 * 创建作品 ID
 * @returns {string} 格式为 "work_xxx" 的唯一 ID
 */
export const createWorkId = () => createPrefixedId('work');

/**
 * 创建提示词 ID
 * @returns {string} 格式为 "prompt_xxx" 的唯一 ID
 */
export const createPromptId = () => createPrefixedId('prompt');

/**
 * 创建邀请 ID
 * @returns {string} 格式为 "invite_xxx" 的唯一 ID
 */
export const createInviteId = () => createPrefixedId('invite');

/**
 * 创建消息提示 ID
 * @returns {string} 格式为 "toast_xxx" 的唯一 ID
 */
export const createToastId = () => createPrefixedId('toast');

/**
 * 创建消息 ID
 * @returns {string} 格式为 "msg_xxx" 的唯一 ID
 */
export const createMessageId = () => createPrefixedId('msg');

/**
 * 创建用户 ID
 * @returns {string} 格式为 "user_xxx" 的唯一 ID
 */
export const createUserId = () => createPrefixedId('user');

/**
 * 创建设备 ID
 * @returns {string} 格式为 "device_xxx" 的唯一 ID
 */
export const createDeviceId = () => createPrefixedId('device');

/**
 * 创建会话 ID
 * @returns {string} 格式为 "session_xxx" 的唯一 ID
 */
export const createSessionId = () => createPrefixedId('session');

/**
 * 创建节点 ID
 * @returns {string} 格式为 "node_xxx" 的唯一 ID
 */
export const createNodeId = () => createPrefixedId('node');
