# 大纲功能开发文档

## 概述

本文档记录了为 QDtiandaoxiaoshuo 项目新增的 5 个核心大纲功能。

## 功能列表

### 1. 大纲模板系统 (OutlineTemplateService)

**功能描述：** 提供多种预设大纲结构模板，帮助作者快速规划小说。

**预设模板：**
- **三幕式结构** - 经典的三幕式剧本结构（开端25%、对抗50%、结局25%）
- **五幕式结构** - 莎士比亚式的五幕结构
- **英雄之旅** - 约瑟夫·坎贝尔的12步骤英雄旅程
- **网文爽文结构** - 适合网络爽文的节奏结构（废材逆袭、打脸装逼）
- **玄幻修仙结构** - 经典的修仙升级流（凡人篇、修炼篇、飞升篇）
- **悬疑推理结构** - 适合悬疑推理类小说

**核心方法：**
```typescript
// 获取所有模板
OutlineTemplateService.getTemplates()

// 通过ID获取模板
OutlineTemplateService.getTemplateById('three-act')

// 按类别筛选模板
OutlineTemplateService.getTemplatesByCategory('webnovel')

// 应用模板到小说
OutlineTemplateService.applyTemplate(template, novelId)

// 创建自定义模板
OutlineTemplateService.createCustomTemplate(name, description, outlineNodes)
```

**使用示例：**
```typescript
import { OutlineTemplateService } from '@/services/outline';

// 获取三幕式模板
const template = OutlineTemplateService.getTemplateById('three-act');

// 应用到小说
const nodes = OutlineTemplateService.applyTemplate(template, novel.id);

// 更新小说
const updatedNovel = {
  ...novel,
  outlineNodes: nodes
};
```

---

### 2. 章节关联功能 (OutlineChapterLinkService)

**功能描述：** 大纲节点和实际章节的双向关联，支持跳转和同步。

**核心方法：**
```typescript
// 关联大纲节点和章节
OutlineChapterLinkService.linkChapter(nodeId, chapterId, novel)

// 取消关联
OutlineChapterLinkService.unlinkChapter(nodeId, novel)

// 从大纲跳转到章节
OutlineChapterLinkService.navigateToChapter(node, chapters)

// 从章节跳转到大纲
OutlineChapterLinkService.navigateToOutlineNode(chapterId, nodes)

// 同步章节状态到大纲（更新字数、完成度）
OutlineChapterLinkService.syncChapterStatus(novel)

// 自动匹配标题相同的节点和章节
OutlineChapterLinkService.autoLinkChapters(novel)

// 验证关联完整性
OutlineChapterLinkService.validateLinks(novel)

// 修复断开的关联
OutlineChapterLinkService.fixBrokenLinks(novel)
```

**使用示例：**
```typescript
import { OutlineChapterLinkService } from '@/services/outline';

// 手动关联
const linked = OutlineChapterLinkService.linkChapter(
  'outline_node_1',
  'chapter_1',
  novel
);

// 自动关联（匹配标题）
const autoLinked = OutlineChapterLinkService.autoLinkChapters(novel);

// 同步状态
const synced = OutlineChapterLinkService.syncChapterStatus(novel);

// 验证关联
const validation = OutlineChapterLinkService.validateLinks(novel);
if (!validation.valid) {
  console.log('断开的关联:', validation.brokenLinks);
  console.log('重复的关联:', validation.duplicateLinks);
}
```

---

### 3. 一键生成章节 (OutlineToChapterService)

**功能描述：** 从大纲节点一键生成对应的章节，自动填充标题和初始内容。

**核心方法：**
```typescript
// 从大纲节点生成单个章节
OutlineToChapterService.generateChapter(node, novel)

// 批量生成章节
OutlineToChapterService.batchGenerateChapters(nodes, novel)

// 生成章节并自动关联
OutlineToChapterService.generateAndLinkChapter(node, novel)

// 批量生成并关联
OutlineToChapterService.batchGenerateAndLinkChapters(nodes, novel)

// 生成章节大纲（不是完整章节）
OutlineToChapterService.generateChapterOutline(node, novel)

// 从大纲节点生成卷
OutlineToChapterService.generateVolume(volumeNode, novel)

// 生成完整结构（卷+章节）
OutlineToChapterService.generateFullStructure(nodes, novel)
```

**生成的章节内容包含：**
- 章节标题
- 大纲内容（作为注释）
- 目标字数提示
- 相关人物信息
- 力量体系提示
- 写作占位符

**使用示例：**
```typescript
import { OutlineToChapterService } from '@/services/outline';

// 生成单个章节
const chapter = OutlineToChapterService.generateChapter(outlineNode, novel);

// 批量生成并关联
const result = OutlineToChapterService.batchGenerateAndLinkChapters(
  novel.outlineNodes,
  novel
);

// 更新小说
const updatedNovel = result.updatedNovel;
console.log(`生成了 ${result.chapters.length} 个章节`);

// 生成完整结构
const fullResult = OutlineToChapterService.generateFullStructure(
  novel.outlineNodes,
  novel
);
console.log(`生成了 ${fullResult.volumes.length} 卷`);
console.log(`生成了 ${fullResult.chapters.length} 章`);
```

---

### 4. 大纲导出功能 (OutlineExportService)

**功能描述：** 导出大纲为多种格式（Markdown、HTML、JSON、纯文本），方便分享和打印。

**核心方法：**
```typescript
// 导出为 Markdown
OutlineExportService.exportToMarkdown(nodes, novelTitle)

// 导出为纯文本
OutlineExportService.exportToPlainText(nodes, novelTitle)

// 导出为 JSON
OutlineExportService.exportToJSON(nodes, novelTitle)

// 导出为 HTML
OutlineExportService.exportToHTML(nodes, novelTitle)

// 下载文件
OutlineExportService.downloadMarkdown(nodes, novelTitle)
OutlineExportService.downloadPlainText(nodes, novelTitle)
OutlineExportService.downloadJSON(nodes, novelTitle)
OutlineExportService.downloadHTML(nodes, novelTitle)
```

**导出内容包含：**
- 层级结构的大纲
- 节点状态（计划中/写作中/已完成）
- 目标字数和实际字数
- 完成度百分比
- 统计信息（总节点数、卷数、章节数等）

**使用示例：**
```typescript
import { OutlineExportService } from '@/services/outline';

// 导出为 Markdown 字符串
const markdown = OutlineExportService.exportToMarkdown(
  novel.outlineNodes,
  novel.title
);

// 直接下载文件
OutlineExportService.downloadMarkdown(novel.outlineNodes, novel.title);

// 导出为 HTML（带样式）
const html = OutlineExportService.exportToHTML(
  novel.outlineNodes,
  novel.title
);

// 导出为 JSON（结构化数据）
const json = OutlineExportService.exportToJSON(
  novel.outlineNodes,
  novel.title
);
```

---

### 5. 大纲统计功能 (OutlineStatsService)

**功能描述：** 统计大纲的总字数、完成度、进度等信息，提供数据分析。

**核心方法：**
```typescript
// 计算整体统计
OutlineStatsService.calculate(nodes)

// 计算单个节点的详细统计
OutlineStatsService.calculateNodeStats(node, allNodes)

// 计算卷的统计信息
OutlineStatsService.calculateVolumeStats(volumeNode, allNodes)

// 计算所有卷的统计
OutlineStatsService.calculateAllVolumesStats(nodes)

// 生成进度报告
OutlineStatsService.generateProgressReport(nodes)

// 计算写作速度
OutlineStatsService.calculateWritingSpeed(nodes)

// 生成统计摘要文本
OutlineStatsService.generateSummaryText(nodes)

// 导出统计数据为 CSV
OutlineStatsService.exportStatsToCSV(nodes)

// 比较两个时间点的统计
OutlineStatsService.compareStats(oldNodes, newNodes)
```

**统计数据包含：**
- 总节点数
- 按类型统计（卷/章节/场景）
- 按状态统计（计划中/写作中/已完成）
- 目标字数和实际字数
- 完成度百分比
- 关联状态（已关联/未关联章节）
- 写作速度（日均字数、周均章节）
- 预计完成时间

**使用示例：**
```typescript
import { OutlineStatsService } from '@/services/outline';

// 获取整体统计
const stats = OutlineStatsService.calculate(novel.outlineNodes);
console.log(`总节点数: ${stats.totalNodes}`);
console.log(`完成度: ${stats.completionRate}%`);
console.log(`已完成章节: ${stats.chaptersCompleted}`);

// 生成进度报告
const report = OutlineStatsService.generateProgressReport(novel.outlineNodes);
console.log('各卷进度:', report.volumes);
console.log('最近活动:', report.recentActivity);

// 计算写作速度
const speed = OutlineStatsService.calculateWritingSpeed(novel.outlineNodes);
console.log(`日均字数: ${speed.wordsPerDay}`);
console.log(`预计完成: ${speed.estimatedCompletionDays} 天`);

// 生成摘要文本
const summary = OutlineStatsService.generateSummaryText(novel.outlineNodes);
console.log(summary);
```

---

## 数据结构扩展

为了支持这些功能，`OutlineNode` 接口已扩展以下字段（通过类型断言使用）：

```typescript
interface OutlineNode {
  // ... 现有字段
  chapterId?: string;        // 关联的章节 ID
  targetWords?: number;      // 目标字数
  actualWords?: number;      // 实际字数
  completionRate?: number;   // 完成度（0-100）
}
```

---

## 测试覆盖

所有 5 个服务都有完整的单元测试：

- `OutlineTemplateService.test.ts` - 14 个测试
- `OutlineChapterLinkService.test.ts` - 20 个测试
- `OutlineToChapterService.test.ts` - 17 个测试
- `OutlineStatsService.test.ts` - 21 个测试

**总计：72 个测试，全部通过 ✅**

运行测试：
```bash
npm test -- src/services/outline/__tests__
```

---

## 集成指南

### 1. 导入服务

```typescript
import {
  OutlineTemplateService,
  OutlineChapterLinkService,
  OutlineToChapterService,
  OutlineExportService,
  OutlineStatsService
} from '@/services/outline';
```

### 2. 在 UI 组件中使用

**大纲模板选择器：**
```typescript
const templates = OutlineTemplateService.getTemplates();

// 渲染模板列表
templates.map(template => (
  <TemplateCard
    key={template.id}
    template={template}
    onApply={() => {
      const nodes = OutlineTemplateService.applyTemplate(template, novel.id);
      updateNovel({ ...novel, outlineNodes: nodes });
    }}
  />
));
```

**章节关联面板：**
```typescript
const unlinkedNodes = OutlineChapterLinkService.getUnlinkedNodes(novel.outlineNodes);
const unlinkedChapters = OutlineChapterLinkService.getUnlinkedChapters(
  novel.chapters,
  novel.outlineNodes
);

// 渲染关联界面
<LinkPanel
  nodes={unlinkedNodes}
  chapters={unlinkedChapters}
  onLink={(nodeId, chapterId) => {
    const updated = OutlineChapterLinkService.linkChapter(nodeId, chapterId, novel);
    updateNovel(updated);
  }}
/>
```

**一键生成章节按钮：**
```typescript
const handleGenerateChapters = () => {
  const result = OutlineToChapterService.batchGenerateAndLinkChapters(
    novel.outlineNodes,
    novel
  );
  
  updateNovel(result.updatedNovel);
  showNotification(`成功生成 ${result.chapters.length} 个章节`);
};
```

**导出大纲按钮：**
```typescript
const handleExport = (format: 'markdown' | 'html' | 'json' | 'txt') => {
  switch (format) {
    case 'markdown':
      OutlineExportService.downloadMarkdown(novel.outlineNodes, novel.title);
      break;
    case 'html':
      OutlineExportService.downloadHTML(novel.outlineNodes, novel.title);
      break;
    case 'json':
      OutlineExportService.downloadJSON(novel.outlineNodes, novel.title);
      break;
    case 'txt':
      OutlineExportService.downloadPlainText(novel.outlineNodes, novel.title);
      break;
  }
};
```

**统计仪表盘：**
```typescript
const stats = OutlineStatsService.calculate(novel.outlineNodes);
const speed = OutlineStatsService.calculateWritingSpeed(novel.outlineNodes);

<StatsDashboard>
  <StatCard title="完成度" value={`${stats.completionRate}%`} />
  <StatCard title="已完成章节" value={stats.chaptersCompleted} />
  <StatCard title="日均字数" value={speed.wordsPerDay} />
  <StatCard title="预计完成" value={`${speed.estimatedCompletionDays} 天`} />
</StatsDashboard>
```

---

## 工作流示例

### 完整的大纲创作流程

```typescript
// 1. 选择模板
const template = OutlineTemplateService.getTemplateById('webnovel-shuangwen');
const nodes = OutlineTemplateService.applyTemplate(template, novel.id);

// 2. 更新小说
let updatedNovel = { ...novel, outlineNodes: nodes };

// 3. 生成章节
const genResult = OutlineToChapterService.batchGenerateAndLinkChapters(
  updatedNovel.outlineNodes,
  updatedNovel
);
updatedNovel = genResult.updatedNovel;

// 4. 同步状态（在用户写作后）
updatedNovel = OutlineChapterLinkService.syncChapterStatus(updatedNovel);

// 5. 查看统计
const stats = OutlineStatsService.calculate(updatedNovel.outlineNodes);
console.log(`完成度: ${stats.completionRate}%`);

// 6. 导出大纲
OutlineExportService.downloadMarkdown(updatedNovel.outlineNodes, novel.title);
```

---

## 注意事项

1. **类型安全：** 扩展字段（targetWords、actualWords 等）需要通过类型断言使用
2. **数据同步：** 记得在章节内容变化后调用 `syncChapterStatus` 同步状态
3. **关联验证：** 定期调用 `validateLinks` 检查关联完整性
4. **性能优化：** 大量节点时，统计计算可能较慢，考虑缓存结果

---

## 未来扩展

可以考虑添加的功能：

1. **AI 辅助大纲生成** - 根据小说类型和简介自动生成大纲
2. **大纲版本控制** - 保存大纲的历史版本
3. **协作编辑** - 多人同时编辑大纲
4. **甘特图视图** - 可视化展示写作进度
5. **大纲模板市场** - 用户分享和下载自定义模板

---

## 文件结构

```
src/services/outline/
├── OutlineTemplateService.ts          # 模板系统
├── OutlineChapterLinkService.ts       # 章节关联
├── OutlineToChapterService.ts         # 生成章节
├── OutlineExportService.ts            # 导出功能
├── OutlineStatsService.ts             # 统计功能
├── index.ts                           # 统一导出
└── __tests__/
    ├── OutlineTemplateService.test.ts
    ├── OutlineChapterLinkService.test.ts
    ├── OutlineToChapterService.test.ts
    └── OutlineStatsService.test.ts
```

---

## 更新日志

**2024-02-09**
- ✅ 实现大纲模板系统（6种预设模板）
- ✅ 实现章节关联功能（双向关联、自动匹配）
- ✅ 实现一键生成章节（批量生成、自动关联）
- ✅ 实现大纲导出功能（Markdown、HTML、JSON、TXT）
- ✅ 实现大纲统计功能（进度报告、写作速度）
- ✅ 编写完整的单元测试（72个测试全部通过）
- ✅ 编写开发文档和使用指南
