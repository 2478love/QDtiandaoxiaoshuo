import { OutlineNode, Chapter, Novel } from '../../types/novel';

export class OutlineChapterLinkService {
  /**
   * 关联大纲节点和章节
   */
  static linkChapter(outlineNodeId: string, chapterId: string, novel: Novel): Novel {
    const updatedNodes = novel.outlineNodes?.map(node =>
      node.id === outlineNodeId
        ? { ...node, chapterId, updatedAt: new Date().toISOString() }
        : node
    );

    return { ...novel, outlineNodes: updatedNodes };
  }

  /**
   * 取消关联
   */
  static unlinkChapter(outlineNodeId: string, novel: Novel): Novel {
    const updatedNodes = novel.outlineNodes?.map(node =>
      node.id === outlineNodeId
        ? { ...node, chapterId: undefined, updatedAt: new Date().toISOString() }
        : node
    );

    return { ...novel, outlineNodes: updatedNodes };
  }

  /**
   * 从大纲节点跳转到章节
   */
  static navigateToChapter(outlineNode: OutlineNode, chapters: Chapter[]): Chapter | null {
    if (!outlineNode.chapterId) return null;
    return chapters.find(c => c.id === outlineNode.chapterId) || null;
  }

  /**
   * 从章节跳转到大纲节点
   */
  static navigateToOutlineNode(chapterId: string, outlineNodes: OutlineNode[]): OutlineNode | null {
    return outlineNodes.find(node => node.chapterId === chapterId) || null;
  }

  /**
   * 同步章节状态到大纲
   * 更新实际字数和完成度
   */
  static syncChapterStatus(novel: Novel): Novel {
    if (!novel.outlineNodes || !novel.chapters) {
      return novel;
    }

    const updatedNodes = novel.outlineNodes.map(node => {
      if (!node.chapterId) return node;

      const chapter = novel.chapters?.find(c => c.id === node.chapterId);
      if (!chapter) return node;

      // 计算完成度
      const targetWords = (node as any).targetWords || 0;
      const actualWords = chapter.wordCount;
      const completionRate = targetWords > 0
        ? Math.min(100, Math.round((actualWords / targetWords) * 100))
        : 0;

      // 根据字数判断状态
      let status: OutlineNode['status'] = 'planned';
      if (actualWords > 0) {
        status = completionRate >= 100 ? 'completed' : 'writing';
      }

      return {
        ...node,
        actualWords,
        completionRate,
        status,
        updatedAt: new Date().toISOString()
      } as OutlineNode;
    });

    return { ...novel, outlineNodes: updatedNodes };
  }

  /**
   * 批量关联章节
   * 自动匹配标题相同的大纲节点和章节
   */
  static autoLinkChapters(novel: Novel): Novel {
    if (!novel.outlineNodes || !novel.chapters) {
      return novel;
    }

    const updatedNodes = novel.outlineNodes.map(node => {
      // 跳过已关联的节点
      if (node.chapterId) return node;

      // 只处理章节类型的节点
      if (node.type !== 'chapter') return node;

      // 查找标题匹配的章节
      const matchedChapter = novel.chapters?.find(
        c => c.title.trim() === node.title.trim()
      );

      if (matchedChapter) {
        return {
          ...node,
          chapterId: matchedChapter.id,
          updatedAt: new Date().toISOString()
        };
      }

      return node;
    });

    return { ...novel, outlineNodes: updatedNodes };
  }

  /**
   * 获取大纲节点的关联信息
   */
  static getLinkInfo(outlineNode: OutlineNode, chapters: Chapter[]) {
    if (!outlineNode.chapterId) {
      return {
        isLinked: false,
        chapter: null,
        status: 'unlinked' as const
      };
    }

    const chapter = chapters.find(c => c.id === outlineNode.chapterId);
    
    if (!chapter) {
      return {
        isLinked: true,
        chapter: null,
        status: 'broken' as const // 关联已断开
      };
    }

    return {
      isLinked: true,
      chapter,
      status: 'linked' as const
    };
  }

  /**
   * 获取所有未关联的大纲节点
   */
  static getUnlinkedNodes(outlineNodes: OutlineNode[]): OutlineNode[] {
    return outlineNodes.filter(node => 
      node.type === 'chapter' && !node.chapterId
    );
  }

  /**
   * 获取所有未关联的章节
   */
  static getUnlinkedChapters(chapters: Chapter[], outlineNodes: OutlineNode[]): Chapter[] {
    const linkedChapterIds = new Set(
      outlineNodes
        .filter(node => node.chapterId)
        .map(node => node.chapterId)
    );

    return chapters.filter(chapter => !linkedChapterIds.has(chapter.id));
  }

  /**
   * 验证关联的完整性
   */
  static validateLinks(novel: Novel): {
    valid: boolean;
    brokenLinks: Array<{ nodeId: string; nodeTitle: string; chapterId: string }>;
    duplicateLinks: Array<{ chapterId: string; nodeIds: string[] }>;
  } {
    const brokenLinks: Array<{ nodeId: string; nodeTitle: string; chapterId: string }> = [];
    const chapterLinkMap = new Map<string, string[]>();

    novel.outlineNodes?.forEach(node => {
      if (!node.chapterId) return;

      // 检查章节是否存在
      const chapterExists = novel.chapters?.some(c => c.id === node.chapterId);
      if (!chapterExists) {
        brokenLinks.push({
          nodeId: node.id,
          nodeTitle: node.title,
          chapterId: node.chapterId
        });
      }

      // 检查重复关联
      const existing = chapterLinkMap.get(node.chapterId) || [];
      existing.push(node.id);
      chapterLinkMap.set(node.chapterId, existing);
    });

    const duplicateLinks: Array<{ chapterId: string; nodeIds: string[] }> = [];
    chapterLinkMap.forEach((nodeIds, chapterId) => {
      if (nodeIds.length > 1) {
        duplicateLinks.push({ chapterId, nodeIds });
      }
    });

    return {
      valid: brokenLinks.length === 0 && duplicateLinks.length === 0,
      brokenLinks,
      duplicateLinks
    };
  }

  /**
   * 修复断开的关联
   */
  static fixBrokenLinks(novel: Novel): Novel {
    const validation = this.validateLinks(novel);
    
    if (validation.brokenLinks.length === 0) {
      return novel;
    }

    const brokenNodeIds = new Set(validation.brokenLinks.map(link => link.nodeId));
    
    const updatedNodes = novel.outlineNodes?.map(node => {
      if (brokenNodeIds.has(node.id)) {
        return {
          ...node,
          chapterId: undefined,
          updatedAt: new Date().toISOString()
        };
      }
      return node;
    });

    return { ...novel, outlineNodes: updatedNodes };
  }
}
