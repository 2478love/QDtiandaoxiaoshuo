/**
 * 快捷键系统 Hook
 *
 * 提供统一的快捷键管理：
 * - 支持组合键（Ctrl, Shift, Alt, Meta）
 * - 支持多个快捷键绑定
 * - 自动处理 Mac/Windows 差异
 * - 支持作用域（全局/编辑器）
 */

import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  /** 快捷键描述，用于显示 */
  description: string;
  /** 触发的按键 (不含修饰键) */
  key: string;
  /** 是否需要 Ctrl/Cmd */
  ctrl?: boolean;
  /** 是否需要 Shift */
  shift?: boolean;
  /** 是否需要 Alt */
  alt?: boolean;
  /** 回调函数 */
  action: (e: KeyboardEvent) => void;
  /** 是否阻止默认行为，默认 true */
  preventDefault?: boolean;
  /** 是否在输入框中触发，默认 false */
  enableInInput?: boolean;
}

interface UseKeyboardShortcutsOptions {
  /** 是否启用，默认 true */
  enabled?: boolean;
  /** 目标元素（默认 document） */
  target?: HTMLElement | null;
}

/**
 * 获取平台特定的修饰键符号
 */
export function getModifierSymbol(modifier: 'ctrl' | 'shift' | 'alt' | 'meta'): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  switch (modifier) {
    case 'ctrl':
      return isMac ? '⌘' : 'Ctrl';
    case 'shift':
      return isMac ? '⇧' : 'Shift';
    case 'alt':
      return isMac ? '⌥' : 'Alt';
    case 'meta':
      return isMac ? '⌘' : 'Win';
    default:
      return modifier;
  }
}

/**
 * 格式化快捷键显示文本
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(getModifierSymbol('ctrl'));
  }
  if (shortcut.shift) {
    parts.push(getModifierSymbol('shift'));
  }
  if (shortcut.alt) {
    parts.push(getModifierSymbol('alt'));
  }

  // 格式化按键名称
  let keyName = shortcut.key.toUpperCase();
  if (keyName === ' ') keyName = 'Space';
  if (keyName === 'ESCAPE') keyName = 'Esc';
  if (keyName === 'ENTER') keyName = '↵';
  if (keyName === 'ARROWUP') keyName = '↑';
  if (keyName === 'ARROWDOWN') keyName = '↓';
  if (keyName === 'ARROWLEFT') keyName = '←';
  if (keyName === 'ARROWRIGHT') keyName = '→';

  parts.push(keyName);

  return parts.join('+');
}

/**
 * 快捷键管理 Hook
 */
export function useKeyboardShortcuts(
  shortcuts: KeyboardShortcut[],
  options: UseKeyboardShortcutsOptions = {}
): void {
  const { enabled = true, target = null } = options;
  const shortcutsRef = useRef(shortcuts);

  // 更新快捷键引用
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    const targetElement = e.target as HTMLElement;
    const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(targetElement.tagName) ||
                    targetElement.isContentEditable;

    // Mac 使用 metaKey (Cmd)，Windows 使用 ctrlKey
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

    for (const shortcut of shortcutsRef.current) {
      // 检查是否在输入框中
      if (isInput && !shortcut.enableInInput) {
        continue;
      }

      // 检查按键匹配
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? ctrlOrCmd : !ctrlOrCmd;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        if (shortcut.preventDefault !== false) {
          e.preventDefault();
        }
        shortcut.action(e);
        return;
      }
    }
  }, [enabled]);

  useEffect(() => {
    const element = target || document;
    element.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, target]);
}

/**
 * 预定义的常用快捷键
 */
export const commonShortcuts = {
  save: (action: () => void): KeyboardShortcut => ({
    description: '保存',
    key: 's',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  undo: (action: () => void): KeyboardShortcut => ({
    description: '撤销',
    key: 'z',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  redo: (action: () => void): KeyboardShortcut => ({
    description: '重做',
    key: 'z',
    ctrl: true,
    shift: true,
    action,
    enableInInput: true,
  }),

  redoAlt: (action: () => void): KeyboardShortcut => ({
    description: '重做',
    key: 'y',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  bold: (action: () => void): KeyboardShortcut => ({
    description: '加粗',
    key: 'b',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  italic: (action: () => void): KeyboardShortcut => ({
    description: '斜体',
    key: 'i',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  find: (action: () => void): KeyboardShortcut => ({
    description: '查找',
    key: 'f',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  replace: (action: () => void): KeyboardShortcut => ({
    description: '替换',
    key: 'h',
    ctrl: true,
    action,
    enableInInput: true,
  }),

  escape: (action: () => void): KeyboardShortcut => ({
    description: '取消/关闭',
    key: 'Escape',
    action,
    enableInInput: true,
  }),

  newChapter: (action: () => void): KeyboardShortcut => ({
    description: '新建章节',
    key: 'n',
    ctrl: true,
    shift: true,
    action,
  }),
};

export default useKeyboardShortcuts;
