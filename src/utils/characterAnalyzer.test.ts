/**
 * 人物塑造评估器测试
 */

import { describe, it, expect } from 'vitest';
import {
  extractCharacters,
  checkConsistency,
  analyzeDialogueStyle,
  analyzeMotivation,
  analyzeGrowth,
  analyzeCharacters,
  generateCharacterReport,
  generateCharacterPrompt,
  type CharacterProfile,
} from './characterAnalyzer';

describe('characterAnalyzer', () => {
  const sampleText = `
    李明说："你好，我是李明。"
    王芳笑道："很高兴认识你。"
    李明走向前，伸出手。
    王芳看了看他，也伸出手。
    李明说："我们可以成为朋友吗？"
    王芳说："当然可以。"
    李明笑了。
  `;

  describe('extractCharacters', () => {
    it('应该提取文本中的人物', () => {
      const profiles = extractCharacters(sampleText);
      expect(profiles.length).toBeGreaterThan(0);
      
      const names = profiles.map(p => p.name);
      expect(names).toContain('李明');
      expect(names).toContain('王芳');
    });

    it('应该提取人物对话', () => {
      const profiles = extractCharacters(sampleText);
      const liMing = profiles.find(p => p.name === '李明');
      
      expect(liMing).toBeDefined();
      expect(liMing!.dialogues.length).toBeGreaterThan(0);
      expect(liMing!.dialogues[0].content).toContain('你好');
    });

    it('应该提取人物动作', () => {
      const profiles = extractCharacters(sampleText);
      const liMing = profiles.find(p => p.name === '李明');
      
      expect(liMing).toBeDefined();
      expect(liMing!.actions.length).toBeGreaterThan(0);
    });

    it('应该处理空文本', () => {
      const profiles = extractCharacters('');
      expect(profiles).toEqual([]);
    });
  });

  describe('checkConsistency', () => {
    it('应该检查对话风格一致性', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '你好' },
          { position: 1, speaker: '测试角色', content: '很高兴认识你' },
          { position: 2, speaker: '测试角色', content: '这是一段非常非常非常非常长的对话内容，与前面的风格完全不同' },
        ],
        actions: [],
        traits: [],
        relationships: {},
      };

      const issues = checkConsistency(profile);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('应该检查行为模式一致性', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [],
        actions: [
          { position: 0, actor: '测试角色', action: '说话' },
          { position: 1, actor: '测试角色', action: '说道' },
          { position: 2, actor: '测试角色', action: '打人' },
        ],
        traits: [],
        relationships: {},
      };

      const issues = checkConsistency(profile);
      expect(Array.isArray(issues)).toBe(true);
    });

    it('应该处理对话不足的情况', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '你好' },
        ],
        actions: [],
        traits: [],
        relationships: {},
      };

      const issues = checkConsistency(profile);
      expect(issues).toEqual([]);
    });
  });

  describe('analyzeDialogueStyle', () => {
    it('应该分析对话风格', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '你好啊朋友' },
          { position: 1, speaker: '测试角色', content: '很高兴认识你朋友' },
          { position: 2, speaker: '测试角色', content: '我们做朋友吧' },
        ],
        actions: [],
        traits: [],
        relationships: {},
      };

      const style = analyzeDialogueStyle(profile);
      
      expect(style.character).toBe('测试角色');
      expect(style.sentenceLength).toBeGreaterThan(0);
      expect(style.formalityLevel).toBeGreaterThanOrEqual(0);
      expect(style.formalityLevel).toBeLessThanOrEqual(100);
      expect(style.uniqueness).toBeGreaterThanOrEqual(0);
      expect(style.uniqueness).toBeLessThanOrEqual(100);
      expect(['positive', 'negative', 'neutral']).toContain(style.emotionalTone);
    });

    it('应该识别口头禅', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '你知道吗，这很重要' },
          { position: 1, speaker: '测试角色', content: '你知道吗，我很开心' },
          { position: 2, speaker: '测试角色', content: '你知道吗，我们成功了' },
        ],
        actions: [],
        traits: [],
        relationships: {},
      };

      const style = analyzeDialogueStyle(profile);
      expect(style.catchphrases.length).toBeGreaterThan(0);
    });

    it('应该处理无对话的情况', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [],
        actions: [],
        traits: [],
        relationships: {},
      };

      const style = analyzeDialogueStyle(profile);
      
      expect(style.character).toBe('测试角色');
      expect(style.sentenceLength).toBe(0);
      expect(style.vocabulary).toEqual([]);
      expect(style.catchphrases).toEqual([]);
    });
  });

  describe('analyzeMotivation', () => {
    it('应该分析动机-行为链', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [],
        actions: [
          { position: 0, actor: '测试角色', action: '攻击敌人' },
          { position: 1, actor: '测试角色', action: '打倒对手' },
        ],
        traits: [],
        relationships: {},
      };

      const chains = analyzeMotivation(profile, '');
      
      expect(chains.length).toBeGreaterThan(0);
      expect(chains[0].character).toBe('测试角色');
      expect(chains[0].motivation).toBeDefined();
      expect(chains[0].consistency).toBeGreaterThanOrEqual(0);
      expect(chains[0].consistency).toBeLessThanOrEqual(100);
    });

    it('应该识别不同的动机类型', () => {
      const profiles = [
        {
          name: '战士',
          actions: [
            { position: 0, actor: '战士', action: '攻击' },
            { position: 1, actor: '战士', action: '打击' },
          ],
        },
        {
          name: '逃兵',
          actions: [
            { position: 0, actor: '逃兵', action: '逃跑' },
            { position: 1, actor: '逃兵', action: '退却' },
          ],
        },
      ];

      profiles.forEach(p => {
        const profile: CharacterProfile = {
          ...p,
          appearances: [],
          dialogues: [],
          traits: [],
          relationships: {},
        };
        const chains = analyzeMotivation(profile, '');
        expect(chains.length).toBeGreaterThan(0);
        expect(chains[0].motivation).toBeDefined();
      });
    });

    it('应该处理动作不足的情况', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [],
        actions: [
          { position: 0, actor: '测试角色', action: '说话' },
        ],
        traits: [],
        relationships: {},
      };

      const chains = analyzeMotivation(profile, '');
      expect(chains).toEqual([]);
    });
  });

  describe('analyzeGrowth', () => {
    it('应该分析人物成长曲线', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '我很弱小' },
          { position: 50, speaker: '测试角色', content: '我在成长' },
          { position: 100, speaker: '测试角色', content: '我变强了' },
        ],
        actions: [],
        traits: [],
        relationships: {},
      };

      const growth = analyzeGrowth(profile, '');
      
      expect(growth.character).toBe('测试角色');
      expect(growth.stages.length).toBeGreaterThan(0);
      expect(['positive', 'negative', 'complex', 'static']).toContain(growth.trajectory);
      expect(growth.believability).toBeGreaterThanOrEqual(0);
      expect(growth.believability).toBeLessThanOrEqual(100);
      expect(growth.pacing).toBeGreaterThanOrEqual(0);
      expect(growth.pacing).toBeLessThanOrEqual(100);
    });

    it('应该识别成长阶段', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '初期' },
          { position: 50, speaker: '测试角色', content: '中期' },
          { position: 100, speaker: '测试角色', content: '后期' },
        ],
        actions: [
          { position: 10, actor: '测试角色', action: '学习' },
          { position: 60, actor: '测试角色', action: '实践' },
          { position: 110, actor: '测试角色', action: '精通' },
        ],
        traits: [],
        relationships: {},
      };

      const growth = analyzeGrowth(profile, '');
      expect(growth.stages.length).toBeGreaterThanOrEqual(3);
    });

    it('应该处理出场不足的情况', () => {
      const profile: CharacterProfile = {
        name: '测试角色',
        appearances: [],
        dialogues: [
          { position: 0, speaker: '测试角色', content: '你好' },
        ],
        actions: [],
        traits: [],
        relationships: {},
      };

      const growth = analyzeGrowth(profile, '');
      expect(growth.trajectory).toBe('static');
    });
  });

  describe('analyzeCharacters', () => {
    it('应该综合分析所有人物', () => {
      const analysis = analyzeCharacters(sampleText);
      
      expect(analysis.profiles.length).toBeGreaterThan(0);
      expect(Array.isArray(analysis.consistencyIssues)).toBe(true);
      expect(Array.isArray(analysis.dialogueStyles)).toBe(true);
      expect(Array.isArray(analysis.motivationChains)).toBe(true);
      expect(Array.isArray(analysis.growthCurves)).toBe(true);
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.overallScore).toBeLessThanOrEqual(100);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    it('应该只分析主要角色', () => {
      const text = `
        主角说："我是主角。"
        主角走了过去。
        主角笑了。
        路人甲说："你好。"
      `;
      
      const analysis = analyzeCharacters(text);
      
      // 路人甲出场次数少，可能不会被详细分析
      expect(analysis.profiles.length).toBeGreaterThan(0);
    });

    it('应该处理空文本', () => {
      const analysis = analyzeCharacters('');
      
      expect(analysis.profiles).toEqual([]);
      expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('generateCharacterReport', () => {
    it('应该生成完整的分析报告', () => {
      const analysis = analyzeCharacters(sampleText);
      const report = generateCharacterReport(analysis);
      
      expect(report).toContain('人物塑造分析报告');
      expect(report).toContain('综合评分');
      expect(report).toContain('性格一致性检查');
      expect(report).toContain('对话风格分析');
      expect(report).toContain('行为动机分析');
      expect(report).toContain('人物成长曲线');
      expect(report).toContain('改进建议');
    });

    it('应该包含评分信息', () => {
      const analysis = analyzeCharacters(sampleText);
      const report = generateCharacterReport(analysis);
      
      expect(report).toMatch(/\d+\/100/);
    });
  });

  describe('generateCharacterPrompt', () => {
    it('应该生成优化提示词', () => {
      const analysis = analyzeCharacters(sampleText);
      const prompt = generateCharacterPrompt(analysis);
      
      expect(prompt).toBeDefined();
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('应该包含具体问题', () => {
      const analysis = analyzeCharacters(`
        张三说："你好。"
        张三说："你好。"
        张三说："你好。"
        李四说："你好。"
        李四说："你好。"
        李四说："你好。"
      `);
      
      const prompt = generateCharacterPrompt(analysis);
      expect(typeof prompt).toBe('string');
    });

    it('应该处理无问题的情况', () => {
      const analysis = analyzeCharacters(sampleText);
      // 手动设置为无问题状态
      analysis.consistencyIssues = [];
      analysis.dialogueStyles = analysis.dialogueStyles.map(s => ({ ...s, uniqueness: 80 }));
      analysis.motivationChains = analysis.motivationChains.map(m => ({ ...m, consistency: 80 }));
      
      const prompt = generateCharacterPrompt(analysis);
      expect(prompt).toContain('良好');
    });
  });
});
