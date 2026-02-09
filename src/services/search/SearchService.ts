import { Novel, PromptEntry, ShortWork } from '../../types';

export interface SearchResult {
  type: 'novel' | 'prompt' | 'short-work';
  id: string;
  title: string;
  preview: string;
  matchedText?: string;
}

export class SearchService {
  /**
   * 搜索所有内容
   */
  static search(query: string, data: {
    novels: Novel[];
    prompts: PromptEntry[];
    shortWorks: ShortWork[];
  }): SearchResult[] {
    if (!query.trim()) return [];
    
    const results: SearchResult[] = [];
    const lowerQuery = query.toLowerCase();
    
    // 搜索小说
    data.novels.forEach(novel => {
      const titleMatch = novel.title.toLowerCase().includes(lowerQuery);
      const descMatch = novel.description?.toLowerCase().includes(lowerQuery);
      
      if (titleMatch || descMatch) {
        results.push({
          type: 'novel',
          id: novel.id,
          title: novel.title,
          preview: this.getPreview(novel.description || '', query),
          matchedText: titleMatch ? novel.title : novel.description,
        });
      }
      
      // 搜索章节内容
      if (novel.chapters) {
        novel.chapters.forEach(chapter => {
          const chapterTitleMatch = chapter.title.toLowerCase().includes(lowerQuery);
          const chapterContentMatch = chapter.content.toLowerCase().includes(lowerQuery);
          
          if (chapterTitleMatch || chapterContentMatch) {
            results.push({
              type: 'novel',
              id: novel.id,
              title: `${novel.title} - ${chapter.title}`,
              preview: this.getPreview(chapter.content, query),
              matchedText: chapterTitleMatch ? chapter.title : chapter.content,
            });
          }
        });
      }
    });
    
    // 搜索提示词
    data.prompts.forEach(prompt => {
      const titleMatch = prompt.title.toLowerCase().includes(lowerQuery);
      const contentMatch = prompt.content.toLowerCase().includes(lowerQuery);
      
      if (titleMatch || contentMatch) {
        results.push({
          type: 'prompt',
          id: prompt.id,
          title: prompt.title,
          preview: this.getPreview(prompt.content, query),
          matchedText: titleMatch ? prompt.title : prompt.content,
        });
      }
    });
    
    // 搜索短篇作品
    data.shortWorks.forEach(work => {
      const titleMatch = work.title.toLowerCase().includes(lowerQuery);
      const contentMatch = work.content.toLowerCase().includes(lowerQuery);
      
      if (titleMatch || contentMatch) {
        results.push({
          type: 'short-work',
          id: work.id,
          title: work.title,
          preview: this.getPreview(work.content, query),
          matchedText: titleMatch ? work.title : work.content,
        });
      }
    });
    
    return results;
  }
  
  /**
   * 获取匹配文本的预览片段
   */
  static getPreview(text: string, query: string, length = 100): string {
    if (!text) return '';
    
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    
    if (index === -1) {
      return text.slice(0, length) + (text.length > length ? '...' : '');
    }
    
    const start = Math.max(0, index - 50);
    const end = Math.min(text.length, index + query.length + 50);
    const preview = text.slice(start, end);
    
    return (start > 0 ? '...' : '') + preview + (end < text.length ? '...' : '');
  }
  
  /**
   * 高亮匹配的文本
   */
  static highlight(text: string, query: string): string {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800 px-0.5 rounded">$1</mark>');
  }
  
  /**
   * 转义正则表达式特殊字符
   */
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
