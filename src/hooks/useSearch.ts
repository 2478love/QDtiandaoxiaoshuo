import { useState, useEffect, useCallback } from 'react';
import { SearchService, SearchResult } from '../services/search/SearchService';
import { Novel, PromptEntry, ShortWork } from '../types';

export function useSearch(data: {
  novels: Novel[];
  prompts: PromptEntry[];
  shortWorks: ShortWork[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // 执行搜索
  const performSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    
    // 使用 setTimeout 模拟异步搜索，避免阻塞 UI
    setTimeout(() => {
      const searchResults = SearchService.search(searchQuery, data);
      setResults(searchResults);
      setIsSearching(false);
    }, 100);
  }, [data]);

  // 监听查询变化
  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  // 监听快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K 或 Cmd+K 打开搜索
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      
      // ESC 关闭搜索
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const openSearch = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setResults([]);
  }, []);

  return {
    isOpen,
    query,
    results,
    isSearching,
    setQuery,
    openSearch,
    closeSearch,
  };
}
