/**
 * 综合分析工具 - 整合所有分析器，提供一站式分析
 * 
 * 整合模块：
 * 1. 写作风格增强器（五感、对话、动作、场景、心理）
 * 2. 情节张力分析器（冲突、悬念、转折、高潮、节奏）
 * 3. 情绪曲线追踪器（情绪识别、起伏、共鸣度）
 * 4. 网文能力分析器（爽点、钩子、节奏）
 * 5. 内容检查器（专有名词、敏感词）
 * 6. AI优化器（AI味检测）
 */

import { analyzeWritingStyle, type StyleAnalysis } from './writingStyleEnhancer';
import { analyzePlotTension, type PlotTensionAnalysis } from './plotTensionAnalyzer';
import { analyzeEmotion, type EmotionAnalysis } from './emotionAnalyzer';

// ============ 类型定义 ============

export interface ComprehensiveAnalysis {
  overallScore: number; // 综合评分 0-100
  style: StyleAnalysis;
  tension: PlotTensionAnalysis;
  emotion: EmotionAnalysis;
  strengths: string[];
  weaknesses: string[];
  priorities: Priority[];
  recommendations: Recommendation[];
}

export interface Priority {
  area: 'style' | 'tension' | 'emotion';
  issue: string;
  severity: 'critical' | 'major' | 'minor';
  impact: number; // 影响分数 0-100
}

export interface Recommendation {
  title: string;
  description: string;
  category: 'quick-win' | 'important' | 'nice-to-have';
  effort: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  actions: string[];
}

// ============ 综合分析 ============

/**
 * 综合分析文本
 */
export function analyzeComprehensive(text: string): ComprehensiveAnalysis {
  // 执行各项分析
  const style = analyzeWritingStyle(text);
  const tension = analyzePlotTension(text);
  const emotion = analyzeEmotion(text);

  // 计算综合评分（加权平均）
  const overallScore = Math.floor(
    style.score * 0.35 +
    tension.overallScore * 0.35 +
    emotion.score * 0.30
  );

  // 汇总优势
  const strengths: string[] = [
    ...style.strengths,
    ...tension.strengths,
    ...emotion.strengths,
  ];

  // 汇总弱点
  const weaknesses: string[] = [
    ...style.improvements,
    ...tension.improvements,
    ...emotion.improvements,
  ];

  // 生成优先级列表
  const priorities = generatePriorities(style, tension, emotion);

  // 生成改进建议
  const recommendations = generateRecommendations(style, tension, emotion);

  return {
    overallScore,
    style,
    tension,
    emotion,
    strengths,
    weaknesses,
    priorities,
    recommendations,
  };
}

/**
 * 生成优先级列表
 */
function generatePriorities(
  style: StyleAnalysis,
  tension: PlotTensionAnalysis,
  emotion: EmotionAnalysis
): Priority[] {
  const priorities: Priority[] = [];

  // 风格问题
  if (style.dialogueQuality < 50) {
    priorities.push({
      area: 'style',
      issue: '对话质量严重不足',
      severity: 'critical',
      impact: 100 - style.dialogueQuality,
    });
  } else if (style.dialogueQuality < 70) {
    priorities.push({
      area: 'style',
      issue: '对话质量需要改进',
      severity: 'major',
      impact: 100 - style.dialogueQuality,
    });
  }

  if (style.actionQuality < 50) {
    priorities.push({
      area: 'style',
      issue: '动作描写严重不足',
      severity: 'critical',
      impact: 100 - style.actionQuality,
    });
  }

  if (style.sceneQuality < 50) {
    priorities.push({
      area: 'style',
      issue: '场景渲染严重不足',
      severity: 'critical',
      impact: 100 - style.sceneQuality,
    });
  }

  // 五感使用
  const senseTotal = Object.values(style.senseUsage).reduce((a, b) => a + b, 0);
  if (senseTotal < 5) {
    priorities.push({
      area: 'style',
      issue: '五感描写严重缺乏',
      severity: 'major',
      impact: 80,
    });
  }

  // 张力问题
  if (tension.conflict.intensity < 40) {
    priorities.push({
      area: 'tension',
      issue: '冲突强度严重不足',
      severity: 'critical',
      impact: 100 - tension.conflict.intensity,
    });
  }

  if (tension.suspense.effectiveness < 40) {
    priorities.push({
      area: 'tension',
      issue: '悬念设置严重不足',
      severity: 'critical',
      impact: 100 - tension.suspense.effectiveness,
    });
  }

  if (!tension.climax.hasClimax) {
    priorities.push({
      area: 'tension',
      issue: '缺乏高潮点',
      severity: 'critical',
      impact: 90,
    });
  }

  if (tension.twist.count === 0) {
    priorities.push({
      area: 'tension',
      issue: '缺乏转折点',
      severity: 'major',
      impact: 70,
    });
  }

  // 情绪问题
  if (emotion.resonance < 40) {
    priorities.push({
      area: 'emotion',
      issue: '情绪共鸣度严重不足',
      severity: 'critical',
      impact: 100 - emotion.resonance,
    });
  }

  if (emotion.curve.volatility < 20) {
    priorities.push({
      area: 'emotion',
      issue: '情绪波动过于平淡',
      severity: 'major',
      impact: 70,
    });
  }

  if (emotion.balance < 20) {
    priorities.push({
      area: 'emotion',
      issue: '情绪过于单一',
      severity: 'major',
      impact: 60,
    });
  }

  // 按影响分数排序
  priorities.sort((a, b) => b.impact - a.impact);

  return priorities;
}

/**
 * 生成改进建议
 */
function generateRecommendations(
  style: StyleAnalysis,
  tension: PlotTensionAnalysis,
  emotion: EmotionAnalysis
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 快速见效的改进（Quick Wins）
  if (style.dialogueQuality < 70) {
    recommendations.push({
      title: '优化对话质量',
      description: '删除水对话，让每句对话都推动剧情或展现性格',
      category: 'quick-win',
      effort: 'low',
      impact: 'high',
      actions: [
        '删除"你好""再见"等无意义寒暄',
        '拆分过长的说明性对话',
        '根据角色性格调整说话方式',
      ],
    });
  }

  if (style.senseUsage.auditory < 2) {
    recommendations.push({
      title: '增加听觉描写',
      description: '丰富感官体验，增强沉浸感',
      category: 'quick-win',
      effort: 'low',
      impact: 'medium',
      actions: [
        '添加环境音效（风声、水声、脚步声）',
        '描写人物声音特点',
        '用声音烘托氛围',
      ],
    });
  }

  // 重要改进（Important）
  if (tension.conflict.intensity < 60) {
    recommendations.push({
      title: '增强冲突设置',
      description: '提升情节张力，让故事更有吸引力',
      category: 'important',
      effort: 'medium',
      impact: 'high',
      actions: [
        '增加人物对抗场景',
        '制造环境危机',
        '展现内心挣扎',
      ],
    });
  }

  if (tension.suspense.effectiveness < 60) {
    recommendations.push({
      title: '强化悬念设置',
      description: '在章节末尾设置钩子，吸引读者继续阅读',
      category: 'important',
      effort: 'medium',
      impact: 'high',
      actions: [
        '用疑问句制造悬念',
        '设置未解之谜',
        '预告即将到来的危机',
      ],
    });
  }

  if (!tension.climax.hasClimax) {
    recommendations.push({
      title: '设置高潮点',
      description: '在适当位置设置冲突爆发的高潮',
      category: 'important',
      effort: 'high',
      impact: 'high',
      actions: [
        '选择合适的位置（后半部分）',
        '充分铺垫，积累情绪',
        '爆发后要有收尾',
      ],
    });
  }

  if (emotion.resonance < 60) {
    recommendations.push({
      title: '提升情绪感染力',
      description: '增强情绪表达，让读者产生共鸣',
      category: 'important',
      effort: 'medium',
      impact: 'high',
      actions: [
        '使用更强烈的情绪词汇',
        '通过动作和表情传递情绪',
        '营造情绪氛围',
      ],
    });
  }

  // 锦上添花（Nice to Have）
  if (style.actionQuality < 80) {
    recommendations.push({
      title: '提升动作描写',
      description: '增加镜头感和节奏变化',
      category: 'nice-to-have',
      effort: 'medium',
      impact: 'medium',
      actions: [
        '增加动作细节',
        '用短句制造紧张感',
        '用长句营造舒缓氛围',
      ],
    });
  }

  if (tension.twist.count < 2) {
    recommendations.push({
      title: '增加转折点',
      description: '让情节更加曲折，避免平铺直叙',
      category: 'nice-to-have',
      effort: 'medium',
      impact: 'medium',
      actions: [
        '设置反转',
        '制造意外',
        '揭开谜底',
      ],
    });
  }

  if (emotion.curve.volatility < 40) {
    recommendations.push({
      title: '增加情绪起伏',
      description: '让情绪曲线更有波动，增强感染力',
      category: 'nice-to-have',
      effort: 'low',
      impact: 'medium',
      actions: [
        '设置情绪高潮点',
        '制造情绪低谷',
        '控制情绪节奏',
      ],
    });
  }

  return recommendations;
}

/**
 * 生成综合报告
 */
export function generateComprehensiveReport(analysis: ComprehensiveAnalysis): string {
  let report = '# 📊 综合分析报告\n\n';
  
  // 综合评分
  report += `## 🎯 综合评分：${analysis.overallScore}/100\n\n`;
  
  const grade = getGrade(analysis.overallScore);
  report += `**等级：${grade.level}** - ${grade.description}\n\n`;

  // 分项评分
  report += '## 📈 分项评分\n\n';
  report += `| 维度 | 评分 | 状态 |\n`;
  report += `|------|------|------|\n`;
  report += `| 写作风格 | ${analysis.style.score}/100 | ${getStatus(analysis.style.score)} |\n`;
  report += `| 情节张力 | ${analysis.tension.overallScore}/100 | ${getStatus(analysis.tension.overallScore)} |\n`;
  report += `| 情绪表达 | ${analysis.emotion.score}/100 | ${getStatus(analysis.emotion.score)} |\n\n`;

  // 优势
  if (analysis.strengths.length > 0) {
    report += '## ✅ 优势亮点\n\n';
    const uniqueStrengths = [...new Set(analysis.strengths)];
    uniqueStrengths.slice(0, 5).forEach(s => report += `- ${s}\n`);
    report += '\n';
  }

  // 优先级问题
  if (analysis.priorities.length > 0) {
    report += '## 🚨 优先级问题\n\n';
    const critical = analysis.priorities.filter(p => p.severity === 'critical');
    const major = analysis.priorities.filter(p => p.severity === 'major');

    if (critical.length > 0) {
      report += '### 严重问题（需立即处理）\n\n';
      critical.slice(0, 3).forEach(p => {
        report += `- **${p.issue}** (影响: ${p.impact}分)\n`;
      });
      report += '\n';
    }

    if (major.length > 0) {
      report += '### 主要问题（建议优先处理）\n\n';
      major.slice(0, 3).forEach(p => {
        report += `- ${p.issue} (影响: ${p.impact}分)\n`;
      });
      report += '\n';
    }
  }

  // 改进建议
  if (analysis.recommendations.length > 0) {
    report += '## 💡 改进建议\n\n';

    const quickWins = analysis.recommendations.filter(r => r.category === 'quick-win');
    const important = analysis.recommendations.filter(r => r.category === 'important');

    if (quickWins.length > 0) {
      report += '### 🎯 快速见效（低成本高收益）\n\n';
      quickWins.forEach(r => {
        report += `**${r.title}**\n`;
        report += `${r.description}\n\n`;
        report += '行动步骤：\n';
        r.actions.forEach(a => report += `- ${a}\n`);
        report += '\n';
      });
    }

    if (important.length > 0) {
      report += '### 🔥 重要改进（高优先级）\n\n';
      important.forEach(r => {
        report += `**${r.title}**\n`;
        report += `${r.description}\n\n`;
        report += '行动步骤：\n';
        r.actions.forEach(a => report += `- ${a}\n`);
        report += '\n';
      });
    }
  }

  // 详细分析链接
  report += '## 📋 详细分析\n\n';
  report += '查看各维度的详细分析：\n';
  report += '- 写作风格分析（对话、动作、场景、五感）\n';
  report += '- 情节张力分析（冲突、悬念、转折、高潮）\n';
  report += '- 情绪曲线分析（情绪识别、起伏、共鸣度）\n\n';

  return report;
}

/**
 * 生成综合优化提示词
 */
export function generateComprehensivePrompt(
  text: string,
  analysis: ComprehensiveAnalysis
): string {
  let prompt = '# 综合优化提示词\n\n';
  prompt += '请对以下文本进行全面优化，重点关注以下方面：\n\n';

  // 按优先级排序的改进点
  const topPriorities = analysis.priorities.slice(0, 5);
  
  if (topPriorities.length > 0) {
    prompt += '## 优先改进项\n\n';
    topPriorities.forEach((p, i) => {
      prompt += `${i + 1}. **${p.issue}**\n`;
    });
    prompt += '\n';
  }

  // 具体改进建议
  const topRecommendations = analysis.recommendations
    .filter(r => r.category === 'quick-win' || r.category === 'important')
    .slice(0, 3);

  if (topRecommendations.length > 0) {
    prompt += '## 具体改进方向\n\n';
    topRecommendations.forEach(r => {
      prompt += `### ${r.title}\n\n`;
      r.actions.forEach(a => prompt += `- ${a}\n`);
      prompt += '\n';
    });
  }

  // 目标评分
  prompt += '## 优化目标\n\n';
  prompt += `- 当前综合评分：${analysis.overallScore}/100\n`;
  prompt += `- 目标评分：${Math.min(100, analysis.overallScore + 20)}/100\n\n`;

  prompt += '## 原文\n\n';
  prompt += text;

  return prompt;
}

// ============ 辅助函数 ============

function getGrade(score: number): { level: string; description: string } {
  if (score >= 90) return { level: 'S', description: '优秀，接近完美' };
  if (score >= 80) return { level: 'A', description: '良好，质量较高' };
  if (score >= 70) return { level: 'B', description: '中等，有提升空间' };
  if (score >= 60) return { level: 'C', description: '及格，需要改进' };
  return { level: 'D', description: '不及格，需要大幅改进' };
}

function getStatus(score: number): string {
  if (score >= 80) return '✅ 优秀';
  if (score >= 70) return '🟢 良好';
  if (score >= 60) return '🟡 中等';
  if (score >= 50) return '🟠 较差';
  return '🔴 很差';
}
