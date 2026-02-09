/**
 * @fileoverview 模板管理组件
 * @module components/features/TemplateManager
 */

import React, { useState, useEffect } from 'react';
import { Template } from '../../../types/template';
import { TemplateService } from '../../../services/template/TemplateService';
import { FileText, Plus, Edit3, Trash2, Copy, BookOpen } from 'lucide-react';

interface TemplateManagerProps {
  onApplyTemplate?: (template: Template) => void;
  onClose?: () => void;
}

const TemplateManager: React.FC<TemplateManagerProps> = ({ onApplyTemplate, onClose }) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'novel' | 'chapter' | 'outline'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'novel' as Template['category'],
    content: {
      title: '',
      description: '',
      outline: '',
      tags: [] as string[]
    }
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const allTemplates = TemplateService.getTemplates();
    setTemplates(allTemplates);
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  const handleCreateTemplate = () => {
    try {
      if (editingTemplate) {
        // 更新模板
        TemplateService.updateTemplate(editingTemplate.id, formData);
      } else {
        // 创建新模板
        TemplateService.saveTemplate(formData);
      }
      
      loadTemplates();
      setShowCreateModal(false);
      resetForm();
    } catch (error) {
      console.error('保存模板失败:', error);
      alert('保存模板失败，请重试');
    }
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('确定要删除这个模板吗？')) {
      const success = TemplateService.deleteTemplate(id);
      if (success) {
        loadTemplates();
      } else {
        alert('无法删除预设模板');
      }
    }
  };

  const handleEditTemplate = (template: Template) => {
    if (template.isPreset) {
      alert('预设模板不可编辑');
      return;
    }
    
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category: template.category,
      content: template.content
    });
    setShowCreateModal(true);
  };

  const handleApplyTemplate = (template: Template) => {
    if (onApplyTemplate) {
      onApplyTemplate(template);
    }
    if (onClose) {
      onClose();
    }
  };

  const resetForm = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      description: '',
      category: 'novel',
      content: {
        title: '',
        description: '',
        outline: '',
        tags: []
      }
    });
  };

  const getCategoryIcon = (category: Template['category']) => {
    switch (category) {
      case 'novel':
        return <BookOpen className="w-4 h-4" />;
      case 'chapter':
        return <FileText className="w-4 h-4" />;
      case 'outline':
        return <Copy className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getCategoryLabel = (category: Template['category']) => {
    switch (category) {
      case 'novel':
        return '小说模板';
      case 'chapter':
        return '章节模板';
      case 'outline':
        return '大纲模板';
      default:
        return '模板';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">📝 写作模板</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              使用模板快速创建小说、章节或大纲
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] transition-colors"
          >
            <Plus className="w-4 h-4" />
            创建模板
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 mt-4">
          {[
            { value: 'all', label: '全部' },
            { value: 'novel', label: '小说' },
            { value: 'chapter', label: '章节' },
            { value: 'outline', label: '大纲' }
          ].map(cat => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === cat.value
                  ? 'bg-[#2C5F2D] text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getCategoryIcon(template.category)}
                  <span className="text-xs px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {getCategoryLabel(template.category)}
                  </span>
                </div>
                {template.isPreset && (
                  <span className="text-xs px-2 py-1 rounded bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                    预设
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleApplyTemplate(template)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-[#2C5F2D] dark:text-[#97BC62] hover:bg-[#2C5F2D]/10 dark:hover:bg-[#97BC62]/10 rounded-lg transition-colors"
                >
                  使用
                </button>
                {!template.isPreset && (
                  <>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">暂无模板</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                {editingTemplate ? '编辑模板' : '创建模板'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  模板名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="例如：玄幻小说模板"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  模板描述
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="简要描述这个模板的用途"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  模板类型
                </label>
                <select
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value as Template['category'] })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="novel">小说模板</option>
                  <option value="chapter">章节模板</option>
                  <option value="outline">大纲模板</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  大纲内容
                </label>
                <textarea
                  value={formData.content.outline}
                  onChange={e => setFormData({ 
                    ...formData, 
                    content: { ...formData.content, outline: e.target.value }
                  })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-h-[200px]"
                  placeholder="输入模板的大纲内容..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateTemplate}
                className="px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] transition-colors"
              >
                {editingTemplate ? '保存' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateManager;
