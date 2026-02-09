/**
 * 版本对比工具 - 章节版本历史对比和差异分析
 * 
 * 核心能力：
 * 1. 版本差异对比（diff）
 * 2. 版本历史管理
 * 3. 版本回滚
 * 4. 差异可视化
 */

import type { Chapter, ChapterVersion } from '../types';

// ============ 类型定义 ============

export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified';

export interface DiffLine {
  type: DiffType;
  content: string;
  lineNumber: number;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export interface DiffResult {
  oldVersion: string;
  newVersion: string;
  lines: DiffLine[];
  stats: {
    added: number;
    removed: number;
    unchanged: number;
    modified: number;
  };
  similarity: number; // 相似度 0-100
}

export interface VersionComparison {
  version1: ChapterVersion;
  version2: ChapterVersion;
  diff: DiffResult;
  summary: string;
}

// ============ 差异计算 ============

/**
 * 计算两个文本的差异
 */
export function calculateDiff(oldText: string, newText: string): DiffResult {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  
  const lines: DiffLine[] = [];
  const stats = {
    added: 0,
    removed: 0,
    unchanged: 0,
    modified: 0,
  };

  // 简单的逐行对比（可以使用更复杂的 diff 算法）
  const maxLen = Math.max(oldLines.length, newLines.length);
  
  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];

    if (oldLine === undefined) {
      // 新增行
      lines.push({
        type: 'added',
        content: newLine,
        lineNumber: i + 1,
        newLineNumber: i + 1,
      });
      stats.added++;
    } else if (newLine === undefined) {
      // 删除行
      lines.push({
        type: 'removed',
        content: oldLine,
        lineNumber: i + 1,
        oldLineNumber: i + 1,
      });
      stats.removed++;
    } else if (oldLine === newLine) {
      // 未变化
      lines.push({
        type: 'unchanged',
        content: oldLine,
        lineNumber: i + 1,
        oldLineNumber: i + 1,
        newLineNumber: i + 1,
      });
      stats.unchanged++;
    } else {
      // 修改行
      lines.push({
        type: 'modified',
        content: newLine,
        lineNumber: i + 1,
        oldLineNumber: i + 1,
        newLineNumber: i + 1,
      });
      stats.modified++;
    }
  }

  // 计算相似度
  const totalLines = Math.max(oldLines.length, newLines.length);
  const similarity = totalLines > 0
    ? Math.floor((stats.unchanged / totalLines) * 100)
    : 100;

  return {
    oldVersion: oldText,
    newVersion: newText,
    lines,
    stats,
    similarity,
  };
}

/**
 * 比较两个版本
 */
export function compareVersions(
  version1: ChapterVersion,
  version2: ChapterVersion
): VersionComparison {
  const diff = calculateDiff(version1.content, version2.content);
  const summary = generateComparisonSummary(version1, version2, diff);

  return {
    version1,
    version2,
    diff,
    summary,
  };
}

/**
 * 生成对比摘要
 */
function generateComparisonSummary(
  version1: ChapterVersion,
  version2: ChapterVersion,
  diff: DiffResult
): string {
  const parts: string[] = [];

  const wordDiff = version2.wordCount - version1.wordCount;
  const wordDiffPercent = version1.wordCount > 0
    ? Math.abs((wordDiff / version1.wordCount) * 100).toFixed(1)
    : '0';

  if (wordDiff > 0) {
    parts.push(`字数增加 ${wordDiff} 字（+${wordDiffPercent}%）`);
  } else if (wordDiff < 0) {
    parts.push(`字数减少 ${Math.abs(wordDiff)} 字（-${wordDiffPercent}%）`);
  } else {
    parts.push('字数未变化');
  }

  parts.push(`相似度 ${diff.similarity}%`);

  if (diff.stats.added > 0) {
    parts.push(`新增 ${diff.stats.added} 行`);
  }

  if (diff.stats.removed > 0) {
    parts.push(`删除 ${diff.stats.removed} 行`);
  }

  if (diff.stats.modified > 0) {
    parts.push(`修改 ${diff.stats.modified} 行`);
  }

  return parts.join('，');
}

/**
 * 导出差异为 Markdown
 */
export function exportDiffAsMarkdown(comparison: VersionComparison): string {
  const lines: string[] = [];

  lines.push('# 版本对比\n');
  lines.push(`**版本1：** ${comparison.version1.note || '无备注'}`);
  lines.push(`**版本2：** ${comparison.version2.note || '无备注'}`);
  lines.push(`**摘要：** ${comparison.summary}\n`);

  lines.push('## 统计信息\n');
  lines.push(`- 新增行数：${comparison.diff.stats.added}`);
  lines.push(`- 删除行数：${comparison.diff.stats.removed}`);
  lines.push(`- 修改行数：${comparison.diff.stats.modified}`);
  lines.push(`- 未变化行数：${comparison.diff.stats.unchanged}`);
  lines.push(`- 相似度：${comparison.diff.similarity}%\n`);

  lines.push('## 差异详情\n');
  lines.push('```diff');

  comparison.diff.lines.forEach(line => {
    switch (line.type) {
      case 'added':
        lines.push(`+ ${line.content}`);
        break;
      case 'removed':
        lines.push(`- ${line.content}`);
        break;
      case 'modified':
        lines.push(`! ${line.content}`);
        break;
      case 'unchanged':
        lines.push(`  ${line.content}`);
        break;
    }
  });

  lines.push('```');

  return lines.join('\n');
}

/**
 * 导出差异为 HTML
 */
export function exportDiffAsHTML(comparison: VersionComparison): string {
  const lines: string[] = [];

  lines.push('<!DOCTYPE html>');
  lines.push('<html lang="zh-CN">');
  lines.push('<head>');
  lines.push('<meta charset="UTF-8">');
  lines.push('<title>版本对比</title>');
  lines.push('<style>');
  lines.push('.diff-line { font-family: monospace; padding: 2px 5px; }');
  lines.push('.added { background-color: #d4edda; color: #155724; }');
  lines.push('.removed { background-color: #f8d7da; color: #721c24; }');
  lines.push('.modified { background-color: #fff3cd; color: #856404; }');
  lines.push('.unchanged { color: #6c757d; }');
  lines.push('</style>');
  lines.push('</head>');
  lines.push('<body>');
  lines.push('<h1>版本对比</h1>');
  lines.push(`<p><strong>摘要：</strong>${comparison.summary}</p>`);
  lines.push('<div>');

  comparison.diff.lines.forEach(line => {
    const className = line.type;
    const prefix = {
      added: '+',
      removed: '-',
      modified: '!',
      unchanged: ' ',
    }[line.type];

    lines.push(`<div class="diff-line ${className}">${prefix} ${escapeHTML(line.content)}</div>`);
  });

  lines.push('</div>');
  lines.push('</body>');
  lines.push('</html>');

  return lines.join('\n');
}

/**
 * HTML 转义
 */
function escapeHTML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ============ 版本管理 ============

/**
 * 创建新版本
 */
export function createVersion(
  chapter: Chapter,
  note?: string
): ChapterVersion {
  return {
    id: `version-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    chapterId: chapter.id,
    content: chapter.content,
    wordCount: chapter.wordCount,
    createdAt: new Date().toISOString(),
    note,
  };
}

/**
 * 回滚到指定版本
 */
export function rollbackToVersion(
  chapter: Chapter,
  version: ChapterVersion
): Chapter {
  return {
    ...chapter,
    content: version.content,
    wordCount: version.wordCount,
  };
}

/**
 * 获取版本列表（按时间倒序）
 */
export function getVersionHistory(chapter: Chapter): ChapterVersion[] {
  if (!chapter.versions || chapter.versions.length === 0) {
    return [];
  }

  return [...chapter.versions].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * 清理旧版本（保留最近N个）
 */
export function cleanOldVersions(
  chapter: Chapter,
  keepCount: number = 10
): Chapter {
  if (!chapter.versions || chapter.versions.length <= keepCount) {
    return chapter;
  }

  const sorted = getVersionHistory(chapter);
  const kept = sorted.slice(0, keepCount);

  return {
    ...chapter,
    versions: kept,
  };
}

/**
 * 查找版本
 */
export function findVersion(
  chapter: Chapter,
  versionId: string
): ChapterVersion | null {
  if (!chapter.versions) return null;
  return chapter.versions.find(v => v.id === versionId) || null;
}

/**
 * 生成版本历史报告
 */
export function generateVersionHistoryReport(chapter: Chapter): string {
  const lines: string[] = [];

  lines.push(`# ${chapter.title} - 版本历史\n`);
  lines.push(`**当前字数：** ${chapter.wordCount}\n`);

  const versions = getVersionHistory(chapter);

  if (versions.length === 0) {
    lines.push('暂无版本历史');
    return lines.join('\n');
  }

  lines.push(`**版本数量：** ${versions.length}\n`);
  lines.push('## 版本列表\n');

  versions.forEach((version, idx) => {
    lines.push(`### ${idx + 1}. ${version.note || '无备注'}`);
    lines.push(`- **创建时间：** ${new Date(version.createdAt).toLocaleString('zh-CN')}`);
    lines.push(`- **字数：** ${version.wordCount}`);
    lines.push(`- **版本ID：** ${version.id}`);
    lines.push('');
  });

  return lines.join('\n');
}
