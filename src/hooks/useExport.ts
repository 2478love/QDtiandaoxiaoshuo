/**
 * @fileoverview 文档导出 Hook
 * @module hooks/useExport
 * @description 提供文档导出功能的 React Hook
 * @version 1.0.0
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  exportService,
  ExportFormat,
  ExportOptions,
  ExportProgress,
  ExportResult,
  NovelContent,
  ExportEventType
} from '../services/export/ExportService';

/**
 * 导出 Hook 返回值
 */
export interface UseExportReturn {
  /** 是否正在导出 */
  isExporting: boolean;
  /** 当前进度 */
  progress: ExportProgress | null;
  /** 最近的导出结果 */
  result: ExportResult | null;
  /** 错误信息 */
  error: string | null;
  /** 执行导出 */
  exportNovel: (novel: NovelContent, options: ExportOptions) => Promise<ExportResult>;
  /** 下载导出结果 */
  download: (result?: ExportResult) => void;
  /** 取消导出 */
  cancel: () => void;
  /** 重置状态 */
  reset: () => void;
  /** 获取支持的格式 */
  getSupportedFormats: () => Array<{
    format: ExportFormat;
    name: string;
    description: string;
    extension: string;
  }>;
}

/**
 * 文档导出 Hook
 *
 * @description
 * 提供完整的文档导出功能
 *
 * @returns {UseExportReturn} 导出功能方法
 *
 * @example
 * function ExportDialog({ novel }: { novel: NovelContent }) {
 *   const {
 *     isExporting,
 *     progress,
 *     result,
 *     error,
 *     exportNovel,
 *     download,
 *     getSupportedFormats
 *   } = useExport();
 *
 *   const [format, setFormat] = useState<ExportFormat>('pdf');
 *
 *   const handleExport = async () => {
 *     const result = await exportNovel(novel, { format });
 *     if (result.success) {
 *       download(result);
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <select value={format} onChange={e => setFormat(e.target.value as ExportFormat)}>
 *         {getSupportedFormats().map(f => (
 *           <option key={f.format} value={f.format}>{f.name}</option>
 *         ))}
 *       </select>
 *
 *       <button onClick={handleExport} disabled={isExporting}>
 *         {isExporting ? '导出中...' : '导出'}
 *       </button>
 *
 *       {progress && (
 *         <div>
 *           <progress value={progress.percent} max={100} />
 *           <span>{progress.stageDescription}</span>
 *         </div>
 *       )}
 *
 *       {error && <div className="error">{error}</div>}
 *     </div>
 *   );
 * }
 */
export function useExport(): UseExportReturn {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  // 订阅进度事件
  useEffect(() => {
    const unsubscribeProgress = exportService.on('progress', (event) => {
      if (!cancelledRef.current) {
        setProgress(event.data as ExportProgress);
      }
    });

    const unsubscribeComplete = exportService.on('complete', (event) => {
      if (!cancelledRef.current) {
        setResult(event.data as ExportResult);
        setIsExporting(false);
      }
    });

    const unsubscribeError = exportService.on('error', (event) => {
      if (!cancelledRef.current) {
        setError((event.data as Error).message);
        setIsExporting(false);
      }
    });

    return () => {
      unsubscribeProgress();
      unsubscribeComplete();
      unsubscribeError();
    };
  }, []);

  const exportNovel = useCallback(async (
    novel: NovelContent,
    options: ExportOptions
  ): Promise<ExportResult> => {
    cancelledRef.current = false;
    setIsExporting(true);
    setProgress(null);
    setError(null);
    setResult(null);

    try {
      const exportResult = await exportService.export(novel, options);
      if (!cancelledRef.current) {
        setResult(exportResult);
        if (!exportResult.success && exportResult.error) {
          setError(exportResult.error);
        }
      }
      return exportResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '导出失败';
      if (!cancelledRef.current) {
        setError(errorMessage);
      }
      return {
        success: false,
        filename: '',
        mimeType: '',
        size: 0,
        error: errorMessage
      };
    } finally {
      if (!cancelledRef.current) {
        setIsExporting(false);
      }
    }
  }, []);

  const download = useCallback((exportResult?: ExportResult) => {
    const resultToDownload = exportResult || result;
    if (resultToDownload) {
      exportService.download(resultToDownload);
    }
  }, [result]);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsExporting(false);
    setProgress(null);
  }, []);

  const reset = useCallback(() => {
    cancelledRef.current = false;
    setIsExporting(false);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  const getSupportedFormats = useCallback(() => {
    return exportService.getSupportedFormats();
  }, []);

  return {
    isExporting,
    progress,
    result,
    error,
    exportNovel,
    download,
    cancel,
    reset,
    getSupportedFormats
  };
}

/**
 * 快速导出 Hook
 *
 * @description
 * 简化的导出功能，自动下载
 *
 * @returns 快速导出函数
 *
 * @example
 * function ExportButton({ novel }: { novel: NovelContent }) {
 *   const quickExport = useQuickExport();
 *
 *   return (
 *     <>
 *       <button onClick={() => quickExport(novel, 'pdf')}>导出 PDF</button>
 *       <button onClick={() => quickExport(novel, 'epub')}>导出 EPUB</button>
 *       <button onClick={() => quickExport(novel, 'txt')}>导出 TXT</button>
 *     </>
 *   );
 * }
 */
export function useQuickExport(): (
  novel: NovelContent,
  format: ExportFormat,
  options?: Partial<ExportOptions>
) => Promise<boolean> {
  return useCallback(async (
    novel: NovelContent,
    format: ExportFormat,
    options?: Partial<ExportOptions>
  ): Promise<boolean> => {
    try {
      const result = await exportService.export(novel, {
        format,
        ...options
      });

      if (result.success) {
        exportService.download(result);
        return true;
      }

      console.error('导出失败:', result.error);
      return false;
    } catch (error) {
      console.error('导出错误:', error);
      return false;
    }
  }, []);
}

/**
 * 导出事件监听 Hook
 *
 * @param event - 事件类型
 * @param callback - 回调函数
 *
 * @example
 * useExportEvent('complete', (event) => {
 *   const result = event.data as ExportResult;
 *   if (result.success) {
 *     showToast('导出成功！');
 *   }
 * });
 */
export function useExportEvent(
  event: ExportEventType,
  callback: (event: { type: ExportEventType; data: unknown }) => void
): void {
  useEffect(() => {
    const unsubscribe = exportService.on(event, callback);
    return unsubscribe;
  }, [event, callback]);
}

/**
 * 批量导出 Hook
 *
 * @description
 * 支持同时导出多种格式
 *
 * @returns 批量导出方法
 *
 * @example
 * function BatchExport({ novel }: { novel: NovelContent }) {
 *   const { exportMultiple, results, isExporting } = useBatchExport();
 *
 *   const handleBatchExport = () => {
 *     exportMultiple(novel, ['pdf', 'epub', 'txt']);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleBatchExport} disabled={isExporting}>
 *         批量导出
 *       </button>
 *       {results.map((r, i) => (
 *         <div key={i}>{r.filename}: {r.success ? '成功' : '失败'}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */
export function useBatchExport(): {
  exportMultiple: (
    novel: NovelContent,
    formats: ExportFormat[],
    options?: Partial<ExportOptions>
  ) => Promise<ExportResult[]>;
  results: ExportResult[];
  isExporting: boolean;
  progress: number;
} {
  const [results, setResults] = useState<ExportResult[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportMultiple = useCallback(async (
    novel: NovelContent,
    formats: ExportFormat[],
    options?: Partial<ExportOptions>
  ): Promise<ExportResult[]> => {
    setIsExporting(true);
    setResults([]);
    setProgress(0);

    const allResults: ExportResult[] = [];

    for (let i = 0; i < formats.length; i++) {
      const format = formats[i];
      setProgress(Math.round((i / formats.length) * 100));

      try {
        const result = await exportService.export(novel, {
          format,
          ...options
        });
        allResults.push(result);
        setResults([...allResults]);
      } catch (error) {
        allResults.push({
          success: false,
          filename: `${novel.title}.${format}`,
          mimeType: '',
          size: 0,
          error: error instanceof Error ? error.message : '导出失败'
        });
        setResults([...allResults]);
      }
    }

    setProgress(100);
    setIsExporting(false);
    return allResults;
  }, []);

  return {
    exportMultiple,
    results,
    isExporting,
    progress
  };
}

export default useExport;
