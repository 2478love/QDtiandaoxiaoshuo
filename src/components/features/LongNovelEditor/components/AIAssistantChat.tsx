import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import { useEditorStore, AIChatMessage, AIChatSession } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';
import { formatSessionDate } from '../utils/editorUtils';
import { generateCreativeContentStream, GenerateOptions } from '../../../../services/api/gemini';
import { getAvailableModels } from '../../../../config/apiConfig';
import { PromptEntry } from '../../../../types';
import { createMessageId } from '../../../../utils/id';
import {
  performWebSearch,
  extractSearchQuery,
  formatSearchResultsAsContext,
  getSearchSettings,
  saveSearchSettings,
} from '../../../../services/api/webSearch';
import ragService from '../../../../services/rag/RagService';

// AI 角色配置
const AI_ROLES = {
  chat: {
    name: '助手',
    icon: '💬',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    description: '回答问题，提供创作建议',
    systemPrompt: '你是一个专业的网文创作助手，名为"笔灵"。你精通各种网文流派，能够帮助作者进行情节构思、人物塑造、文笔润色等工作。',
  },
  writer: {
    name: '作家',
    icon: '✍️',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    description: '改写、润色、扩写内容',
    systemPrompt: '你是一个专业的小说写手。你的任务是根据用户的指令改写、润色或扩写内容。你需要保持设定的一致性，保持人物性格，同时提升文笔质量。输出时直接给出改写后的内容，无需解释。',
  },
  reviewer: {
    name: '审校',
    icon: '🔍',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    description: '检查 OOC、逻辑漏洞',
    systemPrompt: '你是一个专业的小说审校编辑。你的任务是检查内容是否存在人物崩坏（OOC）、逻辑漏洞、设定矛盾、情节不合理等问题。请指出具体问题并给出修改建议，格式化输出，使用序号列出问题。',
  },
};

const AIAssistantChat: React.FC = () => {
  const {
    themeClasses,
    effectiveTheme,
    currentChapter,
    updateChapter,
    prompts,
  } = useEditorContext();

  const {
    aiSessions,
    currentSessionId,
    chatInput,
    showSessionList,
    showPromptPicker,
    showAiSettings,
    selectedModel,
    isStreaming,
    temperature,
    maxTokens,
    characters,
    worldviews,
    timelineEvents,
    references,
    outlineNodes,
    foreshadowings,
    mindMaps,
    locations,
    items,
    webSearchEnabled,
    isSearching,
    // RAG 和新功能状态
    ragEnabled,
    ragMemoryCount,
    isIndexing,
    aiRole,
    stylePreservation,
    expansionLevel,
    contentRating,
    writingStyle,
    novel,
    setAiSessions,
    setCurrentSessionId,
    setChatInput,
    setShowSessionList,
    setShowPromptPicker,
    setShowAiSettings,
    setSelectedModel,
    setIsStreaming,
    setTemperature,
    setMaxTokens,
    setWebSearchEnabled,
    setIsSearching,
    // RAG 和新功能操作
    setRagEnabled,
    setRagMemoryCount,
    setIsIndexing,
    setAiRole,
    setStylePreservation,
    setExpansionLevel,
    setContentRating,
    setWritingStyle,
  } = useEditorStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const availableModels = useMemo(() => getAvailableModels(), []);

  // 获取当前会话
  const currentSession = useMemo(() => {
    return aiSessions.find(s => s.id === currentSessionId) || null;
  }, [aiSessions, currentSessionId]);

  // 当前会话的消息
  const messages = useMemo(() => {
    if (currentSession) {
      return currentSession.messages;
    }
    return [{ id: 'init', role: 'ai' as const, content: '我是你的笔灵助手，随时听候差遣。', createdAt: new Date().toLocaleString() }];
  }, [currentSession]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 初始化联网搜索设置
  useEffect(() => {
    const settings = getSearchSettings();
    setWebSearchEnabled(settings.enabled);
  }, [setWebSearchEnabled]);

  // 插入内容到章节
  const insertToContent = useCallback((content: string) => {
    if (!currentChapter) {
      alert('请先选择一个章节');
      return;
    }
    const newContent = currentChapter.content
      ? `${currentChapter.content}\n\n${content}`
      : content;
    updateChapter(currentChapter.id, { content: newContent });
  }, [currentChapter, updateChapter]);

  // 创建新会话
  const createNewSession = useCallback(() => {
    const newSession: AIChatSession = {
      id: createMessageId(),
      title: '新建会话',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAiSessions([newSession, ...aiSessions]);
    setCurrentSessionId(newSession.id);
    setShowSessionList(false);
  }, [aiSessions, setAiSessions, setCurrentSessionId, setShowSessionList]);

  // 选择会话
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessionList(false);
  }, [setCurrentSessionId, setShowSessionList]);

  // 删除会话
  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('确定删除此会话？')) return;
    setAiSessions(aiSessions.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [aiSessions, currentSessionId, setAiSessions, setCurrentSessionId]);

  // 选择提示词
  const selectPrompt = useCallback((prompt: PromptEntry) => {
    setChatInput(prompt.content);
    setShowPromptPicker(false);
  }, [setChatInput, setShowPromptPicker]);

  // 复制消息
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  // 引用消息
  const quoteMessage = useCallback((content: string) => {
    setChatInput(chatInput + '\n> ' + content.split('\n').join('\n> ') + '\n');
  }, [chatInput, setChatInput]);

  // 引用当前章节选中的文本
  const quoteSelectedText = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setChatInput(chatInput ? chatInput + '\n> ' + selectedText.split('\n').join('\n> ') + '\n' : '> ' + selectedText.split('\n').join('\n> ') + '\n');
    } else if (currentChapter) {
      const preview = currentChapter.content.slice(0, 200);
      setChatInput(chatInput ? chatInput + '\n> ' + preview.split('\n').join('\n> ') + (currentChapter.content.length > 200 ? '...' : '') + '\n' : '> ' + preview.split('\n').join('\n> ') + (currentChapter.content.length > 200 ? '...' : '') + '\n');
    }
  }, [chatInput, currentChapter, setChatInput]);

  // 辅助函数：将思维导图节点转换为文本
  const mindMapNodeToText = useCallback((node: { title: string; children: any[] }, depth = 0): string => {
    const indent = '  '.repeat(depth);
    let text = `${indent}- ${node.title}`;
    if (node.children && node.children.length > 0) {
      text += '\n' + node.children.map(child => mindMapNodeToText(child, depth + 1)).join('\n');
    }
    return text;
  }, []);

  // 构建系统提示 - 包含所有创作数据
  const buildSystemPrompt = useCallback(() => {
    // 根据 AI 角色选择基础系统提示
    const roleConfig = AI_ROLES[aiRole];
    let prompt = roleConfig.systemPrompt;

    // 添加风格控制指令
    prompt += `\n\n【创作风格要求】`;
    prompt += `\n- 保留度：${stylePreservation}%（${stylePreservation >= 80 ? '高度保留原文风格' : stylePreservation >= 50 ? '适度保留' : '大幅改写'}）`;
    prompt += `\n- 扩写倾向：${expansionLevel === 'conservative' ? '保守（简洁精炼）' : expansionLevel === 'moderate' ? '适中' : '激进（详细展开）'}`;
    prompt += `\n- 内容尺度：${contentRating === 'safe' ? '安全向（适合全年龄）' : contentRating === 'moderate' ? '普通（轻微描写）' : '成熟向'}`;
    prompt += `\n- 文风倾向：${writingStyle}`;

    prompt += '\n\n请基于以下小说设定和资料来提供帮助：';

    // 人物角色
    if (characters.length > 0) {
      prompt += `\n\n【人物角色】（共${characters.length}个）\n`;
      prompt += characters.slice(0, 8).map(c => {
        let charInfo = `- ${c.name}（${c.role || '角色'}）`;
        if (c.age) charInfo += `，年龄：${c.age}`;
        if (c.gender) charInfo += `，性别：${c.gender}`;
        if (c.personality) charInfo += `\n  性格：${c.personality.slice(0, 50)}`;
        if (c.description) charInfo += `\n  描述：${c.description.slice(0, 100)}`;
        if (c.traits && c.traits.length > 0) charInfo += `\n  特点：${c.traits.slice(0, 5).join('、')}`;
        return charInfo;
      }).join('\n');
    }

    // 世界观设定
    if (worldviews.length > 0) {
      prompt += `\n\n【世界观设定】（共${worldviews.length}个）\n`;
      prompt += worldviews.slice(0, 5).map(w => {
        let info = `- ${w.title}（${w.category || '通用'}）`;
        if (w.content) info += `\n  ${w.content.slice(0, 150)}`;
        if (w.magicSystem) info += `\n  力量体系：${w.magicSystem.slice(0, 100)}`;
        return info;
      }).join('\n');
    }

    // 事件线/时间线
    if (timelineEvents.length > 0) {
      prompt += `\n\n【事件线】（共${timelineEvents.length}个事件）\n`;
      prompt += timelineEvents.slice(0, 10).map(e => {
        let info = `- [${e.time}] ${e.title}`;
        if (e.eventType) info += `（${e.eventType}）`;
        if (e.description) info += `\n  ${e.description.slice(0, 100)}`;
        if (e.location) info += `\n  地点：${e.location}`;
        return info;
      }).join('\n');
    }

    // 大纲结构
    if (outlineNodes.length > 0) {
      prompt += `\n\n【大纲结构】（共${outlineNodes.length}个节点）\n`;
      const nodesByType = {
        volume: outlineNodes.filter(n => n.type === 'volume'),
        chapter: outlineNodes.filter(n => n.type === 'chapter'),
        scene: outlineNodes.filter(n => n.type === 'scene'),
        note: outlineNodes.filter(n => n.type === 'note')
      };
      if (nodesByType.volume.length > 0) {
        prompt += '卷：' + nodesByType.volume.slice(0, 5).map(n => n.title).join('、') + '\n';
      }
      if (nodesByType.chapter.length > 0) {
        prompt += '章节大纲：\n' + nodesByType.chapter.slice(0, 8).map(n => {
          let info = `- ${n.title}`;
          if (n.status !== 'planned') info += `（${n.status === 'completed' ? '已完成' : '写作中'}）`;
          if (n.content) info += `：${n.content.slice(0, 80)}`;
          return info;
        }).join('\n');
      }
    }

    // 伏笔追踪
    if (foreshadowings.length > 0) {
      const planted = foreshadowings.filter(f => f.status === 'planted');
      const resolved = foreshadowings.filter(f => f.status === 'resolved');
      prompt += `\n\n【伏笔追踪】（已埋设${planted.length}个，已回收${resolved.length}个）\n`;
      // 优先显示未回收的伏笔
      prompt += planted.slice(0, 6).map(f => {
        let info = `- [待回收] ${f.title}`;
        if (f.importance === 'high') info += '（重要）';
        if (f.description) info += `\n  ${f.description.slice(0, 80)}`;
        if (f.plantedPosition) info += `\n  埋设于：${f.plantedPosition}`;
        return info;
      }).join('\n');
    }

    // 思维导图
    if (mindMaps.length > 0) {
      prompt += `\n\n【思维导图】（共${mindMaps.length}个）\n`;
      prompt += mindMaps.slice(0, 3).map(map => {
        let info = `【${map.name}】\n`;
        info += mindMapNodeToText(map.root, 0);
        return info;
      }).join('\n\n');
    }

    // 语料库/参考资料
    if (references.length > 0) {
      prompt += `\n\n【语料库】（共${references.length}条素材）\n`;
      prompt += references.slice(0, 5).map(r => {
        let info = `- ${r.title}（${r.category || '通用'}）`;
        if (r.content) info += `\n  ${r.content.slice(0, 120)}`;
        return info;
      }).join('\n');
    }

    // 场景/地点
    if (locations.length > 0) {
      prompt += `\n\n【重要场景/地点】（共${locations.length}个）\n`;
      prompt += locations.slice(0, 6).map(l => {
        let info = `- ${l.name}（${l.type || '地点'}）`;
        if (l.region) info += `，位于${l.region}`;
        if (l.description) info += `\n  ${l.description.slice(0, 80)}`;
        return info;
      }).join('\n');
    }

    // 道具/技能
    if (items.length > 0) {
      prompt += `\n\n【道具/技能】（共${items.length}个）\n`;
      const typeNames: Record<string, string> = {
        weapon: '武器', armor: '防具', accessory: '饰品',
        skill: '技能', technique: '功法', artifact: '神器', other: '其他'
      };
      prompt += items.slice(0, 6).map(i => {
        let info = `- ${i.name}（${typeNames[i.type] || i.type}）`;
        if (i.category) info += `[${i.category}]`;
        if (i.description) info += `\n  ${i.description.slice(0, 80)}`;
        if (i.effects) info += `\n  效果：${i.effects.slice(0, 60)}`;
        return info;
      }).join('\n');
    }

    // 当前章节
    if (currentChapter) {
      prompt += `\n\n【当前章节】${currentChapter.title}\n`;
      if (currentChapter.content) {
        const preview = currentChapter.content.slice(-800); // 取最后800字作为上下文
        prompt += `章节内容（最近部分）：\n${preview}${currentChapter.content.length > 800 ? '...' : ''}`;
      } else {
        prompt += '（章节内容为空，正在开始写作）';
      }
    }

    prompt += '\n\n请基于以上设定和资料，帮助作者进行创作。保持设定的一致性，避免与已有内容产生矛盾。';

    return prompt;
  }, [characters, worldviews, timelineEvents, references, outlineNodes, foreshadowings, mindMaps, locations, items, currentChapter, mindMapNodeToText, aiRole, stylePreservation, expansionLevel, contentRating, writingStyle]);

  // 发送消息
  const sendMessage = useCallback(async () => {
    if (!chatInput.trim() || isStreaming) return;
    const text = chatInput.trim();
    setChatInput('');
    setIsStreaming(true);

    let sessionId = currentSessionId;
    let updatedSessions = [...aiSessions];

    // 如果没有当前会话，创建新会话
    if (!sessionId) {
      const newSession: AIChatSession = {
        id: createMessageId(),
        title: text.slice(0, 20) + (text.length > 20 ? '...' : ''),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedSessions = [newSession, ...aiSessions];
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    // 添加用户消息
    const userMessage: AIChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
      createdAt: new Date().toLocaleString(),
    };

    // 创建 AI 回复占位
    const aiMessage: AIChatMessage = {
      id: createMessageId(),
      role: 'ai',
      content: '',
      createdAt: new Date().toLocaleString(),
    };

    // 更新会话
    const sessionsWithMessages = (sessionId === currentSessionId ? aiSessions : updatedSessions).map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          title: s.messages.length === 0 ? text.slice(0, 20) + (text.length > 20 ? '...' : '') : s.title,
          messages: [...s.messages, userMessage, aiMessage],
          updatedAt: new Date().toISOString(),
        };
      }
      return s;
    });
    setAiSessions(sessionsWithMessages);

    let systemPrompt = buildSystemPrompt();
    let searchContext = '';
    let ragContext = '';

    // RAG 记忆检索
    if (ragEnabled && novel?.id) {
      try {
        const ragResults = ragService.searchContext(text, novel.id, 5);
        if (ragResults.length > 0) {
          ragContext = ragService.formatContextForPrompt(ragResults);
          console.log('[AI助手] RAG 检索到', ragResults.length, '条相关记忆');
        }
      } catch (error) {
        console.error('[AI助手] RAG 检索失败:', error);
      }
    }

    // 如果启用联网搜索，先执行搜索
    if (webSearchEnabled) {
      setIsSearching(true);
      try {
        // 提取搜索关键词或直接使用用户输入
        const searchQuery = extractSearchQuery(text) || text;
        console.log('[AI助手] 执行联网搜索:', searchQuery);

        const searchResult = await performWebSearch(searchQuery);
        if (searchResult.success && searchResult.results.length > 0) {
          searchContext = formatSearchResultsAsContext(searchResult.results);
          console.log('[AI助手] 搜索成功，获取到', searchResult.results.length, '条结果');
        }
      } catch (error) {
        console.error('[AI助手] 联网搜索失败:', error);
      } finally {
        setIsSearching(false);
      }
    }

    // 组合最终的提示
    const finalPrompt = ragContext + searchContext + text;
    const options: GenerateOptions = {
      temperature,
      maxTokens: maxTokens,
      systemInstruction: systemPrompt
    };

    try {
      let content = '';
      await generateCreativeContentStream(finalPrompt, (chunk) => {
        content += chunk;
        setAiSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            return {
              ...s,
              messages: s.messages.map((m, idx) =>
                idx === s.messages.length - 1 ? { ...m, content } : m
              ),
            };
          }
          return s;
        }));
      }, selectedModel, options);
    } catch (error) {
      console.error('AI 生成失败:', error);
      setAiSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: s.messages.map((m, idx) =>
              idx === s.messages.length - 1 ? { ...m, content: '抱歉，生成失败，请稍后重试。' } : m
            ),
          };
        }
        return s;
      }));
    } finally {
      setIsStreaming(false);
    }
  }, [chatInput, isStreaming, currentSessionId, aiSessions, selectedModel, temperature, maxTokens, webSearchEnabled, ragEnabled, novel, buildSystemPrompt, setChatInput, setIsStreaming, setCurrentSessionId, setAiSessions, setIsSearching]);

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* 头部 - 会话标题和按钮 */}
      <div className={`px-4 py-3 border-b ${themeClasses.border} flex items-center justify-between`}>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${themeClasses.text} truncate`}>
            {currentSession?.title || '新建会话'}
          </div>
          <div className={`text-xs ${themeClasses.textMuted}`}>
            {currentSession ? formatSessionDate(currentSession.createdAt) : formatSessionDate(new Date().toISOString())}
          </div>
        </div>
        <div className="flex items-center gap-1.5 ml-2">
          <button
            onClick={createNewSession}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            新建
          </button>
          <button
            onClick={() => setShowSessionList(!showSessionList)}
            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
              showSessionList
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                : `${themeClasses.textMuted} ${themeClasses.border} hover:border-indigo-300`
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            列表
          </button>
        </div>
      </div>

      {/* 会话列表侧边栏 */}
      {showSessionList && (
        <div className={`absolute right-0 top-14 w-72 h-[calc(100%-56px)] ${themeClasses.sidebar} border-l ${themeClasses.border} z-10 flex flex-col shadow-lg`}>
          <div className={`p-3 border-b ${themeClasses.border}`}>
            <h3 className={`font-semibold text-sm ${themeClasses.text}`}>历史会话</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {aiSessions.length === 0 ? (
              <p className={`text-center ${themeClasses.textMuted} py-8 text-xs`}>暂无会话记录</p>
            ) : (
              aiSessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session.id)}
                  className={`w-full text-left p-2.5 rounded-xl mb-1 transition-colors group ${
                    currentSessionId === session.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                      : `hover:bg-slate-50 dark:hover:bg-slate-800 ${themeClasses.text}`
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-xs truncate flex-1">{session.title}</p>
                    <button
                      onClick={(e) => deleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className={`text-[10px] ${themeClasses.textMuted} mt-0.5`}>
                    {formatSessionDate(session.updatedAt)} · {session.messages.length} 条消息
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 || (messages.length === 1 && messages[0].id === 'init') ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-8">
            <div className={`w-14 h-14 ${themeClasses.card} rounded-full flex items-center justify-center mb-3 border ${themeClasses.border}`}>
              <svg className={`w-7 h-7 ${themeClasses.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
              </svg>
            </div>
            <h3 className={`text-sm font-semibold ${themeClasses.text} mb-1`}>笔灵助手</h3>
            <p className={`${themeClasses.textMuted} text-xs max-w-[200px]`}>
              我是你的专属创作助手，可以帮助你构思情节、完善人物、润色文笔。
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl p-3 text-sm ${msg.role === 'ai' ? `${themeClasses.card} border ${themeClasses.border} ${themeClasses.text}` : 'bg-indigo-600 text-white ml-8'}`}
            >
              <div className={`text-[10px] ${msg.role === 'ai' ? themeClasses.textMuted : 'text-indigo-200'} mb-1`}>{msg.createdAt}</div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
              {/* AI 消息显示操作按钮 */}
              {msg.role === 'ai' && msg.content && msg.id !== 'init' && (
                <div className={`flex items-center gap-2 mt-3 pt-2 border-t ${themeClasses.border}`}>
                  <button
                    onClick={() => insertToContent(msg.content)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    插入
                  </button>
                  <button
                    onClick={() => copyMessage(msg.content)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs ${themeClasses.border} hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    复制
                  </button>
                  <button
                    onClick={() => quoteMessage(msg.content)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs ${themeClasses.border} hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    引用
                  </button>
                </div>
              )}
            </div>
          ))
        )}
        {isStreaming && (
          <div className={`rounded-2xl p-3 ${themeClasses.card} border ${themeClasses.border}`}>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
              <span className={`text-xs ${themeClasses.textMuted}`}>正在思考...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 底部输入区域 */}
      <div className={`border-t ${themeClasses.border} p-3 space-y-2`}>
        {/* AI 角色切换 */}
        <div className="flex items-center gap-1 mb-2">
          {(Object.keys(AI_ROLES) as Array<keyof typeof AI_ROLES>).map((role) => {
            const config = AI_ROLES[role];
            return (
              <button
                key={role}
                onClick={() => setAiRole(role)}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  aiRole === role
                    ? `${config.color} ${config.bgColor} border border-current`
                    : `${themeClasses.textMuted} hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent`
                }`}
                title={config.description}
              >
                <span>{config.icon}</span>
                <span>{config.name}</span>
              </button>
            );
          })}
          {/* RAG 记忆开关 */}
          <div className="flex-1" />
          <button
            onClick={() => setRagEnabled(!ragEnabled)}
            className={`flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              ragEnabled
                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                : `${themeClasses.textMuted} hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent`
            }`}
            title={ragEnabled ? 'RAG 记忆已开启' : '点击开启 RAG 记忆'}
          >
            <span>{isIndexing ? '📚' : '🧠'}</span>
            <span>{isIndexing ? '索引中' : 'RAG'}</span>
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              className={`p-1.5 rounded-lg ${themeClasses.textMuted} hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
              title="分享会话"
              onClick={() => {
                if (currentSession && currentSession.messages.length > 0) {
                  const content = currentSession.messages.map(m => `${m.role === 'user' ? '我' : 'AI'}: ${m.content}`).join('\n\n');
                  navigator.clipboard.writeText(content);
                  alert('会话内容已复制到剪贴板');
                }
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
            </button>
            <button
              className={`p-1.5 rounded-lg ${themeClasses.textMuted} hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
              title="引用文本 (选中文本后点击，或引用章节内容)"
              onClick={quoteSelectedText}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </button>
            <button
              className={`p-1.5 rounded-lg transition-colors ${
                showAiSettings
                  ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                  : `${themeClasses.textMuted} hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800`
              }`}
              title="AI 设置"
              onClick={() => setShowAiSettings(!showAiSettings)}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {/* 联网搜索开关 */}
            <button
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                webSearchEnabled
                  ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                  : `${themeClasses.textMuted} hover:text-green-500 hover:bg-slate-50 dark:hover:bg-slate-800`
              }`}
              title={webSearchEnabled ? '联网搜索已开启' : '点击开启联网搜索'}
              onClick={() => {
                const newState = !webSearchEnabled;
                setWebSearchEnabled(newState);
                saveSearchSettings({ enabled: newState });
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              {isSearching && (
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptPicker(!showPromptPicker)}
              className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-lg transition-colors ${
                showPromptPicker
                  ? 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                  : `${themeClasses.textMuted} ${themeClasses.border} hover:border-indigo-300`
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              选择提示词
            </button>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`px-2 py-1 text-xs ${themeClasses.input} border rounded-lg`}
            >
              {availableModels.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* AI 设置面板 */}
        {showAiSettings && (
          <div className={`p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium ${themeClasses.text}`}>AI 参数设置</span>
              <button
                onClick={() => setShowAiSettings(false)}
                className={`p-1 rounded ${themeClasses.textMuted} hover:text-slate-600`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs ${themeClasses.textMuted}`}>创意度 (Temperature)</label>
                  <span className={`text-xs font-medium ${themeClasses.text}`}>{temperature}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className={`flex justify-between text-[10px] ${themeClasses.textMuted} mt-0.5`}>
                  <span>保守</span>
                  <span>创意</span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className={`text-xs ${themeClasses.textMuted}`}>最大输出</label>
                  <span className={`text-xs font-medium ${themeClasses.text}`}>
                    {maxTokens === 'unlimited' ? '无限制' : maxTokens}
                  </span>
                </div>
                <select
                  value={maxTokens === 'unlimited' ? 'unlimited' : maxTokens}
                  onChange={(e) => setMaxTokens(e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value))}
                  className={`w-full px-2 py-1.5 text-xs ${themeClasses.input} border rounded-lg`}
                >
                  <option value="unlimited">无限制</option>
                  <option value="1000">1000 tokens</option>
                  <option value="2000">2000 tokens</option>
                  <option value="4000">4000 tokens</option>
                  <option value="8000">8000 tokens</option>
                </select>
              </div>
              {/* 风格控制矩阵 */}
              <div className={`pt-2 border-t ${themeClasses.border}`}>
                <div className={`text-xs font-medium ${themeClasses.text} mb-2`}>风格控制</div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className={`text-xs ${themeClasses.textMuted}`}>保留度</label>
                    <span className={`text-xs font-medium ${themeClasses.text}`}>{stylePreservation}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="5"
                    value={stylePreservation}
                    onChange={(e) => setStylePreservation(parseInt(e.target.value))}
                    className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className={`flex justify-between text-[10px] ${themeClasses.textMuted} mt-0.5`}>
                    <span>大幅改写</span>
                    <span>保留原文</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className={`text-xs ${themeClasses.textMuted} block mb-1`}>扩写倾向</label>
                    <select
                      value={expansionLevel}
                      onChange={(e) => setExpansionLevel(e.target.value as 'conservative' | 'moderate' | 'aggressive')}
                      className={`w-full px-2 py-1 text-xs ${themeClasses.input} border rounded-lg`}
                    >
                      <option value="conservative">保守（精炼）</option>
                      <option value="moderate">适中</option>
                      <option value="aggressive">激进（详细）</option>
                    </select>
                  </div>
                  <div>
                    <label className={`text-xs ${themeClasses.textMuted} block mb-1`}>内容尺度</label>
                    <select
                      value={contentRating}
                      onChange={(e) => setContentRating(e.target.value as 'safe' | 'moderate' | 'mature')}
                      className={`w-full px-2 py-1 text-xs ${themeClasses.input} border rounded-lg`}
                    >
                      <option value="safe">全年龄</option>
                      <option value="moderate">普通</option>
                      <option value="mature">成熟向</option>
                    </select>
                  </div>
                </div>
                <div className="mt-2">
                  <label className={`text-xs ${themeClasses.textMuted} block mb-1`}>文风倾向</label>
                  <input
                    type="text"
                    value={writingStyle}
                    onChange={(e) => setWritingStyle(e.target.value)}
                    placeholder="如：网文轻小说、古典文学、硬科幻..."
                    className={`w-full px-2 py-1 text-xs ${themeClasses.input} border rounded-lg`}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 提示词选择器 */}
        {showPromptPicker && prompts.length > 0 && (
          <div className={`p-2 ${themeClasses.card} rounded-xl border ${themeClasses.border} max-h-32 overflow-y-auto`}>
            <div className="grid grid-cols-2 gap-1.5">
              {prompts.slice(0, 8).map(prompt => (
                <button
                  key={prompt.id}
                  onClick={() => selectPrompt(prompt)}
                  className={`text-left p-2 rounded-lg ${themeClasses.sidebar} border ${themeClasses.border} hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors`}
                >
                  <p className={`text-xs font-medium ${themeClasses.text} truncate`}>{prompt.title}</p>
                  <p className={`text-[10px] ${themeClasses.textMuted} truncate mt-0.5`}>{prompt.content.slice(0, 25)}...</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 输入框 */}
        <textarea
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          rows={2}
          className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${themeClasses.input}`}
          placeholder="输入消息，按 Enter 发送..."
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
          <span>{chatInput.length} / 8000 字</span>
          <button
            className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            onClick={sendMessage}
            disabled={isStreaming || !chatInput.trim()}
          >
            {isStreaming ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                生成中
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                发送
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantChat;
