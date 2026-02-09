import { OutlineNode } from '../../types/novel';

export class OutlineExportService {
  /**
   * 导出为 Markdown
   */
  static exportToMarkdown(outlineNodes: OutlineNode[], novelTitle: string): string {
    const lines: string[] = [];

    lines.push(`# ${novelTitle} - 大纲\n`);
    lines.push(`生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}\n`);
    lines.push('---\n');

    const renderNode = (node: OutlineNode, level: number) => {
      const indent = '  '.repeat(level);
      const icon = this.getNodeIcon(node);
      const status = this.getStatusText(node);

      lines.push(`${indent}- ${icon} **${node.title}** ${status}`);

      if (node.content) {
        lines.push(`${indent}  > ${node.content}`);
      }

      const targetWords = (node as any).targetWords;
      const actualWords = (node as any).actualWords;
      const completionRate = (node as any).completionRate;

      if (targetWords || actualWords) {
        const wordInfo: string[] = [];
        if (targetWords) wordInfo.push(`目标：${targetWords}字`);
        if (actualWords) wordInfo.push(`实际：${actualWords}字`);
        if (completionRate !== undefined) wordInfo.push(`完成度：${completionRate}%`);
        lines.push(`${indent}  ${wordInfo.join(' | ')}`);
      }

      if (node.chapterId) {
        lines.push(`${indent}  🔗 已关联章节`);
      }

      // 递归渲染子节点
      const children = outlineNodes
        .filter(n => n.parentId === node.id)
        .sort((a, b) => a.order - b.order);
      
      children.forEach(child => renderNode(child, level + 1));
    };

    // 渲染根节点
    const rootNodes = outlineNodes
      .filter(n => !n.parentId)
      .sort((a, b) => a.order - b.order);
    
    rootNodes.forEach(node => renderNode(node, 0));

    // 添加统计信息
    lines.push('\n---\n');
    lines.push('## 统计信息\n');
    
    const stats = this.calculateStats(outlineNodes);
    lines.push(`- 总节点数：${stats.totalNodes}`);
    lines.push(`- 卷数：${stats.volumeCount}`);
    lines.push(`- 章节数：${stats.chapterCount}`);
    lines.push(`- 场景数：${stats.sceneCount}`);
    lines.push(`- 目标总字数：${stats.targetWords.toLocaleString()}`);
    if (stats.actualWords > 0) {
      lines.push(`- 实际总字数：${stats.actualWords.toLocaleString()}`);
      lines.push(`- 整体完成度：${stats.overallCompletion.toFixed(1)}%`);
    }

    return lines.join('\n');
  }

  /**
   * 导出为纯文本（简化版）
   */
  static exportToPlainText(outlineNodes: OutlineNode[], novelTitle: string): string {
    const lines: string[] = [];

    lines.push(`${novelTitle} - 大纲`);
    lines.push(`生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`);
    lines.push('='.repeat(50));
    lines.push('');

    const renderNode = (node: OutlineNode, level: number) => {
      const indent = '  '.repeat(level);
      const prefix = level === 0 ? '【卷】' : level === 1 ? '【章】' : '【场景】';
      const status = this.getStatusEmoji(node);

      lines.push(`${indent}${prefix} ${node.title} ${status}`);

      if (node.content) {
        lines.push(`${indent}    ${node.content}`);
      }

      const targetWords = (node as any).targetWords;
      if (targetWords) {
        lines.push(`${indent}    目标字数：${targetWords}`);
      }

      // 递归渲染子节点
      const children = outlineNodes
        .filter(n => n.parentId === node.id)
        .sort((a, b) => a.order - b.order);
      
      children.forEach(child => renderNode(child, level + 1));
      
      if (level === 0) {
        lines.push(''); // 卷之间空一行
      }
    };

    // 渲染根节点
    const rootNodes = outlineNodes
      .filter(n => !n.parentId)
      .sort((a, b) => a.order - b.order);
    
    rootNodes.forEach(node => renderNode(node, 0));

    return lines.join('\n');
  }

  /**
   * 导出为 JSON
   */
  static exportToJSON(outlineNodes: OutlineNode[], novelTitle: string): string {
    const data = {
      title: novelTitle,
      exportTime: new Date().toISOString(),
      outline: this.buildHierarchy(outlineNodes),
      stats: this.calculateStats(outlineNodes)
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * 导出为 HTML
   */
  static exportToHTML(outlineNodes: OutlineNode[], novelTitle: string): string {
    const html: string[] = [];

    html.push('<!DOCTYPE html>');
    html.push('<html lang="zh-CN">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push(`  <title>${novelTitle} - 大纲</title>`);
    html.push('  <style>');
    html.push('    body { font-family: "Microsoft YaHei", sans-serif; max-width: 900px; margin: 40px auto; padding: 20px; line-height: 1.6; }');
    html.push('    h1 { color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }');
    html.push('    .meta { color: #666; font-size: 14px; margin-bottom: 30px; }');
    html.push('    .outline { list-style: none; padding-left: 0; }');
    html.push('    .outline li { margin: 15px 0; }');
    html.push('    .outline .volume { font-size: 20px; font-weight: bold; color: #2196F3; margin-top: 30px; }');
    html.push('    .outline .chapter { font-size: 16px; font-weight: bold; color: #4CAF50; margin-left: 20px; }');
    html.push('    .outline .scene { font-size: 14px; color: #666; margin-left: 40px; }');
    html.push('    .content { color: #555; font-size: 14px; margin-top: 5px; font-style: italic; }');
    html.push('    .status { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 12px; margin-left: 10px; }');
    html.push('    .status.planned { background: #E3F2FD; color: #1976D2; }');
    html.push('    .status.writing { background: #FFF3E0; color: #F57C00; }');
    html.push('    .status.completed { background: #E8F5E9; color: #388E3C; }');
    html.push('    .stats { background: #f5f5f5; padding: 20px; border-radius: 5px; margin-top: 30px; }');
    html.push('    .stats h2 { margin-top: 0; }');
    html.push('    .stats ul { list-style: none; padding-left: 0; }');
    html.push('    .stats li { padding: 5px 0; }');
    html.push('  </style>');
    html.push('</head>');
    html.push('<body>');
    html.push(`  <h1>${novelTitle} - 大纲</h1>`);
    html.push(`  <div class="meta">生成时间：${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>`);
    html.push('  <ul class="outline">');

    const renderNode = (node: OutlineNode, level: number) => {
      const className = node.type;
      const statusClass = node.status;
      const statusText = this.getStatusText(node);

      html.push(`    <li class="${className}">`);
      html.push(`      ${this.getNodeIcon(node)} ${node.title}`);
      html.push(`      <span class="status ${statusClass}">${statusText}</span>`);
      
      if (node.content) {
        html.push(`      <div class="content">${node.content}</div>`);
      }

      const targetWords = (node as any).targetWords;
      const actualWords = (node as any).actualWords;
      if (targetWords || actualWords) {
        const wordInfo: string[] = [];
        if (targetWords) wordInfo.push(`目标：${targetWords}字`);
        if (actualWords) wordInfo.push(`实际：${actualWords}字`);
        html.push(`      <div class="content">${wordInfo.join(' | ')}</div>`);
      }

      // 递归渲染子节点
      const children = outlineNodes
        .filter(n => n.parentId === node.id)
        .sort((a, b) => a.order - b.order);
      
      if (children.length > 0) {
        html.push('      <ul class="outline">');
        children.forEach(child => renderNode(child, level + 1));
        html.push('      </ul>');
      }

      html.push('    </li>');
    };

    // 渲染根节点
    const rootNodes = outlineNodes
      .filter(n => !n.parentId)
      .sort((a, b) => a.order - b.order);
    
    rootNodes.forEach(node => renderNode(node, 0));

    html.push('  </ul>');

    // 添加统计信息
    const stats = this.calculateStats(outlineNodes);
    html.push('  <div class="stats">');
    html.push('    <h2>统计信息</h2>');
    html.push('    <ul>');
    html.push(`      <li>总节点数：${stats.totalNodes}</li>`);
    html.push(`      <li>卷数：${stats.volumeCount}</li>`);
    html.push(`      <li>章节数：${stats.chapterCount}</li>`);
    html.push(`      <li>场景数：${stats.sceneCount}</li>`);
    html.push(`      <li>目标总字数：${stats.targetWords.toLocaleString()}</li>`);
    if (stats.actualWords > 0) {
      html.push(`      <li>实际总字数：${stats.actualWords.toLocaleString()}</li>`);
      html.push(`      <li>整体完成度：${stats.overallCompletion.toFixed(1)}%</li>`);
    }
    html.push('    </ul>');
    html.push('  </div>');

    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  /**
   * 下载为文件
   */
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * 下载 Markdown
   */
  static downloadMarkdown(outlineNodes: OutlineNode[], novelTitle: string) {
    const content = this.exportToMarkdown(outlineNodes, novelTitle);
    this.downloadFile(content, `${novelTitle}-大纲.md`, 'text/markdown');
  }

  /**
   * 下载纯文本
   */
  static downloadPlainText(outlineNodes: OutlineNode[], novelTitle: string) {
    const content = this.exportToPlainText(outlineNodes, novelTitle);
    this.downloadFile(content, `${novelTitle}-大纲.txt`, 'text/plain');
  }

  /**
   * 下载 JSON
   */
  static downloadJSON(outlineNodes: OutlineNode[], novelTitle: string) {
    const content = this.exportToJSON(outlineNodes, novelTitle);
    this.downloadFile(content, `${novelTitle}-大纲.json`, 'application/json');
  }

  /**
   * 下载 HTML
   */
  static downloadHTML(outlineNodes: OutlineNode[], novelTitle: string) {
    const content = this.exportToHTML(outlineNodes, novelTitle);
    this.downloadFile(content, `${novelTitle}-大纲.html`, 'text/html');
  }

  /**
   * 获取节点图标
   */
  private static getNodeIcon(node: OutlineNode): string {
    const icons = {
      volume: '📚',
      chapter: '📖',
      scene: '🎬',
      note: '📝',
    };
    return icons[node.type] || '📄';
  }

  /**
   * 获取状态文本
   */
  private static getStatusText(node: OutlineNode): string {
    const status = {
      planned: '📋 计划中',
      writing: '✍️ 写作中',
      completed: '✅ 已完成',
    };
    return status[node.status] || '';
  }

  /**
   * 获取状态表情符号
   */
  private static getStatusEmoji(node: OutlineNode): string {
    const status = {
      planned: '📋',
      writing: '✍️',
      completed: '✅',
    };
    return status[node.status] || '';
  }

  /**
   * 构建层级结构
   */
  private static buildHierarchy(outlineNodes: OutlineNode[]): any[] {
    const nodeMap = new Map<string, any>();
    const rootNodes: any[] = [];

    // 创建节点映射
    outlineNodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    // 构建树形结构
    outlineNodes.forEach(node => {
      const nodeData = nodeMap.get(node.id);
      if (node.parentId) {
        const parent = nodeMap.get(node.parentId);
        if (parent) {
          parent.children.push(nodeData);
        }
      } else {
        rootNodes.push(nodeData);
      }
    });

    // 排序
    const sortNodes = (nodes: any[]) => {
      nodes.sort((a, b) => a.order - b.order);
      nodes.forEach(node => {
        if (node.children.length > 0) {
          sortNodes(node.children);
        }
      });
    };

    sortNodes(rootNodes);

    return rootNodes;
  }

  /**
   * 计算统计信息
   */
  private static calculateStats(outlineNodes: OutlineNode[]) {
    const stats = {
      totalNodes: outlineNodes.length,
      volumeCount: 0,
      chapterCount: 0,
      sceneCount: 0,
      targetWords: 0,
      actualWords: 0,
      overallCompletion: 0
    };

    outlineNodes.forEach(node => {
      if (node.type === 'volume') stats.volumeCount++;
      if (node.type === 'chapter') stats.chapterCount++;
      if (node.type === 'scene') stats.sceneCount++;

      const targetWords = (node as any).targetWords || 0;
      const actualWords = (node as any).actualWords || 0;

      stats.targetWords += targetWords;
      stats.actualWords += actualWords;
    });

    if (stats.targetWords > 0) {
      stats.overallCompletion = (stats.actualWords / stats.targetWords) * 100;
    }

    return stats;
  }
}
