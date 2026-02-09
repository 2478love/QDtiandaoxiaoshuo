/**
 * @fileoverview SmartContextBuilder 测试文件
 * @description 测试智能上下文构建器的各项功能
 */

import { SmartContextBuilder } from '../src/services/ai/SmartContextBuilder';
import { Novel, Chapter, Character, Worldview, Foreshadowing } from '../src/types';
import { ragService } from '../src/services/rag/RagService';

// 模拟测试数据
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
      description: '天赋异禀的修仙者，性格坚毅，不畏强权。从小在山村长大，机缘巧合下踏上修仙之路。',
      traits: ['坚毅', '聪慧', '重情义'],
      createdAt: '2024-01-01'
    },
    {
      id: 'char-002',
      name: '苏婉儿',
      role: '主要配角',
      description: '天剑宗圣女，冰清玉洁，剑道天才。与林风相识于试炼之地，逐渐产生情愫。',
      traits: ['高冷', '剑道天才', '心地善良'],
      createdAt: '2024-01-01'
    },
    {
      id: 'char-003',
      name: '魔尊血影',
      role: '反派',
      description: '魔道巨擘，实力深不可测，野心勃勃，企图统治修仙界。',
      traits: ['狡诈', '强大', '野心勃勃'],
      createdAt: '2024-01-01'
    }
  ],
  worldviews: [
    {
      id: 'world-001',
      title: '修炼体系',
      category: '力量体系',
      content: '修仙分为九个大境界：炼气、筑基、金丹、元婴、化神、炼虚、合体、大乘、渡劫。每个境界又分为初期、中期、后期、圆满四个小境界。突破境界需要感悟天道，凝聚灵力。',
      createdAt: '2024-01-01'
    },
    {
      id: 'world-002',
      title: '修仙界格局',
      category: '社会结构',
      content: '修仙界由五大宗门统治：天剑宗、玄天宗、万佛寺、百花谷、天机阁。五大宗门维持着修仙界的秩序，共同对抗魔道势力。各宗门之间既有合作也有竞争。',
      createdAt: '2024-01-01'
    },
    {
      id: 'world-003',
      title: '灵气与灵脉',
      category: '力量体系',
      content: '天地间充满灵气，修仙者通过吸收灵气来提升修为。灵脉是灵气汇聚之地，分为下品、中品、上品、极品四个等级。拥有灵脉的地方往往成为各方争夺的焦点。',
      createdAt: '2024-01-01'
    }
  ],
  foreshadowings: [
    {
      id: 'fore-001',
      title: '神秘玉佩',
      description: '林风从小佩戴的玉佩，在关键时刻会发出微光，似乎隐藏着重大秘密。',
      plantedChapterId: 'chapter-001',
      plantedPosition: '第一章开头',
      status: 'planted',
      importance: 'high',
      relatedCharacters: ['char-001'],
      notes: '这是贯穿全书的核心伏笔，与主角身世有关',
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    },
    {
      id: 'fore-002',
      title: '血影的真实目的',
      description: '魔尊血影表面上要统治修仙界，但实际目的似乎另有所图。',
      plantedChapterId: 'chapter-015',
      plantedPosition: '第十五章中段',
      status: 'planted',
      importance: 'high',
      relatedCharacters: ['char-003'],
      notes: '后期揭示：血影在寻找上古传承',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-15'
    },
    {
      id: 'fore-003',
      title: '苏婉儿的身世',
      description: '苏婉儿对自己的身世讳莫如深，似乎隐藏着什么秘密。',
      plantedChapterId: 'chapter-010',
      plantedPosition: '第十章',
      status: 'planted',
      importance: 'medium',
      relatedCharacters: ['char-002'],
      notes: '与天剑宗的历史有关',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-10'
    }
  ]
};

const mockChapter: Chapter = {
  id: 'chapter-020',
  title: '第二十章 突破在即',
  content: '林风盘坐在洞府之中，周身灵气涌动。经过数月的苦修，他终于触摸到了筑基期的门槛。',
  wordCount: 3000,
  volumeId: 'volume-001'
};

const mockRecentContent = `林风深吸一口气，开始运转功法。灵气如同百川归海般涌入丹田，在体内形成一个巨大的漩涡。

"就是现在！"林风心中一动，全力冲击筑基期的瓶颈。

轰！

一声巨响在识海中炸开，林风感觉到一股前所未有的力量在体内涌动。他知道，自己成功了。

就在这时，洞府外传来一阵急促的脚步声。

"林师兄，不好了！魔道大军攻打山门，宗主召集所有弟子应战！"

林风猛地睁开眼睛，眼中闪过一道精光。他刚刚突破筑基期，正是大展身手的时候。

"来了！"林风一跃而起，推开洞府大门。

外面，天空已经被染成了血红色，无数魔修正在攻打宗门大阵。`;

// 测试函数
async function testSmartContextBuilder() {
  console.log('=== 开始测试 SmartContextBuilder ===\n');

  // 测试1：构建完整的三层上下文
  console.log('【测试1】构建完整的三层上下文');
  console.log('-'.repeat(50));
  
  const fullContext = await SmartContextBuilder.build(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      includeWorldview: true,
      includeCharacters: true,
      includeForeshadowing: true,
      includeRag: false, // 暂时关闭 RAG，因为没有索引数据
      recentContentLength: 3000,
      ragTopK: 10
    }
  );

  console.log('生成的上下文：\n');
  console.log(fullContext);
  console.log('\n');

  // 测试2：获取上下文统计
  console.log('【测试2】上下文统计信息');
  console.log('-'.repeat(50));
  
  const stats = SmartContextBuilder.getContextStats(fullContext);
  console.log('总长度:', stats.totalLength, '字符');
  console.log('各部分长度:');
  stats.sections.forEach(section => {
    console.log(`  - ${section.name}: ${section.length} 字符`);
  });
  console.log('\n');

  // 测试3：只包含核心设定
  console.log('【测试3】只包含核心设定');
  console.log('-'.repeat(50));
  
  const coreOnlyContext = await SmartContextBuilder.build(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      includeWorldview: true,
      includeCharacters: true,
      includeForeshadowing: false,
      includeRag: false,
      recentContentLength: 0
    }
  );

  console.log(coreOnlyContext);
  console.log('\n');

  // 测试4：段落完整性测试
  console.log('【测试4】段落完整性测试');
  console.log('-'.repeat(50));
  
  const shortContext = await SmartContextBuilder.build(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      includeWorldview: false,
      includeCharacters: false,
      includeForeshadowing: false,
      includeRag: false,
      recentContentLength: 200 // 限制长度，测试段落完整性
    }
  );

  console.log(shortContext);
  console.log('\n');

  // 测试5：RAG 检索测试（需要先索引数据）
  console.log('【测试5】RAG 检索测试');
  console.log('-'.repeat(50));
  
  // 先索引一些测试章节
  const testChapters = [
    {
      id: 'chapter-001',
      title: '第一章 初入修仙界',
      content: '林风从小生活在青山村，一个偏僻的小山村。他从未想过自己会踏上修仙之路。\n\n那一天，一位白衣老者路过村庄，发现了林风的修仙天赋。\n\n"孩子，你愿意跟我学习修仙吗？"老者问道。\n\n林风毫不犹豫地答应了。从此，他的命运彻底改变。'
    },
    {
      id: 'chapter-010',
      title: '第十章 初遇苏婉儿',
      content: '试炼之地，林风遇到了一位白衣女子。她剑眉星目，气质出尘。\n\n"你就是林风？"女子冷冷地问道。\n\n"正是在下。"林风拱手道。\n\n"我是天剑宗苏婉儿。听说你天赋不错，不如我们切磋一下？"'
    },
    {
      id: 'chapter-015',
      title: '第十五章 魔尊现身',
      content: '天空突然暗了下来，一股恐怖的威压笼罩全场。\n\n"桀桀桀……"阴森的笑声响起。\n\n一道血色身影从天而降，正是魔尊血影。\n\n"修仙界的蝼蚁们，颤抖吧！"血影狂笑道。\n\n林风感到一股前所未有的压力，这就是魔道巨擘的实力吗？'
    }
  ];

  ragService.indexNovel(mockNovel.id, testChapters);

  const ragContext = await SmartContextBuilder.build(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      includeWorldview: false,
      includeCharacters: false,
      includeForeshadowing: false,
      includeRag: true,
      recentContentLength: 0,
      ragTopK: 5
    }
  );

  console.log(ragContext);
  console.log('\n');

  // 测试6：完整上下文（包含 RAG）
  console.log('【测试6】完整上下文（包含 RAG）');
  console.log('-'.repeat(50));
  
  const fullContextWithRag = await SmartContextBuilder.build(
    mockNovel,
    mockChapter,
    mockRecentContent,
    {
      includeWorldview: true,
      includeCharacters: true,
      includeForeshadowing: true,
      includeRag: true,
      recentContentLength: 2000,
      ragTopK: 5
    }
  );

  console.log(fullContextWithRag);
  console.log('\n');

  const finalStats = SmartContextBuilder.getContextStats(fullContextWithRag);
  console.log('最终上下文统计:');
  console.log('总长度:', finalStats.totalLength, '字符');
  console.log('各部分长度:');
  finalStats.sections.forEach(section => {
    console.log(`  - ${section.name}: ${section.length} 字符`);
  });

  console.log('\n=== 测试完成 ===');
}

// 运行测试
testSmartContextBuilder().catch(console.error);
