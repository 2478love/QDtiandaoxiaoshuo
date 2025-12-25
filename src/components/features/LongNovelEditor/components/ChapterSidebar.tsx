import React, { useCallback, useMemo, memo } from 'react';
import { useEditorStore } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';
import { Chapter, Volume } from '../../../../types';

/**
 * 章节项组件 - 单独抽取并 memo 化以提升性能
 */
interface ChapterItemProps {
  chapter: Chapter;
  index: number;
  isInVolume: boolean;
  totalCount: number;
  isSelected: boolean;
  isEditing: boolean;
  editingChapterTitle: string;
  showVolumePickerFor: string | null;
  volumes: Volume[];
  themeClasses: Record<string, string>;
  effectiveTheme: string;
  onSelect: () => void;
  onSetEditingChapterTitle: (title: string) => void;
  onSetEditingChapterId: (id: string | null) => void;
  onSetShowVolumePickerFor: (id: string | null) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToVolume: (volumeId: string) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}

const ChapterItem = memo<ChapterItemProps>(({
  chapter,
  index,
  isInVolume,
  totalCount,
  isSelected,
  isEditing,
  editingChapterTitle,
  showVolumePickerFor,
  volumes,
  themeClasses,
  effectiveTheme,
  onSelect,
  onSetEditingChapterTitle,
  onSetEditingChapterId,
  onSetShowVolumePickerFor,
  onMoveUp,
  onMoveDown,
  onMoveToVolume,
  onDuplicate,
  onDelete,
  onRename,
}) => {
  const handleRenameComplete = useCallback(() => {
    if (editingChapterTitle.trim()) {
      onRename(editingChapterTitle.trim());
    }
    onSetEditingChapterId(null);
  }, [editingChapterTitle, onRename, onSetEditingChapterId]);

  return (
    <div
      className={`group relative rounded-xl px-3 py-2 border text-sm transition-colors cursor-pointer ${
        isSelected
          ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
          : `${themeClasses.border} ${themeClasses.text} hover:border-indigo-400/50`
      }`}
      onClick={() => {
        if (!isEditing) {
          onSelect();
        }
      }}
    >
      {isEditing ? (
        <input
          value={editingChapterTitle}
          onChange={(e) => onSetEditingChapterTitle(e.target.value)}
          onBlur={handleRenameComplete}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRenameComplete();
            }
            if (e.key === 'Escape') {
              onSetEditingChapterId(null);
            }
          }}
          className={`w-full bg-transparent border-none outline-none text-sm font-medium ${themeClasses.text}`}
          autoFocus
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="font-medium truncate pr-2">{chapter.title}</span>
            <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
              {/* 移动到卷按钮 */}
              {!isInVolume && volumes.length > 0 && (
                <div className="relative">
                  <button
                    className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} ${showVolumePickerFor === chapter.id ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetShowVolumePickerFor(showVolumePickerFor === chapter.id ? null : chapter.id);
                    }}
                    title="移动到卷"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  {/* 卷选择下拉菜单 */}
                  {showVolumePickerFor === chapter.id && (
                    <div
                      className={`absolute left-0 top-full mt-1 z-20 min-w-[120px] py-1 rounded-xl shadow-lg border ${themeClasses.card} ${themeClasses.border}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={`px-2 py-1 text-[10px] ${themeClasses.textMuted} font-medium border-b ${themeClasses.border}`}>
                        选择目标卷
                      </div>
                      {volumes.map(vol => (
                        <button
                          key={vol.id}
                          className={`w-full text-left px-3 py-1.5 text-xs ${themeClasses.text} hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToVolume(vol.id);
                            onSetShowVolumePickerFor(null);
                          }}
                        >
                          {vol.title}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''} ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
                disabled={index === 0}
                title="上移"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                </svg>
              </button>
              <button
                className={`p-1 rounded ${index === totalCount - 1 ? 'opacity-30 cursor-not-allowed' : ''} ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
                disabled={index === totalCount - 1}
                title="下移"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                onClick={(e) => { e.stopPropagation(); onSetEditingChapterTitle(chapter.title); onSetEditingChapterId(chapter.id); }}
                title="重命名"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
                title="复制章节"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                title="删除"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
          <span className={`block text-[11px] ${themeClasses.textMuted} mt-0.5`}>{chapter.wordCount} 字</span>
        </>
      )}
    </div>
  );
});

ChapterItem.displayName = 'ChapterItem';

interface ChapterSidebarProps {
  showQuickSort: boolean;
  onToggleQuickSort: () => void;
}

const ChapterSidebar: React.FC<ChapterSidebarProps> = ({
  showQuickSort,
  onToggleQuickSort,
}) => {
  const {
    themeClasses,
    effectiveTheme,
    chapters,
    addChapter,
    deleteChapter,
    moveChapterUp,
    moveChapterDown,
    moveChapterToVolume,
    duplicateChapter,
    renameChapter,
  } = useEditorContext();

  const {
    selectedChapterId,
    setSelectedChapterId,
    setMode,
    volumes,
    collapsedVolumes,
    editingVolumeId,
    editingVolumeTitle,
    showVolumePickerFor,
    editingChapterId,
    editingChapterTitle,
    addVolume,
    deleteVolume,
    renameVolume,
    toggleVolumeCollapse,
    setEditingVolumeId,
    setEditingVolumeTitle,
    setShowVolumePickerFor,
    setEditingChapterId,
    setEditingChapterTitle,
  } = useEditorStore();

  // 处理章节重命名完成
  const handleChapterRenameComplete = useCallback((chapterId: string) => {
    if (editingChapterTitle.trim()) {
      renameChapter(chapterId, editingChapterTitle.trim());
    }
    setEditingChapterId(null);
  }, [editingChapterTitle, renameChapter, setEditingChapterId]);

  // 未分类章节
  const unassignedChapters = useMemo(() =>
    chapters.filter(ch => !ch.volumeId),
    [chapters]
  );

  // 渲染章节项 - 使用 memo 化的 ChapterItem 组件
  const renderChapterItem = useCallback((chapter: Chapter, index: number, isInVolume: boolean, totalCount: number) => (
    <ChapterItem
      key={chapter.id}
      chapter={chapter}
      index={index}
      isInVolume={isInVolume}
      totalCount={totalCount}
      isSelected={chapter.id === selectedChapterId}
      isEditing={editingChapterId === chapter.id}
      editingChapterTitle={editingChapterTitle}
      showVolumePickerFor={showVolumePickerFor}
      volumes={volumes}
      themeClasses={themeClasses}
      effectiveTheme={effectiveTheme}
      onSelect={() => {
        setSelectedChapterId(chapter.id);
        setMode('writing');
      }}
      onSetEditingChapterTitle={setEditingChapterTitle}
      onSetEditingChapterId={setEditingChapterId}
      onSetShowVolumePickerFor={setShowVolumePickerFor}
      onMoveUp={() => moveChapterUp(chapter.id)}
      onMoveDown={() => moveChapterDown(chapter.id)}
      onMoveToVolume={(volumeId) => moveChapterToVolume(chapter.id, volumeId)}
      onDuplicate={() => duplicateChapter(chapter.id)}
      onDelete={() => deleteChapter(chapter.id)}
      onRename={(title) => renameChapter(chapter.id, title)}
    />
  ), [
    selectedChapterId,
    editingChapterId,
    editingChapterTitle,
    showVolumePickerFor,
    volumes,
    themeClasses,
    effectiveTheme,
    setSelectedChapterId,
    setMode,
    setEditingChapterTitle,
    setEditingChapterId,
    setShowVolumePickerFor,
    moveChapterUp,
    moveChapterDown,
    moveChapterToVolume,
    duplicateChapter,
    deleteChapter,
    renameChapter,
  ]);

  return (
    <div className="px-4 py-3 flex-1 overflow-y-auto">
      {/* 快速排序按钮 */}
      <button
        onClick={onToggleQuickSort}
        className={`w-full mb-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
          showQuickSort
            ? 'bg-indigo-600 text-white'
            : `border ${themeClasses.border} ${themeClasses.textMuted} hover:border-indigo-400`
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        快速排序
      </button>

      {/* 标题和操作按钮 */}
      <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted} mb-2`}>
        <span className="font-medium">章节 ({chapters.length})</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => addChapter()}
            className="px-2 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-medium hover:bg-orange-600 transition-colors"
            title="添加章节"
          >
            + 章
          </button>
          <button
            onClick={addVolume}
            className="px-2 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-medium hover:bg-indigo-600 transition-colors"
            title="添加卷"
          >
            + 卷
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {chapters.length === 0 && volumes.length === 0 ? (
          <div className={`text-xs ${themeClasses.textMuted} text-center border border-dashed ${themeClasses.border} rounded-2xl py-8 space-y-2`}>
            <svg className={`w-10 h-10 mx-auto ${themeClasses.textMuted} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p>暂无章节内容</p>
            <p className="text-[10px]">点击上方按钮开始创建</p>
          </div>
        ) : (
          <>
            {/* 显示卷和卷内章节 */}
            {volumes.map((volume) => {
              const volumeChapters = chapters.filter(ch => ch.volumeId === volume.id);
              const isCollapsed = collapsedVolumes.has(volume.id);

              return (
                <div key={volume.id} className="space-y-1">
                  {/* 卷标题 */}
                  <div
                    className={`group flex items-center gap-2 px-3 py-2 rounded-xl border ${themeClasses.border} ${themeClasses.card} cursor-pointer hover:border-indigo-400/50`}
                    onClick={() => toggleVolumeCollapse(volume.id)}
                  >
                    <button className={`${themeClasses.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    {editingVolumeId === volume.id ? (
                      <input
                        value={editingVolumeTitle}
                        onChange={(e) => setEditingVolumeTitle(e.target.value)}
                        onBlur={() => {
                          if (editingVolumeTitle.trim()) {
                            renameVolume(volume.id, editingVolumeTitle.trim());
                          }
                          setEditingVolumeId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingVolumeTitle.trim()) {
                            renameVolume(volume.id, editingVolumeTitle.trim());
                            setEditingVolumeId(null);
                          }
                          if (e.key === 'Escape') {
                            setEditingVolumeId(null);
                          }
                        }}
                        className={`flex-1 bg-transparent border-none outline-none text-sm font-medium ${themeClasses.text}`}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <>
                        <span className={`flex-1 text-sm font-medium ${themeClasses.text}`}>{volume.title}</span>
                        <span className={`text-[10px] ${themeClasses.textMuted}`}>{volumeChapters.length} 章</span>
                      </>
                    )}
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      <button
                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          addChapter(volume.id);
                        }}
                        title="添加章节到此卷"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                      <button
                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVolumeTitle(volume.title);
                          setEditingVolumeId(volume.id);
                        }}
                        title="重命名"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteVolume(volume.id);
                        }}
                        title="删除卷"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* 卷内章节列表 */}
                  {!isCollapsed && (
                    <div className="ml-4 space-y-1">
                      {volumeChapters.map((chapter, index) => (
                        renderChapterItem(chapter, index, true, volumeChapters.length)
                      ))}
                      {volumeChapters.length === 0 && (
                        <div className={`text-xs ${themeClasses.textMuted} text-center py-4 border border-dashed ${themeClasses.border} rounded-xl`}>
                          此卷暂无章节
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 显示未分类章节 */}
            {unassignedChapters.length > 0 && (
              <div className="space-y-1">
                {volumes.length > 0 && (
                  <div className={`text-xs ${themeClasses.textMuted} px-3 py-1.5 font-medium`}>
                    未分类章节
                  </div>
                )}
                {unassignedChapters.map((chapter, index) => (
                  renderChapterItem(chapter, index, false, unassignedChapters.length)
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default memo(ChapterSidebar);
