/**
 * @fileoverview 网络搜索服务
 * @module services/api/webSearch
 * @description 提供网络搜索功能，让 AI 能够获取实时网络信息
 */

// 搜索结果接口
export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export interface WebSearchResponse {
  success: boolean;
  results: SearchResult[];
  error?: string;
}

// 存储 key
const SEARCH_SETTINGS_KEY = 'tiandao_search_settings';

// 搜索设置接口
export interface SearchSettings {
  enabled: boolean;
  maxResults: number;
}

// 默认设置
const DEFAULT_SEARCH_SETTINGS: SearchSettings = {
  enabled: false,
  maxResults: 5,
};

/**
 * 获取搜索设置
 */
export const getSearchSettings = (): SearchSettings => {
  try {
    const saved = localStorage.getItem(SEARCH_SETTINGS_KEY);
    if (saved) {
      return { ...DEFAULT_SEARCH_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('[WebSearch] 读取设置失败:', e);
  }
  return DEFAULT_SEARCH_SETTINGS;
};

/**
 * 保存搜索设置
 */
export const saveSearchSettings = (settings: Partial<SearchSettings>): void => {
  try {
    const current = getSearchSettings();
    const newSettings = { ...current, ...settings };
    localStorage.setItem(SEARCH_SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (e) {
    console.error('[WebSearch] 保存设置失败:', e);
  }
};

/**
 * 使用 DuckDuckGo Instant Answer API 进行搜索
 * 注意：这是一个有限的 API，主要返回摘要信息
 */
const searchWithDuckDuckGo = async (query: string): Promise<WebSearchResponse> => {
  try {
    // DuckDuckGo Instant Answer API (免费，无需 API key)
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json();
    const results: SearchResult[] = [];

    // 提取摘要
    if (data.Abstract) {
      results.push({
        title: data.Heading || query,
        link: data.AbstractURL || '',
        snippet: data.Abstract,
      });
    }

    // 提取相关主题
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 4)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Text.split(' - ')[0] || topic.Text.slice(0, 50),
            link: topic.FirstURL,
            snippet: topic.Text,
          });
        }
      }
    }

    return { success: true, results };
  } catch (error) {
    console.error('[WebSearch] DuckDuckGo 搜索失败:', error);
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : '搜索失败',
    };
  }
};

/**
 * 使用 SearXNG 公共实例进行搜索（备用方案）
 */
const searchWithSearXNG = async (query: string, maxResults: number): Promise<WebSearchResponse> => {
  // 公共 SearXNG 实例列表
  const instances = [
    'https://searx.be',
    'https://search.sapti.me',
    'https://searx.tiekoetter.com',
  ];

  for (const instance of instances) {
    try {
      const url = `${instance}/search?q=${encodeURIComponent(query)}&format=json&categories=general`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) continue;

      const data = await response.json();
      const results: SearchResult[] = [];

      if (data.results && Array.isArray(data.results)) {
        for (const item of data.results.slice(0, maxResults)) {
          results.push({
            title: item.title || '',
            link: item.url || '',
            snippet: item.content || '',
          });
        }
      }

      if (results.length > 0) {
        return { success: true, results };
      }
    } catch (error) {
      console.warn(`[WebSearch] SearXNG 实例 ${instance} 失败:`, error);
      continue;
    }
  }

  return {
    success: false,
    results: [],
    error: '所有搜索实例均不可用',
  };
};

/**
 * 执行网络搜索
 * 优先使用 DuckDuckGo，失败时尝试 SearXNG
 */
export const performWebSearch = async (query: string): Promise<WebSearchResponse> => {
  const settings = getSearchSettings();

  if (!settings.enabled) {
    return { success: false, results: [], error: '联网搜索未启用' };
  }

  if (!query.trim()) {
    return { success: false, results: [], error: '搜索词为空' };
  }

  console.log('[WebSearch] 开始搜索:', query);

  // 先尝试 DuckDuckGo
  let result = await searchWithDuckDuckGo(query);

  // 如果 DuckDuckGo 没有结果，尝试 SearXNG
  if (!result.success || result.results.length === 0) {
    console.log('[WebSearch] DuckDuckGo 无结果，尝试 SearXNG...');
    result = await searchWithSearXNG(query, settings.maxResults);
  }

  console.log('[WebSearch] 搜索完成，结果数:', result.results.length);
  return result;
};

/**
 * 从用户消息中提取搜索关键词
 * 使用简单的启发式方法
 */
export const extractSearchQuery = (message: string): string | null => {
  // 移除常见的问候语和无关词汇
  const cleaned = message
    .replace(/^(你好|您好|请问|帮我|请|能不能|可以|麻烦)/g, '')
    .replace(/(吗|呢|啊|吧|呀|哦|嘛|\?|？|。|！|!)/g, '')
    .trim();

  // 如果消息太短，不进行搜索
  if (cleaned.length < 4) {
    return null;
  }

  // 检测是否需要搜索的关键词
  const searchTriggers = [
    '最新', '现在', '今天', '目前', '当前', '最近',
    '新闻', '消息', '资讯', '动态',
    '查一下', '搜索', '查找', '找一下', '搜一下',
    '是什么', '怎么样', '如何', '什么是',
    '多少', '哪里', '哪个', '谁是', '什么时候',
  ];

  const needsSearch = searchTriggers.some(trigger => message.includes(trigger));

  if (needsSearch) {
    return cleaned;
  }

  return null;
};

/**
 * 格式化搜索结果为上下文文本
 */
export const formatSearchResultsAsContext = (results: SearchResult[]): string => {
  if (results.length === 0) {
    return '';
  }

  let context = '【网络搜索结果】\n\n';

  results.forEach((result, index) => {
    context += `${index + 1}. ${result.title}\n`;
    context += `   ${result.snippet}\n`;
    if (result.link) {
      context += `   来源: ${result.link}\n`;
    }
    context += '\n';
  });

  context += '---\n请基于以上搜索结果回答用户问题。如果搜索结果不相关或不足，可以结合自己的知识回答。\n\n';

  return context;
};

export default {
  performWebSearch,
  extractSearchQuery,
  formatSearchResultsAsContext,
  getSearchSettings,
  saveSearchSettings,
};
