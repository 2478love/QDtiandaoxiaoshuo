import { OutlineNode, Chapter, Novel, Volume } from '../../types/novel';

// 生成唯一章节ID
function createChapterId(): string {
  return `chapter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class OutlineToChapterService {
  /**
   * 从大纲节点生成章节
   */
  static generateChapter(outlineNode: OutlineNode, novel: Novel): Chapter {
    const chapter: Chapter = {
      id: createChapterId(),
      title: outlineNode.title,
      content: this.generateInitialContent(outlineNode, novel),
      wordCount: 0,
      volumeId: this.findVolumeId(outlineNode, novel),
    };

    return chapter;
  }

  /**
   * 生成初始内容
   */
  private static generateInitialContent(node: OutlineNode, novel: Novel): string {
    const parts: string[] = [];

    // 章节标题
    parts.push(`# ${node.title}\n`);

    // 大纲内容作为注释
    if (node.content) {
      parts.push(`<!-- 大纲：${node.content} -->\n`);
    }

    // 目标字数提示
    const targetWords = (node as any).targetWords;
    if (targetWords) {
      parts.push(`<!-- 目标字数：${targetWords} -->\n`);
    }

    // 查找相关信息作为提示
    const relatedInfo = this.getRelatedInfo(node, novel);
    if (relatedInfo.length > 0) {
      parts.push(`<!-- 相关信息：\n${relatedInfo.join('\n')}\n-->\n`);
    }

    // 占位符
    parts.push('\n【此处开始写作】\n\n');

    return parts.join('\n');
  }

  /**
   * 获取相关信息（人物、世界观等）
   */
  private static getRelatedInfo(node: OutlineNode, novel: Novel): string[] {
    const info: string[] = [];

    // 添加主要人物信息
    if (novel.characters && novel.characters.length > 0) {
      const mainCharacters = novel.characters
        .filter(c => c.role === '主角' || c.role === '主要角色')
        .slice(0, 3);
      
      if (mainCharacters.length > 0) {
        info.push(`主要人物：${mainCharacters.map(c => c.name).join('、')}`);
      }
    }

    // 添加世界观提示
    if (novel.worldviews && novel.worldviews.length > 0) {
      const powerSystem = novel.worldviews.find(w => 
        w.category === '力量体系' || w.title.includes('体系')
      );
      if (powerSystem) {
        info.push(`力量体系：${powerSystem.title}`);
      }
    }

    return info;
  }

  /**
   * 查找大纲节点所属的卷ID
   */
  private static findVolumeId(node: OutlineNode, novel: Novel): string | undefined {
    if (!novel.outlineNodes || !novel.volumes) {
      return undefined;
    }

    // 如果节点本身是卷，查找对应的Volume
    if (node.type === 'volume') {
      const volume = novel.volumes.find(v => v.title === node.title);
      return volume?.id;
    }

    // 向上查找父节点，找到卷类型的节点
    let currentNode = node;
    while (currentNode.parentId) {
      const parentNode = novel.outlineNodes.find(n => n.id === currentNode.parentId);
      if (!parentNode) break;

      if (parentNode.type === 'volume') {
        const volume = novel.volumes.find(v => v.title === parentNode.title);
        return volume?.id;
      }

      currentNode = parentNode;
    }

    return undefined;
  }

  /**
   * 批量生成章节
   */
  static batchGenerateChapters(
    outlineNodes: OutlineNode[],
    novel: Novel
  ): Chapter[] {
    return outlineNodes
      .filter(node => node.type === 'chapter' && !node.chapterId)
      .map(node => this.generateChapter(node, novel));
  }

  /**
   * 生成章节并自动关联
   */
  static generateAndLinkChapter(
    outlineNode: OutlineNode,
    novel: Novel
  ): { chapter: Chapter; updatedNovel: Novel } {
    const chapter = this.generateChapter(outlineNode, novel);

    // 更新小说数据
    const updatedChapters = [...(novel.chapters || []), chapter];
    const updatedNodes = novel.outlineNodes?.map(node =>
      node.id === outlineNode.id
        ? { ...node, chapterId: chapter.id, updatedAt: new Date().toISOString() }
        : node
    );

    const updatedNovel: Novel = {
      ...novel,
      chapters: updatedChapters,
      outlineNodes: updatedNodes
    };

    return { chapter, updatedNovel };
  }

  /**
   * 批量生成并关联章节
   */
  static batchGenerateAndLinkChapters(
    outlineNodes: OutlineNode[],
    novel: Novel
  ): { chapters: Chapter[]; updatedNovel: Novel } {
    const nodesToGenerate = outlineNodes.filter(
      node => node.type === 'chapter' && !node.chapterId
    );

    const newChapters: Chapter[] = [];
    const chapterNodeMap = new Map<string, string>(); // nodeId -> chapterId

    // 生成所有章节
    nodesToGenerate.forEach(node => {
      const chapter = this.generateChapter(node, novel);
      newChapters.push(chapter);
      chapterNodeMap.set(node.id, chapter.id);
    });

    // 更新小说数据
    const updatedChapters = [...(novel.chapters || []), ...newChapters];
    const updatedNodes = novel.outlineNodes?.map(node => {
      const chapterId = chapterNodeMap.get(node.id);
      if (chapterId) {
        return { ...node, chapterId, updatedAt: new Date().toISOString() };
      }
      return node;
    });

    const updatedNovel: Novel = {
      ...novel,
      chapters: updatedChapters,
      outlineNodes: updatedNodes
    };

    return { chapters: newChapters, updatedNovel };
  }

  /**
   * 从大纲节点生成章节大纲（不是完整章节，只是章节的大纲部分）
   */
  static generateChapterOutline(outlineNode: OutlineNode, novel: Novel): string {
    const parts: string[] = [];

    parts.push(`## ${outlineNode.title}\n`);
    
    if (outlineNode.content) {
      parts.push(`**大纲：** ${outlineNode.content}\n`);
    }

    // 查找子节点（场景）
    const childNodes = novel.outlineNodes?.filter(
      n => n.parentId === outlineNode.id && n.type === 'scene'
    ) || [];

    if (childNodes.length > 0) {
      parts.push('\n**场景安排：**\n');
      childNodes.forEach((child, index) => {
        parts.push(`${index + 1}. ${child.title}`);
        if (child.content) {
          parts.push(`   - ${child.content}`);
        }
      });
    }

    const targetWords = (outlineNode as any).targetWords;
    if (targetWords) {
      parts.push(`\n**目标字数：** ${targetWords}\n`);
    }

    return parts.join('\n');
  }

  /**
   * 根据大纲节点创建卷
   */
  static generateVolume(outlineNode: OutlineNode, novel: Novel): Volume {
    if (outlineNode.type !== 'volume') {
      throw new Error('只能从卷类型的大纲节点生成卷');
    }

    // 计算卷的顺序
    const existingVolumes = novel.volumes || [];
    const maxOrder = existingVolumes.length > 0
      ? Math.max(...existingVolumes.map(v => v.order))
      : -1;

    const volume: Volume = {
      id: `volume_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: outlineNode.title,
      order: maxOrder + 1,
      createdAt: new Date().toISOString()
    };

    return volume;
  }

  /**
   * 批量生成卷和章节（完整的结构生成）
   */
  static generateFullStructure(
    outlineNodes: OutlineNode[],
    novel: Novel
  ): { volumes: Volume[]; chapters: Chapter[]; updatedNovel: Novel } {
    const newVolumes: Volume[] = [];
    const newChapters: Chapter[] = [];
    const volumeNodeMap = new Map<string, string>(); // nodeId -> volumeId
    const chapterNodeMap = new Map<string, string>(); // nodeId -> chapterId

    // 第一步：生成所有卷
    const volumeNodes = outlineNodes.filter(n => n.type === 'volume' && !n.chapterId);
    volumeNodes.forEach(node => {
      const volume = this.generateVolume(node, novel);
      newVolumes.push(volume);
      volumeNodeMap.set(node.id, volume.id);
    });

    // 更新novel以包含新卷
    const novelWithVolumes: Novel = {
      ...novel,
      volumes: [...(novel.volumes || []), ...newVolumes]
    };

    // 第二步：生成所有章节
    const chapterNodes = outlineNodes.filter(n => n.type === 'chapter' && !n.chapterId);
    chapterNodes.forEach(node => {
      const chapter = this.generateChapter(node, novelWithVolumes);
      newChapters.push(chapter);
      chapterNodeMap.set(node.id, chapter.id);
    });

    // 第三步：更新大纲节点的关联
    const updatedNodes = novel.outlineNodes?.map(node => {
      const chapterId = chapterNodeMap.get(node.id);
      if (chapterId) {
        return { ...node, chapterId, updatedAt: new Date().toISOString() };
      }
      return node;
    });

    const updatedNovel: Novel = {
      ...novelWithVolumes,
      chapters: [...(novel.chapters || []), ...newChapters],
      outlineNodes: updatedNodes
    };

    return { volumes: newVolumes, chapters: newChapters, updatedNovel };
  }
}
