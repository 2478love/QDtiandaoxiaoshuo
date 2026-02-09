/**
 * @fileoverview 标签选择器组件
 * @module components/ui/TagSelector
 */

import React, { useEffect, useState } from 'react';
import { Tag } from '../../types/tag';
import { TagService } from '../../services/tag/TagService';
import { X } from 'lucide-react';

interface TagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

const TagSelector: React.FC<TagSelectorProps> = ({ selectedTags, onChange }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = () => {
    const allTags = TagService.getTags();
    setTags(allTags);
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter(id => id !== tagId));
    } else {
      onChange([...selectedTags, tagId]);
    }
  };

  const handleRemoveTag = (tagId: string) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

  const selectedTagObjects = tags.filter(tag => selectedTags.includes(tag.id));
  const availableTags = tags.filter(tag => !selectedTags.includes(tag.id));

  return (
    <div className="space-y-2">
      {/* 已选标签 */}
      {selectedTagObjects.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedTagObjects.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* 标签选择下拉 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-left text-sm hover:border-[#2C5F2D] transition-colors"
        >
          {selectedTags.length > 0 ? `已选择 ${selectedTags.length} 个标签` : '选择标签...'}
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {availableTags.length > 0 ? (
                <div className="p-2 space-y-1">
                  {availableTags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        handleToggleTag(tag.id);
                      }}
                      className="w-full px-3 py-2 text-left rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm text-slate-900 dark:text-slate-100">
                        {tag.name}
                      </span>
                      {tag.isPreset && (
                        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                          预设
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
                  所有标签已选择
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TagSelector;
