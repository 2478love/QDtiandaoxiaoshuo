/**
 * 工具函数统一导出
 * 
 * 提供所有分析工具的便捷访问
 */

// 写作风格增强器
export {
  analyzeWritingStyle,
  analyzeDialogueQuality,
  analyzeActionQuality,
  analyzeSceneQuality,
  analyzeSenseUsage,
  generateEnhancementPrompt,
  generateStyleReport,
  type StyleAnalysis,
  type WritingIssue,
  type EnhancementOptions,
} from './writingStyleEnhancer';

// 情节张力分析器
export {
  analyzePlotTension,
  analyzeConflict,
  analyzeSuspense,
  analyzeTwist,
  analyzeClimax,
  analyzePacing,
  generateTensionReport,
  generateTensionPrompt,
  type PlotTensionAnalysis,
  type ConflictAnalysis,
  type SuspenseAnalysis,
  type TwistAnalysis,
  type ClimaxAnalysis,
  type PacingAnalysis,
  type TensionIssue,
} from './plotTensionAnalyzer';

// 情绪曲线追踪器
export {
  analyzeEmotion,
  detectEmotionPoints,
  analyzeEmotionCurve,
  analyzeEmotionDistribution,
  calculateResonance,
  calculateBalance,
  generateEmotionReport,
  generateEmotionPrompt,
  type EmotionAnalysis,
  type EmotionPoint,
  type EmotionCurve,
  type EmotionDistribution,
  type EmotionType,
} from './emotionAnalyzer';

// 综合分析工具
export {
  analyzeComprehensive,
  generateComprehensiveReport,
  generateComprehensivePrompt,
  type ComprehensiveAnalysis,
  type Priority,
  type Recommendation,
} from './comprehensiveAnalyzer';

// 人物塑造评估器
export {
  extractCharacters,
  checkConsistency,
  analyzeDialogueStyle,
  analyzeMotivation,
  analyzeGrowth,
  analyzeCharacters,
  generateCharacterReport,
  generateCharacterPrompt,
  type CharacterProfile,
  type CharacterAppearance,
  type CharacterDialogue,
  type CharacterAction,
  type ConsistencyIssue,
  type DialogueStyle,
  type MotivationChain,
  type CharacterGrowth,
  type GrowthStage,
  type CharacterAnalysis,
} from './characterAnalyzer';

// 网文能力分析器（如果存在）
export type {
  WebNovelPattern,
  ChapterStructure,
  PlotArc,
  CoolPoint,
  WebNovelAnalysis,
} from './webNovelAnalyzer';

// 章节摘要生成器
export {
  generateChapterSummary,
  batchGenerateSummaries,
  extractKeyCharacters,
  extractKeyEvents,
  extractKeyLocations,
  analyzeEmotionalTone,
  generateBriefSummary,
  generateDetailedSummary,
  generatePlotTags,
  formatSummaryAsText,
  formatSummaryAsMarkdown,
  formatSummaryForRAG,
  type ChapterSummary,
  type SummaryGenerationOptions,
} from './chapterSummaryGenerator';

// 批量精修流水线
export {
  createRefinementTask,
  createRefinementPipeline,
  getStagePrompt,
  getStageName,
  updateTaskStatus,
  completeTaskStage,
  updatePipelineProgress,
  getNextTask,
  pausePipeline,
  resumePipeline,
  stopPipeline,
  retryFailedTasks,
  generatePipelineReport,
  exportRefinementResults,
  DEFAULT_REFINEMENT_PROMPTS,
  type RefinementStage,
  type RefinementTask,
  type RefinementPipeline,
  type RefinementOptions,
  type RefinementPromptConfig,
} from './batchRefinementPipeline';

// 内容检查器（如果存在）
// export { ... } from './contentChecker';

// AI优化器（如果存在）
// export { ... } from './aiOptimizer';
