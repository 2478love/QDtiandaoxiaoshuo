import React, { useRef, useEffect } from 'react';
import { Search, X, FileText, BookOpen, Lightbulb } from 'lucide-react';
import { SearchResult } from '../../services/search/SearchService';
import { SearchService } from '../../services/search/SearchService';

interface SearchModalProps {
  isOpen: boolean;
  query: string;
  results: SearchResult[];
  isSearching: boolean;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onResultClick: (result: SearchResult) => void;
}

const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  query,
  results,
  isSearching,
  onQueryChange,
  onClose,
  onResultClick,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // 打开时自动聚焦
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const getResultIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'novel':
        return <BookOpen className="w-5 h-5 text-[#2C5F2D]" />;
      case 'prompt':
        return <Lightbulb className="w-5 h-5 text-amber-500" />;
      case 'short-work':
        return <FileText className="w-5 h-5 text-blue-500" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'novel':
        return '📚 小说';
      case 'prompt':
        return '💡 提示词';
      case 'short-work':
        return '📝 短篇';
    }
  };

  // 按类型分组结果
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 搜索框 */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden">
        {/* 搜索输入 */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="搜索小说、提示词、短篇作品..."
            className="flex-1 bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none text-base"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded">
            ESC
          </kbd>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* 搜索结果 */}
        <div className="max-h-[60vh] overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-500 dark:text-slate-400">搜索中...</div>
            </div>
          ) : query.trim() === '' ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <Search className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">输入关键词开始搜索</p>
              <p className="text-xs mt-2 text-slate-400">支持搜索小说、提示词、短篇作品</p>
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 dark:text-slate-400">
              <FileText className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">未找到相关内容</p>
              <p className="text-xs mt-2 text-slate-400">试试其他关键词</p>
            </div>
          ) : (
            <div className="py-2">
              {Object.entries(groupedResults).map(([type, typeResults]) => (
                <div key={type} className="mb-4">
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {getResultTypeLabel(type as SearchResult['type'])}
                  </div>
                  {typeResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => {
                        onResultClick(result);
                        onClose();
                      }}
                      className="w-full px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left"
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">{getResultIcon(result.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                            {result.title}
                          </div>
                          <div
                            className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2"
                            dangerouslySetInnerHTML={{
                              __html: SearchService.highlight(result.preview, query),
                            }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部提示 */}
        {results.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>找到 {results.length} 个结果</span>
              <div className="flex items-center gap-4">
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600 ml-1">↓</kbd>
                  <span className="ml-1">导航</span>
                </span>
                <span className="hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">Enter</kbd>
                  <span className="ml-1">选择</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchModal;
