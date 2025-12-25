/**
 * @fileoverview 性能监测 Hook
 * @module hooks/usePerformance
 * @description 提供性能监测功能的 React Hook
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  performanceService,
  PerformanceMetrics,
  PerformanceReport,
  PerformanceEventType
} from '../services/performance/PerformanceService';

/**
 * 性能监测 Hook 返回值
 */
export interface UsePerformanceReturn {
  /** 核心 Web 指标 */
  metrics: PerformanceMetrics;
  /** 生成性能报告 */
  generateReport: () => PerformanceReport;
  /** 重置指标 */
  reset: () => void;
}

/**
 * 性能监测 Hook
 *
 * @description
 * 提供性能指标访问和监控功能
 *
 * @returns {UsePerformanceReturn} 性能指标和操作方法
 *
 * @example
 * function PerformanceMonitor() {
 *   const { metrics, generateReport } = usePerformance();
 *
 *   return (
 *     <div>
 *       <p>FCP: {metrics.fcp?.toFixed(2)}ms</p>
 *       <p>LCP: {metrics.lcp?.toFixed(2)}ms</p>
 *       <button onClick={() => console.log(generateReport())}>
 *         生成报告
 *       </button>
 *     </div>
 *   );
 * }
 */
export function usePerformance(): UsePerformanceReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});

  useEffect(() => {
    // 初始化服务
    performanceService.init();

    // 订阅指标更新
    const unsubscribe = performanceService.on('metric', () => {
      setMetrics(performanceService.getCoreMetrics());
    });

    // 获取初始指标
    setMetrics(performanceService.getCoreMetrics());

    return unsubscribe;
  }, []);

  const generateReport = useCallback(() => {
    return performanceService.generateReport();
  }, []);

  const reset = useCallback(() => {
    performanceService.reset();
    setMetrics({});
  }, []);

  return {
    metrics,
    generateReport,
    reset
  };
}

/**
 * 组件渲染追踪 Hook
 *
 * @param componentName - 组件名称
 *
 * @description
 * 自动追踪组件的渲染性能
 *
 * @example
 * function MyComponent() {
 *   useRenderTracking('MyComponent');
 *   return <div>Content</div>;
 * }
 */
export function useRenderTracking(componentName: string): void {
  const renderStartRef = useRef<number>(0);

  // 在渲染开始时记录时间
  renderStartRef.current = performance.now();

  useEffect(() => {
    // 初始化服务
    performanceService.init();
  }, []);

  useEffect(() => {
    // 在 effect 中记录渲染完成
    const renderTime = performance.now() - renderStartRef.current;
    const stopTracking = performanceService.trackComponentRender(componentName);

    // 模拟追踪结束
    return () => {
      stopTracking();
    };
  });
}

/**
 * 性能事件监听 Hook
 *
 * @param event - 事件类型
 * @param callback - 回调函数
 *
 * @example
 * usePerformanceEvent('slowRender', (event) => {
 *   console.warn('慢渲染:', event.data);
 * });
 */
export function usePerformanceEvent(
  event: PerformanceEventType,
  callback: (event: { type: PerformanceEventType; data?: unknown }) => void
): void {
  useEffect(() => {
    performanceService.init();
    const unsubscribe = performanceService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

/**
 * API 调用追踪 Hook
 *
 * @returns 追踪函数
 *
 * @example
 * function DataFetcher() {
 *   const trackApi = useApiTracking();
 *
 *   const fetchData = async () => {
 *     const tracker = trackApi('/api/data');
 *     try {
 *       const response = await fetch('/api/data');
 *       tracker.end(response.ok);
 *     } catch {
 *       tracker.end(false);
 *     }
 *   };
 *
 *   return <button onClick={fetchData}>加载数据</button>;
 * }
 */
export function useApiTracking(): (endpoint: string) => { end: (success: boolean) => void } {
  useEffect(() => {
    performanceService.init();
  }, []);

  return useCallback((endpoint: string) => {
    return performanceService.trackApiCall(endpoint);
  }, []);
}

export default usePerformance;
