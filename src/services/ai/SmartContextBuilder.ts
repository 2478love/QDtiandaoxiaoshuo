/**
 * @fileoverview 智能上下文构建器
 * @module services/ai/SmartContextBuilder
 * @description 为长篇小说续写构建三层智能上下文系统
 */

import { Novel, Chapter, Character, Worldview, Foreshadowing } from '../../types';
import { ragService } from '../rag/RagService';

export interface SmartContextOptions {
  includeWorldview?: boolean;
  includeCharacters?: boolean;
  includeForeshadowing?: boolean;
  includeRag?: boolean;
  recentContentLength?: number;
  ragTopK?: number;
}

export class SmartContextBuilder {
  /**
   * 构建智能上下文
   */
  static async build(
    novel: Novel,
    currentChapter: Chapter,
    recentContent: string,
    options: SmartContextOptions = {}
  ): Promise<string> {
    const {
      includeWorldview = true,
      includeCharacters = true,
      includeForeshadowing = true,
      includeRag = true,
      recentContentLength = 3000,
      ragTopK = 10
    } = options;

    const parts: string[] = [];

    // 第一层：核心设定
    if (includeWorldview || includeCharacters) {
      const coreSettings = this.buildCoreSettings(novel, {
        includeWorldview,
        includeCharacters
      });
      if (coreSettings) parts.push(coreSettings);
    }

    // 第二层：RAG 检索
    if (includeRag && novel.id) {
      const ragContext = await this.buildRagContext(
        novel.id,
        recentContent,
        ragTopK
      );
      if (ragContext) parts.push(ragContext);
    }

    // 第三层：当前状态
    const currentState = this.buildCurrentState(
      novel,
      currentChapter,
      recentContent,
      recentContentLength,
      includeForeshadowing
    );
    if (currentState) parts.push(currentState);

    return parts.join('\n\n');
  }

  /**
   * 第一层：核心设定
   */
  private static buildCoreSettings(
    novel: Novel,
    options: { includeWorldview: boolean; includeCharacters: boolean }
  ): string {
    const parts: string[] = ['【核心设定】'];
    let hasContent = false;

    // 世界观
    if (options.includeWorldview && novel.worldviews && novel.worldviews.length > 0) {
      const topWorldviews = novel.worldviews.slice(0, 3);
      parts.push('\n世界观：');
      topWorldviews.forEach(wv => {
        const content = wv.content.slice(0, 200);
        parts.push(`- ${wv.title}: ${content}${content.length >= 200 ? '...' : ''}`);
      });
      hasContent = true;
    }

    // 主要人物
    if (options.includeCharacters && novel.characters && novel.characters.length > 0) {
      const mainChars = novel.characters
        .filter(c => c.role === '主角' || c.role === '主要配角' || c.role === '重要配角')
        .slice(0, 5);
      
      if (mainChars.length > 0) {
        parts.push('\n主要人物：');
        mainChars.forEach(char => {
          const desc = char.description.slice(0, 100);
          parts.push(`- ${char.name}（${char.role}）: ${desc}${desc.length >= 100 ? '...' : ''}`);
        });
        hasContent = true;
      }
    }

    return hasContent ? parts.join('\n') : '';
  }

  /**
   * 第二层：RAG 检索
   */
  private static async buildRagContext(
    novelId: string,
    recentContent: string,
    topK: number
  ): Promise<string> {
    try {
      // 使用 RAG 服务检索相关内容
      const results = ragService.searchContext(recentContent, novelId, topK);

      if (results.length === 0) return '';

      const parts: string[] = ['【相关剧情回顾（智能检索）】'];

      // 按章节分组
      const byChapter = new Map<string, Array<{ content: string; score: number }>>();
      results.forEach(r => {
        const key = r.entry.chapterTitle;
        if (!byChapter.has(key)) {
          byChapter.set(key, []);
        }
        byChapter.get(key)!.push({
          content: r.entry.content,
          score: r.score
        });
      });

      // 格式化输出（限制总长度）
      let totalLength = 0;
      const maxLength = 2000;

      for (const [chapterTitle, contents] of byChapter.entries()) {
        if (totalLength >= maxLength) break;

        parts.push(`\n[${chapterTitle}]`);
        
        for (const { content } of contents) {
          if (totalLength >= maxLength) break;
          
          const preview = content.slice(0, 150);
          parts.push(`  ${preview}${content.length > 150 ? '...' : ''}`);
          totalLength += preview.length;
        }
      }

      return parts.join('\n');
    } catch (error) {
      console.error('[SmartContext] RAG 检索失败:', error);
      return '';
    }
  }

  /**
   * 第三层：当前状态
   */
  private static buildCurrentState(
    novel: Novel,
    currentChapter: Chapter,
    recentContent: string,
    maxLength: number,
    includeForeshadowing: boolean
  ): string {
    const parts: string[] = ['【当前状态】'];

    // 当前章节信息
    parts.push(`\n当前章节：${currentChapter.title}`);
    if (currentChapter.wordCount) {
      parts.push(`字数：${currentChapter.wordCount}`);
    }

    // 未解决的伏笔
    if (includeForeshadowing && novel.foreshadowings) {
      const pending = novel.foreshadowings
        .filter(f => f.status === 'planted' && f.importance !== 'low')
        .sort((a, b) => {
          const importanceOrder = { high: 0, medium: 1, low: 2 };
          return importanceOrder[a.importance] - importanceOrder[b.importance];
        })
        .slice(0, 5);

      if (pending.length > 0) {
        parts.push('\n待回收伏笔：');
        pending.forEach(f => {
          const desc = f.description.slice(0, 100);
          const importance = f.importance === 'high' ? '⚠️' : f.importance === 'medium' ? '📌' : '💡';
          parts.push(`${importance} ${f.title}: ${desc}${desc.length >= 100 ? '...' : ''}`);
        });
      }
    }

    // 最近内容（保留完整段落）
    const recentParagraphs = this.extractRecentParagraphs(recentContent, maxLength);
    if (recentParagraphs) {
      parts.push('\n最近内容：');
      parts.push(recentParagraphs);
    }

    return parts.join('\n');
  }

  /**
   * 智能提取最近段落（保持完整性）
   */
  private static extractRecentParagraphs(content: string, maxLength: number): string {
    if (!content) return '';

    const paragraphs = content
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    if (paragraphs.length === 0) return '';

    let result: string[] = [];
    let currentLength = 0;

    // 从后往前取段落，保持完整性
    for (let i = paragraphs.length - 1; i >= 0; i--) {
      const para = paragraphs[i];
      if (currentLength + para.length + 1 > maxLength) {
        // 如果加上这段会超出，检查是否至少有一段
        if (result.length === 0 && para.length <= maxLength) {
          result.unshift(para);
        }
        break;
      }
      result.unshift(para);
      currentLength += para.length + 1; // +1 for newline
    }

    return result.join('\n');
  }

  /**
   * 获取上下文统计信息
   */
  static getContextStats(context: string): {
    totalLength: number;
    sections: { name: string; length: number }[];
  } {
    const sections: { name: string; length: number }[] = [];
    
    const coreMatch = context.match(/【核心设定】([\s\S]*?)(?=【|$)/);
    if (coreMatch) {
      sections.push({ name: '核心设定', length: coreMatch[1].length });
    }

    const ragMatch = context.match(/【相关剧情回顾（智能检索）】([\s\S]*?)(?=【|$)/);
    if (ragMatch) {
      sections.push({ name: 'RAG检索', length: ragMatch[1].length });
    }

    const currentMatch = context.match(/【当前状态】([\s\S]*?)$/);
    if (currentMatch) {
      sections.push({ name: '当前状态', length: currentMatch[1].length });
    }

    return {
      totalLength: context.length,
      sections
    };
  }
}
