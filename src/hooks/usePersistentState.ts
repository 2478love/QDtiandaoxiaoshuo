/**
 * @fileoverview 持久化状态 Hook（简化版）
 * @module hooks/usePersistentState
 * @description 使用 localStorage 进行简单的本地持久化存储
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as LZString from 'lz-string';

/**
 * 保存数据到 localStorage
 */
function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[Storage] 保存 ${key} 失败:`, error);
  }
}

/**
 * 从 localStorage 读取数据（兼容旧的压缩格式）
 */
function loadFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) {
      // 先尝试直接解析 JSON（新格式）
      try {
        return JSON.parse(stored) as T;
      } catch {
        // 解析失败，可能是旧的压缩格式
        const decompressed = LZString.decompressFromUTF16(stored);
        if (decompressed) {
          const parsed = JSON.parse(decompressed) as T;
          // 迁移：用新格式重新保存
          saveToStorage(key, parsed);
          return parsed;
        }
      }
    }
  } catch (error) {
    console.warn(`[Storage] 读取 ${key} 失败:`, error);
  }

  return defaultValue;
}

/**
 * 持久化状态 Hook
 *
 * 简单可靠的本地存储方案，使用 localStorage 同步读写
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>] {
  // 计算默认值
  const getDefaultValue = useCallback((): T => {
    return typeof initialValue === 'function'
      ? (initialValue as () => T)()
      : initialValue;
  }, [initialValue]);

  // 初始化状态：从 localStorage 读取，如果没有则使用默认值
  const [state, setState] = useState<T>(() => {
    return loadFromStorage(key, getDefaultValue());
  });

  const isFirstRender = useRef(true);

  // 状态变化时保存到 localStorage
  useEffect(() => {
    // 跳过首次渲染（初始值已经是从 localStorage 读取的）
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    saveToStorage(key, state);
  }, [key, state]);

  return [state, setState];
}

/**
 * 带加载状态的持久化 Hook（为了兼容性保留，实际上总是立即加载完成）
 */
export function usePersistentStateWithLoading<T>(
  key: string,
  initialValue: T | (() => T)
): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [state, setState] = usePersistentState(key, initialValue);
  // localStorage 是同步的，所以永远不会处于加载状态
  return [state, setState, false];
}

/**
 * 强制保存（为了兼容性保留）
 */
export async function forceSaveAll(): Promise<void> {
  // localStorage 是同步的，不需要强制保存
  return Promise.resolve();
}

/**
 * 获取待保存数量（为了兼容性保留）
 */
export function getPendingSaveCount(): number {
  return 0;
}

export default usePersistentState;
