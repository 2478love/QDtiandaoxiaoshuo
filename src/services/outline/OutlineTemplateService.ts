import { OutlineNode } from '../../types/novel';

export interface OutlineTemplate {
  id: string;
  name: string;
  description: string;
  category: 'classic' | 'webnovel' | 'genre';
  structure: OutlineTemplateNode[];
}

export interface OutlineTemplateNode {
  title: string;
  description: string;
  type: 'volume' | 'chapter' | 'scene';
  targetWords?: number;
  children?: OutlineTemplateNode[];
}

// 生成唯一ID
function createOutlineId(): string {
  return `outline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export class OutlineTemplateService {
  static getTemplates(): OutlineTemplate[] {
    return [
      {
        id: 'three-act',
        name: '三幕式结构',
        description: '经典的三幕式剧本结构，适合大多数故事类型',
        category: 'classic',
        structure: [
          {
            title: '第一幕：开端',
            description: '建立世界观，介绍主角，引发冲突（占全文25%）',
            type: 'volume',
            children: [
              { 
                title: '日常世界', 
                description: '展示主角的平凡生活，建立读者的情感连接', 
                type: 'chapter',
                targetWords: 3000
              },
              { 
                title: '激励事件', 
                description: '打破平衡的事件发生，主角被迫做出选择', 
                type: 'chapter',
                targetWords: 3000
              },
              { 
                title: '拒绝召唤', 
                description: '主角犹豫不决，展现内心挣扎', 
                type: 'chapter',
                targetWords: 2000
              },
              { 
                title: '跨越门槛', 
                description: '主角下定决心，踏上冒险之路', 
                type: 'chapter',
                targetWords: 2000
              },
            ]
          },
          {
            title: '第二幕：对抗',
            description: '主角面对挑战，经历成长（占全文50%）',
            type: 'volume',
            children: [
              { 
                title: '试炼与盟友', 
                description: '主角遇到帮手和敌人，学习新技能', 
                type: 'chapter',
                targetWords: 4000
              },
              { 
                title: '深入洞穴', 
                description: '主角接近目标，危险逐渐升级', 
                type: 'chapter',
                targetWords: 4000
              },
              { 
                title: '中点转折', 
                description: '重大转折点，主角获得关键信息或遭遇重大挫折', 
                type: 'chapter',
                targetWords: 5000
              },
              { 
                title: '磨难考验', 
                description: '主角面临最大的考验，几乎失败', 
                type: 'chapter',
                targetWords: 5000
              },
            ]
          },
          {
            title: '第三幕：结局',
            description: '高潮与结局，解决冲突（占全文25%）',
            type: 'volume',
            children: [
              { 
                title: '黑暗时刻', 
                description: '主角跌入谷底，似乎一切都失去了', 
                type: 'chapter',
                targetWords: 3000
              },
              { 
                title: '最终决战', 
                description: '主角重新振作，与反派展开最终对决', 
                type: 'chapter',
                targetWords: 5000
              },
              { 
                title: '回归日常', 
                description: '冲突解决，主角回归但已不同', 
                type: 'chapter',
                targetWords: 2000
              },
              { 
                title: '尾声', 
                description: '展示故事的长远影响，留下余韵', 
                type: 'chapter',
                targetWords: 2000
              },
            ]
          }
        ]
      },
      {
        id: 'five-act',
        name: '五幕式结构',
        description: '莎士比亚式的五幕结构，节奏更加细腻',
        category: 'classic',
        structure: [
          {
            title: '第一幕：铺垫',
            description: '介绍背景、人物和初始冲突',
            type: 'volume',
            children: [
              { title: '世界观建立', description: '展示故事发生的世界', type: 'chapter', targetWords: 3000 },
              { title: '人物登场', description: '主要角色依次出场', type: 'chapter', targetWords: 3000 },
            ]
          },
          {
            title: '第二幕：上升',
            description: '冲突逐渐升级，情节复杂化',
            type: 'volume',
            children: [
              { title: '矛盾激化', description: '各方势力开始碰撞', type: 'chapter', targetWords: 4000 },
              { title: '计划展开', description: '主角开始行动', type: 'chapter', targetWords: 4000 },
            ]
          },
          {
            title: '第三幕：高潮',
            description: '故事达到最高点，关键转折发生',
            type: 'volume',
            children: [
              { title: '巅峰对决', description: '最激烈的冲突爆发', type: 'chapter', targetWords: 5000 },
              { title: '重大转折', description: '意外事件改变局势', type: 'chapter', targetWords: 4000 },
            ]
          },
          {
            title: '第四幕：下降',
            description: '处理高潮后的后果，情节走向结局',
            type: 'volume',
            children: [
              { title: '余波处理', description: '应对高潮带来的影响', type: 'chapter', targetWords: 3000 },
              { title: '最后准备', description: '为最终结局做准备', type: 'chapter', targetWords: 3000 },
            ]
          },
          {
            title: '第五幕：结局',
            description: '解决所有冲突，给出最终答案',
            type: 'volume',
            children: [
              { title: '终局之战', description: '最后的对决', type: 'chapter', targetWords: 4000 },
              { title: '尘埃落定', description: '一切归于平静', type: 'chapter', targetWords: 2000 },
            ]
          }
        ]
      },
      {
        id: 'heros-journey',
        name: '英雄之旅（12步骤）',
        description: '约瑟夫·坎贝尔的经典英雄旅程模型',
        category: 'classic',
        structure: [
          { title: '1. 平凡世界', description: '英雄在日常生活中', type: 'chapter', targetWords: 2000 },
          { title: '2. 冒险召唤', description: '英雄接到挑战或任务', type: 'chapter', targetWords: 2000 },
          { title: '3. 拒绝召唤', description: '英雄因恐惧而犹豫', type: 'chapter', targetWords: 2000 },
          { title: '4. 遇见导师', description: '智者给予指导和装备', type: 'chapter', targetWords: 3000 },
          { title: '5. 跨越第一道门槛', description: '英雄进入特殊世界', type: 'chapter', targetWords: 3000 },
          { title: '6. 试炼、盟友与敌人', description: '英雄学习规则，结交朋友和敌人', type: 'chapter', targetWords: 4000 },
          { title: '7. 接近最深的洞穴', description: '英雄接近危险的核心', type: 'chapter', targetWords: 4000 },
          { title: '8. 磨难', description: '英雄面临死亡或最大恐惧', type: 'chapter', targetWords: 5000 },
          { title: '9. 奖赏', description: '英雄获得宝物或知识', type: 'chapter', targetWords: 3000 },
          { title: '10. 回归之路', description: '英雄踏上归途，但危险未除', type: 'chapter', targetWords: 4000 },
          { title: '11. 复活', description: '英雄经历最后的考验，获得重生', type: 'chapter', targetWords: 4000 },
          { title: '12. 带着灵药回归', description: '英雄回到平凡世界，但已改变', type: 'chapter', targetWords: 3000 },
        ]
      },
      {
        id: 'webnovel-shuangwen',
        name: '网文爽文结构',
        description: '适合网络爽文的节奏结构，强调打脸和升级',
        category: 'webnovel',
        structure: [
          {
            title: '开局篇',
            description: '废材逆袭的开端',
            type: 'volume',
            children: [
              { title: '废材设定', description: '主角被人看不起，处境艰难', type: 'chapter', targetWords: 3000 },
              { title: '奇遇/金手指', description: '主角获得逆天机缘', type: 'chapter', targetWords: 3000 },
              { title: '初露锋芒', description: '小试牛刀，震惊众人', type: 'chapter', targetWords: 3000 },
            ]
          },
          {
            title: '前期篇',
            description: '快速成长，建立势力',
            type: 'volume',
            children: [
              { title: '打脸装逼', description: '狠狠打脸曾经看不起自己的人', type: 'chapter', targetWords: 4000 },
              { title: '收服小弟', description: '建立自己的班底', type: 'chapter', targetWords: 3000 },
              { title: '美女倾心', description: '获得红颜知己', type: 'chapter', targetWords: 3000 },
              { title: '小有名气', description: '在小范围内声名鹊起', type: 'chapter', targetWords: 3000 },
            ]
          },
          {
            title: '中期篇',
            description: '进入更大舞台，面对强敌',
            type: 'volume',
            children: [
              { title: '宗门大比', description: '在大型比赛中崭露头角', type: 'chapter', targetWords: 5000 },
              { title: '秘境探险', description: '进入险地寻宝', type: 'chapter', targetWords: 5000 },
              { title: '强敌出现', description: '遇到真正的对手', type: 'chapter', targetWords: 4000 },
              { title: '绝境突破', description: '生死关头实力暴涨', type: 'chapter', targetWords: 4000 },
            ]
          },
          {
            title: '后期篇',
            description: '称霸一方，无敌天下',
            type: 'volume',
            children: [
              { title: '实力暴涨', description: '修为突飞猛进', type: 'chapter', targetWords: 4000 },
              { title: '碾压强敌', description: '轻松击败曾经的劲敌', type: 'chapter', targetWords: 4000 },
              { title: '称霸一方', description: '成为一方霸主', type: 'chapter', targetWords: 4000 },
            ]
          },
          {
            title: '结局篇',
            description: '巅峰对决，圆满结局',
            type: 'volume',
            children: [
              { title: '终极对决', description: '与最强敌人的最终决战', type: 'chapter', targetWords: 6000 },
              { title: '巅峰时刻', description: '达到实力巅峰', type: 'chapter', targetWords: 3000 },
              { title: '圆满结局', description: '功成名就，美人相伴', type: 'chapter', targetWords: 3000 },
            ]
          }
        ]
      },
      {
        id: 'xuanhuan-xiuxian',
        name: '玄幻修仙结构',
        description: '经典的修仙升级流结构',
        category: 'genre',
        structure: [
          {
            title: '凡人篇',
            description: '从凡人到修仙者的转变',
            type: 'volume',
            children: [
              { title: '出身平凡', description: '主角的凡人生活', type: 'chapter', targetWords: 3000 },
              { title: '获得机缘', description: '意外踏入修仙之路', type: 'chapter', targetWords: 3000 },
              { title: '踏入修仙', description: '正式开始修炼', type: 'chapter', targetWords: 3000 },
            ]
          },
          {
            title: '修炼篇',
            description: '逐步提升修为境界',
            type: 'volume',
            children: [
              { title: '炼气期', description: '初入修仙，炼气筑基', type: 'chapter', targetWords: 4000 },
              { title: '筑基期', description: '筑基成功，实力大增', type: 'chapter', targetWords: 4000 },
              { title: '金丹期', description: '凝结金丹，寿元大增', type: 'chapter', targetWords: 5000 },
              { title: '元婴期', description: '元婴出窍，神通广大', type: 'chapter', targetWords: 5000 },
              { title: '化神期', description: '化神境界，接近仙人', type: 'chapter', targetWords: 5000 },
            ]
          },
          {
            title: '飞升篇',
            description: '渡劫飞升，进入仙界',
            type: 'volume',
            children: [
              { title: '渡劫', description: '经历天劫考验', type: 'chapter', targetWords: 6000 },
              { title: '飞升', description: '成功飞升仙界', type: 'chapter', targetWords: 4000 },
              { title: '仙界征战', description: '在仙界开启新的征程', type: 'chapter', targetWords: 5000 },
            ]
          }
        ]
      },
      {
        id: 'mystery-detective',
        name: '悬疑推理结构',
        description: '适合悬疑推理类小说的结构',
        category: 'genre',
        structure: [
          { title: '案件发生', description: '神秘事件或谋杀案发生', type: 'chapter', targetWords: 3000 },
          { title: '初步调查', description: '侦探开始收集线索', type: 'chapter', targetWords: 3000 },
          { title: '嫌疑人登场', description: '多个嫌疑人浮出水面', type: 'chapter', targetWords: 4000 },
          { title: '线索梳理', description: '分析证据，推理案情', type: 'chapter', targetWords: 4000 },
          { title: '意外转折', description: '新的证据推翻之前的推论', type: 'chapter', targetWords: 4000 },
          { title: '真相逼近', description: '逐渐接近真相', type: 'chapter', targetWords: 4000 },
          { title: '凶手揭晓', description: '揭露真凶和作案手法', type: 'chapter', targetWords: 5000 },
          { title: '尾声', description: '案件收尾，余韵悠长', type: 'chapter', targetWords: 2000 },
        ]
      }
    ];
  }

  static getTemplateById(id: string): OutlineTemplate | undefined {
    return this.getTemplates().find(t => t.id === id);
  }

  static getTemplatesByCategory(category: OutlineTemplate['category']): OutlineTemplate[] {
    return this.getTemplates().filter(t => t.category === category);
  }

  static applyTemplate(template: OutlineTemplate, novelId: string): OutlineNode[] {
    const nodes: OutlineNode[] = [];
    let order = 0;

    const convertNode = (
      templateNode: OutlineTemplateNode,
      parentId?: string
    ): OutlineNode => {
      const node: OutlineNode = {
        id: createOutlineId(),
        title: templateNode.title,
        content: templateNode.description,
        type: templateNode.type,
        parentId,
        order: order++,
        status: 'planned',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      nodes.push(node);

      if (templateNode.children) {
        templateNode.children.forEach(child => {
          convertNode(child, node.id);
        });
      }

      return node;
    };

    template.structure.forEach(node => convertNode(node));

    return nodes;
  }

  // 自定义模板：允许用户保存自己的大纲结构为模板
  static createCustomTemplate(
    name: string,
    description: string,
    outlineNodes: OutlineNode[]
  ): OutlineTemplate {
    const structure = this.convertNodesToTemplate(outlineNodes);
    
    return {
      id: `custom_${Date.now()}`,
      name,
      description,
      category: 'classic',
      structure
    };
  }

  private static convertNodesToTemplate(nodes: OutlineNode[]): OutlineTemplateNode[] {
    const rootNodes = nodes.filter(n => !n.parentId);
    
    const convertNode = (node: OutlineNode): OutlineTemplateNode => {
      const children = nodes.filter(n => n.parentId === node.id);
      
      return {
        title: node.title,
        description: node.content,
        type: node.type,
        children: children.length > 0 ? children.map(convertNode) : undefined
      };
    };

    return rootNodes.map(convertNode);
  }
}
