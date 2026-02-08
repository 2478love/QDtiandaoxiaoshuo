import { describe, expect, it } from 'vitest';
import {
  isNovel,
  isChapter,
  isVolume,
  isCharacter,
  safeParseJson,
  safeReadFromStorage,
} from './validation';
import type { Novel, Chapter, Volume, Character } from '../types';

describe('utils/validation - Type Guards', () => {
  describe('isChapter', () => {
    it('should accept valid chapter', () => {
      const validChapter: Chapter = {
        id: 'chapter_1',
        title: '第一章',
        content: '章节内容',
        wordCount: 1000,
        volumeId: 'volume_1',
      };

      expect(isChapter(validChapter)).toBe(true);
    });

    it('should reject chapter with missing required fields', () => {
      const invalidChapter = {
        id: 'chapter_1',
        title: '第一章',
        // missing content and wordCount
      };

      expect(isChapter(invalidChapter)).toBe(false);
    });

    it('should reject chapter with negative wordCount', () => {
      const invalidChapter = {
        id: 'chapter_1',
        title: '第一章',
        content: '内容',
        wordCount: -100,
      };

      expect(isChapter(invalidChapter)).toBe(false);
    });

    it('should reject non-object values', () => {
      expect(isChapter(null)).toBe(false);
      expect(isChapter(undefined)).toBe(false);
      expect(isChapter('string')).toBe(false);
      expect(isChapter(123)).toBe(false);
      expect(isChapter([])).toBe(false);
    });
  });

  describe('isVolume', () => {
    it('should accept valid volume', () => {
      const validVolume: Volume = {
        id: 'volume_1',
        title: '第一卷',
        order: 1,
        createdAt: new Date().toISOString(),
      };

      expect(isVolume(validVolume)).toBe(true);
    });

    it('should reject volume with invalid order', () => {
      const invalidVolume = {
        id: 'volume_1',
        title: '第一卷',
        order: -1,
        createdAt: new Date().toISOString(),
      };

      expect(isVolume(invalidVolume)).toBe(false);
    });
  });

  describe('isCharacter', () => {
    it('should accept valid character', () => {
      const validCharacter: Character = {
        id: 'char_1',
        name: '张三',
        role: '主角',
        description: '描述',
        traits: ['勇敢', '聪明'],
        createdAt: new Date().toISOString(),
      };

      expect(isCharacter(validCharacter)).toBe(true);
    });

    it('should reject character with non-array traits', () => {
      const invalidCharacter = {
        id: 'char_1',
        name: '张三',
        role: '主角',
        description: '描述',
        traits: 'not-an-array',
        createdAt: new Date().toISOString(),
      };

      expect(isCharacter(invalidCharacter)).toBe(false);
    });
  });

  describe('isNovel', () => {
    it('should accept valid novel with all required fields', () => {
      const validNovel: Novel = {
        id: 'novel_1',
        title: '测试小说',
        description: '描述',
        wordCount: 50000,
        status: 'ongoing',
        tags: ['玄幻', '修仙'],
        updatedAt: new Date().toISOString(),
        chapters: [],
        volumes: [],
        characters: [],
        worldviews: [],
        timelineEvents: [],
        references: [],
        mindMaps: [],
        outlineNodes: [],
        foreshadowings: [],
        characterRelations: [],
        writingGoals: [],
        writingRecords: [],
        locations: [],
        items: [],
        chapterTemplates: [],
      };

      expect(isNovel(validNovel)).toBe(true);
    });

    it('should reject novel with invalid status', () => {
      const invalidNovel = {
        id: 'novel_1',
        title: '测试小说',
        description: '描述',
        wordCount: 50000,
        status: 'invalid-status',
        tags: [],
        updatedAt: new Date().toISOString(),
      };

      expect(isNovel(invalidNovel)).toBe(false);
    });

    it('should reject novel with missing required fields', () => {
      const invalidNovel = {
        id: 'novel_1',
        title: '测试小说',
        // missing description, wordCount, status, etc.
      };

      expect(isNovel(invalidNovel)).toBe(false);
    });

    it('should accept novel with valid chapters array', () => {
      const validChapter: Chapter = {
        id: 'chapter_1',
        title: '第一章',
        content: '内容',
        wordCount: 1000,
        volumeId: 'volume_1',
      };

      const novelWithChapters = {
        id: 'novel_1',
        title: '测试小说',
        description: '描述',
        wordCount: 1000,
        status: 'ongoing',
        tags: [],
        updatedAt: new Date().toISOString(),
        chapters: [validChapter],
        volumes: [],
        characters: [],
        worldviews: [],
        timelineEvents: [],
        references: [],
        mindMaps: [],
        outlineNodes: [],
        foreshadowings: [],
        characterRelations: [],
        writingGoals: [],
        writingRecords: [],
        locations: [],
        items: [],
        chapterTemplates: [],
      };

      expect(isNovel(novelWithChapters)).toBe(true);
    });

    it('should reject novel with invalid chapters array', () => {
      const invalidNovel = {
        id: 'novel_1',
        title: '测试小说',
        description: '描述',
        wordCount: 1000,
        status: 'ongoing',
        tags: [],
        updatedAt: new Date().toISOString(),
        chapters: [{ invalid: 'chapter' }], // Invalid chapter
      };

      expect(isNovel(invalidNovel)).toBe(false);
    });
  });
});

describe('utils/validation - Safe Parsing', () => {
  describe('safeParseJson', () => {
    it('should parse valid JSON with correct type', () => {
      const validChapter: Chapter = {
        id: 'chapter_1',
        title: '第一章',
        content: '内容',
        wordCount: 1000,
        volumeId: 'volume_1',
      };

      const json = JSON.stringify(validChapter);
      const result = safeParseJson(json, isChapter);

      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validChapter);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject valid JSON with wrong type', () => {
      const wrongType = { id: 'test', name: 'wrong' };
      const json = JSON.stringify(wrongType);
      const result = safeParseJson(json, isChapter);

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('数据格式不符合预期类型');
    });

    it('should reject invalid JSON string', () => {
      const invalidJson = '{ invalid json }';
      const result = safeParseJson(invalidJson, isChapter);

      expect(result.valid).toBe(false);
      expect(result.data).toBeNull();
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('JSON 解析失败');
    });

    it('should handle backup format with wrapper', () => {
      const novel: Novel = {
        id: 'novel_1',
        title: '测试小说',
        description: '描述',
        wordCount: 1000,
        status: 'ongoing',
        tags: [],
        updatedAt: new Date().toISOString(),
        chapters: [],
        volumes: [],
        characters: [],
        worldviews: [],
        timelineEvents: [],
        references: [],
        mindMaps: [],
        outlineNodes: [],
        foreshadowings: [],
        characterRelations: [],
        writingGoals: [],
        writingRecords: [],
        locations: [],
        items: [],
        chapterTemplates: [],
      };

      const backup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        novel: novel,
      };

      const json = JSON.stringify(backup);
      const result = safeParseJson(json, (value): value is typeof backup => {
        if (typeof value !== 'object' || value === null) return false;
        const obj = value as Record<string, unknown>;
        return typeof obj.version === 'string' && isNovel(obj.novel);
      });

      expect(result.valid).toBe(true);
      expect(result.data?.novel).toEqual(novel);
    });
  });

  describe('safeReadFromStorage', () => {
    it('should return default value when key does not exist', () => {
      const defaultValue = { test: 'default' };
      const result = safeReadFromStorage(
        'non-existent-key',
        (v): v is typeof defaultValue => typeof v === 'object' && v !== null,
        defaultValue
      );

      expect(result).toEqual(defaultValue);
    });

    it('should return parsed value when valid data exists', () => {
      const testData = { id: 'test', value: 123 };
      const testKey = 'test-key-' + Date.now(); // Use unique key
      
      localStorage.setItem(testKey, JSON.stringify(testData));

      const result = safeReadFromStorage(
        testKey,
        (v): v is typeof testData => {
          if (typeof v !== 'object' || v === null) return false;
          const obj = v as Record<string, unknown>;
          return typeof obj.id === 'string' && typeof obj.value === 'number';
        },
        { id: 'default', value: 0 }
      );

      expect(result).toEqual(testData);
      localStorage.removeItem(testKey);
    });

    it('should return default value when stored data is invalid', () => {
      const invalidKey = 'invalid-key-' + Date.now();
      localStorage.setItem(invalidKey, 'invalid json');
      const defaultValue = { test: 'default' };

      const result = safeReadFromStorage(
        invalidKey,
        (v): v is typeof defaultValue => typeof v === 'object' && v !== null,
        defaultValue
      );

      expect(result).toEqual(defaultValue);
      localStorage.removeItem(invalidKey);
    });
  });
});
