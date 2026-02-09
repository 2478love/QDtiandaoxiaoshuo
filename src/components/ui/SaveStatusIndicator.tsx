import React from 'react';
import { SaveStatus } from '../../hooks/useAutoSaveWithStatus';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
  lastSaveTime: Date | null;
  error: Error | null;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
  className?: string;
}

export const SaveStatusIndicator: React.FC<SaveStatusIndicatorProps> = ({
  status,
  lastSaveTime,
  error,
  onRetry,
  retryCount = 0,
  maxRetries = 3,
  className = ''
}) => {
  // 格式化时间
  const formatTime = (date: Date | null): string => {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 10) return '刚刚';
    if (diff < 60) return `${diff}秒前`;
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // 获取状态配置
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: (
            <svg className="w-4 h-4 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ),
          text: '保存中...',
          textColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      
      case 'saved':
        return {
          icon: (
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          ),
          text: lastSaveTime ? `已保存 ${formatTime(lastSaveTime)}` : '已保存',
          textColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      
      case 'unsaved':
        return {
          icon: (
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: '有未保存的更改',
          textColor: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200'
        };
      
      case 'error':
        return {
          icon: (
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          text: '保存失败',
          textColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      
      default:
        return {
          icon: null,
          text: '',
          textColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${config.bgColor} ${config.borderColor} transition-all`}>
        {config.icon}
        <span className={`text-sm font-medium ${config.textColor}`}>
          {config.text}
        </span>
      </div>

      {/* 错误详情和重试按钮 */}
      {status === 'error' && (
        <div className="flex items-center gap-2">
          {error && (
            <div className="group relative">
              <button className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {error.message}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          )}
          
          {onRetry && retryCount < maxRetries && (
            <button
              onClick={onRetry}
              className="px-3 py-1 text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>重试</span>
            </button>
          )}

          {retryCount >= maxRetries && (
            <span className="text-xs text-red-500">
              已达到最大重试次数
            </span>
          )}
        </div>
      )}

      {/* 重试计数 */}
      {status === 'error' && retryCount > 0 && retryCount < maxRetries && (
        <span className="text-xs text-gray-500">
          ({retryCount}/{maxRetries})
        </span>
      )}
    </div>
  );
};

export default SaveStatusIndicator;
