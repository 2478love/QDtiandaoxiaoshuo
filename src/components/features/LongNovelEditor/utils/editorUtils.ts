import { MindMap, MindMapNode, ChapterTemplate } from '../../../../types';
import { createId, createMindMapId } from '../../../../utils/id';
import { escapeHtml } from '../../../../utils';

// 节点颜色配置
export const NODE_COLORS = [
  { id: 'rose', bg: 'bg-rose-500', label: '玫红' },
  { id: 'indigo', bg: 'bg-[#2C5F2D]', label: '靛蓝' },
  { id: 'emerald', bg: 'bg-emerald-500', label: '翠绿' },
  { id: 'amber', bg: 'bg-amber-500', label: '琥珀' },
  { id: 'violet', bg: 'bg-violet-500', label: '紫罗兰' },
  { id: 'cyan', bg: 'bg-cyan-500', label: '青色' },
  { id: 'slate', bg: 'bg-slate-500', label: '灰色' },
];

// 常见敏感词列表（简化版）
export const SENSITIVE_WORDS = [
  '政治', '领导', '政府', '国家机密', '颠覆', '分裂',
  '色情', '淫秽', '裸体', '性交',
  '赌博', '博彩', '六合彩',
  '毒品', '吸毒', '贩毒',
  '暴力', '恐怖', '杀人', '自杀',
  '邪教', '法轮', '传销',
];

// ============ 思维导图工具函数 ============

// 创建新节点
export const createNode = (title: string, color?: string): MindMapNode => ({
  id: createId(),
  title,
  color: color || NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].bg,
  children: []
});

// 创建新思维导图
export const createMindMap = (name: string, rootTitle: string): MindMap => ({
  id: createId(),
  name,
  root: createNode(rootTitle, 'bg-rose-500'),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// 在树中查找节点
export const findNodeInTree = (root: MindMapNode, nodeId: string): MindMapNode | null => {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeInTree(child, nodeId);
    if (found) return found;
  }
  return null;
};

// 在树中查找父节点
export const findParentNode = (root: MindMapNode, nodeId: string): MindMapNode | null => {
  for (const child of root.children) {
    if (child.id === nodeId) return root;
    const found = findParentNode(child, nodeId);
    if (found) return found;
  }
  return null;
};

// 深拷贝节点树
export const cloneTree = (node: MindMapNode): MindMapNode => ({
  ...node,
  children: node.children.map(cloneTree)
});

// 更新树中的节点
export const updateNodeInTree = (root: MindMapNode, nodeId: string, updates: Partial<MindMapNode>): MindMapNode => {
  if (root.id === nodeId) {
    return { ...root, ...updates, children: updates.children || root.children };
  }
  return {
    ...root,
    children: root.children.map(child => updateNodeInTree(child, nodeId, updates))
  };
};

// 删除树中的节点
export const deleteNodeFromTree = (root: MindMapNode, nodeId: string): MindMapNode => {
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== nodeId)
      .map(child => deleteNodeFromTree(child, nodeId))
  };
};

// 添加子节点到指定节点
export const addChildToNode = (root: MindMapNode, parentId: string, newNode: MindMapNode): MindMapNode => {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, newNode] };
  }
  return {
    ...root,
    children: root.children.map(child => addChildToNode(child, parentId, newNode))
  };
};

// 添加同级节点
export const addSiblingNode = (root: MindMapNode, siblingId: string, newNode: MindMapNode): MindMapNode => {
  const newChildren = [];
  for (const child of root.children) {
    newChildren.push(child);
    if (child.id === siblingId) {
      newChildren.push(newNode);
    }
  }
  if (newChildren.length !== root.children.length) {
    return { ...root, children: newChildren.map(c => c.id === newNode.id ? c : addSiblingNode(c, siblingId, newNode)) };
  }
  return {
    ...root,
    children: root.children.map(child => addSiblingNode(child, siblingId, newNode))
  };
};

// ============ 日期格式化 ============

// 格式化会话日期
export const formatSessionDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${date.getFullYear()}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

// 格式化时间 (番茄钟用)
export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ============ 默认章节模板 ============

export const getDefaultTemplates = (): ChapterTemplate[] => [
  {
    id: 'tpl-battle-1',
    name: '战斗开场',
    category: '战斗',
    content: '【战斗场景】\n\n空气中弥漫着紧张的气息，双方对峙而立。\n\n"来吧！"主角沉声说道，体内真气翻涌，一股强大的气势从身上爆发而出。\n\n对方冷笑一声，同样释放出强大的气场，两股气势在空中碰撞，激起层层涟漪。\n\n',
    description: '适用于战斗章节的开场描写',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-daily-1',
    name: '日常场景',
    category: '日常',
    content: '【日常场景】\n\n阳光透过窗户洒进房间，尘埃在光束中轻轻飘动。\n\n主角伸了个懒腰，从修炼中缓缓睁开双眼。新的一天开始了。\n\n',
    description: '适用于日常生活场景的描写',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-upgrade-1',
    name: '突破升级',
    category: '升级',
    content: '【突破场景】\n\n丹田中的真气如潮水般涌动，一道道气旋在体内形成，冲击着那道屏障。\n\n"破！"\n\n随着一声低喝，那道困扰已久的瓶颈轰然碎裂，一股强大的能量从体内爆发而出，直冲云霄！\n\n',
    description: '适用于修炼突破的描写',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-flashback-1',
    name: '回忆开场',
    category: '回忆',
    content: '【回忆场景】\n\n思绪飘回到多年前的那个夜晚...\n\n那时的天空布满繁星，月光如水般洒落大地。年少的身影站在山巅，望着远方的灯火，心中满怀憧憬。\n\n"总有一天，我一定会..."那时的誓言仿佛还在耳边回响。\n\n',
    description: '适用于回忆、闪回场景',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-dialog-1',
    name: '对话场景',
    category: '对话',
    content: '【对话场景】\n\n两人相对而坐，气氛有些凝重。\n\n"此事...你怎么看？"开口的人眉头紧锁。\n\n对方沉默片刻，缓缓说道："事已至此，唯有一战。"\n\n',
    description: '适用于重要对话场景',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-climax-1',
    name: '高潮转折',
    category: '高潮',
    content: '【高潮场景】\n\n就在千钧一发之际——\n\n一道璀璨的光芒从天而降，强大的威压笼罩四方，所有人都愣住了。\n\n"这是...！"有人惊呼出声。\n\n局势，在这一刻发生了翻天覆地的变化。\n\n',
    description: '适用于剧情高潮和转折点',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  }
];

// ============ 导出相关 ============

// 导出为 TXT
export const exportToTXT = (title: string, content: string) => {
  const fullContent = `${title}\n\n${content}`;
  const blob = new Blob([fullContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.txt`;
  a.click();
  URL.revokeObjectURL(url);
};

// 导出为 Markdown
export const exportToMarkdown = (title: string, content: string) => {
  const fullContent = `# ${title}\n\n${content}`;
  const blob = new Blob([fullContent], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

// 导出为 Word
export const exportToWord = (title: string, content: string) => {
  const safeTitle = escapeHtml(title);
  const safeParagraphs = content
    .split('\n')
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
    <head>
      <meta charset="utf-8">
      <title>${safeTitle}</title>
      <style>
        body { font-family: '微软雅黑', sans-serif; font-size: 14pt; line-height: 1.8; }
        h1 { font-size: 18pt; text-align: center; }
        p { text-indent: 2em; margin: 0.5em 0; }
      </style>
    </head>
    <body>
      <h1>${safeTitle}</h1>
      ${safeParagraphs}
    </body>
    </html>
  `;
  const blob = new Blob([htmlContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title}.doc`;
  a.click();
  URL.revokeObjectURL(url);
};

// 导出为 PDF (通过打印)
export const exportToPDF = (title: string, content: string) => {
  const safeTitle = escapeHtml(title);
  const safeParagraphs = content
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => `<p>${escapeHtml(p)}</p>`)
    .join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('请允许弹出窗口以导出PDF');
    return;
  }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${safeTitle}</title>
      <style>
        body { font-family: '微软雅黑', sans-serif; font-size: 12pt; line-height: 1.8; padding: 40px; }
        h1 { font-size: 18pt; text-align: center; margin-bottom: 30px; }
        p { text-indent: 2em; margin: 0.8em 0; }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <h1>${safeTitle}</h1>
      ${safeParagraphs}
    </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 250);
};

// ============ 文本处理 ============

// 计算文本字数
export const countWords = (text: string): number => {
  return text.replace(/\s/g, '').length;
};

// 敏感词检测
export const detectSensitiveWords = (content: string): string[] => {
  return SENSITIVE_WORDS.filter(word => content.includes(word));
};
