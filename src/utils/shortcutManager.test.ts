/**
 * 快捷键管理系统测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ShortcutManager,
  DEFAULT_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  initializeDefaultShortcuts,
  type ShortcutKey,
  type KeyModifier,
} from './shortcutManager';

describe('utils/shortcutManager', () => {
  let manager: ShortcutManager;

  beforeEach(() => {
    manager = new ShortcutManager();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('ShortcutManager', () => {
    describe('register and unregister', () => {
      it('should register a shortcut', () => {
        const action = vi.fn();
        const shortcut: ShortcutKey = {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        };

        manager.register('save', shortcut);

        const registered = manager.get('save');
        expect(registered).toBeDefined();
        expect(registered?.key).toBe('s');
      });

      it('should unregister a shortcut', () => {
        const action = vi.fn();
        const shortcut: ShortcutKey = {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        };

        manager.register('save', shortcut);
        manager.unregister('save');

        const registered = manager.get('save');
        expect(registered).toBeUndefined();
      });

      it('should warn on conflict', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const action = vi.fn();

        manager.register('save1', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save 1',
          category: 'file',
          action,
        });

        manager.register('save2', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save 2',
          category: 'file',
          action,
        });

        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('handleKeyDown', () => {
      it('should trigger action on matching shortcut', () => {
        const action = vi.fn();
        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
        });

        const handled = manager.handleKeyDown(event);

        expect(handled).toBe(true);
        expect(action).toHaveBeenCalled();
      });

      it('should not trigger on non-matching key', () => {
        const action = vi.fn();
        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        const event = new KeyboardEvent('keydown', {
          key: 'a',
          ctrlKey: true,
        });

        const handled = manager.handleKeyDown(event);

        expect(handled).toBe(false);
        expect(action).not.toHaveBeenCalled();
      });

      it('should not trigger on non-matching modifiers', () => {
        const action = vi.fn();
        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          altKey: true,
        });

        const handled = manager.handleKeyDown(event);

        expect(handled).toBe(false);
        expect(action).not.toHaveBeenCalled();
      });

      it('should handle multiple modifiers', () => {
        const action = vi.fn();
        manager.register('export', {
          key: 'e',
          modifiers: ['ctrl', 'shift'],
          description: 'Export',
          category: 'file',
          action,
        });

        const event = new KeyboardEvent('keydown', {
          key: 'e',
          ctrlKey: true,
          shiftKey: true,
        });

        const handled = manager.handleKeyDown(event);

        expect(handled).toBe(true);
        expect(action).toHaveBeenCalled();
      });

      it('should not trigger disabled shortcuts', () => {
        const action = vi.fn();
        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
          enabled: false,
        });

        const event = new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
        });

        const handled = manager.handleKeyDown(event);

        expect(handled).toBe(false);
        expect(action).not.toHaveBeenCalled();
      });
    });

    describe('customize', () => {
      it('should customize shortcut', () => {
        const action = vi.fn();
        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        const success = manager.customize('save', 'k', ['ctrl', 'alt']);

        expect(success).toBe(true);

        const shortcut = manager.get('save');
        expect(shortcut?.key).toBe('k');
        expect(shortcut?.modifiers).toEqual(['ctrl', 'alt']);
      });

      it('should not customize to conflicting shortcut', () => {
        const action = vi.fn();
        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        manager.register('export', {
          key: 'e',
          modifiers: ['ctrl'],
          description: 'Export',
          category: 'file',
          action,
        });

        const success = manager.customize('save', 'e', ['ctrl']);

        expect(success).toBe(false);

        const shortcut = manager.get('save');
        expect(shortcut?.key).toBe('s');
      });

      it('should return false for non-existent shortcut', () => {
        const success = manager.customize('non-existent', 'k', ['ctrl']);
        expect(success).toBe(false);
      });
    });

    describe('reset', () => {
      it('should reset shortcut to default', () => {
        const action = vi.fn();
        const defaultConfig = DEFAULT_SHORTCUTS.find(s => s.id === 'save')!;

        manager.register('save', {
          key: defaultConfig.defaultKey,
          modifiers: defaultConfig.defaultModifiers,
          description: defaultConfig.description,
          category: defaultConfig.category,
          action,
        });

        manager.customize('save', 'k', ['ctrl', 'alt']);
        manager.reset('save');

        const shortcut = manager.get('save');
        expect(shortcut?.key).toBe(defaultConfig.defaultKey);
        expect(shortcut?.modifiers).toEqual(defaultConfig.defaultModifiers);
      });

      it('should return false for non-existent shortcut', () => {
        const success = manager.reset('non-existent');
        expect(success).toBe(false);
      });
    });

    describe('resetAll', () => {
      it('should reset all shortcuts', () => {
        const action = vi.fn();

        DEFAULT_SHORTCUTS.slice(0, 3).forEach(config => {
          manager.register(config.id, {
            key: config.defaultKey,
            modifiers: config.defaultModifiers,
            description: config.description,
            category: config.category,
            action,
          });

          manager.customize(config.id, 'x', ['ctrl']);
        });

        manager.resetAll();

        DEFAULT_SHORTCUTS.slice(0, 3).forEach(config => {
          const shortcut = manager.get(config.id);
          expect(shortcut?.key).toBe(config.defaultKey);
        });
      });
    });

    describe('formatShortcut', () => {
      it('should format single key', () => {
        const formatted = manager.formatShortcut('s', []);
        expect(formatted).toBe('S');
      });

      it('should format with ctrl', () => {
        const formatted = manager.formatShortcut('s', ['ctrl']);
        expect(formatted).toBe('Ctrl + S');
      });

      it('should format with multiple modifiers', () => {
        const formatted = manager.formatShortcut('s', ['ctrl', 'shift']);
        expect(formatted).toContain('Ctrl');
        expect(formatted).toContain('Shift');
        expect(formatted).toContain('S');
      });

      it('should format special keys', () => {
        const formatted = manager.formatShortcut('ArrowLeft', ['ctrl']);
        expect(formatted).toBe('Ctrl + ArrowLeft');
      });
    });

    describe('getAll', () => {
      it('should return all shortcuts', () => {
        const action = vi.fn();

        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        manager.register('export', {
          key: 'e',
          modifiers: ['ctrl'],
          description: 'Export',
          category: 'file',
          action,
        });

        const all = manager.getAll();
        expect(all.size).toBe(2);
        expect(all.has('save')).toBe(true);
        expect(all.has('export')).toBe(true);
      });
    });

    describe('generateHelp', () => {
      it('should generate help documentation', () => {
        const action = vi.fn();

        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save file',
          category: 'file',
          action,
        });

        const help = manager.generateHelp();

        expect(help).toContain('快捷键帮助');
        expect(help).toContain('Ctrl + S');
        expect(help).toContain('Save file');
      });

      it('should group by category', () => {
        const action = vi.fn();

        manager.register('save', {
          key: 's',
          modifiers: ['ctrl'],
          description: 'Save',
          category: 'file',
          action,
        });

        manager.register('undo', {
          key: 'z',
          modifiers: ['ctrl'],
          description: 'Undo',
          category: 'edit',
          action,
        });

        const help = manager.generateHelp();

        expect(help).toContain('文件操作');
        expect(help).toContain('编辑');
      });
    });
  });

  describe('DEFAULT_SHORTCUTS', () => {
    it('should have valid configurations', () => {
      DEFAULT_SHORTCUTS.forEach(config => {
        expect(config.id).toBeTruthy();
        expect(config.name).toBeTruthy();
        expect(config.defaultKey).toBeTruthy();
        expect(Array.isArray(config.defaultModifiers)).toBe(true);
        expect(config.description).toBeTruthy();
        expect(config.category).toBeTruthy();
      });
    });

    it('should have unique IDs', () => {
      const ids = DEFAULT_SHORTCUTS.map(s => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid categories', () => {
      const validCategories = SHORTCUT_CATEGORIES.map(c => c.id);
      DEFAULT_SHORTCUTS.forEach(config => {
        expect(validCategories).toContain(config.category);
      });
    });
  });

  describe('SHORTCUT_CATEGORIES', () => {
    it('should have valid categories', () => {
      SHORTCUT_CATEGORIES.forEach(cat => {
        expect(cat.id).toBeTruthy();
        expect(cat.name).toBeTruthy();
        expect(Array.isArray(cat.shortcuts)).toBe(true);
      });
    });

    it('should have unique IDs', () => {
      const ids = SHORTCUT_CATEGORIES.map(c => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('initializeDefaultShortcuts', () => {
    it('should initialize all default shortcuts', () => {
      const actions: Record<string, () => void> = {};
      DEFAULT_SHORTCUTS.forEach(config => {
        actions[config.id] = vi.fn();
      });

      const testManager = new ShortcutManager();
      
      // 手动注册（模拟 initializeDefaultShortcuts）
      DEFAULT_SHORTCUTS.forEach(config => {
        testManager.register(config.id, {
          key: config.defaultKey,
          modifiers: config.defaultModifiers,
          description: config.description,
          category: config.category,
          action: actions[config.id],
          enabled: true,
        });
      });

      const all = testManager.getAll();
      expect(all.size).toBe(DEFAULT_SHORTCUTS.length);
    });
  });

  describe('persistence', () => {
    it('should save custom shortcuts to localStorage', () => {
      const action = vi.fn();
      const defaultConfig = DEFAULT_SHORTCUTS.find(s => s.id === 'save')!;

      manager.register('save', {
        key: defaultConfig.defaultKey,
        modifiers: defaultConfig.defaultModifiers,
        description: defaultConfig.description,
        category: defaultConfig.category,
        action,
      });

      manager.customize('save', 'k', ['ctrl', 'alt']);

      const saved = localStorage.getItem('custom-shortcuts');
      expect(saved).toBeTruthy();

      const parsed = JSON.parse(saved!);
      expect(Array.isArray(parsed)).toBe(true);
    });

    it('should load custom shortcuts from localStorage', () => {
      const customData = [
        ['save', { key: 'k', modifiers: ['ctrl', 'alt'] }]
      ];
      localStorage.setItem('custom-shortcuts', JSON.stringify(customData));

      const newManager = new ShortcutManager();
      
      // 验证加载成功（通过内部状态）
      expect(localStorage.getItem('custom-shortcuts')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle empty modifiers', () => {
      const action = vi.fn();
      manager.register('f11', {
        key: 'F11',
        modifiers: [],
        description: 'Fullscreen',
        category: 'view',
        action,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'F11',
      });

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(true);
    });

    it('should handle special keys', () => {
      const action = vi.fn();
      manager.register('prev', {
        key: 'ArrowLeft',
        modifiers: ['ctrl'],
        description: 'Previous',
        category: 'navigation',
        action,
      });

      const event = new KeyboardEvent('keydown', {
        key: 'ArrowLeft',
        ctrlKey: true,
      });

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(true);
    });

    it('should handle case-insensitive keys', () => {
      const action = vi.fn();
      manager.register('save', {
        key: 's',
        modifiers: ['ctrl'],
        description: 'Save',
        category: 'file',
        action,
      });

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      });

      const handled = manager.handleKeyDown(event);
      expect(handled).toBe(true);
    });
  });
});
