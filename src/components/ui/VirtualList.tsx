/**
 * 虚拟列表组件
 *
 * 用于高效渲染大量列表项，只渲染可视区域内的元素
 */

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
  memo,
  forwardRef,
  useImperativeHandle,
} from 'react';

/**
 * 虚拟列表配置
 */
interface VirtualListProps<T> {
  /** 列表数据 */
  items: T[];
  /** 每项高度（像素），可以是固定值或函数 */
  itemHeight: number | ((index: number, item: T) => number);
  /** 容器高度（像素） */
  height: number;
  /** 容器宽度（可选） */
  width?: number | string;
  /** 渲染每一项的函数 */
  renderItem: (item: T, index: number, style: React.CSSProperties) => React.ReactNode;
  /** 预渲染的额外项数（上下各多渲染几项） */
  overscan?: number;
  /** 容器类名 */
  className?: string;
  /** 内容区域类名 */
  contentClassName?: string;
  /** 空列表时显示的内容 */
  emptyContent?: React.ReactNode;
  /** 列表项的唯一标识符获取函数 */
  getItemKey?: (item: T, index: number) => string | number;
  /** 滚动事件回调 */
  onScroll?: (scrollTop: number) => void;
  /** 是否启用滚动吸附 */
  snapToItem?: boolean;
}

/**
 * 虚拟列表实例方法
 */
export interface VirtualListHandle {
  /** 滚动到指定索引 */
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void;
  /** 滚动到指定偏移量 */
  scrollTo: (offset: number) => void;
  /** 获取当前滚动位置 */
  getScrollTop: () => number;
  /** 刷新列表（当数据变化时） */
  refresh: () => void;
}

/**
 * 计算项目位置信息
 */
interface ItemPosition {
  index: number;
  offset: number;
  height: number;
}

/**
 * 虚拟列表组件
 */
function VirtualListInner<T>(
  props: VirtualListProps<T>,
  ref: React.ForwardedRef<VirtualListHandle>
) {
  const {
    items,
    itemHeight,
    height,
    width = '100%',
    renderItem,
    overscan = 3,
    className = '',
    contentClassName = '',
    emptyContent,
    getItemKey,
    onScroll,
    snapToItem = false,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  // 计算每个项目的位置信息
  const itemPositions = useMemo<ItemPosition[]>(() => {
    const positions: ItemPosition[] = [];
    let offset = 0;

    items.forEach((item, index) => {
      const h = typeof itemHeight === 'function' ? itemHeight(index, item) : itemHeight;
      positions.push({
        index,
        offset,
        height: h,
      });
      offset += h;
    });

    return positions;
  }, [items, itemHeight, refreshKey]);

  // 计算总高度
  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0;
    const last = itemPositions[itemPositions.length - 1];
    return last.offset + last.height;
  }, [itemPositions]);

  // 二分查找起始索引
  const findStartIndex = useCallback(
    (scrollOffset: number): number => {
      if (itemPositions.length === 0) return 0;

      let low = 0;
      let high = itemPositions.length - 1;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const pos = itemPositions[mid];

        if (pos.offset + pos.height <= scrollOffset) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return Math.max(0, low - overscan);
    },
    [itemPositions, overscan]
  );

  // 查找结束索引
  const findEndIndex = useCallback(
    (scrollOffset: number, viewportHeight: number): number => {
      const endOffset = scrollOffset + viewportHeight;

      if (itemPositions.length === 0) return 0;

      let low = 0;
      let high = itemPositions.length - 1;

      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        const pos = itemPositions[mid];

        if (pos.offset < endOffset) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }

      return Math.min(itemPositions.length - 1, low + overscan);
    },
    [itemPositions, overscan]
  );

  // 计算可见项
  const visibleItems = useMemo(() => {
    if (items.length === 0) return [];

    const startIndex = findStartIndex(scrollTop);
    const endIndex = findEndIndex(scrollTop, height);

    const visible: Array<{
      item: T;
      index: number;
      style: React.CSSProperties;
      key: string | number;
    }> = [];

    for (let i = startIndex; i <= endIndex && i < items.length; i++) {
      const pos = itemPositions[i];
      if (!pos) continue;

      visible.push({
        item: items[i],
        index: i,
        style: {
          position: 'absolute',
          top: pos.offset,
          left: 0,
          right: 0,
          height: pos.height,
        },
        key: getItemKey ? getItemKey(items[i], i) : i,
      });
    }

    return visible;
  }, [items, itemPositions, scrollTop, height, findStartIndex, findEndIndex, getItemKey]);

  // 处理滚动事件
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // 暴露给父组件的方法
  useImperativeHandle(
    ref,
    () => ({
      scrollToIndex: (index: number, align: 'start' | 'center' | 'end' = 'start') => {
        if (!containerRef.current || index < 0 || index >= items.length) return;

        const pos = itemPositions[index];
        if (!pos) return;

        let targetOffset: number;

        switch (align) {
          case 'center':
            targetOffset = pos.offset - height / 2 + pos.height / 2;
            break;
          case 'end':
            targetOffset = pos.offset - height + pos.height;
            break;
          case 'start':
          default:
            targetOffset = pos.offset;
            break;
        }

        containerRef.current.scrollTop = Math.max(0, Math.min(targetOffset, totalHeight - height));
      },

      scrollTo: (offset: number) => {
        if (!containerRef.current) return;
        containerRef.current.scrollTop = Math.max(0, Math.min(offset, totalHeight - height));
      },

      getScrollTop: () => scrollTop,

      refresh: () => setRefreshKey((k) => k + 1),
    }),
    [items.length, itemPositions, height, totalHeight, scrollTop]
  );

  // 空列表
  if (items.length === 0) {
    return (
      <div
        className={className}
        style={{ height, width, overflow: 'auto' }}
      >
        {emptyContent || (
          <div className="flex items-center justify-center h-full text-slate-400">
            暂无数据
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height,
        width,
        overflow: 'auto',
        position: 'relative',
      }}
      onScroll={handleScroll}
    >
      <div
        className={contentClassName}
        style={{
          height: totalHeight,
          position: 'relative',
        }}
      >
        {visibleItems.map(({ item, index, style, key }) => (
          <React.Fragment key={key}>
            {renderItem(item, index, style)}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// 使用 forwardRef 和 memo 优化
export const VirtualList = memo(
  forwardRef(VirtualListInner)
) as <T>(
  props: VirtualListProps<T> & { ref?: React.ForwardedRef<VirtualListHandle> }
) => React.ReactElement;

/**
 * 简化版虚拟列表 Hook
 * 用于需要更多自定义控制的场景
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number | ((index: number, item: T) => number);
    containerHeight: number;
    overscan?: number;
  }
) {
  const { itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  // 计算位置信息
  const itemPositions = useMemo(() => {
    const positions: ItemPosition[] = [];
    let offset = 0;

    items.forEach((item, index) => {
      const h = typeof itemHeight === 'function' ? itemHeight(index, item) : itemHeight;
      positions.push({ index, offset, height: h });
      offset += h;
    });

    return positions;
  }, [items, itemHeight]);

  const totalHeight = useMemo(() => {
    if (itemPositions.length === 0) return 0;
    const last = itemPositions[itemPositions.length - 1];
    return last.offset + last.height;
  }, [itemPositions]);

  // 二分查找
  const findStartIndex = useCallback(
    (offset: number) => {
      if (itemPositions.length === 0) return 0;
      let low = 0, high = itemPositions.length - 1;
      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (itemPositions[mid].offset + itemPositions[mid].height <= offset) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }
      return Math.max(0, low - overscan);
    },
    [itemPositions, overscan]
  );

  const findEndIndex = useCallback(
    (offset: number) => {
      const endOffset = offset + containerHeight;
      if (itemPositions.length === 0) return 0;
      let low = 0, high = itemPositions.length - 1;
      while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (itemPositions[mid].offset < endOffset) {
          low = mid;
        } else {
          high = mid - 1;
        }
      }
      return Math.min(itemPositions.length - 1, low + overscan);
    },
    [itemPositions, containerHeight, overscan]
  );

  const visibleRange = useMemo(() => {
    return {
      start: findStartIndex(scrollTop),
      end: findEndIndex(scrollTop),
    };
  }, [scrollTop, findStartIndex, findEndIndex]);

  const visibleItems = useMemo(() => {
    const { start, end } = visibleRange;
    return items.slice(start, end + 1).map((item, i) => ({
      item,
      index: start + i,
      position: itemPositions[start + i],
    }));
  }, [items, visibleRange, itemPositions]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const scrollToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < itemPositions.length) {
        setScrollTop(itemPositions[index].offset);
      }
    },
    [itemPositions]
  );

  return {
    visibleItems,
    totalHeight,
    scrollTop,
    handleScroll,
    scrollToIndex,
    visibleRange,
  };
}

export default VirtualList;
