import { describe, it, expect } from 'vitest';
import {
  generateBatchOutline,
  adjustOutline,
  optimizeOutline,
  exportOutlineAsText,
  exportOutlineAsJSON,
  type OutlineGenerationOptions,
} from './batchOutlineGenerator';

describe('BatchOutlineGenerator', () => {
  const basicOptions: OutlineGenerationOptions = {
    theme: '修真逆袭',
    targetWordCount: 100000,
    genre: '玄幻',
    mainCharacter: '林凡',
    setting: '修真世界',
  };

  describe('generateBatchOutline', () => {
    it('should generate outline with correct structure', () => {
      const outline = generateBatchOutline(basicOptions);
      
      expect(outline.totalChapters).toBeGreaterThan(0);
      expect(outline.totalWordCount).toBe(basicOptions.targetWordCount);
      expect(outline.arcs).toBeDefined();
      expect(outline.chapters).toBeDefined();
      expect(outline.pacingCurve).toBeDefined();
      expect(outline.coolPointDistribution).toBeDefined();
      expect(outline.metadata).toBeDefined();
    });

    it('should calculate chapter count based on target word count', () => {
      const outline = generateBatchOutline(basicOptions);
      const avgWords = outline.totalWordCount / outline.totalChapters;
      
      expect(avgWords).toBeGreaterThan(1500);
      expect(avgWords).toBeLessThan(3500);
    });

    it('should generate arcs', () => {
      const outline = generateBatchOutline(basicOptions);
      
      expect(outline.arcs.length).toBeGreaterThan(0);
      outline.arcs.forEach(arc => {
        expect(arc.arcNumber).toBeGreaterThan(0);
        expect(arc.name).toBeTruthy();
        expect(arc.startChapter).toBeGreaterThan(0);
        expect(arc.endChapter).toBeGreaterThanOrEqual(arc.startChapter);
        expect(arc.description).toBeTruthy();
        expect(arc.goal).toBeTruthy();
        expect(arc.conflict).toBeTruthy();
        expect(arc.resolution).toBeTruthy();
      });
    });

    it('should generate chapters', () => {
      const outline = generateBatchOutline(basicOptions);
      
      expect(outline.chapters.length).toBe(outline.totalChapters);
      outline.chapters.forEach((ch, index) => {
        expect(ch.chapterNumber).toBe(index + 1);
        expect(ch.title).toBeTruthy();
        expect(ch.summary).toBeTruthy();
        expect(ch.wordCount).toBeGreaterThan(0);
        expect(ch.keyEvents).toBeDefined();
        expect(ch.characters).toBeDefined();
        expect(ch.locations).toBeDefined();
        expect(ch.plotType).toBeDefined();
        expect(ch.pacing).toBeDefined();
        expect(ch.coolPoints).toBeDefined();
        expect(ch.hooks).toBeDefined();
        expect(ch.emotionalTone).toBeTruthy();
        expect(ch.importance).toBeGreaterThan(0);
        expect(ch.importance).toBeLessThanOrEqual(10);
      });
    });

    it('should respect custom chapter count', () => {
      const customOptions = {
        ...basicOptions,
        chapterCount: 30,
      };
      
      const outline = generateBatchOutline(customOptions);
      expect(outline.totalChapters).toBe(30);
      expect(outline.chapters.length).toBe(30);
    });

    it('should apply fast pacing style', () => {
      const fastOptions = {
        ...basicOptions,
        style: 'fast' as const,
      };
      
      const outline = generateBatchOutline(fastOptions);
      const avgWordCount = outline.chapters.reduce((sum, ch) => sum + ch.wordCount, 0) / outline.chapters.length;
      
      expect(avgWordCount).toBeLessThanOrEqual(2000);
    });

    it('should apply slow pacing style', () => {
      const slowOptions = {
        ...basicOptions,
        style: 'slow' as const,
      };
      
      const outline = generateBatchOutline(slowOptions);
      const avgWordCount = outline.chapters.reduce((sum, ch) => sum + ch.wordCount, 0) / outline.chapters.length;
      
      expect(avgWordCount).toBeGreaterThanOrEqual(3000);
    });

    it('should apply high cool point density', () => {
      const highDensityOptions = {
        ...basicOptions,
        coolPointDensity: 'high' as const,
      };
      
      const outline = generateBatchOutline(highDensityOptions);
      const totalCoolPoints = outline.chapters.reduce((sum, ch) => sum + ch.coolPoints.length, 0);
      
      expect(totalCoolPoints).toBeGreaterThan(outline.totalChapters * 0.5);
    });

    it('should apply low cool point density', () => {
      const lowDensityOptions = {
        ...basicOptions,
        coolPointDensity: 'low' as const,
      };
      
      const outline = generateBatchOutline(lowDensityOptions);
      const totalCoolPoints = outline.chapters.reduce((sum, ch) => sum + ch.coolPoints.length, 0);
      
      expect(totalCoolPoints).toBeLessThan(outline.totalChapters * 0.5);
    });

    it('should include metadata', () => {
      const outline = generateBatchOutline(basicOptions);
      
      expect(outline.metadata.theme).toBe(basicOptions.theme);
      expect(outline.metadata.genre).toBe(basicOptions.genre);
      expect(outline.metadata.generatedAt).toBeGreaterThan(0);
    });
  });

  describe('Pacing Curve', () => {
    it('should generate pacing curve', () => {
      const outline = generateBatchOutline(basicOptions);
      
      expect(outline.pacingCurve.length).toBe(outline.totalChapters);
      outline.pacingCurve.forEach(pace => {
        expect(pace).toBeGreaterThanOrEqual(1);
        expect(pace).toBeLessThanOrEqual(10);
      });
    });

    it('should reflect chapter pacing', () => {
      const outline = generateBatchOutline(basicOptions);
      
      outline.chapters.forEach((ch, index) => {
        const expectedPace = ch.pacing === 'slow' ? 3 : ch.pacing === 'fast' ? 8 : 5;
        expect(outline.pacingCurve[index]).toBe(expectedPace);
      });
    });
  });

  describe('Cool Point Distribution', () => {
    it('should generate cool point distribution', () => {
      const outline = generateBatchOutline(basicOptions);
      
      expect(outline.coolPointDistribution.length).toBe(outline.totalChapters);
      outline.coolPointDistribution.forEach(count => {
        expect(count).toBeGreaterThanOrEqual(0);
      });
    });

    it('should reflect chapter cool points', () => {
      const outline = generateBatchOutline(basicOptions);
      
      outline.chapters.forEach((ch, index) => {
        expect(outline.coolPointDistribution[index]).toBe(ch.coolPoints.length);
      });
    });
  });

  describe('adjustOutline', () => {
    it('should adjust specific chapter', () => {
      const outline = generateBatchOutline(basicOptions);
      const adjustments = {
        title: '新标题',
        summary: '新摘要',
      };
      
      const adjusted = adjustOutline(outline, adjustments, 1);
      
      expect(adjusted.chapters[0].title).toBe('新标题');
      expect(adjusted.chapters[0].summary).toBe('新摘要');
      expect(adjusted.chapters[1].title).toBe(outline.chapters[1].title); // 其他章节不变
    });

    it('should recalculate curves after adjustment', () => {
      const outline = generateBatchOutline(basicOptions);
      const adjustments = {
        pacing: 'fast' as const,
        coolPoints: [
          { type: 'power' as const, description: '新爽点', intensity: 10 },
        ],
      };
      
      const adjusted = adjustOutline(outline, adjustments, 1);
      
      expect(adjusted.pacingCurve[0]).toBe(8); // fast = 8
      expect(adjusted.coolPointDistribution[0]).toBe(1);
    });

    it('should preserve other chapters', () => {
      const outline = generateBatchOutline(basicOptions);
      const adjusted = adjustOutline(outline, { title: '新标题' }, 5);
      
      expect(adjusted.chapters.length).toBe(outline.chapters.length);
      expect(adjusted.chapters[0]).toEqual(outline.chapters[0]);
      expect(adjusted.chapters[4].title).toBe('新标题');
    });
  });

  describe('optimizeOutline', () => {
    it('should optimize outline', () => {
      const outline = generateBatchOutline({
        ...basicOptions,
        coolPointDensity: 'low',
      });
      
      const optimized = optimizeOutline(outline);
      
      expect(optimized.chapters.length).toBe(outline.chapters.length);
    });

    it('should add cool points where missing', () => {
      const outline = generateBatchOutline({
        ...basicOptions,
        coolPointDensity: 'low',
      });
      
      const originalCoolPoints = outline.chapters.reduce((sum, ch) => sum + ch.coolPoints.length, 0);
      const optimized = optimizeOutline(outline);
      const optimizedCoolPoints = optimized.chapters.reduce((sum, ch) => sum + ch.coolPoints.length, 0);
      
      expect(optimizedCoolPoints).toBeGreaterThanOrEqual(originalCoolPoints);
    });

    it('should add hooks where missing', () => {
      const outline = generateBatchOutline(basicOptions);
      const optimized = optimizeOutline(outline);
      
      const chaptersWithHooks = optimized.chapters.filter(ch => ch.hooks.length > 0).length;
      expect(chaptersWithHooks).toBeGreaterThan(0);
    });

    it('should recalculate distributions', () => {
      const outline = generateBatchOutline(basicOptions);
      const optimized = optimizeOutline(outline);
      
      expect(optimized.pacingCurve.length).toBe(optimized.totalChapters);
      expect(optimized.coolPointDistribution.length).toBe(optimized.totalChapters);
    });
  });

  describe('exportOutlineAsText', () => {
    it('should export as text', () => {
      const outline = generateBatchOutline(basicOptions);
      const text = exportOutlineAsText(outline);
      
      expect(text).toBeTruthy();
      expect(typeof text).toBe('string');
    });

    it('should include theme and metadata', () => {
      const outline = generateBatchOutline(basicOptions);
      const text = exportOutlineAsText(outline);
      
      expect(text).toContain(basicOptions.theme);
      expect(text).toContain(`总章节数：${outline.totalChapters}`);
      expect(text).toContain(`目标字数：${outline.totalWordCount}`);
    });

    it('should include all arcs', () => {
      const outline = generateBatchOutline(basicOptions);
      const text = exportOutlineAsText(outline);
      
      outline.arcs.forEach(arc => {
        expect(text).toContain(arc.name);
        expect(text).toContain(arc.description);
      });
    });

    it('should include all chapters', () => {
      const outline = generateBatchOutline(basicOptions);
      const text = exportOutlineAsText(outline);
      
      outline.chapters.forEach(ch => {
        expect(text).toContain(ch.title);
      });
    });

    it('should format as markdown', () => {
      const outline = generateBatchOutline(basicOptions);
      const text = exportOutlineAsText(outline);
      
      expect(text).toContain('#');
      expect(text).toContain('##');
      expect(text).toContain('###');
    });
  });

  describe('exportOutlineAsJSON', () => {
    it('should export as JSON', () => {
      const outline = generateBatchOutline(basicOptions);
      const json = exportOutlineAsJSON(outline);
      
      expect(json).toBeTruthy();
      expect(typeof json).toBe('string');
    });

    it('should be valid JSON', () => {
      const outline = generateBatchOutline(basicOptions);
      const json = exportOutlineAsJSON(outline);
      
      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should preserve all data', () => {
      const outline = generateBatchOutline(basicOptions);
      const json = exportOutlineAsJSON(outline);
      const parsed = JSON.parse(json);
      
      expect(parsed.totalChapters).toBe(outline.totalChapters);
      expect(parsed.totalWordCount).toBe(outline.totalWordCount);
      expect(parsed.arcs.length).toBe(outline.arcs.length);
      expect(parsed.chapters.length).toBe(outline.chapters.length);
    });
  });

  describe('Plot Types', () => {
    it('should assign appropriate plot types', () => {
      const outline = generateBatchOutline(basicOptions);
      
      const plotTypes = new Set(outline.chapters.map(ch => ch.plotType));
      expect(plotTypes.size).toBeGreaterThan(1); // 应该有多种类型
    });

    it('should have setup chapters at beginning', () => {
      const outline = generateBatchOutline(basicOptions);
      const firstArc = outline.arcs[0];
      const firstArcChapters = outline.chapters.filter(
        ch => ch.chapterNumber >= firstArc.startChapter && ch.chapterNumber <= firstArc.endChapter
      );
      
      const setupChapters = firstArcChapters.filter(ch => ch.plotType === 'setup');
      expect(setupChapters.length).toBeGreaterThan(0);
    });
  });

  describe('Cool Points', () => {
    it('should have various cool point types', () => {
      const outline = generateBatchOutline({
        ...basicOptions,
        coolPointDensity: 'high',
      });
      
      const coolPointTypes = new Set<string>();
      outline.chapters.forEach(ch => {
        ch.coolPoints.forEach(cp => {
          coolPointTypes.add(cp.type);
        });
      });
      
      expect(coolPointTypes.size).toBeGreaterThan(0);
    });

    it('should have intensity values', () => {
      const outline = generateBatchOutline(basicOptions);
      
      outline.chapters.forEach(ch => {
        ch.coolPoints.forEach(cp => {
          expect(cp.intensity).toBeGreaterThan(0);
          expect(cp.intensity).toBeLessThanOrEqual(10);
        });
      });
    });
  });
});
