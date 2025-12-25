/**
 * API 服务商和模型配置
 * 统一管理所有服务商和对应的模型列表
 *
 * 安全特性：
 * - API 密钥使用 AES-GCM 加密存储
 * - 加密密钥派生自设备指纹
 *
 * v2 改进：
 * - 使用 Promise 缓存避免竞态条件
 * - 移除不安全的同步 API
 * - 添加设置状态追踪
 */

import { encryptApiKey, decryptApiKey, apiKeyNeedsReencryption, EncryptionError } from '../utils/crypto';
import { DEFAULT_MODEL, MODEL_IDS, STORAGE_KEYS } from './constants';

// API 模式类型
export type ApiMode = 'membership' | 'custom';

// API 设置接口
export interface ApiSettings {
  apiMode: ApiMode;           // API 模式：会员模式或自定义模式
  provider: string;
  apiKey: string;
  selectedModel: string;
  customModels: string[];
  baseUrl?: string;
}

// 设置加载状态
export type SettingsLoadState = 'idle' | 'loading' | 'ready' | 'error';

// 设置加载结果
export interface SettingsLoadResult {
  settings: ApiSettings;
  state: SettingsLoadState;
  error?: string;
  needsReencryption?: boolean;
}

// 会员模式配置（平台提供的 API）
export const MEMBERSHIP_API_CONFIG = {
  baseUrl: 'https://api.tiandao.ai/v1',  // 平台 API 地址（待配置）
  defaultModel: MODEL_IDS.TIANDAO_CREATIVE_V1,    // 平台默认模型
  models: [
    { id: MODEL_IDS.TIANDAO_CREATIVE_V1, name: '天道创作 V1', description: '专为网文创作优化', pointsCost: 1 },
    { id: MODEL_IDS.TIANDAO_CREATIVE_PRO, name: '天道创作 Pro', description: '高级创作模型', pointsCost: 2 },
    { id: MODEL_IDS.TIANDAO_PLOT_MASTER, name: '天道情节大师', description: '情节构思专家', pointsCost: 2 },
  ]
};

// 服务商配置
export const API_PROVIDERS = [
  { id: 'google', name: 'Google Gemini', baseUrl: '' },
  { id: 'siliconflow', name: '硅基流动 (SiliconFlow)', baseUrl: 'https://api.siliconflow.cn/v1' },
  { id: 'openai', name: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { id: 'deepseek', name: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { id: 'custom', name: '自定义 (Custom)', baseUrl: '' },
];

// 各服务商默认模型
export const PROVIDER_MODELS: Record<string, { id: string; name: string; description?: string }[]> = {
  google: [
    { id: MODEL_IDS.GEMINI_2_FLASH, name: 'Gemini 2.0 Flash', description: '高效 & 均衡' },
    { id: MODEL_IDS.GEMINI_2_5_FLASH_PREVIEW, name: 'Gemini 2.5 Flash', description: '最新预览版' },
    { id: MODEL_IDS.GEMINI_2_5_PRO_PREVIEW, name: 'Gemini 2.5 Pro', description: '高智能 & 复杂逻辑' },
    { id: MODEL_IDS.GEMINI_1_5_PRO, name: 'Gemini 1.5 Pro', description: '长上下文' },
    { id: MODEL_IDS.GEMINI_1_5_FLASH, name: 'Gemini 1.5 Flash', description: '快速响应' },
  ],
  siliconflow: [
    { id: MODEL_IDS.DEEPSEEK_V3, name: 'DeepSeek V3', description: '高性能通用' },
    { id: MODEL_IDS.DEEPSEEK_V3_0324, name: 'DeepSeek V3 0324', description: '最新版本' },
    { id: MODEL_IDS.QWEN_72B, name: 'Qwen 2.5 72B', description: '大参数量' },
    { id: MODEL_IDS.QWEN_7B, name: 'Qwen 2.5 7B', description: '轻量快速' },
  ],
  openai: [
    { id: MODEL_IDS.GPT_4O, name: 'GPT-4o', description: '旗舰多模态' },
    { id: MODEL_IDS.GPT_4O_MINI, name: 'GPT-4o Mini', description: '高效经济' },
    { id: MODEL_IDS.GPT_4_TURBO, name: 'GPT-4 Turbo', description: '增强版' },
  ],
  deepseek: [
    { id: MODEL_IDS.DEEPSEEK_CHAT, name: 'DeepSeek Chat', description: '对话优化' },
    { id: MODEL_IDS.DEEPSEEK_CODER, name: 'DeepSeek Coder', description: '代码专精' },
  ],
  custom: [],
};

// 存储 key（使用常量）
export const API_SETTINGS_KEY = STORAGE_KEYS.API_SETTINGS;

// 默认 API 设置
const DEFAULT_API_SETTINGS: ApiSettings = {
  apiMode: 'custom',
  provider: 'google',
  apiKey: '',
  selectedModel: DEFAULT_MODEL,
  customModels: [],
  baseUrl: '',
};

// ==================== 缓存管理 ====================

// Promise 缓存 - 避免竞态条件
let settingsPromise: Promise<SettingsLoadResult> | null = null;

// 已解密的设置缓存
let cachedSettings: ApiSettings | null = null;

// 当前加载状态
let loadState: SettingsLoadState = 'idle';

// 状态变更监听器
type SettingsChangeListener = (settings: ApiSettings, state: SettingsLoadState) => void;
const listeners: Set<SettingsChangeListener> = new Set();

/**
 * 订阅设置变更
 */
export const subscribeToSettings = (listener: SettingsChangeListener): (() => void) => {
  listeners.add(listener);
  // 如果已有缓存，立即通知
  if (cachedSettings) {
    listener(cachedSettings, loadState);
  }
  return () => listeners.delete(listener);
};

/**
 * 通知所有监听器
 */
const notifyListeners = (settings: ApiSettings, state: SettingsLoadState) => {
  listeners.forEach(listener => {
    try {
      listener(settings, state);
    } catch (e) {
      console.error('[ApiConfig] Listener error:', e);
    }
  });
};

// ==================== 解密逻辑 ====================

interface StoredSettings extends ApiSettings {
  _encrypted?: boolean;
}

/**
 * 解密设置中的 API Key
 */
const decryptSettings = async (settings: StoredSettings): Promise<{
  settings: ApiSettings;
  needsReencryption: boolean;
}> => {
  let needsReencryption = false;

  // 如果已标记为加密，则解密
  if (settings._encrypted && settings.apiKey) {
    try {
      // 检查是否需要重新加密（旧格式）
      needsReencryption = apiKeyNeedsReencryption(settings.apiKey);

      const decryptedKey = await decryptApiKey(settings.apiKey);
      return {
        settings: {
          ...settings,
          apiKey: decryptedKey,
        },
        needsReencryption,
      };
    } catch (e) {
      if (e instanceof EncryptionError) {
        console.error('[ApiConfig] 解密失败:', e.code, e.message);
      } else {
        console.error('[ApiConfig] 解密失败:', e);
      }
      // 返回空密钥，用户需要重新输入
      return {
        settings: {
          ...settings,
          apiKey: '',
        },
        needsReencryption: false,
      };
    }
  }

  return { settings, needsReencryption: false };
};

// ==================== 加载和保存 ====================

/**
 * 从存储加载设置（内部方法）
 */
const loadSettingsFromStorage = async (): Promise<SettingsLoadResult> => {
  loadState = 'loading';

  try {
    let storedSettings: StoredSettings | null = null;

    // 优先从 IndexedDB 加载
    try {
      const { storage } = await import('../services/storage/StorageService');
      await storage.init();
      storedSettings = await storage.get<StoredSettings>(API_SETTINGS_KEY, null);
    } catch (e) {
      console.warn('[ApiConfig] IndexedDB 加载失败，回退到 localStorage:', e);
    }

    // 如果 IndexedDB 没有，尝试 localStorage
    if (!storedSettings) {
      const saved = localStorage.getItem(API_SETTINGS_KEY);
      if (saved) {
        storedSettings = JSON.parse(saved);
      }
    }

    if (storedSettings) {
      // 兼容旧版本设置
      if (!storedSettings.apiMode) {
        storedSettings.apiMode = 'custom';
      }

      // 解密 API Key
      const { settings: decrypted, needsReencryption } = await decryptSettings(storedSettings);

      cachedSettings = decrypted;
      loadState = 'ready';

      // 如果需要重新加密，静默升级
      if (needsReencryption && decrypted.apiKey) {
        console.log('[ApiConfig] 检测到旧加密格式，正在升级...');
        // 触发重新保存以升级加密格式
        saveApiSettings(decrypted);
      }

      notifyListeners(decrypted, 'ready');

      return {
        settings: decrypted,
        state: 'ready',
        needsReencryption,
      };
    }
  } catch (e) {
    console.error('[ApiConfig] 加载设置失败:', e);
    loadState = 'error';
    return {
      settings: DEFAULT_API_SETTINGS,
      state: 'error',
      error: e instanceof Error ? e.message : '未知错误',
    };
  }

  // 没有保存的设置，返回默认值
  cachedSettings = DEFAULT_API_SETTINGS;
  loadState = 'ready';
  notifyListeners(DEFAULT_API_SETTINGS, 'ready');

  return {
    settings: DEFAULT_API_SETTINGS,
    state: 'ready',
  };
};

/**
 * 获取 API 设置（异步，推荐使用）
 *
 * 使用 Promise 缓存避免竞态条件：
 * - 首次调用会触发加载
 * - 后续调用在加载完成前会等待同一个 Promise
 * - 加载完成后直接返回缓存
 */
export const getApiSettingsAsync = async (): Promise<ApiSettings> => {
  // 如果有缓存，直接返回
  if (cachedSettings && loadState === 'ready') {
    return cachedSettings;
  }

  // 如果正在加载，等待现有 Promise
  if (settingsPromise) {
    const result = await settingsPromise;
    return result.settings;
  }

  // 开始新的加载
  settingsPromise = loadSettingsFromStorage();
  const result = await settingsPromise;
  return result.settings;
};

/**
 * 获取 API 设置（同步，返回缓存或默认值）
 *
 * 注意：此方法可能返回未解密的设置或默认值
 * 仅在确定已初始化后使用，否则请使用 getApiSettingsAsync
 */
export const getApiSettings = (): ApiSettings => {
  if (cachedSettings) {
    return cachedSettings;
  }

  // 触发异步加载（不阻塞）
  if (!settingsPromise) {
    settingsPromise = loadSettingsFromStorage();
  }

  // 返回默认值
  return DEFAULT_API_SETTINGS;
};

/**
 * 获取当前加载状态
 */
export const getSettingsLoadState = (): SettingsLoadState => loadState;

/**
 * 检查设置是否已加载
 */
export const isSettingsLoaded = (): boolean => loadState === 'ready' && cachedSettings !== null;

/**
 * 初始化 API 设置（应用启动时调用）
 */
export const initApiSettings = async (): Promise<SettingsLoadResult> => {
  // 如果已经加载完成，直接返回
  if (cachedSettings && loadState === 'ready') {
    return {
      settings: cachedSettings,
      state: 'ready',
    };
  }

  // 如果正在加载，等待完成
  if (settingsPromise) {
    return await settingsPromise;
  }

  // 开始加载
  settingsPromise = loadSettingsFromStorage();
  return await settingsPromise;
};

/**
 * 保存 API 设置（带加密）
 */
export const saveApiSettings = async (settings: ApiSettings): Promise<void> => {
  // 立即更新缓存（保存明文供内存使用）
  cachedSettings = settings;
  loadState = 'ready';
  notifyListeners(settings, 'ready');

  try {
    // 加密 API Key
    const encryptedApiKey = settings.apiKey
      ? await encryptApiKey(settings.apiKey)
      : '';

    const settingsToStore: StoredSettings = {
      ...settings,
      apiKey: encryptedApiKey,
      _encrypted: true,
    };

    // 保存到 localStorage（同步，确保即使页面关闭也能保存）
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify(settingsToStore));

    // 异步保存到 IndexedDB
    try {
      const { storage } = await import('../services/storage/StorageService');
      await storage.set(API_SETTINGS_KEY, settingsToStore);
    } catch (e) {
      console.warn('[ApiConfig] IndexedDB 保存失败:', e);
    }
  } catch (e) {
    console.error('[ApiConfig] 保存设置失败:', e);

    if (e instanceof EncryptionError) {
      // 加密失败，抛出错误让调用方处理
      throw new Error(`无法安全保存 API 密钥: ${e.message}`);
    }

    // 其他错误，尝试不加密保存（警告用户）
    console.warn('[ApiConfig] 降级保存（未加密）');
    localStorage.setItem(API_SETTINGS_KEY, JSON.stringify({
      ...settings,
      _encrypted: false,
    }));
  }
};

/**
 * 清除设置缓存（用于登出等场景）
 */
export const clearSettingsCache = (): void => {
  cachedSettings = null;
  settingsPromise = null;
  loadState = 'idle';
};

// ==================== 辅助函数 ====================

/**
 * 获取当前服务商的可用模型列表（包含自定义模型）
 */
export const getAvailableModels = (settings?: ApiSettings) => {
  const currentSettings = settings || getApiSettings();

  // 会员模式：返回平台提供的模型
  if (currentSettings.apiMode === 'membership') {
    return MEMBERSHIP_API_CONFIG.models.map(m => ({
      id: m.id,
      name: m.name,
      description: m.description,
      pointsCost: m.pointsCost
    }));
  }

  // 自定义模式：返回服务商的模型列表
  const provider = currentSettings.provider || 'google';
  const defaultModels = PROVIDER_MODELS[provider] || [];
  const customModels = (currentSettings.customModels || []).map(id => ({
    id,
    name: id,
    description: '自定义模型'
  }));
  return [...defaultModels, ...customModels];
};

/**
 * 检查是否为会员模式
 */
export const isMembershipMode = (): boolean => {
  return getApiSettings().apiMode === 'membership';
};

/**
 * 获取服务商显示名称
 */
export const getProviderDisplayName = (providerId: string): string => {
  const provider = API_PROVIDERS.find(p => p.id === providerId);
  return provider?.name || providerId;
};

/**
 * 检查 API 是否已配置
 */
export const isApiConfigured = (): boolean => {
  const settings = getApiSettings();
  if (settings.apiMode === 'membership') {
    return true; // 会员模式不需要 API Key
  }
  return !!settings.apiKey;
};

/**
 * 获取默认设置（用于重置）
 */
export const getDefaultApiSettings = (): ApiSettings => {
  return { ...DEFAULT_API_SETTINGS };
};
