/**
 * @fileoverview 性能监测指标服务
 * @module services/performance/PerformanceService
 * @description 提供前端性能监控、指标收集和分析功能
 * @version 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * 性能指标类型
 */
export interface PerformanceMetrics {
  /** 首次内容绘制时间 (FCP) */
  fcp?: number;
  /** 最大内容绘制时间 (LCP) */
  lcp?: number;
  /** 首次输入延迟 (FID) */
  fid?: number;
  /** 累积布局偏移 (CLS) */
  cls?: number;
  /** 首字节时间 (TTFB) */
  ttfb?: number;
  /** DOM 加载完成时间 */
  domContentLoaded?: number;
  /** 页面完全加载时间 */
  pageLoad?: number;
  /** JS 堆内存使用 */
  jsHeapSize?: number;
  /** JS 堆内存限制 */
  jsHeapSizeLimit?: number;
  /** 内存使用率 */
  memoryUsagePercent?: number;
}

/**
 * 组件性能指标
 */
export interface ComponentMetrics {
  /** 组件名称 */
  name: string;
  /** 渲染次数 */
  renderCount: number;
  /** 平均渲染时间 (ms) */
  avgRenderTime: number;
  /** 最大渲染时间 (ms) */
  maxRenderTime: number;
  /** 最小渲染时间 (ms) */
  minRenderTime: number;
  /** 总渲染时间 (ms) */
  totalRenderTime: number;
  /** 最后渲染时间戳 */
  lastRenderAt: number;
}

/**
 * API 调用指标
 */
export interface ApiMetrics {
  /** API 端点 */
  endpoint: string;
  /** 调用次数 */
  callCount: number;
  /** 成功次数 */
  successCount: number;
  /** 失败次数 */
  failureCount: number;
  /** 平均响应时间 (ms) */
  avgResponseTime: number;
  /** 最大响应时间 (ms) */
  maxResponseTime: number;
  /** 最小响应时间 (ms) */
  minResponseTime: number;
  /** 错误率 */
  errorRate: number;
}

/**
 * 用户交互指标
 */
export interface InteractionMetrics {
  /** 点击次数 */
  clickCount: number;
  /** 按键次数 */
  keyPressCount: number;
  /** 滚动次数 */
  scrollCount: number;
  /** 平均交互延迟 (ms) */
  avgInteractionDelay: number;
  /** 会话持续时间 (s) */
  sessionDuration: number;
  /** 活跃时间 (s) */
  activeTime: number;
}

/**
 * 性能报告
 */
export interface PerformanceReport {
  /** 收集时间 */
  collectedAt: string;
  /** 会话 ID */
  sessionId: string;
  /** 核心 Web 指标 */
  coreWebVitals: PerformanceMetrics;
  /** 组件性能 */
  components: Record<string, ComponentMetrics>;
  /** API 性能 */
  apis: Record<string, ApiMetrics>;
  /** 用户交互 */
  interactions: InteractionMetrics;
  /** 浏览器信息 */
  browser: {
    userAgent: string;
    language: string;
    viewport: { width: number; height: number };
    devicePixelRatio: number;
    connection?: {
      effectiveType: string;
      downlink: number;
      rtt: number;
    };
  };
}

/**
 * 性能事件类型
 */
export type PerformanceEventType =
  | 'metric'        // 指标更新
  | 'slowRender'    // 慢渲染警告
  | 'slowApi'       // 慢 API 警告
  | 'memoryWarning' // 内存警告
  | 'report';       // 报告生成

/**
 * 性能事件回调
 */
export type PerformanceEventCallback = (event: {
  type: PerformanceEventType;
  data?: unknown;
}) => void;

// ==================== 常量定义 ====================

const SLOW_RENDER_THRESHOLD_MS = 16; // 60fps = 16.67ms per frame
const SLOW_API_THRESHOLD_MS = 3000;
const MEMORY_WARNING_THRESHOLD = 0.85;
const METRICS_STORAGE_KEY = 'tiandao_performance_metrics';
const SESSION_ID_KEY = 'tiandao_perf_session_id';

// ==================== 性能服务类 ====================

/**
 * 性能监测服务
 *
 * @description
 * 提供以下功能：
 * 1. 核心 Web 指标 (Core Web Vitals) 收集
 * 2. 组件渲染性能追踪
 * 3. API 调用性能追踪
 * 4. 用户交互指标收集
 * 5. 内存使用监控
 * 6. 性能报告生成
 *
 * @example
 * // 初始化
 * performanceService.init();
 *
 * // 追踪组件渲染
 * const stopTracking = performanceService.trackComponentRender('MyComponent');
 * // ... 组件渲染逻辑
 * stopTracking();
 *
 * // 追踪 API 调用
 * const tracker = performanceService.trackApiCall('/api/novels');
 * const response = await fetch('/api/novels');
 * tracker.end(response.ok);
 *
 * // 获取报告
 * const report = performanceService.generateReport();
 */
class PerformanceService {
  private coreMetrics: PerformanceMetrics = {};
  private componentMetrics: Map<string, ComponentMetrics> = new Map();
  private apiMetrics: Map<string, ApiMetrics> = new Map();
  private interactions: InteractionMetrics = {
    clickCount: 0,
    keyPressCount: 0,
    scrollCount: 0,
    avgInteractionDelay: 0,
    sessionDuration: 0,
    activeTime: 0
  };
  private sessionId: string = '';
  private sessionStartTime: number = 0;
  private lastActivityTime: number = 0;
  private activeTimeAccumulator: number = 0;
  private interactionDelays: number[] = [];
  private eventListeners: Map<PerformanceEventType, Set<PerformanceEventCallback>> = new Map();
  private initialized: boolean = false;
  private memoryCheckInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * 初始化性能监测服务
   */
  init(): void {
    if (this.initialized) return;

    this.sessionId = this.getOrCreateSessionId();
    this.sessionStartTime = Date.now();
    this.lastActivityTime = this.sessionStartTime;

    this.setupCoreWebVitals();
    this.setupInteractionTracking();
    this.setupMemoryMonitoring();

    this.initialized = true;
    console.log('[PerformanceService] 初始化完成');
  }

  /**
   * 获取或创建会话 ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `perf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * 设置核心 Web 指标收集
   */
  private setupCoreWebVitals(): void {
    // 使用 PerformanceObserver 收集指标
    if (typeof PerformanceObserver === 'undefined') return;

    // FCP (First Contentful Paint)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          if (entry.name === 'first-contentful-paint') {
            this.coreMetrics.fcp = entry.startTime;
            this.emit('metric', { type: 'fcp', value: entry.startTime });
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // Observer 不支持
    }

    // LCP (Largest Contentful Paint)
    try {
      const lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.coreMetrics.lcp = lastEntry.startTime;
          this.emit('metric', { type: 'lcp', value: lastEntry.startTime });
        }
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // Observer 不支持
    }

    // FID (First Input Delay)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        for (const entry of entries) {
          const processingStart = (entry as PerformanceEventTiming).processingStart;
          const startTime = entry.startTime;
          if (processingStart) {
            this.coreMetrics.fid = processingStart - startTime;
            this.emit('metric', { type: 'fid', value: this.coreMetrics.fid });
          }
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (e) {
      // Observer 不支持
    }

    // CLS (Cumulative Layout Shift)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const layoutShiftEntry = entry as LayoutShift;
          if (!layoutShiftEntry.hadRecentInput) {
            clsValue += layoutShiftEntry.value;
            this.coreMetrics.cls = clsValue;
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // Observer 不支持
    }

    // Navigation timing
    if (performance.timing) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const timing = performance.timing;
          this.coreMetrics.ttfb = timing.responseStart - timing.navigationStart;
          this.coreMetrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
          this.coreMetrics.pageLoad = timing.loadEventEnd - timing.navigationStart;
          this.emit('metric', { type: 'navigation', value: this.coreMetrics });
        }, 0);
      });
    }
  }

  /**
   * 设置用户交互追踪
   */
  private setupInteractionTracking(): void {
    // 点击追踪
    document.addEventListener('click', () => {
      this.interactions.clickCount++;
      this.recordActivity();
    }, { passive: true });

    // 按键追踪
    document.addEventListener('keydown', () => {
      this.interactions.keyPressCount++;
      this.recordActivity();
    }, { passive: true });

    // 滚动追踪（节流）
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    document.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        this.interactions.scrollCount++;
        this.recordActivity();
        scrollTimeout = null;
      }, 100);
    }, { passive: true });
  }

  /**
   * 记录用户活动
   */
  private recordActivity(): void {
    const now = Date.now();
    const timeSinceLastActivity = now - this.lastActivityTime;

    // 如果间隔超过 30 秒，认为用户不活跃
    if (timeSinceLastActivity < 30000) {
      this.activeTimeAccumulator += timeSinceLastActivity;
    }

    this.lastActivityTime = now;
    this.interactions.sessionDuration = (now - this.sessionStartTime) / 1000;
    this.interactions.activeTime = this.activeTimeAccumulator / 1000;
  }

  /**
   * 设置内存监控
   */
  private setupMemoryMonitoring(): void {
    if (!(performance as any).memory) return;

    this.memoryCheckInterval = setInterval(() => {
      const memory = (performance as any).memory;
      this.coreMetrics.jsHeapSize = memory.usedJSHeapSize;
      this.coreMetrics.jsHeapSizeLimit = memory.jsHeapSizeLimit;
      this.coreMetrics.memoryUsagePercent = memory.usedJSHeapSize / memory.jsHeapSizeLimit;

      if (this.coreMetrics.memoryUsagePercent > MEMORY_WARNING_THRESHOLD) {
        this.emit('memoryWarning', {
          usage: this.coreMetrics.memoryUsagePercent,
          usedMB: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          limitMB: Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        });
      }
    }, 10000);
  }

  /**
   * 追踪组件渲染性能
   *
   * @param componentName - 组件名称
   * @returns 停止追踪函数
   *
   * @example
   * const stopTracking = performanceService.trackComponentRender('NovelList');
   * // ... 渲染逻辑
   * stopTracking();
   */
  trackComponentRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const renderTime = performance.now() - startTime;

      let metrics = this.componentMetrics.get(componentName);
      if (!metrics) {
        metrics = {
          name: componentName,
          renderCount: 0,
          avgRenderTime: 0,
          maxRenderTime: 0,
          minRenderTime: Infinity,
          totalRenderTime: 0,
          lastRenderAt: 0
        };
        this.componentMetrics.set(componentName, metrics);
      }

      metrics.renderCount++;
      metrics.totalRenderTime += renderTime;
      metrics.avgRenderTime = metrics.totalRenderTime / metrics.renderCount;
      metrics.maxRenderTime = Math.max(metrics.maxRenderTime, renderTime);
      metrics.minRenderTime = Math.min(metrics.minRenderTime, renderTime);
      metrics.lastRenderAt = Date.now();

      if (renderTime > SLOW_RENDER_THRESHOLD_MS) {
        this.emit('slowRender', { componentName, renderTime });
      }
    };
  }

  /**
   * 追踪 API 调用性能
   *
   * @param endpoint - API 端点
   * @returns 追踪对象
   *
   * @example
   * const tracker = performanceService.trackApiCall('/api/novels');
   * try {
   *   const response = await fetch('/api/novels');
   *   tracker.end(response.ok);
   * } catch {
   *   tracker.end(false);
   * }
   */
  trackApiCall(endpoint: string): { end: (success: boolean) => void } {
    const startTime = performance.now();

    return {
      end: (success: boolean) => {
        const responseTime = performance.now() - startTime;

        let metrics = this.apiMetrics.get(endpoint);
        if (!metrics) {
          metrics = {
            endpoint,
            callCount: 0,
            successCount: 0,
            failureCount: 0,
            avgResponseTime: 0,
            maxResponseTime: 0,
            minResponseTime: Infinity,
            errorRate: 0
          };
          this.apiMetrics.set(endpoint, metrics);
        }

        metrics.callCount++;
        if (success) {
          metrics.successCount++;
        } else {
          metrics.failureCount++;
        }
        metrics.errorRate = metrics.failureCount / metrics.callCount;

        const totalTime = metrics.avgResponseTime * (metrics.callCount - 1) + responseTime;
        metrics.avgResponseTime = totalTime / metrics.callCount;
        metrics.maxResponseTime = Math.max(metrics.maxResponseTime, responseTime);
        metrics.minResponseTime = Math.min(metrics.minResponseTime, responseTime);

        if (responseTime > SLOW_API_THRESHOLD_MS) {
          this.emit('slowApi', { endpoint, responseTime });
        }
      }
    };
  }

  /**
   * 记录交互延迟
   */
  recordInteractionDelay(delay: number): void {
    this.interactionDelays.push(delay);
    const sum = this.interactionDelays.reduce((a, b) => a + b, 0);
    this.interactions.avgInteractionDelay = sum / this.interactionDelays.length;
  }

  /**
   * 获取核心 Web 指标
   */
  getCoreMetrics(): PerformanceMetrics {
    return { ...this.coreMetrics };
  }

  /**
   * 获取组件性能指标
   */
  getComponentMetrics(): Record<string, ComponentMetrics> {
    const result: Record<string, ComponentMetrics> = {};
    this.componentMetrics.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }

  /**
   * 获取 API 性能指标
   */
  getApiMetrics(): Record<string, ApiMetrics> {
    const result: Record<string, ApiMetrics> = {};
    this.apiMetrics.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }

  /**
   * 获取交互指标
   */
  getInteractionMetrics(): InteractionMetrics {
    return { ...this.interactions };
  }

  /**
   * 生成性能报告
   */
  generateReport(): PerformanceReport {
    const report: PerformanceReport = {
      collectedAt: new Date().toISOString(),
      sessionId: this.sessionId,
      coreWebVitals: this.getCoreMetrics(),
      components: this.getComponentMetrics(),
      apis: this.getApiMetrics(),
      interactions: this.getInteractionMetrics(),
      browser: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        devicePixelRatio: window.devicePixelRatio
      }
    };

    // 添加网络信息（如果可用）
    const connection = (navigator as any).connection;
    if (connection) {
      report.browser.connection = {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }

    this.emit('report', report);
    return report;
  }

  /**
   * 重置所有指标
   */
  reset(): void {
    this.componentMetrics.clear();
    this.apiMetrics.clear();
    this.interactions = {
      clickCount: 0,
      keyPressCount: 0,
      scrollCount: 0,
      avgInteractionDelay: 0,
      sessionDuration: 0,
      activeTime: 0
    };
    this.interactionDelays = [];
    this.sessionStartTime = Date.now();
    this.lastActivityTime = this.sessionStartTime;
    this.activeTimeAccumulator = 0;
  }

  /**
   * 注册事件监听器
   */
  on(event: PerformanceEventType, callback: PerformanceEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);

    return () => {
      this.eventListeners.get(event)?.delete(callback);
    };
  }

  /**
   * 触发事件
   */
  private emit(type: PerformanceEventType, data?: unknown): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, data });
        } catch (error) {
          console.error('[PerformanceService] 事件回调错误:', error);
        }
      });
    }
  }

  /**
   * 销毁服务
   */
  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    this.eventListeners.clear();
    this.initialized = false;
  }
}

// 扩展类型声明
interface PerformanceEventTiming extends PerformanceEntry {
  processingStart: number;
}

interface LayoutShift extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

// 导出单例
export const performanceService = new PerformanceService();

// 导出便捷函数
export const initPerformance = () => performanceService.init();
export const trackRender = (name: string) => performanceService.trackComponentRender(name);
export const trackApi = (endpoint: string) => performanceService.trackApiCall(endpoint);
export const getPerformanceReport = () => performanceService.generateReport();
export const onPerformanceEvent = (event: PerformanceEventType, callback: PerformanceEventCallback) =>
  performanceService.on(event, callback);

export default performanceService;
