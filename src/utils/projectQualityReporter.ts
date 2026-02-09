/**
 * 项目质量报告生成器 - 生成项目整体质量报告
 * 
 * 核心能力：
 * 1. 统计项目各项指标
 * 2. 生成质量评分
 * 3. 识别潜在问题
 * 4. 提供改进建议
 */

import type { Novel, Chapter } from '../types';

// ============ 类型定义 ============

export interface ProjectQualityReport {
  overall: {
    score: number; // 0-100
    grade: 'S' | 'A' | 'B' | 'C' | 'D';
    summary: string;
  };
  statistics: {
    totalWords: number;
    totalChapters: number;
    avgChapterWords: number;
    completionRate: number;
    writingDays: number;
    avgWordsPerDay: number;
  };
  quality: {
    consistency: number; // 一致性评分
    completeness: number; // 完整性评分
    balance: number; // 平衡性评分
  };
  issues: ProjectIssue[];
  recommendations: ProjectRecommendation[];
  strengths: string[];
  weaknesses: string[];
}

export interface ProjectIssue {
  type: 'critical' | 'warning' | 'info';
  category: string;
  description: string;
  affectedChapters?: string[];
  suggestion: string;
}

export interface ProjectRecommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImprovement: string;
  effort: 'low' | 'medium' | 'high';
}

// ============ 质量分析 ============

/**
 * 生成项目质量报告
 */
export function generateProjectQualityReport(novel: Novel): ProjectQualityReport {
  const chapters = novel.chapters || [];
  
  // 统计信息
  const statistics = calculateStatistics(chapters);
  
  // 质量评分
  const quality = calculateQuality(novel, chapters);
  
  // 识别问题
  const issues = identifyIssues(novel, chapters, statistics);
  
  // 生成建议
  const recommendations = generateRecommendations(issues, statistics, quality);
  
  // 识别优势和弱点
  const strengths = identifyStrengths(statistics, quality);
  const weaknesses = identifyWeaknesses(issues, quality);
  
  // 计算总体评分
  const overallScore = calculateOverallScore(statistics, quality, issues);
  const grade = getGrade(overallScore);
  const summary = generateSummary(overallScore, statistics, quality);
  
  return {
    overall: {
      score: overallScore,
      grade,
      summary,
    },
    statistics,
    quality,
    issues,
    recommendations,
    strengths,
    weaknesses,
  };
}

/**
 * 计算统计信息
 */
function calculateStatistics(chapters: Chapter[]): ProjectQualityReport['statistics'] {
  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const totalChapters = chapters.length;
  const avgChapterWords = totalChapters > 0 ? Math.floor(totalWords / totalChapters) : 0;
  
  // 简化的完成率计算（基于字数）
  const targetWords = 100000; // 假设目标10万字
  const completionRate = Math.min(100, Math.floor((totalWords / targetWords) * 100));
  
  // 简化的写作天数（假设）
  const writingDays = Math.ceil(totalChapters / 2); // 假设每天写2章
  const avgWordsPerDay = writingDays > 0 ? Math.floor(totalWords / writingDays) : 0;
  
  return {
    totalWords,
    totalChapters,
    avgChapterWords,
    completionRate,
    writingDays,
    avgWordsPerDay,
  };
}

/**
 * 计算质量评分
 */
function calculateQuality(
  novel: Novel,
  chapters: Chapter[]
): ProjectQualityReport['quality'] {
  // 一致性：章节字数的标准差
  const avgWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0) / chapters.length;
  const variance = chapters.reduce((sum, ch) => sum + Math.pow(ch.wordCount - avgWords, 2), 0) / chapters.length;
  const stdDev = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - (stdDev / avgWords) * 100);
  
  // 完整性：基于是否有人物、世界观等设定
  let completeness = 50; // 基础分
  if (novel.characters && novel.characters.length > 0) completeness += 10;
  if (novel.worldviews && novel.worldviews.length > 0) completeness += 10;
  if (novel.timelineEvents && novel.timelineEvents.length > 0) completeness += 10;
  if (novel.outlineNodes && novel.outlineNodes.length > 0) completeness += 10;
  if (novel.foreshadowings && novel.foreshadowings.length > 0) completeness += 10;
  
  // 平衡性：章节分布的均匀程度
  const balance = calculateBalance(chapters);
  
  return {
    consistency: Math.floor(consistency),
    completeness: Math.floor(completeness),
    balance: Math.floor(balance),
  };
}

/**
 * 计算平衡性
 */
function calculateBalance(chapters: Chapter[]): number {
  if (chapters.length === 0) return 0;
  
  // 检查章节字数分布
  const wordCounts = chapters.map(ch => ch.wordCount);
  const min = Math.min(...wordCounts);
  const max = Math.max(...wordCounts);
  const range = max - min;
  const avg = wordCounts.reduce((a, b) => a + b, 0) / wordCounts.length;
  
  // 范围越小，平衡性越好
  const balanceScore = Math.max(0, 100 - (range / avg) * 50);
  
  return balanceScore;
}

/**
 * 识别问题
 */
function identifyIssues(
  novel: Novel,
  chapters: Chapter[],
  statistics: ProjectQualityReport['statistics']
): ProjectIssue[] {
  const issues: ProjectIssue[] = [];
  
  // 检查章节数量
  if (chapters.length === 0) {
    issues.push({
      type: 'critical',
      category: '内容',
      description: '项目中没有任何章节',
      suggestion: '开始创作第一章',
    });
  } else if (chapters.length < 3) {
    issues.push({
      type: 'warning',
      category: '内容',
      description: '章节数量较少',
      suggestion: '继续创作，建议至少完成3章以上',
    });
  }
  
  // 检查平均字数
  if (statistics.avgChapterWords < 1000) {
    issues.push({
      type: 'warning',
      category: '字数',
      description: '平均章节字数偏少',
      suggestion: '建议每章至少2000字以上',
    });
  } else if (statistics.avgChapterWords > 5000) {
    issues.push({
      type: 'info',
      category: '字数',
      description: '平均章节字数较多',
      suggestion: '考虑是否需要拆分章节',
    });
  }
  
  // 检查字数差异
  const wordCounts = chapters.map(ch => ch.wordCount);
  const min = Math.min(...wordCounts);
  const max = Math.max(...wordCounts);
  if (max > min * 3) {
    const shortChapters = chapters.filter(ch => ch.wordCount < statistics.avgChapterWords * 0.5);
    issues.push({
      type: 'warning',
      category: '一致性',
      description: '章节字数差异较大',
      affectedChapters: shortChapters.map(ch => ch.title),
      suggestion: '检查字数过少的章节，考虑补充内容',
    });
  }
  
  // 检查设定完整性
  if (!novel.characters || novel.characters.length === 0) {
    issues.push({
      type: 'info',
      category: '设定',
      description: '缺少人物设定',
      suggestion: '添加主要人物的设定，有助于保持角色一致性',
    });
  }
  
  if (!novel.worldviews || novel.worldviews.length === 0) {
    issues.push({
      type: 'info',
      category: '设定',
      description: '缺少世界观设定',
      suggestion: '添加世界观设定，有助于构建完整的故事世界',
    });
  }
  
  return issues;
}

/**
 * 生成建议
 */
function generateRecommendations(
  issues: ProjectIssue[],
  statistics: ProjectQualityReport['statistics'],
  quality: ProjectQualityReport['quality']
): ProjectRecommendation[] {
  const recommendations: ProjectRecommendation[] = [];
  
  // 基于问题生成建议
  const criticalIssues = issues.filter(i => i.type === 'critical');
  if (criticalIssues.length > 0) {
    recommendations.push({
      priority: 'high',
      title: '解决关键问题',
      description: '项目存在关键问题需要立即处理',
      expectedImprovement: '确保项目基本可用',
      effort: 'high',
    });
  }
  
  // 基于统计数据生成建议
  if (statistics.totalWords < 10000) {
    recommendations.push({
      priority: 'high',
      title: '增加内容量',
      description: '当前总字数较少，建议继续创作',
      expectedImprovement: '提升项目完整度',
      effort: 'high',
    });
  }
  
  // 基于质量评分生成建议
  if (quality.consistency < 70) {
    recommendations.push({
      priority: 'medium',
      title: '提升一致性',
      description: '章节字数差异较大，建议保持相对一致',
      expectedImprovement: '提升阅读体验',
      effort: 'medium',
    });
  }
  
  if (quality.completeness < 70) {
    recommendations.push({
      priority: 'medium',
      title: '完善设定',
      description: '补充人物、世界观等设定',
      expectedImprovement: '提升故事深度',
      effort: 'medium',
    });
  }
  
  // 通用建议
  recommendations.push({
    priority: 'low',
    title: '使用智能分析',
    description: '定期使用智能分析工具检查章节质量',
    expectedImprovement: '及时发现和改进问题',
    effort: 'low',
  });
  
  return recommendations;
}

/**
 * 识别优势
 */
function identifyStrengths(
  statistics: ProjectQualityReport['statistics'],
  quality: ProjectQualityReport['quality']
): string[] {
  const strengths: string[] = [];
  
  if (statistics.totalWords > 50000) {
    strengths.push('内容量充足，已完成大量创作');
  }
  
  if (statistics.avgChapterWords >= 2000 && statistics.avgChapterWords <= 4000) {
    strengths.push('章节字数适中，符合网文标准');
  }
  
  if (quality.consistency >= 80) {
    strengths.push('章节长度一致性好，阅读体验流畅');
  }
  
  if (quality.completeness >= 80) {
    strengths.push('设定完整，故事世界构建完善');
  }
  
  if (quality.balance >= 80) {
    strengths.push('内容分布均衡，节奏把控良好');
  }
  
  if (strengths.length === 0) {
    strengths.push('项目已启动，继续加油！');
  }
  
  return strengths;
}

/**
 * 识别弱点
 */
function identifyWeaknesses(
  issues: ProjectIssue[],
  quality: ProjectQualityReport['quality']
): string[] {
  const weaknesses: string[] = [];
  
  const criticalCount = issues.filter(i => i.type === 'critical').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  
  if (criticalCount > 0) {
    weaknesses.push(`存在 ${criticalCount} 个关键问题需要解决`);
  }
  
  if (warningCount > 0) {
    weaknesses.push(`存在 ${warningCount} 个警告需要关注`);
  }
  
  if (quality.consistency < 60) {
    weaknesses.push('章节一致性较差，需要改进');
  }
  
  if (quality.completeness < 60) {
    weaknesses.push('设定不够完整，建议补充');
  }
  
  if (quality.balance < 60) {
    weaknesses.push('内容分布不均衡，需要调整');
  }
  
  return weaknesses;
}

/**
 * 计算总体评分
 */
function calculateOverallScore(
  statistics: ProjectQualityReport['statistics'],
  quality: ProjectQualityReport['quality'],
  issues: ProjectIssue[]
): number {
  let score = 50; // 基础分
  
  // 内容量加分（最多20分）
  const wordScore = Math.min(20, (statistics.totalWords / 100000) * 20);
  score += wordScore;
  
  // 质量加分（最多30分）
  const qualityScore = (quality.consistency + quality.completeness + quality.balance) / 3 * 0.3;
  score += qualityScore;
  
  // 问题扣分
  const criticalCount = issues.filter(i => i.type === 'critical').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  score -= criticalCount * 10;
  score -= warningCount * 5;
  
  return Math.max(0, Math.min(100, Math.floor(score)));
}

/**
 * 获取等级
 */
function getGrade(score: number): 'S' | 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'S';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

/**
 * 生成总结
 */
function generateSummary(
  score: number,
  statistics: ProjectQualityReport['statistics'],
  quality: ProjectQualityReport['quality']
): string {
  const grade = getGrade(score);
  const parts: string[] = [];
  
  parts.push(`项目整体质量评级为 ${grade} 级（${score}分）。`);
  parts.push(`当前已完成 ${statistics.totalChapters} 章，共 ${statistics.totalWords} 字。`);
  
  if (score >= 80) {
    parts.push('项目质量优秀，继续保持！');
  } else if (score >= 60) {
    parts.push('项目质量良好，还有提升空间。');
  } else {
    parts.push('项目需要改进，建议关注质量问题。');
  }
  
  return parts.join(' ');
}

/**
 * 导出报告为 Markdown
 */
export function exportReportAsMarkdown(report: ProjectQualityReport): string {
  const lines: string[] = [];
  
  lines.push('# 项目质量报告\n');
  
  // 总体评分
  lines.push(`## 总体评分\n`);
  lines.push(`**等级：** ${report.overall.grade} 级`);
  lines.push(`**分数：** ${report.overall.score}/100`);
  lines.push(`**总结：** ${report.overall.summary}\n`);
  
  // 统计信息
  lines.push(`## 统计信息\n`);
  lines.push(`- 总字数：${report.statistics.totalWords.toLocaleString()}`);
  lines.push(`- 总章节数：${report.statistics.totalChapters}`);
  lines.push(`- 平均章节字数：${report.statistics.avgChapterWords}`);
  lines.push(`- 完成率：${report.statistics.completionRate}%`);
  lines.push(`- 写作天数：${report.statistics.writingDays}`);
  lines.push(`- 日均字数：${report.statistics.avgWordsPerDay}\n`);
  
  // 质量评分
  lines.push(`## 质量评分\n`);
  lines.push(`- 一致性：${report.quality.consistency}/100`);
  lines.push(`- 完整性：${report.quality.completeness}/100`);
  lines.push(`- 平衡性：${report.quality.balance}/100\n`);
  
  // 优势
  if (report.strengths.length > 0) {
    lines.push(`## ✨ 优势\n`);
    report.strengths.forEach(s => {
      lines.push(`- ${s}`);
    });
    lines.push('');
  }
  
  // 弱点
  if (report.weaknesses.length > 0) {
    lines.push(`## ⚠️ 需要改进\n`);
    report.weaknesses.forEach(w => {
      lines.push(`- ${w}`);
    });
    lines.push('');
  }
  
  // 问题
  if (report.issues.length > 0) {
    lines.push(`## 🔍 发现的问题\n`);
    report.issues.forEach((issue, idx) => {
      const icon = issue.type === 'critical' ? '🔴' : issue.type === 'warning' ? '🟡' : '🔵';
      lines.push(`### ${idx + 1}. ${icon} ${issue.description}`);
      lines.push(`**类别：** ${issue.category}`);
      lines.push(`**建议：** ${issue.suggestion}`);
      if (issue.affectedChapters && issue.affectedChapters.length > 0) {
        lines.push(`**影响章节：** ${issue.affectedChapters.join(', ')}`);
      }
      lines.push('');
    });
  }
  
  // 建议
  if (report.recommendations.length > 0) {
    lines.push(`## 💡 改进建议\n`);
    report.recommendations.forEach((rec, idx) => {
      lines.push(`### ${idx + 1}. ${rec.title}`);
      lines.push(`**优先级：** ${rec.priority}`);
      lines.push(`**描述：** ${rec.description}`);
      lines.push(`**预期效果：** ${rec.expectedImprovement}`);
      lines.push(`**工作量：** ${rec.effort}`);
      lines.push('');
    });
  }
  
  return lines.join('\n');
}
