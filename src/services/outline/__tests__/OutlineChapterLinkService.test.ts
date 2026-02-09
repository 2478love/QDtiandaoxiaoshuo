import { describe, it, expect } from 'vitest';
import { OutlineChapterLinkService } from '../OutlineChapterLinkService';
import { Novel, OutlineNode, Chapter } from '../../../types/novel';

describe('OutlineChapterLinkService', () => {
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
        title: '第一章',
        content: '开端',
        type: 'chapter',
        order: 0,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'node_2',
        title: '第二章',
        content: '发展',
        type: 'chapter',
        order: 1,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ],
    chapters: [
      {
        id: 'chapter_1',
        title: '第一章',
        content: '内容',
        wordCount: 1000
      },
      {
        id: 'chapter_2',
        title: '第二章',
        content: '内容',
        wordCount: 2000
      }
    ]
  });

  describe('linkChapter', () => {
    it('应该能关联大纲节点和章节', () => {
      const novel = createMockNovel();
      const updated = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);

      const node = updated.outlineNodes?.find(n => n.id === 'node_1');
      expect(node?.chapterId).toBe('chapter_1');
    });

    it('关联后应该更新updatedAt', () => {
      const novel = createMockNovel();
      const oldNode = novel.outlineNodes?.find(n => n.id === 'node_1');
      const oldUpdatedAt = oldNode?.updatedAt;

      // 等待一小段时间确保时间戳不同
      const updated = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      const newNode = updated.outlineNodes?.find(n => n.id === 'node_1');

      expect(newNode?.updatedAt).toBeDefined();
    });
  });

  describe('unlinkChapter', () => {
    it('应该能取消关联', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      const unlinked = OutlineChapterLinkService.unlinkChapter('node_1', linked);

      const node = unlinked.outlineNodes?.find(n => n.id === 'node_1');
      expect(node?.chapterId).toBeUndefined();
    });
  });

  describe('navigateToChapter', () => {
    it('应该能从大纲节点跳转到章节', () => {
      const novel = createMockNovel();
      const updated = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      const node = updated.outlineNodes?.find(n => n.id === 'node_1')!;

      const chapter = OutlineChapterLinkService.navigateToChapter(node, novel.chapters!);
      expect(chapter?.id).toBe('chapter_1');
    });

    it('未关联的节点应该返回null', () => {
      const novel = createMockNovel();
      const node = novel.outlineNodes?.find(n => n.id === 'node_1')!;

      const chapter = OutlineChapterLinkService.navigateToChapter(node, novel.chapters!);
      expect(chapter).toBeNull();
    });
  });

  describe('navigateToOutlineNode', () => {
    it('应该能从章节跳转到大纲节点', () => {
      const novel = createMockNovel();
      const updated = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);

      const node = OutlineChapterLinkService.navigateToOutlineNode('chapter_1', updated.outlineNodes!);
      expect(node?.id).toBe('node_1');
    });
  });

  describe('syncChapterStatus', () => {
    it('应该同步章节字数到大纲', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      
      // 设置目标字数
      linked.outlineNodes = linked.outlineNodes?.map(n => 
        n.id === 'node_1' ? { ...n, targetWords: 1000 } as any : n
      );

      const synced = OutlineChapterLinkService.syncChapterStatus(linked);
      const node = synced.outlineNodes?.find(n => n.id === 'node_1') as any;

      expect(node.actualWords).toBe(1000);
      expect(node.completionRate).toBe(100);
    });

    it('应该根据字数更新状态', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      
      linked.outlineNodes = linked.outlineNodes?.map(n => 
        n.id === 'node_1' ? { ...n, targetWords: 2000 } as any : n
      );

      const synced = OutlineChapterLinkService.syncChapterStatus(linked);
      const node = synced.outlineNodes?.find(n => n.id === 'node_1');

      expect(node?.status).toBe('writing');
    });
  });

  describe('autoLinkChapters', () => {
    it('应该自动匹配标题相同的节点和章节', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.autoLinkChapters(novel);

      const node1 = linked.outlineNodes?.find(n => n.id === 'node_1');
      const node2 = linked.outlineNodes?.find(n => n.id === 'node_2');

      expect(node1?.chapterId).toBe('chapter_1');
      expect(node2?.chapterId).toBe('chapter_2');
    });

    it('不应该覆盖已有的关联', () => {
      const novel = createMockNovel();
      const preLinked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_2', novel);
      const autoLinked = OutlineChapterLinkService.autoLinkChapters(preLinked);

      const node = autoLinked.outlineNodes?.find(n => n.id === 'node_1');
      expect(node?.chapterId).toBe('chapter_2'); // 保持原有关联
    });
  });

  describe('getLinkInfo', () => {
    it('应该返回关联信息', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      const node = linked.outlineNodes?.find(n => n.id === 'node_1')!;

      const info = OutlineChapterLinkService.getLinkInfo(node, novel.chapters!);

      expect(info.isLinked).toBe(true);
      expect(info.status).toBe('linked');
      expect(info.chapter?.id).toBe('chapter_1');
    });

    it('应该检测断开的关联', () => {
      const novel = createMockNovel();
      const node: OutlineNode = {
        id: 'node_1',
        title: '第一章',
        content: '开端',
        type: 'chapter',
        order: 0,
        status: 'planned',
        chapterId: 'non_existent',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const info = OutlineChapterLinkService.getLinkInfo(node, novel.chapters!);

      expect(info.isLinked).toBe(true);
      expect(info.status).toBe('broken');
      expect(info.chapter).toBeNull();
    });
  });

  describe('getUnlinkedNodes', () => {
    it('应该返回所有未关联的章节节点', () => {
      const novel = createMockNovel();
      const unlinked = OutlineChapterLinkService.getUnlinkedNodes(novel.outlineNodes!);

      expect(unlinked.length).toBe(2);
      expect(unlinked.every(n => n.type === 'chapter' && !n.chapterId)).toBe(true);
    });
  });

  describe('getUnlinkedChapters', () => {
    it('应该返回所有未关联的章节', () => {
      const novel = createMockNovel();
      const unlinked = OutlineChapterLinkService.getUnlinkedChapters(
        novel.chapters!,
        novel.outlineNodes!
      );

      expect(unlinked.length).toBe(2);
    });

    it('关联后应该减少未关联章节数', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      const unlinked = OutlineChapterLinkService.getUnlinkedChapters(
        linked.chapters!,
        linked.outlineNodes!
      );

      expect(unlinked.length).toBe(1);
      expect(unlinked[0].id).toBe('chapter_2');
    });
  });

  describe('validateLinks', () => {
    it('有效的关联应该通过验证', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      const validation = OutlineChapterLinkService.validateLinks(linked);

      expect(validation.valid).toBe(true);
      expect(validation.brokenLinks.length).toBe(0);
      expect(validation.duplicateLinks.length).toBe(0);
    });

    it('应该检测断开的关联', () => {
      const novel = createMockNovel();
      novel.outlineNodes = novel.outlineNodes?.map(n => 
        n.id === 'node_1' ? { ...n, chapterId: 'non_existent' } : n
      );

      const validation = OutlineChapterLinkService.validateLinks(novel);

      expect(validation.valid).toBe(false);
      expect(validation.brokenLinks.length).toBe(1);
      expect(validation.brokenLinks[0].nodeId).toBe('node_1');
    });

    it('应该检测重复关联', () => {
      const novel = createMockNovel();
      novel.outlineNodes = novel.outlineNodes?.map(n => 
        ({ ...n, chapterId: 'chapter_1' })
      );

      const validation = OutlineChapterLinkService.validateLinks(novel);

      expect(validation.valid).toBe(false);
      expect(validation.duplicateLinks.length).toBe(1);
      expect(validation.duplicateLinks[0].chapterId).toBe('chapter_1');
      expect(validation.duplicateLinks[0].nodeIds.length).toBe(2);
    });
  });

  describe('fixBrokenLinks', () => {
    it('应该修复断开的关联', () => {
      const novel = createMockNovel();
      novel.outlineNodes = novel.outlineNodes?.map(n => 
        n.id === 'node_1' ? { ...n, chapterId: 'non_existent' } : n
      );

      const fixed = OutlineChapterLinkService.fixBrokenLinks(novel);
      const node = fixed.outlineNodes?.find(n => n.id === 'node_1');

      expect(node?.chapterId).toBeUndefined();
    });

    it('不应该影响有效的关联', () => {
      const novel = createMockNovel();
      const linked = OutlineChapterLinkService.linkChapter('node_1', 'chapter_1', novel);
      linked.outlineNodes = linked.outlineNodes?.map(n => 
        n.id === 'node_2' ? { ...n, chapterId: 'non_existent' } : n
      );

      const fixed = OutlineChapterLinkService.fixBrokenLinks(linked);
      const node1 = fixed.outlineNodes?.find(n => n.id === 'node_1');
      const node2 = fixed.outlineNodes?.find(n => n.id === 'node_2');

      expect(node1?.chapterId).toBe('chapter_1'); // 保持有效关联
      expect(node2?.chapterId).toBeUndefined(); // 清除断开关联
    });
  });
});
