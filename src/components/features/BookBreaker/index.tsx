import React, { useState } from 'react';
import { ActivityEntry } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';

const ANALYSIS_TYPES = [
  {
    id: 'chapter_summary',
    label: '章节拆解',
    desc: '提炼核心剧情，生成单章细纲，帮助快速复盘章节结构。',
    icon: '📝'
  },
  {
    id: 'character_analysis',
    label: '人物分析',
    desc: '梳理角色性格、动机与关系发展，让人物成长脉络清晰可见。',
    icon: '👥'
  },
  {
    id: 'outline_extraction',
    label: '大纲反推',
    desc: '根据正文反向推导故事大纲与节奏，辅助制定后续剧情计划。',
    icon: '🧬'
  },
  {
    id: 'style_analysis',
    label: '风格分析',
    desc: '分析文笔风格、遣词造句与情感走向，找到作品的表达特色。',
    icon: '🎨'
  }
];

interface BookBreakerProps {
  onRecordActivity?: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;
}

const BookBreaker: React.FC<BookBreakerProps> = ({ onRecordActivity }) => {
  const [inputType, setInputType] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [selectedType, setSelectedType] = useState(ANALYSIS_TYPES[0].id);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState('');
  const [fileName, setFileName] = useState('');

  const inputCount = inputText.length;

  const handleAnalyze = async () => {
    if (!inputText.trim()) return;
    setIsAnalyzing(true);
    setResult('');

    const typeLabel = ANALYSIS_TYPES.find(t => t.id === selectedType)?.label;

    const prompt = `
    任务：你是一位专业的网文编辑和文学评论家。请对以下文本进行【${typeLabel}】。
    要求：
    1. 保持客观、专业的分析口吻。
    2. 输出格式清晰，使用 Markdown（标题、列表等）。
    3. 如果是章节拆解，请按"核心事件""出场人物""伏笔细节"进行归纳。
    4. 如果是人物分析，请提取"性格标签""核心动力""人物关系"。
    5. 如果是大纲反推，请划分"起承转合"的结构。

    待分析文本：
    ${inputText.slice(0, 10000)} ${inputText.length > 10000 ? '...(文本过长已截断)' : ''}
    `;

    await generateCreativeContentStream(prompt, (chunk) => {
      setResult(prev => prev + chunk);
    });

    setIsAnalyzing(false);
    onRecordActivity?.({
      type: 'ai_call',
      description: `拆书助手完成一次${typeLabel}`,
      deltaPoints: -1,
      metadata: { words: inputText.length }
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setInputText(text || '');
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-[1600px] mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-300">
      <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0 0L12 12m0 0l7-7" /></svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">拆书工具</h2>
          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">Beta</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[450px] border-r border-slate-200 dark:border-slate-800 bg-[#fbfcfd] dark:bg-slate-900/50 flex flex-col shrink-0 overflow-hidden">
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setInputType('text')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${inputType === 'text' ? 'text-pink-600 dark:text-pink-400 border-pink-600 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              文本输入
            </button>
            <button
              onClick={() => setInputType('file')}
              className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${inputType === 'file' ? 'text-pink-600 dark:text-pink-400 border-pink-600 bg-white dark:bg-slate-800' : 'text-slate-500 dark:text-slate-400 border-transparent hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              文件上传
            </button>
          </div>

          <div className="flex-1 flex flex-col p-5 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">分析模式</label>
              <div className="grid grid-cols-2 gap-3">
                {ANALYSIS_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`text-left p-3 rounded-xl border transition-all ${selectedType === type.id ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-500 ring-1 ring-pink-500' : 'border-slate-200 dark:border-slate-700 hover:border-pink-300 dark:hover:border-pink-700 hover:bg-white dark:hover:bg-slate-800 bg-white dark:bg-slate-800'}`}
                  >
                    <div className="text-xl mb-1">{type.icon}</div>
                    <div className={`font-bold text-sm ${selectedType === type.id ? 'text-pink-900 dark:text-pink-300' : 'text-slate-700 dark:text-slate-300'}`}>{type.label}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-tight">{type.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {inputType === 'text' ? (
              <div className="flex-1 flex flex-col min-h-[200px]">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">输入正文</label>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{inputCount} 字符</span>
                </div>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="粘贴需要拆解的章节或文章..."
                  className="flex-1 resize-none rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                ></textarea>
              </div>
            ) : (
              <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center">
                <input type="file" accept=".txt,.md,.csv" className="hidden" id="file-upload" onChange={handleFileUpload} />
                <label htmlFor="file-upload" className="cursor-pointer text-sm text-pink-600 dark:text-pink-400">点击上传文本文件</label>
                {fileName && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{fileName}</p>}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="w-full py-3.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-pink-200 dark:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98] mt-4"
            >
              {isAnalyzing ? '智能拆解中...' : '开始分析'}
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white dark:bg-slate-900">
          <div className="h-12 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              分析结果
              {result && <span className="text-xs font-normal text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">AI 生成</span>}
            </span>
          </div>

          <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-slate-900 relative">
            {result ? (
              <article className="prose prose-slate dark:prose-invert prose-pink max-w-none prose-headings:font-bold prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-li:text-slate-600 dark:prose-li:text-slate-300">
                {result.split('\n').map((line, idx) => (
                  <div key={idx}>{line === '' ? <br /> : <p>{line}</p>}</div>
                ))}
                {isAnalyzing && <span className="inline-block w-2 h-5 bg-pink-500 ml-1 animate-pulse"></span>}
              </article>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 select-none opacity-60">
                <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                </div>
                <h4 className="text-xl font-medium text-slate-400 dark:text-slate-500 mb-2">等待内容输入</h4>
                <p className="text-sm max-w-xs text-center text-slate-400 dark:text-slate-500 leading-relaxed">
                  请在左侧输入需要拆解的文本，选择分析模式后点击"开始分析"。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookBreaker;
