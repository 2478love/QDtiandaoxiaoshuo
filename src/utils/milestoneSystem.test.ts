import { describe, it, expect, beforeEach } from 'vitest';
import {
  MilestoneSystem,
  formatMilestoneReport,
  PREDEFINED_MILESTONES,
  PREDEFINED_ACHIEVEMENTS,
} from './milestoneSystem';

describe('MilestoneSystem', () => {
  let system: MilestoneSystem;

  beforeEach(() => {
    system = new MilestoneSystem();
  });

  describe('Initialization', () => {
    it('should initialize with predefined milestones', () => {
      const milestones = system.getMilestones();
      expect(milestones.length).toBeGreaterThan(0);
      expect(milestones.every(m => !m.achieved)).toBe(true);
    });

    it('should initialize with predefined achievements', () => {
      const achievements = system.getAchievements();
      expect(achievements.length).toBeGreaterThan(0);
      expect(achievements.every(a => !a.unlocked)).toBe(true);
    });

    it('should initialize stats', () => {
      const stats = system.getStats();
      expect(stats.totalWords).toBe(0);
      expect(stats.totalChapters).toBe(0);
    });
  });

  describe('Word Count Milestones', () => {
    it('should update word count', () => {
      system.updateWordCount(5000);
      const stats = system.getStats();
      expect(stats.totalWords).toBe(5000);
    });

    it('should achieve 10k milestone', () => {
      const achieved = system.updateWordCount(10000);
      expect(achieved.length).toBeGreaterThan(0);
      expect(achieved[0].id).toBe('words-10k');
      expect(achieved[0].achieved).toBe(true);
    });

    it('should achieve multiple milestones at once', () => {
      const achieved = system.updateWordCount(60000);
      expect(achieved.length).toBeGreaterThanOrEqual(2);
      expect(achieved.some(m => m.id === 'words-10k')).toBe(true);
      expect(achieved.some(m => m.id === 'words-50k')).toBe(true);
    });

    it('should not achieve milestone twice', () => {
      system.updateWordCount(10000);
      const achieved = system.updateWordCount(1000);
      expect(achieved.length).toBe(0);
    });

    it('should track achievedAt timestamp', () => {
      const achieved = system.updateWordCount(10000);
      expect(achieved[0].achievedAt).toBeDefined();
      expect(achieved[0].achievedAt).toBeGreaterThan(0);
    });
  });

  describe('Chapter Count Milestones', () => {
    it('should update chapter count', () => {
      system.updateChapterCount(2000);
      const stats = system.getStats();
      expect(stats.totalChapters).toBe(1);
      expect(stats.totalWords).toBe(2000);
    });

    it('should calculate average chapter words', () => {
      system.updateChapterCount(2000);
      system.updateChapterCount(3000);
      const stats = system.getStats();
      expect(stats.averageChapterWords).toBe(2500);
    });

    it('should track longest chapter', () => {
      system.updateChapterCount(2000);
      system.updateChapterCount(3500);
      system.updateChapterCount(2500);
      const stats = system.getStats();
      expect(stats.longestChapter).toBe(3500);
    });

    it('should track shortest chapter', () => {
      system.updateChapterCount(2000);
      system.updateChapterCount(1500);
      system.updateChapterCount(2500);
      const stats = system.getStats();
      expect(stats.shortestChapter).toBe(1500);
    });

    it('should achieve chapter milestones', () => {
      for (let i = 0; i < 50; i++) {
        system.updateChapterCount(2000);
      }
      const achieved = system.getAchievedMilestones();
      expect(achieved.some(m => m.id === 'chapters-50')).toBe(true);
    });
  });

  describe('Quality Stats', () => {
    it('should update quality stats', () => {
      system.updateChapterCount(2000);
      system.updateQualityStats(85);
      const qualityStats = system.getQualityStats();
      expect(qualityStats.averageScore).toBe(85);
    });

    it('should calculate average score', () => {
      system.updateChapterCount(2000);
      system.updateQualityStats(80);
      system.updateChapterCount(2000);
      system.updateQualityStats(90);
      const qualityStats = system.getQualityStats();
      expect(qualityStats.averageScore).toBe(85);
    });

    it('should track highest score', () => {
      system.updateChapterCount(2000);
      system.updateQualityStats(80);
      system.updateChapterCount(2000);
      system.updateQualityStats(95);
      system.updateChapterCount(2000);
      system.updateQualityStats(85);
      const qualityStats = system.getQualityStats();
      expect(qualityStats.highestScore).toBe(95);
    });

    it('should track lowest score', () => {
      system.updateChapterCount(2000);
      system.updateQualityStats(80);
      system.updateChapterCount(2000);
      system.updateQualityStats(70);
      system.updateChapterCount(2000);
      system.updateQualityStats(85);
      const qualityStats = system.getQualityStats();
      expect(qualityStats.lowestScore).toBe(70);
    });

    it('should achieve quality milestones', () => {
      for (let i = 0; i < 10; i++) {
        system.updateChapterCount(2000);
        system.updateQualityStats(85);
      }
      const achieved = system.getAchievedMilestones();
      expect(achieved.some(m => m.id === 'quality-80')).toBe(true);
    });
  });

  describe('Achievements', () => {
    it('should unlock first chapter achievement', () => {
      system.updateChapterCount(2000);
      const unlocked = system.checkAchievements();
      expect(unlocked.some(a => a.id === 'first-chapter')).toBe(true);
    });

    it('should unlock quality master achievement', () => {
      for (let i = 0; i < 10; i++) {
        system.updateChapterCount(2000);
        system.updateQualityStats(86);
      }
      const unlocked = system.checkAchievements();
      expect(unlocked.some(a => a.id === 'quality-master')).toBe(true);
    });

    it('should unlock perfectionist achievement', () => {
      system.updateChapterCount(2000);
      system.updateQualityStats(96);
      const unlocked = system.checkAchievements();
      expect(unlocked.some(a => a.id === 'perfectionist')).toBe(true);
    });

    it('should not unlock achievement twice', () => {
      system.updateChapterCount(2000);
      system.checkAchievements();
      const unlocked = system.checkAchievements();
      expect(unlocked.filter(a => a.id === 'first-chapter').length).toBe(0);
    });

    it('should track unlockedAt timestamp', () => {
      system.updateChapterCount(2000);
      const unlocked = system.checkAchievements();
      expect(unlocked[0].unlockedAt).toBeDefined();
      expect(unlocked[0].unlockedAt).toBeGreaterThan(0);
    });
  });

  describe('Milestone Queries', () => {
    it('should get all milestones', () => {
      const milestones = system.getMilestones();
      expect(milestones.length).toBe(PREDEFINED_MILESTONES.length);
    });

    it('should get achieved milestones', () => {
      system.updateWordCount(10000);
      const achieved = system.getAchievedMilestones();
      expect(achieved.length).toBeGreaterThan(0);
      expect(achieved.every(m => m.achieved)).toBe(true);
    });

    it('should get next milestone', () => {
      system.updateWordCount(5000);
      const next = system.getNextMilestone('word-count');
      expect(next).toBeDefined();
      expect(next!.achieved).toBe(false);
      expect(next!.target).toBeGreaterThan(5000);
    });

    it('should get next milestone by type', () => {
      const next = system.getNextMilestone('chapter-count');
      expect(next).toBeDefined();
      expect(next!.type).toBe('chapter-count');
    });

    it('should return undefined when all milestones achieved', () => {
      system.updateWordCount(2000000);
      const next = system.getNextMilestone('word-count');
      expect(next).toBeUndefined();
    });
  });

  describe('Achievement Queries', () => {
    it('should get all achievements', () => {
      const achievements = system.getAchievements();
      expect(achievements.length).toBe(PREDEFINED_ACHIEVEMENTS.length);
    });

    it('should get unlocked achievements', () => {
      system.updateChapterCount(2000);
      system.checkAchievements();
      const unlocked = system.getUnlockedAchievements();
      expect(unlocked.length).toBeGreaterThan(0);
      expect(unlocked.every(a => a.unlocked)).toBe(true);
    });
  });

  describe('Milestone Report', () => {
    it('should generate milestone report', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);

      expect(report.milestone).toBeDefined();
      expect(report.stats).toBeDefined();
      expect(report.qualityStats).toBeDefined();
      expect(report.achievements).toBeDefined();
      expect(report.summary).toBeTruthy();
      expect(report.highlights).toBeDefined();
    });

    it('should include next milestone', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);

      expect(report.nextMilestone).toBeDefined();
      expect(report.nextMilestone!.target).toBeGreaterThan(10000);
    });

    it('should include highlights', () => {
      system.updateChapterCount(6000);
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);

      expect(report.highlights.length).toBeGreaterThan(0);
    });
  });

  describe('Celebration', () => {
    it('should generate celebration data', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const celebration = system.generateCelebration(milestone);

      expect(celebration.animation).toBeTruthy();
      expect(celebration.message).toBeTruthy();
      expect(typeof celebration.confetti).toBe('boolean');
    });

    it('should show confetti for major milestones', () => {
      system.updateWordCount(100000);
      const milestone = system.getAchievedMilestones().find(m => m.id === 'words-100k')!;
      const celebration = system.generateCelebration(milestone);

      expect(celebration.confetti).toBe(true);
    });

    it('should not show confetti for minor milestones', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const celebration = system.generateCelebration(milestone);

      expect(celebration.confetti).toBe(false);
    });
  });

  describe('Custom Milestones', () => {
    it('should add custom milestone', () => {
      system.addCustomMilestone({
        id: 'custom-1',
        type: 'custom',
        name: '自定义里程碑',
        description: '测试',
        target: 5000,
      });

      const milestones = system.getMilestones();
      expect(milestones.some(m => m.id === 'custom-1')).toBe(true);
    });

    it('should achieve custom milestone', () => {
      system.addCustomMilestone({
        id: 'custom-words',
        type: 'word-count',
        name: '自定义字数',
        description: '测试',
        target: 5000,
      });

      system.updateWordCount(5000);
      const achieved = system.getAchievedMilestones();
      expect(achieved.some(m => m.id === 'custom-words')).toBe(true);
    });
  });

  describe('Export and Import', () => {
    it('should export data', () => {
      system.updateWordCount(10000);
      system.updateChapterCount(2000);
      const exported = system.export();

      expect(exported).toBeTruthy();
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should import data', () => {
      system.updateWordCount(10000);
      const exported = system.export();

      const newSystem = new MilestoneSystem();
      newSystem.import(exported);

      const stats = newSystem.getStats();
      expect(stats.totalWords).toBe(10000);
    });

    it('should preserve achieved milestones', () => {
      system.updateWordCount(10000);
      const exported = system.export();

      const newSystem = new MilestoneSystem();
      newSystem.import(exported);

      const achieved = newSystem.getAchievedMilestones();
      expect(achieved.length).toBeGreaterThan(0);
    });

    it('should throw error on invalid import', () => {
      expect(() => system.import('invalid json')).toThrow();
    });
  });

  describe('formatMilestoneReport', () => {
    it('should format milestone report', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);
      const formatted = formatMilestoneReport(report);

      expect(formatted).toBeTruthy();
      expect(typeof formatted).toBe('string');
    });

    it('should include milestone name', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);
      const formatted = formatMilestoneReport(report);

      expect(formatted).toContain(milestone.name);
    });

    it('should include summary', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);
      const formatted = formatMilestoneReport(report);

      expect(formatted).toContain('创作统计');
    });

    it('should format as markdown', () => {
      system.updateWordCount(10000);
      const milestone = system.getAchievedMilestones()[0];
      const report = system.generateMilestoneReport(milestone);
      const formatted = formatMilestoneReport(report);

      expect(formatted).toContain('#');
      expect(formatted).toContain('##');
    });
  });
});
