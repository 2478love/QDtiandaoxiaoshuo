/**
 * 统一错误处理模块
 *
 * 功能：
 * 1. 结构化错误码
 * 2. 错误分类
 * 3. 重试机制
 * 4. 错误上报
 */

// ==================== 错误码定义 ====================

/**
 * 错误码枚举
 */
export enum ErrorCode {
  // 网络错误 (1xxx)
  NETWORK_ERROR = 'E1000',
  NETWORK_TIMEOUT = 'E1001',
  NETWORK_OFFLINE = 'E1002',
  NETWORK_DNS_FAILED = 'E1003',

  // API 错误 (2xxx)
  API_ERROR = 'E2000',
  API_RATE_LIMITED = 'E2001',
  API_INVALID_KEY = 'E2002',
  API_QUOTA_EXCEEDED = 'E2003',
  API_MODEL_NOT_FOUND = 'E2004',
  API_CONTENT_FILTERED = 'E2005',
  API_SERVER_ERROR = 'E2006',

  // 存储错误 (3xxx)
  STORAGE_ERROR = 'E3000',
  STORAGE_QUOTA_EXCEEDED = 'E3001',
  STORAGE_CORRUPTED = 'E3002',
  STORAGE_NOT_AVAILABLE = 'E3003',

  // 认证错误 (4xxx)
  AUTH_ERROR = 'E4000',
  AUTH_INVALID_CREDENTIALS = 'E4001',
  AUTH_SESSION_EXPIRED = 'E4002',
  AUTH_PERMISSION_DENIED = 'E4003',

  // 验证错误 (5xxx)
  VALIDATION_ERROR = 'E5000',
  VALIDATION_REQUIRED = 'E5001',
  VALIDATION_FORMAT = 'E5002',
  VALIDATION_LENGTH = 'E5003',

  // 业务错误 (6xxx)
  BUSINESS_ERROR = 'E6000',
  BUSINESS_NOVEL_NOT_FOUND = 'E6001',
  BUSINESS_CHAPTER_NOT_FOUND = 'E6002',

  // 未知错误
  UNKNOWN = 'E9999',
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  /** 信息 - 可忽略 */
  INFO = 'info',
  /** 警告 - 需要注意 */
  WARNING = 'warning',
  /** 错误 - 需要处理 */
  ERROR = 'error',
  /** 致命 - 需要立即处理 */
  CRITICAL = 'critical',
}

// ==================== 自定义错误类 ====================

/**
 * 应用错误基类
 */
export interface AppErrorOptions {
  severity?: ErrorSeverity;
  context?: Record<string, unknown>;
  retryable?: boolean;
  cause?: Error;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: string;
  public readonly context?: Record<string, unknown>;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    options: AppErrorOptions = {}
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.severity = options.severity ?? ErrorSeverity.ERROR;
    this.timestamp = new Date().toISOString();
    this.context = options.context;
    this.retryable = options.retryable ?? false;

    if (options.cause) {
      this.cause = options.cause;
    }

    // 保持正确的原型链
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /**
   * 转换为用户友好的消息
   */
  toUserMessage(): string {
    return ERROR_MESSAGES[this.code] ?? this.message;
  }

  /**
   * 转换为 JSON
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      timestamp: this.timestamp,
      context: this.context,
      retryable: this.retryable,
      stack: this.stack,
    };
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.NETWORK_ERROR, options?: AppErrorOptions) {
    super(message, code, { retryable: true, ...options });
    this.name = 'NetworkError';
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * API 错误
 */
export class ApiError extends AppError {
  public readonly statusCode?: number;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.API_ERROR,
    statusCode?: number,
    options?: AppErrorOptions
  ) {
    const retryable = statusCode ? statusCode >= 500 || statusCode === 429 : false;
    super(message, code, { retryable, ...options });
    this.name = 'ApiError';
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 验证错误
 */
export class ValidationError extends AppError {
  public readonly field?: string;

  constructor(message: string, field?: string, options?: AppErrorOptions) {
    super(message, ErrorCode.VALIDATION_ERROR, { severity: ErrorSeverity.WARNING, ...options });
    this.name = 'ValidationError';
    this.field = field;
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// ==================== 错误消息映射 ====================

/**
 * 错误码对应的用户友好消息
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCode.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorCode.NETWORK_TIMEOUT]: '请求超时，请稍后重试',
  [ErrorCode.NETWORK_OFFLINE]: '当前处于离线状态',
  [ErrorCode.NETWORK_DNS_FAILED]: 'DNS 解析失败，请检查网络设置',

  [ErrorCode.API_ERROR]: 'API 请求失败',
  [ErrorCode.API_RATE_LIMITED]: '请求过于频繁，请稍后重试',
  [ErrorCode.API_INVALID_KEY]: 'API 密钥无效，请检查设置',
  [ErrorCode.API_QUOTA_EXCEEDED]: 'API 配额已用尽',
  [ErrorCode.API_MODEL_NOT_FOUND]: '指定的模型不存在',
  [ErrorCode.API_CONTENT_FILTERED]: '内容被安全过滤器拦截',
  [ErrorCode.API_SERVER_ERROR]: 'API 服务器错误，请稍后重试',

  [ErrorCode.STORAGE_ERROR]: '存储操作失败',
  [ErrorCode.STORAGE_QUOTA_EXCEEDED]: '存储空间不足',
  [ErrorCode.STORAGE_CORRUPTED]: '存储数据损坏',
  [ErrorCode.STORAGE_NOT_AVAILABLE]: '存储服务不可用',

  [ErrorCode.AUTH_ERROR]: '认证失败',
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: '用户名或密码错误',
  [ErrorCode.AUTH_SESSION_EXPIRED]: '登录已过期，请重新登录',
  [ErrorCode.AUTH_PERMISSION_DENIED]: '权限不足',

  [ErrorCode.VALIDATION_ERROR]: '数据验证失败',
  [ErrorCode.VALIDATION_REQUIRED]: '必填字段不能为空',
  [ErrorCode.VALIDATION_FORMAT]: '格式不正确',
  [ErrorCode.VALIDATION_LENGTH]: '长度不符合要求',

  [ErrorCode.BUSINESS_ERROR]: '操作失败',
  [ErrorCode.BUSINESS_NOVEL_NOT_FOUND]: '小说不存在',
  [ErrorCode.BUSINESS_CHAPTER_NOT_FOUND]: '章节不存在',

  [ErrorCode.UNKNOWN]: '发生未知错误',
};

// ==================== 重试机制 ====================

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 最大重试次数 */
  maxRetries: number;
  /** 初始延迟（毫秒） */
  initialDelay: number;
  /** 最大延迟（毫秒） */
  maxDelay: number;
  /** 退避倍数 */
  backoffMultiplier: number;
  /** 是否添加抖动 */
  jitter: boolean;
  /** 重试条件判断 */
  retryCondition?: (error: Error) => boolean;
  /** 重试前回调 */
  onRetry?: (attempt: number, error: Error, delay: number) => void;
}

/**
 * 默认重试配置
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error) => {
    if (error instanceof AppError) {
      return error.retryable;
    }
    // 默认网络错误可重试
    return error.name === 'TypeError' || error.message.includes('network');
  },
};

/**
 * 计算重试延迟
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  let delay = config.initialDelay * Math.pow(config.backoffMultiplier, attempt);
  delay = Math.min(delay, config.maxDelay);

  if (config.jitter) {
    // 添加 ±25% 的抖动
    const jitterRange = delay * 0.25;
    delay += Math.random() * jitterRange * 2 - jitterRange;
  }

  return Math.round(delay);
}

/**
 * 延迟执行
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 带重试的异步函数执行器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // 检查是否应该重试
      if (
        attempt < finalConfig.maxRetries &&
        finalConfig.retryCondition?.(lastError)
      ) {
        const delay = calculateDelay(attempt, finalConfig);

        // 触发重试回调
        finalConfig.onRetry?.(attempt + 1, lastError, delay);

        await sleep(delay);
        continue;
      }

      throw lastError;
    }
  }

  throw lastError ?? new Error('Retry failed');
}

// ==================== 错误处理工具 ====================

/**
 * 从原生错误创建 AppError
 */
export function fromError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // 检查网络错误
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return new NetworkError(error.message, ErrorCode.NETWORK_ERROR, { cause: error });
    }

    // 检查超时
    if (error.name === 'AbortError') {
      return new NetworkError('请求超时', ErrorCode.NETWORK_TIMEOUT, { cause: error });
    }

    return new AppError(error.message, ErrorCode.UNKNOWN, { cause: error });
  }

  return new AppError(String(error));
}

/**
 * 安全执行异步操作
 */
export async function tryCatch<T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<[T, null] | [T | undefined, AppError]> {
  try {
    const result = await fn();
    return [result, null];
  } catch (error) {
    const appError = fromError(error);
    return [fallback, appError];
  }
}

/**
 * 错误边界辅助
 */
export function isRecoverable(error: AppError): boolean {
  return error.severity !== ErrorSeverity.CRITICAL && error.retryable;
}

export default {
  ErrorCode,
  ErrorSeverity,
  AppError,
  NetworkError,
  ApiError,
  ValidationError,
  withRetry,
  fromError,
  tryCatch,
  isRecoverable,
};
