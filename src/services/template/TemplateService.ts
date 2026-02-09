/**
 * @fileoverview 模板管理服务
 * @module services/template/TemplateService
 */

import { Template } from '../../types/template';
import { createTemplateId } from '../../utils/id';

const STORAGE_KEY = 'tiandao_templates';

// 预设模板
const presetTemplates: Template[] = [
  {
    id: 'preset_xuanhuan',
    name: '玄幻小说模板',
    description: '经典玄幻小说结构，适合修仙、异界题材',
    category: 'novel',
    content: {
      title: '',
      description: '一个关于修炼、冒险与成长的故事',
      outline: `第一卷：初入江湖
第一章：平凡开局
第二章：意外奇遇
第三章：踏上修炼之路
第四章：初试身手
第五章：危机降临

第二卷：历练成长
第六章：进入宗门
第七章：结识伙伴
第八章：突破瓶颈
第九章：宗门大比
第十章：崭露头角

第三卷：风云再起
第十一章：江湖风波
第十二章：强敌来袭
第十三章：生死考验
第十四章：绝地反击
第十五章：名震一方`,
      tags: []
    },
    createdAt: new Date().toISOString(),
    isPreset: true
  },
  {
    id: 'preset_dushi',
    name: '都市小说模板',
    description: '现代都市题材，适合职场、情感故事',
    category: 'novel',
    content: {
      title: '',
      description: '一个关于都市生活的精彩故事',
      outline: `第一章：平凡生活
第二章：转折点
第三章：新的开始
第四章：初露锋芒
第五章：挑战来临
第六章：克服困难
第七章：小有成就
第八章：更大的舞台
第九章：巅峰对决
第十章：圆满结局`,
      tags: []
    },
    createdAt: new Date().toISOString(),
    isPreset: true
  },
  {
    id: 'preset_kehuan',
    name: '科幻小说模板',
    description: '科幻题材结构，适合未来世界、星际探索',
    category: 'novel',
    content: {
      title: '',
      description: '一个关于未来科技与人性的故事',
      outline: `第一章：未来世界
第二章：科技奇迹
第三章：危机降临
第四章：探索真相
第五章：意外发现
第六章：阴谋浮现
第七章：绝地反击
第八章：终极对决
第九章：新的纪元
第十章：希望之光`,
      tags: []
    },
    createdAt: new Date().toISOString(),
    isPreset: true
  },
  {
    id: 'preset_wuxia',
    name: '武侠小说模板',
    description: '经典武侠结构，适合江湖恩怨、侠义故事',
    category: 'novel',
    content: {
      title: '',
      description: '一个关于江湖侠义的传奇故事',
      outline: `第一章：初入江湖
第二章：拜师学艺
第三章：武功初成
第四章：江湖恩怨
第五章：正邪对立
第六章：武林大会
第七章：生死决战
第八章：真相大白
第九章：侠之大者
第十章：笑傲江湖`,
      tags: []
    },
    createdAt: new Date().toISOString(),
    isPreset: true
  },
  {
    id: 'preset_chapter_battle',
    name: '战斗章节模板',
    description: '适合战斗场景的章节结构',
    category: 'chapter',
    content: {
      title: '第X章：激烈交锋',
      outline: `1. 战前准备
   - 主角心理活动
   - 环境描写
   - 敌我双方态势

2. 战斗爆发
   - 第一回合交锋
   - 试探性攻击
   - 展现实力差距

3. 战斗升级
   - 使用绝招
   - 战况激烈
   - 环境破坏描写

4. 转折点
   - 意外情况
   - 底牌揭示
   - 局势逆转

5. 战斗结束
   - 分出胜负
   - 战后余波
   - 为下文埋伏笔`,
    },
    createdAt: new Date().toISOString(),
    isPreset: true
  },
  {
    id: 'preset_chapter_daily',
    name: '日常章节模板',
    description: '适合日常生活场景的章节结构',
    category: 'chapter',
    content: {
      title: '第X章：平静日常',
      outline: `1. 日常开始
   - 时间地点
   - 人物状态
   - 氛围营造

2. 日常互动
   - 人物对话
   - 性格展现
   - 关系推进

3. 小插曲
   - 有趣事件
   - 轻松幽默
   - 人物魅力

4. 情感升华
   - 内心独白
   - 情感共鸣
   - 主题深化

5. 日常结束
   - 温馨收尾
   - 为下文铺垫`,
    },
    createdAt: new Date().toISOString(),
    isPreset: true
  }
];

export class TemplateService {
  /**
   * 获取所有模板（预设 + 自定义）
   */
  static getTemplates(): Template[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const customTemplates = data ? JSON.parse(data) : [];
      return [...presetTemplates, ...customTemplates];
    } catch (error) {
      console.error('获取模板失败:', error);
      return [...presetTemplates];
    }
  }

  /**
   * 根据分类获取模板
   */
  static getTemplatesByCategory(category: Template['category']): Template[] {
    return this.getTemplates().filter(t => t.category === category);
  }

  /**
   * 获取单个模板
   */
  static getTemplate(id: string): Template | undefined {
    return this.getTemplates().find(t => t.id === id);
  }

  /**
   * 保存新模板
   */
  static saveTemplate(template: Omit<Template, 'id' | 'createdAt' | 'isPreset'>): Template {
    try {
      const newTemplate: Template = {
        ...template,
        id: createTemplateId(),
        createdAt: new Date().toISOString(),
        isPreset: false,
      };

      const customTemplates = this.getCustomTemplates();
      customTemplates.push(newTemplate);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));

      return newTemplate;
    } catch (error) {
      console.error('保存模板失败:', error);
      throw new Error('保存模板失败');
    }
  }

  /**
   * 更新模板
   */
  static updateTemplate(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'isPreset'>>): Template | null {
    try {
      const customTemplates = this.getCustomTemplates();
      const index = customTemplates.findIndex(t => t.id === id);

      if (index === -1) {
        console.error('模板不存在或为预设模板，无法更新');
        return null;
      }

      customTemplates[index] = {
        ...customTemplates[index],
        ...updates,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(customTemplates));
      return customTemplates[index];
    } catch (error) {
      console.error('更新模板失败:', error);
      return null;
    }
  }

  /**
   * 删除模板（仅自定义模板）
   */
  static deleteTemplate(id: string): boolean {
    try {
      const customTemplates = this.getCustomTemplates();
      const filtered = customTemplates.filter(t => t.id !== id);

      if (filtered.length === customTemplates.length) {
        console.error('模板不存在或为预设模板，无法删除');
        return false;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (error) {
      console.error('删除模板失败:', error);
      return false;
    }
  }

  /**
   * 应用模板到小说
   */
  static applyTemplate(template: Template): {
    title: string;
    description: string;
    outline: string;
    tags: string[];
  } {
    return {
      title: template.content.title || '',
      description: template.content.description || '',
      outline: template.content.outline || '',
      tags: template.content.tags || [],
    };
  }

  /**
   * 获取自定义模板
   */
  private static getCustomTemplates(): Template[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('获取自定义模板失败:', error);
      return [];
    }
  }

  /**
   * 获取预设模板
   */
  static getPresetTemplates(): Template[] {
    return presetTemplates;
  }

  /**
   * 清空所有自定义模板
   */
  static clearCustomTemplates(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('清空自定义模板失败:', error);
    }
  }
}
