import React, { useState } from 'react';
import { Chapter } from '../../../../types';
import {
  analyzeComprehensive,
  analyzeWritingStyle,
  analyzePlotTension,
  analyzeEmotion,
  type ComprehensiveAnalysis,
  type StyleAnalysis,
  type PlotTensionAnalysis,
  type EmotionAnalysis,
} from '../../../../utils/analyzers';
import {
  SenseRadarChart,
} from '../../AnalysisCharts';

interface AnalysisPanelProps {
  chapter: Chapter | null;
  themeClasses: any;
}

type AnalysisTab = 'comprehensive' | 'style' | 'tension' | 'emotion';

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ chapter, themeClasses }) => {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('comprehensive');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 分析结果缓存
  const [comprehensiveResult, setComprehensiveResult] = useState<ComprehensiveAnalysis | null>(null);
  const [styleResult, setStyleResult] = useState<StyleAnalysis | null>(null);
  const [tensionResult, setTensionResult] = useState<PlotTensionAnalysis | null>(null);
  const [emotionResult, setEmotionResult] = useState<EmotionAnalysis | null>(null);

  // 执行分析
  const handleAnalyze = async () => {
    if (!chapter?.content) return;

    setIsAnalyzing(true);
    try {
      switch (activeTab) {
        case 'comprehensive':
          const compResult = analyzeComprehensive(chapter.content);
          setComprehensiveResult(compResult);
          break;
        case 'style':
          const styleRes = analyzeWritingStyle(chapter.content);
          setStyleResult(styleRes);
          break;
        case 'tension':
          const tensionRes = analyzePlotTension(chapter.content);
          setTensionResult(tensionRes);
          break;
        case 'emotion':
          const emotionRes = analyzeEmotion(chapter.content);
          setEmotionResult(emotionRes);
          break;
      }
    } catch (error) {
      console.error('分析失败:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 清空结果
  const handleClear = () => {
    setComprehensiveResult(null);
    setStyleResult(null);
    setTensionResult(null);
    setEmotionResult(null);
  };

  // 获取评分等级
  const getScoreGrade = (score: number): string => {
    if (score >= 90) return 'S';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  };

  // 获取等级颜色
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'S': return 'text-[#2C5F2D] bg-[#E8F5E8]';
      case 'A': return 'text-[#2C5F2D] bg-[#E8F5E8]';
      case 'B': return 'text-green-600 bg-green-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 获取严重程度颜色
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'major': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'minor': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (!chapter) {
    return (
      <div className={`flex-1 flex items-center justify-center ${themeClasses.textMuted}`}>
        <div className="text-center space-y-2">
          <div className="text-4xl">📊</div>
          <p className="text-sm">请先选择一个章节</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* 标签页 */}
      <div className={`flex border-b ${themeClasses.border} px-4`}>
        {[
          { id: 'comprehensive', label: '综合分析', icon: '🎯' },
          { id: 'style', label: '写作风格', icon: '✍️' },
          { id: 'tension', label: '情节张力', icon: '⚡' },
          { id: 'emotion', label: '情绪曲线', icon: '💓' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AnalysisTab)}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-[#2C5F2D] text-[#2C5F2D]'
                : `border-transparent ${themeClasses.textMuted} hover:text-[#2C5F2D]`
            }`}
          >
            <span className="mr-1">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className={`flex gap-2 p-4 border-b ${themeClasses.border}`}>
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !chapter.content}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-colors ${
            isAnalyzing
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#2C5F2D] text-white hover:bg-[#1E4620]'
          }`}
        >
          {isAnalyzing ? '分析中...' : '开始分析'}
        </button>
        <button
          onClick={handleClear}
          className={`px-4 py-2 rounded-xl text-sm border ${themeClasses.border} hover:border-red-400 transition-colors`}
        >
          清空
        </button>
      </div>

      {/* 分析结果 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* 综合分析 */}
        {activeTab === 'comprehensive' && comprehensiveResult && (
          <div className="space-y-4">
            {/* 综合评分 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>综合评分</h3>
              <div className="text-center">
                <div className="text-6xl font-bold text-[#2C5F2D] mb-2">
                  {comprehensiveResult.overallScore}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-lg font-bold ${getGradeColor(getScoreGrade(comprehensiveResult.overallScore))}`}>
                    {getScoreGrade(comprehensiveResult.overallScore)} 级
                  </span>
                </div>
              </div>
            </div>

            {/* 各维度评分 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>各维度评分</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs w-20 ${themeClasses.textMuted}`}>写作风格</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                      style={{ width: `${comprehensiveResult.style.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-8 text-right ${themeClasses.text}`}>
                    {comprehensiveResult.style.score}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs w-20 ${themeClasses.textMuted}`}>情节张力</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-rose-500 to-orange-500 transition-all"
                      style={{ width: `${comprehensiveResult.tension.overallScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-8 text-right ${themeClasses.text}`}>
                    {comprehensiveResult.tension.overallScore}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs w-20 ${themeClasses.textMuted}`}>情绪表达</span>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-500 to-rose-500 transition-all"
                      style={{ width: `${comprehensiveResult.emotion.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium w-8 text-right ${themeClasses.text}`}>
                    {comprehensiveResult.emotion.score}
                  </span>
                </div>
              </div>
            </div>

            {/* 优先级问题 */}
            {comprehensiveResult.priorities.length > 0 && (
              <div className={`rounded-xl border ${themeClasses.border} p-4`}>
                <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>优先级问题</h3>
                <div className="space-y-2">
                  {comprehensiveResult.priorities.slice(0, 5).map((priority, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border text-xs ${getSeverityColor(priority.severity)}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="font-medium mb-1">{priority.issue}</div>
                          <div className="opacity-75">影响分数: {priority.impact}</div>
                        </div>
                        <span className="font-bold">{priority.area}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 改进建议 */}
            {comprehensiveResult.recommendations.length > 0 && (
              <div className={`rounded-xl border ${themeClasses.border} p-4`}>
                <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>改进建议</h3>
                <div className="space-y-2">
                  {comprehensiveResult.recommendations.map((rec, idx) => (
                    <div key={idx} className={`p-3 rounded-lg bg-[#F0F7F0] border border-[#E8F5E8] text-xs`}>
                      <div className="flex items-start gap-2">
                        <span className="text-[#2C5F2D]">💡</span>
                        <div className="flex-1">
                          <div className="font-medium text-[#1E4620] mb-1">{rec.title}</div>
                          <div className="text-[#1E4620] mb-2">{rec.description}</div>
                          <div className="space-y-1">
                            {rec.actions.map((action, aidx) => (
                              <div key={aidx} className="text-[#2C5F2D]">• {action}</div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 优势 */}
            {comprehensiveResult.strengths.length > 0 && (
              <div className={`rounded-xl border ${themeClasses.border} p-4`}>
                <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>✨ 优势</h3>
                <div className="space-y-1">
                  {comprehensiveResult.strengths.map((strength, idx) => (
                    <div key={idx} className="text-xs text-green-700 bg-green-50 px-3 py-2 rounded">
                      ✓ {strength}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 写作风格 */}
        {activeTab === 'style' && styleResult && (
          <div className="space-y-4">
            {/* 总体评分 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>写作风格评分</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-[#2C5F2D] mb-2">
                  {styleResult.score}
                </div>
                <div className={`text-sm ${themeClasses.textMuted}`}>总体评分</div>
              </div>
            </div>

            {/* 五感雷达图 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>五感描写分析</h3>
              <div className="flex items-center justify-center">
                <SenseRadarChart data={styleResult.senseUsage} />
              </div>
            </div>

            {/* 各项质量评分 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>质量评分</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={themeClasses.textMuted}>对话质量</span>
                    <span className={`font-bold ${themeClasses.text}`}>{styleResult.dialogueQuality}/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#F0F7F0]0 transition-all"
                      style={{ width: `${styleResult.dialogueQuality}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={themeClasses.textMuted}>动作描写</span>
                    <span className={`font-bold ${themeClasses.text}`}>{styleResult.actionQuality}/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${styleResult.actionQuality}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className={themeClasses.textMuted}>场景渲染</span>
                    <span className={`font-bold ${themeClasses.text}`}>{styleResult.sceneQuality}/100</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${styleResult.sceneQuality}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 问题列表 */}
            {styleResult.issues.length > 0 && (
              <div className={`rounded-xl border ${themeClasses.border} p-4`}>
                <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>发现的问题</h3>
                <div className="space-y-2">
                  {styleResult.issues.slice(0, 10).map((issue, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border text-xs ${getSeverityColor(issue.severity)}`}>
                      <div className="font-medium mb-1">{issue.problem}</div>
                      <div className="opacity-75 mb-1">建议: {issue.suggestion}</div>
                      {issue.example && (
                        <div className="text-xs opacity-60 mt-1">示例: {issue.example}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 情节张力 */}
        {activeTab === 'tension' && tensionResult && (
          <div className="space-y-4">
            {/* 总体评分 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>情节张力评分</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-rose-600 mb-2">
                  {tensionResult.overallScore}
                </div>
                <div className={`text-sm ${themeClasses.textMuted}`}>总体评分</div>
              </div>
            </div>

            {/* 冲突强度 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>冲突强度</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={themeClasses.textMuted}>总体强度</span>
                  <span className={`font-bold ${themeClasses.text}`}>{tensionResult.conflict.intensity}/100</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div className="text-center p-2 rounded bg-red-50 border border-red-200">
                    <div className="text-xs text-red-600">人际冲突</div>
                    <div className="text-lg font-bold text-red-700">{tensionResult.conflict.types.interpersonal}</div>
                  </div>
                  <div className="text-center p-2 rounded bg-orange-50 border border-orange-200">
                    <div className="text-xs text-orange-600">环境冲突</div>
                    <div className="text-lg font-bold text-orange-700">{tensionResult.conflict.types.environmental}</div>
                  </div>
                  <div className="text-center p-2 rounded bg-[#F0F7F0] border border-[#E8F5E8]">
                    <div className="text-xs text-[#2C5F2D]">内心冲突</div>
                    <div className="text-lg font-bold text-[#1E4620]">{tensionResult.conflict.types.internal}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 悬念设置 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>悬念设置</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className={themeClasses.textMuted}>悬念评分</span>
                  <span className={`font-bold ${themeClasses.text}`}>{tensionResult.suspense.effectiveness}/100</span>
                </div>
                <div className="text-xs text-gray-600 mt-2">
                  检测到 {tensionResult.suspense.count} 个悬念元素
                </div>
              </div>
            </div>

            {/* 优势与改进 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>分析总结</h3>
              <div className="space-y-3">
                {tensionResult.strengths.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-green-700 mb-1">✨ 优势</div>
                    {tensionResult.strengths.map((s, idx) => (
                      <div key={idx} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded mb-1">
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                {tensionResult.improvements.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-orange-700 mb-1">💡 改进建议</div>
                    {tensionResult.improvements.map((i, idx) => (
                      <div key={idx} className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mb-1">
                        {i}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 情绪曲线 */}
        {activeTab === 'emotion' && emotionResult && (
          <div className="space-y-4">
            {/* 总体评分 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>情绪表达评分</h3>
              <div className="text-center">
                <div className="text-5xl font-bold text-pink-600 mb-2">
                  {emotionResult.score}
                </div>
                <div className={`text-sm ${themeClasses.textMuted}`}>总体评分</div>
              </div>
            </div>

            {/* 情绪指标 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>情绪指标</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded bg-[#F0F7F0] border border-[#E8F5E8]">
                  <div className="text-xs text-[#2C5F2D]">共鸣度</div>
                  <div className="text-2xl font-bold text-[#1E4620]">{emotionResult.resonance}</div>
                </div>
                <div className="text-center p-3 rounded bg-green-50 border border-green-200">
                  <div className="text-xs text-green-600">平衡度</div>
                  <div className="text-2xl font-bold text-green-700">{emotionResult.balance}</div>
                </div>
              </div>
            </div>

            {/* 优势与改进 */}
            <div className={`rounded-xl border ${themeClasses.border} p-4`}>
              <h3 className={`text-sm font-semibold mb-3 ${themeClasses.text}`}>分析总结</h3>
              <div className="space-y-3">
                {emotionResult.strengths.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-green-700 mb-1">✨ 优势</div>
                    {emotionResult.strengths.map((s, idx) => (
                      <div key={idx} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded mb-1">
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                {emotionResult.improvements.length > 0 && (
                  <div>
                    <div className="text-xs font-medium text-orange-700 mb-1">💡 改进建议</div>
                    {emotionResult.improvements.map((i, idx) => (
                      <div key={idx} className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded mb-1">
                        {i}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 无结果提示 */}
        {!comprehensiveResult && !styleResult && !tensionResult && !emotionResult && (
          <div className={`flex-1 flex items-center justify-center ${themeClasses.textMuted}`}>
            <div className="text-center space-y-2">
              <div className="text-4xl">📊</div>
              <p className="text-sm">点击"开始分析"查看结果</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisPanel;
