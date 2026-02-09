/**
 * @fileoverview 标签筛选组件
 * @module components/ui/TagFilter
 */

import React, { useEffect, useState } from 'react';
import { Tag } from '../../types/tag';
import { Novel } from '../../types/novel';
import { TagService } from '../../services/tag/TagService';
import { Plus, X } from 'lucide-react';

interface TagFilterProps {
  novels: Novel[];
  selectedTagId: string | null;
  onTagSelect: (tagId: string | null) => void;
  onTagsChange?: () => void;
}

const TagFilter: React.FC<TagFilterProps> = ({ 
  novels, 
  selectedTagId, 
  onTagSelect,
  onTagsChange 
}) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTagForm, setNewTagForm] = useState({ name: '', color: '#3b82f6' });

  useEffect(() => {
    loadTags();
  }, [novels]);

  const loadTags = () => {
    const allTags = TagService.updateTagCounts(novels);
    setTags(allTags);
  };

  const handleAddTag = () => {
    try {
      TagService.addTag(newTagForm.name, newTagForm.color);
      loadTags();
      setShowAddModal(false);
      setNewTagForm({ name: '', color: '#3b82f6' });
      if (onTagsChange) onTagsChange();
    } catch (error: any) {
      alert(error.message || '添加标签失败');
    }
  };

  const handleDeleteTag = (tagId: string) => {
    if (confirm('确定要删除这个标签吗？')) {
      const success = TagService.deleteTag(tagId);
      if (success) {
        loadTags();
        if (selectedTagId === tagId) {
          onTagSelect(null);
        }
        if (onTagsChange) onTagsChange();
      } else {
        alert('无法删除预设标签');
      }
    }
  };

  const presetColors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
    '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#f43f5e'
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">标签筛选</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="text-xs text-[#2C5F2D] dark:text-[#97BC62] hover:underline flex items-center gap-1"
        >
          <Plus className="w-3 h-3" />
          添加标签
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onTagSelect(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            selectedTagId === null
              ? 'bg-[#2C5F2D] text-white'
              : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
          }`}
        >
          全部 ({novels.length})
        </button>

        {tags.map(tag => (
          <div key={tag.id} className="relative group">
            <button
              onClick={() => onTagSelect(tag.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                selectedTagId === tag.id
                  ? 'text-white'
                  : 'hover:opacity-80'
              }`}
              style={{
                backgroundColor: selectedTagId === tag.id ? tag.color : `${tag.color}40`,
                color: selectedTagId === tag.id ? 'white' : tag.color
              }}
            >
              {tag.name} ({tag.count})
            </button>
            {!tag.isPreset && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTag(tag.id);
                }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 添加标签模态框 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                添加新标签
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  标签名称
                </label>
                <input
                  type="text"
                  value={newTagForm.name}
                  onChange={e => setNewTagForm({ ...newTagForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder="例如：热血、搞笑"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  标签颜色
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagForm({ ...newTagForm, color })}
                      className={`w-full h-10 rounded-lg transition-all ${
                        newTagForm.color === color
                          ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-slate-500'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="color"
                    value={newTagForm.color}
                    onChange={e => setNewTagForm({ ...newTagForm, color: e.target.value })}
                    className="w-12 h-10 rounded cursor-pointer"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    自定义颜色
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <div
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: newTagForm.color }}
                >
                  {newTagForm.name || '预览'}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewTagForm({ name: '', color: '#3b82f6' });
                }}
                className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleAddTag}
                disabled={!newTagForm.name.trim()}
                className="px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;
