import { describe, expect, it } from 'vitest';
import {
  analyzeGoldenThreeChapters,
  analyzeCoolPointDensity,
  detectChapterHook,
  analyzeWebNovelCapability,
  WEB_NOVEL_PATTERNS,
  COOL_POINT_TYPES
} from './webNovelAnalyzer';

describe('utils/webNovelAnalyzer', () => {
  describe('WEB_NOVEL_PATTERNS', () => {
    it('should have all pattern categories', () => {
      expect(WEB_NOVEL_PATTERNS.length).toBeGreaterThan(0);
      
      const categories = new Set(WEB_NOVEL_PATTERNS.map(p => p.category));
      expect(categories.has('opening')).toBe(true);
      expect(categories.has('rhythm')).toBe(true);
      expect(categories.has('conflict')).toBe(true);
    });

    it('should have complete pattern structure', () => {
      for (const pattern of WEB_NOVEL_PATTERNS) {
        expect(pattern.id).toBeTruthy();
        expect(pattern.name).toBeTruthy();
        expect(pattern.description).toBeTruthy();
        expect(pattern.structure.length).toBeGreaterThan(0);
        expect(pattern.examples.length).toBeGreaterThan(0);
        expect(pattern.tips.length).toBeGreaterThan(0);
      }
    });
  });

  describe('COOL_POINT_TYPES', () => {
    it('should have all cool point types', () => {
      expect(COOL_POINT_TYPES.power).toBeDefined();
      expect(COOL_POINT_TYPES.faceSlap).toBeDefined();
      expect(COOL_POINT_TYPES.treasure).toBeDefined();
      expect(COOL_POINT_TYPES.breakthrough).toBeDefined();
      expect(COOL_POINT_TYPES.recognition).toBeDefined();
      expect(COOL_POINT_TYPES.revenge).toBeDefined();
    });

    it('should have complete type structure', () => {
      for (const type of Object.values(COOL_POINT_TYPES)) {
        expect(type.name).toBeTruthy();
        expect(type.description).toBeTruthy();
        expect(type.triggers.length).toBeGreaterThan(0);
        expect(type.payoffs.length).toBeGreaterThan(0);
      }
    });
  });

  describe('analyzeGoldenThreeChapters', () => {
    it('should detect good golden three chapters', () => {
      const chapters = [
        '"你废了！"冷笑声响起。少年抬头，眼中闪过一丝不甘。这个世界，强者为尊。',
        '三年之约到了。所有人都在嘲讽他，但他知道，机会来了。突然，一道光芒闪过。',
        '震惊！所有人都震惊了！他竟然突破了！接下来，真正的战斗才刚刚开始。'
      ];

      const result = analyzeGoldenThreeChapters(chapters);
      
      expect(result.score).toBeGreaterThan(50);
      expect(result.analysis.chapter1.hasHook).toBe(true);
      expect(result.analysis.chapter2.hasConflict).toBe(true);
      expect(result.analysis.chapter3.hasClimax).toBe(true);
    });

    it('should detect poor golden three chapters', () => {
      const chapters = [
        '这是一个平凡的世界。主角是一个普通人。他每天过着平凡的生活。',
        '今天天气很好。主角去了学校。老师讲了很多知识。',
        '放学后主角回家了。吃了晚饭。然后睡觉了。'
      ];

      const result = analyzeGoldenThreeChapters(chapters);
      
      expect(result.score).toBeLessThan(50);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle insufficient chapters', () => {
      const chapters = ['第一章'];

      const result = analyzeGoldenThreeChapters(chapters);
      
      expect(result.score).toBe(0);
      expect(result.suggestions[0]).toContain('至少三章');
    });
  });

  describe('analyzeCoolPointDensity', () => {
    it('should detect cool points', () => {
      const content = '主角秒杀了敌人，震惊全场！获得了神器，实力突破，众人佩服不已。';

      const result = analyzeCoolPointDensity(content);
      
      expect(result.coolPoints.length).toBeGreaterThan(0);
      expect(result.density).toBeGreaterThan(0);
    });

    it('should calculate density correctly', () => {
      const content = '秒杀'.repeat(100) + '普通文字'.repeat(1000);

      const result = analyzeCoolPointDensity(content);
      
      expect(result.density).toBeGreaterThan(0);
      expect(result.score).toBeGreaterThan(0);
    });

    it('should score ideal density highly', () => {
      // 构造理想密度的文本（每万字3-5个爽点）
      const coolWords = ['秒杀', '震惊', '突破'];
      const normalText = '普通文字'.repeat(800);
      const content = coolWords.join(normalText);

      const result = analyzeCoolPointDensity(content);
      
      expect(result.score).toBeGreaterThan(60);
    });

    it('should handle empty content', () => {
      const result = analyzeCoolPointDensity('');
      
      expect(result.coolPoints.length).toBe(0);
      expect(result.density).toBe(0);
    });
  });

  describe('detectChapterHook', () => {
    it('should detect question hook', () => {
      const content = '主角走进房间。里面到底有什么？';

      const result = detectChapterHook(content);
      
      expect(result.hasHook).toBe(true);
      expect(result.hookType).toBe('question');
      expect(result.effectiveness).toBeGreaterThan(0);
    });

    it('should detect crisis hook', () => {
      const content = '一切都很平静。就在这时，一道杀气从背后袭来！';

      const result = detectChapterHook(content);
      
      expect(result.hasHook).toBe(true);
      expect(result.hookType).toBe('crisis');
      expect(result.effectiveness).toBeGreaterThan(70);
    });

    it('should detect surprise hook', () => {
      const content = '他打开盒子。里面竟然是传说中的神器！';

      const result = detectChapterHook(content);
      
      expect(result.hasHook).toBe(true);
      expect(result.hookType).toBe('surprise');
    });

    it('should detect twist hook', () => {
      const content = '主角以为胜利了。然而，真正的敌人才刚刚出现。';

      const result = detectChapterHook(content);
      
      expect(result.hasHook).toBe(true);
      expect(result.hookType).toBe('twist');
    });

    it('should detect no hook', () => {
      const content = '主角回家了。吃了晚饭。睡觉了。';

      const result = detectChapterHook(content);
      
      expect(result.hasHook).toBe(false);
      expect(result.hookType).toBe('none');
      expect(result.effectiveness).toBe(0);
    });
  });

  describe('analyzeWebNovelCapability', () => {
    it('should provide comprehensive analysis', () => {
      const chapters = [
        {
          title: '第一章',
          content: '"你废了！"冷笑声响起。少年抬头，眼中闪过一丝不甘。这个世界，强者为尊。'
        },
        {
          title: '第二章',
          content: '三年之约到了。所有人都在嘲讽他，但他知道，机会来了。突然，一道光芒闪过。'
        },
        {
          title: '第三章',
          content: '震惊！所有人都震惊了！他竟然突破了！秒杀了敌人！接下来，真正的战斗才刚刚开始。'
        }
      ];

      const result = analyzeWebNovelCapability(chapters);
      
      expect(result.goldenThreeChapters).toBeDefined();
      expect(result.rhythmScore).toBeGreaterThanOrEqual(0);
      expect(result.rhythmScore).toBeLessThanOrEqual(100);
      expect(result.coolPointDensity).toBeGreaterThanOrEqual(0);
      expect(result.hookEffectiveness).toBeGreaterThanOrEqual(0);
      expect(result.hookEffectiveness).toBeLessThanOrEqual(100);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should provide suggestions for poor content', () => {
      const chapters = [
        { title: '第一章', content: '平凡的一天。' },
        { title: '第二章', content: '又是平凡的一天。' },
        { title: '第三章', content: '还是平凡的一天。' }
      ];

      const result = analyzeWebNovelCapability(chapters);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.coolPointDensity).toBeLessThan(2);
    });

    it('should handle single chapter', () => {
      const chapters = [
        { title: '第一章', content: '开篇内容' }
      ];

      const result = analyzeWebNovelCapability(chapters);
      
      expect(result).toBeDefined();
      expect(result.suggestions).toBeDefined();
    });

    it('should detect good hook effectiveness', () => {
      const chapters = [
        { title: '第一章', content: '内容很长'.repeat(100) + '就在这时，危险来临！' },
        { title: '第二章', content: '内容很长'.repeat(100) + '他到底是谁？' },
        { title: '第三章', content: '内容很长'.repeat(100) + '竟然是他！' }
      ];

      const result = analyzeWebNovelCapability(chapters);
      
      expect(result.hookEffectiveness).toBeGreaterThan(60);
    });
  });

  describe('Pattern validation', () => {
    it('should have golden-three-chapters pattern', () => {
      const pattern = WEB_NOVEL_PATTERNS.find(p => p.id === 'golden-three-chapters');
      
      expect(pattern).toBeDefined();
      expect(pattern?.category).toBe('opening');
      expect(pattern?.structure.length).toBe(3);
    });

    it('should have face-slap-cycle pattern', () => {
      const pattern = WEB_NOVEL_PATTERNS.find(p => p.id === 'face-slap-cycle');
      
      expect(pattern).toBeDefined();
      expect(pattern?.category).toBe('conflict');
      expect(pattern?.structure.length).toBe(4);
    });

    it('should have rhythm-wave pattern', () => {
      const pattern = WEB_NOVEL_PATTERNS.find(p => p.id === 'rhythm-wave');
      
      expect(pattern).toBeDefined();
      expect(pattern?.category).toBe('rhythm');
    });
  });
});
