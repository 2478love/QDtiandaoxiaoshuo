/**
 * @fileoverview 工具函数统一导出模块
 * @module utils
 * @description 导出所有工具函数，包括 ID 生成、哈希、验证、加密等
 */

// 统一导出所有工具函数
export * from './id';
export * from './hash';
export * from './validation';
export {
  // 密码相关
  hashPassword,
  verifyPassword,
  verifyPasswordHash,
  passwordNeedsUpgrade,
  // API Key 相关
  encryptApiKey,
  decryptApiKey,
  apiKeyNeedsReencryption,
  EncryptionError,
  // XSS 防护
  sanitizeHtml,
  sanitizeRichText,
  sanitizePlainText,
  escapeHtml,
  sanitizeInput,
  isSafeUrl,
  sanitizeUrl,
  // 兼容
  needsHashUpgrade,
} from './crypto';
export type { PasswordHashResult } from './crypto';

// 专有名词检查
export {
  checkProperNouns,
  replaceProperNouns,
} from './properNounChecker';
export type {
  ProperNounVariant,
  Location as ProperNounLocation,
  ProperNounCheckResult,
} from './properNounChecker';

// 敏感词检测
export {
  checkSensitiveWords,
  replaceSensitiveWords,
  getSensitiveWordsDatabase,
  addCustomSensitiveWord,
} from './sensitiveWordChecker';
export type {
  SensitivityLevel,
  SensitiveWord,
  SensitiveWordMatch,
  SensitiveWordCheckResult,
} from './sensitiveWordChecker';

// AI 去机械感优化
export {
  detectAIPatterns,
  removeAITemplates,
  generateOutlinePrompt,
  generateContentFromOutlinePrompt,
  generateReviewPrompt,
  WRITING_STYLE_PRESETS,
  ANTI_AI_PROMPT,
} from './aiOptimizer';
export type {
  TwoStageGenerationConfig,
  TwoStageGenerationResult,
} from './aiOptimizer';

