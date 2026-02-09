import { describe, it, expect, beforeEach } from 'vitest';
import { OutlineTemplateService } from '../OutlineTemplateService';
import { OutlineNode } from '../../../types/novel';

describe('OutlineTemplateService', () => {
  describe('getTemplates', () => {
    it('应该返回所有预设模板', () => {
      const templates = OutlineTemplateService.getTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every(t => t.id && t.name && t.description)).toBe(true);
    });

    it('应该包含三幕式结构模板', () => {
      const templates = OutlineTemplateService.getTemplates();
      const threeAct = templates.find(t => t.id === 'three-act');
      
      expect(threeAct).toBeDefined();
      expect(threeAct?.name).toBe('三幕式结构');
      expect(threeAct?.structure.length).toBe(3);
    });

    it('应该包含网文爽文结构模板', () => {
      const templates = OutlineTemplateService.getTemplates();
      const shuangwen = templates.find(t => t.id === 'webnovel-shuangwen');
      
      expect(shuangwen).toBeDefined();
      expect(shuangwen?.category).toBe('webnovel');
    });
  });

  describe('getTemplateById', () => {
    it('应该能通过ID获取模板', () => {
      const template = OutlineTemplateService.getTemplateById('three-act');
      
      expect(template).toBeDefined();
      expect(template?.id).toBe('three-act');
    });

    it('不存在的ID应该返回undefined', () => {
      const template = OutlineTemplateService.getTemplateById('non-existent');
      
      expect(template).toBeUndefined();
    });
  });

  describe('getTemplatesByCategory', () => {
    it('应该能按类别筛选模板', () => {
      const classicTemplates = OutlineTemplateService.getTemplatesByCategory('classic');
      
      expect(classicTemplates.length).toBeGreaterThan(0);
      expect(classicTemplates.every(t => t.category === 'classic')).toBe(true);
    });

    it('应该能获取网文类模板', () => {
      const webnovelTemplates = OutlineTemplateService.getTemplatesByCategory('webnovel');
      
      expect(webnovelTemplates.length).toBeGreaterThan(0);
      expect(webnovelTemplates.every(t => t.category === 'webnovel')).toBe(true);
    });
  });

  describe('applyTemplate', () => {
    it('应该能将模板转换为大纲节点', () => {
      const template = OutlineTemplateService.getTemplateById('three-act')!;
      const nodes = OutlineTemplateService.applyTemplate(template, 'novel_123');
      
      expect(nodes.length).toBeGreaterThan(0);
      expect(nodes.every(n => n.id && n.title && n.type)).toBe(true);
    });

    it('应该正确设置父子关系', () => {
      const template = OutlineTemplateService.getTemplateById('three-act')!;
      const nodes = OutlineTemplateService.applyTemplate(template, 'novel_123');
      
      const volumeNodes = nodes.filter(n => n.type === 'volume');
      const chapterNodes = nodes.filter(n => n.type === 'chapter');
      
      expect(volumeNodes.length).toBe(3);
      expect(chapterNodes.length).toBeGreaterThan(0);
      expect(chapterNodes.every(n => n.parentId)).toBe(true);
    });

    it('应该设置正确的顺序', () => {
      const template = OutlineTemplateService.getTemplateById('three-act')!;
      const nodes = OutlineTemplateService.applyTemplate(template, 'novel_123');
      
      const orders = nodes.map(n => n.order);
      const sortedOrders = [...orders].sort((a, b) => a - b);
      
      expect(orders).toEqual(sortedOrders);
    });

    it('应该设置初始状态为planned', () => {
      const template = OutlineTemplateService.getTemplateById('three-act')!;
      const nodes = OutlineTemplateService.applyTemplate(template, 'novel_123');
      
      expect(nodes.every(n => n.status === 'planned')).toBe(true);
    });
  });

  describe('createCustomTemplate', () => {
    it('应该能从大纲节点创建自定义模板', () => {
      const nodes: OutlineNode[] = [
        {
          id: 'node_1',
          title: '第一卷',
          content: '开端',
          type: 'volume',
          order: 0,
          status: 'planned',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'node_2',
          title: '第一章',
          content: '开始',
          type: 'chapter',
          parentId: 'node_1',
          order: 1,
          status: 'planned',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const template = OutlineTemplateService.createCustomTemplate(
        '我的模板',
        '自定义模板',
        nodes
      );

      expect(template.name).toBe('我的模板');
      expect(template.description).toBe('自定义模板');
      expect(template.structure.length).toBe(1);
      expect(template.structure[0].children?.length).toBe(1);
    });
  });

  describe('英雄之旅模板', () => {
    it('应该包含12个步骤', () => {
      const template = OutlineTemplateService.getTemplateById('heros-journey')!;
      
      expect(template.structure.length).toBe(12);
    });
  });

  describe('玄幻修仙模板', () => {
    it('应该包含修炼境界', () => {
      const template = OutlineTemplateService.getTemplateById('xuanhuan-xiuxian')!;
      const nodes = OutlineTemplateService.applyTemplate(template, 'novel_123');
      
      const hasQiRefining = nodes.some(n => n.title.includes('炼气期'));
      const hasGoldenCore = nodes.some(n => n.title.includes('金丹期'));
      
      expect(hasQiRefining).toBe(true);
      expect(hasGoldenCore).toBe(true);
    });
  });
});
