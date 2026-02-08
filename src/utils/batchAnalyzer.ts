/**
 * 批量分析工具 - 分析多个章节并生成汇总报告
 * 
 * 核心能力：
 * 1. 批量分析多个章节
 * 2. 生成汇总报告
 * 3. 识别问题章节
 * 4. 提供优化优先级
 * 5. 统计整体质量
 */

import { analyzeComprehensive, type ComprehensiveAnalysis } from './comprehensiveAnalyzer';

// ============ 类型定义 ============

export interface ChapterInput {
  id: string;
  title: string;
  content: string;
}

export interface ChapterAnalysisResult {
  id: string;
  title: string;
  analysis: ComprehensiveAnalysis;
  rank: number; // 排名（1最好）
  needsImprovement: boolean;
}

export interface BatchAnalysisResult {
  chapters: ChapterAnalysisResult[];
  summary: {
    totalChapters: number;
    averageScore: number;
    excellentCount: number; // ≥80分
    goodCount: number; // 70-79分
    averageCount: number; // 60-69分
    poorCount: number; // <60分
    commonIssues: Array<{ issue: string; count: number }>;
    topStrengths: string[];
  };
  recommendations: {
    priorityChapters: ChapterAnalysisResult[]; // 需要优先优化的章节
    quickWins: Array<{ chapter: string; suggestions: string[] }>;
    overallAdvice: string[];
  };
}

// ============ 批量分析 ============

/**
 * 批量分析多个章节
 */
export function batchAnalyze(chapters: ChapterInput[]): BatchAnalysisResult {
  // 分析每个章节
  const results: ChapterAnalysisResult[] = chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    analysis: analyzeComprehensive(chapter.content),
    rank: 0,
    needsImprovement: false,
  }));

  // 排名（按综合评分）
  const sorted = [...results].sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
  sorted.forEach((result, index) => {
    result.rank = index + 1;
  });

  // 标记需要改进的章节
  results.forEach(result => {
    result.needsImprovement = result.analysis.overallScore < 70;
  });

  // 生成汇总信息
  const summary = generateSummary(results);

  // 生成建议
  const recommendations = generateRecommendations(results);

  return {
    chapters: results,
    summary,
    recommendations,
  };
}

/**
 * 生成汇总信息
 */
function generateSummary(results: ChapterAnalysisResult[]) {
  const totalChapters = results.length;
  const averageScore = results.reduce((sum, r) => sum + r.analysis.overallScore, 0) / totalChapters;

  // 统计各等级数量
  const excellentCount = results.filter(r => r.analysis.overallScore >= 80).length;
  const goodCount = results.filter(r => r.analysis.overallScore >= 70 && r.analysis.overallScore < 80).length;
  const averageCount = results.filter(r => r.analysis.overallScore >= 60 && r.analysis.overallScore < 70).length;
  const poorCount = results.filter(r => r.analysis.overallScore < 60).length;

  // 统计常见问题
  const issueMap = new Map<string, number>();
  results.forEach(result => {
    result.analysis.priorities.forEach(p => {
      const count = issueMap.get(p.issue) || 0;
      issueMap.set(p.issue, count + 1);
    });
  });

  const commonIssues = Array.from(issueMap.entries())
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // 统计常见优势
  const strengthMap = new Map<string, number>();
  results.forEach(result => {
    result.analysis.strengths.forEach(s => {
      const count = strengthMap.get(s) || 0;
      strengthMap.set(s, count + 1);
    });
  });

  const topStrengths = Array.from(strengthMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strength]) => strength);

  return {
    totalChapters,
    averageScore,
    excellentCount,
    goodCount,
    averageCount,
    poorCount,
    commonIssues,
    topStrengths,
  };
}

/**
 * 生成建议
 */
function generateRecommendations(results: ChapterAnalysisResult[]) {
  // 找出需要优先优化的章节（评分最低的前3个）
  const priorityChapters = [...results]
    .sort((a, b) => a.analysis.overallScore - b.analysis.overallScore)
    .slice(0, 3);

  // 为每个优先章节生成快速见效建议
  const quickWins = priorityChapters.map(chapter => {
    const quickWinRecs = chapter.analysis.recommendations
      .filter(r => r.category === 'quick-win')
      .slice(0, 3);

    return {
      chapter: chapter.title,
      suggestions: quickWinRecs.map(r => r.title),
    };
  });

  // 生成整体建议
  const overallAdvice: string[] = [];

  // 基于平均分给建议
  const avgScore = results.reduce((sum, r) => sum + r.analysis.overallScore, 0) / results.length;
  
  if (avgScore < 60) {
    overallAdvice.push('整体质量需要大幅提升，建议逐章优化');
  } else if (avgScore < 70) {
    overallAdvice.push('整体质量中等，重点优化低分章节');
  } else if (avgScore < 80) {
    overallAdvice.push('整体质量良好，继续提升细节');
  } else {
    overallAdvice.push('整体质量优秀，保持水准');
  }

  // 基于常见问题给建议
  const issueMap = new Map<string, number>();
  results.forEach(result => {
    result.analysis.priorities.forEach(p => {
      const count = issueMap.get(p.issue) || 0;
      issueMap.set(p.issue, count + 1);
    });
  });

  const mostCommonIssue = Array.from(issueMap.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (mostCommonIssue && mostCommonIssue[1] > results.length * 0.5) {
    overallAdvice.push(`超过半数章节存在"${mostCommonIssue[0]}"问题，建议统一优化`);
  }

  // 基于分布给建议
  const poorCount = results.filter(r => r.analysis.overallScore < 60).length;
  if (poorCount > results.length * 0.3) {
    overallAdvice.push('超过30%的章节质量较差，建议重点关注基础质量');
  }

  return {
    priorityChapters,
    quickWins,
    overallAdvice,
  };
}

/**
 * 生成批量分析报告
 */
export function generateBatchReport(result: BatchAnalysisResult): string {
  let report = '# 📊 批量分析报告\n\n';

  // 整体概况
  report += '## 📈 整体概况\n\n';
  report += `- 总章节数：${result.summary.totalChapters}\n`;
  report += `- 平均评分：${result.summary.averageScore.toFixed(1)}/100\n`;
  report += `- 优秀章节：${result.summary.excellentCount} (${((result.summary.excellentCount / result.summary.totalChapters) * 100).toFixed(1)}%)\n`;
  report += `- 良好章节：${result.summary.goodCount} (${((result.summary.goodCount / result.summary.totalChapters) * 100).toFixed(1)}%)\n`;
  report += `- 中等章节：${result.summary.averageCount} (${((result.summary.averageCount / result.summary.totalChapters) * 100).toFixed(1)}%)\n`;
  report += `- 较差章节：${result.summary.poorCount} (${((result.summary.poorCount / result.summary.totalChapters) * 100).toFixed(1)}%)\n\n`;

  // 章节排名
  report += '## 🏆 章节排名\n\n';
  report += '| 排名 | 章节 | 评分 | 状态 |\n';
  report += '|------|------|------|------|\n';
  
  const sorted = [...result.chapters].sort((a, b) => b.analysis.overallScore - a.analysis.overallScore);
  sorted.forEach((chapter, index) => {
    const status = chapter.analysis.overallScore >= 80 ? '✅ 优秀' :
                   chapter.analysis.overallScore >= 70 ? '🟢 良好' :
                   chapter.analysis.overallScore >= 60 ? '🟡 中等' : '🔴 较差';
    report += `| ${index + 1} | ${chapter.title} | ${chapter.analysis.overallScore}/100 | ${status} |\n`;
  });
  report += '\n';

  // 常见问题
  if (result.summary.commonIssues.length > 0) {
    report += '## 🚨 常见问题\n\n';
    result.summary.commonIssues.forEach((issue, index) => {
      const percentage = ((issue.count / result.summary.totalChapters) * 100).toFixed(1);
      report += `${index + 1}. **${issue.issue}** - 出现在 ${issue.count} 个章节 (${percentage}%)\n`;
    });
    report += '\n';
  }

  // 常见优势
  if (result.summary.topStrengths.length > 0) {
    report += '## ✅ 常见优势\n\n';
    result.summary.topStrengths.forEach((strength, index) => {
      report += `${index + 1}. ${strength}\n`;
    });
    report += '\n';
  }

  // 优先优化章节
  if (result.recommendations.priorityChapters.length > 0) {
    report += '## 🎯 优先优化章节\n\n';
    result.recommendations.priorityChapters.forEach((chapter, index) => {
      report += `### ${index + 1}. ${chapter.title} (${chapter.analysis.overallScore}/100)\n\n`;
      report += '**主要问题：**\n';
      chapter.analysis.priorities.slice(0, 3).forEach(p => {
        report += `- ${p.issue} (影响: ${p.impact}分)\n`;
      });
      report += '\n';
    });
  }

  // 快速见效建议
  if (result.recommendations.quickWins.length > 0) {
    report += '## 💡 快速见效建议\n\n';
    result.recommendations.quickWins.forEach(qw => {
      report += `**${qw.chapter}：**\n`;
      qw.suggestions.forEach(s => report += `- ${s}\n`);
      report += '\n';
    });
  }

  // 整体建议
  if (result.recommendations.overallAdvice.length > 0) {
    report += '## 📋 整体建议\n\n';
    result.recommendations.overallAdvice.forEach(advice => {
      report += `- ${advice}\n`;
    });
    report += '\n';
  }

  return report;
}

/**
 * 导出批量分析结果为CSV
 */
export function exportToCSV(result: BatchAnalysisResult): string {
  let csv = 'ID,标题,综合评分,风格评分,张力评分,情绪评分,排名,需要改进\n';
  
  result.chapters.forEach(chapter => {
    csv += `"${chapter.id}",`;
    csv += `"${chapter.title}",`;
    csv += `${chapter.analysis.overallScore},`;
    csv += `${chapter.analysis.style.score},`;
    csv += `${chapter.analysis.tension.overallScore},`;
    csv += `${chapter.analysis.emotion.score},`;
    csv += `${chapter.rank},`;
    csv += `${chapter.needsImprovement ? '是' : '否'}\n`;
  });

  return csv;
}

/**
 * 比较两次批量分析结果
 */
export function compareBatchResults(
  before: BatchAnalysisResult,
  after: BatchAnalysisResult
): string {
  let report = '# 📊 批量分析对比报告\n\n';

  // 整体对比
  report += '## 📈 整体对比\n\n';
  report += '| 指标 | 优化前 | 优化后 | 变化 |\n';
  report += '|------|--------|--------|------|\n';
  
  const avgScoreDiff = after.summary.averageScore - before.summary.averageScore;
  report += `| 平均评分 | ${before.summary.averageScore.toFixed(1)} | ${after.summary.averageScore.toFixed(1)} | ${avgScoreDiff > 0 ? '+' : ''}${avgScoreDiff.toFixed(1)} |\n`;
  
  const excellentDiff = after.summary.excellentCount - before.summary.excellentCount;
  report += `| 优秀章节 | ${before.summary.excellentCount} | ${after.summary.excellentCount} | ${excellentDiff > 0 ? '+' : ''}${excellentDiff} |\n`;
  
  const poorDiff = after.summary.poorCount - before.summary.poorCount;
  report += `| 较差章节 | ${before.summary.poorCount} | ${after.summary.poorCount} | ${poorDiff > 0 ? '+' : ''}${poorDiff} |\n`;
  report += '\n';

  // 章节对比
  report += '## 📝 章节对比\n\n';
  report += '| 章节 | 优化前 | 优化后 | 提升 |\n';
  report += '|------|--------|--------|------|\n';
  
  before.chapters.forEach(beforeChapter => {
    const afterChapter = after.chapters.find(c => c.id === beforeChapter.id);
    if (afterChapter) {
      const diff = afterChapter.analysis.overallScore - beforeChapter.analysis.overallScore;
      const arrow = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
      report += `| ${beforeChapter.title} | ${beforeChapter.analysis.overallScore} | ${afterChapter.analysis.overallScore} | ${arrow} ${diff > 0 ? '+' : ''}${diff} |\n`;
    }
  });
  report += '\n';

  // 改进最大的章节
  const improvements = before.chapters
    .map(beforeChapter => {
      const afterChapter = after.chapters.find(c => c.id === beforeChapter.id);
      if (!afterChapter) return null;
      return {
        title: beforeChapter.title,
        improvement: afterChapter.analysis.overallScore - beforeChapter.analysis.overallScore,
      };
    })
    .filter(i => i !== null)
    .sort((a, b) => b!.improvement - a!.improvement)
    .slice(0, 3);

  if (improvements.length > 0) {
    report += '## 🏆 改进最大的章节\n\n';
    improvements.forEach((imp, index) => {
      report += `${index + 1}. **${imp!.title}** - 提升 ${imp!.improvement.toFixed(1)} 分\n`;
    });
    report += '\n';
  }

  return report;
}
