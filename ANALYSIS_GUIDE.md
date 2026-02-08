# 智能分析系统使用指南

本指南介绍如何使用天道AI写作工具的智能分析系统。

## 📚 目录

- [快速开始](#快速开始)
- [综合分析](#综合分析)
- [写作风格分析](#写作风格分析)
- [情节张力分析](#情节张力分析)
- [情绪曲线分析](#情绪曲线分析)
- [批量分析](#批量分析)
- [实战案例](#实战案例)

## 🚀 快速开始

### 安装和导入

```typescript
// 方式1：从统一入口导入（推荐）
import {
  analyzeComprehensive,
  analyzeWritingStyle,
  analyzePlotTension,
  analyzeEmotion,
} from './utils/analyzers';

// 方式2：从各自文件导入
import { analyzeComprehensive } from './utils/comprehensiveAnalyzer';
import { analyzeWritingStyle } from './utils/writingStyleEnhancer';
```

### 最简单的使用

```typescript
const chapterText = `
  他与敌人激烈对峙，双方剑拔弩张。
  "你到底想要什么？"他怒吼道。
  然而对方却突然笑了，这让他感到震惊。
`;

// 一键综合分析
const analysis = analyzeComprehensive(chapterText);

console.log('综合评分:', analysis.overallScore); // 0-100
console.log('等级:', getGrade(analysis.overallScore)); // S/A/B/C/D
console.log('优势:', analysis.strengths);
console.log('改进建议:', analysis.recommendations);
```

## 📊 综合分析

综合分析整合了所有维度，提供一站式分析结果。

### 基本用法

```typescript
import { analyzeComprehensive, generateComprehensiveReport } from './utils/analyzers';

const text = '你的章节内容...';
const analysis = analyzeComprehensive(text);

// 查看综合评分
console.log('综合评分:', analysis.overallScore); // 0-100

// 查看各维度评分
console.log('风格评分:', analysis.style.score);
console.log('张力评分:', analysis.tension.overallScore);
console.log('情绪评分:', analysis.emotion.score);

// 查看优先级问题（按影响分数排序）
analysis.priorities.forEach(p => {
  console.log(`${p.severity}: ${p.issue} (影响: ${p.impact}分)`);
});

// 查看改进建议（分类）
const quickWins = analysis.recommendations.filter(r => r.category === 'quick-win');
const important = analysis.recommendations.filter(r => r.category === 'important');

console.log('快速见效:', quickWins);
console.log('重要改进:', important);

// 生成报告
const report = generateComprehensiveReport(analysis);
console.log(report);
```

### 等级评定

| 评分 | 等级 | 说明 |
|------|------|------|
| 90-100 | S | 优秀，接近完美 |
| 80-89 | A | 良好，质量较高 |
| 70-79 | B | 中等，有提升空间 |
| 60-69 | C | 及格，需要改进 |
| 0-59 | D | 不及格，需要大幅改进 |

### 改进建议分类

- **Quick Win（快速见效）**：低成本高收益，如删除水对话、增加听觉描写
- **Important（重要改进）**：高优先级，如增强冲突、设置悬念、提升情绪感染力
- **Nice to Have（锦上添花）**：提升质量，如优化动作描写、增加转折点

## ✍️ 写作风格分析

分析五感描写、对话、动作、场景、心理描写。

### 基本用法

```typescript
import { analyzeWritingStyle, generateStyleReport } from './utils/analyzers';

const text = '你的章节内容...';
const analysis = analyzeWritingStyle(text);

// 查看评分
console.log('综合评分:', analysis.score);
console.log('对话质量:', analysis.dialogueQuality);
console.log('动作质量:', analysis.actionQuality);
console.log('场景质量:', analysis.sceneQuality);

// 查看五感使用情况
console.log('五感使用:', analysis.senseUsage);
// { visual: 10, auditory: 3, olfactory: 1, gustatory: 0, tactile: 2 }

// 查看具体问题
analysis.issues.forEach(issue => {
  console.log(`${issue.type}: ${issue.problem}`);
  console.log(`建议: ${issue.suggestion}`);
  console.log(`示例: ${issue.example}`);
});

// 生成报告
const report = generateStyleReport(analysis);
console.log(report);
```

### 五感描写优化

```typescript
// 检查五感使用情况
const senseUsage = analysis.senseUsage;

if (senseUsage.auditory < 2) {
  console.log('建议增加听觉描写：');
  console.log('- 添加环境音效（风声、水声、脚步声）');
  console.log('- 描写人物声音特点');
  console.log('- 用声音烘托氛围');
}

if (senseUsage.olfactory < 1) {
  console.log('建议增加嗅觉描写：');
  console.log('- 描写环境气味（花香、血腥、腐臭）');
  console.log('- 用气味唤起记忆');
  console.log('- 营造特定氛围');
}
```

### 对话优化

```typescript
// 检测水对话
if (analysis.dialogueQuality < 70) {
  console.log('对话需要优化：');
  console.log('- 删除"你好""再见"等无意义寒暄');
  console.log('- 每句对话都要推动剧情或展现性格');
  console.log('- 拆分过长的说明性对话');
}

// 生成优化提示词
import { generateEnhancementPrompt } from './utils/analyzers';
const prompt = generateEnhancementPrompt(text, analysis, {
  focusAreas: ['dialogue'],
  targetStyle: 'immersive',
});
// 将 prompt 发送给 AI 进行优化
```

## 🎭 情节张力分析

分析冲突、悬念、转折、高潮、节奏。

### 基本用法

```typescript
import { analyzePlotTension, generateTensionReport } from './utils/analyzers';

const text = '你的章节内容...';
const analysis = analyzePlotTension(text);

// 查看评分
console.log('综合评分:', analysis.overallScore);
console.log('冲突强度:', analysis.conflict.intensity);
console.log('悬念有效性:', analysis.suspense.effectiveness);
console.log('转折质量:', analysis.twist.quality);

// 查看冲突类型
console.log('人物冲突:', analysis.conflict.types.interpersonal);
console.log('环境冲突:', analysis.conflict.types.environmental);
console.log('内心冲突:', analysis.conflict.types.internal);

// 查看悬念设置
console.log('悬念数量:', analysis.suspense.count);
analysis.suspense.suspenses.forEach(s => {
  console.log(`${s.type}: ${s.content}`);
});

// 查看转折点
console.log('转折数量:', analysis.twist.count);
analysis.twist.twists.forEach(t => {
  console.log(`${t.type}: ${t.description} (影响: ${t.impact})`);
});

// 查看高潮
if (analysis.climax.hasClimax) {
  console.log('高潮强度:', analysis.climax.intensity);
  console.log('铺垫充分度:', analysis.climax.buildup);
  console.log('解决完整度:', analysis.climax.resolution);
} else {
  console.log('缺乏高潮点，建议设置');
}

// 查看节奏
console.log('节奏类型:', analysis.pacing.rhythm); // too-fast/balanced/too-slow
console.log('句式变化度:', analysis.pacing.sentenceLengthVariation);
```

### 冲突优化

```typescript
if (analysis.conflict.intensity < 60) {
  console.log('冲突强度不足，建议：');
  console.log('- 增加人物对抗场景');
  console.log('- 制造环境危机（时间紧迫、追杀、陷阱）');
  console.log('- 展现内心挣扎（两难抉择、道德困境）');
}
```

### 悬念优化

```typescript
if (analysis.suspense.effectiveness < 60) {
  console.log('悬念设置不足，建议：');
  console.log('- 在章节末尾设置疑问句');
  console.log('- 埋下未解之谜');
  console.log('- 预告即将到来的危机');
  console.log('- 设置伏笔');
}
```

## 💖 情绪曲线分析

分析情绪识别、起伏、共鸣度。

### 基本用法

```typescript
import { analyzeEmotion, generateEmotionReport } from './utils/analyzers';

const text = '你的章节内容...';
const analysis = analyzeEmotion(text);

// 查看评分
console.log('综合评分:', analysis.score);
console.log('共鸣度:', analysis.resonance);
console.log('平衡度:', analysis.balance);

// 查看主导情绪
console.log('主导情绪:', analysis.dominantEmotion);
// joy/anger/sadness/fear/surprise/disgust/anticipation/trust

// 查看情绪分布
console.log('情绪分布:', analysis.distribution);
// { joy: 3, anger: 2, sadness: 1, fear: 1, ... }

// 查看情绪曲线
console.log('平均强度:', analysis.curve.averageIntensity);
console.log('波动性:', analysis.curve.volatility);
console.log('趋势:', analysis.curve.trend); // rising/falling/stable
console.log('波峰数量:', analysis.curve.peaks.length);
console.log('波谷数量:', analysis.curve.valleys.length);

// 查看情绪点
analysis.curve.points.forEach(point => {
  console.log(`位置${point.position}: ${point.type} (强度: ${point.intensity})`);
});
```

### 情绪优化

```typescript
if (analysis.resonance < 60) {
  console.log('情绪共鸣度不足，建议：');
  console.log('- 使用更强烈的情绪词汇');
  console.log('- 通过动作和表情传递情绪');
  console.log('- 营造情绪氛围');
}

if (analysis.curve.volatility < 30) {
  console.log('情绪波动过于平淡，建议：');
  console.log('- 设置情绪高潮点');
  console.log('- 制造情绪低谷');
  console.log('- 增加情绪起伏');
}

if (analysis.balance < 30) {
  console.log('情绪过于单一，建议：');
  console.log('- 增加不同类型的情绪表达');
  console.log('- 正负情绪交织');
  console.log('- 丰富情感层次');
}
```

## 📦 批量分析

分析多个章节。

```typescript
import { analyzeComprehensive } from './utils/analyzers';

const chapters = [
  { title: '第一章', content: '...' },
  { title: '第二章', content: '...' },
  { title: '第三章', content: '...' },
];

// 批量分析
const results = chapters.map(chapter => ({
  title: chapter.title,
  analysis: analyzeComprehensive(chapter.content),
}));

// 找出问题最多的章节
const problematicChapters = results
  .filter(r => r.analysis.overallScore < 60)
  .sort((a, b) => a.analysis.overallScore - b.analysis.overallScore);

console.log('需要重点优化的章节:');
problematicChapters.forEach(r => {
  console.log(`${r.title}: ${r.analysis.overallScore}分`);
  console.log('主要问题:', r.analysis.priorities.slice(0, 3));
});

// 统计整体情况
const avgScore = results.reduce((sum, r) => sum + r.analysis.overallScore, 0) / results.length;
console.log('平均评分:', avgScore);

const excellentChapters = results.filter(r => r.analysis.overallScore >= 80).length;
console.log('优秀章节数:', excellentChapters);
```

## 🎯 实战案例

### 案例1：优化一个平淡的章节

```typescript
const originalText = `
  他走了过去。
  他坐了下来。
  他喝了一口水。
`;

// 分析
const analysis = analyzeComprehensive(originalText);
console.log('评分:', analysis.overallScore); // 可能很低

// 查看问题
console.log('主要问题:');
analysis.priorities.slice(0, 5).forEach(p => {
  console.log(`- ${p.issue} (影响: ${p.impact}分)`);
});

// 查看建议
console.log('改进建议:');
analysis.recommendations
  .filter(r => r.category === 'quick-win' || r.category === 'important')
  .forEach(r => {
    console.log(`\n${r.title}:`);
    r.actions.forEach(a => console.log(`  - ${a}`));
  });

// 生成优化提示词
import { generateComprehensivePrompt } from './utils/analyzers';
const prompt = generateComprehensivePrompt(originalText, analysis);
// 将 prompt 发送给 AI，获得优化后的文本
```

### 案例2：检查黄金三章

```typescript
const chapters = [
  { title: '第一章', content: '...' },
  { title: '第二章', content: '...' },
  { title: '第三章', content: '...' },
];

chapters.forEach((chapter, index) => {
  const analysis = analyzeComprehensive(chapter.content);
  
  console.log(`\n${chapter.title}:`);
  console.log('评分:', analysis.overallScore);
  
  // 第一章：检查钩子
  if (index === 0) {
    if (analysis.tension.suspense.effectiveness < 70) {
      console.log('⚠️ 第一章钩子不足，需要强化开篇吸引力');
    }
  }
  
  // 第二章：检查冲突
  if (index === 1) {
    if (analysis.tension.conflict.intensity < 60) {
      console.log('⚠️ 第二章冲突不足，需要增加矛盾和危机');
    }
  }
  
  // 第三章：检查高潮
  if (index === 2) {
    if (!analysis.tension.climax.hasClimax) {
      console.log('⚠️ 第三章缺乏高潮，需要设置第一个小高潮');
    }
  }
});
```

### 案例3：情绪曲线可视化

```typescript
const text = '你的长篇章节内容...';
const analysis = analyzeEmotion(text);

// 绘制情绪曲线（简化版）
console.log('\n情绪曲线:');
const points = analysis.curve.points;
const maxIntensity = Math.max(...points.map(p => Math.abs(p.intensity)));

points.forEach(point => {
  const normalized = Math.floor((point.intensity / maxIntensity) * 10);
  const bar = normalized > 0 
    ? '█'.repeat(normalized) 
    : '▓'.repeat(Math.abs(normalized));
  const label = normalized > 0 ? '正面' : '负面';
  
  console.log(`${point.position.toString().padStart(5)}: ${bar} (${label} ${point.type})`);
});

// 标注波峰波谷
console.log('\n波峰（情绪高点）:');
analysis.curve.peaks.forEach(peak => {
  console.log(`  位置${peak.position}: ${peak.type} (强度: ${peak.intensity})`);
});

console.log('\n波谷（情绪低点）:');
analysis.curve.valleys.forEach(valley => {
  console.log(`  位置${valley.position}: ${valley.type} (强度: ${valley.intensity})`);
});
```

## 💡 最佳实践

### 1. 分阶段优化

```typescript
// 第一轮：快速见效的改进
const quickWins = analysis.recommendations.filter(r => r.category === 'quick-win');
// 先处理这些，立即提升评分

// 第二轮：重要改进
const important = analysis.recommendations.filter(r => r.category === 'important');
// 再处理这些，大幅提升质量

// 第三轮：锦上添花
const niceToHave = analysis.recommendations.filter(r => r.category === 'nice-to-have');
// 最后处理这些，追求完美
```

### 2. 关注优先级

```typescript
// 按影响分数排序，优先处理影响最大的问题
const topPriorities = analysis.priorities
  .sort((a, b) => b.impact - a.impact)
  .slice(0, 5);

topPriorities.forEach(p => {
  console.log(`${p.severity}: ${p.issue} (影响: ${p.impact}分)`);
});
```

### 3. 定期检查

```typescript
// 写完每章后立即分析
function afterWriting(chapterContent: string) {
  const analysis = analyzeComprehensive(chapterContent);
  
  if (analysis.overallScore < 70) {
    console.log('⚠️ 本章质量需要提升');
    console.log('主要问题:', analysis.priorities.slice(0, 3));
  } else {
    console.log('✅ 本章质量良好');
  }
  
  return analysis;
}
```

### 4. 对比优化前后

```typescript
const beforeText = '原始文本...';
const afterText = '优化后文本...';

const beforeAnalysis = analyzeComprehensive(beforeText);
const afterAnalysis = analyzeComprehensive(afterText);

console.log('优化效果:');
console.log('评分提升:', afterAnalysis.overallScore - beforeAnalysis.overallScore);
console.log('问题减少:', beforeAnalysis.priorities.length - afterAnalysis.priorities.length);
```

## 📚 参考资料

- [写作风格增强器详解](./writingStyleEnhancer.ts)
- [情节张力分析器详解](./plotTensionAnalyzer.ts)
- [情绪曲线追踪器详解](./emotionAnalyzer.ts)
- [综合分析工具详解](./comprehensiveAnalyzer.ts)

## 🤝 贡献

欢迎提交问题和改进建议！
