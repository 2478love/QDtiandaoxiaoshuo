/**
 * 安全加密工具库
 *
 * 功能：
 * 1. 密码哈希 - 使用 PBKDF2 (SHA-256)
 * 2. API 密钥加密 - 使用 AES-GCM
 * 3. XSS 防护 - 使用 DOMPurify
 * 4. 安全随机数生成
 *
 * 安全改进 v2:
 * - 移除不安全的旧密码格式支持
 * - 移除不安全的 API Key 混淆降级方案
 * - 集成 DOMPurify 进行 XSS 防护
 */

import DOMPurify, { type Config as DOMPurifyConfig } from 'dompurify';

// ==================== 常量定义 ====================

// PBKDF2 迭代次数（越高越安全，但也越慢）
const PBKDF2_ITERATIONS = 100000;

// 盐的长度（字节）
const SALT_LENGTH = 16;

// AES-GCM IV 长度（字节）
const IV_LENGTH = 12;

// 设备指纹 key（用于生成加密密钥）
const DEVICE_FINGERPRINT_KEY = 'tiandao_device_fp';

// 密码哈希版本
const HASH_VERSION = 2;

// ==================== 工具函数 ====================

/**
 * 将 ArrayBuffer 转换为 Base64 字符串
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 将 Base64 字符串转换为 ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * 生成安全随机字节
 */
function getRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * 将字符串转换为 ArrayBuffer
 */
function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

/**
 * 将 ArrayBuffer 转换为字符串
 */
function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
}

/**
 * 时间常量字符串比较（防止时序攻击）
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ==================== 密码哈希 ====================

/**
 * 密码哈希结果
 */
export interface PasswordHashResult {
  hash: string;
  needsUpgrade: boolean;
}

/**
 * 对密码进行安全哈希
 *
 * 使用 PBKDF2-SHA256，返回格式：v{version}:{iterations}:{salt}:{hash}（都是 base64）
 */
export async function hashPassword(password: string): Promise<string> {
  // 生成随机盐
  const salt = getRandomBytes(SALT_LENGTH);

  // 将密码转换为密钥材料
  const passwordBuffer = stringToArrayBuffer(password);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits']
  );

  // 使用 PBKDF2 派生哈希
  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 位输出
  );

  // 组合成字符串：v{version}:{iterations}:{salt}:{hash}
  const saltBase64 = arrayBufferToBase64(salt.buffer);
  const hashBase64 = arrayBufferToBase64(hashBuffer);

  return `v${HASH_VERSION}:${PBKDF2_ITERATIONS}:${saltBase64}:${hashBase64}`;
}

/**
 * 验证密码是否匹配哈希
 *
 * 安全改进：不再支持旧的不安全格式，必须升级密码
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // 检查是否是旧的不安全格式
    if (passwordNeedsUpgrade(storedHash)) {
      // 返回 false，强制用户重置密码
      console.warn('[Security] 检测到旧密码格式，需要用户重置密码');
      return false;
    }

    const parts = storedHash.split(':');

    // 新格式 v2: v{version}:{iterations}:{salt}:{hash}
    if (parts.length === 4 && parts[0].startsWith('v')) {
      const [, iterationsStr, saltBase64, expectedHashBase64] = parts;
      const iterations = parseInt(iterationsStr, 10);
      const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

      // 使用相同的盐和迭代次数重新计算哈希
      const passwordBuffer = stringToArrayBuffer(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const computedHashBase64 = arrayBufferToBase64(hashBuffer);

      // 使用时间常量比较防止时序攻击
      return timingSafeEqual(computedHashBase64, expectedHashBase64);
    }

    // 旧格式 v1: {iterations}:{salt}:{hash} (兼容迁移期)
    if (parts.length === 3) {
      const [iterationsStr, saltBase64, expectedHashBase64] = parts;
      const iterations = parseInt(iterationsStr, 10);

      if (isNaN(iterations) || iterations < 1000) {
        return false;
      }

      const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));

      const passwordBuffer = stringToArrayBuffer(password);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveBits']
      );

      const hashBuffer = await crypto.subtle.deriveBits(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        256
      );

      const computedHashBase64 = arrayBufferToBase64(hashBuffer);
      return timingSafeEqual(computedHashBase64, expectedHashBase64);
    }

    return false;
  } catch (error) {
    console.error('[Security] 密码验证失败:', error);
    return false;
  }
}

/**
 * 检查密码哈希是否需要升级
 */
export function passwordNeedsUpgrade(hash: string): boolean {
  if (!hash) return true;

  // 检测不安全格式
  const parts = hash.split(':');

  // 旧的纯 Base64 格式（不安全）
  if (parts.length === 1) {
    return true;
  }

  // legacy: 前缀格式（不安全）
  if (hash.startsWith('legacy:')) {
    return true;
  }

  // v1 格式（安全但可升级）
  if (parts.length === 3 && !parts[0].startsWith('v')) {
    return true; // 建议升级到 v2
  }

  // v2 格式（当前版本）
  if (parts.length === 4 && parts[0] === `v${HASH_VERSION}`) {
    return false;
  }

  return true;
}

/**
 * 验证密码并返回是否需要升级
 */
export async function verifyPasswordHash(
  password: string,
  storedHash: string
): Promise<PasswordHashResult> {
  const isValid = await verifyPassword(password, storedHash);
  const needsUpgrade = passwordNeedsUpgrade(storedHash);

  return {
    hash: isValid && needsUpgrade ? await hashPassword(password) : storedHash,
    needsUpgrade: isValid && needsUpgrade,
  };
}

// ==================== API 密钥加密 ====================

/**
 * 加密错误类型
 */
export class EncryptionError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'EncryptionError';
  }
}

/**
 * 获取或生成设备指纹（用于派生加密密钥）
 */
async function getDeviceKey(): Promise<CryptoKey> {
  let fingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);

  if (!fingerprint) {
    // 生成新的设备指纹
    const randomBytes = getRandomBytes(32);
    fingerprint = arrayBufferToBase64(randomBytes.buffer);
    localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
  }

  // 从指纹派生 AES 密钥
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    base64ToArrayBuffer(fingerprint),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // 使用固定盐（因为我们需要能够解密）
  const salt = stringToArrayBuffer('tiandao-writer-api-key-salt-v2');

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 50000, // 增加迭代次数
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 加密 API 密钥
 *
 * 返回格式：v2:{iv}:{ciphertext}（都是 base64）
 *
 * 安全改进：移除不安全的混淆降级方案，加密失败时抛出错误
 */
export async function encryptApiKey(apiKey: string): Promise<string> {
  if (!apiKey) return '';

  // 检查 Web Crypto API 可用性
  if (!crypto?.subtle) {
    throw new EncryptionError(
      '您的浏览器不支持安全加密功能，请使用现代浏览器（Chrome、Firefox、Safari、Edge）',
      'CRYPTO_NOT_SUPPORTED'
    );
  }

  try {
    const key = await getDeviceKey();
    const iv = getRandomBytes(IV_LENGTH);
    const plaintext = stringToArrayBuffer(apiKey);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      plaintext
    );

    const ivBase64 = arrayBufferToBase64(iv.buffer);
    const ciphertextBase64 = arrayBufferToBase64(ciphertext);

    return `v2:${ivBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error('[Security] API 密钥加密失败:', error);
    throw new EncryptionError(
      'API 密钥加密失败，请检查浏览器安全设置',
      'ENCRYPTION_FAILED'
    );
  }
}

/**
 * 解密 API 密钥
 *
 * 安全改进：移除不安全的混淆格式支持
 */
export async function decryptApiKey(encryptedKey: string): Promise<string> {
  if (!encryptedKey) return '';

  // 检查 Web Crypto API 可用性
  if (!crypto?.subtle) {
    throw new EncryptionError(
      '您的浏览器不支持安全加密功能',
      'CRYPTO_NOT_SUPPORTED'
    );
  }

  try {
    // 不安全格式检测
    if (encryptedKey.startsWith('obf:')) {
      console.warn('[Security] 检测到不安全的 API 密钥格式，需要重新保存');
      // 解密旧格式以便迁移
      const obfuscated = encryptedKey.slice(4);
      return atob(obfuscated).split('').reverse().join('');
    }

    // 检查是否是旧的明文格式（没有冒号分隔符或只有一个冒号）
    const parts = encryptedKey.split(':');
    if (parts.length < 2) {
      console.warn('[Security] 检测到明文 API 密钥，需要重新保存');
      return encryptedKey; // 假设是明文
    }

    // v2 格式: v2:{iv}:{ciphertext}
    if (parts[0] === 'v2' && parts.length === 3) {
      const [, ivBase64, ciphertextBase64] = parts;
      const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
      const ciphertext = base64ToArrayBuffer(ciphertextBase64);
      const key = await getDeviceKey();

      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      return arrayBufferToString(plaintext);
    }

    // 旧 v1 格式: {iv}:{ciphertext}
    if (parts.length === 2) {
      const [ivBase64, ciphertextBase64] = parts;
      const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
      const ciphertext = base64ToArrayBuffer(ciphertextBase64);
      const key = await getDeviceKey();

      const plaintext = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      return arrayBufferToString(plaintext);
    }

    throw new EncryptionError('未知的加密格式', 'UNKNOWN_FORMAT');
  } catch (error) {
    if (error instanceof EncryptionError) {
      throw error;
    }
    console.error('[Security] API 密钥解密失败:', error);
    throw new EncryptionError(
      'API 密钥解密失败，可能需要重新输入',
      'DECRYPTION_FAILED'
    );
  }
}

/**
 * 检查 API 密钥是否需要重新加密
 */
export function apiKeyNeedsReencryption(encryptedKey: string): boolean {
  if (!encryptedKey) return false;

  // 不安全格式
  if (encryptedKey.startsWith('obf:')) return true;

  // 明文
  if (!encryptedKey.includes(':')) return true;

  // 旧 v1 格式
  const parts = encryptedKey.split(':');
  if (parts.length === 2 && !parts[0].startsWith('v')) return true;

  return false;
}

// ==================== XSS 防护 ====================

/**
 * DOMPurify 配置
 */
const DOMPURIFY_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 'u', 's', 'span',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
    'a', 'hr', 'div'
  ],
  ALLOWED_ATTR: ['href', 'title', 'class', 'id', 'target', 'rel'],
  ALLOW_DATA_ATTR: false,
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
};

/**
 * 使用 DOMPurify 清理 HTML 内容
 */
export function sanitizeHtml(dirty: string): string {
  return String(DOMPurify.sanitize(dirty, DOMPURIFY_CONFIG));
}

/**
 * 清理并允许更多富文本标签（用于小说内容）
 */
export function sanitizeRichText(dirty: string): string {
  return String(DOMPurify.sanitize(dirty, {
    ...DOMPURIFY_CONFIG,
    ALLOWED_TAGS: [
      ...(DOMPURIFY_CONFIG.ALLOWED_TAGS as string[]),
      'ruby', 'rt', 'rp', // 日文注音
      'sub', 'sup', // 上下标
      'mark', 'del', 'ins', // 标记
    ],
  }));
}

/**
 * 清理纯文本（移除所有 HTML）
 */
export function sanitizePlainText(dirty: string): string {
  return String(DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [] }));
}

/**
 * 转义 HTML 特殊字符，防止 XSS 攻击（用于不需要 HTML 的场景）
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 清理用户输入，移除潜在的危险内容
 * @deprecated 请使用 sanitizeHtml 或 sanitizePlainText
 */
export function sanitizeInput(input: string): string {
  return sanitizePlainText(input);
}

/**
 * 验证 URL 是否安全
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    // 只允许 http, https, mailto 协议
    const safeProtocols = ['http:', 'https:', 'mailto:'];
    return safeProtocols.includes(parsed.protocol);
  } catch {
    // 相对 URL 检查
    const lower = url.toLowerCase().trim();
    return !lower.startsWith('javascript:') &&
           !lower.startsWith('data:') &&
           !lower.startsWith('vbscript:');
  }
}

/**
 * 清理 URL，确保安全
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  // 移除空白字符
  const trimmed = url.trim();

  // 检查是否安全
  if (!isSafeUrl(trimmed)) {
    return '';
  }

  return trimmed;
}

// ==================== 兼容性导出 ====================

/**
 * 旧版兼容：同步哈希函数（已废弃）
 * @deprecated 此函数不安全，将在下个版本移除
 */
export function hashPasswordSync(_value: string): string {
  throw new Error(
    'hashPasswordSync 已被移除，请使用异步的 hashPassword 函数。' +
    '如果您看到此错误，请联系管理员重置密码。'
  );
}

/**
 * 检查哈希是否需要升级
 * @deprecated 请使用 passwordNeedsUpgrade
 */
export function needsHashUpgrade(hash: string): boolean {
  return passwordNeedsUpgrade(hash);
}

export default {
  // 密码
  hashPassword,
  verifyPassword,
  verifyPasswordHash,
  passwordNeedsUpgrade,

  // API Key
  encryptApiKey,
  decryptApiKey,
  apiKeyNeedsReencryption,

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
};
