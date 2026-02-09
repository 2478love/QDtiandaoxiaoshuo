/**
 * @fileoverview 标签系统类型定义
 * @module types/tag
 */

export interface Tag {
  id: string;
  name: string;
  color: string;
  count: number;
  isPreset: boolean;
  createdAt: string;
}

export interface TagFilter {
  tagId: string | null;
  name: string;
}
