import { OutlineNode } from '../../types/novel';

export interface OutlineStats {
  totalNodes: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  targetWords: number;
  actualWords: number;
  completionRate: number;
  chaptersPlanned: number;
  chaptersWriting: number;
  chaptersCompleted: number;
  linkedChapters: number;
  unlinkedChapters: number;
}

export interface DetailedNodeStats {
  node: OutlineNode;
  childCount: number;
  descendantCount: number;
  targetWords: number;
  actualWords: number;
  completionRate: number;
  depth: number;
}

export class OutlineStatsService {
  /**
   * 计算大纲统计信息
   */
  static calculate(outlineNodes: OutlineNode[]): OutlineStats {
    const stats: OutlineStats = {
      totalNodes: outlineNodes.length,
      byType: {},
      byStatus: {},
      targetWords: 0,
      actualWords: 0,
      completionRate: 0,
      chaptersPlanned: 0,
      chaptersWriting: 0,
      chaptersCompleted: 0,
      linkedChapters: 0,
      unlinkedChapters: 0,
    };

    outlineNodes.forEach(node => {
      // 按类型统计
      stats.byType[node.type] = (stats.byType[node.type] || 0) + 1;

      // 按状态统计
      stats.byStatus[node.status] = (stats.byStatus[node.status] || 0) + 1;

      // 字数统计
      const targetWords = (node as any).targetWords || 0;
      const actualWords = (node as any).actualWords || 0;

      if (targetWords > 0) {
        stats.targetWords += targetWords;
      }
      if (actualWords > 0) {
        stats.actualWords += actualWords;
      }

      // 章节统计
      if (node.type === 'chapter') {
        if (node.status === 'planned') stats.chaptersPlanned++;
        if (node.status === 'writing') stats.chaptersWriting++;
        if (node.status === 'completed') stats.chaptersCompleted++;

        // 关联统计
        if (node.chapterId) {
          stats.linkedChapters++;
        } else {
          stats.unlinkedChapters++;
        }
      }
    });

    // 计算完成度
    if (stats.targetWords > 0) {
      stats.completionRate = Math.round((stats.actualWords / stats.targetWords) * 100);
    }

    return stats;
  }

  /**
   * 计算单个节点的详细统计
   */
  static calculateNodeStats(
    node: OutlineNode,
    allNodes: OutlineNode[]
  ): DetailedNodeStats {
    const children = allNodes.filter(n => n.parentId === node.id);
    const descendants = this.getAllDescendants(node, allNodes);

    // 计算目标字数（包括子节点）
    let targetWords = (node as any).targetWords || 0;
    let actualWords = (node as any).actualWords || 0;

    descendants.forEach(desc => {
      targetWords += (desc as any).targetWords || 0;
      actualWords += (desc as any).actualWords || 0;
    });

    const completionRate = targetWords > 0
      ? Math.round((actualWords / targetWords) * 100)
      : 0;

    const depth = this.getNodeDepth(node, allNodes);

    return {
      node,
      childCount: children.length,
      descendantCount: descendants.length,
      targetWords,
      actualWords,
      completionRate,
      depth
    };
  }

  /**
   * 获取所有后代节点
   */
  private static getAllDescendants(
    node: OutlineNode,
    allNodes: OutlineNode[]
  ): OutlineNode[] {
    const descendants: OutlineNode[] = [];
    const children = allNodes.filter(n => n.parentId === node.id);

    children.forEach(child => {
      descendants.push(child);
      descendants.push(...this.getAllDescendants(child, allNodes));
    });

    return descendants;
  }

  /**
   * 获取节点深度
   */
  private static getNodeDepth(node: OutlineNode, allNodes: OutlineNode[]): number {
    let depth = 0;
    let currentNode = node;

    while (currentNode.parentId) {
      depth++;
      const parent = allNodes.find(n => n.id === currentNode.parentId);
      if (!parent) break;
      currentNode = parent;
    }

    return depth;
  }

  /**
   * 计算卷的统计信息
   */
  static calculateVolumeStats(
    volumeNode: OutlineNode,
    allNodes: OutlineNode[]
  ): {
    volume: OutlineNode;
    chapterCount: number;
    targetWords: number;
    actualWords: number;
    completionRate: number;
    statusBreakdown: Record<string, number>;
  } {
    if (volumeNode.type !== 'volume') {
      throw new Error('节点类型必须是 volume');
    }

    const chapters = allNodes.filter(
      n => n.parentId === volumeNode.id && n.type === 'chapter'
    );

    let targetWords = 0;
    let actualWords = 0;
    const statusBreakdown: Record<string, number> = {
      planned: 0,
      writing: 0,
      completed: 0
    };

    chapters.forEach(chapter => {
      targetWords += (chapter as any).targetWords || 0;
      actualWords += (chapter as any).actualWords || 0;
      statusBreakdown[chapter.status]++;
    });

    const completionRate = targetWords > 0
      ? Math.round((actualWords / targetWords) * 100)
      : 0;

    return {
      volume: volumeNode,
      chapterCount: chapters.length,
      targetWords,
      actualWords,
      completionRate,
      statusBreakdown
    };
  }

  /**
   * 计算所有卷的统计信息
   */
  static calculateAllVolumesStats(outlineNodes: OutlineNode[]) {
    const volumes = outlineNodes.filter(n => n.type === 'volume');
    
    return volumes.map(volume => 
      this.calculateVolumeStats(volume, outlineNodes)
    );
  }

  /**
   * 生成进度报告
   */
  static generateProgressReport(outlineNodes: OutlineNode[]): {
    overall: OutlineStats;
    volumes: Array<{
      title: string;
      progress: number;
      chapterCount: number;
      completedChapters: number;
    }>;
    recentActivity: Array<{
      nodeTitle: string;
      status: string;
      updatedAt: string;
    }>;
  } {
    const overall = this.calculate(outlineNodes);
    
    const volumeStats = this.calculateAllVolumesStats(outlineNodes);
    const volumes = volumeStats.map(vs => ({
      title: vs.volume.title,
      progress: vs.completionRate,
      chapterCount: vs.chapterCount,
      completedChapters: vs.statusBreakdown.completed || 0
    }));

    // 获取最近更新的节点
    const recentActivity = outlineNodes
      .filter(n => n.type === 'chapter')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(n => ({
        nodeTitle: n.title,
        status: n.status,
        updatedAt: n.updatedAt
      }));

    return {
      overall,
      volumes,
      recentActivity
    };
  }

  /**
   * 计算写作速度（基于最近的更新）
   */
  static calculateWritingSpeed(outlineNodes: OutlineNode[]): {
    wordsPerDay: number;
    chaptersPerWeek: number;
    estimatedCompletionDays: number;
  } {
    const stats = this.calculate(outlineNodes);
    
    // 获取有实际字数的章节
    const chaptersWithWords = outlineNodes.filter(
      n => n.type === 'chapter' && (n as any).actualWords > 0
    );

    if (chaptersWithWords.length === 0) {
      return {
        wordsPerDay: 0,
        chaptersPerWeek: 0,
        estimatedCompletionDays: 0
      };
    }

    // 计算时间跨度
    const dates = chaptersWithWords.map(n => new Date(n.updatedAt).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daysDiff = Math.max(1, (maxDate - minDate) / (1000 * 60 * 60 * 24));

    // 计算速度
    const wordsPerDay = Math.round(stats.actualWords / daysDiff);
    const chaptersPerWeek = Math.round((chaptersWithWords.length / daysDiff) * 7);

    // 估算完成时间
    const remainingWords = stats.targetWords - stats.actualWords;
    const estimatedCompletionDays = wordsPerDay > 0
      ? Math.ceil(remainingWords / wordsPerDay)
      : 0;

    return {
      wordsPerDay,
      chaptersPerWeek,
      estimatedCompletionDays
    };
  }

  /**
   * 生成统计摘要文本
   */
  static generateSummaryText(outlineNodes: OutlineNode[]): string {
    const stats = this.calculate(outlineNodes);
    const speed = this.calculateWritingSpeed(outlineNodes);

    const lines: string[] = [];

    lines.push('📊 大纲统计摘要');
    lines.push('─'.repeat(40));
    lines.push('');

    lines.push('📚 结构统计：');
    lines.push(`  • 总节点数：${stats.totalNodes}`);
    lines.push(`  • 卷数：${stats.byType.volume || 0}`);
    lines.push(`  • 章节数：${stats.byType.chapter || 0}`);
    lines.push(`  • 场景数：${stats.byType.scene || 0}`);
    lines.push('');

    lines.push('✍️ 写作进度：');
    lines.push(`  • 计划中：${stats.chaptersPlanned} 章`);
    lines.push(`  • 写作中：${stats.chaptersWriting} 章`);
    lines.push(`  • 已完成：${stats.chaptersCompleted} 章`);
    lines.push('');

    lines.push('📝 字数统计：');
    lines.push(`  • 目标字数：${stats.targetWords.toLocaleString()} 字`);
    lines.push(`  • 实际字数：${stats.actualWords.toLocaleString()} 字`);
    lines.push(`  • 完成度：${stats.completionRate}%`);
    lines.push('');

    lines.push('🔗 关联状态：');
    lines.push(`  • 已关联章节：${stats.linkedChapters}`);
    lines.push(`  • 未关联章节：${stats.unlinkedChapters}`);
    lines.push('');

    if (speed.wordsPerDay > 0) {
      lines.push('⚡ 写作速度：');
      lines.push(`  • 日均字数：${speed.wordsPerDay.toLocaleString()} 字/天`);
      lines.push(`  • 周均章节：${speed.chaptersPerWeek} 章/周`);
      if (speed.estimatedCompletionDays > 0) {
        lines.push(`  • 预计完成：${speed.estimatedCompletionDays} 天后`);
      }
    }

    return lines.join('\n');
  }

  /**
   * 导出统计数据为 CSV
   */
  static exportStatsToCSV(outlineNodes: OutlineNode[]): string {
    const lines: string[] = [];

    // CSV 头部
    lines.push('节点ID,标题,类型,状态,目标字数,实际字数,完成度,是否关联,创建时间,更新时间');

    // 数据行
    outlineNodes.forEach(node => {
      const targetWords = (node as any).targetWords || 0;
      const actualWords = (node as any).actualWords || 0;
      const completionRate = (node as any).completionRate || 0;
      const isLinked = node.chapterId ? '是' : '否';

      const row = [
        node.id,
        `"${node.title}"`,
        node.type,
        node.status,
        targetWords,
        actualWords,
        completionRate,
        isLinked,
        node.createdAt,
        node.updatedAt
      ];

      lines.push(row.join(','));
    });

    return lines.join('\n');
  }

  /**
   * 比较两个时间点的统计数据
   */
  static compareStats(
    oldNodes: OutlineNode[],
    newNodes: OutlineNode[]
  ): {
    wordsDiff: number;
    completionDiff: number;
    chaptersCompletedDiff: number;
    newNodesCount: number;
  } {
    const oldStats = this.calculate(oldNodes);
    const newStats = this.calculate(newNodes);

    return {
      wordsDiff: newStats.actualWords - oldStats.actualWords,
      completionDiff: newStats.completionRate - oldStats.completionRate,
      chaptersCompletedDiff: newStats.chaptersCompleted - oldStats.chaptersCompleted,
      newNodesCount: newNodes.length - oldNodes.length
    };
  }
}
