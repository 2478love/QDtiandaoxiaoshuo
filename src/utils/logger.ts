/**
 * 统一日志系统
 *
 * 功能：
 * 1. 分级日志 (debug, info, warn, error)
 * 2. 结构化日志
 * 3. 日志持久化（可选）
 * 4. 远程上报（可选）
 * 5. 性能追踪
 */

// ==================== 类型定义 ====================

/**
 * 日志级别
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * 日志条目
 */
export interface LogEntry {
  level: LogLevel;
  levelName: string;
  message: string;
  timestamp: string;
  context?: string;
  data?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * 日志配置
 */
export interface LoggerConfig {
  /** 最低日志级别 */
  minLevel: LogLevel;
  /** 是否启用控制台输出 */
  enableConsole: boolean;
  /** 是否启用本地存储 */
  enableStorage: boolean;
  /** 本地存储最大条目数 */
  maxStoredEntries: number;
  /** 是否启用远程上报 */
  enableRemote: boolean;
  /** 远程上报端点 */
  remoteEndpoint?: string;
  /** 上下文名称 */
  context?: string;
}

/**
 * 性能标记
 */
interface PerformanceMark {
  name: string;
  startTime: number;
  context?: string;
}

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableStorage: true,
  maxStoredEntries: 500,
  enableRemote: false,
};

// ==================== 日志存储 ====================

const LOG_STORAGE_KEY = 'tiandao_logs';

/**
 * 获取存储的日志
 */
function getStoredLogs(): LogEntry[] {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * 保存日志到存储
 */
function saveLogToStorage(entry: LogEntry, maxEntries: number): void {
  try {
    const logs = getStoredLogs();
    logs.push(entry);

    // 限制条目数量
    if (logs.length > maxEntries) {
      logs.splice(0, logs.length - maxEntries);
    }

    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs));
  } catch {
    // 存储失败时忽略
  }
}

// ==================== Logger 类 ====================

class Logger {
  private config: LoggerConfig;
  private performanceMarks: Map<string, PerformanceMark> = new Map();

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 创建子 Logger
   */
  child(context: string): Logger {
    return new Logger({
      ...this.config,
      context: this.config.context ? `${this.config.context}:${context}` : context,
    });
  }

  /**
   * 更新配置
   */
  configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 通用日志方法
   */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>, error?: Error): void {
    if (level < this.config.minLevel) return;

    const levelName = LogLevel[level];
    const entry: LogEntry = {
      level,
      levelName,
      message,
      timestamp: new Date().toISOString(),
      context: this.config.context,
      data,
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // 控制台输出
    if (this.config.enableConsole) {
      this.consoleLog(entry);
    }

    // 本地存储
    if (this.config.enableStorage && level >= LogLevel.WARN) {
      saveLogToStorage(entry, this.config.maxStoredEntries);
    }

    // 远程上报
    if (this.config.enableRemote && level >= LogLevel.ERROR && this.config.remoteEndpoint) {
      this.sendToRemote(entry);
    }
  }

  /**
   * 控制台输出
   */
  private consoleLog(entry: LogEntry): void {
    const prefix = entry.context ? `[${entry.context}]` : '';
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const formattedMessage = `${timestamp} ${prefix} ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(formattedMessage, entry.data ?? '');
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, entry.data ?? '');
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, entry.data ?? '');
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, entry.data ?? '', entry.error ?? '');
        break;
    }
  }

  /**
   * 发送到远程
   */
  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      // 使用 sendBeacon 确保页面关闭时也能发送
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(entry)], { type: 'application/json' });
        navigator.sendBeacon(this.config.remoteEndpoint, blob);
      } else {
        // 降级到 fetch
        fetch(this.config.remoteEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(entry),
          keepalive: true,
        }).catch(() => {
          // 忽略错误
        });
      }
    } catch {
      // 忽略错误
    }
  }

  // ==================== 日志方法 ====================

  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, data, error);
  }

  // ==================== 性能追踪 ====================

  /**
   * 开始性能标记
   */
  startMark(name: string): void {
    this.performanceMarks.set(name, {
      name,
      startTime: performance.now(),
      context: this.config.context,
    });

    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-start`);
    }
  }

  /**
   * 结束性能标记并记录
   */
  endMark(name: string): number | null {
    const mark = this.performanceMarks.get(name);
    if (!mark) return null;

    const duration = performance.now() - mark.startTime;
    this.performanceMarks.delete(name);

    if (typeof performance.mark === 'function') {
      performance.mark(`${name}-end`);
      try {
        performance.measure(name, `${name}-start`, `${name}-end`);
      } catch {
        // 忽略
      }
    }

    this.debug(`[Performance] ${name}`, { duration: `${duration.toFixed(2)}ms` });

    return duration;
  }

  /**
   * 测量异步操作
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.startMark(name);
    try {
      return await fn();
    } finally {
      this.endMark(name);
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 获取所有存储的日志
   */
  getStoredLogs(): LogEntry[] {
    return getStoredLogs();
  }

  /**
   * 清除存储的日志
   */
  clearStoredLogs(): void {
    try {
      localStorage.removeItem(LOG_STORAGE_KEY);
    } catch {
      // 忽略
    }
  }

  /**
   * 导出日志
   */
  exportLogs(): string {
    const logs = getStoredLogs();
    return JSON.stringify(logs, null, 2);
  }
}

// ==================== 导出 ====================

/**
 * 默认 Logger 实例
 */
export const logger = new Logger();

/**
 * 创建新的 Logger 实例
 */
export function createLogger(context: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger({ ...config, context });
}

// 便捷方法
export const debug = logger.debug.bind(logger);
export const info = logger.info.bind(logger);
export const warn = logger.warn.bind(logger);
export const error = logger.error.bind(logger);

export default logger;
