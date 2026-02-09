# 快速集成指南

## 📦 安装依赖

```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## 🚀 快速开始

### 1. 在 LongNovelEditor 中集成所有功能

```tsx
import React, { useState } from 'react';
import OutlineManagerEnhanced from './OutlineManager/OutlineManagerEnhanced';
import RealtimeWordCount from '../../ui/RealtimeWordCount';
import InspirationLibrary from '../../ui/InspirationLibrary';
import ContinueWritingPanel from '../../ui/ContinueWritingPanel';
import SaveStatusIndicator from '../../ui/SaveStatusIndicator';
import SpellCheckEditor from '../../ui/SpellCheckEditor';
import { useAutoSaveWithStatus } from '../../../hooks/useAutoSaveWithStatus';
import { StorageService } from '../../../services/storage/StorageService';

export const LongNovelEditor: React.FC = () => {
  // 状态管理
  const [content, setContent] = useState('');
  const [targetWords, setTargetWords] = useState(3000);
  const [outlineNodes, setOutlineNodes] = useState([]);
  const [showOutline, setShowOutline] = useState(false);
  const [showInspiration, setShowInspiration] = useState(false);
  const [showContinue, setShowContinue] = useState(false);

  // 自动保存
  const autoSave = useAutoSaveWithStatus(
    { content, outlineNodes, targetWords },
    async (data) => {
      await StorageService.saveNovel(data);
    },
    { 
      delay: 3000, 
      maxRetries: 3,
      onSaveSuccess: () => console.log('保存成功'),
      onSaveError: (error) => console.error('保存失败:', error)
    }
  );

  return (
    <div className="relative min-h-screen">
      {/* 工具栏 */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowOutline(true)}
              className="px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] flex items-center gap-2"
            >
              <span>📋</span>
              <span>大纲</span>
            </button>
            
            <button
              onClick={() => setShowInspiration(true)}
              className="px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] flex items-center gap-2"
            >
              <span>💡</span>
              <span>灵感</span>
            </button>
            
            <button
              onClick={() => setShowContinue(true)}
              className="px-4 py-2 bg-[#2C5F2D] text-white rounded-lg hover:bg-[#1E4620] flex items-center gap-2"
            >
              <span>✨</span>
              <span>续写</span>
            </button>
          </div>

          {/* 保存状态 */}
          <SaveStatusIndicator
            status={autoSave.status}
            lastSaveTime={autoSave.lastSaveTime}
            error={autoSave.error}
            onRetry={autoSave.retry}
            retryCount={autoSave.retryCount}
            maxRetries={autoSave.maxRetries}
          />
        </div>
      </div>

      {/* 编辑器 */}
      <div className="pt-20 px-6 pb-32">
        <SpellCheckEditor
          value={content}
          onChange={setContent}
          placeholder="开始你的创作..."
          minHeight="600px"
        />
      </div>

      {/* 实时字数统计 */}
      <RealtimeWordCount
        content={content}
        goal={targetWords}
        onGoalChange={setTargetWords}
      />

      {/* 大纲管理器 */}
      <OutlineManagerEnhanced
        isOpen={showOutline}
        onClose={() => setShowOutline(false)}
        outlineNodes={outlineNodes}
        onUpdateOutlineNodes={setOutlineNodes}
        chapters={[]}
        volumes={[]}
        novelTitle="我的小说"
        novelDescription="小说简介"
      />

      {/* 灵感库 */}
      <InspirationLibrary
        isOpen={showInspiration}
        onClose={() => setShowInspiration(false)}
        onApply={(text) => setContent(content + '\n' + text)}
      />

      {/* 智能续写 */}
      <ContinueWritingPanel
        isOpen={showContinue}
        onClose={() => setShowContinue(false)}
        context={content}
        onApply={(text) => setContent(content + '\n' + text)}
      />
    </div>
  );
};
```

## 📝 单独使用各个功能

### 1. 大纲管理器

```tsx
import OutlineManagerEnhanced from './components/features/OutlineManager/OutlineManagerEnhanced';

<OutlineManagerEnhanced
  isOpen={showOutline}
  onClose={() => setShowOutline(false)}
  outlineNodes={outlineNodes}
  onUpdateOutlineNodes={setOutlineNodes}
  chapters={chapters}
  volumes={volumes}
  novelTitle="小说标题"
  novelDescription="小说简介"
/>
```

### 2. 错别字检查编辑器

```tsx
import SpellCheckEditor from './components/ui/SpellCheckEditor';

<SpellCheckEditor
  value={content}
  onChange={setContent}
  placeholder="开始写作..."
  minHeight="400px"
/>
```

### 3. 实时字数统计

```tsx
import RealtimeWordCount from './components/ui/RealtimeWordCount';

<RealtimeWordCount
  content={content}
  goal={3000}
  onGoalChange={(newGoal) => setTargetWords(newGoal)}
/>
```

### 4. 灵感库

```tsx
import InspirationLibrary from './components/ui/InspirationLibrary';

<InspirationLibrary
  isOpen={showInspiration}
  onClose={() => setShowInspiration(false)}
  onApply={(text) => {
    // 应用灵感到编辑器
    setContent(content + text);
  }}
/>
```

### 5. 智能续写

```tsx
import ContinueWritingPanel from './components/ui/ContinueWritingPanel';

<ContinueWritingPanel
  isOpen={showContinue}
  onClose={() => setShowContinue(false)}
  context={content}
  onApply={(text) => {
    // 应用续写内容
    setContent(content + text);
  }}
/>
```

### 6. 自动保存

```tsx
import { useAutoSaveWithStatus } from './hooks/useAutoSaveWithStatus';
import SaveStatusIndicator from './components/ui/SaveStatusIndicator';

// 在组件中使用
const autoSave = useAutoSaveWithStatus(
  data,
  async (data) => {
    // 保存逻辑
    await saveToServer(data);
  },
  {
    delay: 3000,        // 3秒延迟
    maxRetries: 3,      // 最多重试3次
    retryDelay: 2000,   // 重试延迟2秒
    onSaveSuccess: () => {
      console.log('保存成功');
    },
    onSaveError: (error) => {
      console.error('保存失败:', error);
    }
  }
);

// 渲染状态指示器
<SaveStatusIndicator
  status={autoSave.status}
  lastSaveTime={autoSave.lastSaveTime}
  error={autoSave.error}
  onRetry={autoSave.retry}
  retryCount={autoSave.retryCount}
  maxRetries={autoSave.maxRetries}
/>

// 手动保存
<button onClick={autoSave.save}>手动保存</button>

// 恢复备份
const backup = autoSave.restoreBackup();
if (backup) {
  setData(backup);
  autoSave.clearBackup();
}
```

## 🎨 样式定制

所有组件都使用 Tailwind CSS，可以通过 className 属性自定义样式：

```tsx
<RealtimeWordCount
  content={content}
  goal={3000}
  className="custom-class"
/>
```

主题色：
- 主色：`#2C5F2D`
- 辅色：`#97BC62`
- 背景：`#F0F7F0`

## 🔧 服务层使用

### 错别字检查服务

```tsx
import { SpellCheckService } from './services/spellcheck/SpellCheckService';

// 检查文本
const errors = SpellCheckService.checkText(text);

// 应用修正
const corrected = SpellCheckService.applySuggestion(text, error, 0);

// 批量修正
const allCorrected = SpellCheckService.autoFixAll(text, errors);
```

### 灵感库服务

```tsx
import { InspirationService } from './services/inspiration/InspirationService';

// 获取所有卡片
const cards = InspirationService.getAllCards();

// 按类型筛选
const plotCards = InspirationService.getCardsByType('plot');

// 搜索
const results = InspirationService.searchCards('重逢');

// 随机获取
const randomCard = InspirationService.getRandomCard();
const randomCards = InspirationService.getRandomCards(3, 'plot');

// 获取所有类型
const types = InspirationService.getAllTypes();

// 获取所有标签
const tags = InspirationService.getAllTags();
```

### 智能续写服务

```tsx
import { ContinueWritingService } from './services/ai/ContinueWritingService';

// 生成多个方案
const results = await ContinueWritingService.generateMultiple(
  context,
  {
    style: 'plot',      // 'plot' | 'dialogue' | 'description' | 'psychology'
    length: 200,        // 续写字数
    count: 3            // 生成方案数
  }
);

// 获取所有风格
const styles = ContinueWritingService.getAllStyles();
```

## 🧪 测试示例

```tsx
// 测试错别字检查
const testText = "按装软件后，他感到很安心。";
const errors = SpellCheckService.checkText(testText);
console.log(errors); // 应该检测到"按装"错误

// 测试灵感库
const randomCard = InspirationService.getRandomCard('plot');
console.log(randomCard.title, randomCard.content);

// 测试续写
const results = await ContinueWritingService.generateMultiple(
  "主角走进了神秘的山洞...",
  { style: 'description', length: 150, count: 3 }
);
console.log(results.map(r => r.text));
```

## 📱 响应式支持

所有组件都支持响应式设计：

- 桌面端：完整功能
- 平板端：自适应布局
- 移动端：优化触摸交互

## ⚡ 性能优化建议

1. **大量节点时使用虚拟滚动**
```tsx
import { useVirtualizer } from '@tanstack/react-virtual';
```

2. **防抖输入**
```tsx
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  (value) => save(value),
  1000
);
```

3. **懒加载组件**
```tsx
const InspirationLibrary = lazy(() => import('./components/ui/InspirationLibrary'));
```

## 🐛 常见问题

### Q: 拖拽不工作？
A: 确保安装了 @dnd-kit 依赖包

### Q: 自动保存失败？
A: 检查 onSave 函数是否返回 Promise

### Q: 错别字检查不准确？
A: 可以扩展 SpellCheckService 中的词典

### Q: 续写内容不理想？
A: 当前使用模拟数据，集成真实 AI API 后会改善

## 📚 更多资源

- [完整文档](./WRITING_FEATURES_COMPLETION_REPORT.md)
- [演示页面](./writing-features-demo.html)
- [@dnd-kit 文档](https://docs.dndkit.com/)

## 💬 技术支持

如有问题，请查看：
1. 完整报告文档
2. 代码注释
3. TypeScript 类型定义

---

**最后更新：** 2026-02-09
**版本：** 1.0.0
