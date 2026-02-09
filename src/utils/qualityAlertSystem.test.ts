import { describe, it, expect, beforeEach } from 'vitest';
import {
  QualityAlertSystem,
  createQualityMetrics,
  DEFAULT_THRESHOLDS,
  type QualityMetrics,
} from './qualityAlertSystem';

describe('QualityAlertSystem', () => {
  let system: QualityAlertSystem;

  beforeEach(() => {
    system = new QualityAlertSystem();
  });

  describe('Initialization', () => {
    it('should initialize with default thresholds', () => {
      const config = system.getConfig();
      expect(config.thresholds).toEqual(DEFAULT_THRESHOLDS);
    });

    it('should accept custom thresholds', () => {
      const customSystem = new QualityAlertSystem({
        lowScoreThreshold: 50,
        aiFlavorThreshold: 80,
      });
      
      const config = customSystem.getConfig();
      expect(config.thresholds.lowScoreThreshold).toBe(50);
      expect(config.thresholds.aiFlavorThreshold).toBe(80);
    });

    it('should have empty history initially', () => {
      const config = system.getConfig();
      expect(config.alertHistory).toHaveLength(0);
      expect(config.metricsHistory).toHaveLength(0);
    });
  });

  describe('createQualityMetrics', () => {
    it('should create quality metrics', () => {
      const metrics = createQualityMetrics(1, {
        overall: 75,
        aiFlavor: 60,
        coolPointDensity: 0.8,
        pacing: 70,
        consistency: 80,
        repetition: 20,
      });

      expect(metrics.chapterNumber).toBe(1);
      expect(metrics.overallScore).toBe(75);
      expect(metrics.aiFlavorScore).toBe(60);
      expect(metrics.coolPointDensity).toBe(0.8);
      expect(metrics.pacingScore).toBe(70);
      expect(metrics.consistencyScore).toBe(80);
      expect(metrics.repetitionScore).toBe(20);
      expect(metrics.timestamp).toBeGreaterThan(0);
    });
  });

  describe('Low Score Alert', () => {
    it('should trigger alert for consecutive low scores', () => {
      // 添加3个连续低分章节
      for (let i = 1; i <= 3; i++) {
        const metrics = createQualityMetrics(i, {
          overall: 55,
          aiFlavor: 50,
          coolPointDensity: 0.5,
          pacing: 60,
          consistency: 70,
          repetition: 20,
        });
        system.addMetrics(metrics);
      }

      const alerts = system.getActiveAlerts();
      const lowScoreAlert = alerts.find(a => a.type === 'low-score');
      
      expect(lowScoreAlert).toBeDefined();
      expect(lowScoreAlert!.severity).toBe('medium');
      expect(lowScoreAlert!.affectedChapters).toHaveLength(3);
    });

    it('should not trigger alert for non-consecutive low scores', () => {
      const metrics1 = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });
      
      const metrics2 = createQualityMetrics(2, {
        overall: 75, // 高分
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });
      
      const metrics3 = createQualityMetrics(3, {
        overall: 55,
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics1);
      system.addMetrics(metrics2);
      system.addMetrics(metrics3);

      const alerts = system.getActiveAlerts();
      const lowScoreAlert = alerts.find(a => a.type === 'low-score');
      
      expect(lowScoreAlert).toBeUndefined();
    });

    it('should set critical severity for very low scores', () => {
      for (let i = 1; i <= 3; i++) {
        const metrics = createQualityMetrics(i, {
          overall: 45, // 非常低
          aiFlavor: 50,
          coolPointDensity: 0.5,
          pacing: 60,
          consistency: 70,
          repetition: 20,
        });
        system.addMetrics(metrics);
      }

      const alerts = system.getActiveAlerts();
      const lowScoreAlert = alerts.find(a => a.type === 'low-score');
      
      expect(lowScoreAlert!.severity).toBe('critical');
      expect(lowScoreAlert!.priority).toBe(10);
    });
  });

  describe('AI Flavor Alert', () => {
    it('should trigger alert for high AI flavor', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 75, // 超过阈值70
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      const alerts = system.addMetrics(metrics);
      const aiAlert = alerts.find(a => a.type === 'ai-flavor');
      
      expect(aiAlert).toBeDefined();
      expect(aiAlert!.severity).toBe('medium');
    });

    it('should set high severity for very high AI flavor', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 90,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      const alerts = system.addMetrics(metrics);
      const aiAlert = alerts.find(a => a.type === 'ai-flavor');
      
      expect(aiAlert!.severity).toBe('high');
    });

    it('should include suggestions', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      const alerts = system.addMetrics(metrics);
      const aiAlert = alerts.find(a => a.type === 'ai-flavor');
      
      expect(aiAlert!.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Cool Point Density Alert', () => {
    it('should trigger alert for low cool point density', () => {
      // 添加5章低爽点密度
      for (let i = 1; i <= 5; i++) {
        const metrics = createQualityMetrics(i, {
          overall: 70,
          aiFlavor: 50,
          coolPointDensity: 0.2, // 低于阈值0.5
          pacing: 60,
          consistency: 70,
          repetition: 20,
        });
        system.addMetrics(metrics);
      }

      const alerts = system.getActiveAlerts();
      const coolPointAlert = alerts.find(a => a.type === 'cool-point');
      
      expect(coolPointAlert).toBeDefined();
      expect(coolPointAlert!.severity).toBe('high');
    });

    it('should not trigger alert with sufficient cool points', () => {
      for (let i = 1; i <= 5; i++) {
        const metrics = createQualityMetrics(i, {
          overall: 70,
          aiFlavor: 50,
          coolPointDensity: 0.8, // 高于阈值
          pacing: 60,
          consistency: 70,
          repetition: 20,
        });
        system.addMetrics(metrics);
      }

      const alerts = system.getActiveAlerts();
      const coolPointAlert = alerts.find(a => a.type === 'cool-point');
      
      expect(coolPointAlert).toBeUndefined();
    });
  });

  describe('Pacing Alert', () => {
    it('should trigger alert for low pacing score', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 45, // 低于阈值50
        consistency: 70,
        repetition: 20,
      });

      const alerts = system.addMetrics(metrics);
      const pacingAlert = alerts.find(a => a.type === 'pacing');
      
      expect(pacingAlert).toBeDefined();
      expect(pacingAlert!.severity).toBe('medium');
    });
  });

  describe('Consistency Alert', () => {
    it('should trigger alert for low consistency score', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 65, // 低于阈值70
        repetition: 20,
      });

      const alerts = system.addMetrics(metrics);
      const consistencyAlert = alerts.find(a => a.type === 'consistency');
      
      expect(consistencyAlert).toBeDefined();
      expect(consistencyAlert!.severity).toBe('medium');
    });

    it('should set high severity for very low consistency', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 55,
        repetition: 20,
      });

      const alerts = system.addMetrics(metrics);
      const consistencyAlert = alerts.find(a => a.type === 'consistency');
      
      expect(consistencyAlert!.severity).toBe('high');
    });
  });

  describe('Repetition Alert', () => {
    it('should trigger alert for high repetition score', () => {
      const metrics = createQualityMetrics(1, {
        overall: 70,
        aiFlavor: 50,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 35, // 超过阈值30
      });

      const alerts = system.addMetrics(metrics);
      const repetitionAlert = alerts.find(a => a.type === 'repetition');
      
      expect(repetitionAlert).toBeDefined();
      expect(repetitionAlert!.severity).toBe('medium');
    });
  });

  describe('Alert Management', () => {
    it('should get all alerts', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.2,
        pacing: 45,
        consistency: 65,
        repetition: 35,
      });

      system.addMetrics(metrics);
      const alerts = system.getAlerts();
      
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should filter alerts by type', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const aiAlerts = system.getAlerts({ type: 'ai-flavor' });
      
      expect(aiAlerts.every(a => a.type === 'ai-flavor')).toBe(true);
    });

    it('should filter alerts by severity', () => {
      const metrics = createQualityMetrics(1, {
        overall: 45,
        aiFlavor: 90,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const highAlerts = system.getAlerts({ severity: 'high' });
      
      expect(highAlerts.every(a => a.severity === 'high')).toBe(true);
    });

    it('should filter alerts by priority', () => {
      const metrics = createQualityMetrics(1, {
        overall: 45,
        aiFlavor: 90,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const highPriorityAlerts = system.getAlerts({ minPriority: 8 });
      
      expect(highPriorityAlerts.every(a => a.priority >= 8)).toBe(true);
    });

    it('should sort alerts by priority', () => {
      const metrics = createQualityMetrics(1, {
        overall: 45,
        aiFlavor: 90,
        coolPointDensity: 0.5,
        pacing: 45,
        consistency: 65,
        repetition: 35,
      });

      system.addMetrics(metrics);
      const alerts = system.getAlerts();
      
      for (let i = 1; i < alerts.length; i++) {
        expect(alerts[i - 1].priority).toBeGreaterThanOrEqual(alerts[i].priority);
      }
    });
  });

  describe('Alert Statistics', () => {
    it('should get alert statistics', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 45,
        consistency: 65,
        repetition: 35,
      });

      system.addMetrics(metrics);
      const stats = system.getAlertStats();
      
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.byType).toBeDefined();
      expect(stats.bySeverity).toBeDefined();
      expect(stats.activeCount).toBeGreaterThan(0);
    });

    it('should count alerts by type', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const stats = system.getAlertStats();
      
      expect(stats.byType['ai-flavor']).toBeGreaterThan(0);
    });
  });

  describe('Alert Report', () => {
    it('should generate alert report', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 45,
        consistency: 65,
        repetition: 35,
      });

      system.addMetrics(metrics);
      const report = system.generateAlertReport();
      
      expect(report).toBeTruthy();
      expect(typeof report).toBe('string');
    });

    it('should include statistics in report', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const report = system.generateAlertReport();
      
      expect(report).toContain('预警统计');
      expect(report).toContain('总预警数');
    });

    it('should include active alerts in report', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const report = system.generateAlertReport();
      
      expect(report).toContain('活跃预警');
    });

    it('should format report as markdown', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      const report = system.generateAlertReport();
      
      expect(report).toContain('#');
      expect(report).toContain('##');
    });
  });

  describe('Configuration', () => {
    it('should update thresholds', () => {
      system.updateThresholds({
        lowScoreThreshold: 50,
        aiFlavorThreshold: 80,
      });

      const config = system.getConfig();
      expect(config.thresholds.lowScoreThreshold).toBe(50);
      expect(config.thresholds.aiFlavorThreshold).toBe(80);
    });

    it('should preserve other thresholds when updating', () => {
      system.updateThresholds({
        lowScoreThreshold: 50,
      });

      const config = system.getConfig();
      expect(config.thresholds.aiFlavorThreshold).toBe(DEFAULT_THRESHOLDS.aiFlavorThreshold);
    });
  });

  describe('History Management', () => {
    it('should clear all history', () => {
      const metrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(metrics);
      system.clearHistory();

      const config = system.getConfig();
      expect(config.alertHistory).toHaveLength(0);
      expect(config.metricsHistory).toHaveLength(0);
    });

    it('should clear old history', () => {
      const oldMetrics = createQualityMetrics(1, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });
      oldMetrics.timestamp = Date.now() - 48 * 60 * 60 * 1000; // 2 days ago

      system.addMetrics(oldMetrics);

      const newMetrics = createQualityMetrics(2, {
        overall: 55,
        aiFlavor: 75,
        coolPointDensity: 0.5,
        pacing: 60,
        consistency: 70,
        repetition: 20,
      });

      system.addMetrics(newMetrics);

      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      system.clearHistory(oneDayAgo);

      const config = system.getConfig();
      expect(config.metricsHistory.length).toBe(1);
      expect(config.metricsHistory[0].chapterNumber).toBe(2);
    });
  });
});
