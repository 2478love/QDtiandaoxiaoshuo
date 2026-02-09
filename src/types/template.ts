/**
 * @fileoverview 模板管理类型定义
 * @module types/template
 */

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'novel' | 'chapter' | 'outline';
  content: {
    title?: string;
    description?: string;
    outline?: string;
    tags?: string[];
  };
  createdAt: string;
  isPreset: boolean;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
}
