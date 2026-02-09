/**
 * @fileoverview 标签系统服务
 * @module services/tag/TagService
 */

import { Tag } from '../../types/tag';
import { Novel } from '../../types/novel';
import { createId } from '../../utils/id';

const STORAGE_KEY = 'tiandao_tags';

// 预设标签
const presetTags: Tag[] = [
  {
    id: 'tag_xuanhuan',
    name: '玄幻',
    color: '#9333ea',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_dushi',
    name: '都市',
    color: '#3b82f6',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_kehuan',
    name: '科幻',
    color: '#06b6d4',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_wuxia',
    name: '武侠',
    color: '#f59e0b',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_xianxia',
    name: '仙侠',
    color: '#8b5cf6',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_lishi',
    name: '历史',
    color: '#d97706',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_xuanyi',
    name: '悬疑',
    color: '#7c3aed',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_wanjie',
    name: '完结',
    color: '#10b981',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_lianzai',
    name: '连载',
    color: '#ef4444',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tag_caogao',
    name: '草稿',
    color: '#6b7280',
    count: 0,
    isPreset: true,
    createdAt: new Date().toISOString()
  },
];

export class TagService {
  /**
   * 获取所有标签（预设 + 自定义）
   */
  static getTags(): Tag[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const customTags = data ? JSON.parse(data) : [];
      return [...presetTags, ...customTags];
    } catch (error) {
      console.error('获取标签失败:', error);
      return [...presetTags];
    }
  }

  /**
   * 获取单个标签
   */
  static getTag(id: string): Tag | undefined {
    return this.getTags().find(t => t.id === id);
  }

  /**
   * 添加新标签
   */
  static addTag(name: string, color: string): Tag {
    try {
      const customTags = this.getCustomTags();
      
      // 检查是否已存在同名标签
      const allTags = this.getTags();
      if (allTags.some(t => t.name === name)) {
        throw new Error('标签名称已存在');
      }

      const newTag: Tag = {
        id: `tag_${createId()}`,
        name,
        color,
        count: 0,
        isPreset: false,
        createdAt: new Date().toISOString()
      };

      customTags.push(newTag);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTags));

      return newTag;
    } catch (error) {
      console.error('添加标签失败:', error);
      throw error;
    }
  }

  /**
   * 更新标签
   */
  static updateTag(id: string, updates: Partial<Pick<Tag, 'name' | 'color'>>): Tag | null {
    try {
      const customTags = this.getCustomTags();
      const index = customTags.findIndex(t => t.id === id);

      if (index === -1) {
        console.error('标签不存在或为预设标签，无法更新');
        return null;
      }

      // 如果更新名称，检查是否重复
      if (updates.name) {
        const allTags = this.getTags();
        if (allTags.some(t => t.name === updates.name && t.id !== id)) {
          throw new Error('标签名称已存在');
        }
      }

      customTags[index] = {
        ...customTags[index],
        ...updates,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTags));
      return customTags[index];
    } catch (error) {
      console.error('更新标签失败:', error);
      throw error;
    }
  }

  /**
   * 删除标签（仅自定义标签）
   */
  static deleteTag(id: string): boolean {
    try {
      const customTags = this.getCustomTags();
      const filtered = customTags.filter(t => t.id !== id);

      if (filtered.length === customTags.length) {
        console.error('标签不存在或为预设标签，无法删除');
        return false;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除标签失败:', error);
      return false;
    }
  }

  /**
   * 更新标签使用计数
   */
  static updateTagCounts(novels: Novel[]): Tag[] {
    const tags = this.getTags();
    
    // 重置所有计数
    tags.forEach(tag => {
      tag.count = 0;
    });

    // 统计每个标签的使用次数
    novels.forEach(novel => {
      if (novel.tags && Array.isArray(novel.tags)) {
        novel.tags.forEach(tagId => {
          const tag = tags.find(t => t.id === tagId);
          if (tag) {
            tag.count++;
          }
        });
      }
    });

    return tags;
  }

  /**
   * 根据标签筛选小说
   */
  static filterNovelsByTag(novels: Novel[], tagId: string | null): Novel[] {
    if (!tagId) {
      return novels;
    }

    return novels.filter(novel => 
      novel.tags && Array.isArray(novel.tags) && novel.tags.includes(tagId)
    );
  }

  /**
   * 为小说添加标签
   */
  static addTagToNovel(novel: Novel, tagId: string): Novel {
    if (!novel.tags) {
      novel.tags = [];
    }

    if (!novel.tags.includes(tagId)) {
      novel.tags.push(tagId);
    }

    return novel;
  }

  /**
   * 从小说移除标签
   */
  static removeTagFromNovel(novel: Novel, tagId: string): Novel {
    if (novel.tags) {
      novel.tags = novel.tags.filter(id => id !== tagId);
    }

    return novel;
  }

  /**
   * 获取自定义标签
   */
  private static getCustomTags(): Tag[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取自定义标签失败:', error);
      return [];
    }
  }

  /**
   * 获取预设标签
   */
  static getPresetTags(): Tag[] {
    return presetTags;
  }

  /**
   * 清空所有自定义标签
   */
  static clearCustomTags(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('清空自定义标签失败:', error);
    }
  }

  /**
   * 获取热门标签（按使用次数排序）
   */
  static getPopularTags(novels: Novel[], limit: number = 10): Tag[] {
    const tags = this.updateTagCounts(novels);
    return tags
      .filter(tag => tag.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * 搜索标签
   */
  static searchTags(query: string): Tag[] {
    const tags = this.getTags();
    const lowerQuery = query.toLowerCase();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerQuery)
    );
  }
}
