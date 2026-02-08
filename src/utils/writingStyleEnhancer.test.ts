import { describe, it, expect } from 'vitest';
import {
  analyzeSenseUsage,
  analyzeDialogueQuality,
  analyzeActionQuality,
  analyzeSceneQuality,
  analyzeWritingStyle,
  generateEnhancementPrompt,
  generateStyleReport,
} from './writingStyleEnhancer';

describe('writingStyleEnhancer', () => {
  describe('analyzeSenseUsage', () => {
    it('应该检测视觉描写', () => {
      const text = '他看到一片红色的天空，光芒耀眼。';
      const usage = analyzeSenseUsage(text);
      expect(usage.visual).toBeGreaterThan(0);
    });

    it('应该检测听觉描写', () => {
      const text = '他听到远处传来轰隆的声音，震耳欲聋。';
      const usage = analyzeSenseUsage(text);
      expect(usage.auditory).toBeGreaterThan(0);
    });

    it('应该检测嗅觉描写', () => {
      const text = '空气中弥漫着淡淡的香气，清新宜人。';
      const usage = analyzeSenseUsage(text);
      expect(usage.olfactory).toBeGreaterThan(0);
    });

    it('应该检测味觉描写', () => {
      const text = '他尝到了甜中带苦的滋味。';
      const usage = analyzeSenseUsage(text);
      expect(usage.gustatory).toBeGreaterThan(0);
    });

    it('应该检测触觉描写', () => {
      const text = '冰冷的触感让他打了个寒颤，皮肤感到刺痛。';
      const usage = analyzeSenseUsage(text);
      expect(usage.tactile).toBeGreaterThan(0);
    });

    it('应该统计多种感官', () => {
      const text = '他看到红色的火焰，听到噼啪的声音，闻到烟熏的气味，感到灼热的温度。';
      const usage = analyzeSenseUsage(text);
      expect(usage.visual).toBeGreaterThan(0);
      expect(usage.auditory).toBeGreaterThan(0);
      expect(usage.olfactory).toBeGreaterThan(0);
      expect(usage.tactile).toBeGreaterThan(0);
    });
  });

  describe('analyzeDialogueQuality', () => {
    it('应该检测水对话', () => {
      const text = '"你好。""再见。""是的。"';
      const result = analyzeDialogueQuality(text);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
      expect(result.issues[0].type).toBe('dialogue');
    });

    it('应该检测说明书对话', () => {
      const text = '"让我来解释一下这个原理，首先我们需要了解基础概念，其次要掌握核心要点，然后进行实践应用，最后总结经验教训。"';
      const result = analyzeDialogueQuality(text);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.some(i => i.severity === 'major')).toBe(true);
    });

    it('应该对高质量对话给高分', () => {
      const text = '"你知道那个秘密吗？""我不会告诉你的。""那我只能自己去找了。"';
      const result = analyzeDialogueQuality(text);
      expect(result.score).toBeGreaterThan(70);
    });

    it('应该处理无对话的文本', () => {
      const text = '这是一段没有对话的描写文字。';
      const result = analyzeDialogueQuality(text);
      expect(result.score).toBe(100);
      expect(result.issues.length).toBe(0);
    });
  });

  describe('analyzeActionQuality', () => {
    it('应该检测平铺直叙的动作', () => {
      const text = '他走了过去。他打了一拳。他跑了起来。';
      const result = analyzeActionQuality(text);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('应该检测节奏单调', () => {
      const text = '他走过去，他坐下来，他拿起杯子，他喝了一口。';
      const result = analyzeActionQuality(text);
      expect(result.issues.some(i => i.problem.includes('节奏'))).toBe(true);
    });

    it('应该对生动的动作描写给高分', () => {
      const text = '他脚下一蹬，身形如箭般射出。拳风呼啸，带起阵阵劲风。';
      const result = analyzeActionQuality(text);
      expect(result.score).toBeGreaterThan(80);
    });
  });

  describe('analyzeSceneQuality', () => {
    it('应该检测笼统的场景描写', () => {
      const text = '这是一个美丽的地方。环境很好。';
      const result = analyzeSceneQuality(text);
      expect(result.score).toBeLessThan(100);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('应该对具体的场景描写给高分', () => {
      const text = '青石板路蜿蜒向前，两旁古树参天，阳光透过枝叶洒下斑驳光影。';
      const result = analyzeSceneQuality(text);
      expect(result.score).toBeGreaterThan(80);
    });
  });

  describe('analyzeWritingStyle', () => {
    it('应该综合分析写作风格', () => {
      const text = `
        "你好。"他说。
        他走了过去。
        这是一个美丽的地方。
      `;
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
      expect(analysis).toHaveProperty('dialogueQuality');
      expect(analysis).toHaveProperty('actionQuality');
      expect(analysis).toHaveProperty('sceneQuality');
      expect(analysis).toHaveProperty('senseUsage');
      expect(analysis).toHaveProperty('strengths');
      expect(analysis).toHaveProperty('improvements');
    });

    it('应该识别优势', () => {
      const text = `
        "你知道那个秘密吗？"他眼神锐利地盯着对方。
        他脚下一蹬，身形如箭般射出，拳风呼啸。
        青石板路蜿蜒向前，两旁古树参天，阳光透过枝叶洒下斑驳光影。
        空气中弥漫着淡淡的花香，他听到远处传来鸟鸣声。
      `;
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.score).toBeGreaterThan(70);
      expect(analysis.strengths.length).toBeGreaterThan(0);
    });

    it('应该提供改进建议', () => {
      const text = `
        "你好。""再见。"
        他走了。
        这是一个美丽的地方。
      `;
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.improvements.length).toBeGreaterThan(0);
    });

    it('应该检测五感使用情况', () => {
      const text = '他看到红色的火焰，听到噼啪的声音，闻到烟熏的气味。';
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.senseUsage.visual).toBeGreaterThan(0);
      expect(analysis.senseUsage.auditory).toBeGreaterThan(0);
      expect(analysis.senseUsage.olfactory).toBeGreaterThan(0);
    });
  });

  describe('generateEnhancementPrompt', () => {
    it('应该生成基础增强提示词', () => {
      const text = '测试文本';
      const analysis = analyzeWritingStyle(text);
      const prompt = generateEnhancementPrompt(text, analysis);
      
      expect(prompt).toContain('优化');
      expect(prompt).toContain('测试文本');
    });

    it('应该根据对话质量生成针对性建议', () => {
      const text = '"你好。""再见。"';
      const analysis = analyzeWritingStyle(text);
      const prompt = generateEnhancementPrompt(text, analysis);
      
      expect(prompt).toContain('对话');
    });

    it('应该根据动作质量生成针对性建议', () => {
      const text = '他走了。他跑了。他跳了。他打了。他踢了。';
      const analysis = analyzeWritingStyle(text);
      const prompt = generateEnhancementPrompt(text, analysis);
      
      expect(prompt).toContain('动作');
    });

    it('应该支持自定义焦点区域', () => {
      const text = '测试文本';
      const analysis = analyzeWritingStyle(text);
      const prompt = generateEnhancementPrompt(text, analysis, {
        focusAreas: ['dialogue', 'sense'],
      });
      
      expect(prompt).toContain('对话');
      expect(prompt).toContain('五感');
    });

    it('应该支持目标风格设置', () => {
      const text = '测试文本';
      const analysis = analyzeWritingStyle(text);
      const prompt = generateEnhancementPrompt(text, analysis, {
        targetStyle: 'cinematic',
      });
      
      expect(prompt).toContain('电影');
    });

    it('应该支持五感强调', () => {
      const text = '测试文本';
      const analysis = analyzeWritingStyle(text);
      const prompt = generateEnhancementPrompt(text, analysis, {
        senseEmphasis: ['auditory', 'olfactory'],
      });
      
      expect(prompt).toContain('听觉');
      expect(prompt).toContain('嗅觉');
    });
  });

  describe('generateStyleReport', () => {
    it('应该生成完整的风格报告', () => {
      const text = `
        "你好。"他说。
        他走了过去。
        这是一个美丽的地方。
      `;
      const analysis = analyzeWritingStyle(text);
      const report = generateStyleReport(analysis);
      
      expect(report).toContain('写作风格分析报告');
      expect(report).toContain('综合评分');
      expect(report).toContain('分项评分');
      expect(report).toContain('五感使用情况');
    });

    it('应该包含优势和改进建议', () => {
      const text = '测试文本';
      const analysis = analyzeWritingStyle(text);
      const report = generateStyleReport(analysis);
      
      if (analysis.strengths.length > 0) {
        expect(report).toContain('优势');
      }
      if (analysis.improvements.length > 0) {
        expect(report).toContain('改进建议');
      }
    });

    it('应该列出具体问题', () => {
      const text = '"你好。""再见。"他走了。这是一个美丽的地方。';
      const analysis = analyzeWritingStyle(text);
      const report = generateStyleReport(analysis);
      
      if (analysis.issues.length > 0) {
        expect(report).toContain('具体问题');
      }
    });

    it('应该按严重程度分类问题', () => {
      const text = '"让我来解释一下这个原理，首先我们需要了解基础概念，其次要掌握核心要点。"';
      const analysis = analyzeWritingStyle(text);
      const report = generateStyleReport(analysis);
      
      const hasMajorIssues = analysis.issues.some(i => i.severity === 'major');
      if (hasMajorIssues) {
        expect(report).toContain('主要问题');
      }
    });
  });

  describe('边界情况', () => {
    it('应该处理空文本', () => {
      const text = '';
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });

    it('应该处理纯对话文本', () => {
      const text = '"你好。""你好。""再见。""再见。"';
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.dialogueQuality).toBeDefined();
    });

    it('应该处理纯描写文本', () => {
      const text = '青山绿水，鸟语花香。阳光明媚，微风拂面。';
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.sceneQuality).toBeDefined();
    });

    it('应该处理超长文本', () => {
      const text = '测试文本。'.repeat(1000);
      const analysis = analyzeWritingStyle(text);
      
      expect(analysis.score).toBeGreaterThanOrEqual(0);
      expect(analysis.score).toBeLessThanOrEqual(100);
    });
  });
});
