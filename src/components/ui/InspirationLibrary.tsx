import React, { useState, useMemo } from 'react';
import { InspirationCard, InspirationService } from '../../services/inspiration/InspirationService';

interface InspirationLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (text: string) => void;
}

export const InspirationLibrary: React.FC<InspirationLibraryProps> = ({
  isOpen,
  onClose,
  onApply
}) => {
  const [selectedType, setSelectedType] = useState<InspirationCard['type'] | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCard, setSelectedCard] = useState<InspirationCard | null>(null);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const types = InspirationService.getAllTypes();
  const allTags = InspirationService.getAllTags();

  // 筛选卡片
  const filteredCards = useMemo(() => {
    let cards = InspirationService.getAllCards();

    // 按类型筛选
    if (selectedType !== 'all') {
      cards = cards.filter(card => card.type === selectedType);
    }

    // 按标签筛选
    if (selectedTag !== 'all') {
      cards = cards.filter(card => card.tags.includes(selectedTag));
    }

    // 按关键词搜索
    if (searchKeyword.trim()) {
      cards = InspirationService.searchCards(searchKeyword);
    }

    return cards;
  }, [selectedType, selectedTag, searchKeyword]);

  // 随机抽取
  const handleRandomPick = () => {
    const card = selectedType === 'all' 
      ? InspirationService.getRandomCard()
      : InspirationService.getRandomCard(selectedType);
    setSelectedCard(card);
  };

  // 应用到编辑器
  const handleApply = (card: InspirationCard, exampleIndex?: number) => {
    let text = '';
    if (exampleIndex !== undefined && card.examples[exampleIndex]) {
      text = card.examples[exampleIndex];
    } else {
      text = card.content;
    }
    
    InspirationService.incrementUsage(card.id);
    onApply(text);
    onClose();
  };

  // 获取类型图标和标签
  const getTypeInfo = (type: InspirationCard['type']) => {
    return types.find(t => t.id === type);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[1100px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-[#F0F7F0] to-white">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-800">💡 灵感库</h2>
            <span className="text-sm text-slate-400">{filteredCards.length} 张卡片</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomPick}
              className="px-4 py-2 bg-[#2C5F2D] text-white text-sm rounded-lg hover:bg-[#1E4620] flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              随机抽取
            </button>
            <button
              onClick={() => setView(view === 'grid' ? 'list' : 'grid')}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
              title={view === 'grid' ? '列表视图' : '网格视图'}
            >
              {view === 'grid' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              )}
            </button>
            <button className="text-slate-400 hover:text-slate-600" onClick={onClose}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 筛选栏 */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-4 mb-3">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="搜索灵感卡片..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#2C5F2D]"
              />
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 类型筛选 */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setSelectedType('all')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                selectedType === 'all'
                  ? 'bg-[#2C5F2D] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              全部
            </button>
            {types.map(type => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                  selectedType === type.id
                    ? 'bg-[#2C5F2D] text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <span>{type.icon}</span>
                <span>{type.label}</span>
              </button>
            ))}
          </div>

          {/* 标签筛选 */}
          {allTags.length > 0 && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">标签:</span>
              <button
                onClick={() => setSelectedTag('all')}
                className={`px-2 py-1 text-xs rounded transition-colors ${
                  selectedTag === 'all'
                    ? 'bg-[#97BC62] text-white'
                    : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                全部
              </button>
              {allTags.slice(0, 15).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(tag)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    selectedTag === tag
                      ? 'bg-[#97BC62] text-white'
                      : 'bg-white text-slate-500 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 卡片列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm">没有找到匹配的灵感卡片</p>
            </div>
          ) : view === 'grid' ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredCards.map(card => {
                const typeInfo = getTypeInfo(card.type);
                return (
                  <div
                    key={card.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-lg hover:border-[#97BC62] transition-all cursor-pointer group"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{typeInfo?.icon}</span>
                        <span className="text-xs text-slate-500">{typeInfo?.label}</span>
                      </div>
                      {card.usageCount > 0 && (
                        <span className="text-xs text-slate-400">使用 {card.usageCount} 次</span>
                      )}
                    </div>
                    <h3 className="font-semibold text-slate-800 mb-2 group-hover:text-[#2C5F2D]">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                      {card.content}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {card.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCards.map(card => {
                const typeInfo = getTypeInfo(card.type);
                return (
                  <div
                    key={card.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-[#97BC62] transition-all cursor-pointer"
                    onClick={() => setSelectedCard(card)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{typeInfo?.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-800">{card.title}</h3>
                          <span className="text-xs text-slate-400">{typeInfo?.label}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{card.content}</p>
                        <div className="flex flex-wrap gap-1">
                          {card.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 卡片详情弹窗 */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedCard(null)}>
            <div
              className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getTypeInfo(selectedCard.type)?.icon}</span>
                  <div>
                    <h3 className="font-bold text-slate-800">{selectedCard.title}</h3>
                    <span className="text-xs text-slate-500">{getTypeInfo(selectedCard.type)?.label}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedCard(null)} className="text-slate-400 hover:text-slate-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">描述</h4>
                  <p className="text-sm text-slate-600">{selectedCard.content}</p>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedCard.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">示例</h4>
                  <div className="space-y-3">
                    {selectedCard.examples.map((example, index) => (
                      <div key={index} className="bg-slate-50 rounded-lg p-3 group hover:bg-[#F0F7F0] transition-colors">
                        <p className="text-sm text-slate-700 mb-2">{example}</p>
                        <button
                          onClick={() => handleApply(selectedCard, index)}
                          className="text-xs text-[#2C5F2D] hover:text-[#1E4620] font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          应用此示例 →
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3">
                <button
                  onClick={() => handleApply(selectedCard)}
                  className="px-6 py-2.5 bg-[#2C5F2D] text-white text-sm font-medium rounded-lg hover:bg-[#1E4620]"
                >
                  应用描述
                </button>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspirationLibrary;
