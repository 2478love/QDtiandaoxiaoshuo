/**
 * @fileoverview Gemini AI API 服务
 * @module services/api/gemini
 * @description 提供与 Google Gemini AI 的通信接口，支持流式生成和普通请求
 * @version 1.0.0
 *
 * @features
 * - 支持多种 API 提供商配置
 * - 流式文本生成
 * - 请求超时控制
 * - 重试机制
 * - 会员模式和自定义模式切换
 *
 * @example
 * // 测试 API 连接
 * const result = await testConnection();
 *
 * // 流式生成内容
 * await streamGenerateContent(prompt, (chunk) => {
 *   console.log('收到:', chunk);
 * });
 *
 * // 普通生成
 * const response = await generateContent(prompt);
 */

import { GoogleGenAI } from "@google/genai";
import { ApiSettings, getApiSettings, API_PROVIDERS, MEMBERSHIP_API_CONFIG, isMembershipMode } from '../../config/apiConfig';

// ==================== 超时控制 ====================

/** 默认请求超时时间（毫秒） */
const DEFAULT_TIMEOUT_MS = 60000; // 60 秒

/** 流式请求超时时间（毫秒） - 较长因为流式需要持续读取 */
const STREAM_TIMEOUT_MS = 300000; // 5 分钟

/** 连接测试超时时间（毫秒） */
const TEST_TIMEOUT_MS = 15000; // 15 秒

/**
 * 创建带超时的 AbortController
 */
const createTimeoutController = (timeoutMs: number = DEFAULT_TIMEOUT_MS): {
  controller: AbortController;
  timeoutId: ReturnType<typeof setTimeout>;
  clear: () => void;
} => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`请求超时（${timeoutMs / 1000}秒）`));
  }, timeoutMs);

  return {
    controller,
    timeoutId,
    clear: () => clearTimeout(timeoutId),
  };
};

/**
 * 带超时的 fetch 封装
 */
const fetchWithTimeout = async (
  url: string,
  options: RequestInit,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<Response> => {
  const { controller, clear } = createTimeoutController(timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clear();
  }
};

// 获取有效的 API Key
const getEffectiveApiKey = (): string => {
  const settings = getApiSettings();

  // 会员模式：使用平台 API（暂时返回空，等待后端配置）
  if (settings.apiMode === 'membership') {
    // TODO: 从用户会话中获取会员 token 或使用平台统一的 API 认证
    // 目前返回空字符串，会提示用户会员服务即将上线
    return '';
  }

  // 自定义模式：优先使用用户设置的 API Key
  if (settings.apiKey) {
    return settings.apiKey;
  }
  // 回退到环境变量
  return process.env.API_KEY || '';
};

// 获取有效的模型名称
const getEffectiveModel = (defaultModel: string): string => {
  const settings = getApiSettings();

  // 会员模式：使用平台提供的模型
  if (settings.apiMode === 'membership') {
    return settings.selectedModel || MEMBERSHIP_API_CONFIG.defaultModel;
  }

  // 自定义模式：如果用户选择了模型，使用用户的选择
  if (settings.selectedModel) {
    return settings.selectedModel;
  }
  return defaultModel;
};

// 获取服务商的 Base URL
const getProviderBaseUrl = (provider: string, customBaseUrl?: string): string => {
  const settings = getApiSettings();

  // 会员模式：使用平台 API 地址
  if (settings.apiMode === 'membership') {
    return MEMBERSHIP_API_CONFIG.baseUrl;
  }

  const providerConfig = API_PROVIDERS.find(p => p.id === provider);
  if (providerConfig?.baseUrl) {
    return providerConfig.baseUrl;
  }
  if (provider === 'custom') {
    return customBaseUrl || '';
  }
  return '';
};

// 检查会员模式可用性
const checkMembershipAvailability = (): { available: boolean; message: string } => {
  // TODO: 实现会员状态检查逻辑
  // 目前会员服务尚未上线，返回不可用
  return {
    available: false,
    message: "会员服务即将上线，敬请期待。目前请使用自定义 API 模式。"
  };
};

const handleGeminiError = (error: any): string => {
  console.error("API Error:", error);
  if (!error) return "未知错误。";

  // 获取完整的错误信息
  const errorStr = error.message || error.toString() || '';
  const msg = errorStr.toLowerCase();

  // 超时错误（优先检测）
  if (error.name === 'AbortError' || msg.includes('abort') || msg.includes('超时') || msg.includes('timeout')) {
    return "请求超时，请检查网络连接或稍后重试。";
  }

  // 更详细的错误处理 - 注意：配额和频率限制错误需要优先检测，防止被 "api key" 检测误捕获

  // 配额相关错误（优先检测，因为可能包含 "api key" 字样）
  if (msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("insufficient_quota") || msg.includes("exceeded")) {
    return "API 配额已用尽。请检查你的账户配额，或等待配额重置后再试。";
  }

  // 频率限制错误（优先检测）
  if (msg.includes("rate limit") || msg.includes("too many requests") || msg.includes("429")) {
    return "请求过于频繁，请稍后再试。";
  }

  // API Key 相关错误
  if (msg.includes("api_key_invalid") || msg.includes("api key not valid") || msg.includes("invalid api key") || msg.includes("unauthorized") || msg.includes("401")) {
    return "API Key 无效，请检查是否正确输入。";
  }
  if (msg.includes("api key") || msg.includes("apikey")) {
    return "API Key 缺失或无效，请在设置中配置正确的 API Key。";
  }
  if (msg.includes("safety") || msg.includes("content_filter")) {
    return "内容被安全过滤器拦截，请尝试更温和的描述。";
  }
  if (msg.includes("not found") || msg.includes("404") || msg.includes("model_not_found")) {
    return "模型不存在或不可用，请检查模型名称是否正确。";
  }
  if (msg.includes("permission") || msg.includes("403") || msg.includes("forbidden")) {
    return "没有权限访问该 API，请检查 API Key 的权限设置。";
  }
  if (msg.includes("network") || msg.includes("fetch") || msg.includes("connection") || msg.includes("econnrefused") || msg.includes("timeout")) {
    return "网络连接错误，请检查网络设置或 API 地址是否正确。";
  }
  if (msg.includes("cors")) {
    return "跨域请求被拒绝，请检查 API 配置。";
  }

  // 显示原始错误的前200字符，帮助调试
  return `生成异常: ${errorStr.slice(0, 200)}`;
};

// OpenAI 兼容 API 调用（用于 SiliconFlow、OpenAI、DeepSeek 等）
const callOpenAICompatibleAPI = async (
  baseUrl: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  options?: { temperature?: number; max_tokens?: number; stream?: boolean; timeoutMs?: number }
): Promise<Response> => {
  const timeoutMs = options?.stream ? STREAM_TIMEOUT_MS : (options?.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options?.temperature ?? 0.8,
        max_tokens: options?.max_tokens,
        stream: options?.stream ?? false,
      }),
    },
    timeoutMs
  );
  return response;
};

// 测试 API 连接
export const testApiConnection = async (): Promise<{ success: boolean; message: string; model?: string }> => {
  try {
    const settings = getApiSettings();

    // 会员模式：检查会员服务可用性
    if (settings.apiMode === 'membership') {
      const membershipStatus = checkMembershipAvailability();
      if (!membershipStatus.available) {
        return { success: false, message: membershipStatus.message };
      }
      // TODO: 会员模式的连接测试逻辑
      return { success: false, message: "会员服务即将上线，请使用自定义 API 模式。" };
    }

    // 自定义模式：使用用户配置的 API
    const apiKey = settings.apiKey || getEffectiveApiKey();

    if (!apiKey) {
      return { success: false, message: "未配置 API Key，请先在设置中输入你的 API Key。" };
    }

    const model = settings.selectedModel || 'gemini-2.0-flash';
    const provider = settings.provider || 'google';

    // Google Gemini API
    if (provider === 'google') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: model,
        contents: "Hello, please respond with just 'OK' to confirm connection.",
        config: {
          temperature: 0.1,
          maxOutputTokens: 10,
        }
      });

      if (response.text) {
        return {
          success: true,
          message: `连接成功！Google Gemini 模型 ${model} 响应正常。`,
          model: model
        };
      }
      return { success: false, message: "连接成功但未收到响应。" };
    }

    // OpenAI 兼容 API（SiliconFlow、OpenAI、DeepSeek、自定义）
    const baseUrl = getProviderBaseUrl(provider, settings.baseUrl);
    if (!baseUrl) {
      return { success: false, message: "请配置 API Base URL。" };
    }

    const response = await callOpenAICompatibleAPI(
      baseUrl,
      apiKey,
      model,
      [{ role: 'user', content: 'Hello, please respond with just "OK" to confirm connection.' }],
      { temperature: 0.1, max_tokens: 10, timeoutMs: TEST_TIMEOUT_MS }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || errorData.message || `HTTP ${response.status}`;
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (content) {
      const providerName = provider === 'siliconflow' ? '硅基流动' :
                          provider === 'openai' ? 'OpenAI' :
                          provider === 'deepseek' ? 'DeepSeek' : '自定义服务商';
      return {
        success: true,
        message: `连接成功！${providerName} 模型 ${model} 响应正常。`,
        model: model
      };
    }
    return { success: false, message: "连接成功但未收到响应。" };

  } catch (error: any) {
    const errorMsg = handleGeminiError(error);
    return { success: false, message: errorMsg };
  }
};

export const generateCreativeContent = async (
  prompt: string,
  modelName: string = 'gemini-2.0-flash',
  systemInstruction?: string
): Promise<string> => {
  try {
    const settings = getApiSettings();

    // 会员模式：检查会员服务可用性
    if (settings.apiMode === 'membership') {
      const membershipStatus = checkMembershipAvailability();
      if (!membershipStatus.available) {
        return `⚠️ [天道提示] ${membershipStatus.message}`;
      }
      // TODO: 会员模式的 API 调用逻辑
      return "⚠️ [天道提示] 会员服务即将上线，请使用自定义 API 模式。";
    }

    // 自定义模式：使用用户配置的 API
    const apiKey = settings.apiKey || getEffectiveApiKey();

    if (!apiKey) {
      return "⚠️ [天道提示] 请先在设置中配置 API Key。";
    }

    const effectiveModel = getEffectiveModel(modelName);
    const provider = settings.provider || 'google';

    // Google Gemini API
    if (provider === 'google') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: effectiveModel,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
          topP: 0.95,
        }
      });
      return response.text || "生成无内容。";
    }

    // OpenAI 兼容 API
    const baseUrl = getProviderBaseUrl(provider, settings.baseUrl);
    if (!baseUrl) {
      return "⚠️ [天道提示] 请配置 API Base URL。";
    }

    const messages: { role: string; content: string }[] = [];
    if (systemInstruction) {
      messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await callOpenAICompatibleAPI(baseUrl, apiKey, effectiveModel, messages, {
      temperature: 0.8,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "生成无内容。";

  } catch (error) {
    return `⚠️ [天道提示] ${handleGeminiError(error)}`;
  }
};

export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number | 'unlimited';
  systemInstruction?: string;
}

export const generateCreativeContentStream = async (
  prompt: string,
  onChunk: (text: string) => void,
  modelName: string = 'gemini-2.0-flash',
  options?: GenerateOptions
) => {
  try {
    const settings = getApiSettings();

    // 会员模式：检查会员服务可用性
    if (settings.apiMode === 'membership') {
      const membershipStatus = checkMembershipAvailability();
      if (!membershipStatus.available) {
        onChunk(`⚠️ [天道提示] ${membershipStatus.message}`);
        return;
      }
      // TODO: 会员模式的流式 API 调用逻辑
      onChunk("⚠️ [天道提示] 会员服务即将上线，请使用自定义 API 模式。");
      return;
    }

    // 自定义模式：使用用户配置的 API
    const apiKey = settings.apiKey || getEffectiveApiKey();

    if (!apiKey) {
      onChunk("⚠️ [天道提示] 请先在设置中配置 API Key。");
      return;
    }

    const effectiveModel = getEffectiveModel(modelName);
    const provider = settings.provider || 'google';
    const temperature = options?.temperature ?? 0.85;
    const maxOutputTokens = options?.maxTokens === 'unlimited' ? undefined : options?.maxTokens;

    // Google Gemini API
    if (provider === 'google') {
      const ai = new GoogleGenAI({ apiKey });
      const stream = await ai.models.generateContentStream({
        model: effectiveModel,
        contents: prompt,
        config: {
          systemInstruction: options?.systemInstruction,
          temperature,
          maxOutputTokens,
        }
      });

      for await (const chunk of stream) {
        if (chunk.text) {
          onChunk(chunk.text);
        }
      }
      return;
    }

    // OpenAI 兼容 API 流式输出
    const baseUrl = getProviderBaseUrl(provider, settings.baseUrl);
    if (!baseUrl) {
      onChunk("⚠️ [天道提示] 请配置 API Base URL。");
      return;
    }

    const messages: { role: string; content: string }[] = [];
    if (options?.systemInstruction) {
      messages.push({ role: 'system', content: options.systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await callOpenAICompatibleAPI(baseUrl, apiKey, effectiveModel, messages, {
      temperature,
      max_tokens: maxOutputTokens,
      stream: true,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法读取响应流');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (trimmed.startsWith('data: ')) {
          try {
            const json = JSON.parse(trimmed.slice(6));
            const content = json.choices?.[0]?.delta?.content;
            if (content) {
              onChunk(content);
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
    }

  } catch (error) {
    onChunk(`\n\n⚠️ [天道提示]: ${handleGeminiError(error)}`);
  }
};
