import React, { useState } from 'react';
import { ContinueWritingService, ContinueResult, ContinueOptions } from '../../services/ai/ContinueWritingService';

interface ContinueWritingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  context: string;
  onApply: (text: string) => void;
}

export const ContinueWritingPanel: React.FC<ContinueWritingPanelProps> = ({
  isOpen,
  onClose,
  context,
  onApply
}) => {
  const [style, setStyle] = useState<ContinueOptions['style']>('plot');
  const [length, setLength] = useState(200);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults] = useState<ContinueResult[]>([]);

  const styles = ContinueWritingService.getAllStyles();

  // 生成续写方案
  const handleGenerate = async () => {
    if (!context.trim()) {
      alert('请先输入一些内容作为上下文');
      return;
    }

    setIsGenerating(true);
    setResults([]);

    try {
      const options: ContinueOptions = {
        style,
        length,
        count: 3
      };

      const generatedResults = await ContinueWritingService.generateMultiple(context, options);
      setResults(generatedResults);
    } catch (error) {
      console.error('生成失败:', error);
      alert('生成失败，请稍后重试');
    } finally {
      setIsGenerating(false);
    }
  };

  // 应用方案
  const handleApply = (result: ContinueResult) => {
    onApply(result.text);
    onClose();
  };

  // 重新生成单个方案
  const handleRegenerate = async (index: number) => {
    setIsGenerating(true);

    try {
      const options: ContinueOptions = {
        style,
        length,
        count: 1
      };

      const newResults = await ContinueWritingService.generateMultiple(context, options);
      if (newResults.length > 0) {
        const updatedResults = [...results];
        updatedResults[index] = newResults[0];
        setResults(updatedResults);
      }
    } catch (error) {
      console.error('重新生成失败:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[1200px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#F0F7F0] to-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">✨ 智能续写</h2>
            <span className="text-sm text-slate-400">多方案对比</span>
          </div>
          <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 控制面板 */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* 风格选择 */}
            <div>
              <label className="text-sm text-slate-600 mb-2 block font-medium">续写风格</label>
              <div className="grid grid-cols-2 gap-2">
                {styles.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setStyle(s.id)}
                    disabled={isGenerating}
                    className={`px-4 py-3 rounded-lg border-2 transition-all text-left ${
                      style === s.id
                        ? 'border-[#2C5F2D] bg-[#F0F7F0] text-[#2C5F2D]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{s.icon}</span>
                      <span className="font-semibold text-sm">{s.label}</span>
                    </div>
                    <p className="text-xs opacity-75">{s.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* 长度控制 */}
            <div>
              <label className="text-sm text-slate-600 mb-2 block font-medium">续写字数</label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="50"
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  disabled={isGenerating}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#2C5F2D]"
                />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">50 字</span>
                  <div className="px-3 py-1 bg-[#2C5F2D] text-white text-sm font-semibold rounded-lg">
                    {length} 字
                  </div>
                  <span className="text-xs text-slate-500">500 字</span>
                </div>
                <div className="flex gap-2">
                  {[100, 200, 300].map(preset => (
                    <button
                      key={preset}
                      onClick={() => setLength(preset)}
                      disabled={isGenerating}
                      className={`flex-1 px-3 py-1.5 text-xs rounded border transition-colors ${
                        length === preset
                          ? 'border-[#2C5F2D] bg-[#F0F7F0] text-[#2C5F2D]'
                          : 'border-slate-200 text-slate-600 hover:border-slate-300'
                      } disabled:opacity-50`}
                    >
                      {preset}字
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !context.trim()}
            className="w-full px-6 py-3 bg-[#2C5F2D] text-white font-semibold rounded-lg hover:bg-[#1E4620] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>生成中...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>生成 3 个续写方案</span>
              </>
            )}
          </button>
        </div>

        {/* 结果展示 */}
        <div className="flex-1 overflow-y-auto p-6">
          {results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg className="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p className="text-sm mb-2">选择风格和字数，点击生成按钮</p>
              <p className="text-xs text-slate-400">AI 将为您生成 3 个不同的续写方案</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-[#97BC62] transition-all group"
                >
                  {/* 方案头部 */}
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 bg-[#2C5F2D] text-white text-xs font-bold rounded">
                        方案 {index + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">⭐</span>
                        <span className="text-sm font-semibold text-slate-700">{result.score}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRegenerate(index)}
                      disabled={isGenerating}
                      className="text-slate-400 hover:text-[#2C5F2D] disabled:opacity-50"
                      title="重新生成"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  </div>

                  {/* 方案内容 */}
                  <div className="p-4">
                    <div className="text-sm text-slate-700 leading-relaxed mb-4 max-h-[300px] overflow-y-auto">
                      {result.text}
                    </div>

                    {/* 统计信息 */}
                    <div className="flex items-center justify-between text-xs text-slate-500 mb-3 pb-3 border-b border-slate-100">
                      <span>{result.length} 字</span>
                      <span className="px-2 py-0.5 bg-slate-100 rounded">
                        {styles.find(s => s.id === result.style)?.label}
                      </span>
                    </div>

                    {/* 操作按钮 */}
                    <button
                      onClick={() => handleApply(result)}
                      className="w-full px-4 py-2.5 bg-[#2C5F2D] text-white text-sm font-medium rounded-lg hover:bg-[#1E4620] transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>使用此方案</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 提示信息 */}
        {results.length > 0 && (
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>评分基于连贯性、完整性和创意性综合评估。点击方案卡片右上角可重新生成单个方案。</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContinueWritingPanel;
