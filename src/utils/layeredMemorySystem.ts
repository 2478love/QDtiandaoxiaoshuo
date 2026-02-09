/**
 * 分层记忆系统
 * 
 * 功能：
 * - 核心记忆（人物、世界观、主线）- 永久保留
 * - 近期记忆（最近 10 章）- 高优先级
 * - 长期记忆（全书内容）- 按相关度检索
 * - 智能摘要和关系图谱
 */

export interface CoreMemory {
  characters: CharacterInfo[];
  worldSettings: WorldSetting[];
  mainPlot: PlotPoint[];
  powerSystem: PowerSystemInfo;
  lastUpdated: number;
}

export interface CharacterInfo {
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'minor';
  personality: string[];
  relationships: Record<string, string>; // 与其他角色的关系
  abilities: string[];
  background: string;
  firstAppearance: number; // 章节号
  importance: number; // 0-100
}

export interface WorldSetting {
  type: 'geography' | 'organization' | 'rule' | 'history';
  name: string;
  description: string;
  relatedChapters: number[];
  importance: number;
}

export interface PlotPoint {
  chapterNumber: number;
  type: 'setup' | 'conflict' | 'climax' | 'resolution' | 'twist';
  description: string;
  relatedCharacters: string[];
  importance: number;
}

export interface PowerSystemInfo {
  levels: string[];
  rules: string[];
  limitations: string[];
}

export interface RecentMemory {
  chapterNumber: number;
  summary: string;
  keyEvents: string[];
  characters: string[];
  locations: string[];
  timestamp: number;
}

export interface LongTermMemory {
  chapterNumber: number;
  summary: string;
  embedding?: number[]; // 用于相似度检索
  keywords: string[];
  importance: number;
}

export interface MemoryQuery {
  query: string;
  type?: 'character' | 'plot' | 'world' | 'all';
  limit?: number;
  minRelevance?: number;
}

export interface MemorySearchResult {
  type: 'core' | 'recent' | 'longterm';
  content: string;
  relevance: number;
  chapterNumber?: number;
  metadata?: Record<string, any>;
}

/**
 * 分层记忆系统管理器
 */
export class LayeredMemorySystem {
  private coreMemory: CoreMemory;
  private recentMemory: RecentMemory[] = [];
  private longTermMemory: LongTermMemory[] = [];
  private maxRecentChapters: number;

  constructor(maxRecentChapters: number = 10) {
    this.maxRecentChapters = maxRecentChapters;
    this.coreMemory = {
      characters: [],
      worldSettings: [],
      mainPlot: [],
      powerSystem: { levels: [], rules: [], limitations: [] },
      lastUpdated: Date.now(),
    };
  }

  /**
   * 添加核心记忆 - 人物
   */
  addCharacter(character: CharacterInfo): void {
    const existing = this.coreMemory.characters.findIndex(c => c.name === character.name);
    if (existing >= 0) {
      this.coreMemory.characters[existing] = character;
    } else {
      this.coreMemory.characters.push(character);
    }
    this.coreMemory.lastUpdated = Date.now();
  }

  /**
   * 添加世界设定
   */
  addWorldSetting(setting: WorldSetting): void {
    const existing = this.coreMemory.worldSettings.findIndex(s => s.name === setting.name);
    if (existing >= 0) {
      this.coreMemory.worldSettings[existing] = setting;
    } else {
      this.coreMemory.worldSettings.push(setting);
    }
    this.coreMemory.lastUpdated = Date.now();
  }

  /**
   * 添加主线情节点
   */
  addPlotPoint(plotPoint: PlotPoint): void {
    this.coreMemory.mainPlot.push(plotPoint);
    // 按章节号排序
    this.coreMemory.mainPlot.sort((a, b) => a.chapterNumber - b.chapterNumber);
    this.coreMemory.lastUpdated = Date.now();
  }

  /**
   * 设置力量体系
   */
  setPowerSystem(powerSystem: PowerSystemInfo): void {
    this.coreMemory.powerSystem = powerSystem;
    this.coreMemory.lastUpdated = Date.now();
  }

  /**
   * 添加近期记忆
   */
  addRecentMemory(memory: RecentMemory): void {
    // 检查是否已存在
    const existing = this.recentMemory.findIndex(m => m.chapterNumber === memory.chapterNumber);
    if (existing >= 0) {
      this.recentMemory[existing] = memory;
    } else {
      this.recentMemory.push(memory);
    }

    // 按章节号排序
    this.recentMemory.sort((a, b) => b.chapterNumber - a.chapterNumber);

    // 保持最近 N 章
    if (this.recentMemory.length > this.maxRecentChapters) {
      const removed = this.recentMemory.splice(this.maxRecentChapters);
      // 将移除的记忆转为长期记忆
      removed.forEach(r => this.archiveToLongTerm(r));
    }
  }

  /**
   * 归档到长期记忆
   */
  private archiveToLongTerm(recent: RecentMemory): void {
    const longTerm: LongTermMemory = {
      chapterNumber: recent.chapterNumber,
      summary: recent.summary,
      keywords: [...recent.characters, ...recent.locations, ...recent.keyEvents.slice(0, 3)],
      importance: this.calculateImportance(recent),
    };
    this.longTermMemory.push(longTerm);
  }

  /**
   * 计算章节重要性
   */
  private calculateImportance(memory: RecentMemory): number {
    let score = 50; // 基础分

    // 关键事件越多，越重要
    score += Math.min(memory.keyEvents.length * 5, 20);

    // 涉及主要角色越多，越重要
    const mainCharacters = this.coreMemory.characters
      .filter(c => c.role === 'protagonist' || c.role === 'antagonist')
      .map(c => c.name);
    const mainCharCount = memory.characters.filter(c => mainCharacters.includes(c)).length;
    score += mainCharCount * 10;

    return Math.min(score, 100);
  }

  /**
   * 搜索记忆
   */
  search(query: MemoryQuery): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];
    const limit = query.limit || 10;
    const minRelevance = query.minRelevance || 0.3;

    // 搜索核心记忆
    if (!query.type || query.type === 'character' || query.type === 'all') {
      this.coreMemory.characters.forEach(char => {
        const relevance = this.calculateRelevance(query.query, [
          char.name,
          ...char.personality,
          char.background,
          ...char.abilities,
        ]);
        if (relevance >= minRelevance) {
          results.push({
            type: 'core',
            content: `角色：${char.name}\n性格：${char.personality.join('、')}\n背景：${char.background}`,
            relevance,
            metadata: { character: char },
          });
        }
      });
    }

    if (!query.type || query.type === 'world' || query.type === 'all') {
      this.coreMemory.worldSettings.forEach(setting => {
        const relevance = this.calculateRelevance(query.query, [
          setting.name,
          setting.description,
        ]);
        if (relevance >= minRelevance) {
          results.push({
            type: 'core',
            content: `设定：${setting.name}\n${setting.description}`,
            relevance,
            metadata: { worldSetting: setting },
          });
        }
      });
    }

    if (!query.type || query.type === 'plot' || query.type === 'all') {
      this.coreMemory.mainPlot.forEach(plot => {
        const relevance = this.calculateRelevance(query.query, [
          plot.description,
          ...plot.relatedCharacters,
        ]);
        if (relevance >= minRelevance) {
          results.push({
            type: 'core',
            content: `第${plot.chapterNumber}章 - ${plot.type}：${plot.description}`,
            relevance,
            chapterNumber: plot.chapterNumber,
            metadata: { plotPoint: plot },
          });
        }
      });
    }

    // 搜索近期记忆（只在 type 为 all 或未指定时）
    if (!query.type || query.type === 'all') {
      this.recentMemory.forEach(memory => {
        const relevance = this.calculateRelevance(query.query, [
          memory.summary,
          ...memory.keyEvents,
          ...memory.characters,
          ...memory.locations,
        ]);
        if (relevance >= minRelevance) {
          results.push({
            type: 'recent',
            content: `第${memory.chapterNumber}章：${memory.summary}`,
            relevance: relevance * 1.2, // 近期记忆加权
            chapterNumber: memory.chapterNumber,
            metadata: { recentMemory: memory },
          });
        }
      });
    }

    // 搜索长期记忆（只在 type 为 all 或未指定时）
    if (!query.type || query.type === 'all') {
      this.longTermMemory.forEach(memory => {
        const relevance = this.calculateRelevance(query.query, [
          memory.summary,
          ...memory.keywords,
        ]);
        if (relevance >= minRelevance) {
          results.push({
            type: 'longterm',
            content: `第${memory.chapterNumber}章：${memory.summary}`,
            relevance: relevance * (memory.importance / 100), // 按重要性加权
            chapterNumber: memory.chapterNumber,
            metadata: { longTermMemory: memory },
          });
        }
      });
    }

    // 按相关度排序并限制数量
    return results
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, limit);
  }

  /**
   * 计算相关度（简单的关键词匹配）
   */
  private calculateRelevance(query: string, texts: string[]): number {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
    
    if (queryWords.length === 0 || texts.length === 0) {
      return 0;
    }

    let maxRelevance = 0;

    texts.forEach(text => {
      if (!text) return;
      
      const textLower = text.toLowerCase();
      let matchCount = 0;
      
      queryWords.forEach(word => {
        if (textLower.includes(word)) {
          matchCount++;
        }
      });
      
      const relevance = matchCount / queryWords.length;
      maxRelevance = Math.max(maxRelevance, relevance);
    });

    return maxRelevance;
  }

  /**
   * 获取核心记忆
   */
  getCoreMemory(): CoreMemory {
    return this.coreMemory;
  }

  /**
   * 获取近期记忆
   */
  getRecentMemory(): RecentMemory[] {
    return this.recentMemory;
  }

  /**
   * 获取长期记忆
   */
  getLongTermMemory(): LongTermMemory[] {
    return this.longTermMemory;
  }

  /**
   * 生成关系图谱
   */
  generateRelationshipGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};

    this.coreMemory.characters.forEach(char => {
      graph[char.name] = Object.keys(char.relationships);
    });

    return graph;
  }

  /**
   * 生成智能摘要
   */
  generateSmartSummary(chapterRange?: { start: number; end: number }): string {
    const lines: string[] = [];

    // 核心信息
    lines.push('## 核心记忆');
    lines.push(`\n### 主要角色 (${this.coreMemory.characters.length})`);
    this.coreMemory.characters
      .filter(c => c.role === 'protagonist' || c.role === 'antagonist')
      .forEach(char => {
        lines.push(`- **${char.name}** (${char.role}): ${char.personality.slice(0, 3).join('、')}`);
      });

    lines.push(`\n### 世界设定 (${this.coreMemory.worldSettings.length})`);
    this.coreMemory.worldSettings
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)
      .forEach(setting => {
        lines.push(`- **${setting.name}**: ${setting.description.slice(0, 50)}...`);
      });

    // 近期剧情
    if (this.recentMemory.length > 0) {
      lines.push(`\n## 近期剧情 (最近${this.recentMemory.length}章)`);
      this.recentMemory.slice(0, 5).forEach(memory => {
        lines.push(`\n### 第${memory.chapterNumber}章`);
        lines.push(memory.summary);
        if (memory.keyEvents.length > 0) {
          lines.push(`关键事件：${memory.keyEvents.slice(0, 3).join('、')}`);
        }
      });
    }

    return lines.join('\n');
  }

  /**
   * 导出记忆数据
   */
  export(): string {
    return JSON.stringify({
      core: this.coreMemory,
      recent: this.recentMemory,
      longterm: this.longTermMemory,
    }, null, 2);
  }

  /**
   * 导入记忆数据
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.core) this.coreMemory = parsed.core;
      if (parsed.recent) this.recentMemory = parsed.recent;
      if (parsed.longterm) this.longTermMemory = parsed.longterm;
    } catch (error) {
      throw new Error('导入记忆数据失败：' + (error as Error).message);
    }
  }

  /**
   * 清空所有记忆
   */
  clear(): void {
    this.coreMemory = {
      characters: [],
      worldSettings: [],
      mainPlot: [],
      powerSystem: { levels: [], rules: [], limitations: [] },
      lastUpdated: Date.now(),
    };
    this.recentMemory = [];
    this.longTermMemory = [];
  }

  /**
   * 获取统计信息
   */
  getStats(): Record<string, number> {
    return {
      totalCharacters: this.coreMemory.characters.length,
      totalWorldSettings: this.coreMemory.worldSettings.length,
      totalPlotPoints: this.coreMemory.mainPlot.length,
      recentChapters: this.recentMemory.length,
      longTermChapters: this.longTermMemory.length,
      totalMemorySize: this.recentMemory.length + this.longTermMemory.length,
    };
  }
}

/**
 * 从章节文本自动提取记忆
 */
export function extractMemoryFromChapter(
  chapterNumber: number,
  chapterText: string
): RecentMemory {
  // 简单的关键信息提取
  const lines = chapterText.split('\n').filter(l => l.trim());
  
  // 提取人物（简单规则：对话中的名字）
  const characters = new Set<string>();
  // 匹配 "xxx说" 或 "xxx道" 等模式，使用词边界
  const speakerPattern = /([^\s，。！？：；、\n"「『]{2,4})(说道?|问道?|答道?|笑道?|怒道?|叹道?)(?:[：:，。！？\s"「]|$)/g;
  let match;
  while ((match = speakerPattern.exec(chapterText)) !== null) {
    const name = match[1];
    if (name.length >= 2 && name.length <= 4 && !/[的了着过]$/.test(name)) {
      characters.add(name);
    }
  }
  
  // 额外匹配 "xxx回答" 模式
  const answerPattern = /([^\s，。！？：；、\n"「『]{2,4})回答/g;
  while ((match = answerPattern.exec(chapterText)) !== null) {
    const name = match[1];
    if (name.length >= 2 && name.length <= 4 && !/[的了着过]$/.test(name)) {
      characters.add(name);
    }
  }

  // 提取地点
  const locations = new Set<string>();
  const locationPattern = /(?:在|到|去|来到|进入|离开)([^\s，。！？：；、]{2,6}(?:城|山|谷|殿|宫|楼|阁|院|室|洞|府))/g;
  while ((match = locationPattern.exec(chapterText)) !== null) {
    locations.add(match[1]);
  }

  // 提取关键事件（包含动作词的句子）
  const keyEvents: string[] = [];
  const actionWords = ['战斗', '修炼', '突破', '发现', '遇到', '击败', '获得', '离开', '到达'];
  lines.forEach(line => {
    if (actionWords.some(word => line.includes(word)) && line.length < 100) {
      keyEvents.push(line.trim());
    }
  });

  // 生成摘要（取前3句）
  const summary = lines.slice(0, 3).join('').slice(0, 200);

  return {
    chapterNumber,
    summary,
    keyEvents: keyEvents.slice(0, 5),
    characters: Array.from(characters),
    locations: Array.from(locations),
    timestamp: Date.now(),
  };
}
