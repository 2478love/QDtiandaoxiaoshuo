import React, { useState, useEffect, useCallback } from 'react';
import { User, Theme, StoredUser, LoginHistoryEntry } from '../../../types';
import { testApiConnection } from '../../../services/api/gemini';
import { encryptApiKey, decryptApiKey, createId, hashPassword, verifyPasswordHash } from '../../../utils';
import { useToast } from '../../ui/Toast';
import {
  ApiSettings,
  ApiMode,
  API_PROVIDERS,
  PROVIDER_MODELS,
  MEMBERSHIP_API_CONFIG,
  API_SETTINGS_KEY,
  getApiSettings,
  getApiSettingsAsync,
  saveApiSettings,
  getProviderDisplayName
} from '../../../config/apiConfig';

// 重新导出供其他模块使用
export type { ApiSettings };
export { getApiSettings, saveApiSettings };

// 已保存的 API 配置预设
export interface SavedApiPreset {
  id: string;
  name: string;
  settings: ApiSettings;
  createdAt: string;
}
const API_PRESETS_KEY = 'tiandao_api_presets';

// 获取已保存的预设列表（异步解密）
const getSavedPresetsAsync = async (): Promise<SavedApiPreset[]> => {
  try {
    const saved = localStorage.getItem(API_PRESETS_KEY);
    if (saved) {
      const presets: SavedApiPreset[] = JSON.parse(saved);
      // 解密所有预设的 API Key
      const decryptedPresets = await Promise.all(
        presets.map(async (preset) => {
          if (preset.settings.apiKey) {
            try {
              const decryptedKey = await decryptApiKey(preset.settings.apiKey);
              return {
                ...preset,
                settings: {
                  ...preset.settings,
                  apiKey: decryptedKey,
                },
              };
            } catch {
              return preset;
            }
          }
          return preset;
        })
      );
      return decryptedPresets;
    }
  } catch (e) {
    console.error('Failed to load API presets:', e);
  }
  return [];
};

// 同步获取预设列表（可能包含加密的 key）
const getSavedPresets = (): SavedApiPreset[] => {
  try {
    const saved = localStorage.getItem(API_PRESETS_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load API presets:', e);
  }
  return [];
};

// 保存预设列表（带加密）
const savePresetsAsync = async (presets: SavedApiPreset[]): Promise<void> => {
  try {
    // 加密所有预设的 API Key
    const encryptedPresets = await Promise.all(
      presets.map(async (preset) => {
        if (preset.settings.apiKey) {
          const encryptedKey = await encryptApiKey(preset.settings.apiKey);
          return {
            ...preset,
            settings: {
              ...preset.settings,
              apiKey: encryptedKey,
            },
          };
        }
        return preset;
      })
    );
    localStorage.setItem(API_PRESETS_KEY, JSON.stringify(encryptedPresets));
  } catch (e) {
    console.error('Failed to save API presets:', e);
  }
};

// 同步保存（降级方案）
const savePresets = (presets: SavedApiPreset[]): void => {
  // 使用异步版本
  savePresetsAsync(presets).catch(e => {
    console.error('Failed to save presets:', e);
    // 降级：直接保存（不加密）
    try {
      localStorage.setItem(API_PRESETS_KEY, JSON.stringify(presets));
    } catch (err) {
      console.error('Failed to save presets to localStorage:', err);
    }
  });
};

// 遮蔽 API Key 显示
const maskApiKey = (key: string): string => {
  if (!key || key.length < 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

interface SettingsProps {
  user?: User | null;
  storedUser?: StoredUser | null;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

type SettingsTab = 'profile' | 'security' | 'general' | 'writing' | 'api';

// 密码强度检查
const checkPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\\/`~]/.test(password)) score++;

  const labels = ['非常弱', '弱', '一般', '强', '非常强'];
  const colors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-lime-500', 'bg-emerald-500'];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
  };
};

// 密码修改组件
function PasswordChangeSection({ onPasswordChange, toast }: {
  onPasswordChange?: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  toast: ReturnType<typeof useToast>;
}) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordStrength = checkPasswordStrength(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const isValid = currentPassword && newPassword.length >= 8 && passwordsMatch && passwordStrength.score >= 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onPasswordChange || !isValid) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const result = await onPasswordChange(currentPassword, newPassword);
      if (result.success) {
        toast.success(result.message);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('密码修改失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
        修改密码
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl text-sm text-rose-600 dark:text-rose-400">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">当前密码</label>
          <div className="relative">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="请输入当前密码"
              className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(p => ({ ...p, current: !p.current }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPasswords.current ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">新密码</label>
          <div className="relative">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="至少 8 个字符"
              minLength={8}
              maxLength={128}
              className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(p => ({ ...p, new: !p.new }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPasswords.new ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {/* 密码强度指示器 */}
          {newPassword && (
            <div className="mt-2 space-y-1.5">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      level <= passwordStrength.score ? passwordStrength.color : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>
              <p className={`text-xs font-medium ${
                passwordStrength.score <= 1 ? 'text-rose-500' :
                passwordStrength.score === 2 ? 'text-yellow-500' :
                'text-emerald-500'
              }`}>
                密码强度: {passwordStrength.label}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">确认新密码</label>
          <div className="relative">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              minLength={8}
              maxLength={128}
              className="w-full px-4 py-2.5 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPasswords(p => ({ ...p, confirm: !p.confirm }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
            >
              {showPasswords.confirm ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              )}
            </button>
          </div>
          {confirmPassword && (
            <p className={`mt-1.5 text-xs ${passwordsMatch ? 'text-emerald-500' : 'text-rose-500'}`}>
              {passwordsMatch ? '密码匹配' : '两次输入的密码不一致'}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              正在修改...
            </>
          ) : (
            '修改密码'
          )}
        </button>
      </div>
    </form>
  );
}

// 登录历史组件
function LoginHistorySection({ loginHistory }: { loginHistory?: LoginHistoryEntry[] }) {
  const [showAll, setShowAll] = useState(false);

  if (!loginHistory || loginHistory.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
        <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>暂无登录记录</p>
      </div>
    );
  }

  const sortedHistory = [...loginHistory].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const displayHistory = showAll ? sortedHistory : sortedHistory.slice(0, 5);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins} 分钟前`;
    if (diffHours < 24) return `${diffHours} 小时前`;
    if (diffDays < 7) return `${diffDays} 天前`;

    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const parseUserAgent = (ua?: string) => {
    if (!ua) return { browser: '未知浏览器', os: '未知系统' };

    let browser = '未知浏览器';
    let os = '未知系统';

    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Edge')) browser = 'Edge';

    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

    return { browser, os };
  };

  return (
    <div className="space-y-3">
      {displayHistory.map((entry, index) => {
        const { browser, os } = parseUserAgent(entry.userAgent);
        return (
          <div
            key={index}
            className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
              entry.success
                ? 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                : 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                entry.success
                  ? 'bg-emerald-100 dark:bg-emerald-900/30'
                  : 'bg-rose-100 dark:bg-rose-900/30'
              }`}>
                {entry.success ? (
                  <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`text-sm font-medium ${
                  entry.success ? 'text-slate-700 dark:text-slate-200' : 'text-rose-700 dark:text-rose-300'
                }`}>
                  {entry.success ? '登录成功' : '登录失败'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {browser} / {os}
                </p>
              </div>
            </div>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {formatDate(entry.timestamp)}
            </span>
          </div>
        );
      })}

      {sortedHistory.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
        >
          {showAll ? '收起' : `查看全部 ${sortedHistory.length} 条记录`}
        </button>
      )}
    </div>
  );
}

export default function Settings({ user, storedUser, theme, onThemeChange, onPasswordChange }: SettingsProps) {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const [profile, setProfile] = useState({
    nickname: user?.name || '天道用户',
    bio: '热爱创作，笔耕不辍。',
    email: user?.email || 'user@tiandao.ai',
    phone: '138****8888',
    website: ''
  });

  const [preferences, setPreferences] = useState({
    autoSave: true,
    defaultModel: 'gemini-2.0-flash',
    defaultTone: 'standard'
  });

  // API 设置状态
  const [apiSettings, setApiSettings] = useState<ApiSettings>(getApiSettings);
  const [customModelInput, setCustomModelInput] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiSaveStatus, setApiSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  // 预设相关状态
  const [savedPresets, setSavedPresets] = useState<SavedApiPreset[]>([]);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [showSavePresetModal, setShowSavePresetModal] = useState(false);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // 初始化加载 API 设置和预设（使用异步解密）
  useEffect(() => {
    let mounted = true;

    // 加载 API 设置
    getApiSettingsAsync().then(settings => {
      if (mounted) {
        setApiSettings(settings);
      }
    });

    // 加载预设（异步解密）
    getSavedPresetsAsync().then(presets => {
      if (mounted) {
        setSavedPresets(presets);
      }
    });

    return () => { mounted = false; };
  }, []);

  // 当服务商改变时，自动选择第一个可用模型
  const handleProviderChange = useCallback((providerId: string) => {
    const models = PROVIDER_MODELS[providerId] || [];
    const provider = API_PROVIDERS.find(p => p.id === providerId);
    setApiSettings(prev => ({
      ...prev,
      provider: providerId,
      selectedModel: models[0]?.id || '',
      baseUrl: provider?.baseUrl || '',
    }));
  }, []);

  // 添加自定义模型
  const handleAddCustomModel = useCallback(() => {
    if (!customModelInput.trim()) return;
    if (apiSettings.customModels.includes(customModelInput.trim())) {
      setCustomModelInput('');
      return;
    }
    setApiSettings(prev => ({
      ...prev,
      customModels: [...prev.customModels, customModelInput.trim()],
      selectedModel: customModelInput.trim(),
    }));
    setCustomModelInput('');
  }, [customModelInput, apiSettings.customModels]);

  // 删除自定义模型
  const handleRemoveCustomModel = useCallback((modelId: string) => {
    setApiSettings(prev => ({
      ...prev,
      customModels: prev.customModels.filter(m => m !== modelId),
      selectedModel: prev.selectedModel === modelId
        ? (PROVIDER_MODELS[prev.provider]?.[0]?.id || '')
        : prev.selectedModel,
    }));
  }, []);

  // 保存 API 设置
  const handleSaveApiSettings = useCallback(() => {
    setApiSaveStatus('saving');
    try {
      saveApiSettings(apiSettings);
      setApiSaveStatus('saved');
      setTimeout(() => setApiSaveStatus('idle'), 2000);
    } catch {
      setApiSaveStatus('error');
      setTimeout(() => setApiSaveStatus('idle'), 3000);
    }
  }, [apiSettings]);

  // 取消 API 设置修改
  const handleCancelApiSettings = useCallback(() => {
    setApiSettings(getApiSettings());
    setCustomModelInput('');
    setTestStatus('idle');
    setTestMessage('');
  }, []);

  // 保存当前配置为预设
  const handleSaveAsPreset = useCallback(() => {
    if (!presetNameInput.trim()) {
      toast.warning('请输入预设名称');
      return;
    }
    const newPreset: SavedApiPreset = {
      id: createId(),
      name: presetNameInput.trim(),
      settings: { ...apiSettings },
      createdAt: new Date().toISOString(),
    };
    const updatedPresets = [...savedPresets, newPreset];
    setSavedPresets(updatedPresets);
    savePresets(updatedPresets);
    setPresetNameInput('');
    setShowSavePresetModal(false);
    setActivePresetId(newPreset.id);
    toast.success('预设保存成功');
  }, [presetNameInput, apiSettings, savedPresets, toast]);

  // 加载预设配置
  const handleLoadPreset = useCallback((preset: SavedApiPreset) => {
    setApiSettings(preset.settings);
    setActivePresetId(preset.id);
    // 同时保存到当前设置
    saveApiSettings(preset.settings);
  }, []);

  // 删除预设
  const handleDeletePreset = useCallback((presetId: string) => {
    if (!window.confirm('确定要删除这个预设吗？')) return;
    const updatedPresets = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updatedPresets);
    savePresets(updatedPresets);
    if (activePresetId === presetId) {
      setActivePresetId(null);
    }
  }, [savedPresets, activePresetId]);

  // 测试 API 连接
  const handleTestConnection = useCallback(async () => {
    // 先保存当前设置，这样测试会使用最新的配置
    saveApiSettings(apiSettings);

    setTestStatus('testing');
    setTestMessage('正在测试连接...');

    try {
      const result = await testApiConnection();
      if (result.success) {
        setTestStatus('success');
        setTestMessage(result.message);
      } else {
        setTestStatus('error');
        setTestMessage(result.message);
      }
    } catch (error: any) {
      setTestStatus('error');
      setTestMessage(error.message || '测试失败，请检查网络连接。');
    }
  }, [apiSettings]);

  const handleSave = () => {
    toast.success("设置已保存");
  };

  const TabButton = ({ id, label, icon }: { id: SettingsTab; label: string; icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
        activeTab === id
          ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-100 dark:ring-indigo-500/20'
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'
      }`}
    >
      <span className={activeTab === id ? 'text-indigo-500 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}>{icon}</span>
      {label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500 flex gap-8">

      <div className="w-64 shrink-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-4 h-fit transition-colors duration-300">
        <h2 className="px-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-4 mt-2">设置中心</h2>
        <div className="space-y-1">
          <TabButton
            id="profile"
            label="个人资料"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          />
          <TabButton
            id="security"
            label="账号安全"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>}
          />
          <TabButton
            id="writing"
            label="创作偏好"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
          />
          <TabButton
            id="general"
            label="通用设置"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
          <TabButton
            id="api"
            label="API 设置"
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>}
          />
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-colors duration-300">
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
            {activeTab === 'profile' && '个人资料'}
            {activeTab === 'security' && '账号安全'}
            {activeTab === 'writing' && '创作偏好'}
            {activeTab === 'general' && '通用设置'}
            {activeTab === 'api' && 'API 设置'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {activeTab === 'profile' && '管理您的个人信息和公开资料'}
            {activeTab === 'security' && '更新密码及账号绑定信息'}
            {activeTab === 'writing' && '自定义您的 AI 写作助手默认行为'}
            {activeTab === 'general' && '系统显示、语言及通知设置'}
            {activeTab === 'api' && '配置 AI 服务商和 API 密钥'}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">

          {activeTab === 'profile' && (
            <div className="space-y-8 max-w-2xl">
              <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-md overflow-hidden flex items-center justify-center text-3xl font-bold text-slate-300">
                    {user?.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (profile.nickname[0] || 'U')}
                  </div>
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 dark:text-slate-200">头像设置</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">支持 JPG, PNG 格式，建议尺寸 200x200 像素。</p>
                  <button className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-100 transition-colors">更换头像</button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">昵称</label>
                    <input
                      type="text"
                      value={profile.nickname}
                      onChange={(e) => setProfile({...profile, nickname: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">个人网站 (可选)</label>
                    <input
                      type="text"
                      value={profile.website}
                      onChange={(e) => setProfile({...profile, website: e.target.value})}
                      placeholder="https://"
                      className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">个人简介</label>
                  <textarea
                    rows={4}
                    value={profile.bio}
                    onChange={(e) => setProfile({...profile, bio: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all resize-none"
                  ></textarea>
                  <p className="text-right text-xs text-slate-400 dark:text-slate-500 mt-1">{profile.bio.length} / 200</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
             <div className="space-y-8 max-w-2xl">
                <div className="space-y-6">
                   <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 shadow-sm">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                         </div>
                         <div>
                             <h4 className="font-bold text-slate-700 dark:text-slate-200">绑定邮箱</h4>
                             <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
                         </div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">已验证</span>
                   </div>

                   <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <PasswordChangeSection onPasswordChange={onPasswordChange} toast={toast} />
                   </div>

                   {/* 登录历史 */}
                   <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        登录历史
                      </h3>
                      <LoginHistorySection loginHistory={storedUser?.loginHistory} />
                   </div>

                   {/* 账户安全状态 */}
                   <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                      <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">账户安全状态</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">密码强度</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">您的密码已使用安全的 PBKDF2-SHA256 加密存储</p>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200">登录保护</span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">已启用登录失败锁定保护（5 次失败后锁定 15 分钟）</p>
                        </div>
                      </div>
                   </div>
                </div>
             </div>
          )}

          {activeTab === 'writing' && (
             <div className="space-y-8 max-w-2xl">
                 <div className="space-y-6">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">默认创作模型</label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                                 {id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: '速度快，适合大多数任务'},
                                 {id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: '逻辑强，适合复杂推理'}
                             ].map(model => (
                                 <div
                                    key={model.id}
                                    onClick={() => setPreferences({...preferences, defaultModel: model.id})}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all ${
                                        preferences.defaultModel === model.id
                                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:bg-slate-50 dark:hover:bg-slate-800'
                                    }`}
                                 >
                                     <div className="flex items-center justify-between mb-1">
                                         <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{model.name}</span>
                                         {preferences.defaultModel === model.id && <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>}
                                     </div>
                                     <p className="text-xs text-slate-500 dark:text-slate-400">{model.desc}</p>
                                 </div>
                             ))}
                         </div>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">默认文风</label>
                         <select
                            value={preferences.defaultTone}
                            onChange={(e) => setPreferences({...preferences, defaultTone: e.target.value})}
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                         >
                             <option value="standard">标准 (Standard)</option>
                             <option value="vivid">生动 (Vivid)</option>
                             <option value="humorous">幽默 (Humorous)</option>
                             <option value="serious">严肃 (Serious)</option>
                             <option value="dark">暗黑 (Dark)</option>
                         </select>
                     </div>

                     <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                         <div>
                             <h4 className="font-bold text-slate-700 dark:text-slate-200">自动保存草稿</h4>
                             <p className="text-sm text-slate-500 dark:text-slate-400">编辑内容时自动保存到本地，防止丢失。</p>
                         </div>
                         <button
                            onClick={() => setPreferences({...preferences, autoSave: !preferences.autoSave})}
                            className={`w-12 h-6 rounded-full transition-colors relative ${preferences.autoSave ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                         >
                             <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${preferences.autoSave ? 'left-7' : 'left-1'}`}></div>
                         </button>
                     </div>
                 </div>
             </div>
          )}

          {activeTab === 'general' && (
              <div className="space-y-8 max-w-2xl">
                  <div className="space-y-6">
                     <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">界面语言</label>
                         <select
                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                         >
                             <option value="zh-CN">简体中文 (Chinese Simplified)</option>
                             <option value="en-US">English (US)</option>
                         </select>
                     </div>

                     <div>
                         <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">颜色主题</label>
                         <div className="grid grid-cols-3 gap-4">
                             <button
                                onClick={() => onThemeChange('light')}
                                className={`p-4 rounded-xl border text-center transition-all ${theme === 'light' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                             >
                                 浅色模式
                             </button>
                             <button
                                onClick={() => onThemeChange('dark')}
                                className={`p-4 rounded-xl border text-center transition-all ${theme === 'dark' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                             >
                                 深色模式
                             </button>
                             <button
                                onClick={() => onThemeChange('system')}
                                className={`p-4 rounded-xl border text-center transition-all ${theme === 'system' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'}`}
                             >
                                 跟随系统
                             </button>
                         </div>
                     </div>

                     <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                         <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">存储与缓存</h3>
                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                             <div>
                                 <h4 className="font-bold text-slate-700 dark:text-slate-200">清除本地缓存</h4>
                                 <p className="text-sm text-slate-500 dark:text-slate-400">释放空间，解决显示异常问题。</p>
                             </div>
                             <button className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-200 font-medium rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600 hover:text-red-500 transition-colors">
                                 立即清除
                             </button>
                         </div>
                     </div>
                  </div>
              </div>
          )}

          {activeTab === 'api' && (
              <div className="space-y-6 max-w-2xl">
                  {/* API 模式切换 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-900/20 dark:to-violet-900/20">
                      <div className="flex items-center justify-between mb-3">
                          <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  API 使用模式
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  选择使用平台会员积分或自己配置的 API
                              </p>
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                          <button
                              type="button"
                              onClick={() => setApiSettings(prev => ({ ...prev, apiMode: 'custom' }))}
                              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                  apiSettings.apiMode === 'custom'
                                      ? 'border-indigo-500 bg-white dark:bg-slate-800 shadow-md'
                                      : 'border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:border-indigo-300'
                              }`}
                          >
                              <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      apiSettings.apiMode === 'custom'
                                          ? 'bg-indigo-100 dark:bg-indigo-900/50'
                                          : 'bg-slate-100 dark:bg-slate-700'
                                  }`}>
                                      <svg className={`w-5 h-5 ${apiSettings.apiMode === 'custom' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                      </svg>
                                  </div>
                                  <div>
                                      <p className={`font-bold text-sm ${apiSettings.apiMode === 'custom' ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                          自定义 API
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                          配置自己的密钥
                                      </p>
                                  </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                  使用自己的 API Key，支持多种服务商
                              </p>
                              <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 font-medium">
                                  推荐
                              </span>
                              {apiSettings.apiMode === 'custom' && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                  </div>
                              )}
                          </button>
                          <button
                              type="button"
                              onClick={() => setApiSettings(prev => ({ ...prev, apiMode: 'membership' }))}
                              className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                                  apiSettings.apiMode === 'membership'
                                      ? 'border-amber-500 bg-white dark:bg-slate-800 shadow-md'
                                      : 'border-slate-200 dark:border-slate-600 bg-white/50 dark:bg-slate-800/50 hover:border-amber-300'
                              }`}
                          >
                              <div className="flex items-center gap-3 mb-2">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                      apiSettings.apiMode === 'membership'
                                          ? 'bg-amber-100 dark:bg-amber-900/50'
                                          : 'bg-slate-100 dark:bg-slate-700'
                                  }`}>
                                      <svg className={`w-5 h-5 ${apiSettings.apiMode === 'membership' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                  </div>
                                  <div>
                                      <p className={`font-bold text-sm ${apiSettings.apiMode === 'membership' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                          会员模式
                                      </p>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                          使用平台积分
                                      </p>
                                  </div>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                  购买会员获取积分，按使用量扣费
                              </p>
                              <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-medium">
                                  即将上线
                              </span>
                              {apiSettings.apiMode === 'membership' && (
                                  <div className="absolute top-2 right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                      </svg>
                                  </div>
                              )}
                          </button>
                      </div>
                  </div>

                  {/* 会员模式信息面板 */}
                  {apiSettings.apiMode === 'membership' && (
                      <div className="p-6 rounded-xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
                          <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
                                  <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                  </svg>
                              </div>
                              <div className="flex-1">
                                  <h3 className="text-lg font-bold text-amber-800 dark:text-amber-300 mb-1">
                                      会员服务即将上线
                                  </h3>
                                  <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">
                                      会员积分系统正在开发中，敬请期待。目前 AI 功能无法在此模式下使用。
                                  </p>

                                  <div className="p-4 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-amber-200 dark:border-amber-700">
                                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                          如何立即使用 AI 功能？
                                      </p>
                                      <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside">
                                          <li>切换到上方的「自定义 API」模式</li>
                                          <li>选择您的 AI 服务商（如 Google Gemini、OpenAI 等）</li>
                                          <li>输入您的 API Key</li>
                                          <li>点击「测试连接」验证配置</li>
                                          <li>保存设置即可开始使用</li>
                                      </ol>
                                  </div>

                                  <button
                                      type="button"
                                      onClick={() => setApiSettings(prev => ({ ...prev, apiMode: 'custom' }))}
                                      className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
                                  >
                                      切换到自定义 API 模式
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* 自定义 API 配置 - 仅在自定义模式下显示 */}
                  {apiSettings.apiMode === 'custom' && (
                  <>
                  {/* 已保存的配置预设 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between mb-3">
                          <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  已保存的配置 ({savedPresets.length})
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  点击预设可快速切换不同服务商配置
                              </p>
                          </div>
                          <button
                              type="button"
                              onClick={() => setShowSavePresetModal(true)}
                              disabled={!apiSettings.apiKey}
                              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                              保存当前配置
                          </button>
                      </div>

                      {savedPresets.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {savedPresets.map(preset => (
                                  <div
                                      key={preset.id}
                                      className={`group relative p-3 rounded-xl border cursor-pointer transition-all ${
                                          activePresetId === preset.id
                                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-500'
                                              : 'border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500/50 bg-white dark:bg-slate-800'
                                      }`}
                                      onClick={() => handleLoadPreset(preset)}
                                  >
                                      <div className="flex items-start justify-between">
                                          <div className="flex-1 min-w-0">
                                              <p className={`text-sm font-semibold truncate ${
                                                  activePresetId === preset.id
                                                      ? 'text-indigo-700 dark:text-indigo-400'
                                                      : 'text-slate-700 dark:text-slate-200'
                                              }`}>
                                                  {preset.name}
                                              </p>
                                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                                  {getProviderDisplayName(preset.settings.provider)}
                                              </p>
                                              <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                                                  {maskApiKey(preset.settings.apiKey)}
                                              </p>
                                          </div>
                                          <button
                                              type="button"
                                              onClick={(e) => {
                                                  e.stopPropagation();
                                                  handleDeletePreset(preset.id);
                                              }}
                                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                                          >
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                              </svg>
                                          </button>
                                      </div>
                                      {activePresetId === preset.id && (
                                          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                              </svg>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      ) : (
                          <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs border border-dashed border-slate-200 dark:border-slate-600 rounded-xl">
                              暂无保存的配置，配置好 API 后点击"保存当前配置"
                          </div>
                      )}
                  </div>

                  {/* 保存预设弹窗 */}
                  {showSavePresetModal && (
                      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSavePresetModal(false)}>
                          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
                              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">保存配置预设</h3>
                              <div className="space-y-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">预设名称</label>
                                      <input
                                          type="text"
                                          value={presetNameInput}
                                          onChange={(e) => setPresetNameInput(e.target.value)}
                                          placeholder="例如：我的 DeepSeek 配置"
                                          className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100"
                                          autoFocus
                                      />
                                  </div>
                                  <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm">
                                      <p className="text-slate-500 dark:text-slate-400 mb-2">将保存以下配置：</p>
                                      <div className="space-y-1 text-xs">
                                          <p><span className="text-slate-400">服务商：</span><span className="text-slate-700 dark:text-slate-200">{getProviderDisplayName(apiSettings.provider)}</span></p>
                                          <p><span className="text-slate-400">API Key：</span><span className="text-slate-700 dark:text-slate-200 font-mono">{maskApiKey(apiSettings.apiKey)}</span></p>
                                          <p><span className="text-slate-400">模型：</span><span className="text-slate-700 dark:text-slate-200">{apiSettings.selectedModel || '未选择'}</span></p>
                                      </div>
                                  </div>
                              </div>
                              <div className="flex gap-3 mt-6">
                                  <button
                                      onClick={() => setShowSavePresetModal(false)}
                                      className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                                  >
                                      取消
                                  </button>
                                  <button
                                      onClick={handleSaveAsPreset}
                                      disabled={!presetNameInput.trim()}
                                      className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                  >
                                      保存预设
                                  </button>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* 服务商选择 */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          服务商 (Provider)
                      </label>
                      <select
                          value={apiSettings.provider}
                          onChange={(e) => handleProviderChange(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                      >
                          {API_PROVIDERS.map(provider => (
                              <option key={provider.id} value={provider.id}>
                                  {provider.name}
                              </option>
                          ))}
                      </select>
                  </div>

                  {/* API Key 输入 */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          API Key
                      </label>
                      <div className="relative">
                          <input
                              type={showApiKey ? 'text' : 'password'}
                              value={apiSettings.apiKey}
                              onChange={(e) => setApiSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                              placeholder="输入你的 API Key..."
                              className="w-full px-4 py-3 pr-12 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all font-mono"
                          />
                          <button
                              type="button"
                              onClick={() => setShowApiKey(!showApiKey)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                              {showApiKey ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                              ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                              )}
                          </button>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          API Key 仅存储在本地浏览器中，不会上传至服务器。
                      </p>
                  </div>

                  {/* 自定义 Base URL (仅在自定义服务商时显示) */}
                  {apiSettings.provider === 'custom' && (
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                              自定义 Base URL
                          </label>
                          <input
                              type="text"
                              value={apiSettings.baseUrl || ''}
                              onChange={(e) => setApiSettings(prev => ({ ...prev, baseUrl: e.target.value }))}
                              placeholder="https://api.example.com/v1"
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                          />
                      </div>
                  )}

                  {/* 模型选择 */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          模型选择 (Model)
                      </label>
                      <select
                          value={apiSettings.selectedModel}
                          onChange={(e) => setApiSettings(prev => ({ ...prev, selectedModel: e.target.value }))}
                          className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all"
                      >
                          <option value="">-- 推荐模型 (Recommended) --</option>
                          {(PROVIDER_MODELS[apiSettings.provider] || []).map(model => (
                              <option key={model.id} value={model.id}>
                                  {model.name}
                              </option>
                          ))}
                          {apiSettings.customModels.length > 0 && (
                              <optgroup label="自定义模型">
                                  {apiSettings.customModels.map(modelId => (
                                      <option key={modelId} value={modelId}>
                                          {modelId}
                                      </option>
                                  ))}
                              </optgroup>
                          )}
                      </select>
                  </div>

                  {/* 自定义模型输入 */}
                  <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                          添加自定义模型
                      </label>
                      <div className="flex gap-2">
                          <input
                              type="text"
                              value={customModelInput}
                              onChange={(e) => setCustomModelInput(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomModel()}
                              placeholder="deepseek-ai/DeepSeek-V3.1-Terminus"
                              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800 dark:text-slate-100 transition-all font-mono text-sm"
                          />
                          <button
                              type="button"
                              onClick={handleAddCustomModel}
                              className="px-4 py-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                          >
                              <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                              </svg>
                          </button>
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                          输入自定义 ID 后点击 + 号可保存至列表。
                      </p>
                  </div>

                  {/* 已添加的自定义模型列表 */}
                  {apiSettings.customModels.length > 0 && (
                      <div>
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                              已添加的自定义模型
                          </label>
                          <div className="space-y-2">
                              {apiSettings.customModels.map(modelId => (
                                  <div
                                      key={modelId}
                                      className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                                  >
                                      <span className="text-sm font-mono text-slate-700 dark:text-slate-300 truncate">
                                          {modelId}
                                      </span>
                                      <button
                                          type="button"
                                          onClick={() => handleRemoveCustomModel(modelId)}
                                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                      >
                                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                          </svg>
                                      </button>
                                  </div>
                              ))}
                          </div>
                      </div>
                  )}

                  {/* 测试连接 */}
                  <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <div className="flex items-center justify-between">
                          <div>
                              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                  测试 API 连接
                              </p>
                              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                  验证 API Key 和模型配置是否正确
                              </p>
                          </div>
                          <button
                              type="button"
                              onClick={handleTestConnection}
                              disabled={testStatus === 'testing' || !apiSettings.apiKey}
                              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                          >
                              {testStatus === 'testing' ? (
                                  <>
                                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                      </svg>
                                      测试中...
                                  </>
                              ) : (
                                  <>
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                      </svg>
                                      测试连接
                                  </>
                              )}
                          </button>
                      </div>
                      {testMessage && (
                          <div className={`mt-3 p-3 rounded-lg text-sm ${
                              testStatus === 'success'
                                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30'
                                  : testStatus === 'error'
                                  ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                          }`}>
                              {testStatus === 'success' && '✓ '}
                              {testStatus === 'error' && '✕ '}
                              {testMessage}
                          </div>
                      )}
                  </div>

                  {/* 保存状态提示 */}
                  {apiSaveStatus !== 'idle' && (
                      <div className={`p-4 rounded-xl border ${
                          apiSaveStatus === 'saved'
                              ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                              : apiSaveStatus === 'error'
                              ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                          {apiSaveStatus === 'saving' && '正在保存...'}
                          {apiSaveStatus === 'saved' && '✓ API 设置已保存成功！'}
                          {apiSaveStatus === 'error' && '✕ 保存失败，请重试。'}
                      </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                          type="button"
                          onClick={handleCancelApiSettings}
                          className="flex-1 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                      >
                          取消
                      </button>
                      <button
                          type="button"
                          onClick={handleSaveApiSettings}
                          disabled={apiSaveStatus === 'saving'}
                          className="flex-1 px-6 py-3 rounded-xl bg-slate-900 dark:bg-indigo-600 text-white font-bold hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                      >
                          {apiSaveStatus === 'saving' ? '保存中...' : '保存'}
                      </button>
                  </div>
                  </>
                  )}
              </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-4">
             <button className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                 重置
             </button>
             <button
                onClick={handleSave}
                className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:shadow-indigo-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
             >
                 保存更改
             </button>
        </div>
      </div>
    </div>
  );
}
