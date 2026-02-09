/**
 * @fileoverview ContinueWritingService 集成测试
 * @description 测试智能上下文与续写服务的集成
 */

import { ContinueWritingService } from '../src/services/ai/ContinueWritingService';
import { SmartContextBuilder } from '../src/services/ai/SmartContextBuilder';
import { Novel, Chapter } from '../src/types';
import { ragService } from '../src/services/rag/RagService';

// 使用之前的测试数据
const mockNovel: Novel = {
  id: 'test-novel-001',
  title: '修仙传奇',
  description: '一个关于修仙的故事',
  wordCount: 100000,
  status: 'ongoing',
  updatedAt: '2024-02-09',
  tags: ['修仙', '玄幻'],
  characters: [
    {
      id: 'char-001',
      name: '林风',
      role: '主角',
      description: '天赋异禀的修仙者，性格坚毅，不畏强权。',
      traits: ['坚毅', '聪慧', '重情义'],
      createdAt: '2024-01-01'
    },
    {
      id: 'char-002',
      name: '苏婉儿',
      role: '主要配角',
      description: '天剑宗圣女，冰清玉洁，剑道天才。',
      traits: ['高冷', '剑道天才', '心地善良'],
      createdAt: '2024-01-01'
    }
  ],
  worldviews: [
    {
      id: 'world-001',
      title: '修炼体系',
      category: '力量体系',
      content: '修仙分为九个大境界：炼气、筑基、金丹、元婴、化神、炼虚、合体、大乘、渡劫。',
      createdAt: '2024-01-01'
    }
  ],
  foreshadowings: [
    {
      id: 'fore-001',
      title: '神秘玉佩',
      description: '林风从小佩戴的玉佩，在关键时刻会发出微光。',
      plantedChapterId: 'chapter-001',
      status: 'planted',
      importance: 'high',
      relatedCharacters: ['char-001'],
      notes: '核心伏笔',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
  ]
};

const mockChapter: Chapter = {
  id: 'chapter-020',
  title: '第二十章 突破在即',
  content: '林风盘坐在洞府之中，周身灵气涌动。',
  wordCount: 3000,
  volumeId: 'volume-001'
};

const mockRecentContent = `林风深吸一口气，开始运转功法。灵气如同百川归海般涌入丹田。

"就是现在！"林风心中一动，全力冲击筑基期的瓶颈。

轰！一声巨响在识海中炸开，林风感觉到一股前所未有的力量在体内涌动。

就在这时，洞府外传来一阵急促的脚步声。

"林师兄，不好了！魔道大军攻打山门，宗主召集所有弟子应战！"`;

async function testContinueWritingIntegration() {
  console.log('=== 测试 ContinueWritingService 与 SmartContext 集成 ===\n');

  // 先索引一些章节用于 RAG
  const testChapters = [
    {
      id: 'chapter-001',
      title: '第一章 初入修仙界',
      content: '林风从小生活在青山村。那一天，一位白衣老者路过村庄，发现了林风的修仙天赋。'
    },
    {
      id: 'chapter-010',
      title: '第十章 初遇苏婉儿',
      content: '试炼之地，林风遇到了一位白衣女子。她剑眉星目，气质出尘。"你就是林风？"女子冷冷地问道。'
    }
  ];

  ragService.indexNovel(mockNovel.id, testChapters);

  // 测试1：使用智能上下文生成续写
  console.log('【测试1】使用智能上下文生成续写（情节推进风格）');
  console.log('-'.repeat(60));

  const results1 = await ContinueWritingService.generateWithSmartContext(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      style: 'plot',
      length: 300,
      count: 3,
      temperature: 0.8
    }
  );

  console.log(`生成了 ${results1.length} 个续写方案：\n`);
  results1.forEach((result, index) => {
    console.log(`方案 ${index + 1} (评分: ${result.score.toFixed(2)}):`);
    console.log(result.text);
    console.log('-'.repeat(60));
  });

  // 测试2：对话风格
  console.log('\n【测试2】对话风格续写');
  console.log('-'.repeat(60));

  const results2 = await ContinueWritingService.generateWithSmartContext(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      style: 'dialogue',
      length: 300,
      count: 2
    }
  );

  results2.forEach((result, index) => {
    console.log(`方案 ${index + 1} (评分: ${result.score.toFixed(2)}):`);
    console.log(result.text);
    console.log('-'.repeat(60));
  });

  // 测试3：心理活动风格
  console.log('\n【测试3】心理活动风格续写');
  console.log('-'.repeat(60));

  const results3 = await ContinueWritingService.generateWithSmartContext(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      style: 'psychology',
      length: 300,
      count: 2
    }
  );

  results3.forEach((result, index) => {
    console.log(`方案 ${index + 1} (评分: ${result.score.toFixed(2)}):`);
    console.log(result.text);
    console.log('-'.repeat(60));
  });

  // 测试4：场景描写风格
  console.log('\n【测试4】场景描写风格续写');
  console.log('-'.repeat(60));

  const results4 = await ContinueWritingService.generateWithSmartContext(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      style: 'description',
      length: 300,
      count: 2
    }
  );

  results4.forEach((result, index) => {
    console.log(`方案 ${index + 1} (评分: ${result.score.toFixed(2)}):`);
    console.log(result.text);
    console.log('-'.repeat(60));
  });

  console.log('\n=== 集成测试完成 ===');
}

// 运行测试
testContinueWritingIntegration().catch(console.error);
