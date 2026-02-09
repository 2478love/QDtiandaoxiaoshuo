import { describe, it, expect } from 'vitest';
import { OutlineToChapterService } from '../OutlineToChapterService';
import { Novel, OutlineNode } from '../../../types/novel';

describe('OutlineToChapterService', () => {
  const createMockNovel = (): Novel => ({
    id: 'novel_1',
    title: '测试小说',
    description: '测试',
    wordCount: 0,
    status: 'draft',
    updatedAt: new Date().toISOString(),
    tags: [],
    outlineNodes: [
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
        content: '主角登场',
        type: 'chapter',
        parentId: 'node_1',
        order: 1,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    chapters: [],
    volumes: [
      {
        id: 'volume_1',
        title: '第一卷',
        order: 0,
        createdAt: new Date().toISOString()
      }
    ],
    characters: [
      {
        id: 'char_1',
        name: '张三',
        role: '主角',
        description: '主角',
        traits: [],
        createdAt: new Date().toISOString()
      }
    ]
  });

  describe('generateChapter', () => {
    it('应该从大纲节点生成章节', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;
      
      const chapter = OutlineToChapterService.generateChapter(node, novel);

      expect(chapter.id).toBeDefined();
      expect(chapter.title).toBe('第一章');
      expect(chapter.content).toContain('第一章');
      expect(chapter.content).toContain('主角登场');
      expect(chapter.wordCount).toBe(0);
    });

    it('生成的章节应该包含大纲内容作为注释', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;
      
      const chapter = OutlineToChapterService.generateChapter(node, novel);

      expect(chapter.content).toContain('<!-- 大纲：主角登场 -->');
    });

    it('应该包含目标字数提示', () => {
      const novel = createMockNovel();
      const node = {
        ...novel.outlineNodes?.find(n => n.id === 'node_2')!,
        targetWords: 3000
      } as any;
      
      const chapter = OutlineToChapterService.generateChapter(node, novel);

      expect(chapter.content).toContain('<!-- 目标字数：3000 -->');
    });

    it('应该正确设置volumeId', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;
      
      const chapter = OutlineToChapterService.generateChapter(node, novel);

      expect(chapter.volumeId).toBe('volume_1');
    });
  });

  describe('batchGenerateChapters', () => {
    it('应该批量生成章节', () => {
      const novel = createMockNovel();
      novel.outlineNodes?.push({
        id: 'node_3',
        title: '第二章',
        content: '冒险开始',
        type: 'chapter',
        parentId: 'node_1',
        order: 2,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const chapters = OutlineToChapterService.batchGenerateChapters(
        novel.outlineNodes!,
        novel
      );

      expect(chapters.length).toBe(2);
      expect(chapters[0].title).toBe('第一章');
      expect(chapters[1].title).toBe('第二章');
    });

    it('不应该生成已关联的章节', () => {
      const novel = createMockNovel();
      novel.outlineNodes = novel.outlineNodes?.map(n => 
        n.id === 'node_2' ? { ...n, chapterId: 'chapter_1' } : n
      );

      const chapters = OutlineToChapterService.batchGenerateChapters(
        novel.outlineNodes!,
        novel
      );

      expect(chapters.length).toBe(0);
    });

    it('只应该生成章节类型的节点', () => {
      const novel = createMockNovel();
      
      const chapters = OutlineToChapterService.batchGenerateChapters(
        novel.outlineNodes!,
        novel
      );

      expect(chapters.length).toBe(1);
      expect(chapters.every(c => c.title !== '第一卷')).toBe(true);
    });
  });

  describe('generateAndLinkChapter', () => {
    it('应该生成章节并自动关联', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;

      const result = OutlineToChapterService.generateAndLinkChapter(node, novel);

      expect(result.chapter.id).toBeDefined();
      expect(result.updatedNovel.chapters?.length).toBe(1);
      
      const updatedNode = result.updatedNovel.outlineNodes?.find(n => n.id === 'node_2');
      expect(updatedNode?.chapterId).toBe(result.chapter.id);
    });
  });

  describe('batchGenerateAndLinkChapters', () => {
    it('应该批量生成并关联章节', () => {
      const novel = createMockNovel();
      novel.outlineNodes?.push({
        id: 'node_3',
        title: '第二章',
        content: '冒险开始',
        type: 'chapter',
        parentId: 'node_1',
        order: 2,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = OutlineToChapterService.batchGenerateAndLinkChapters(
        novel.outlineNodes!,
        novel
      );

      expect(result.chapters.length).toBe(2);
      expect(result.updatedNovel.chapters?.length).toBe(2);
      
      const node2 = result.updatedNovel.outlineNodes?.find(n => n.id === 'node_2');
      const node3 = result.updatedNovel.outlineNodes?.find(n => n.id === 'node_3');
      
      expect(node2?.chapterId).toBeDefined();
      expect(node3?.chapterId).toBeDefined();
    });
  });

  describe('generateChapterOutline', () => {
    it('应该生成章节大纲', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;

      const outline = OutlineToChapterService.generateChapterOutline(node, novel);

      expect(outline).toContain('## 第一章');
      expect(outline).toContain('**大纲：** 主角登场');
    });

    it('应该包含场景安排', () => {
      const novel = createMockNovel();
      novel.outlineNodes?.push({
        id: 'scene_1',
        title: '开场场景',
        content: '主角出场',
        type: 'scene',
        parentId: 'node_2',
        order: 3,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;
      const outline = OutlineToChapterService.generateChapterOutline(node, novel);

      expect(outline).toContain('**场景安排：**');
      expect(outline).toContain('开场场景');
    });
  });

  describe('generateVolume', () => {
    it('应该从大纲节点生成卷', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_1')!;

      const volume = OutlineToChapterService.generateVolume(node, novel);

      expect(volume.id).toBeDefined();
      expect(volume.title).toBe('第一卷');
      expect(volume.order).toBe(1); // 已有一个卷，所以是1
    });

    it('非卷类型节点应该抛出错误', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;

      expect(() => {
        OutlineToChapterService.generateVolume(node, novel);
      }).toThrow('只能从卷类型的大纲节点生成卷');
    });
  });

  describe('generateFullStructure', () => {
    it('应该生成完整的卷和章节结构', () => {
      const novel = createMockNovel();
      novel.volumes = []; // 清空现有卷
      
      novel.outlineNodes?.push({
        id: 'node_3',
        title: '第二章',
        content: '冒险开始',
        type: 'chapter',
        parentId: 'node_1',
        order: 2,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = OutlineToChapterService.generateFullStructure(
        novel.outlineNodes!,
        novel
      );

      expect(result.volumes.length).toBe(1);
      expect(result.chapters.length).toBe(2);
      expect(result.updatedNovel.volumes?.length).toBe(1);
      expect(result.updatedNovel.chapters?.length).toBe(2);
    });

    it('生成的章节应该关联到正确的卷', () => {
      const novel = createMockNovel();
      novel.volumes = [];

      const result = OutlineToChapterService.generateFullStructure(
        novel.outlineNodes!,
        novel
      );

      const chapter = result.chapters[0];
      const volume = result.volumes[0];

      expect(chapter.volumeId).toBe(volume.id);
    });
  });

  describe('生成内容包含相关信息', () => {
    it('应该包含主要人物信息', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;

      const chapter = OutlineToChapterService.generateChapter(node, novel);

      expect(chapter.content).toContain('主要人物：张三');
    });

    it('应该包含力量体系信息', () => {
      const novel = createMockNovel();
      novel.worldviews = [
        {
          id: 'world_1',
          title: '修仙体系',
          category: '力量体系',
          content: '炼气、筑基、金丹',
          createdAt: new Date().toISOString()
        }
      ];

      const node = novel.outlineNodes?.find(n => n.id === 'node_2')!;
      const chapter = OutlineToChapterService.generateChapter(node, novel);

      expect(chapter.content).toContain('力量体系：修仙体系');
    });
  });
});
