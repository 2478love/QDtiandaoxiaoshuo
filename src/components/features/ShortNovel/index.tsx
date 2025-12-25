import React, { useState, useEffect, useRef } from 'react';
import { ActivityEntry, ShortWork } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';
import { getApiSettings, getAvailableModels } from '../../../config/apiConfig';
import { createWorkId } from '../../../utils/id';

const ARTICLE_TEMPLATE = `文章主题：\n核心观点：\n目标受众：\n文章风格：\n关键词：`;
const STORY_TEMPLATE = `主角姓名：\n年龄：\n性别：\n题材类型：\n情节设定：\n故事氛围：`;

interface ShortNovelProps {
  works: ShortWork[];
  onSaveWork: React.Dispatch<React.SetStateAction<ShortWork[]>>;
  onRecordActivity?: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;
}

const ShortNovel: React.FC<ShortNovelProps> = ({ works, onSaveWork, onRecordActivity }) => {
  const [mode, setMode] = useState<'article' | 'story'>('article');
  const [title, setTitle] = useState('');
  const [targetWordCount, setTargetWordCount] = useState(1000);
  const [reference, setReference] = useState(ARTICLE_TEMPLATE);

  // 从 API 设置获取当前配置
  const [availableModels, setAvailableModels] = useState(getAvailableModels);
  const [selectedModel, setSelectedModel] = useState(() => {
    const settings = getApiSettings();
    return settings.selectedModel || availableModels[0]?.id || '';
  });

  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastSaved, setLastSaved] = useState('尚未保存');

  // 使用 ref 存储最新的 selectedModel 值，避免闭包问题
  const selectedModelRef = useRef(selectedModel);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // 监听 API 设置变化（只注册一次，使用 ref 获取最新状态）
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = getApiSettings();
      const newModels = getAvailableModels(newSettings);
      setAvailableModels(newModels);
      // 使用 ref 获取最新的 selectedModel 值
      if (!newModels.find(m => m.id === selectedModelRef.current)) {
        setSelectedModel(newSettings.selectedModel || newModels[0]?.id || '');
      }
    };

    // 初始化时也更新一次
    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // 空依赖数组 - 只注册一次

  const wordCount = content.length;
  const paragraphCount = content.split('\n').filter(p => p.trim() !== '').length;
  const readTime = Math.ceil(wordCount / 500);

  const handleTabChange = (newMode: 'article' | 'story') => {
    setMode(newMode);
    setReference(newMode === 'article' ? ARTICLE_TEMPLATE : STORY_TEMPLATE);
  };

  const handleGenerate = async () => {
    if (!title.trim()) return;
    setIsGenerating(true);
    setContent('');
    let produced = '';

    const prompt = `
    任务：撰写一篇${mode === 'article' ? '文章' : '短篇小说'}。
    标题：${title}
    目标字数：${targetWordCount}字左右。
    参考设定：${reference}
    请根据以上要求进行创作。
    `;

    await generateCreativeContentStream(prompt, (chunk) => {
      produced += chunk;
      setContent(prev => prev + chunk);
    }, selectedModel);

    setIsGenerating(false);
    const timestamp = new Date().toLocaleTimeString();
    setLastSaved(timestamp);
    if (produced) {
      const work: ShortWork = {
        id: createWorkId(),
        mode,
        title,
        content: produced,
        wordCount: produced.length,
        model: selectedModel,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onSaveWork(prev => [work, ...prev]);
      onRecordActivity?.({
        type: 'ai_call',
        description: `短文写作《${title}》`,
        deltaPoints: -2,
        metadata: { words: produced.length }
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-[1600px] mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">短文写作</h2>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg transition-colors flex items-center gap-1"
            onClick={() => {
              setTitle('');
              setContent('');
              setReference(mode === 'article' ? ARTICLE_TEMPLATE : STORY_TEMPLATE);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" /></svg>
            新建
          </button>
          <button
            className="px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg transition-colors flex items-center gap-1"
            onClick={() => {
              if (!content.trim()) return;
              const work: ShortWork = {
                id: createWorkId(),
                mode,
                title: title || '未命名作品',
                content,
                wordCount: content.length,
                model: selectedModel,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              onSaveWork(prev => [work, ...prev]);
              setLastSaved(new Date().toLocaleTimeString());
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
            保存作品
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => handleTabChange('article')}
              className={`flex-1 py-4 text-sm font-bold ${mode === 'article' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900' : 'text-slate-500 border-b-2 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              文章模式
            </button>
            <button
              onClick={() => handleTabChange('story')}
              className={`flex-1 py-4 text-sm font-bold ${mode === 'story' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white dark:bg-slate-900' : 'text-slate-500 border-b-2 border-transparent hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              故事模式
            </button>
          </div>

          <div className="p-5 space-y-6">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">标题</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例如：三分钟看懂 AIGC"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">目标字数</label>
              <input
                type="number"
                min={200}
                max={5000}
                step={100}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={targetWordCount}
                onChange={(e) => setTargetWordCount(Number(e.target.value))}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">参考设定</label>
              <textarea
                className="w-full min-h-[140px] px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              ></textarea>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">选择模型</label>
              <div className="space-y-2">
                {availableModels.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full text-left border rounded-xl p-3 transition-all ${selectedModel === model.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-700'}`}
                  >
                    <p className="text-sm font-semibold">{model.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{model.description || ''}</p>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50"
            >
              {isGenerating ? '生成中...' : '开始创作'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="h-14 border-b border-slate-200 dark:border-slate-800 px-8 flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">文章内容</span>
              <span className="ml-3 text-xs text-slate-400 dark:text-slate-500">自动保存 - {lastSaved}</span>
            </div>
          </div>

          <div className="flex-1 relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="开始写作..."
              className="w-full h-full p-8 text-base leading-loose text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 focus:outline-none resize-none placeholder-slate-300 dark:placeholder-slate-600 font-sans"
            ></textarea>
            {content.length === 0 && !isGenerating && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none opacity-50">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </div>
                <p className="text-slate-400 dark:text-slate-500">在左侧配置参数，点击生成按钮开始创作</p>
              </div>
            )}
          </div>

          <div className="h-10 border-t border-slate-100 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/50 flex items-center justify-between px-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-6">
              <span>字数：{wordCount}</span>
              <span>段落：{paragraphCount}</span>
              <span>预计阅读 {readTime} 分钟</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-4">
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3">历史作品</h3>
        {works.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500">暂无保存记录</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {works.slice(0, 6).map(work => (
              <button
                key={work.id}
                onClick={() => {
                  setMode(work.mode);
                  setTitle(work.title);
                  setContent(work.content);
                  setReference(work.mode === 'article' ? ARTICLE_TEMPLATE : STORY_TEMPLATE);
                }}
                className="min-w-[180px] text-left border border-slate-200 dark:border-slate-700 rounded-xl p-3 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors"
              >
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">{work.title}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">{new Date(work.updatedAt).toLocaleString()}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">字数 {work.wordCount}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShortNovel;
