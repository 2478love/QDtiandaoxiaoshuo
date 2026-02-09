/**
 * 虚拟滚动工具
 * 解决大量章节列表的性能问题
 */

export interface VirtualScrollConfig {
  /** 容器高度 */
  containerHeight: number;
  /** 每项高度 */
  itemHeight: number;
  /** 缓冲区大小（上下额外渲染的项数） */
  bufferSize?: number;
  /** 总项数 */
  totalItems: number;
}

export interface VirtualScrollState {
  /** 滚动位置 */
  scrollTop: number;
  /** 可见区域开始索引 */
  startIndex: number;
  /** 可见区域结束索引 */
  endIndex: number;
  /** 实际渲染的开始索引（包含缓冲区） */
  renderStartIndex: number;
  /** 实际渲染的结束索引（包含缓冲区） */
  renderEndIndex: number;
  /** 偏移量 */
  offsetY: number;
  /** 可见项数 */
  visibleCount: number;
}

/**
 * 计算虚拟滚动状态
 */
export function calculateVirtualScrollState(
  config: VirtualScrollConfig,
  scrollTop: number
): VirtualScrollState {
  const { containerHeight, itemHeight, bufferSize = 3, totalItems } = config;

  // 计算可见项数
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // 计算可见区域的开始和结束索引
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount, totalItems);

  // 计算实际渲染的索引（包含缓冲区）
  const renderStartIndex = Math.max(0, startIndex - bufferSize);
  const renderEndIndex = Math.min(totalItems, endIndex + bufferSize);

  // 计算偏移量
  const offsetY = renderStartIndex * itemHeight;

  return {
    scrollTop,
    startIndex,
    endIndex,
    renderStartIndex,
    renderEndIndex,
    offsetY,
    visibleCount,
  };
}

/**
 * 获取需要渲染的项索引列表
 */
export function getVisibleIndices(state: VirtualScrollState): number[] {
  const indices: number[] = [];
  for (let i = state.renderStartIndex; i < state.renderEndIndex; i++) {
    indices.push(i);
  }
  return indices;
}

/**
 * 计算总容器高度
 */
export function calculateTotalHeight(totalItems: number, itemHeight: number): number {
  return totalItems * itemHeight;
}

/**
 * 检查索引是否在可见区域
 */
export function isIndexVisible(index: number, state: VirtualScrollState): boolean {
  return index >= state.startIndex && index < state.endIndex;
}

/**
 * 检查索引是否需要渲染（包含缓冲区）
 */
export function shouldRenderIndex(index: number, state: VirtualScrollState): boolean {
  return index >= state.renderStartIndex && index < state.renderEndIndex;
}

/**
 * 滚动到指定索引
 */
export function scrollToIndex(
  index: number,
  config: VirtualScrollConfig,
  align: 'start' | 'center' | 'end' = 'start'
): number {
  const { itemHeight, containerHeight, totalItems } = config;

  // 确保索引在有效范围内
  const validIndex = Math.max(0, Math.min(index, totalItems - 1));

  let scrollTop: number;

  switch (align) {
    case 'center':
      scrollTop = validIndex * itemHeight - containerHeight / 2 + itemHeight / 2;
      break;
    case 'end':
      scrollTop = validIndex * itemHeight - containerHeight + itemHeight;
      break;
    case 'start':
    default:
      scrollTop = validIndex * itemHeight;
      break;
  }

  // 确保滚动位置在有效范围内
  const maxScrollTop = totalItems * itemHeight - containerHeight;
  return Math.max(0, Math.min(scrollTop, maxScrollTop));
}

/**
 * 获取指定位置的索引
 */
export function getIndexAtPosition(scrollTop: number, itemHeight: number): number {
  return Math.floor(scrollTop / itemHeight);
}

/**
 * 虚拟滚动管理器类
 */
export class VirtualScrollManager {
  private config: VirtualScrollConfig;
  private state: VirtualScrollState;
  private listeners: Set<(state: VirtualScrollState) => void>;

  constructor(config: VirtualScrollConfig) {
    this.config = config;
    this.state = calculateVirtualScrollState(config, 0);
    this.listeners = new Set();
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<VirtualScrollConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateState(this.state.scrollTop);
  }

  /**
   * 更新滚动位置
   */
  updateScrollTop(scrollTop: number): void {
    this.updateState(scrollTop);
  }

  /**
   * 更新状态
   */
  private updateState(scrollTop: number): void {
    const newState = calculateVirtualScrollState(this.config, scrollTop);
    
    // 只有当状态真正改变时才通知监听器
    if (this.hasStateChanged(this.state, newState)) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  /**
   * 检查状态是否改变
   */
  private hasStateChanged(oldState: VirtualScrollState, newState: VirtualScrollState): boolean {
    return (
      oldState.renderStartIndex !== newState.renderStartIndex ||
      oldState.renderEndIndex !== newState.renderEndIndex
    );
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  /**
   * 添加状态变化监听器
   */
  subscribe(listener: (state: VirtualScrollState) => void): () => void {
    this.listeners.add(listener);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 获取当前状态
   */
  getState(): VirtualScrollState {
    return this.state;
  }

  /**
   * 获取可见索引列表
   */
  getVisibleIndices(): number[] {
    return getVisibleIndices(this.state);
  }

  /**
   * 滚动到指定索引
   */
  scrollToIndex(index: number, align: 'start' | 'center' | 'end' = 'start'): number {
    const scrollTop = scrollToIndex(index, this.config, align);
    this.updateScrollTop(scrollTop);
    return scrollTop;
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    return calculateTotalHeight(this.config.totalItems, this.config.itemHeight);
  }

  /**
   * 检查索引是否可见
   */
  isIndexVisible(index: number): boolean {
    return isIndexVisible(index, this.state);
  }

  /**
   * 检查索引是否需要渲染
   */
  shouldRenderIndex(index: number): boolean {
    return shouldRenderIndex(index, this.state);
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    this.listeners.clear();
  }
}

/**
 * 创建虚拟滚动管理器
 */
export function createVirtualScrollManager(config: VirtualScrollConfig): VirtualScrollManager {
  return new VirtualScrollManager(config);
}

/**
 * 批量更新优化
 * 防止频繁的状态更新
 */
export function throttleScroll(
  callback: (scrollTop: number) => void,
  delay: number = 16
): (scrollTop: number) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastScrollTop: number | null = null;

  return (scrollTop: number) => {
    lastScrollTop = scrollTop;

    if (timeoutId === null) {
      timeoutId = setTimeout(() => {
        if (lastScrollTop !== null) {
          callback(lastScrollTop);
        }
        timeoutId = null;
      }, delay);
    }
  };
}

/**
 * 计算动态高度的虚拟滚动
 * 用于项高度不固定的场景
 */
export interface DynamicHeightItem {
  index: number;
  height: number;
  offset: number;
}

export class DynamicVirtualScrollManager {
  private itemHeights: Map<number, number>;
  private defaultHeight: number;
  private totalItems: number;
  private containerHeight: number;
  private bufferSize: number;

  constructor(
    totalItems: number,
    containerHeight: number,
    defaultHeight: number,
    bufferSize: number = 3
  ) {
    this.itemHeights = new Map();
    this.defaultHeight = defaultHeight;
    this.totalItems = totalItems;
    this.containerHeight = containerHeight;
    this.bufferSize = bufferSize;
  }

  /**
   * 设置项高度
   */
  setItemHeight(index: number, height: number): void {
    this.itemHeights.set(index, height);
  }

  /**
   * 获取项高度
   */
  getItemHeight(index: number): number {
    return this.itemHeights.get(index) || this.defaultHeight;
  }

  /**
   * 计算项的偏移量
   */
  getItemOffset(index: number): number {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += this.getItemHeight(i);
    }
    return offset;
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    let height = 0;
    for (let i = 0; i < this.totalItems; i++) {
      height += this.getItemHeight(i);
    }
    return height;
  }

  /**
   * 根据滚动位置计算可见项
   */
  getVisibleItems(scrollTop: number): DynamicHeightItem[] {
    const items: DynamicHeightItem[] = [];
    let currentOffset = 0;
    let startFound = false;

    for (let i = 0; i < this.totalItems; i++) {
      const height = this.getItemHeight(i);
      const itemEnd = currentOffset + height;

      // 检查是否在可见区域
      if (!startFound && itemEnd > scrollTop) {
        startFound = true;
      }

      if (startFound) {
        items.push({
          index: i,
          height,
          offset: currentOffset,
        });

        // 如果超出可见区域，停止
        if (currentOffset > scrollTop + this.containerHeight) {
          break;
        }
      }

      currentOffset = itemEnd;
    }

    return items;
  }
}
