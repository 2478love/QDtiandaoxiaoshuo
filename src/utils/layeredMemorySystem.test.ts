import { describe, it, expect, beforeEach } from 'vitest';
import {
  LayeredMemorySystem,
  extractMemoryFromChapter,
  type CharacterInfo,
  type WorldSetting,
  type PlotPoint,
  type RecentMemory,
} from './layeredMemorySystem';

describe('LayeredMemorySystem', () => {
  let system: LayeredMemorySystem;

  beforeEach(() => {
    system = new LayeredMemorySystem(10);
  });

  describe('Core Memory - Characters', () => {
    it('should add character to core memory', () => {
      const character: CharacterInfo = {
        name: '张三',
        role: 'protagonist',
        personality: ['勇敢', '正直', '聪明'],
        relationships: { '李四': '好友' },
        abilities: ['剑术', '内功'],
        background: '来自小村庄的少年',
        firstAppearance: 1,
        importance: 100,
      };

      system.addCharacter(character);
      const core = system.getCoreMemory();
      expect(core.characters).toHaveLength(1);
      expect(core.characters[0].name).toBe('张三');
    });

    it('should update existing character', () => {
      const character: CharacterInfo = {
        name: '张三',
        role: 'protagonist',
        personality: ['勇敢'],
        relationships: {},
        abilities: [],
        background: '测试',
        firstAppearance: 1,
        importance: 50,
      };

      system.addCharacter(character);
      
      const updated = { ...character, personality: ['勇敢', '聪明'] };
      system.addCharacter(updated);

      const core = system.getCoreMemory();
      expect(core.characters).toHaveLength(1);
      expect(core.characters[0].personality).toHaveLength(2);
    });
  });

  describe('Core Memory - World Settings', () => {
    it('should add world setting', () => {
      const setting: WorldSetting = {
        type: 'geography',
        name: '天元大陆',
        description: '修真世界的主大陆',
        relatedChapters: [1, 2, 3],
        importance: 90,
      };

      system.addWorldSetting(setting);
      const core = system.getCoreMemory();
      expect(core.worldSettings).toHaveLength(1);
      expect(core.worldSettings[0].name).toBe('天元大陆');
    });

    it('should update existing world setting', () => {
      const setting: WorldSetting = {
        type: 'geography',
        name: '天元大陆',
        description: '测试',
        relatedChapters: [1],
        importance: 50,
      };

      system.addWorldSetting(setting);
      
      const updated = { ...setting, description: '更新后的描述' };
      system.addWorldSetting(updated);

      const core = system.getCoreMemory();
      expect(core.worldSettings).toHaveLength(1);
      expect(core.worldSettings[0].description).toBe('更新后的描述');
    });
  });

  describe('Core Memory - Plot Points', () => {
    it('should add plot point', () => {
      const plot: PlotPoint = {
        chapterNumber: 1,
        type: 'setup',
        description: '主角离开家乡',
        relatedCharacters: ['张三'],
        importance: 80,
      };

      system.addPlotPoint(plot);
      const core = system.getCoreMemory();
      expect(core.mainPlot).toHaveLength(1);
      expect(core.mainPlot[0].description).toBe('主角离开家乡');
    });

    it('should sort plot points by chapter number', () => {
      system.addPlotPoint({
        chapterNumber: 3,
        type: 'climax',
        description: '高潮',
        relatedCharacters: [],
        importance: 90,
      });

      system.addPlotPoint({
        chapterNumber: 1,
        type: 'setup',
        description: '开始',
        relatedCharacters: [],
        importance: 70,
      });

      const core = system.getCoreMemory();
      expect(core.mainPlot[0].chapterNumber).toBe(1);
      expect(core.mainPlot[1].chapterNumber).toBe(3);
    });
  });

  describe('Core Memory - Power System', () => {
    it('should set power system', () => {
      const powerSystem = {
        levels: ['炼气', '筑基', '金丹', '元婴'],
        rules: ['需要灵根', '需要功法'],
        limitations: ['天赋限制', '资源限制'],
      };

      system.setPowerSystem(powerSystem);
      const core = system.getCoreMemory();
      expect(core.powerSystem.levels).toHaveLength(4);
      expect(core.powerSystem.levels[0]).toBe('炼气');
    });
  });

  describe('Recent Memory', () => {
    it('should add recent memory', () => {
      const memory: RecentMemory = {
        chapterNumber: 1,
        summary: '第一章摘要',
        keyEvents: ['事件1', '事件2'],
        characters: ['张三', '李四'],
        locations: ['村庄'],
        timestamp: Date.now(),
      };

      system.addRecentMemory(memory);
      const recent = system.getRecentMemory();
      expect(recent).toHaveLength(1);
      expect(recent[0].chapterNumber).toBe(1);
    });

    it('should maintain max recent chapters', () => {
      const smallSystem = new LayeredMemorySystem(3);

      for (let i = 1; i <= 5; i++) {
        smallSystem.addRecentMemory({
          chapterNumber: i,
          summary: `第${i}章`,
          keyEvents: [],
          characters: [],
          locations: [],
          timestamp: Date.now(),
        });
      }

      const recent = smallSystem.getRecentMemory();
      expect(recent).toHaveLength(3);
      expect(recent[0].chapterNumber).toBe(5); // 最新的
      expect(recent[2].chapterNumber).toBe(3);
    });

    it('should archive old memories to long term', () => {
      const smallSystem = new LayeredMemorySystem(2);

      for (let i = 1; i <= 3; i++) {
        smallSystem.addRecentMemory({
          chapterNumber: i,
          summary: `第${i}章`,
          keyEvents: ['事件'],
          characters: ['角色'],
          locations: [],
          timestamp: Date.now(),
        });
      }

      const longTerm = smallSystem.getLongTermMemory();
      expect(longTerm).toHaveLength(1);
      expect(longTerm[0].chapterNumber).toBe(1);
    });

    it('should update existing recent memory', () => {
      const memory: RecentMemory = {
        chapterNumber: 1,
        summary: '原始摘要',
        keyEvents: [],
        characters: [],
        locations: [],
        timestamp: Date.now(),
      };

      system.addRecentMemory(memory);
      
      const updated = { ...memory, summary: '更新后的摘要' };
      system.addRecentMemory(updated);

      const recent = system.getRecentMemory();
      expect(recent).toHaveLength(1);
      expect(recent[0].summary).toBe('更新后的摘要');
    });
  });

  describe('Memory Search', () => {
    beforeEach(() => {
      // 添加测试数据
      system.addCharacter({
        name: '张三',
        role: 'protagonist',
        personality: ['勇敢', '正直'],
        relationships: {},
        abilities: ['剑术'],
        background: '来自小村庄',
        firstAppearance: 1,
        importance: 100,
      });

      system.addWorldSetting({
        type: 'geography',
        name: '天元大陆',
        description: '修真世界的主大陆',
        relatedChapters: [1],
        importance: 90,
      });

      system.addRecentMemory({
        chapterNumber: 1,
        summary: '张三在天元大陆开始修炼',
        keyEvents: ['开始修炼', '遇到师父'],
        characters: ['张三'],
        locations: ['天元大陆'],
        timestamp: Date.now(),
      });
    });

    it('should search for character', () => {
      const results = system.search({ query: '张三' });
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].content).toContain('张三');
    });

    it('should search for world setting', () => {
      const results = system.search({ query: '天元大陆' });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.content.includes('天元大陆'))).toBe(true);
    });

    it('should prioritize recent memory', () => {
      const results = system.search({ query: '修炼' });
      const recentResult = results.find(r => r.type === 'recent');
      expect(recentResult).toBeDefined();
    });

    it('should limit search results', () => {
      const results = system.search({ query: '张三', limit: 1 });
      expect(results).toHaveLength(1);
    });

    it('should filter by minimum relevance', () => {
      const results = system.search({ query: '不存在的内容', minRelevance: 0.5 });
      expect(results).toHaveLength(0);
    });

    it('should search by type', () => {
      const results = system.search({ query: '张三', type: 'character' });
      // 搜索角色类型时，只返回核心记忆中的角色
      expect(results.length).toBeGreaterThan(0);
      // 所有结果都应该是核心记忆类型
      expect(results.every(r => r.type === 'core')).toBe(true);
    });
  });

  describe('Relationship Graph', () => {
    it('should generate relationship graph', () => {
      system.addCharacter({
        name: '张三',
        role: 'protagonist',
        personality: [],
        relationships: { '李四': '好友', '王五': '师父' },
        abilities: [],
        background: '',
        firstAppearance: 1,
        importance: 100,
      });

      system.addCharacter({
        name: '李四',
        role: 'supporting',
        personality: [],
        relationships: { '张三': '好友' },
        abilities: [],
        background: '',
        firstAppearance: 1,
        importance: 80,
      });

      const graph = system.generateRelationshipGraph();
      expect(graph['张三']).toEqual(['李四', '王五']);
      expect(graph['李四']).toEqual(['张三']);
    });
  });

  describe('Smart Summary', () => {
    it('should generate smart summary', () => {
      system.addCharacter({
        name: '张三',
        role: 'protagonist',
        personality: ['勇敢', '正直', '聪明'],
        relationships: {},
        abilities: [],
        background: '',
        firstAppearance: 1,
        importance: 100,
      });

      system.addWorldSetting({
        type: 'geography',
        name: '天元大陆',
        description: '修真世界的主大陆',
        relatedChapters: [1],
        importance: 90,
      });

      system.addRecentMemory({
        chapterNumber: 1,
        summary: '第一章摘要',
        keyEvents: ['事件1'],
        characters: [],
        locations: [],
        timestamp: Date.now(),
      });

      const summary = system.generateSmartSummary();
      expect(summary).toContain('核心记忆');
      expect(summary).toContain('张三');
      expect(summary).toContain('天元大陆');
      expect(summary).toContain('近期剧情');
    });
  });

  describe('Export and Import', () => {
    it('should export memory data', () => {
      system.addCharacter({
        name: '张三',
        role: 'protagonist',
        personality: [],
        relationships: {},
        abilities: [],
        background: '',
        firstAppearance: 1,
        importance: 100,
      });

      const exported = system.export();
      expect(exported).toContain('张三');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should import memory data', () => {
      const data = {
        core: {
          characters: [{
            name: '李四',
            role: 'supporting' as const,
            personality: [],
            relationships: {},
            abilities: [],
            background: '',
            firstAppearance: 1,
            importance: 80,
          }],
          worldSettings: [],
          mainPlot: [],
          powerSystem: { levels: [], rules: [], limitations: [] },
          lastUpdated: Date.now(),
        },
        recent: [],
        longterm: [],
      };

      system.import(JSON.stringify(data));
      const core = system.getCoreMemory();
      expect(core.characters).toHaveLength(1);
      expect(core.characters[0].name).toBe('李四');
    });

    it('should throw error on invalid import data', () => {
      expect(() => system.import('invalid json')).toThrow();
    });
  });

  describe('Clear and Stats', () => {
    it('should clear all memory', () => {
      system.addCharacter({
        name: '张三',
        role: 'protagonist',
        personality: [],
        relationships: {},
        abilities: [],
        background: '',
        firstAppearance: 1,
        importance: 100,
      });

      system.clear();
      const stats = system.getStats();
      expect(stats.totalCharacters).toBe(0);
      expect(stats.recentChapters).toBe(0);
      expect(stats.longTermChapters).toBe(0);
    });

    it('should get statistics', () => {
      system.addCharacter({
        name: '张三',
        role: 'protagonist',
        personality: [],
        relationships: {},
        abilities: [],
        background: '',
        firstAppearance: 1,
        importance: 100,
      });

      system.addRecentMemory({
        chapterNumber: 1,
        summary: '测试',
        keyEvents: [],
        characters: [],
        locations: [],
        timestamp: Date.now(),
      });

      const stats = system.getStats();
      expect(stats.totalCharacters).toBe(1);
      expect(stats.recentChapters).toBe(1);
      expect(stats.totalMemorySize).toBe(1);
    });
  });
});

describe('extractMemoryFromChapter', () => {
  it('should extract basic information', () => {
    const text = `
      张三来到了天元城。
      "这里就是天元城吗？"张三问道。
      李四笑着说："没错，欢迎来到天元城。"
      张三开始修炼，很快就突破了。
    `;

    const memory = extractMemoryFromChapter(1, text);
    expect(memory.chapterNumber).toBe(1);
    expect(memory.summary).toBeTruthy();
    expect(memory.characters.length).toBeGreaterThan(0);
  });

  it('should extract characters from dialogue', () => {
    const text = `
      "你好！"张三说道。
      "你也好！"李四回答。
    `;

    const memory = extractMemoryFromChapter(1, text);
    expect(memory.characters).toContain('张三');
    expect(memory.characters).toContain('李四');
  });

  it('should extract locations', () => {
    const text = `
      张三来到天元城。
      他进入了修炼殿。
      然后去了藏书阁。
    `;

    const memory = extractMemoryFromChapter(1, text);
    expect(memory.locations.length).toBeGreaterThan(0);
  });

  it('should extract key events', () => {
    const text = `
      张三开始修炼。
      他突破了境界。
      然后击败了敌人。
      获得了宝物。
    `;

    const memory = extractMemoryFromChapter(1, text);
    expect(memory.keyEvents.length).toBeGreaterThan(0);
  });

  it('should handle empty text', () => {
    const memory = extractMemoryFromChapter(1, '');
    expect(memory.chapterNumber).toBe(1);
    expect(memory.characters).toHaveLength(0);
    expect(memory.locations).toHaveLength(0);
    expect(memory.keyEvents).toHaveLength(0);
  });

  it('should limit key events to 5', () => {
    const text = `
      张三战斗。
      李四修炼。
      王五突破。
      赵六发现。
      钱七遇到。
      孙八击败。
      周九获得。
    `;

    const memory = extractMemoryFromChapter(1, text);
    expect(memory.keyEvents.length).toBeLessThanOrEqual(5);
  });
});
