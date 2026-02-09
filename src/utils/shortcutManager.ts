/**
 * 快捷键管理系统 - 提升编辑器操作效率
 * 
 * 核心能力：
 * 1. 全局快捷键注册和管理
 * 2. 快捷键冲突检测
 * 3. 自定义快捷键配置
 * 4. 快捷键提示和帮助
 */

// ============ 类型定义 ============

export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta';

export interface ShortcutKey {
  key: string;
  modifiers: KeyModifier[];
  description: string;
  category: string;
  action: () => void;
  enabled?: boolean;
}

export interface ShortcutConfig {
  id: string;
  name: string;
  defaultKey: string;
  defaultModifiers: KeyModifier[];
  description: string;
  category: string;
  customizable: boolean;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  shortcuts: ShortcutConfig[];
}

// ============ 默认快捷键配置 ============

export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // 文件操作
  {
    id: 'save',
    name: '保存',
    defaultKey: 's',
    defaultModifiers: ['ctrl'],
    description: '保存当前章节',
    category: 'file',
    customizable: true,
  },
  {
    id: 'export',
    name: '导出',
    defaultKey: 'e',
    defaultModifiers: ['ctrl', 'shift'],
    description: '导出章节',
    category: 'file',
    customizable: true,
  },

  // 编辑操作
  {
    id: 'undo',
    name: '撤销',
    defaultKey: 'z',
    defaultModifiers: ['ctrl'],
    description: '撤销上一步操作',
    category: 'edit',
    customizable: false,
  },
  {
    id: 'redo',
    name: '重做',
    defaultKey: 'y',
    defaultModifiers: ['ctrl'],
    description: '重做上一步操作',
    category: 'edit',
    customizable: false,
  },
  {
    id: 'find',
    name: '查找',
    defaultKey: 'f',
    defaultModifiers: ['ctrl'],
    description: '查找文本',
    category: 'edit',
    customizable: true,
  },
  {
    id: 'replace',
    name: '替换',
    defaultKey: 'h',
    defaultModifiers: ['ctrl'],
    description: '查找并替换',
    category: 'edit',
    customizable: true,
  },

  // 格式化
  {
    id: 'bold',
    name: '加粗',
    defaultKey: 'b',
    defaultModifiers: ['ctrl'],
    description: '加粗选中文本',
    category: 'format',
    customizable: true,
  },
  {
    id: 'italic',
    name: '斜体',
    defaultKey: 'i',
    defaultModifiers: ['ctrl'],
    description: '斜体选中文本',
    category: 'format',
    customizable: true,
  },

  // AI 功能
  {
    id: 'ai-rewrite',
    name: 'AI 改写',
    defaultKey: 'r',
    defaultModifiers: ['ctrl', 'shift'],
    description: 'AI 改写选中文本',
    category: 'ai',
    customizable: true,
  },
  {
    id: 'ai-expand',
    name: 'AI 扩写',
    defaultKey: 'e',
    defaultModifiers: ['ctrl', 'alt'],
    description: 'AI 扩写选中文本',
    category: 'ai',
    customizable: true,
  },
  {
    id: 'ai-polish',
    name: 'AI 润色',
    defaultKey: 'p',
    defaultModifiers: ['ctrl', 'shift'],
    description: 'AI 润色选中文本',
    category: 'ai',
    customizable: true,
  },
  {
    id: 'ai-analyze',
    name: 'AI 分析',
    defaultKey: 'a',
    defaultModifiers: ['ctrl', 'shift'],
    description: '分析当前章节',
    category: 'ai',
    customizable: true,
  },

  // 导航
  {
    id: 'prev-chapter',
    name: '上一章',
    defaultKey: 'ArrowLeft',
    defaultModifiers: ['ctrl'],
    description: '切换到上一章',
    category: 'navigation',
    customizable: true,
  },
  {
    id: 'next-chapter',
    name: '下一章',
    defaultKey: 'ArrowRight',
    defaultModifiers: ['ctrl'],
    description: '切换到下一章',
    category: 'navigation',
    customizable: true,
  },
  {
    id: 'toggle-sidebar',
    name: '切换侧边栏',
    defaultKey: 'b',
    defaultModifiers: ['ctrl', 'alt'],
    description: '显示/隐藏侧边栏',
    category: 'navigation',
    customizable: true,
  },

  // 视图
  {
    id: 'toggle-preview',
    name: '切换预览',
    defaultKey: 'p',
    defaultModifiers: ['ctrl', 'alt'],
    description: '切换预览模式',
    category: 'view',
    customizable: true,
  },
  {
    id: 'toggle-fullscreen',
    name: '全屏',
    defaultKey: 'F11',
    defaultModifiers: [],
    description: '切换全屏模式',
    category: 'view',
    customizable: false,
  },
  {
    id: 'zoom-in',
    name: '放大',
    defaultKey: '=',
    defaultModifiers: ['ctrl'],
    description: '放大字体',
    category: 'view',
    customizable: true,
  },
  {
    id: 'zoom-out',
    name: '缩小',
    defaultKey: '-',
    defaultModifiers: ['ctrl'],
    description: '缩小字体',
    category: 'view',
    customizable: true,
  },

  // 工具
  {
    id: 'word-count',
    name: '字数统计',
    defaultKey: 'w',
    defaultModifiers: ['ctrl', 'shift'],
    description: '显示字数统计',
    category: 'tools',
    customizable: true,
  },
  {
    id: 'pomodoro',
    name: '番茄钟',
    defaultKey: 't',
    defaultModifiers: ['ctrl', 'shift'],
    description: '开始/暂停番茄钟',
    category: 'tools',
    customizable: true,
  },
];

export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  { id: 'file', name: '文件操作', shortcuts: [] },
  { id: 'edit', name: '编辑', shortcuts: [] },
  { id: 'format', name: '格式化', shortcuts: [] },
  { id: 'ai', name: 'AI 功能', shortcuts: [] },
  { id: 'navigation', name: '导航', shortcuts: [] },
  { id: 'view', name: '视图', shortcuts: [] },
  { id: 'tools', name: '工具', shortcuts: [] },
];

// ============ 快捷键管理器 ============

export class ShortcutManager {
  private shortcuts: Map<string, ShortcutKey>;
  private customShortcuts: Map<string, { key: string; modifiers: KeyModifier[] }>;

  constructor() {
    this.shortcuts = new Map();
    this.customShortcuts = new Map();
    this.loadCustomShortcuts();
  }

  /**
   * 注册快捷键
   */
  register(id: string, shortcut: ShortcutKey): void {
    // 检查冲突
    const conflict = this.findConflict(shortcut.key, shortcut.modifiers);
    if (conflict) {
      console.warn(`Shortcut conflict: ${id} conflicts with ${conflict}`);
    }

    this.shortcuts.set(id, shortcut);
  }

  /**
   * 注销快捷键
   */
  unregister(id: string): void {
    this.shortcuts.delete(id);
  }

  /**
   * 查找冲突的快捷键
   */
  private findConflict(key: string, modifiers: KeyModifier[]): string | null {
    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (
        shortcut.key === key &&
        this.modifiersEqual(shortcut.modifiers, modifiers)
      ) {
        return id;
      }
    }
    return null;
  }

  /**
   * 比较修饰键是否相同
   */
  private modifiersEqual(a: KeyModifier[], b: KeyModifier[]): boolean {
    if (a.length !== b.length) return false;
    const sortedA = [...a].sort();
    const sortedB = [...b].sort();
    return sortedA.every((mod, idx) => mod === sortedB[idx]);
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    const key = event.key;
    const modifiers: KeyModifier[] = [];

    if (event.ctrlKey || event.metaKey) modifiers.push('ctrl');
    if (event.altKey) modifiers.push('alt');
    if (event.shiftKey) modifiers.push('shift');

    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (
        shortcut.enabled !== false &&
        shortcut.key === key &&
        this.modifiersEqual(shortcut.modifiers, modifiers)
      ) {
        event.preventDefault();
        shortcut.action();
        return true;
      }
    }

    return false;
  }

  /**
   * 自定义快捷键
   */
  customize(id: string, key: string, modifiers: KeyModifier[]): boolean {
    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    // 检查冲突
    const conflict = this.findConflict(key, modifiers);
    if (conflict && conflict !== id) {
      return false;
    }

    // 更新快捷键
    shortcut.key = key;
    shortcut.modifiers = modifiers;

    // 保存自定义配置
    this.customShortcuts.set(id, { key, modifiers });
    this.saveCustomShortcuts();

    return true;
  }

  /**
   * 重置快捷键
   */
  reset(id: string): boolean {
    const config = DEFAULT_SHORTCUTS.find(s => s.id === id);
    if (!config) return false;

    const shortcut = this.shortcuts.get(id);
    if (!shortcut) return false;

    shortcut.key = config.defaultKey;
    shortcut.modifiers = config.defaultModifiers;

    this.customShortcuts.delete(id);
    this.saveCustomShortcuts();

    return true;
  }

  /**
   * 重置所有快捷键
   */
  resetAll(): void {
    for (const config of DEFAULT_SHORTCUTS) {
      this.reset(config.id);
    }
  }

  /**
   * 获取所有快捷键
   */
  getAll(): Map<string, ShortcutKey> {
    return new Map(this.shortcuts);
  }

  /**
   * 获取快捷键
   */
  get(id: string): ShortcutKey | undefined {
    return this.shortcuts.get(id);
  }

  /**
   * 格式化快捷键显示
   */
  formatShortcut(key: string, modifiers: KeyModifier[]): string {
    const parts: string[] = [];

    if (modifiers.includes('ctrl')) parts.push('Ctrl');
    if (modifiers.includes('alt')) parts.push('Alt');
    if (modifiers.includes('shift')) parts.push('Shift');
    if (modifiers.includes('meta')) parts.push('⌘');

    // 格式化按键名称
    const keyName = key.length === 1 ? key.toUpperCase() : key;
    parts.push(keyName);

    return parts.join(' + ');
  }

  /**
   * 保存自定义快捷键
   */
  private saveCustomShortcuts(): void {
    try {
      const data = Array.from(this.customShortcuts.entries());
      localStorage.setItem('custom-shortcuts', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save custom shortcuts:', error);
    }
  }

  /**
   * 加载自定义快捷键
   */
  private loadCustomShortcuts(): void {
    try {
      const data = localStorage.getItem('custom-shortcuts');
      if (data) {
        const entries = JSON.parse(data) as Array<[string, { key: string; modifiers: KeyModifier[] }]>;
        this.customShortcuts = new Map(entries);
      }
    } catch (error) {
      console.warn('Failed to load custom shortcuts:', error);
    }
  }

  /**
   * 生成快捷键帮助文档
   */
  generateHelp(): string {
    const lines: string[] = [];
    lines.push('# 快捷键帮助\n');

    const categories = new Map<string, ShortcutKey[]>();

    for (const [id, shortcut] of this.shortcuts.entries()) {
      if (!categories.has(shortcut.category)) {
        categories.set(shortcut.category, []);
      }
      categories.get(shortcut.category)!.push(shortcut);
    }

    for (const cat of SHORTCUT_CATEGORIES) {
      const shortcuts = categories.get(cat.id);
      if (!shortcuts || shortcuts.length === 0) continue;

      lines.push(`## ${cat.name}\n`);

      shortcuts.forEach(shortcut => {
        const keyStr = this.formatShortcut(shortcut.key, shortcut.modifiers);
        lines.push(`- **${keyStr}**: ${shortcut.description}`);
      });

      lines.push('');
    }

    return lines.join('\n');
  }
}

// ============ 全局实例 ============

export const globalShortcutManager = new ShortcutManager();

/**
 * 初始化默认快捷键
 */
export function initializeDefaultShortcuts(actions: Record<string, () => void>): void {
  DEFAULT_SHORTCUTS.forEach(config => {
    const action = actions[config.id];
    if (action) {
      globalShortcutManager.register(config.id, {
        key: config.defaultKey,
        modifiers: config.defaultModifiers,
        description: config.description,
        category: config.category,
        action,
        enabled: true,
      });
    }
  });
}

/**
 * 设置快捷键监听
 */
export function setupShortcutListener(): () => void {
  const handler = (event: KeyboardEvent) => {
    globalShortcutManager.handleKeyDown(event);
  };

  window.addEventListener('keydown', handler);

  return () => {
    window.removeEventListener('keydown', handler);
  };
}
