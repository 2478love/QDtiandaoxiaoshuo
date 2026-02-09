# 大纲功能使用示例

本文档提供大纲功能的实际使用示例和最佳实践。

## 快速开始

### 示例 1：使用三幕式模板创建小说大纲

```typescript
import { OutlineTemplateService } from '@/services/outline';

// 1. 获取三幕式模板
const template = OutlineTemplateService.getTemplateById('three-act');

// 2. 应用到小说
const outlineNodes = OutlineTemplateService.applyTemplate(template, novel.id);

// 3. 更新小说
const updatedNovel = {
  ...novel,
  outlineNodes
};

// 结果：自动生成 3 个卷（开端、对抗、结局）和 12 个章节
console.log(`生成了 ${outlineNodes.length} 个大纲节点`);
```

### 示例 2：网文爽文快速起步

```typescript
import { OutlineTemplateService, OutlineToChapterService } from '@/services/outline';

// 1. 应用网文爽文模板
const template = OutlineTemplateService.getTemplateById('webnovel-shuangwen');
const nodes = OutlineTemplateService.applyTemplate(template, novel.id);

// 2. 一键生成所有章节
const result = OutlineToChapterService.generateFullStructure(nodes, novel);

// 3. 更新小说
const updatedNovel = {
  ...novel,
  outlineNodes: result.updatedNovel.outlineNodes,
  volumes: result.updatedNovel.volumes,
  chapters: result.updatedNovel.chapters
};

console.log(`生成了 ${result.volumes.length} 卷`);
console.log(`生成了 ${result.chapters.length} 章`);
// 输出：生成了 5 卷，生成了 15 章
```

### 示例 3：玄幻修仙小说

```typescript
import { OutlineTemplateService } from '@/services/outline';

// 应用玄幻修仙模板
const template = OutlineTemplateService.getTemplateById('xuanhuan-xiuxian');
const nodes = OutlineTemplateService.applyTemplate(template, novel.id);

// 模板包含：凡人篇、修炼篇（炼气、筑基、金丹、元婴、化神）、飞升篇
// 非常适合修仙题材的小说
```

---

## 章节关联工作流

### 示例 4：自动关联已有章节

```typescript
import { OutlineChapterLinkService } from '@/services/outline';

// 场景：你已经写了一些章节，现在想关联到大纲

// 1. 自动匹配标题相同的章节
const linkedNovel = OutlineChapterLinkService.autoLinkChapters(novel);

// 2. 同步章节状态（更新字数和完成度）
const syncedNovel = OutlineChapterLinkService.syncChapterStatus(linkedNovel);

// 3. 检查未关联的内容
const unlinkedNodes = OutlineChapterLinkService.getUnlinkedNodes(syncedNovel.outlineNodes);
const unlinkedChapters = OutlineChapterLinkService.getUnlinkedChapters(
  syncedNovel.chapters,
  syncedNovel.outlineNodes
);

console.log(`还有 ${unlinkedNodes.length} 个大纲节点未关联`);
console.log(`还有 ${unlinkedChapters.length} 个章节未关联`);
```

### 示例 5：手动关联特定章节

```typescript
import { OutlineChapterLinkService } from '@/services/outline';

// 手动关联大纲节点和章节
let novel = OutlineChapterLinkService.linkChapter(
  'outline_node_1',
  'chapter_1',
  novel
);

novel = OutlineChapterLinkService.linkChapter(
  'outline_node_2',
  'chapter_2',
  novel
);

// 同步状态
novel = OutlineChapterLinkService.syncChapterStatus(novel);
```

### 示例 6：验证和修复关联

```typescript
import { OutlineChapterLinkService } from '@/services/outline';

// 验证关联完整性
const validation = OutlineChapterLinkService.validateLinks(novel);

if (!validation.valid) {
  console.log('发现问题：');
  
  // 断开的关联（章节已删除）
  validation.brokenLinks.forEach(link => {
    console.log(`节点 "${link.nodeTitle}" 关联的章节 ${link.chapterId} 不存在`);
  });
  
  // 重复的关联（多个节点关联同一章节）
  validation.duplicateLinks.forEach(dup => {
    console.log(`章节 ${dup.chapterId} 被 ${dup.nodeIds.length} 个节点关联`);
  });
  
  // 自动修复断开的关联
  const fixed = OutlineChapterLinkService.fixBrokenLinks(novel);
  console.log('已清除断开的关联');
}
```

---

## 生成章节工作流

### 示例 7：从大纲生成单个章节

```typescript
import { OutlineToChapterService } from '@/services/outline';

// 选择一个大纲节点
const outlineNode = novel.outlineNodes.find(n => n.title === '第一章');

// 生成章节并自动关联
const result = OutlineToChapterService.generateAndLinkChapter(outlineNode, novel);

// 生成的章节内容示例：
/*
# 第一章

<!-- 大纲：主角登场，展示平凡生活 -->
<!-- 目标字数：3000 -->
<!-- 相关信息：
主要人物：张三、李四
力量体系：修仙体系
-->

【此处开始写作】
*/

console.log('生成的章节:', result.chapter);
```

### 示例 8：批量生成所有未关联的章节

```typescript
import { OutlineToChapterService } from '@/services/outline';

// 批量生成并关联
const result = OutlineToChapterService.batchGenerateAndLinkChapters(
  novel.outlineNodes,
  novel
);

// 更新小说
const updatedNovel = result.updatedNovel;

console.log(`成功生成 ${result.chapters.length} 个章节`);

// 可以立即开始写作
result.chapters.forEach(chapter => {
  console.log(`- ${chapter.title}`);
});
```

### 示例 9：生成章节大纲（不生成完整章节）

```typescript
import { OutlineToChapterService } from '@/services/outline';

// 只生成章节的大纲部分，用于规划
const outlineNode = novel.outlineNodes.find(n => n.title === '第一章');
const chapterOutline = OutlineToChapterService.generateChapterOutline(outlineNode, novel);

console.log(chapterOutline);
/*
## 第一章

**大纲：** 主角登场，展示平凡生活

**场景安排：**
1. 开场场景
   - 主角出场
2. 日常生活
   - 展示主角的工作

**目标字数：** 3000
*/
```

---

## 导出大纲

### 示例 10：导出为 Markdown

```typescript
import { OutlineExportService } from '@/services/outline';

// 导出为 Markdown 字符串
const markdown = OutlineExportService.exportToMarkdown(
  novel.outlineNodes,
  novel.title
);

// 或直接下载文件
OutlineExportService.downloadMarkdown(novel.outlineNodes, novel.title);
// 下载文件名：《我的小说》-大纲.md
```

### 示例 11：导出为 HTML（带样式）

```typescript
import { OutlineExportService } from '@/services/outline';

// 导出为 HTML（包含完整的样式）
const html = OutlineExportService.exportToHTML(
  novel.outlineNodes,
  novel.title
);

// 可以在浏览器中打开或打印
OutlineExportService.downloadHTML(novel.outlineNodes, novel.title);
```

### 示例 12：导出为 JSON（结构化数据）

```typescript
import { OutlineExportService } from '@/services/outline';

// 导出为 JSON（包含层级结构和统计信息）
const json = OutlineExportService.exportToJSON(
  novel.outlineNodes,
  novel.title
);

const data = JSON.parse(json);
console.log('大纲数据:', data.outline);
console.log('统计信息:', data.stats);
```

---

## 统计和分析

### 示例 13：查看整体统计

```typescript
import { OutlineStatsService } from '@/services/outline';

const stats = OutlineStatsService.calculate(novel.outlineNodes);

console.log('=== 大纲统计 ===');
console.log(`总节点数: ${stats.totalNodes}`);
console.log(`卷数: ${stats.byType.volume || 0}`);
console.log(`章节数: ${stats.byType.chapter || 0}`);
console.log(`场景数: ${stats.byType.scene || 0}`);
console.log('');
console.log(`计划中: ${stats.chaptersPlanned} 章`);
console.log(`写作中: ${stats.chaptersWriting} 章`);
console.log(`已完成: ${stats.chaptersCompleted} 章`);
console.log('');
console.log(`目标字数: ${stats.targetWords.toLocaleString()} 字`);
console.log(`实际字数: ${stats.actualWords.toLocaleString()} 字`);
console.log(`完成度: ${stats.completionRate}%`);
```

### 示例 14：生成进度报告

```typescript
import { OutlineStatsService } from '@/services/outline';

const report = OutlineStatsService.generateProgressReport(novel.outlineNodes);

console.log('=== 进度报告 ===');
console.log('整体完成度:', report.overall.completionRate + '%');
console.log('');

console.log('各卷进度:');
report.volumes.forEach(vol => {
  console.log(`  ${vol.title}: ${vol.progress}% (${vol.completedChapters}/${vol.chapterCount})`);
});

console.log('');
console.log('最近活动:');
report.recentActivity.slice(0, 5).forEach(activity => {
  console.log(`  ${activity.nodeTitle} - ${activity.status}`);
});
```

### 示例 15：计算写作速度和预计完成时间

```typescript
import { OutlineStatsService } from '@/services/outline';

const speed = OutlineStatsService.calculateWritingSpeed(novel.outlineNodes);

console.log('=== 写作速度分析 ===');
console.log(`日均字数: ${speed.wordsPerDay.toLocaleString()} 字/天`);
console.log(`周均章节: ${speed.chaptersPerWeek} 章/周`);

if (speed.estimatedCompletionDays > 0) {
  console.log(`预计完成: ${speed.estimatedCompletionDays} 天后`);
  
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + speed.estimatedCompletionDays);
  console.log(`预计完成日期: ${completionDate.toLocaleDateString('zh-CN')}`);
}
```

### 示例 16：生成统计摘要文本

```typescript
import { OutlineStatsService } from '@/services/outline';

// 生成格式化的统计摘要
const summary = OutlineStatsService.generateSummaryText(novel.outlineNodes);

console.log(summary);
/*
📊 大纲统计摘要
────────────────────────────────────────

📚 结构统计：
  • 总节点数：25
  • 卷数：3
  • 章节数：20
  • 场景数：2

✍️ 写作进度：
  • 计划中：10 章
  • 写作中：5 章
  • 已完成：5 章

📝 字数统计：
  • 目标字数：60,000 字
  • 实际字数：15,000 字
  • 完成度：25%

🔗 关联状态：
  • 已关联章节：15
  • 未关联章节：5

⚡ 写作速度：
  • 日均字数：1,500 字/天
  • 周均章节：3 章/周
  • 预计完成：30 天后
*/
```

---

## 高级用例

### 示例 17：创建自定义模板

```typescript
import { OutlineTemplateService } from '@/services/outline';

// 从现有大纲创建自定义模板
const customTemplate = OutlineTemplateService.createCustomTemplate(
  '我的都市爽文模板',
  '适合都市题材的爽文结构',
  novel.outlineNodes
);

// 保存模板（需要实现持久化逻辑）
// saveCustomTemplate(customTemplate);

// 下次可以直接应用
const nodes = OutlineTemplateService.applyTemplate(customTemplate, newNovel.id);
```

### 示例 18：比较不同时间点的进度

```typescript
import { OutlineStatsService } from '@/services/outline';

// 保存上周的大纲快照
const lastWeekNodes = loadSnapshot('2024-02-02');
const currentNodes = novel.outlineNodes;

// 比较进度
const comparison = OutlineStatsService.compareStats(lastWeekNodes, currentNodes);

console.log('=== 本周进度 ===');
console.log(`新增字数: ${comparison.wordsDiff.toLocaleString()} 字`);
console.log(`完成度提升: ${comparison.completionDiff}%`);
console.log(`完成章节: ${comparison.chaptersCompletedDiff} 章`);
console.log(`新增节点: ${comparison.newNodesCount} 个`);
```

### 示例 19：导出统计数据为 CSV

```typescript
import { OutlineStatsService } from '@/services/outline';

// 导出为 CSV 格式，可以在 Excel 中打开
const csv = OutlineStatsService.exportStatsToCSV(novel.outlineNodes);

// 保存为文件
const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `${novel.title}-统计数据.csv`;
a.click();
```

### 示例 20：完整的写作工作流

```typescript
import {
  OutlineTemplateService,
  OutlineToChapterService,
  OutlineChapterLinkService,
  OutlineStatsService,
  OutlineExportService
} from '@/services/outline';

// 第一步：选择模板并应用
const template = OutlineTemplateService.getTemplateById('webnovel-shuangwen');
let novel = {
  ...originalNovel,
  outlineNodes: OutlineTemplateService.applyTemplate(template, originalNovel.id)
};

// 第二步：生成所有章节
const genResult = OutlineToChapterService.generateFullStructure(
  novel.outlineNodes,
  novel
);
novel = genResult.updatedNovel;

console.log(`✅ 生成了 ${genResult.volumes.length} 卷，${genResult.chapters.length} 章`);

// 第三步：开始写作（模拟）
// ... 用户写作 ...

// 第四步：同步状态
novel = OutlineChapterLinkService.syncChapterStatus(novel);

// 第五步：查看进度
const stats = OutlineStatsService.calculate(novel.outlineNodes);
console.log(`📊 当前完成度: ${stats.completionRate}%`);

const speed = OutlineStatsService.calculateWritingSpeed(novel.outlineNodes);
console.log(`⚡ 日均字数: ${speed.wordsPerDay} 字/天`);
console.log(`📅 预计完成: ${speed.estimatedCompletionDays} 天后`);

// 第六步：导出大纲
OutlineExportService.downloadMarkdown(novel.outlineNodes, novel.title);
console.log('✅ 大纲已导出');

// 第七步：生成进度报告
const summary = OutlineStatsService.generateSummaryText(novel.outlineNodes);
console.log(summary);
```

---

## React 组件示例

### 示例 21：模板选择器组件

```tsx
import React from 'react';
import { OutlineTemplateService } from '@/services/outline';

export const TemplateSelector: React.FC<{
  onSelect: (templateId: string) => void;
}> = ({ onSelect }) => {
  const templates = OutlineTemplateService.getTemplates();
  
  return (
    <div className="template-grid">
      {templates.map(template => (
        <div key={template.id} className="template-card">
          <h3>{template.name}</h3>
          <p>{template.description}</p>
          <span className="badge">{template.category}</span>
          <button onClick={() => onSelect(template.id)}>
            应用模板
          </button>
        </div>
      ))}
    </div>
  );
};
```

### 示例 22：统计仪表盘组件

```tsx
import React from 'react';
import { OutlineStatsService } from '@/services/outline';
import { Novel } from '@/types/novel';

export const StatsDashboard: React.FC<{ novel: Novel }> = ({ novel }) => {
  const stats = OutlineStatsService.calculate(novel.outlineNodes || []);
  const speed = OutlineStatsService.calculateWritingSpeed(novel.outlineNodes || []);
  
  return (
    <div className="stats-dashboard">
      <div className="stat-card">
        <h4>完成度</h4>
        <div className="stat-value">{stats.completionRate}%</div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
      
      <div className="stat-card">
        <h4>章节进度</h4>
        <div className="stat-value">
          {stats.chaptersCompleted} / {stats.byType.chapter || 0}
        </div>
        <div className="stat-detail">
          计划中: {stats.chaptersPlanned} | 写作中: {stats.chaptersWriting}
        </div>
      </div>
      
      <div className="stat-card">
        <h4>字数统计</h4>
        <div className="stat-value">
          {stats.actualWords.toLocaleString()} / {stats.targetWords.toLocaleString()}
        </div>
      </div>
      
      <div className="stat-card">
        <h4>写作速度</h4>
        <div className="stat-value">{speed.wordsPerDay.toLocaleString()}</div>
        <div className="stat-detail">字/天</div>
      </div>
      
      {speed.estimatedCompletionDays > 0 && (
        <div className="stat-card">
          <h4>预计完成</h4>
          <div className="stat-value">{speed.estimatedCompletionDays}</div>
          <div className="stat-detail">天后</div>
        </div>
      )}
    </div>
  );
};
```

---

## 最佳实践

### ✅ 推荐做法

1. **定期同步状态** - 在用户保存章节后调用 `syncChapterStatus`
2. **验证关联** - 在删除章节前检查关联，避免产生断开的关联
3. **缓存统计结果** - 统计计算可能较慢，考虑缓存结果
4. **使用自动关联** - 优先使用 `autoLinkChapters` 自动匹配
5. **导出备份** - 定期导出大纲作为备份

### ❌ 避免的做法

1. 不要直接修改 `outlineNodes` 数组，使用服务提供的方法
2. 不要忘记更新 `updatedAt` 时间戳
3. 不要在大量节点时频繁计算统计（使用防抖）
4. 不要跳过关联验证就删除章节

---

## 故障排查

### 问题：自动关联没有生效

**解决方案：**
```typescript
// 检查标题是否完全匹配（包括空格）
const node = novel.outlineNodes.find(n => n.title === '第一章');
const chapter = novel.chapters.find(c => c.title === '第一章');

console.log('节点标题:', `"${node?.title}"`);
console.log('章节标题:', `"${chapter?.title}"`);

// 如果标题不匹配，手动关联
if (node && chapter) {
  novel = OutlineChapterLinkService.linkChapter(node.id, chapter.id, novel);
}
```

### 问题：统计数据不准确

**解决方案：**
```typescript
// 确保先同步状态
novel = OutlineChapterLinkService.syncChapterStatus(novel);

// 然后再计算统计
const stats = OutlineStatsService.calculate(novel.outlineNodes);
```

### 问题：导出的文件乱码

**解决方案：**
```typescript
// 确保使用 UTF-8 编码
const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
```

---

## 总结

这些示例涵盖了大纲功能的所有主要用例。根据你的具体需求，可以组合使用这些功能来构建完整的写作工作流。

如有问题，请参考 `docs/OUTLINE_FEATURES.md` 中的详细文档。
