import React, { useRef, useCallback, useState, memo } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';
import { generateCreativeContentStream } from '../../../../services/api/gemini';
import { useToast } from '../../../ui/Toast';

interface WritingEditorProps {
  onTextSelect?: (text: string) => void;
}

const WritingEditor: React.FC<WritingEditorProps> = ({ onTextSelect }) => {
  const toast = useToast();
  const {
    themeClasses,
    effectiveTheme,
    currentChapter,
    addChapter,
    updateChapter,
  } = useEditorContext();

  const {
    fontFamily,
    fontSize,
    lineHeight,
    showRichTextToolbar,
    setShowRichTextToolbar,
    isStreaming,
    setIsStreaming,
    selectedModel,
    temperature,
    maxTokens,
  } = useEditorStore();

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 在光标位置插入格式化文本
  const insertFormattedText = useCallback((type: 'bold' | 'italic' | 'dialog' | 'thought' | 'emphasis') => {
    if (!textareaRef.current || !currentChapter) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = currentChapter.content;
    const selectedText = content.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        newText = `**${selectedText || '粗体文字'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || '斜体文字'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'dialog':
        newText = `"${selectedText || '对话内容'}"`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'thought':
        newText = `『${selectedText || '心理活动'}』`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'emphasis':
        newText = `【${selectedText || '强调内容'}】`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    updateChapter(currentChapter.id, { content: newContent });

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset);
    }, 0);
  }, [currentChapter, updateChapter]);

  // 格式化对话（自动为引号内容添加格式）
  const formatDialogs = useCallback(() => {
    if (!currentChapter) return;

    let content = currentChapter.content;

    // 将英文引号替换为中文引号
    content = content.replace(/"([^"]+)"/g, '"$1"');

    // 将单引号对话替换为双引号
    content = content.replace(/'([^']+)'/g, '"$1"');

    updateChapter(currentChapter.id, { content });
  }, [currentChapter, updateChapter]);

  // 处理文本选择
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;
    const selected = textareaRef.current.value.substring(
      textareaRef.current.selectionStart,
      textareaRef.current.selectionEnd
    );
    if (selected.trim() && onTextSelect) {
      onTextSelect(selected);
    }
  }, [onTextSelect]);

  // AI 续写
  const continueWriting = useCallback(async () => {
    if (!currentChapter || isStreaming) return;

    setIsStreaming(true);

    const prompt = `你是一位专业的网文作家。请根据以下已有内容，继续续写一段（约200-300字）。保持文风一致，情节连贯。

已有内容：
${currentChapter.content.slice(-1000)}

请直接续写，不要有任何解释或前言：`;

    try {
      let newContent = currentChapter.content;
      await generateCreativeContentStream(
        prompt,
        (chunk) => {
          newContent += chunk;
          updateChapter(currentChapter.id, { content: newContent });
        },
        selectedModel,
        {
          temperature,
          maxTokens: maxTokens === 'unlimited' ? undefined : maxTokens,
        }
      );
    } catch (error) {
      console.error('AI 续写失败:', error);
      toast.error('AI 续写失败，请稍后重试');
    } finally {
      setIsStreaming(false);
    }
  }, [currentChapter, isStreaming, selectedModel, temperature, maxTokens, updateChapter, setIsStreaming]);

  if (!currentChapter) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${themeClasses.textMuted} gap-4`}>
        <div className="text-center space-y-2">
          <p>请选择或创建一个章节开始编辑</p>
          <button className={`px-4 py-2 border ${themeClasses.border} rounded-lg`} onClick={() => addChapter()}>
            + 创建第一章
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* 章节标题栏 */}
      <div className={`px-6 py-3 border-b ${themeClasses.border} flex items-center justify-between`}>
        <div>
          <p className={`text-base font-semibold ${themeClasses.text}`}>{currentChapter.title}</p>
          <p className={`text-xs ${themeClasses.textMuted}`}>{currentChapter.wordCount} 字</p>
        </div>
        <button
          className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs disabled:opacity-60"
          onClick={continueWriting}
          disabled={isStreaming}
        >
          {isStreaming ? '推演中...' : 'AI 续写'}
        </button>
      </div>

      {/* 富文本编辑工具栏 */}
      {showRichTextToolbar && (
        <div className={`px-6 py-2 border-b ${themeClasses.border} flex items-center gap-2`}>
          <div className="flex items-center gap-1">
            <button
              onClick={() => insertFormattedText('bold')}
              className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted} font-bold`}
              title="粗体 **文字**"
            >
              B
            </button>
            <button
              onClick={() => insertFormattedText('italic')}
              className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted} italic`}
              title="斜体 *文字*"
            >
              I
            </button>
            <div className={`w-px h-4 mx-1 ${themeClasses.border}`} />
            <button
              onClick={() => insertFormattedText('dialog')}
              className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
              title='对话 "文字"'
            >
              " "
            </button>
            <button
              onClick={() => insertFormattedText('thought')}
              className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
              title="心理 『文字』"
            >
              『』
            </button>
            <button
              onClick={() => insertFormattedText('emphasis')}
              className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
              title="强调 【文字】"
            >
              【】
            </button>
            <div className={`w-px h-4 mx-1 ${themeClasses.border}`} />
            <button
              onClick={formatDialogs}
              className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
              title="自动格式化引号"
            >
              格式化引号
            </button>
          </div>
          <div className="flex-1" />
          <button
            onClick={() => setShowRichTextToolbar(false)}
            className={`p-1 rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
            title="隐藏工具栏"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* 显示工具栏按钮 */}
      {!showRichTextToolbar && (
        <div className={`px-6 py-1 border-b ${themeClasses.border}`}>
          <button
            onClick={() => setShowRichTextToolbar(true)}
            className={`text-xs ${themeClasses.textMuted} hover:text-indigo-500`}
          >
            显示格式工具栏
          </button>
        </div>
      )}

      {/* 编辑区域 */}
      <textarea
        ref={textareaRef}
        value={currentChapter.content}
        onChange={(e) => updateChapter(currentChapter.id, { content: e.target.value })}
        onSelect={handleTextSelection}
        style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
        className={`flex-1 w-full p-6 text-base leading-relaxed focus:outline-none transition-colors duration-300 ${
          effectiveTheme === 'dark' ? 'bg-slate-900 text-slate-100' :
          effectiveTheme === 'gray' ? 'bg-[#f5f3f0] text-slate-800' :
          'bg-white text-slate-800'
        }`}
        placeholder="在此开始书写正文...（选中文本可使用 AI 扩写/润色）"
      />
    </div>
  );
};

export default memo(WritingEditor);
