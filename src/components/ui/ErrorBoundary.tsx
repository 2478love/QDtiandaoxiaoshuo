/**
 * 错误边界组件
 *
 * 捕获子组件的 JavaScript 错误，防止整个应用崩溃
 * 显示降级 UI 并提供错误报告功能
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

/**
 * 错误信息接口
 */
interface ErrorDetails {
  error: Error;
  errorInfo: ErrorInfo;
  timestamp: string;
  componentStack: string;
}

/**
 * 错误边界 Props
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  /** 自定义降级 UI */
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  /** 错误发生时的回调 */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /** 错误边界名称（用于日志） */
  name?: string;
  /** 是否显示详细错误信息（开发模式） */
  showDetails?: boolean;
}

/**
 * 错误边界 State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 错误边界组件
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const { onError, name } = this.props;

    // 记录错误详情
    const errorDetails: ErrorDetails = {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      componentStack: errorInfo.componentStack || '',
    };

    // 输出到控制台
    console.error(`[ErrorBoundary${name ? `:${name}` : ''}] 捕获到错误:`, errorDetails);

    // 存储到 localStorage 用于错误报告
    try {
      const errorLog = JSON.parse(localStorage.getItem('tiandao_error_log') || '[]');
      errorLog.push({
        ...errorDetails,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      });
      // 只保留最近 10 条错误
      if (errorLog.length > 10) {
        errorLog.shift();
      }
      localStorage.setItem('tiandao_error_log', JSON.stringify(errorLog));
    } catch (e) {
      console.error('无法保存错误日志:', e);
    }

    // 更新状态
    this.setState({ errorInfo });

    // 调用自定义错误处理
    onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleReport = (): void => {
    const { error, errorInfo } = this.state;
    if (!error) return;

    // 生成错误报告
    const report = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // 复制到剪贴板
    const reportText = JSON.stringify(report, null, 2);
    navigator.clipboard.writeText(reportText).then(() => {
      alert('错误报告已复制到剪贴板');
    }).catch(() => {
      // 降级：显示文本框让用户手动复制
      prompt('请复制以下错误报告:', reportText);
    });
  };

  render(): ReactNode {
    const { children, fallback, showDetails } = this.props;
    const { hasError, error, errorInfo } = this.state;

    if (hasError && error) {
      // 如果提供了自定义 fallback
      if (fallback) {
        if (typeof fallback === 'function') {
          return fallback(error, this.handleReset);
        }
        return fallback;
      }

      // 默认错误 UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* 错误图标和标题 */}
            <div className="bg-rose-50 dark:bg-rose-900/20 px-6 py-4 border-b border-rose-100 dark:border-rose-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-800 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-rose-600 dark:text-rose-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-800 dark:text-rose-200">
                    出错了
                  </h3>
                  <p className="text-sm text-rose-600 dark:text-rose-400">
                    此区域发生了意外错误
                  </p>
                </div>
              </div>
            </div>

            {/* 错误信息 */}
            <div className="px-6 py-4">
              <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
                {error.message || '未知错误'}
              </p>

              {/* 详细错误信息（开发模式） */}
              {showDetails && (
                <details className="mb-4">
                  <summary className="text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200">
                    查看详细信息
                  </summary>
                  <pre className="mt-2 p-3 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs text-slate-600 dark:text-slate-400 overflow-auto max-h-40">
                    {error.stack}
                    {errorInfo?.componentStack && (
                      <>
                        {'\n\n组件堆栈:\n'}
                        {errorInfo.componentStack}
                      </>
                    )}
                  </pre>
                </details>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
                >
                  重试
                </button>
                <button
                  onClick={this.handleReload}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  刷新页面
                </button>
                <button
                  onClick={this.handleReport}
                  className="px-4 py-2 text-slate-500 dark:text-slate-400 text-sm hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title="复制错误报告"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * 功能模块专用错误边界
 * 用于包裹各个功能模块，提供更友好的错误提示
 */
interface FeatureErrorBoundaryProps {
  children: ReactNode;
  featureName: string;
  onRetry?: () => void;
}

export const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({
  children,
  featureName,
  onRetry,
}) => {
  return (
    <ErrorBoundary
      name={featureName}
      showDetails={process.env.NODE_ENV === 'development'}
      fallback={(error, reset) => (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-16 h-16 mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-2">
            {featureName} 加载失败
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 text-center max-w-sm">
            {error.message || '发生了意外错误，请尝试重新加载'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => {
                onRetry?.();
                reset();
              }}
              className="px-4 py-2 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 transition-colors"
            >
              重试
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

/**
 * 高阶组件：为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, 'children'> = {}
): React.FC<P> {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const ComponentWithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options} name={displayName}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;

  return ComponentWithErrorBoundary;
}

export default ErrorBoundary;
