/**
 * 章节摘要生成器
 * 用于 AI 自动生成每章摘要，增强 RAG 检索效果
 */

export interface ChapterSummary {
  /** 章节标题 */
  title: string;
  /** 简短摘要（1-2句话） */
  brief: string;
  /** 详细摘要（3-5句话） */
  detailed: string;
  /** 关键人物 */
  keyCharacters: string[];
  /** 关键事件 */
  keyEvents: string[];
  /** 关键地点 */
  keyLocations: string[];
  /** 情节标签 */
  plotTags: string[];
  /** 情绪基调 */
  emotionalTone: string;
  /** 字数 */
  wordCount: number;
}

export interface SummaryGenerationOptions {
  /** 是否包含详细摘要 */
  includeDetailed?: boolean;
  /** 是否提取关键信息 */
  extractKeyInfo?: boolean;
  /** 最大摘要长度 */
  maxLength?: number;
}

/**
 * 提取章节中的关键人物
 */
export function extractKeyCharacters(text: string): string[] {
  const characters = new Set<string>();
  
  // 匹配对话中的人物名（"xxx说"、"xxx道"、"xxx笑道"等）
  const dialoguePattern = /([^，。！？\s]{2,4})(说|道|笑道|冷笑道|怒道|问道|答道|叹道|喊道)[:：]/g;
  let match;
  while ((match = dialoguePattern.exec(text)) !== null) {
    characters.add(match[1]);
  }
  
  // 匹配"xxx + 动词"模式，但要更精确
  const actionPattern = /([^，。！？\s"]{2,4})(点了点头|转身|抬头|低头|伸手|握住|拿起|放下|走向|看着)/g;
  while ((match = actionPattern.exec(text)) !== null) {
    const name = match[1];
    // 过滤掉明显不是人名的词
    if (!/^(他们|我们|你们|这个|那个|什么|怎么|为什么)/.test(name)) {
      characters.add(name);
    }
  }
  
  return Array.from(characters).slice(0, 5); // 最多返回5个
}

/**
 * 提取章节中的关键事件
 */
export function extractKeyEvents(text: string): string[] {
  const events: string[] = [];
  
  // 匹配动作性强的句子
  const sentences = text.split(/[。！？]/);
  
  for (const sentence of sentences) {
    if (sentence.length < 10 || sentence.length > 100) continue;
    
    // 包含动作词的句子
    if (/突然|忽然|瞬间|立刻|马上|终于|竟然|居然|果然/.test(sentence)) {
      events.push(sentence.trim());
      if (events.length >= 3) break;
    }
  }
  
  return events;
}

/**
 * 提取章节中的关键地点
 */
export function extractKeyLocations(text: string): string[] {
  const locations = new Set<string>();
  
  // 匹配地点词（"在xxx"、"来到xxx"、"走进xxx"等）
  const locationPattern = /(在|来到|走进|进入|离开|前往)([^，。！？\s]{2,6})(中|里|内|外|上|下|前|后|旁)?/g;
  let match;
  while ((match = locationPattern.exec(text)) !== null) {
    const location = match[2] + (match[3] || '');
    if (location.length >= 2 && location.length <= 6) {
      locations.add(location);
    }
  }
  
  return Array.from(locations).slice(0, 3); // 最多返回3个
}

/**
 * 分析章节的情绪基调
 */
export function analyzeEmotionalTone(text: string): string {
  const emotions = {
    紧张: /危险|紧张|担心|害怕|恐惧|惊恐|慌张/g,
    激动: /激动|兴奋|热血|沸腾|澎湃|振奋/g,
    悲伤: /悲伤|难过|痛苦|哀伤|凄凉|悲凉/g,
    愤怒: /愤怒|生气|暴怒|怒火|恼怒|气愤/g,
    喜悦: /高兴|开心|喜悦|欢喜|愉快|快乐/g,
    平静: /平静|安静|宁静|淡然|从容|冷静/g,
  };
  
  const scores: Record<string, number> = {};
  
  for (const [emotion, pattern] of Object.entries(emotions)) {
    const matches = text.match(pattern);
    scores[emotion] = matches ? matches.length : 0;
  }
  
  // 找出最高分的情绪
  let maxEmotion = '平静';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxEmotion = emotion;
    }
  }
  
  return maxEmotion;
}

/**
 * 生成简短摘要（基于规则）
 */
export function generateBriefSummary(text: string, maxLength: number = 100): string {
  // 提取前几句话作为摘要
  const sentences = text.split(/[。！？]/);
  let summary = '';
  
  for (const sentence of sentences) {
    if (sentence.trim().length < 5) continue;
    
    if (summary.length + sentence.length <= maxLength) {
      summary += sentence + '。';
    } else {
      break;
    }
    
    if (summary.length >= 50) break; // 至少50字
  }
  
  // 如果有有效摘要，返回
  if (summary.trim()) {
    return summary.trim();
  }
  
  // 否则截取文本
  if (text.length <= maxLength) {
    return text.trim();
  }
  
  return text.slice(0, maxLength) + '...';
}

/**
 * 生成详细摘要（基于规则）
 */
export function generateDetailedSummary(text: string, maxLength: number = 300): string {
  // 提取关键句子
  const sentences = text.split(/[。！？]/);
  const keySentences: string[] = [];
  
  for (const sentence of sentences) {
    if (sentence.trim().length < 10) continue;
    
    // 优先选择包含关键词的句子
    if (/突然|忽然|终于|竟然|居然|果然|但是|然而|却|可是/.test(sentence)) {
      keySentences.push(sentence.trim());
    }
  }
  
  // 如果关键句子不够，补充普通句子
  if (keySentences.length < 3) {
    for (const sentence of sentences) {
      if (sentence.trim().length >= 10 && !keySentences.includes(sentence.trim())) {
        keySentences.push(sentence.trim());
        if (keySentences.length >= 5) break;
      }
    }
  }
  
  let summary = keySentences.slice(0, 5).join('。');
  if (summary) {
    summary += '。';
  }
  
  // 严格控制长度
  if (summary.length > maxLength) {
    // 找到最后一个句号的位置
    const lastPeriod = summary.lastIndexOf('。', maxLength - 3);
    if (lastPeriod > 0) {
      summary = summary.slice(0, lastPeriod + 1);
    } else {
      summary = summary.slice(0, maxLength - 3) + '...';
    }
  }
  
  return summary;
}

/**
 * 生成情节标签
 */
export function generatePlotTags(text: string): string[] {
  const tags: string[] = [];
  
  const tagPatterns = {
    战斗: /战斗|打斗|厮杀|交手|对战|激战/,
    对话: /说道|问道|答道|笑道|对话|交谈/,
    修炼: /修炼|突破|提升|境界|功法|修为/,
    探索: /探索|寻找|发现|前往|到达|进入/,
    冲突: /冲突|矛盾|对立|争执|争论|争吵/,
    转折: /突然|忽然|竟然|居然|没想到|意外/,
    感情: /喜欢|爱|恨|情感|感情|心动/,
    阴谋: /阴谋|计划|谋划|算计|陷阱|诡计/,
  };
  
  for (const [tag, pattern] of Object.entries(tagPatterns)) {
    if (pattern.test(text)) {
      tags.push(tag);
    }
  }
  
  return tags;
}

/**
 * 生成章节摘要
 */
export function generateChapterSummary(
  title: string,
  content: string,
  options: SummaryGenerationOptions = {}
): ChapterSummary {
  const {
    includeDetailed = true,
    extractKeyInfo = true,
    maxLength = 300,
  } = options;
  
  const wordCount = content.length;
  const brief = generateBriefSummary(content, 100);
  const detailed = includeDetailed ? generateDetailedSummary(content, maxLength) : '';
  
  const keyCharacters = extractKeyInfo ? extractKeyCharacters(content) : [];
  const keyEvents = extractKeyInfo ? extractKeyEvents(content) : [];
  const keyLocations = extractKeyInfo ? extractKeyLocations(content) : [];
  const plotTags = extractKeyInfo ? generatePlotTags(content) : [];
  const emotionalTone = analyzeEmotionalTone(content);
  
  return {
    title,
    brief,
    detailed,
    keyCharacters,
    keyEvents,
    keyLocations,
    plotTags,
    emotionalTone,
    wordCount,
  };
}

/**
 * 批量生成章节摘要
 */
export function batchGenerateSummaries(
  chapters: Array<{ title: string; content: string }>,
  options: SummaryGenerationOptions = {}
): ChapterSummary[] {
  return chapters.map(chapter => 
    generateChapterSummary(chapter.title, chapter.content, options)
  );
}

/**
 * 格式化摘要为文本
 */
export function formatSummaryAsText(summary: ChapterSummary): string {
  const lines: string[] = [];
  
  lines.push(`# ${summary.title}`);
  lines.push('');
  lines.push(`**简短摘要：** ${summary.brief}`);
  
  if (summary.detailed) {
    lines.push('');
    lines.push(`**详细摘要：** ${summary.detailed}`);
  }
  
  if (summary.keyCharacters.length > 0) {
    lines.push('');
    lines.push(`**关键人物：** ${summary.keyCharacters.join('、')}`);
  }
  
  if (summary.keyEvents.length > 0) {
    lines.push('');
    lines.push('**关键事件：**');
    summary.keyEvents.forEach((event, i) => {
      lines.push(`${i + 1}. ${event}`);
    });
  }
  
  if (summary.keyLocations.length > 0) {
    lines.push('');
    lines.push(`**关键地点：** ${summary.keyLocations.join('、')}`);
  }
  
  if (summary.plotTags.length > 0) {
    lines.push('');
    lines.push(`**情节标签：** ${summary.plotTags.join('、')}`);
  }
  
  lines.push('');
  lines.push(`**情绪基调：** ${summary.emotionalTone}`);
  lines.push(`**字数：** ${summary.wordCount}`);
  
  return lines.join('\n');
}

/**
 * 格式化摘要为 Markdown
 */
export function formatSummaryAsMarkdown(summary: ChapterSummary): string {
  return formatSummaryAsText(summary);
}

/**
 * 将摘要用于 RAG 检索的格式
 */
export function formatSummaryForRAG(summary: ChapterSummary): string {
  const parts: string[] = [];
  
  parts.push(`章节：${summary.title}`);
  parts.push(`摘要：${summary.brief}`);
  
  if (summary.keyCharacters.length > 0) {
    parts.push(`人物：${summary.keyCharacters.join('、')}`);
  }
  
  if (summary.keyEvents.length > 0) {
    parts.push(`事件：${summary.keyEvents.join('；')}`);
  }
  
  if (summary.plotTags.length > 0) {
    parts.push(`标签：${summary.plotTags.join('、')}`);
  }
  
  return parts.join(' | ');
}
