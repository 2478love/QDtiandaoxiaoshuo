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
  checkConsistency as checkCharacterStyleConsistency,
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
  CoolPoint as WebNovelCoolPoint,
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

// 质量趋势分析器
export {
  calculateTrend,
  analyzeQualityTrend,
  generateTrendReport,
  getTrendName,
  exportTrendDataAsCSV,
  calculateMovingAverage,
  predictFutureTrend,
  type QualityScore,
  type QualityTrend,
  type QualityTrendAnalysis,
} from './qualityTrendAnalyzer';

// 虚拟滚动工具
export {
  calculateVirtualScrollState,
  getVisibleIndices,
  calculateTotalHeight,
  isIndexVisible,
  shouldRenderIndex,
  scrollToIndex,
  getIndexAtPosition,
  VirtualScrollManager,
  createVirtualScrollManager,
  throttleScroll,
  DynamicVirtualScrollManager,
  type VirtualScrollConfig,
  type VirtualScrollState,
  type DynamicHeightItem,
} from './virtualScroll';

// 分层记忆系统
export {
  LayeredMemorySystem,
  extractMemoryFromChapter,
  type CoreMemory,
  type CharacterInfo,
  type WorldSetting,
  type PlotPoint,
  type PowerSystemInfo,
  type RecentMemory,
  type LongTermMemory,
  type MemoryQuery,
  type MemorySearchResult,
} from './layeredMemorySystem';

// 一致性检查器
export {
  checkCharacterConsistency,
  checkWorldConsistency,
  checkTimelineConsistency,
  checkConsistency,
  generateConsistencyReport,
  type ConsistencyCheckResult,
  type CharacterConsistencyResult,
  type CharacterConsistencyInfo,
  type CharacterIssue,
  type WorldConsistencyResult,
  type PowerSystemConsistency,
  type GeographyConsistency,
  type LocationInfo,
  type RuleConsistency,
  type WorldIssue,
  type TimelineConsistencyResult,
  type TimelineEvent,
  type TimelineIssue,
  type Conflict,
  type Warning,
  type ChapterData,
} from './consistencyChecker';

// 批量大纲生成器
export {
  generateBatchOutline,
  adjustOutline,
  optimizeOutline,
  exportOutlineAsText,
  exportOutlineAsJSON,
  type OutlineGenerationOptions,
  type ChapterOutline,
  type PlotType,
  type CoolPoint,
  type OutlineStructure,
  type Arc,
} from './batchOutlineGenerator';

// 质量预警系统
export {
  QualityAlertSystem,
  createQualityMetrics,
  DEFAULT_THRESHOLDS,
  type QualityAlert,
  type QualityMetrics,
  type AlertThresholds,
  type AlertSystemConfig,
} from './qualityAlertSystem';

// 灵感生成器
export {
  generateNextStepIdeas,
  generateRandomEvent,
  generateConflict,
  generateTwist,
  generateDialogueIdea,
  generateSceneIdea,
  generateInspirationBatch,
  filterInspirationsByTags,
  sortByImpact,
  sortByDifficulty,
  type InspirationOptions,
  type Inspiration,
  type ConflictInspiration,
  type TwistInspiration,
} from './inspirationGenerator';

// 节奏建议系统
export {
  analyzePacing,
  analyzeCoolPointDistribution,
  analyzeEmotionCurve,
  suggestNextChapterPacing,
  generatePacingReport,
  type PacingAnalysis,
  type PacingIssue,
  type PacingRecommendation,
  type CoolPointDistributionAnalysis,
  type EmotionCurveAnalysis,
  type ChapterPacingData,
} from './pacingSuggestionSystem';

// 内容检查器（如果存在）
// export { ... } from './contentChecker';

// AI优化器（如果存在）
// export { ... } from './aiOptimizer';
