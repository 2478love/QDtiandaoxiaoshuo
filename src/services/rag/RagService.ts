/**
 * @fileoverview RAG 记忆服务
 * @module services/rag/RagService
 * @description 提供基于向量相似度的记忆检索功能，让 AI 能够记住全书内容
 * 由于浏览器环境限制，使用简化的 TF-IDF + 余弦相似度实现
 */

// 记忆条目接口
export interface MemoryEntry {
  id: string;
  novelId: string;
  chapterId: string;
  chapterTitle: string;
  content: string;
  lineIndex: number;
  vector?: number[];
  createdAt: string;
}

// 检索结果接口
export interface RetrievalResult {
  entry: MemoryEntry;
  score: number;
}

// 存储 Key
const MEMORY_STORAGE_KEY = 'tiandao_rag_memory';
const VOCABULARY_KEY = 'tiandao_rag_vocabulary';

/**
 * 简单的文本分词（中文按字符，英文按单词）
 */
const tokenize = (text: string): string[] => {
  const tokens: string[] = [];
  // 匹配中文字符、英文单词和数字
  const regex = /[\u4e00-\u9fa5]|[a-zA-Z]+|[0-9]+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    tokens.push(match[0].toLowerCase());
  }
  return tokens;
};

/**
 * 计算 TF-IDF 向量
 */
const computeTfIdf = (tokens: string[], vocabulary: Map<string, number>, idf: Map<string, number>): number[] => {
  const tf = new Map<string, number>();
  tokens.forEach(token => {
    tf.set(token, (tf.get(token) || 0) + 1);
  });

  const vector: number[] = new Array(vocabulary.size).fill(0);
  tf.forEach((count, token) => {
    const idx = vocabulary.get(token);
    if (idx !== undefined) {
      vector[idx] = (count / tokens.length) * (idf.get(token) || 1);
    }
  });

  return vector;
};

/**
 * 计算余弦相似度
 */
const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * RAG 记忆服务类
 */
class RagService {
  private memories: MemoryEntry[] = [];
  private vocabulary: Map<string, number> = new Map();
  private idf: Map<string, number> = new Map();
  private documentFrequency: Map<string, number> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  /**
   * 从 localStorage 加载记忆
   */
  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(MEMORY_STORAGE_KEY);
      if (saved) {
        this.memories = JSON.parse(saved);
      }
      const vocabSaved = localStorage.getItem(VOCABULARY_KEY);
      if (vocabSaved) {
        const { vocabulary, idf, documentFrequency } = JSON.parse(vocabSaved);
        this.vocabulary = new Map(vocabulary);
        this.idf = new Map(idf);
        this.documentFrequency = new Map(documentFrequency);
      }
      this.isInitialized = true;
      console.log(`[RAG] 已加载 ${this.memories.length} 条记忆`);
    } catch (e) {
      console.error('[RAG] 加载记忆失败:', e);
      this.memories = [];
    }
  }

  /**
   * 保存到 localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(MEMORY_STORAGE_KEY, JSON.stringify(this.memories));
      localStorage.setItem(VOCABULARY_KEY, JSON.stringify({
        vocabulary: Array.from(this.vocabulary.entries()),
        idf: Array.from(this.idf.entries()),
        documentFrequency: Array.from(this.documentFrequency.entries()),
      }));
    } catch (e) {
      console.error('[RAG] 保存记忆失败:', e);
    }
  }

  /**
   * 重建词汇表和 IDF
   */
  private rebuildVocabulary(): void {
    this.vocabulary.clear();
    this.documentFrequency.clear();
    this.idf.clear();

    // 收集所有文档的词汇
    const allTokens = new Set<string>();
    const docTokenSets: Set<string>[] = [];

    this.memories.forEach(memory => {
      const tokens = tokenize(memory.content);
      const tokenSet = new Set(tokens);
      docTokenSets.push(tokenSet);
      tokens.forEach(token => allTokens.add(token));
    });

    // 构建词汇表
    let idx = 0;
    allTokens.forEach(token => {
      this.vocabulary.set(token, idx++);
    });

    // 计算文档频率
    docTokenSets.forEach(tokenSet => {
      tokenSet.forEach(token => {
        this.documentFrequency.set(token, (this.documentFrequency.get(token) || 0) + 1);
      });
    });

    // 计算 IDF
    const totalDocs = this.memories.length || 1;
    this.documentFrequency.forEach((df, token) => {
      this.idf.set(token, Math.log(totalDocs / (df + 1)) + 1);
    });

    // 重新计算所有记忆的向量
    this.memories.forEach(memory => {
      const tokens = tokenize(memory.content);
      memory.vector = computeTfIdf(tokens, this.vocabulary, this.idf);
    });
  }

  /**
   * 索引章节内容
   */
  indexChapter(novelId: string, chapterId: string, chapterTitle: string, content: string): void {
    if (!content.trim()) return;

    // 删除该章节的旧记忆
    this.memories = this.memories.filter(m => !(m.novelId === novelId && m.chapterId === chapterId));

    // 按段落分割，过滤短段落
    const segments = content.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 10);

    if (segments.length === 0) return;

    // 创建新的记忆条目
    const newEntries: MemoryEntry[] = segments.map((segment, index) => ({
      id: `${novelId}_${chapterId}_${index}`,
      novelId,
      chapterId,
      chapterTitle,
      content: segment,
      lineIndex: index,
      createdAt: new Date().toISOString(),
    }));

    this.memories.push(...newEntries);

    // 重建词汇表（增量更新会更高效，但这里简化处理）
    this.rebuildVocabulary();
    this.saveToStorage();

    console.log(`[RAG] 已记忆章节 "${chapterTitle}" (${newEntries.length} 条)`);
  }

  /**
   * 索引整本小说
   */
  indexNovel(novelId: string, chapters: { id: string; title: string; content: string }[]): void {
    console.log(`[RAG] 开始索引小说，共 ${chapters.length} 章...`);

    // 清除该小说的所有旧记忆
    this.memories = this.memories.filter(m => m.novelId !== novelId);

    // 索引所有章节
    chapters.forEach(chapter => {
      const segments = chapter.content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10);

      segments.forEach((segment, index) => {
        this.memories.push({
          id: `${novelId}_${chapter.id}_${index}`,
          novelId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          content: segment,
          lineIndex: index,
          createdAt: new Date().toISOString(),
        });
      });
    });

    this.rebuildVocabulary();
    this.saveToStorage();

    console.log(`[RAG] 索引完成，共 ${this.memories.length} 条记忆`);
  }

  /**
   * 搜索相关上下文
   */
  searchContext(query: string, novelId: string, topK: number = 5): RetrievalResult[] {
    if (!query.trim() || this.memories.length === 0) return [];

    // 过滤当前小说的记忆
    const novelMemories = this.memories.filter(m => m.novelId === novelId);
    if (novelMemories.length === 0) return [];

    // 计算查询向量
    const queryTokens = tokenize(query);
    const queryVector = computeTfIdf(queryTokens, this.vocabulary, this.idf);

    // 计算相似度
    const results: RetrievalResult[] = novelMemories
      .filter(m => m.vector && m.vector.length > 0)
      .map(entry => ({
        entry,
        score: cosineSimilarity(queryVector, entry.vector!),
      }))
      .filter(r => r.score > 0.1) // 过滤低相关性结果
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    console.log(`[RAG] 检索到 ${results.length} 条相关记忆`);
    return results;
  }

  /**
   * 格式化检索结果为上下文文本
   */
  formatContextForPrompt(results: RetrievalResult[]): string {
    if (results.length === 0) return '';

    const contextLines = results.map((r, i) =>
      `[${r.entry.chapterTitle}] ${r.entry.content}`
    );

    return `【前文剧情/相关记忆 (RAG)】：
${contextLines.join('\n')}

`;
  }

  /**
   * 删除小说的所有记忆
   */
  deleteNovelMemory(novelId: string): void {
    const before = this.memories.length;
    this.memories = this.memories.filter(m => m.novelId !== novelId);
    this.rebuildVocabulary();
    this.saveToStorage();
    console.log(`[RAG] 已清除小说 ${novelId} 的 ${before - this.memories.length} 条记忆`);
  }

  /**
   * 获取小说的记忆统计
   */
  getNovelMemoryStats(novelId: string): { totalEntries: number; chapters: string[] } {
    const novelMemories = this.memories.filter(m => m.novelId === novelId);
    const chapters = [...new Set(novelMemories.map(m => m.chapterTitle))];
    return {
      totalEntries: novelMemories.length,
      chapters,
    };
  }

  /**
   * 清除所有记忆
   */
  clearAll(): void {
    this.memories = [];
    this.vocabulary.clear();
    this.idf.clear();
    this.documentFrequency.clear();
    this.saveToStorage();
    console.log('[RAG] 已清除所有记忆');
  }
}

// 导出单例
export const ragService = new RagService();
export default ragService;
