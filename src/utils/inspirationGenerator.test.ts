import { describe, it, expect } from 'vitest';
import {
  generateNextStepIdeas,
  generateRandomEvent,
  generateConflict,
  generateTwist,
  generateDialogueIdea,
  generateSceneIdea,
  generateInspirationBatch,
  filterInspirationsByTags,
  sortByImpact,
  sortByDifficulty,
  type InspirationOptions,
} from './inspirationGenerator';

describe('InspirationGenerator', () => {
  const basicOptions: InspirationOptions = {
    currentContext: '主角刚刚突破到新境界',
    genre: '玄幻',
    characters: ['张三', '李四'],
    location: '天元城',
    mood: '紧张',
  };

  describe('generateNextStepIdeas', () => {
    it('should generate next step ideas', () => {
      const ideas = generateNextStepIdeas(basicOptions);
      
      expect(ideas.length).toBeGreaterThan(0);
      ideas.forEach(idea => {
        expect(idea.type).toBe('next-step');
        expect(idea.title).toBeTruthy();
        expect(idea.description).toBeTruthy();
        expect(idea.details).toBeDefined();
        expect(idea.difficulty).toBeDefined();
        expect(idea.impact).toBeDefined();
        expect(idea.tags).toBeDefined();
      });
    });

    it('should generate genre-specific ideas for 玄幻', () => {
      const ideas = generateNextStepIdeas({ ...basicOptions, genre: '玄幻' });
      
      const titles = ideas.map(i => i.title);
      expect(titles.some(t => t.includes('突破') || t.includes('宝物') || t.includes('强敌'))).toBe(true);
    });

    it('should generate genre-specific ideas for 都市', () => {
      const ideas = generateNextStepIdeas({ ...basicOptions, genre: '都市' });
      
      const titles = ideas.map(i => i.title);
      expect(titles.some(t => t.includes('商业') || t.includes('打脸'))).toBe(true);
    });

    it('should include common ideas', () => {
      const ideas = generateNextStepIdeas(basicOptions);
      
      const titles = ideas.map(i => i.title);
      expect(titles.some(t => t.includes('角色') || t.includes('秘密'))).toBe(true);
    });

    it('should have estimated word counts', () => {
      const ideas = generateNextStepIdeas(basicOptions);
      
      ideas.forEach(idea => {
        expect(idea.estimatedWords).toBeGreaterThan(0);
      });
    });
  });

  describe('generateRandomEvent', () => {
    it('should generate a random event', () => {
      const event = generateRandomEvent(basicOptions);
      
      expect(event.type).toBe('random-event');
      expect(event.title).toBeTruthy();
      expect(event.description).toBeTruthy();
      expect(event.details.length).toBeGreaterThan(0);
      expect(event.difficulty).toBeDefined();
      expect(event.impact).toBeDefined();
      expect(event.tags.length).toBeGreaterThan(0);
    });

    it('should generate different events', () => {
      const events = new Set();
      for (let i = 0; i < 20; i++) {
        const event = generateRandomEvent(basicOptions);
        events.add(event.title);
      }
      
      expect(events.size).toBeGreaterThan(1);
    });

    it('should have valid difficulty levels', () => {
      const event = generateRandomEvent(basicOptions);
      expect(['easy', 'medium', 'hard']).toContain(event.difficulty);
    });

    it('should have valid impact levels', () => {
      const event = generateRandomEvent(basicOptions);
      expect(['low', 'medium', 'high']).toContain(event.impact);
    });
  });

  describe('generateConflict', () => {
    it('should generate a conflict', () => {
      const conflict = generateConflict(basicOptions);
      
      expect(conflict.type).toBe('conflict');
      expect(conflict.conflictType).toBeDefined();
      expect(conflict.title).toBeTruthy();
      expect(conflict.description).toBeTruthy();
      expect(conflict.stakes).toBeTruthy();
      expect(conflict.details.length).toBeGreaterThan(0);
    });

    it('should have valid conflict types', () => {
      const conflict = generateConflict(basicOptions);
      expect(['internal', 'interpersonal', 'external', 'ideological']).toContain(conflict.conflictType);
    });

    it('should include stakes', () => {
      const conflict = generateConflict(basicOptions);
      expect(conflict.stakes).toBeTruthy();
      expect(typeof conflict.stakes).toBe('string');
    });

    it('should generate different conflicts', () => {
      const conflicts = new Set();
      for (let i = 0; i < 20; i++) {
        const conflict = generateConflict(basicOptions);
        conflicts.add(conflict.title);
      }
      
      expect(conflicts.size).toBeGreaterThan(1);
    });
  });

  describe('generateTwist', () => {
    it('should generate a twist', () => {
      const twist = generateTwist(basicOptions);
      
      expect(twist.type).toBe('twist');
      expect(twist.twistType).toBeDefined();
      expect(twist.title).toBeTruthy();
      expect(twist.description).toBeTruthy();
      expect(twist.setup).toBeTruthy();
      expect(twist.payoff).toBeTruthy();
      expect(twist.details.length).toBeGreaterThan(0);
    });

    it('should have valid twist types', () => {
      const twist = generateTwist(basicOptions);
      expect(['reveal', 'betrayal', 'reversal', 'discovery']).toContain(twist.twistType);
    });

    it('should include setup and payoff', () => {
      const twist = generateTwist(basicOptions);
      expect(twist.setup).toBeTruthy();
      expect(twist.payoff).toBeTruthy();
    });

    it('should generate different twists', () => {
      const twists = new Set();
      for (let i = 0; i < 20; i++) {
        const twist = generateTwist(basicOptions);
        twists.add(twist.title);
      }
      
      expect(twists.size).toBeGreaterThan(1);
    });
  });

  describe('generateDialogueIdea', () => {
    it('should generate a dialogue idea', () => {
      const dialogue = generateDialogueIdea(basicOptions);
      
      expect(dialogue.type).toBe('dialogue');
      expect(dialogue.title).toBeTruthy();
      expect(dialogue.description).toBeTruthy();
      expect(dialogue.details.length).toBeGreaterThan(0);
    });

    it('should generate different dialogue ideas', () => {
      const dialogues = new Set();
      for (let i = 0; i < 20; i++) {
        const dialogue = generateDialogueIdea(basicOptions);
        dialogues.add(dialogue.title);
      }
      
      expect(dialogues.size).toBeGreaterThan(1);
    });
  });

  describe('generateSceneIdea', () => {
    it('should generate a scene idea', () => {
      const scene = generateSceneIdea(basicOptions);
      
      expect(scene.type).toBe('scene');
      expect(scene.title).toBeTruthy();
      expect(scene.description).toBeTruthy();
      expect(scene.details.length).toBeGreaterThan(0);
    });

    it('should generate different scene ideas', () => {
      const scenes = new Set();
      for (let i = 0; i < 20; i++) {
        const scene = generateSceneIdea(basicOptions);
        scenes.add(scene.title);
      }
      
      expect(scenes.size).toBeGreaterThan(1);
    });
  });

  describe('generateInspirationBatch', () => {
    it('should generate a batch of inspirations', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      
      expect(batch.length).toBe(10);
      batch.forEach(insp => {
        expect(insp.type).toBeDefined();
        expect(insp.title).toBeTruthy();
        expect(insp.description).toBeTruthy();
      });
    });

    it('should generate diverse types', () => {
      const batch = generateInspirationBatch(basicOptions, 12);
      const types = new Set(batch.map(i => i.type));
      
      expect(types.size).toBeGreaterThan(1);
    });

    it('should respect count parameter', () => {
      const batch5 = generateInspirationBatch(basicOptions, 5);
      const batch20 = generateInspirationBatch(basicOptions, 20);
      
      expect(batch5.length).toBe(5);
      expect(batch20.length).toBe(20);
    });

    it('should use default count', () => {
      const batch = generateInspirationBatch(basicOptions);
      expect(batch.length).toBe(10);
    });
  });

  describe('filterInspirationsByTags', () => {
    it('should filter by tags', () => {
      const batch = generateInspirationBatch(basicOptions, 20);
      const filtered = filterInspirationsByTags(batch, ['爽点']);
      
      filtered.forEach(insp => {
        expect(insp.tags).toContain('爽点');
      });
    });

    it('should filter by multiple tags', () => {
      const batch = generateInspirationBatch(basicOptions, 20);
      const filtered = filterInspirationsByTags(batch, ['爽点', '冲突']);
      
      filtered.forEach(insp => {
        expect(
          insp.tags.includes('爽点') || insp.tags.includes('冲突')
        ).toBe(true);
      });
    });

    it('should return empty array if no matches', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      const filtered = filterInspirationsByTags(batch, ['不存在的标签']);
      
      expect(filtered).toHaveLength(0);
    });

    it('should not modify original array', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      const originalLength = batch.length;
      
      filterInspirationsByTags(batch, ['爽点']);
      
      expect(batch.length).toBe(originalLength);
    });
  });

  describe('sortByImpact', () => {
    it('should sort by impact', () => {
      const batch = generateInspirationBatch(basicOptions, 20);
      const sorted = sortByImpact(batch);
      
      for (let i = 1; i < sorted.length; i++) {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        expect(impactOrder[sorted[i - 1].impact]).toBeGreaterThanOrEqual(
          impactOrder[sorted[i].impact]
        );
      }
    });

    it('should not modify original array', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      const original = [...batch];
      
      sortByImpact(batch);
      
      expect(batch).toEqual(original);
    });

    it('should handle empty array', () => {
      const sorted = sortByImpact([]);
      expect(sorted).toHaveLength(0);
    });
  });

  describe('sortByDifficulty', () => {
    it('should sort by difficulty', () => {
      const batch = generateInspirationBatch(basicOptions, 20);
      const sorted = sortByDifficulty(batch);
      
      for (let i = 1; i < sorted.length; i++) {
        const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
        expect(difficultyOrder[sorted[i - 1].difficulty]).toBeLessThanOrEqual(
          difficultyOrder[sorted[i].difficulty]
        );
      }
    });

    it('should not modify original array', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      const original = [...batch];
      
      sortByDifficulty(batch);
      
      expect(batch).toEqual(original);
    });

    it('should handle empty array', () => {
      const sorted = sortByDifficulty([]);
      expect(sorted).toHaveLength(0);
    });
  });

  describe('Inspiration Properties', () => {
    it('should have all required properties', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      
      batch.forEach(insp => {
        expect(insp.type).toBeDefined();
        expect(insp.title).toBeTruthy();
        expect(insp.description).toBeTruthy();
        expect(insp.details).toBeDefined();
        expect(Array.isArray(insp.details)).toBe(true);
        expect(insp.difficulty).toBeDefined();
        expect(insp.impact).toBeDefined();
        expect(insp.tags).toBeDefined();
        expect(Array.isArray(insp.tags)).toBe(true);
      });
    });

    it('should have valid types', () => {
      const batch = generateInspirationBatch(basicOptions, 20);
      const validTypes = ['next-step', 'random-event', 'conflict', 'twist', 'dialogue', 'scene'];
      
      batch.forEach(insp => {
        expect(validTypes).toContain(insp.type);
      });
    });

    it('should have non-empty details', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      
      batch.forEach(insp => {
        expect(insp.details.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty tags', () => {
      const batch = generateInspirationBatch(basicOptions, 10);
      
      batch.forEach(insp => {
        expect(insp.tags.length).toBeGreaterThan(0);
      });
    });
  });
});
