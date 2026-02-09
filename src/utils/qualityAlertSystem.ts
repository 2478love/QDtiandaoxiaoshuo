/**
 * 质量预警系统
 * 
 * 功能：
 * - 连续低分预警
 * - AI 味超标预警
 * - 爽点密度不足预警
 * - 自动生成改进建议
 */

export interface QualityAlert {
  type: 'low-score' | 'ai-flavor' | 'cool-point' | 'pacing' | 'consistency' | 'repetition';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedChapters: number[];
  metrics: Record<string, number>;
  suggestions: string[];
  priority: number; // 1-10
  timestamp: number;
}

export interface QualityMetrics {
  chapterNumber: number;
  overallScore: number;
  aiFlavorScore: number;
  coolPointDensity: number;
  pacingScore: number;
  consistencyScore: number;
  repetitionScore: number;
  timestamp: number;
}

export interface AlertThresholds {
  lowScoreThreshold: number; // 低于此分数触发预警
  consecutiveLowScoreCount: number; // 连续低分章节数
  aiFlavorThreshold: number; // AI味超标阈值
  coolPointMinDensity: number; // 爽点最低密度（每章）
  pacingMinScore: number; // 节奏最低分
  consistencyMinScore: number; // 一致性最低分
  repetitionMaxScore: number; // 重复度最高分
}

export interface AlertSystemConfig {
  thresholds: AlertThresholds;
  enableAutoSuggestions: boolean;
  alertHistory: QualityAlert[];
  metricsHistory: QualityMetrics[];
}

/**
 * 默认预警阈值
 */
export const DEFAULT_THRESHOLDS: AlertThresholds = {
  lowScoreThreshold: 60,
  consecutiveLowScoreCount: 3,
  aiFlavorThreshold: 70,
  coolPointMinDensity: 0.5,
  pacingMinScore: 50,
  consistencyMinScore: 70,
  repetitionMaxScore: 30,
};

/**
 * 质量预警系统
 */
export class QualityAlertSystem {
  private config: AlertSystemConfig;

  constructor(thresholds: Partial<AlertThresholds> = {}) {
    this.config = {
      thresholds: { ...DEFAULT_THRESHOLDS, ...thresholds },
      enableAutoSuggestions: true,
      alertHistory: [],
      metricsHistory: [],
    };
  }

  /**
   * 添加质量指标
   */
  addMetrics(metrics: QualityMetrics): QualityAlert[] {
    this.config.metricsHistory.push(metrics);
    
    // 检查各种预警条件
    const alerts: QualityAlert[] = [];

    // 1. 检查连续低分
    const lowScoreAlert = this.checkConsecutiveLowScore();
    if (lowScoreAlert) alerts.push(lowScoreAlert);

    // 2. 检查AI味超标
    const aiFlavorAlert = this.checkAIFlavor(metrics);
    if (aiFlavorAlert) alerts.push(aiFlavorAlert);

    // 3. 检查爽点密度
    const coolPointAlert = this.checkCoolPointDensity(metrics);
    if (coolPointAlert) alerts.push(coolPointAlert);

    // 4. 检查节奏问题
    const pacingAlert = this.checkPacing(metrics);
    if (pacingAlert) alerts.push(pacingAlert);

    // 5. 检查一致性问题
    const consistencyAlert = this.checkConsistency(metrics);
    if (consistencyAlert) alerts.push(consistencyAlert);

    // 6. 检查重复度
    const repetitionAlert = this.checkRepetition(metrics);
    if (repetitionAlert) alerts.push(repetitionAlert);

    // 保存预警
    alerts.forEach(alert => {
      this.config.alertHistory.push(alert);
    });

    return alerts;
  }

  /**
   * 检查连续低分
   */
  private checkConsecutiveLowScore(): QualityAlert | null {
    const threshold = this.config.thresholds.lowScoreThreshold;
    const count = this.config.thresholds.consecutiveLowScoreCount;
    
    const recentMetrics = this.config.metricsHistory.slice(-count);
    
    if (recentMetrics.length < count) return null;

    const allLowScore = recentMetrics.every(m => m.overallScore < threshold);
    
    if (allLowScore) {
      const avgScore = recentMetrics.reduce((sum, m) => sum + m.overallScore, 0) / count;
      const chapters = recentMetrics.map(m => m.chapterNumber);

      return {
        type: 'low-score',
        severity: avgScore < 50 ? 'critical' : avgScore < 55 ? 'high' : 'medium',
        title: '连续低分预警',
        description: `最近${count}章的平均分仅为${avgScore.toFixed(1)}分，低于${threshold}分阈值`,
        affectedChapters: chapters,
        metrics: {
          averageScore: avgScore,
          threshold,
          consecutiveCount: count,
        },
        suggestions: [
          '建议暂停创作，回顾前文找出问题',
          '检查剧情是否拖沓或缺乏冲突',
          '增加爽点和钩子，提升吸引力',
          '考虑调整写作节奏或风格',
        ],
        priority: avgScore < 50 ? 10 : avgScore < 55 ? 8 : 6,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 检查AI味超标
   */
  private checkAIFlavor(metrics: QualityMetrics): QualityAlert | null {
    const threshold = this.config.thresholds.aiFlavorThreshold;
    
    if (metrics.aiFlavorScore > threshold) {
      return {
        type: 'ai-flavor',
        severity: metrics.aiFlavorScore >= 85 ? 'high' : metrics.aiFlavorScore >= 75 ? 'medium' : 'low',
        title: 'AI味超标预警',
        description: `第${metrics.chapterNumber}章AI味得分${metrics.aiFlavorScore}，超过${threshold}阈值`,
        affectedChapters: [metrics.chapterNumber],
        metrics: {
          aiFlavorScore: metrics.aiFlavorScore,
          threshold,
        },
        suggestions: [
          '减少过度修饰和堆砌词汇',
          '使用更自然的对话和描写',
          '避免使用AI常用的套路句式',
          '增加人物个性化表达',
          '多用短句，减少长句嵌套',
        ],
        priority: metrics.aiFlavorScore >= 85 ? 9 : metrics.aiFlavorScore >= 75 ? 7 : 5,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 检查爽点密度
   */
  private checkCoolPointDensity(metrics: QualityMetrics): QualityAlert | null {
    const minDensity = this.config.thresholds.coolPointMinDensity;
    
    // 检查最近5章的平均爽点密度
    const recentMetrics = this.config.metricsHistory.slice(-5);
    if (recentMetrics.length < 3) return null;

    const avgDensity = recentMetrics.reduce((sum, m) => sum + m.coolPointDensity, 0) / recentMetrics.length;
    
    if (avgDensity < minDensity) {
      const chapters = recentMetrics.map(m => m.chapterNumber);

      return {
        type: 'cool-point',
        severity: avgDensity <= 0.2 ? 'high' : avgDensity <= 0.3 ? 'medium' : 'low',
        title: '爽点密度不足预警',
        description: `最近${recentMetrics.length}章的平均爽点密度为${avgDensity.toFixed(2)}，低于${minDensity}阈值`,
        affectedChapters: chapters,
        metrics: {
          averageDensity: avgDensity,
          minDensity,
        },
        suggestions: [
          '增加打脸、装逼、获得宝物等爽点',
          '加快剧情节奏，减少铺垫',
          '让主角展现实力或获得认可',
          '设置小高潮和小冲突',
          '每3-5章至少有一个明显爽点',
        ],
        priority: avgDensity <= 0.2 ? 8 : avgDensity <= 0.3 ? 6 : 4,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 检查节奏问题
   */
  private checkPacing(metrics: QualityMetrics): QualityAlert | null {
    const minScore = this.config.thresholds.pacingMinScore;
    
    if (metrics.pacingScore < minScore) {
      return {
        type: 'pacing',
        severity: metrics.pacingScore <= 40 ? 'high' : metrics.pacingScore <= 45 ? 'medium' : 'low',
        title: '节奏问题预警',
        description: `第${metrics.chapterNumber}章节奏得分${metrics.pacingScore}，低于${minScore}阈值`,
        affectedChapters: [metrics.chapterNumber],
        metrics: {
          pacingScore: metrics.pacingScore,
          minScore,
        },
        suggestions: [
          '检查是否有过多的铺垫或描写',
          '加快剧情推进速度',
          '增加冲突和转折',
          '删减不必要的细节',
          '保持读者的阅读兴趣',
        ],
        priority: metrics.pacingScore <= 40 ? 7 : metrics.pacingScore <= 45 ? 5 : 3,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 检查一致性问题
   */
  private checkConsistency(metrics: QualityMetrics): QualityAlert | null {
    const minScore = this.config.thresholds.consistencyMinScore;
    
    if (metrics.consistencyScore < minScore) {
      return {
        type: 'consistency',
        severity: metrics.consistencyScore <= 60 ? 'high' : metrics.consistencyScore <= 65 ? 'medium' : 'low',
        title: '一致性问题预警',
        description: `第${metrics.chapterNumber}章一致性得分${metrics.consistencyScore}，低于${minScore}阈值`,
        affectedChapters: [metrics.chapterNumber],
        metrics: {
          consistencyScore: metrics.consistencyScore,
          minScore,
        },
        suggestions: [
          '检查人物性格是否前后一致',
          '确认世界观设定没有冲突',
          '核对时间线是否合理',
          '使用分层记忆系统记录设定',
          '定期回顾前文内容',
        ],
        priority: metrics.consistencyScore <= 60 ? 9 : metrics.consistencyScore <= 65 ? 7 : 5,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 检查重复度
   */
  private checkRepetition(metrics: QualityMetrics): QualityAlert | null {
    const maxScore = this.config.thresholds.repetitionMaxScore;
    
    if (metrics.repetitionScore > maxScore) {
      return {
        type: 'repetition',
        severity: metrics.repetitionScore >= 40 ? 'high' : metrics.repetitionScore >= 35 ? 'medium' : 'low',
        title: '内容重复预警',
        description: `第${metrics.chapterNumber}章重复度得分${metrics.repetitionScore}，超过${maxScore}阈值`,
        affectedChapters: [metrics.chapterNumber],
        metrics: {
          repetitionScore: metrics.repetitionScore,
          maxScore,
        },
        suggestions: [
          '避免重复使用相同的词汇和句式',
          '减少套路化的情节设计',
          '增加剧情和对话的多样性',
          '使用同义词替换高频词',
          '创新表达方式',
        ],
        priority: metrics.repetitionScore >= 40 ? 6 : metrics.repetitionScore >= 35 ? 4 : 2,
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * 获取所有预警
   */
  getAlerts(filter?: {
    type?: QualityAlert['type'];
    severity?: QualityAlert['severity'];
    minPriority?: number;
  }): QualityAlert[] {
    let alerts = this.config.alertHistory;

    if (filter) {
      if (filter.type) {
        alerts = alerts.filter(a => a.type === filter.type);
      }
      if (filter.severity) {
        alerts = alerts.filter(a => a.severity === filter.severity);
      }
      if (filter.minPriority !== undefined) {
        alerts = alerts.filter(a => a.priority >= filter.minPriority);
      }
    }

    return alerts.sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取未解决的预警
   */
  getActiveAlerts(): QualityAlert[] {
    // 获取最近的预警（24小时内）
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return this.config.alertHistory
      .filter(a => a.timestamp > oneDayAgo)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 获取预警统计
   */
  getAlertStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    activeCount: number;
  } {
    const alerts = this.config.alertHistory;
    const activeAlerts = this.getActiveAlerts();

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};

    alerts.forEach(alert => {
      byType[alert.type] = (byType[alert.type] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    });

    return {
      total: alerts.length,
      byType,
      bySeverity,
      activeCount: activeAlerts.length,
    };
  }

  /**
   * 生成预警报告
   */
  generateAlertReport(): string {
    const lines: string[] = [];
    const activeAlerts = this.getActiveAlerts();
    const stats = this.getAlertStats();

    lines.push('# 质量预警报告\n');
    lines.push(`生成时间：${new Date().toLocaleString()}\n`);

    lines.push('## 预警统计');
    lines.push(`- 总预警数：${stats.total}`);
    lines.push(`- 活跃预警：${stats.activeCount}`);
    lines.push('');

    lines.push('### 按类型统计');
    Object.entries(stats.byType).forEach(([type, count]) => {
      lines.push(`- ${type}: ${count}`);
    });
    lines.push('');

    lines.push('### 按严重程度统计');
    Object.entries(stats.bySeverity).forEach(([severity, count]) => {
      lines.push(`- ${severity}: ${count}`);
    });
    lines.push('');

    if (activeAlerts.length > 0) {
      lines.push('## 活跃预警\n');

      const critical = activeAlerts.filter(a => a.severity === 'critical');
      const high = activeAlerts.filter(a => a.severity === 'high');
      const medium = activeAlerts.filter(a => a.severity === 'medium');
      const low = activeAlerts.filter(a => a.severity === 'low');

      if (critical.length > 0) {
        lines.push('### 🔴 严重预警');
        critical.forEach(alert => {
          lines.push(`\n**${alert.title}**`);
          lines.push(`- ${alert.description}`);
          lines.push(`- 影响章节：${alert.affectedChapters.join(', ')}`);
          lines.push(`- 优先级：${alert.priority}/10`);
          if (alert.suggestions.length > 0) {
            lines.push('- 建议：');
            alert.suggestions.forEach(s => lines.push(`  - ${s}`));
          }
        });
        lines.push('');
      }

      if (high.length > 0) {
        lines.push('### 🟠 高级预警');
        high.forEach(alert => {
          lines.push(`\n**${alert.title}**`);
          lines.push(`- ${alert.description}`);
          lines.push(`- 影响章节：${alert.affectedChapters.join(', ')}`);
        });
        lines.push('');
      }

      if (medium.length > 0) {
        lines.push('### 🟡 中级预警');
        medium.forEach(alert => {
          lines.push(`- ${alert.title}: ${alert.description}`);
        });
        lines.push('');
      }

      if (low.length > 0) {
        lines.push('### 🟢 低级预警');
        low.forEach(alert => {
          lines.push(`- ${alert.title}`);
        });
        lines.push('');
      }
    } else {
      lines.push('## ✅ 暂无活跃预警\n');
    }

    return lines.join('\n');
  }

  /**
   * 清除历史预警
   */
  clearHistory(olderThan?: number): void {
    if (olderThan) {
      this.config.alertHistory = this.config.alertHistory.filter(
        a => a.timestamp > olderThan
      );
      this.config.metricsHistory = this.config.metricsHistory.filter(
        m => m.timestamp > olderThan
      );
    } else {
      this.config.alertHistory = [];
      this.config.metricsHistory = [];
    }
  }

  /**
   * 更新阈值
   */
  updateThresholds(thresholds: Partial<AlertThresholds>): void {
    this.config.thresholds = { ...this.config.thresholds, ...thresholds };
  }

  /**
   * 获取配置
   */
  getConfig(): AlertSystemConfig {
    return this.config;
  }
}

/**
 * 创建质量指标
 */
export function createQualityMetrics(
  chapterNumber: number,
  scores: {
    overall: number;
    aiFlavor: number;
    coolPointDensity: number;
    pacing: number;
    consistency: number;
    repetition: number;
  }
): QualityMetrics {
  return {
    chapterNumber,
    overallScore: scores.overall,
    aiFlavorScore: scores.aiFlavor,
    coolPointDensity: scores.coolPointDensity,
    pacingScore: scores.pacing,
    consistencyScore: scores.consistency,
    repetitionScore: scores.repetition,
    timestamp: Date.now(),
  };
}
