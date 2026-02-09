import { describe, it, expect } from 'vitest';
import {
  extractKeyCharacters,
  extractKeyEvents,
  extractKeyLocations,
  analyzeEmotionalTone,
  generateBriefSummary,
  generateDetailedSummary,
  generatePlotTags,
  generateChapterSummary,
  batchGenerateSummaries,
  formatSummaryAsText,
  formatSummaryForRAG,
} from './chapterSummaryGenerator';

describe('chapterSummaryGenerator', () => {
  const sampleText = `
    李明说："我们必须尽快离开这里。"
    王芳点了点头，转身走向门口。
    突然，一声巨响从外面传来，整个房间都震动了起来。
    "发生什么事了？"李明紧张地问道。
    他们来到院子里，发现远处的天空中升起了浓烟。
    王芳冷静地说："看来我们的计划被发现了。"
    李明握紧了拳头，心中充满了愤怒。
    "我们不能就这样放弃，"他坚定地说道，"我们必须继续前进。"
  `;

  describe('extractKeyCharacters', () => {
    it('should extract characters from dialogue', () => {
      const characters = extractKeyCharacters(sampleText);
      expect(characters).toContain('李明');
      expect(characters).toContain('王芳');
    });

    it('should handle text without characters', () => {
      const characters = extractKeyCharacters('这是一段没有人物的文字。');
      expect(characters).toEqual([]);
    });

    it('should limit to 5 characters', () => {
      const text = '张三说话。李四说话。王五说话。赵六说话。孙七说话。周八说话。';
      const characters = extractKeyCharacters(text);
      expect(characters.length).toBeLessThanOrEqual(5);
    });
  });

  describe('extractKeyEvents', () => {
    it('should extract key events with trigger words', () => {
      const events = extractKeyEvents(sampleText);
      expect(events.length).toBeGreaterThan(0);
      expect(events.some(e => e.includes('突然'))).toBe(true);
    });

    it('should handle text without events', () => {
      const events = extractKeyEvents('这是一段平淡的描述。');
      expect(events).toEqual([]);
    });

    it('should limit to 3 events', () => {
      const text = '突然下雨了。忽然打雷了。瞬间停电了。立刻天黑了。';
      const events = extractKeyEvents(text);
      expect(events.length).toBeLessThanOrEqual(3);
    });
  });

  describe('extractKeyLocations', () => {
    it('should extract locations from text', () => {
      const locations = extractKeyLocations(sampleText);
      expect(locations.some(l => l.includes('院子'))).toBe(true);
    });

    it('should handle text without locations', () => {
      const locations = extractKeyLocations('他说了一些话。');
      expect(locations).toEqual([]);
    });

    it('should limit to 3 locations', () => {
      const text = '在房间里。来到客厅中。走进卧室内。进入厨房。';
      const locations = extractKeyLocations(text);
      expect(locations.length).toBeLessThanOrEqual(3);
    });
  });

  describe('analyzeEmotionalTone', () => {
    it('should detect tense emotion', () => {
      const text = '危险！他感到非常紧张和害怕。';
      const tone = analyzeEmotionalTone(text);
      expect(tone).toBe('紧张');
    });

    it('should detect angry emotion', () => {
      const text = '他愤怒地大喊，怒火中烧。';
      const tone = analyzeEmotionalTone(text);
      expect(tone).toBe('愤怒');
    });

    it('should detect joyful emotion', () => {
      const text = '他高兴极了，心中充满喜悦和快乐。';
      const tone = analyzeEmotionalTone(text);
      expect(tone).toBe('喜悦');
    });

    it('should default to calm for neutral text', () => {
      const text = '他走在路上，看着远方。';
      const tone = analyzeEmotionalTone(text);
      expect(tone).toBe('平静');
    });
  });

  describe('generateBriefSummary', () => {
    it('should generate brief summary', () => {
      const summary = generateBriefSummary(sampleText);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(100);
    });

    it('should respect max length', () => {
      const summary = generateBriefSummary(sampleText, 50);
      expect(summary.length).toBeLessThanOrEqual(50);
    });

    it('should handle short text', () => {
      const summary = generateBriefSummary('短文本。');
      expect(summary).toBe('短文本。');
    });
  });

  describe('generateDetailedSummary', () => {
    it('should generate detailed summary', () => {
      const summary = generateDetailedSummary(sampleText);
      expect(summary.length).toBeGreaterThan(0);
      expect(summary.length).toBeLessThanOrEqual(300);
    });

    it('should prioritize key sentences', () => {
      const summary = generateDetailedSummary(sampleText);
      expect(summary.includes('突然') || summary.includes('必须')).toBe(true);
    });

    it('should respect max length', () => {
      const summary = generateDetailedSummary(sampleText, 100);
      expect(summary.length).toBeLessThanOrEqual(100);
    });
  });

  describe('generatePlotTags', () => {
    it('should detect dialogue tag', () => {
      const tags = generatePlotTags(sampleText);
      expect(tags).toContain('对话');
    });

    it('should detect conflict tag', () => {
      const text = '他们发生了激烈的冲突和争执。';
      const tags = generatePlotTags(text);
      expect(tags).toContain('冲突');
    });

    it('should detect battle tag', () => {
      const text = '两人展开了激烈的战斗和厮杀。';
      const tags = generatePlotTags(text);
      expect(tags).toContain('战斗');
    });

    it('should return empty array for plain text', () => {
      const tags = generatePlotTags('这是一段普通的文字。');
      expect(tags).toEqual([]);
    });
  });

  describe('generateChapterSummary', () => {
    it('should generate complete summary', () => {
      const summary = generateChapterSummary('第一章', sampleText);
      
      expect(summary.title).toBe('第一章');
      expect(summary.brief).toBeTruthy();
      expect(summary.detailed).toBeTruthy();
      expect(summary.wordCount).toBeGreaterThan(0);
      expect(summary.emotionalTone).toBeTruthy();
    });

    it('should extract key information', () => {
      const summary = generateChapterSummary('第一章', sampleText, {
        extractKeyInfo: true,
      });
      
      expect(summary.keyCharacters.length).toBeGreaterThan(0);
      expect(summary.plotTags.length).toBeGreaterThan(0);
    });

    it('should skip detailed summary when not requested', () => {
      const summary = generateChapterSummary('第一章', sampleText, {
        includeDetailed: false,
      });
      
      expect(summary.detailed).toBe('');
    });

    it('should skip key info when not requested', () => {
      const summary = generateChapterSummary('第一章', sampleText, {
        extractKeyInfo: false,
      });
      
      expect(summary.keyCharacters).toEqual([]);
      expect(summary.keyEvents).toEqual([]);
      expect(summary.keyLocations).toEqual([]);
      expect(summary.plotTags).toEqual([]);
    });
  });

  describe('batchGenerateSummaries', () => {
    it('should generate summaries for multiple chapters', () => {
      const chapters = [
        { title: '第一章', content: sampleText },
        { title: '第二章', content: '另一段文字。' },
      ];
      
      const summaries = batchGenerateSummaries(chapters);
      
      expect(summaries).toHaveLength(2);
      expect(summaries[0].title).toBe('第一章');
      expect(summaries[1].title).toBe('第二章');
    });

    it('should handle empty array', () => {
      const summaries = batchGenerateSummaries([]);
      expect(summaries).toEqual([]);
    });

    it('should pass options to each summary', () => {
      const chapters = [
        { title: '第一章', content: sampleText },
      ];
      
      const summaries = batchGenerateSummaries(chapters, {
        includeDetailed: false,
      });
      
      expect(summaries[0].detailed).toBe('');
    });
  });

  describe('formatSummaryAsText', () => {
    it('should format summary as readable text', () => {
      const summary = generateChapterSummary('第一章', sampleText);
      const text = formatSummaryAsText(summary);
      
      expect(text).toContain('第一章');
      expect(text).toContain('简短摘要');
      expect(text).toContain('详细摘要');
      expect(text).toContain('关键人物');
      expect(text).toContain('情绪基调');
    });

    it('should handle summary without optional fields', () => {
      const summary = generateChapterSummary('第一章', '简单文本。', {
        includeDetailed: false,
        extractKeyInfo: false,
      });
      
      const text = formatSummaryAsText(summary);
      expect(text).toContain('第一章');
      expect(text).toContain('简短摘要');
    });
  });

  describe('formatSummaryForRAG', () => {
    it('should format summary for RAG retrieval', () => {
      const summary = generateChapterSummary('第一章', sampleText);
      const ragText = formatSummaryForRAG(summary);
      
      expect(ragText).toContain('章节：第一章');
      expect(ragText).toContain('摘要：');
      expect(ragText).toContain('|');
    });

    it('should include all available information', () => {
      const summary = generateChapterSummary('第一章', sampleText);
      const ragText = formatSummaryForRAG(summary);
      
      if (summary.keyCharacters.length > 0) {
        expect(ragText).toContain('人物：');
      }
      if (summary.keyEvents.length > 0) {
        expect(ragText).toContain('事件：');
      }
      if (summary.plotTags.length > 0) {
        expect(ragText).toContain('标签：');
      }
    });

    it('should be compact for RAG indexing', () => {
      const summary = generateChapterSummary('第一章', sampleText);
      const ragText = formatSummaryForRAG(summary);
      
      // RAG 格式应该比完整文本格式更紧凑
      const fullText = formatSummaryAsText(summary);
      expect(ragText.length).toBeLessThan(fullText.length);
    });
  });
});
