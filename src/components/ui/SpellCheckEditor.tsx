import React, { useState, useEffect, useMemo, useRef } from 'react';
import { SpellCheckService, SpellError } from '../../services/spellcheck/SpellCheckService';

interface SpellCheckEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  disabled?: boolean;
}

export const SpellCheckEditor: React.FC<SpellCheckEditorProps> = ({
  value,
  onChange,
  placeholder = '开始写作...',
  className = '',
  minHeight = '400px',
  disabled = false
}) => {
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [selectedError, setSelectedError] = useState<SpellError | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 实时检查错别字
  useEffect(() => {
    if (value) {
      const detectedErrors = SpellCheckService.checkText(value);
      setErrors(detectedErrors);
    } else {
      setErrors([]);
    }
  }, [value]);

  // 应用修正建议
  const applySuggestion = (error: SpellError, suggestionIndex: number) => {
    const correctedText = SpellCheckService.applySuggestion(value, error, suggestionIndex);
    onChange(correctedText);
    setSelectedError(null);
    setTooltipPosition(null);
  };

  // 一键修正所有错误
  const fixAllErrors = () => {
    if (errors.length === 0) return;
    
    if (window.confirm(`发现 ${errors.length} 处错误，是否全部修正？`)) {
      const correctedText = SpellCheckService.autoFixAll(value, errors);
      onChange(correctedText);
    }
  };

  // 忽略错误
  const ignoreError = () => {
    setSelectedError(null);
    setTooltipPosition(null);
  };

  // 处理文本点击，显示错误提示
  const handleTextClick = (e: React.MouseEvent<HTMLTextAreaElement>) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;

    // 查找点击位置的错误
    const clickedError = errors.find(
      error => cursorPosition >= error.position.start && cursorPosition <= error.position.end
    );

    if (clickedError) {
      setSelectedError(clickedError);
      
      // 计算提示框位置
      const rect = textarea.getBoundingClientRect();
      const lineHeight = 24; // 估算行高
      const lines = value.substring(0, cursorPosition).split('\n').length;
      
      setTooltipPosition({
        x: e.clientX,
        y: rect.top + lines * lineHeight
      });
    } else {
      setSelectedError(null);
      setTooltipPosition(null);
    }
  };

  // 渲染带标记的文本（用于显示错误位置）
  const renderHighlightedText = () => {
    if (errors.length === 0 || !value) {
      return <div className="whitespace-pre-wrap break-words opacity-0">{value || ' '}</div>;
    }

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // 按位置排序错误
    const sortedErrors = [...errors].sort((a, b) => a.position.start - b.position.start);

    sortedErrors.forEach((error, index) => {
      // 添加错误前的正常文本
      if (error.position.start > lastIndex) {
        parts.push(
          <span key={`text-${index}`}>
            {value.substring(lastIndex, error.position.start)}
          </span>
        );
      }

      // 添加错误文本（带下划线）
      parts.push(
        <span
          key={`error-${index}`}
          className="relative border-b-2 border-red-500 border-dotted cursor-pointer hover:bg-red-50"
          style={{ textDecorationLine: 'underline', textDecorationStyle: 'wavy', textDecorationColor: '#ef4444' }}
          title={error.message}
        >
          {value.substring(error.position.start, error.position.end)}
        </span>
      );

      lastIndex = error.position.end;
    });

    // 添加最后的正常文本
    if (lastIndex < value.length) {
      parts.push(
        <span key="text-end">
          {value.substring(lastIndex)}
        </span>
      );
    }

    return <div className="whitespace-pre-wrap break-words pointer-events-none">{parts}</div>;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* 错误统计栏 */}
      {errors.length > 0 && (
        <div className="absolute top-0 right-0 z-10 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 m-2">
          <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm text-red-600 font-medium">
            发现 {errors.length} 处错误
          </span>
          <button
            onClick={fixAllErrors}
            className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
          >
            一键修正
          </button>
        </div>
      )}

      {/* 编辑器容器 */}
      <div className="relative">
        {/* 高亮层（显示错误标记） */}
        <div
          className="absolute inset-0 px-4 py-3 text-sm leading-relaxed text-transparent pointer-events-none overflow-hidden"
          style={{ minHeight }}
        >
          {renderHighlightedText()}
        </div>

        {/* 文本输入框 */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onClick={handleTextClick}
          placeholder={placeholder}
          disabled={disabled}
          className="relative w-full px-4 py-3 text-sm leading-relaxed bg-transparent border border-slate-200 rounded-lg focus:outline-none focus:border-[#2C5F2D] resize-none"
          style={{ minHeight }}
        />
      </div>

      {/* 错误提示工具栏 */}
      {selectedError && tooltipPosition && (
        <div
          className="fixed z-50 bg-white border-2 border-red-200 rounded-lg shadow-xl p-4 max-w-sm"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y + 20}px`,
          }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="font-semibold text-slate-800">错别字</span>
            </div>
            <button
              onClick={ignoreError}
              className="text-slate-400 hover:text-slate-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-3">
            <div className="text-sm text-slate-600 mb-1">原文：</div>
            <div className="px-3 py-2 bg-red-50 text-red-700 rounded border border-red-200 font-medium">
              {selectedError.original}
            </div>
          </div>

          {selectedError.message && (
            <div className="text-xs text-slate-500 mb-3">
              {selectedError.message}
            </div>
          )}

          <div className="mb-2">
            <div className="text-sm text-slate-600 mb-2">建议修改为：</div>
            <div className="space-y-2">
              {selectedError.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => applySuggestion(selectedError, index)}
                  className="w-full px-3 py-2 bg-green-50 text-green-700 rounded border border-green-200 hover:bg-green-100 transition-colors text-left font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={ignoreError}
            className="w-full mt-2 px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
          >
            忽略
          </button>
        </div>
      )}

      {/* 点击其他地方关闭提示 */}
      {selectedError && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setSelectedError(null);
            setTooltipPosition(null);
          }}
        />
      )}
    </div>
  );
};

export default SpellCheckEditor;
