/**
 * 里程碑系统
 * 
 * 功能：
 * - 10万/50万/100万字里程碑
 * - 自动生成庆祝动画
 * - 生成阶段性总结报告
 * - 创作统计和成就系统
 */

export interface Milestone {
  id: string;
  type: 'word-count' | 'chapter-count' | 'quality' | 'consistency' | 'custom';
  name: string;
  description: string;
  target: number;
  current: number;
  achieved: boolean;
  achievedAt?: number;
  reward?: string;
  icon?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  category: 'writing' | 'quality' | 'consistency' | 'speed' | 'special';
  unlocked: boolean;
  unlockedAt?: number;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface WritingStats {
  totalWords: number;
  totalChapters: number;
  averageChapterWords: number;
  writingDays: number;
  averageWordsPerDay: number;
  longestChapter: number;
  shortestChapter: number;
  totalWritingTime?: number; // 分钟
  fastestChapter?: number; // 最快完成的章节（分钟）
}

export interface QualityStats {
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  improvementRate: number; // 质量提升率
  consistencyScore: number;
  aiFlavorAverage: number;
}

export interface MilestoneReport {
  milestone: Milestone;
  stats: WritingStats;
  qualityStats: QualityStats;
  achievements: Achievement[];
  summary: string;
  highlights: string[];
  nextMilestone?: Milestone;
}

/**
 * 预定义的里程碑
 */
export const PREDEFINED_MILESTONES: Omit<Milestone, 'current' | 'achieved'>[] = [
  {
    id: 'words-10k',
    type: 'word-count',
    name: '初出茅庐',
    description: '完成1万字创作',
    target: 10000,
    reward: '解锁基础分析功能',
    icon: '🌱',
  },
  {
    id: 'words-50k',
    type: 'word-count',
    name: '小有所成',
    description: '完成5万字创作',
    target: 50000,
    reward: '解锁高级分析功能',
    icon: '🌿',
  },
  {
    id: 'words-100k',
    type: 'word-count',
    name: '渐入佳境',
    description: '完成10万字创作',
    target: 100000,
    reward: '解锁批量优化功能',
    icon: '🌳',
  },
  {
    id: 'words-500k',
    type: 'word-count',
    name: '著作等身',
    description: '完成50万字创作',
    target: 500000,
    reward: '解锁全部高级功能',
    icon: '🏆',
  },
  {
    id: 'words-1m',
    type: 'word-count',
    name: '百万字作家',
    description: '完成100万字创作',
    target: 1000000,
    reward: '传奇作家称号',
    icon: '👑',
  },
  {
    id: 'chapters-50',
    type: 'chapter-count',
    name: '五十章达成',
    description: '完成50章创作',
    target: 50,
    icon: '📖',
  },
  {
    id: 'chapters-100',
    type: 'chapter-count',
    name: '百章里程碑',
    description: '完成100章创作',
    target: 100,
    icon: '📚',
  },
  {
    id: 'quality-80',
    type: 'quality',
    name: '品质保证',
    description: '平均质量分达到80分',
    target: 80,
    icon: '⭐',
  },
  {
    id: 'consistency-90',
    type: 'consistency',
    name: '一致性大师',
    description: '一致性分数达到90分',
    target: 90,
    icon: '🎯',
  },
];

/**
 * 预定义的成就
 */
export const PREDEFINED_ACHIEVEMENTS: Omit<Achievement, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first-chapter',
    name: '第一章',
    description: '完成第一章创作',
    category: 'writing',
    icon: '✍️',
    rarity: 'common',
  },
  {
    id: 'daily-writer',
    name: '每日一更',
    description: '连续7天每天更新',
    category: 'consistency',
    icon: '📅',
    rarity: 'rare',
  },
  {
    id: 'speed-demon',
    name: '速度恶魔',
    description: '单日完成1万字',
    category: 'speed',
    icon: '⚡',
    rarity: 'epic',
  },
  {
    id: 'quality-master',
    name: '质量大师',
    description: '连续10章质量分超过85',
    category: 'quality',
    icon: '💎',
    rarity: 'epic',
  },
  {
    id: 'perfectionist',
    name: '完美主义者',
    description: '单章质量分达到95分以上',
    category: 'quality',
    icon: '🌟',
    rarity: 'legendary',
  },
  {
    id: 'marathon-writer',
    name: '马拉松作家',
    description: '单次写作超过4小时',
    category: 'special',
    icon: '🏃',
    rarity: 'rare',
  },
  {
    id: 'night-owl',
    name: '夜猫子',
    description: '凌晨2点后完成创作',
    category: 'special',
    icon: '🦉',
    rarity: 'common',
  },
];

/**
 * 里程碑系统管理器
 */
export class MilestoneSystem {
  private milestones: Milestone[] = [];
  private achievements: Achievement[] = [];
  private stats: WritingStats;
  private qualityStats: QualityStats;

  constructor() {
    // 初始化预定义里程碑
    this.milestones = PREDEFINED_MILESTONES.map(m => ({
      ...m,
      current: 0,
      achieved: false,
    }));

    // 初始化预定义成就
    this.achievements = PREDEFINED_ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: false,
    }));

    this.stats = {
      totalWords: 0,
      totalChapters: 0,
      averageChapterWords: 0,
      writingDays: 0,
      averageWordsPerDay: 0,
      longestChapter: 0,
      shortestChapter: 0,
    };

    this.qualityStats = {
      averageScore: 0,
      highestScore: 0,
      lowestScore: 100,
      improvementRate: 0,
      consistencyScore: 0,
      aiFlavorAverage: 0,
    };
  }

  /**
   * 更新字数
   */
  updateWordCount(words: number): Milestone[] {
    this.stats.totalWords += words;
    return this.checkMilestones('word-count', this.stats.totalWords);
  }

  /**
   * 更新章节数
   */
  updateChapterCount(chapterWords: number): Milestone[] {
    this.stats.totalChapters++;
    this.stats.totalWords += chapterWords;
    this.stats.averageChapterWords = this.stats.totalWords / this.stats.totalChapters;

    if (chapterWords > this.stats.longestChapter) {
      this.stats.longestChapter = chapterWords;
    }
    if (this.stats.shortestChapter === 0 || chapterWords < this.stats.shortestChapter) {
      this.stats.shortestChapter = chapterWords;
    }

    return this.checkMilestones('chapter-count', this.stats.totalChapters);
  }

  /**
   * 更新质量统计
   */
  updateQualityStats(score: number): Milestone[] {
    const totalScore = this.qualityStats.averageScore * (this.stats.totalChapters - 1) + score;
    this.qualityStats.averageScore = totalScore / this.stats.totalChapters;

    if (score > this.qualityStats.highestScore) {
      this.qualityStats.highestScore = score;
    }
    if (score < this.qualityStats.lowestScore) {
      this.qualityStats.lowestScore = score;
    }

    return this.checkMilestones('quality', this.qualityStats.averageScore);
  }

  /**
   * 检查里程碑
   */
  private checkMilestones(type: Milestone['type'], current: number): Milestone[] {
    const achieved: Milestone[] = [];

    this.milestones.forEach(milestone => {
      if (milestone.type === type && !milestone.achieved) {
        milestone.current = current;
        if (current >= milestone.target) {
          milestone.achieved = true;
          milestone.achievedAt = Date.now();
          achieved.push(milestone);
        }
      }
    });

    return achieved;
  }

  /**
   * 检查成就
   */
  checkAchievements(): Achievement[] {
    const unlocked: Achievement[] = [];

    this.achievements.forEach(achievement => {
      if (!achievement.unlocked) {
        const shouldUnlock = this.shouldUnlockAchievement(achievement);
        if (shouldUnlock) {
          achievement.unlocked = true;
          achievement.unlockedAt = Date.now();
          unlocked.push(achievement);
        }
      }
    });

    return unlocked;
  }

  /**
   * 判断是否应该解锁成就
   */
  private shouldUnlockAchievement(achievement: Achievement): boolean {
    switch (achievement.id) {
      case 'first-chapter':
        return this.stats.totalChapters >= 1;
      case 'quality-master':
        // 简化实现：检查平均分
        return this.qualityStats.averageScore >= 85;
      case 'perfectionist':
        return this.qualityStats.highestScore >= 95;
      default:
        return false;
    }
  }

  /**
   * 获取所有里程碑
   */
  getMilestones(): Milestone[] {
    return this.milestones;
  }

  /**
   * 获取已达成的里程碑
   */
  getAchievedMilestones(): Milestone[] {
    return this.milestones.filter(m => m.achieved);
  }

  /**
   * 获取下一个里程碑
   */
  getNextMilestone(type?: Milestone['type']): Milestone | undefined {
    const unachieved = this.milestones.filter(m => 
      !m.achieved && (!type || m.type === type)
    );
    return unachieved.sort((a, b) => a.target - b.target)[0];
  }

  /**
   * 获取所有成就
   */
  getAchievements(): Achievement[] {
    return this.achievements;
  }

  /**
   * 获取已解锁的成就
   */
  getUnlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.unlocked);
  }

  /**
   * 获取统计数据
   */
  getStats(): WritingStats {
    return this.stats;
  }

  /**
   * 获取质量统计
   */
  getQualityStats(): QualityStats {
    return this.qualityStats;
  }

  /**
   * 生成里程碑报告
   */
  generateMilestoneReport(milestone: Milestone): MilestoneReport {
    const summary = this.generateSummary(milestone);
    const highlights = this.generateHighlights();
    const nextMilestone = this.getNextMilestone(milestone.type);

    return {
      milestone,
      stats: this.stats,
      qualityStats: this.qualityStats,
      achievements: this.getUnlockedAchievements(),
      summary,
      highlights,
      nextMilestone,
    };
  }

  /**
   * 生成摘要
   */
  private generateSummary(milestone: Milestone): string {
    const lines: string[] = [];

    lines.push(`🎉 恭喜达成「${milestone.name}」里程碑！`);
    lines.push('');
    lines.push(`📊 创作统计：`);
    lines.push(`- 总字数：${this.stats.totalWords.toLocaleString()} 字`);
    lines.push(`- 总章节：${this.stats.totalChapters} 章`);
    lines.push(`- 平均章节字数：${Math.round(this.stats.averageChapterWords)} 字`);
    lines.push('');
    lines.push(`⭐ 质量统计：`);
    lines.push(`- 平均质量分：${this.qualityStats.averageScore.toFixed(1)} 分`);
    lines.push(`- 最高分：${this.qualityStats.highestScore.toFixed(1)} 分`);
    lines.push(`- 一致性：${this.qualityStats.consistencyScore.toFixed(1)} 分`);

    return lines.join('\n');
  }

  /**
   * 生成亮点
   */
  private generateHighlights(): string[] {
    const highlights: string[] = [];

    if (this.stats.longestChapter > 5000) {
      highlights.push(`最长章节达到 ${this.stats.longestChapter} 字`);
    }

    if (this.qualityStats.averageScore >= 80) {
      highlights.push('平均质量分超过80分，品质优秀');
    }

    if (this.stats.totalChapters >= 50) {
      highlights.push('已完成50章以上，坚持不懈');
    }

    return highlights;
  }

  /**
   * 生成庆祝动画数据
   */
  generateCelebration(milestone: Milestone): {
    animation: string;
    message: string;
    confetti: boolean;
  } {
    return {
      animation: 'bounce',
      message: `🎉 恭喜达成「${milestone.name}」！${milestone.reward ? `\n🎁 ${milestone.reward}` : ''}`,
      confetti: milestone.target >= 100000, // 10万字以上显示彩带
    };
  }

  /**
   * 添加自定义里程碑
   */
  addCustomMilestone(milestone: Omit<Milestone, 'current' | 'achieved'>): void {
    this.milestones.push({
      ...milestone,
      current: 0,
      achieved: false,
    });
  }

  /**
   * 导出数据
   */
  export(): string {
    return JSON.stringify({
      milestones: this.milestones,
      achievements: this.achievements,
      stats: this.stats,
      qualityStats: this.qualityStats,
    }, null, 2);
  }

  /**
   * 导入数据
   */
  import(data: string): void {
    try {
      const parsed = JSON.parse(data);
      if (parsed.milestones) this.milestones = parsed.milestones;
      if (parsed.achievements) this.achievements = parsed.achievements;
      if (parsed.stats) this.stats = parsed.stats;
      if (parsed.qualityStats) this.qualityStats = parsed.qualityStats;
    } catch (error) {
      throw new Error('导入数据失败：' + (error as Error).message);
    }
  }
}

/**
 * 生成里程碑报告文本
 */
export function formatMilestoneReport(report: MilestoneReport): string {
  const lines: string[] = [];

  lines.push(`# ${report.milestone.icon} ${report.milestone.name}\n`);
  lines.push(report.summary);
  lines.push('');

  if (report.highlights.length > 0) {
    lines.push('## 🌟 亮点');
    report.highlights.forEach(h => lines.push(`- ${h}`));
    lines.push('');
  }

  if (report.achievements.length > 0) {
    lines.push('## 🏆 已解锁成就');
    report.achievements.forEach(a => {
      lines.push(`- ${a.icon} **${a.name}** (${a.rarity})`);
      lines.push(`  ${a.description}`);
    });
    lines.push('');
  }

  if (report.nextMilestone) {
    const progress = (report.nextMilestone.current / report.nextMilestone.target * 100).toFixed(1);
    lines.push('## 🎯 下一个里程碑');
    lines.push(`**${report.nextMilestone.name}**`);
    lines.push(`进度：${report.nextMilestone.current}/${report.nextMilestone.target} (${progress}%)`);
  }

  return lines.join('\n');
}
