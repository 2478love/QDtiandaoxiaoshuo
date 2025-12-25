/**
 * 密码哈希工具
 *
 * 已升级为使用 PBKDF2-SHA256 安全哈希
 * 保留旧接口以兼容现有代码
 */

import { hashPassword as secureHash, verifyPassword, needsHashUpgrade } from './crypto';

/**
 * 对密码进行安全哈希（异步）
 *
 * 使用 PBKDF2-SHA256，100000 次迭代
 */
export const hashPassword = secureHash;

/**
 * 验证密码是否匹配
 */
export const verifyPasswordHash = verifyPassword;

/**
 * 检查密码哈希是否需要升级
 */
export const passwordNeedsUpgrade = needsHashUpgrade;

/**
 * 同步版本（已废弃）
 * @deprecated 请使用异步的 hashPassword
 */
export const hashPasswordSync = (value: string): string => {
  console.warn('hashPasswordSync 已废弃，密码将使用不安全的方式存储');
  // 返回旧格式以便后续升级
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(value);
  }
  return value.split('').reverse().join('');
};

export default hashPassword;
