/**
 * @fileoverview 文档导出服务
 * @module services/export/ExportService
 * @description 提供多种格式的文档导出功能，包括 PDF、EPUB、Word、TXT 等
 * @version 1.0.0
 */

// ==================== 类型定义 ====================

/**
 * 导出格式类型
 */
export type ExportFormat =
  | 'pdf'      // PDF 格式
  | 'epub'     // EPUB 电子书格式
  | 'docx'     // Word 文档格式
  | 'txt'      // 纯文本格式
  | 'html'     // HTML 格式
  | 'markdown'; // Markdown 格式

/**
 * 章节内容
 */
export interface ChapterContent {
  /** 章节 ID */
  id: string;
  /** 章节标题 */
  title: string;
  /** 章节内容 */
  content: string;
  /** 所属卷 ID */
  volumeId?: string;
  /** 排序号 */
  order: number;
}

/**
 * 卷内容
 */
export interface VolumeContent {
  /** 卷 ID */
  id: string;
  /** 卷标题 */
  title: string;
  /** 卷描述 */
  description?: string;
  /** 排序号 */
  order: number;
}

/**
 * 小说内容
 */
export interface NovelContent {
  /** 小说 ID */
  id: string;
  /** 小说标题 */
  title: string;
  /** 作者 */
  author: string;
  /** 简介 */
  description?: string;
  /** 封面图片 URL */
  coverUrl?: string;
  /** 卷列表 */
  volumes: VolumeContent[];
  /** 章节列表 */
  chapters: ChapterContent[];
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 导出选项
 */
export interface ExportOptions {
  /** 导出格式 */
  format: ExportFormat;
  /** 文件名（不含扩展名） */
  filename?: string;
  /** 是否包含封面 */
  includeCover?: boolean;
  /** 是否包含目录 */
  includeToc?: boolean;
  /** 章节分页 */
  chapterPageBreak?: boolean;
  /** 页面大小 (PDF) */
  pageSize?: 'a4' | 'a5' | 'letter' | 'legal';
  /** 页边距 (PDF, mm) */
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  /** 字体大小 */
  fontSize?: number;
  /** 字体系列 */
  fontFamily?: string;
  /** 行高 */
  lineHeight?: number;
  /** 段落间距 */
  paragraphSpacing?: number;
  /** 首行缩进 */
  textIndent?: number;
  /** EPUB 语言 */
  language?: string;
  /** EPUB 出版者 */
  publisher?: string;
  /** 水印文字 */
  watermark?: string;
  /** 导出章节 ID 列表（为空则导出全部） */
  chapterIds?: string[];
}

/**
 * 导出进度
 */
export interface ExportProgress {
  /** 当前阶段 */
  stage: 'preparing' | 'generating' | 'packaging' | 'complete' | 'error';
  /** 阶段描述 */
  stageDescription: string;
  /** 进度百分比 (0-100) */
  percent: number;
  /** 当前处理的项目 */
  currentItem?: string;
  /** 总项目数 */
  totalItems?: number;
  /** 已处理项目数 */
  processedItems?: number;
}

/**
 * 导出结果
 */
export interface ExportResult {
  /** 是否成功 */
  success: boolean;
  /** 文件名 */
  filename: string;
  /** 文件类型 */
  mimeType: string;
  /** 文件大小（字节） */
  size: number;
  /** Blob 数据 */
  blob?: Blob;
  /** 下载 URL */
  downloadUrl?: string;
  /** 错误信息 */
  error?: string;
}

/**
 * 导出事件类型
 */
export type ExportEventType =
  | 'progress'  // 进度更新
  | 'complete'  // 导出完成
  | 'error';    // 导出错误

/**
 * 导出事件回调
 */
export type ExportEventCallback = (event: {
  type: ExportEventType;
  data: ExportProgress | ExportResult | Error;
}) => void;

// ==================== 常量定义 ====================

const DEFAULT_OPTIONS: Partial<ExportOptions> = {
  includeCover: true,
  includeToc: true,
  chapterPageBreak: true,
  pageSize: 'a4',
  margins: { top: 25, right: 20, bottom: 25, left: 20 },
  fontSize: 12,
  fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif',
  lineHeight: 1.8,
  paragraphSpacing: 10,
  textIndent: 2,
  language: 'zh-CN'
};

const MIME_TYPES: Record<ExportFormat, string> = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  txt: 'text/plain',
  html: 'text/html',
  markdown: 'text/markdown'
};

const FILE_EXTENSIONS: Record<ExportFormat, string> = {
  pdf: '.pdf',
  epub: '.epub',
  docx: '.docx',
  txt: '.txt',
  html: '.html',
  markdown: '.md'
};

// ==================== 工具函数 ====================

/**
 * 转义 HTML 特殊字符
 */
function escapeHtml(text: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return text.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * 生成 UUID
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * 内容转换为段落 HTML
 */
function contentToParagraphs(content: string, options: ExportOptions): string {
  const paragraphs = content.split(/\n\s*\n/);
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p style="text-indent: ${options.textIndent || 2}em; margin-bottom: ${options.paragraphSpacing || 10}px;">${escapeHtml(p)}</p>`)
    .join('\n');
}

// ==================== 导出服务类 ====================

/**
 * 文档导出服务
 *
 * @description
 * 提供以下功能：
 * 1. 多格式导出（PDF、EPUB、Word、TXT、HTML、Markdown）
 * 2. 自定义排版选项
 * 3. 封面和目录生成
 * 4. 批量章节选择
 * 5. 导出进度跟踪
 *
 * @example
 * // 导出为 PDF
 * const result = await exportService.export(novel, {
 *   format: 'pdf',
 *   includeCover: true,
 *   includeToc: true,
 *   pageSize: 'a4'
 * });
 *
 * // 下载文件
 * if (result.success && result.blob) {
 *   const url = URL.createObjectURL(result.blob);
 *   const a = document.createElement('a');
 *   a.href = url;
 *   a.download = result.filename;
 *   a.click();
 * }
 */
class ExportService {
  private eventListeners: Map<ExportEventType, Set<ExportEventCallback>> = new Map();

  /**
   * 导出小说
   *
   * @param novel - 小说内容
   * @param options - 导出选项
   * @returns 导出结果
   */
  async export(novel: NovelContent, options: ExportOptions): Promise<ExportResult> {
    const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
    const filename = options.filename || this.sanitizeFilename(novel.title);

    try {
      this.emitProgress({
        stage: 'preparing',
        stageDescription: '准备导出...',
        percent: 0
      });

      // 过滤章节
      let chapters = novel.chapters;
      if (options.chapterIds && options.chapterIds.length > 0) {
        chapters = chapters.filter(c => options.chapterIds!.includes(c.id));
      }

      // 按卷和顺序排序
      chapters = this.sortChapters(chapters, novel.volumes);

      let blob: Blob;

      switch (options.format) {
        case 'pdf':
          blob = await this.exportPdf(novel, chapters, mergedOptions);
          break;
        case 'epub':
          blob = await this.exportEpub(novel, chapters, mergedOptions);
          break;
        case 'docx':
          blob = await this.exportDocx(novel, chapters, mergedOptions);
          break;
        case 'txt':
          blob = this.exportTxt(novel, chapters, mergedOptions);
          break;
        case 'html':
          blob = this.exportHtml(novel, chapters, mergedOptions);
          break;
        case 'markdown':
          blob = this.exportMarkdown(novel, chapters, mergedOptions);
          break;
        default:
          throw new Error(`不支持的导出格式: ${options.format}`);
      }

      const result: ExportResult = {
        success: true,
        filename: filename + FILE_EXTENSIONS[options.format],
        mimeType: MIME_TYPES[options.format],
        size: blob.size,
        blob,
        downloadUrl: URL.createObjectURL(blob)
      };

      this.emitProgress({
        stage: 'complete',
        stageDescription: '导出完成',
        percent: 100
      });

      this.emit('complete', result);
      return result;

    } catch (error) {
      const errorResult: ExportResult = {
        success: false,
        filename: filename + FILE_EXTENSIONS[options.format],
        mimeType: MIME_TYPES[options.format],
        size: 0,
        error: error instanceof Error ? error.message : '导出失败'
      };

      this.emit('error', error instanceof Error ? error : new Error('导出失败'));
      return errorResult;
    }
  }

  /**
   * 排序章节
   */
  private sortChapters(chapters: ChapterContent[], volumes: VolumeContent[]): ChapterContent[] {
    const volumeOrderMap = new Map<string, number>();
    volumes.forEach(v => volumeOrderMap.set(v.id, v.order));

    return [...chapters].sort((a, b) => {
      const aVolumeOrder = a.volumeId ? volumeOrderMap.get(a.volumeId) || 0 : 0;
      const bVolumeOrder = b.volumeId ? volumeOrderMap.get(b.volumeId) || 0 : 0;

      if (aVolumeOrder !== bVolumeOrder) {
        return aVolumeOrder - bVolumeOrder;
      }
      return a.order - b.order;
    });
  }

  /**
   * 清理文件名
   */
  private sanitizeFilename(name: string): string {
    return name.replace(/[<>:"/\\|?*]/g, '_').trim() || 'export';
  }

  /**
   * 导出为 PDF（生成可打印的 HTML，使用浏览器打印功能）
   */
  private async exportPdf(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): Promise<Blob> {
    this.emitProgress({
      stage: 'generating',
      stageDescription: '生成 PDF 内容...',
      percent: 20
    });

    // 生成打印友好的 HTML
    const html = this.generatePrintableHtml(novel, chapters, options);

    this.emitProgress({
      stage: 'packaging',
      stageDescription: '打包 PDF 文件...',
      percent: 80
    });

    // 注意：真正的 PDF 生成需要使用第三方库如 jsPDF 或服务器端生成
    // 这里返回 HTML 内容，可以使用浏览器的打印功能转换为 PDF
    return new Blob([html], { type: 'text/html' });
  }

  /**
   * 生成可打印的 HTML
   */
  private generatePrintableHtml(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): string {
    const pageSize = options.pageSize || 'a4';
    const margins = options.margins || { top: 25, right: 20, bottom: 25, left: 20 };

    let html = `<!DOCTYPE html>
<html lang="${options.language || 'zh-CN'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(novel.title)}</title>
  <style>
    @page {
      size: ${pageSize};
      margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      font-family: ${options.fontFamily};
      font-size: ${options.fontSize}pt;
      line-height: ${options.lineHeight};
      color: #333;
      margin: 0;
      padding: 0;
    }

    .cover {
      page-break-after: always;
      text-align: center;
      padding-top: 30%;
    }

    .cover h1 {
      font-size: 24pt;
      margin-bottom: 20px;
    }

    .cover .author {
      font-size: 14pt;
      color: #666;
    }

    .toc {
      page-break-after: always;
    }

    .toc h2 {
      text-align: center;
      margin-bottom: 30px;
    }

    .toc ul {
      list-style: none;
      padding: 0;
    }

    .toc li {
      margin: 10px 0;
      padding-left: 20px;
    }

    .toc .volume {
      font-weight: bold;
      margin-top: 20px;
    }

    .chapter {
      ${options.chapterPageBreak ? 'page-break-before: always;' : ''}
    }

    .chapter:first-child {
      page-break-before: auto;
    }

    .chapter h2 {
      text-align: center;
      margin-bottom: 30px;
      font-size: 16pt;
    }

    .chapter p {
      text-indent: ${options.textIndent}em;
      margin: 0 0 ${options.paragraphSpacing}px 0;
      text-align: justify;
    }

    ${options.watermark ? `
    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 48pt;
      color: rgba(0, 0, 0, 0.05);
      pointer-events: none;
      z-index: 1000;
    }
    ` : ''}

    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
`;

    // 水印
    if (options.watermark) {
      html += `<div class="watermark">${escapeHtml(options.watermark)}</div>\n`;
    }

    // 封面
    if (options.includeCover) {
      html += `<div class="cover">
  ${novel.coverUrl ? `<img src="${novel.coverUrl}" alt="封面" style="max-width: 60%; max-height: 50vh;">` : ''}
  <h1>${escapeHtml(novel.title)}</h1>
  <p class="author">作者：${escapeHtml(novel.author)}</p>
  ${novel.description ? `<p class="description">${escapeHtml(novel.description)}</p>` : ''}
</div>\n`;
    }

    // 目录
    if (options.includeToc) {
      html += `<div class="toc">
  <h2>目 录</h2>
  <ul>\n`;

      let currentVolumeId = '';
      chapters.forEach((chapter, index) => {
        if (chapter.volumeId && chapter.volumeId !== currentVolumeId) {
          currentVolumeId = chapter.volumeId;
          const volume = novel.volumes.find(v => v.id === currentVolumeId);
          if (volume) {
            html += `    <li class="volume">${escapeHtml(volume.title)}</li>\n`;
          }
        }
        html += `    <li>${escapeHtml(chapter.title)}</li>\n`;
      });

      html += `  </ul>
</div>\n`;
    }

    // 章节内容
    chapters.forEach((chapter, index) => {
      this.emitProgress({
        stage: 'generating',
        stageDescription: `处理章节: ${chapter.title}`,
        percent: 20 + Math.floor((index / chapters.length) * 60),
        currentItem: chapter.title,
        totalItems: chapters.length,
        processedItems: index + 1
      });

      html += `<div class="chapter" id="chapter-${chapter.id}">
  <h2>${escapeHtml(chapter.title)}</h2>
  ${contentToParagraphs(chapter.content, options)}
</div>\n`;
    });

    html += `</body>
</html>`;

    return html;
  }

  /**
   * 导出为 EPUB
   */
  private async exportEpub(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): Promise<Blob> {
    this.emitProgress({
      stage: 'generating',
      stageDescription: '生成 EPUB 结构...',
      percent: 20
    });

    // EPUB 是一个 ZIP 文件，包含多个 XML/HTML 文件
    // 这里生成简化的 EPUB 结构

    const uuid = generateUUID();
    const files: Record<string, string> = {};

    // mimetype
    files['mimetype'] = 'application/epub+zip';

    // container.xml
    files['META-INF/container.xml'] = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;

    // content.opf
    let manifest = '';
    let spine = '';
    let tocItems = '';

    chapters.forEach((chapter, index) => {
      const chapterId = `chapter${index + 1}`;
      manifest += `    <item id="${chapterId}" href="${chapterId}.xhtml" media-type="application/xhtml+xml"/>\n`;
      spine += `    <itemref idref="${chapterId}"/>\n`;
      tocItems += `    <navPoint id="navpoint-${index + 1}" playOrder="${index + 1}">
      <navLabel><text>${escapeHtml(chapter.title)}</text></navLabel>
      <content src="${chapterId}.xhtml"/>
    </navPoint>\n`;
    });

    files['OEBPS/content.opf'] = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">urn:uuid:${uuid}</dc:identifier>
    <dc:title>${escapeHtml(novel.title)}</dc:title>
    <dc:creator opf:role="aut">${escapeHtml(novel.author)}</dc:creator>
    <dc:language>${options.language || 'zh-CN'}</dc:language>
    ${options.publisher ? `<dc:publisher>${escapeHtml(options.publisher)}</dc:publisher>` : ''}
    ${novel.description ? `<dc:description>${escapeHtml(novel.description)}</dc:description>` : ''}
    <meta name="generator" content="天道AI写作"/>
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
${manifest}  </manifest>
  <spine toc="ncx">
${spine}  </spine>
</package>`;

    // toc.ncx
    files['OEBPS/toc.ncx'] = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${uuid}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${escapeHtml(novel.title)}</text></docTitle>
  <navMap>
${tocItems}  </navMap>
</ncx>`;

    // style.css
    files['OEBPS/style.css'] = `
body {
  font-family: ${options.fontFamily};
  font-size: ${options.fontSize}pt;
  line-height: ${options.lineHeight};
  margin: 1em;
  color: #333;
}

h1, h2 {
  text-align: center;
  margin-bottom: 1em;
}

p {
  text-indent: ${options.textIndent}em;
  margin: 0 0 ${options.paragraphSpacing}px 0;
  text-align: justify;
}
`;

    // 章节文件
    chapters.forEach((chapter, index) => {
      this.emitProgress({
        stage: 'generating',
        stageDescription: `处理章节: ${chapter.title}`,
        percent: 20 + Math.floor((index / chapters.length) * 50),
        currentItem: chapter.title,
        totalItems: chapters.length,
        processedItems: index + 1
      });

      const chapterId = `chapter${index + 1}`;
      files[`OEBPS/${chapterId}.xhtml`] = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="${options.language || 'zh-CN'}">
<head>
  <meta charset="UTF-8"/>
  <title>${escapeHtml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <h2>${escapeHtml(chapter.title)}</h2>
  ${contentToParagraphs(chapter.content, options)}
</body>
</html>`;
    });

    this.emitProgress({
      stage: 'packaging',
      stageDescription: '打包 EPUB 文件...',
      percent: 80
    });

    // 使用简化的 EPUB 打包
    // 注意：完整的 EPUB 打包需要使用 JSZip 等库
    // 这里返回一个包含所有文件内容的 JSON，供外部处理
    const epubData = JSON.stringify(files, null, 2);
    return new Blob([epubData], { type: 'application/json' });
  }

  /**
   * 导出为 DOCX（生成 HTML，可转换）
   */
  private async exportDocx(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): Promise<Blob> {
    // DOCX 格式需要专门的库（如 docx）来生成
    // 这里返回 HTML 格式，可以用 Word 打开
    return this.exportHtml(novel, chapters, options);
  }

  /**
   * 导出为纯文本
   */
  private exportTxt(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): Blob {
    this.emitProgress({
      stage: 'generating',
      stageDescription: '生成文本内容...',
      percent: 50
    });

    let content = '';

    // 标题和作者
    content += `${novel.title}\n`;
    content += `作者：${novel.author}\n`;
    if (novel.description) {
      content += `\n简介：\n${novel.description}\n`;
    }
    content += '\n' + '='.repeat(40) + '\n\n';

    // 目录
    if (options.includeToc) {
      content += '目 录\n\n';
      chapters.forEach((chapter, index) => {
        content += `${index + 1}. ${chapter.title}\n`;
      });
      content += '\n' + '='.repeat(40) + '\n\n';
    }

    // 章节内容
    chapters.forEach((chapter, index) => {
      content += `\n${chapter.title}\n\n`;
      content += chapter.content.split(/\n/).map(p => '    ' + p.trim()).join('\n\n');
      content += '\n\n' + '-'.repeat(40) + '\n';
    });

    return new Blob([content], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * 导出为 HTML
   */
  private exportHtml(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): Blob {
    const html = this.generatePrintableHtml(novel, chapters, options);
    return new Blob([html], { type: 'text/html;charset=utf-8' });
  }

  /**
   * 导出为 Markdown
   */
  private exportMarkdown(
    novel: NovelContent,
    chapters: ChapterContent[],
    options: ExportOptions
  ): Blob {
    this.emitProgress({
      stage: 'generating',
      stageDescription: '生成 Markdown 内容...',
      percent: 50
    });

    let content = '';

    // 标题和元信息
    content += `# ${novel.title}\n\n`;
    content += `**作者：** ${novel.author}\n\n`;
    if (novel.description) {
      content += `> ${novel.description.replace(/\n/g, '\n> ')}\n\n`;
    }
    content += '---\n\n';

    // 目录
    if (options.includeToc) {
      content += '## 目录\n\n';
      chapters.forEach((chapter, index) => {
        const slug = `chapter-${chapter.id}`;
        content += `${index + 1}. [${chapter.title}](#${slug})\n`;
      });
      content += '\n---\n\n';
    }

    // 章节内容
    chapters.forEach(chapter => {
      const slug = `chapter-${chapter.id}`;
      content += `## ${chapter.title} {#${slug}}\n\n`;
      content += chapter.content.split(/\n\s*\n/).map(p => p.trim()).join('\n\n');
      content += '\n\n---\n\n';
    });

    return new Blob([content], { type: 'text/markdown;charset=utf-8' });
  }

  /**
   * 触发下载
   *
   * @param result - 导出结果
   */
  download(result: ExportResult): void {
    if (!result.success || !result.blob) {
      console.error('无法下载：导出失败或无数据');
      return;
    }

    const url = result.downloadUrl || URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 清理 URL
    if (!result.downloadUrl) {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * 获取支持的格式列表
   */
  getSupportedFormats(): Array<{
    format: ExportFormat;
    name: string;
    description: string;
    extension: string;
  }> {
    return [
      { format: 'pdf', name: 'PDF', description: '便携文档格式，适合打印', extension: '.pdf' },
      { format: 'epub', name: 'EPUB', description: '电子书格式，适合阅读器', extension: '.epub' },
      { format: 'docx', name: 'Word', description: 'Microsoft Word 文档', extension: '.docx' },
      { format: 'txt', name: '纯文本', description: '纯文本格式，兼容性最好', extension: '.txt' },
      { format: 'html', name: 'HTML', description: '网页格式，可在浏览器查看', extension: '.html' },
      { format: 'markdown', name: 'Markdown', description: 'Markdown 格式，适合技术写作', extension: '.md' }
    ];
  }

  /**
   * 触发进度事件
   */
  private emitProgress(progress: ExportProgress): void {
    this.emit('progress', progress);
  }

  /**
   * 注册事件监听器
   */
  on(event: ExportEventType, callback: ExportEventCallback): () => void {
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
  private emit(type: ExportEventType, data: ExportProgress | ExportResult | Error): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback({ type, data });
        } catch (error) {
          console.error('[ExportService] 事件回调错误:', error);
        }
      });
    }
  }
}

// 导出单例
export const exportService = new ExportService();

// 导出便捷函数
export const exportNovel = (novel: NovelContent, options: ExportOptions) =>
  exportService.export(novel, options);
export const downloadExport = (result: ExportResult) =>
  exportService.download(result);
export const getSupportedExportFormats = () =>
  exportService.getSupportedFormats();

export default exportService;
