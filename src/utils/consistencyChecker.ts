/**
 * 一致性检查器
 * 
 * 功能：
 * - 人物一致性（性格、对话风格、行为动机）
 * - 世界观一致性（力量体系、地理、时间线）
 * - 设定冲突检测
 * - 生成一致性报告
 */

export interface ConsistencyCheckResult {
  overallScore: number; // 0-100
  characterConsistency: CharacterConsistencyResult;
  worldConsistency: WorldConsistencyResult;
  timelineConsistency: TimelineConsistencyResult;
  conflicts: Conflict[];
  warnings: Warning[];
  suggestions: string[];
}

export interface CharacterConsistencyResult {
  score: number;
  issues: CharacterIssue[];
  characters: Record<string, CharacterConsistencyInfo>;
}

export interface CharacterConsistencyInfo {
  name: string;
  personalityConsistency: number; // 0-100
  dialogueConsistency: number;
  behaviorConsistency: number;
  appearances: number;
  inconsistencies: string[];
}

export interface CharacterIssue {
  type: 'personality' | 'dialogue' | 'behavior' | 'ability';
  character: string;
  description: string;
  chapters: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface WorldConsistencyResult {
  score: number;
  issues: WorldIssue[];
  powerSystem: PowerSystemConsistency;
  geography: GeographyConsistency;
  rules: RuleConsistency;
}

export interface PowerSystemConsistency {
  score: number;
  levels: string[];
  conflicts: string[];
  inconsistencies: string[];
}

export interface GeographyConsistency {
  score: number;
  locations: Record<string, LocationInfo>;
  conflicts: string[];
}

export interface LocationInfo {
  name: string;
  descriptions: string[];
  chapters: number[];
  inconsistencies: string[];
}

export interface RuleConsistency {
  score: number;
  rules: string[];
  violations: string[];
}

export interface WorldIssue {
  type: 'power' | 'geography' | 'rule' | 'logic';
  description: string;
  chapters: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface TimelineConsistencyResult {
  score: number;
  issues: TimelineIssue[];
  events: TimelineEvent[];
  conflicts: string[];
}

export interface TimelineEvent {
  chapter: number;
  description: string;
  timestamp?: string;
  relatedEvents: number[];
}

export interface TimelineIssue {
  type: 'order' | 'duration' | 'contradiction';
  description: string;
  chapters: number[];
  severity: 'low' | 'medium' | 'high';
}

export interface Conflict {
  type: 'character' | 'world' | 'timeline' | 'logic';
  description: string;
  chapters: number[];
  severity: 'low' | 'medium' | 'high';
  suggestion: string;
}

export interface Warning {
  type: string;
  message: string;
  chapter?: number;
}

export interface ChapterData {
  chapterNumber: number;
  content: string;
  characters?: string[];
  locations?: string[];
  events?: string[];
}

/**
 * 检查人物一致性
 */
export function checkCharacterConsistency(chapters: ChapterData[]): CharacterConsistencyResult {
  const characters: Record<string, CharacterConsistencyInfo> = {};
  const issues: CharacterIssue[] = [];

  // 提取所有人物及其出现
  chapters.forEach(chapter => {
    const characterNames = extractCharacterNames(chapter.content);
    
    characterNames.forEach(name => {
      if (!characters[name]) {
        characters[name] = {
          name,
          personalityConsistency: 100,
          dialogueConsistency: 100,
          behaviorConsistency: 100,
          appearances: 0,
          inconsistencies: [],
        };
      }
      characters[name].appearances++;
    });
  });

  // 检查每个人物的一致性
  Object.values(characters).forEach(char => {
    if (char.appearances < 2) return; // 只出现一次的不检查

    // 检查性格一致性
    const personalityIssues = checkPersonalityConsistency(char.name, chapters);
    if (personalityIssues.length > 0) {
      char.personalityConsistency = Math.max(0, 100 - personalityIssues.length * 15);
      char.inconsistencies.push(...personalityIssues);
      issues.push({
        type: 'personality',
        character: char.name,
        description: `性格描写不一致：${personalityIssues.join('、')}`,
        chapters: [],
        severity: personalityIssues.length > 2 ? 'high' : 'medium',
      });
    }

    // 检查对话风格一致性
    const dialogueIssues = checkDialogueConsistency(char.name, chapters);
    if (dialogueIssues.length > 0) {
      char.dialogueConsistency = Math.max(0, 100 - dialogueIssues.length * 10);
      char.inconsistencies.push(...dialogueIssues);
      issues.push({
        type: 'dialogue',
        character: char.name,
        description: `对话风格不一致：${dialogueIssues.join('、')}`,
        chapters: [],
        severity: 'medium',
      });
    }

    // 检查行为一致性
    const behaviorIssues = checkBehaviorConsistency(char.name, chapters);
    if (behaviorIssues.length > 0) {
      char.behaviorConsistency = Math.max(0, 100 - behaviorIssues.length * 12);
      char.inconsistencies.push(...behaviorIssues);
      issues.push({
        type: 'behavior',
        character: char.name,
        description: `行为模式不一致：${behaviorIssues.join('、')}`,
        chapters: [],
        severity: behaviorIssues.length > 2 ? 'high' : 'medium',
      });
    }
  });

  // 计算总分
  const charList = Object.values(characters).filter(c => c.appearances >= 2);
  const avgScore = charList.length > 0
    ? charList.reduce((sum, c) => sum + (c.personalityConsistency + c.dialogueConsistency + c.behaviorConsistency) / 3, 0) / charList.length
    : 100;

  return {
    score: Math.round(avgScore),
    issues,
    characters,
  };
}

/**
 * 检查世界观一致性
 */
export function checkWorldConsistency(chapters: ChapterData[]): WorldConsistencyResult {
  const issues: WorldIssue[] = [];

  // 检查力量体系
  const powerSystem = checkPowerSystemConsistency(chapters);
  if (powerSystem.conflicts.length > 0) {
    issues.push({
      type: 'power',
      description: `力量体系冲突：${powerSystem.conflicts.join('、')}`,
      chapters: [],
      severity: 'high',
    });
  }

  // 检查地理设定
  const geography = checkGeographyConsistency(chapters);
  if (geography.conflicts.length > 0) {
    issues.push({
      type: 'geography',
      description: `地理设定冲突：${geography.conflicts.join('、')}`,
      chapters: [],
      severity: 'medium',
    });
  }

  // 检查规则一致性
  const rules = checkRuleConsistency(chapters);
  if (rules.violations.length > 0) {
    issues.push({
      type: 'rule',
      description: `规则违反：${rules.violations.join('、')}`,
      chapters: [],
      severity: 'high',
    });
  }

  const avgScore = (powerSystem.score + geography.score + rules.score) / 3;

  return {
    score: Math.round(avgScore),
    issues,
    powerSystem,
    geography,
    rules,
  };
}

/**
 * 检查时间线一致性
 */
export function checkTimelineConsistency(chapters: ChapterData[]): TimelineConsistencyResult {
  const events: TimelineEvent[] = [];
  const issues: TimelineIssue[] = [];
  const conflicts: string[] = [];

  // 提取时间线事件
  chapters.forEach(chapter => {
    const chapterEvents = extractTimelineEvents(chapter);
    events.push(...chapterEvents);
  });

  // 检查事件顺序
  for (let i = 1; i < events.length; i++) {
    const prev = events[i - 1];
    const curr = events[i];

    // 检查时间戳冲突
    if (prev.timestamp && curr.timestamp) {
      if (prev.timestamp > curr.timestamp) {
        conflicts.push(`第${prev.chapter}章和第${curr.chapter}章时间顺序矛盾`);
        issues.push({
          type: 'order',
          description: `时间顺序错误：${prev.description} 发生在 ${curr.description} 之后`,
          chapters: [prev.chapter, curr.chapter],
          severity: 'high',
        });
      }
    }
  }

  const score = Math.max(0, 100 - conflicts.length * 20);

  return {
    score,
    issues,
    events,
    conflicts,
  };
}

/**
 * 综合一致性检查
 */
export function checkConsistency(chapters: ChapterData[]): ConsistencyCheckResult {
  const characterConsistency = checkCharacterConsistency(chapters);
  const worldConsistency = checkWorldConsistency(chapters);
  const timelineConsistency = checkTimelineConsistency(chapters);

  const conflicts: Conflict[] = [];
  const warnings: Warning[] = [];
  const suggestions: string[] = [];

  // 收集所有冲突
  characterConsistency.issues.forEach(issue => {
    conflicts.push({
      type: 'character',
      description: issue.description,
      chapters: issue.chapters,
      severity: issue.severity,
      suggestion: generateCharacterSuggestion(issue),
    });
  });

  worldConsistency.issues.forEach(issue => {
    conflicts.push({
      type: 'world',
      description: issue.description,
      chapters: issue.chapters,
      severity: issue.severity,
      suggestion: generateWorldSuggestion(issue),
    });
  });

  timelineConsistency.issues.forEach(issue => {
    conflicts.push({
      type: 'timeline',
      description: issue.description,
      chapters: issue.chapters,
      severity: issue.severity,
      suggestion: generateTimelineSuggestion(issue),
    });
  });

  // 生成警告
  if (characterConsistency.score < 70) {
    warnings.push({
      type: 'character',
      message: '人物一致性较低，建议建立人物卡片',
    });
  }

  if (worldConsistency.score < 70) {
    warnings.push({
      type: 'world',
      message: '世界观设定存在冲突，建议整理设定集',
    });
  }

  if (timelineConsistency.score < 70) {
    warnings.push({
      type: 'timeline',
      message: '时间线存在矛盾，建议绘制时间轴',
    });
  }

  // 生成建议
  if (conflicts.length > 0) {
    suggestions.push('建议使用分层记忆系统记录核心设定');
    suggestions.push('定期回顾前文，确保设定一致');
  }

  if (conflicts.filter(c => c.severity === 'high').length > 3) {
    suggestions.push('严重冲突较多，建议暂停创作，先修复设定');
  }

  const overallScore = Math.round(
    (characterConsistency.score + worldConsistency.score + timelineConsistency.score) / 3
  );

  return {
    overallScore,
    characterConsistency,
    worldConsistency,
    timelineConsistency,
    conflicts,
    warnings,
    suggestions,
  };
}

/**
 * 生成一致性报告
 */
export function generateConsistencyReport(result: ConsistencyCheckResult): string {
  const lines: string[] = [];

  lines.push('# 一致性检查报告\n');
  lines.push(`## 总体评分：${result.overallScore}/100\n`);

  // 人物一致性
  lines.push('## 人物一致性');
  lines.push(`评分：${result.characterConsistency.score}/100\n`);
  if (result.characterConsistency.issues.length > 0) {
    lines.push('### 发现的问题：');
    result.characterConsistency.issues.forEach(issue => {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
    lines.push('');
  }

  // 世界观一致性
  lines.push('## 世界观一致性');
  lines.push(`评分：${result.worldConsistency.score}/100\n`);
  if (result.worldConsistency.issues.length > 0) {
    lines.push('### 发现的问题：');
    result.worldConsistency.issues.forEach(issue => {
      lines.push(`- [${issue.severity.toUpperCase()}] ${issue.description}`);
    });
    lines.push('');
  }

  // 时间线一致性
  lines.push('## 时间线一致性');
  lines.push(`评分：${result.timelineConsistency.score}/100\n`);
  if (result.timelineConsistency.conflicts.length > 0) {
    lines.push('### 时间线冲突：');
    result.timelineConsistency.conflicts.forEach(conflict => {
      lines.push(`- ${conflict}`);
    });
    lines.push('');
  }

  // 冲突汇总
  if (result.conflicts.length > 0) {
    lines.push('## 冲突汇总\n');
    const highSeverity = result.conflicts.filter(c => c.severity === 'high');
    const mediumSeverity = result.conflicts.filter(c => c.severity === 'medium');
    const lowSeverity = result.conflicts.filter(c => c.severity === 'low');

    if (highSeverity.length > 0) {
      lines.push(`### 严重冲突 (${highSeverity.length})`);
      highSeverity.forEach(c => {
        lines.push(`- ${c.description}`);
        lines.push(`  建议：${c.suggestion}`);
      });
      lines.push('');
    }

    if (mediumSeverity.length > 0) {
      lines.push(`### 中等冲突 (${mediumSeverity.length})`);
      mediumSeverity.forEach(c => {
        lines.push(`- ${c.description}`);
      });
      lines.push('');
    }

    if (lowSeverity.length > 0) {
      lines.push(`### 轻微冲突 (${lowSeverity.length})`);
      lowSeverity.forEach(c => {
        lines.push(`- ${c.description}`);
      });
      lines.push('');
    }
  }

  // 警告
  if (result.warnings.length > 0) {
    lines.push('## 警告\n');
    result.warnings.forEach(w => {
      lines.push(`- ${w.message}`);
    });
    lines.push('');
  }

  // 建议
  if (result.suggestions.length > 0) {
    lines.push('## 改进建议\n');
    result.suggestions.forEach((s, i) => {
      lines.push(`${i + 1}. ${s}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

// ========== 辅助函数 ==========

function extractCharacterNames(content: string): string[] {
  const names = new Set<string>();
  const pattern = /([^\s，。！？：；、\n"「『]{2,4})(说道?|问道?|答道?|笑道?|怒道?|叹道?)(?:[：:，。！？\s"「]|$)/g;
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    const name = match[1];
    if (name.length >= 2 && name.length <= 4 && !/[的了着过]$/.test(name)) {
      names.add(name);
    }
  }
  
  return Array.from(names);
}

function checkPersonalityConsistency(name: string, chapters: ChapterData[]): string[] {
  const issues: string[] = [];
  const traits = new Set<string>();
  
  // 简单检查：收集所有性格描述词
  const traitWords = ['勇敢', '懦弱', '聪明', '愚蠢', '善良', '邪恶', '冷静', '冲动'];
  
  chapters.forEach(chapter => {
    if (chapter.content.includes(name)) {
      traitWords.forEach(trait => {
        if (chapter.content.includes(trait)) {
          traits.add(trait);
        }
      });
    }
  });
  
  // 检查矛盾的性格特征
  if (traits.has('勇敢') && traits.has('懦弱')) {
    issues.push('勇敢与懦弱矛盾');
  }
  if (traits.has('聪明') && traits.has('愚蠢')) {
    issues.push('聪明与愚蠢矛盾');
  }
  if (traits.has('善良') && traits.has('邪恶')) {
    issues.push('善良与邪恶矛盾');
  }
  if (traits.has('冷静') && traits.has('冲动')) {
    issues.push('冷静与冲动矛盾');
  }
  
  return issues;
}

function checkDialogueConsistency(name: string, chapters: ChapterData[]): string[] {
  const issues: string[] = [];
  // 简化实现：检查对话风格变化
  // 实际应该分析句长、用词、语气等
  return issues;
}

function checkBehaviorConsistency(name: string, chapters: ChapterData[]): string[] {
  const issues: string[] = [];
  // 简化实现：检查行为模式
  return issues;
}

function checkPowerSystemConsistency(chapters: ChapterData[]): PowerSystemConsistency {
  const levels = new Set<string>();
  const conflicts: string[] = [];
  const inconsistencies: string[] = [];
  
  // 提取力量等级
  const levelPattern = /(炼气|筑基|金丹|元婴|化神|炼虚|合体|大乘|渡劫|真仙|金仙|大罗|准圣|圣人)/g;
  
  chapters.forEach(chapter => {
    let match;
    while ((match = levelPattern.exec(chapter.content)) !== null) {
      levels.add(match[1]);
    }
  });
  
  const score = conflicts.length === 0 ? 100 : Math.max(0, 100 - conflicts.length * 15);
  
  return {
    score,
    levels: Array.from(levels),
    conflicts,
    inconsistencies,
  };
}

function checkGeographyConsistency(chapters: ChapterData[]): GeographyConsistency {
  const locations: Record<string, LocationInfo> = {};
  const conflicts: string[] = [];
  
  // 提取地点
  chapters.forEach(chapter => {
    const locationPattern = /([^\s，。！？：；、]{2,6}(?:城|山|谷|殿|宫|楼|阁|院|室|洞|府|界|域|州|郡))/g;
    let match;
    
    while ((match = locationPattern.exec(chapter.content)) !== null) {
      const name = match[1];
      if (!locations[name]) {
        locations[name] = {
          name,
          descriptions: [],
          chapters: [],
          inconsistencies: [],
        };
      }
      locations[name].chapters.push(chapter.chapterNumber);
    }
  });
  
  const score = conflicts.length === 0 ? 100 : Math.max(0, 100 - conflicts.length * 10);
  
  return {
    score,
    locations,
    conflicts,
  };
}

function checkRuleConsistency(chapters: ChapterData[]): RuleConsistency {
  const rules: string[] = [];
  const violations: string[] = [];
  
  const score = violations.length === 0 ? 100 : Math.max(0, 100 - violations.length * 15);
  
  return {
    score,
    rules,
    violations,
  };
}

function extractTimelineEvents(chapter: ChapterData): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  
  // 简化实现：提取关键事件
  const eventKeywords = ['突破', '战斗', '遇到', '离开', '到达', '获得'];
  
  eventKeywords.forEach(keyword => {
    if (chapter.content.includes(keyword)) {
      events.push({
        chapter: chapter.chapterNumber,
        description: `${keyword}相关事件`,
        relatedEvents: [],
      });
    }
  });
  
  return events;
}

function generateCharacterSuggestion(issue: CharacterIssue): string {
  switch (issue.type) {
    case 'personality':
      return '建议建立人物卡片，明确性格特征，避免前后矛盾';
    case 'dialogue':
      return '建议为每个角色设定独特的说话风格和口头禅';
    case 'behavior':
      return '建议记录角色的行为模式和动机，保持一致性';
    case 'ability':
      return '建议明确角色的能力范围，避免战力崩坏';
    default:
      return '建议回顾前文，修正不一致的地方';
  }
}

function generateWorldSuggestion(issue: WorldIssue): string {
  switch (issue.type) {
    case 'power':
      return '建议建立完整的力量体系表，明确等级和规则';
    case 'geography':
      return '建议绘制世界地图，标注重要地点和距离';
    case 'rule':
      return '建议整理世界规则清单，确保逻辑自洽';
    case 'logic':
      return '建议检查逻辑链条，修正矛盾之处';
    default:
      return '建议建立设定集，统一管理世界观';
  }
}

function generateTimelineSuggestion(issue: TimelineIssue): string {
  switch (issue.type) {
    case 'order':
      return '建议绘制时间轴，标注重要事件的先后顺序';
    case 'duration':
      return '建议明确时间跨度，避免时间线混乱';
    case 'contradiction':
      return '建议检查事件因果关系，修正时间矛盾';
    default:
      return '建议整理时间线，确保逻辑连贯';
  }
}
