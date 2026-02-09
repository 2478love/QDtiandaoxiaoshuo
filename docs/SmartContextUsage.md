# 智能续写系统优化 - 使用示例

## 🎯 快速开始

### 示例 1：基础使用

```typescript
import { ContinueWritingService } from '@/services/ai/ContinueWritingService';
import { Novel, Chapter } from '@/types';

// 准备数据
const novel: Novel = {
  id: 'novel-001',
  title: '修仙传奇',
  // ... 包含 characters, worldviews, foreshadowings 等
};

const currentChapter: Chapter = {
  id: 'chapter-020',
  title: '第二十章 突破在即',
  content: '...',
  wordCount: 3000
};

const recentContent = `
林风深吸一口气，开始运转功法。
灵气如同百川归海般涌入丹田。
"就是现在！"林风心中一动，全力冲击筑基期的瓶颈。
`;

// 生成续写
const results = await ContinueWritingService.generateWithSmartContext(
  novel,
  currentChapter,
  recentContent,
  {
    style: 'plot',      // 情节推进
    length: 300,        // 目标长度 300 字
    count: 3,           // 生成 3 个方案
    temperature: 0.8
  }
);

// 使用结果
results.forEach((result, index) => {
  console.log(`方案 ${index + 1} (评分: ${result.score})`);
  console.log(result.text);
});
```

### 示例 2：不同风格的续写

```typescript
// 1. 情节推进风格 - 适合推动剧情发展
const plotResults = await ContinueWritingService.generateWithSmartContext(
  novel, currentChapter, recentContent,
  { style: 'plot', length: 300, count: 3 }
);

// 2. 对话补全风格 - 适合人物对话场景
const dialogueResults = await ContinueWritingService.generateWithSmartContext(
  novel, currentChapter, recentContent,
  { style: 'dialogue', length: 300, count: 3 }
);

// 3. 场景描写风格 - 适合环境氛围渲染
const descriptionResults = await ContinueWritingService.generateWithSmartContext(
  novel, currentChapter, recentContent,
  { style: 'description', length: 300, count: 3 }
);

// 4. 心理活动风格 - 适合内心独白
const psychologyResults = await ContinueWritingService.generateWithSmartContext(
  novel, currentChapter, recentContent,
  { style: 'psychology', length: 300, count: 3 }
);
```

### 示例 3：自定义上下文选项

```typescript
import { SmartContextBuilder } from '@/services/ai/SmartContextBuilder';

// 只包含核心设定，不包含 RAG 检索
const coreContext = await SmartContextBuilder.build(
  novel,
  currentChapter,
  recentContent,
  {
    includeWorldview: true,
    includeCharacters: true,
    includeForeshadowing: false,
    includeRag: false,
    recentContentLength: 2000
  }
);

// 查看上下文统计
const stats = SmartContextBuilder.getContextStats(coreContext);
console.log('总长度:', stats.totalLength);
console.log('各部分长度:', stats.sections);
```

### 示例 4：在 React 组件中使用

```typescript
import React, { useState } from 'react';
import { ContinueWritingService } from '@/services/ai/ContinueWritingService';
import { useNovelStore } from '@/store/novelStore';

export const ContinueWritingPanel: React.FC = () => {
  const { currentNovel, currentChapter } = useNovelStore();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (style: string) => {
    setLoading(true);
    try {
      // 获取最近 3000 字内容
      const recentContent = currentChapter.content.slice(-3000);
      
      const results = await ContinueWritingService.generateWithSmartContext(
        currentNovel,
        currentChapter,
        recentContent,
        {
          style: style as any,
          length: 300,
          count: 3
        }
      );
      
      setResults(results);
    } catch (error) {
      console.error('生成失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="style-buttons">
        <button onClick={() => handleGenerate('plot')}>情节推进</button>
        <button onClick={() => handleGenerate('dialogue')}>对话补全</button>
        <button onClick={() => handleGenerate('description')}>场景描写</button>
        <button onClick={() => handleGenerate('psychology')}>心理活动</button>
      </div>
      
      {loading && <div>生成中...</div>}
      
      <div className="results">
        {results.map((result, index) => (
          <div key={result.id} className="result-item">
            <div className="score">评分: {result.score.toFixed(2)}</div>
            <div className="text">{result.text}</div>
            <button onClick={() => insertToChapter(result.text)}>
              采用此方案
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 示例 5：RAG 索引管理

```typescript
import { ragService } from '@/services/rag/RagService';

// 索引整本小说（首次使用或更新时）
const indexNovel = (novel: Novel) => {
  const chapters = novel.chapters || [];
  ragService.indexNovel(novel.id, chapters);
  console.log('索引完成');
};

// 索引单个章节（章节更新时）
const indexChapter = (novelId: string, chapter: Chapter) => {
  ragService.indexChapter(
    novelId,
    chapter.id,
    chapter.title,
    chapter.content
  );
};

// 查看索引统计
const stats = ragService.getNovelMemoryStats(novel.id);
console.log('总记忆条目:', stats.totalEntries);
console.log('已索引章节:', stats.chapters);

// 清除小说索引
ragService.deleteNovelMemory(novel.id);
```

## 🎨 实际应用场景

### 场景 1：作者写作卡壳时

```typescript
// 作者写到一半卡住了，需要灵感
const recentContent = getCurrentChapterContent(); // 获取当前已写内容

// 生成多个不同风格的续写方案供选择
const plotIdeas = await ContinueWritingService.generateWithSmartContext(
  novel, currentChapter, recentContent,
  { style: 'plot', length: 500, count: 5 }
);

// 展示给作者选择或参考
showSuggestions(plotIdeas);
```

### 场景 2：需要回收伏笔时

```typescript
// 系统会自动在上下文中包含待回收的伏笔
// AI 生成的续写会考虑这些伏笔

const context = await SmartContextBuilder.build(
  novel,
  currentChapter,
  recentContent,
  {
    includeForeshadowing: true,  // 确保包含伏笔信息
    includeRag: true             // 检索相关历史章节
  }
);

// 上下文中会显示：
// 待回收伏笔：
// ⚠️ 神秘玉佩: 林风从小佩戴的玉佩...
// AI 会在续写中考虑回收这个伏笔
```

### 场景 3：长篇小说续写

```typescript
// 对于百万字长篇小说，RAG 检索特别重要
const novel = {
  id: 'long-novel',
  wordCount: 1000000,  // 100 万字
  chapters: [...],      // 1000+ 章节
  // ...
};

// 智能上下文会：
// 1. 提取核心设定（世界观、主要人物）
// 2. RAG 检索相关历史章节（避免遗忘前文）
// 3. 包含当前状态和待回收伏笔

const results = await ContinueWritingService.generateWithSmartContext(
  novel,
  currentChapter,
  recentContent,
  {
    style: 'plot',
    length: 500,
    count: 3,
    // 系统会自动处理长篇小说的上下文
  }
);
```

## 📊 性能建议

### 1. 定期索引

```typescript
// 在章节保存时自动索引
const onChapterSave = (chapter: Chapter) => {
  // 保存章节
  saveChapter(chapter);
  
  // 异步索引，不阻塞保存
  setTimeout(() => {
    ragService.indexChapter(
      novel.id,
      chapter.id,
      chapter.title,
      chapter.content
    );
  }, 0);
};
```

### 2. 控制上下文长度

```typescript
// 根据 AI 模型的 token 限制调整
const contextOptions = {
  recentContentLength: 2000,  // 减少最近内容长度
  ragTopK: 5,                 // 减少 RAG 检索数量
};

// 对于 token 限制较小的模型
const shortContext = await SmartContextBuilder.build(
  novel, currentChapter, recentContent,
  {
    ...contextOptions,
    includeWorldview: true,
    includeCharacters: true,
    includeForeshadowing: false,  // 暂时关闭伏笔
  }
);
```

### 3. 缓存优化

```typescript
// 缓存最近构建的上下文
let cachedContext: string | null = null;
let cachedChapterId: string | null = null;

const getContext = async (novel, chapter, recentContent) => {
  // 如果章节未变化，使用缓存
  if (cachedChapterId === chapter.id && cachedContext) {
    return cachedContext;
  }
  
  // 构建新上下文
  cachedContext = await SmartContextBuilder.build(
    novel, chapter, recentContent
  );
  cachedChapterId = chapter.id;
  
  return cachedContext;
};
```

## 🔧 调试技巧

```typescript
// 查看生成的上下文
const context = await SmartContextBuilder.build(
  novel, currentChapter, recentContent
);

console.log('=== 生成的上下文 ===');
console.log(context);

// 查看统计信息
const stats = SmartContextBuilder.getContextStats(context);
console.log('\n=== 统计信息 ===');
console.log('总长度:', stats.totalLength);
stats.sections.forEach(section => {
  console.log(`${section.name}: ${section.length} 字符`);
});

// 检查 RAG 检索结果
const ragResults = ragService.searchContext(recentContent, novel.id, 10);
console.log('\n=== RAG 检索结果 ===');
ragResults.forEach(r => {
  console.log(`[${r.entry.chapterTitle}] 相似度: ${r.score.toFixed(3)}`);
  console.log(r.entry.content.slice(0, 100));
});
```

## 🎉 完成！

智能续写系统已经完全集成到项目中，可以开始使用了！
