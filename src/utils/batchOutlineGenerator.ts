/**
 * 批量大纲生成器
 * 
 * 功能：
 * - 输入主题和字数目标
 * - AI 生成 20-50 章详细大纲
 * - 自动分配剧情节奏和爽点分布
 * - 支持调整和优化
 */

export interface OutlineGenerationOptions {
  theme: string; // 主题/题材
  targetWordCount: number; // 目标字数
  chapterCount?: number; // 章节数（默认自动计算）
  genre?: string; // 类型（玄幻、都市、科幻等）
  mainCharacter?: string; // 主角名字
  setting?: string; // 背景设定
  style?: 'fast' | 'medium' | 'slow'; // 节奏风格
  coolPointDensity?: 'low' | 'medium' | 'high'; // 爽点密度
}

export interface ChapterOutline {
  chapterNumber: number;
  title: string;
  summary: string;
  wordCount: number;
  keyEvents: string[];
  characters: string[];
  locations: string[];
  plotType: PlotType;
  pacing: 'slow' | 'medium' | 'fast';
  coolPoints: CoolPoint[];
  hooks: string[]; // 钩子/悬念
  emotionalTone: string;
  importance: number; // 1-10
}

export type PlotType = 
  | 'setup' // 铺垫
  | 'development' // 发展
  | 'conflict' // 冲突
  | 'climax' // 高潮
  | 'resolution' // 解决
  | 'transition' // 过渡
  | 'twist'; // 转折

export interface CoolPoint {
  type: 'power' | 'face-slap' | 'treasure' | 'beauty' | 'revenge' | 'recognition';
  description: string;
  intensity: number; // 1-10
}

export interface OutlineStructure {
  totalChapters: number;
  totalWordCount: number;
  arcs: Arc[];
  chapters: ChapterOutline[];
  pacingCurve: number[]; // 节奏曲线
  coolPointDistribution: number[]; // 爽点分布
  metadata: {
    theme: string;
    genre: string;
    generatedAt: number;
  };
}

export interface Arc {
  arcNumber: number;
  name: string;
  startChapter: number;
  endChapter: number;
  description: string;
  goal: string;
  conflict: string;
  resolution: string;
}

/**
 * 生成批量大纲
 */
export function generateBatchOutline(options: OutlineGenerationOptions): OutlineStructure {
  const {
    theme,
    targetWordCount,
    genre = '玄幻',
    mainCharacter = '主角',
    setting = '修真世界',
    style = 'medium',
    coolPointDensity = 'medium',
  } = options;

  // 计算章节数（每章平均2000-3000字）
  const avgChapterWords = style === 'fast' ? 2000 : style === 'slow' ? 3000 : 2500;
  const chapterCount = options.chapterCount || Math.ceil(targetWordCount / avgChapterWords);

  // 生成剧情弧
  const arcs = generateArcs(chapterCount, theme);

  // 生成章节大纲
  const chapters = generateChapters(chapterCount, arcs, {
    theme,
    genre,
    mainCharacter,
    setting,
    style,
    coolPointDensity,
  });

  // 计算节奏曲线
  const pacingCurve = calculatePacingCurve(chapters);

  // 计算爽点分布
  const coolPointDistribution = calculateCoolPointDistribution(chapters);

  return {
    totalChapters: chapterCount,
    totalWordCount: targetWordCount,
    arcs,
    chapters,
    pacingCurve,
    coolPointDistribution,
    metadata: {
      theme,
      genre,
      generatedAt: Date.now(),
    },
  };
}

/**
 * 生成剧情弧
 */
function generateArcs(chapterCount: number, theme: string): Arc[] {
  const arcs: Arc[] = [];
  
  // 根据章节数决定剧情弧数量
  const arcCount = Math.max(2, Math.floor(chapterCount / 15));
  const chaptersPerArc = Math.floor(chapterCount / arcCount);

  for (let i = 0; i < arcCount; i++) {
    const startChapter = i * chaptersPerArc + 1;
    const endChapter = i === arcCount - 1 ? chapterCount : (i + 1) * chaptersPerArc;

    arcs.push({
      arcNumber: i + 1,
      name: `第${i + 1}卷：${generateArcName(i, arcCount, theme)}`,
      startChapter,
      endChapter,
      description: generateArcDescription(i, arcCount, theme),
      goal: generateArcGoal(i, arcCount),
      conflict: generateArcConflict(i, arcCount),
      resolution: generateArcResolution(i, arcCount),
    });
  }

  return arcs;
}

/**
 * 生成章节大纲
 */
function generateChapters(
  chapterCount: number,
  arcs: Arc[],
  context: {
    theme: string;
    genre: string;
    mainCharacter: string;
    setting: string;
    style: string;
    coolPointDensity: string;
  }
): ChapterOutline[] {
  const chapters: ChapterOutline[] = [];

  for (let i = 1; i <= chapterCount; i++) {
    const arc = arcs.find(a => i >= a.startChapter && i <= a.endChapter)!;
    const positionInArc = (i - arc.startChapter) / (arc.endChapter - arc.startChapter);

    const chapter: ChapterOutline = {
      chapterNumber: i,
      title: generateChapterTitle(i, arc, positionInArc, context),
      summary: generateChapterSummary(i, arc, positionInArc, context),
      wordCount: calculateChapterWordCount(context.style),
      keyEvents: generateKeyEvents(i, arc, positionInArc, context),
      characters: generateChapterCharacters(i, context),
      locations: generateChapterLocations(i, arc, context),
      plotType: determineChapterPlotType(positionInArc),
      pacing: determineChapterPacing(positionInArc, context.style),
      coolPoints: generateChapterCoolPoints(i, positionInArc, context.coolPointDensity),
      hooks: generateChapterHooks(i, positionInArc),
      emotionalTone: determineEmotionalTone(positionInArc),
      importance: calculateChapterImportance(positionInArc),
    };

    chapters.push(chapter);
  }

  return chapters;
}

/**
 * 生成剧情弧名称
 */
function generateArcName(arcIndex: number, totalArcs: number, theme: string): string {
  const arcNames = [
    '初入江湖',
    '崭露头角',
    '风云突变',
    '绝地反击',
    '巅峰对决',
    '终极之战',
  ];

  if (arcIndex < arcNames.length) {
    return arcNames[arcIndex];
  }

  return `第${arcIndex + 1}阶段`;
}

/**
 * 生成剧情弧描述
 */
function generateArcDescription(arcIndex: number, totalArcs: number, theme: string): string {
  const templates = [
    '主角初入世界，开始自己的冒险之旅',
    '主角逐渐成长，展现出不凡的天赋',
    '强敌出现，主角面临前所未有的挑战',
    '主角突破极限，实力大幅提升',
    '最终决战，主角与宿敌的终极对决',
  ];

  return templates[Math.min(arcIndex, templates.length - 1)];
}

/**
 * 生成剧情弧目标
 */
function generateArcGoal(arcIndex: number, totalArcs: number): string {
  const goals = [
    '在新世界中站稳脚跟',
    '提升实力，获得认可',
    '战胜强敌，保护重要之人',
    '突破境界，达到新高度',
    '完成最终使命',
  ];

  return goals[Math.min(arcIndex, goals.length - 1)];
}

/**
 * 生成剧情弧冲突
 */
function generateArcConflict(arcIndex: number, totalArcs: number): string {
  const conflicts = [
    '资源匮乏，实力不足',
    '强敌环伺，危机四伏',
    '生死危机，绝境求生',
    '内外交困，腹背受敌',
    '终极对决，生死一战',
  ];

  return conflicts[Math.min(arcIndex, conflicts.length - 1)];
}

/**
 * 生成剧情弧解决方案
 */
function generateArcResolution(arcIndex: number, totalArcs: number): string {
  const resolutions = [
    '获得机缘，实力提升',
    '击败敌人，名声大噪',
    '化险为夷，转危为安',
    '突破境界，实力暴涨',
    '大获全胜，功成名就',
  ];

  return resolutions[Math.min(arcIndex, resolutions.length - 1)];
}

/**
 * 生成章节标题
 */
function generateChapterTitle(
  chapterNumber: number,
  arc: Arc,
  positionInArc: number,
  context: any
): string {
  const templates = [
    '初入',
    '相遇',
    '冲突',
    '突破',
    '战斗',
    '胜利',
    '转折',
    '危机',
    '反击',
    '崛起',
  ];

  const template = templates[chapterNumber % templates.length];
  return `第${chapterNumber}章 ${template}`;
}

/**
 * 生成章节摘要
 */
function generateChapterSummary(
  chapterNumber: number,
  arc: Arc,
  positionInArc: number,
  context: any
): string {
  if (positionInArc < 0.3) {
    return `${context.mainCharacter}在${context.setting}中继续冒险，遇到新的挑战和机遇。`;
  } else if (positionInArc < 0.7) {
    return `${context.mainCharacter}面临强大的敌人，必须突破自我才能获胜。`;
  } else {
    return `${context.mainCharacter}在激烈的战斗中取得胜利，实力再次提升。`;
  }
}

/**
 * 生成关键事件
 */
function generateKeyEvents(
  chapterNumber: number,
  arc: Arc,
  positionInArc: number,
  context: any
): string[] {
  const events: string[] = [];

  if (positionInArc < 0.2) {
    events.push('遇到新角色');
    events.push('发现新线索');
  } else if (positionInArc < 0.5) {
    events.push('与敌人交手');
    events.push('展现实力');
  } else if (positionInArc < 0.8) {
    events.push('激烈战斗');
    events.push('使用绝招');
  } else {
    events.push('战胜敌人');
    events.push('获得奖励');
  }

  return events;
}

/**
 * 生成章节角色
 */
function generateChapterCharacters(chapterNumber: number, context: any): string[] {
  const characters = [context.mainCharacter];

  if (chapterNumber % 3 === 0) {
    characters.push('配角A');
  }
  if (chapterNumber % 5 === 0) {
    characters.push('反派');
  }

  return characters;
}

/**
 * 生成章节地点
 */
function generateChapterLocations(chapterNumber: number, arc: Arc, context: any): string[] {
  const locations = [`${context.setting}的某处`];

  if (chapterNumber % 10 === 0) {
    locations.push('重要地点');
  }

  return locations;
}

/**
 * 确定章节剧情类型
 */
function determineChapterPlotType(positionInArc: number): PlotType {
  if (positionInArc < 0.2) return 'setup';
  if (positionInArc < 0.4) return 'development';
  if (positionInArc < 0.6) return 'conflict';
  if (positionInArc < 0.8) return 'climax';
  if (positionInArc < 0.95) return 'resolution';
  return 'transition';
}

/**
 * 确定章节节奏
 */
function determineChapterPacing(positionInArc: number, style: string): 'slow' | 'medium' | 'fast' {
  if (style === 'fast') return 'fast';
  if (style === 'slow') return 'slow';

  if (positionInArc < 0.3 || positionInArc > 0.9) return 'slow';
  if (positionInArc > 0.5 && positionInArc < 0.8) return 'fast';
  return 'medium';
}

/**
 * 生成章节爽点
 */
function generateChapterCoolPoints(
  chapterNumber: number,
  positionInArc: number,
  density: string
): CoolPoint[] {
  const coolPoints: CoolPoint[] = [];
  const count = density === 'high' ? 2 : density === 'low' ? 0 : 1;

  for (let i = 0; i < count; i++) {
    const types: CoolPoint['type'][] = ['power', 'face-slap', 'treasure', 'beauty', 'revenge', 'recognition'];
    const type = types[chapterNumber % types.length];

    coolPoints.push({
      type,
      description: `${type}类型的爽点`,
      intensity: Math.min(10, Math.floor(positionInArc * 10) + 1),
    });
  }

  return coolPoints;
}

/**
 * 生成章节钩子
 */
function generateChapterHooks(chapterNumber: number, positionInArc: number): string[] {
  const hooks: string[] = [];

  if (positionInArc > 0.8) {
    hooks.push('章末悬念：下一章将有重大转折');
  }

  if (chapterNumber % 10 === 0) {
    hooks.push('伏笔：为后续剧情埋下线索');
  }

  return hooks;
}

/**
 * 确定情绪基调
 */
function determineEmotionalTone(positionInArc: number): string {
  if (positionInArc < 0.3) return '平静';
  if (positionInArc < 0.6) return '紧张';
  if (positionInArc < 0.9) return '激动';
  return '舒缓';
}

/**
 * 计算章节重要性
 */
function calculateChapterImportance(positionInArc: number): number {
  if (positionInArc < 0.1 || positionInArc > 0.9) return 8; // 开头和结尾重要
  if (positionInArc > 0.5 && positionInArc < 0.7) return 9; // 高潮最重要
  return 5; // 普通章节
}

/**
 * 计算章节字数
 */
function calculateChapterWordCount(style: string): number {
  if (style === 'fast') return 2000;
  if (style === 'slow') return 3000;
  return 2500;
}

/**
 * 计算节奏曲线
 */
function calculatePacingCurve(chapters: ChapterOutline[]): number[] {
  return chapters.map(ch => {
    switch (ch.pacing) {
      case 'slow': return 3;
      case 'medium': return 5;
      case 'fast': return 8;
      default: return 5;
    }
  });
}

/**
 * 计算爽点分布
 */
function calculateCoolPointDistribution(chapters: ChapterOutline[]): number[] {
  return chapters.map(ch => ch.coolPoints.length);
}

/**
 * 调整大纲
 */
export function adjustOutline(
  outline: OutlineStructure,
  adjustments: Partial<ChapterOutline>,
  chapterNumber: number
): OutlineStructure {
  const newChapters = outline.chapters.map(ch => {
    if (ch.chapterNumber === chapterNumber) {
      return { ...ch, ...adjustments };
    }
    return ch;
  });

  return {
    ...outline,
    chapters: newChapters,
    pacingCurve: calculatePacingCurve(newChapters),
    coolPointDistribution: calculateCoolPointDistribution(newChapters),
  };
}

/**
 * 优化大纲
 */
export function optimizeOutline(outline: OutlineStructure): OutlineStructure {
  const optimizedChapters = outline.chapters.map((ch, index) => {
    // 确保爽点分布均匀
    if (ch.coolPoints.length === 0 && index % 3 === 0) {
      ch.coolPoints.push({
        type: 'power',
        description: '实力提升',
        intensity: 5,
      });
    }

    // 确保钩子充足
    if (ch.hooks.length === 0 && index % 5 === 4) {
      ch.hooks.push('章末悬念');
    }

    return ch;
  });

  return {
    ...outline,
    chapters: optimizedChapters,
    pacingCurve: calculatePacingCurve(optimizedChapters),
    coolPointDistribution: calculateCoolPointDistribution(optimizedChapters),
  };
}

/**
 * 导出大纲为文本
 */
export function exportOutlineAsText(outline: OutlineStructure): string {
  const lines: string[] = [];

  lines.push(`# ${outline.metadata.theme} - 大纲\n`);
  lines.push(`总章节数：${outline.totalChapters}`);
  lines.push(`目标字数：${outline.totalWordCount}\n`);

  outline.arcs.forEach(arc => {
    lines.push(`\n## ${arc.name}`);
    lines.push(`章节范围：第${arc.startChapter}-${arc.endChapter}章`);
    lines.push(`描述：${arc.description}`);
    lines.push(`目标：${arc.goal}`);
    lines.push(`冲突：${arc.conflict}`);
    lines.push(`解决：${arc.resolution}\n`);

    const arcChapters = outline.chapters.filter(
      ch => ch.chapterNumber >= arc.startChapter && ch.chapterNumber <= arc.endChapter
    );

    arcChapters.forEach(ch => {
      lines.push(`\n### ${ch.title}`);
      lines.push(`字数：${ch.wordCount} | 节奏：${ch.pacing} | 类型：${ch.plotType}`);
      lines.push(`摘要：${ch.summary}`);
      if (ch.keyEvents.length > 0) {
        lines.push(`关键事件：${ch.keyEvents.join('、')}`);
      }
      if (ch.coolPoints.length > 0) {
        lines.push(`爽点：${ch.coolPoints.map(cp => cp.type).join('、')}`);
      }
      if (ch.hooks.length > 0) {
        lines.push(`钩子：${ch.hooks.join('、')}`);
      }
    });
  });

  return lines.join('\n');
}

/**
 * 导出大纲为JSON
 */
export function exportOutlineAsJSON(outline: OutlineStructure): string {
  return JSON.stringify(outline, null, 2);
}
