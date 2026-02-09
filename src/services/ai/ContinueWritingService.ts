// 智能续写服务
import { SmartContextBuilder } from './SmartContextBuilder';
import { Novel, Chapter } from '../../types';

export interface ContinueResult {
  id: string;
  text: string;
  style: 'plot' | 'dialogue' | 'description' | 'psychology';
  score: number;
  length: number;
}

export interface ContinueOptions {
  style: 'plot' | 'dialogue' | 'description' | 'psychology';
  length: number;
  count: number;
  temperature?: number;
}

export class ContinueWritingService {
  // 风格配置
  private static styleConfig = {
    plot: {
      label: '情节推进',
      icon: '📖',
      description: '推动故事发展，增加情节转折',
      prompt: '请继续推进情节发展，增加故事的戏剧性和转折。注重情节的连贯性和节奏感。'
    },
    dialogue: {
      label: '对话补全',
      icon: '💬',
      description: '增加人物对话，展现性格特点',
      prompt: '请通过对话来推进情节，展现人物性格和关系。对话要生动自然，符合人物身份。'
    },
    description: {
      label: '场景描写',
      icon: '🎬',
      description: '细致描绘场景氛围和环境',
      prompt: '请详细描写场景环境、氛围和细节，让读者有身临其境的感觉。注重感官描写。'
    },
    psychology: {
      label: '心理活动',
      icon: '💭',
      description: '深入刻画人物内心世界',
      prompt: '请深入描写人物的内心活动、情感变化和心理斗争。展现人物的思想深度。'
    }
  };

  /**
   * 使用智能上下文生成续写
   */
  static async generateWithSmartContext(
    novel: Novel,
    currentChapter: Chapter,
    recentContent: string,
    options: ContinueOptions
  ): Promise<ContinueResult[]> {
    // 构建智能上下文
    const smartContext = await SmartContextBuilder.build(
      novel,
      currentChapter,
      recentContent,
      {
        includeWorldview: true,
        includeCharacters: true,
        includeForeshadowing: true,
        includeRag: true,
        recentContentLength: 3000,
        ragTopK: 10
      }
    );

    // 获取上下文统计
    const stats = SmartContextBuilder.getContextStats(smartContext);
    console.log('[SmartContinue] 上下文统计:', stats);

    // 使用智能上下文生成续写
    return this.generateMultiple(smartContext, options);
  }

  // 构建提示词
  private static buildPrompt(context: string, style: ContinueOptions['style'], variant: number): string {
    const styleInfo = this.styleConfig[style];

    const basePrompt = `你是一个专业的网络小说续写助手。

${context}

续写要求：
- 风格：${styleInfo.label}（${styleInfo.description}）
- ${styleInfo.prompt}
- 保持与前文的连贯性和一致性
- 注意回收伏笔（如果有待回收的伏笔）
- 保持人物性格一致
- 语言流畅自然，符合网络小说风格

`;

    // 为不同方案添加变化
    const variants = [
      '请提供一个稳健的续写方案，注重情节的自然发展。',
      '请提供一个富有创意的续写方案，可以有一些意外的转折。',
      '请提供一个情感丰富的续写方案，注重人物情感的表达。'
    ];

    return basePrompt + variants[variant % 3] + '\n\n请直接开始续写，不要有任何说明：';
  }

  // 计算续写质量分数
  private static calculateScore(text: string, context: string): number {
    let score = 50; // 基础分

    // 长度合理性（50-500字为佳）
    const length = text.length;
    if (length >= 50 && length <= 500) {
      score += 20;
    } else if (length < 50) {
      score += length / 50 * 20;
    } else {
      score += 20 - (length - 500) / 100;
    }

    // 连贯性检查（简单的关键词匹配）
    const contextWords = context.slice(-200).match(/[\u4e00-\u9fa5]+/g) || [];
    const textWords = text.match(/[\u4e00-\u9fa5]+/g) || [];
    const commonWords = contextWords.filter(word => textWords.includes(word));
    score += Math.min(commonWords.length * 2, 15);

    // 避免重复
    const contextLower = context.toLowerCase();
    const textLower = text.toLowerCase();
    const hasRepetition = contextLower.includes(textLower.slice(0, 20));
    if (hasRepetition) {
      score -= 20;
    }

    // 句子完整性
    const endsWithPunctuation = /[。！？]$/.test(text.trim());
    if (endsWithPunctuation) {
      score += 10;
    }

    // 对话标记（如果是对话风格）
    const hasDialogue = /"[^"]*"|「[^」]*」/.test(text);
    if (hasDialogue) {
      score += 5;
    }

    return Math.max(0, Math.min(100, score));
  }

  // 生成多个续写方案（模拟版本，实际应调用 AI API）
  static async generateMultiple(
    context: string,
    options: ContinueOptions
  ): Promise<ContinueResult[]> {
    const results: ContinueResult[] = [];
    const styleInfo = this.styleConfig[options.style];

    // 模拟生成（实际应该调用 Gemini API）
    for (let i = 0; i < options.count; i++) {
      const prompt = this.buildPrompt(context, options.style, i);
      
      // 这里应该调用实际的 AI API
      // const text = await generateContentFromAPI(prompt, options.length);
      
      // 模拟不同风格的续写示例
      let text = '';
      
      switch (options.style) {
        case 'plot':
          text = this.generatePlotContinuation(context, i);
          break;
        case 'dialogue':
          text = this.generateDialogueContinuation(context, i);
          break;
        case 'description':
          text = this.generateDescriptionContinuation(context, i);
          break;
        case 'psychology':
          text = this.generatePsychologyContinuation(context, i);
          break;
      }

      // 截取到指定长度
      if (text.length > options.length) {
        text = text.slice(0, options.length);
        // 确保在句子结束处截断
        const lastPunctuation = Math.max(
          text.lastIndexOf('。'),
          text.lastIndexOf('！'),
          text.lastIndexOf('？')
        );
        if (lastPunctuation > options.length * 0.8) {
          text = text.slice(0, lastPunctuation + 1);
        }
      }

      const score = this.calculateScore(text, context);

      results.push({
        id: `continue-${Date.now()}-${i}`,
        text,
        style: options.style,
        score,
        length: text.length
      });
    }

    // 按分数排序
    return results.sort((a, b) => b.score - a.score);
  }

  // 模拟情节推进续写
  private static generatePlotContinuation(context: string, variant: number): string {
    const templates = [
      '就在这时，远处传来一阵急促的脚步声。众人警觉地转过头去，只见一个身影匆匆而来，神色慌张。"不好了！"来人气喘吁吁地说道，"出大事了！"',
      '话音刚落，天空突然暗了下来。一股强大的威压从天而降，让在场所有人都感到呼吸困难。"这是……"有人惊呼出声，脸色变得煞白。',
      '正当众人以为事情就此结束时，意外发生了。地面开始剧烈震动，裂开一道道缝隙。从裂缝中，涌出了诡异的黑色雾气，弥漫开来。'
    ];
    return templates[variant % templates.length];
  }

  // 模拟对话续写
  private static generateDialogueContinuation(context: string, variant: number): string {
    const templates = [
      '"你说什么？"他猛地站起身来，眼中闪过一丝不可置信，"这怎么可能？"\n\n"我也不想相信，但事实就是如此。"对方苦笑着摇了摇头，"我们必须做出选择了。"\n\n"给我点时间考虑。"他深吸一口气，努力让自己冷静下来。',
      '"等等！"她突然出声制止，"你们有没有想过，这一切可能是个陷阱？"\n\n众人一愣，面面相觑。\n\n"你的意思是……"有人迟疑地问道。\n\n"没错。"她的眼神变得凌厉起来，"太顺利了，顺利得不正常。"',
      '"我明白你的意思。"他沉默片刻后开口，声音低沉，"但我们已经没有退路了。"\n\n"总会有办法的。"她握住他的手，眼神坚定，"相信我，我们一定能渡过这个难关。"\n\n他看着她，心中涌起一股暖流。'
    ];
    return templates[variant % templates.length];
  }

  // 模拟场景描写续写
  private static generateDescriptionContinuation(context: string, variant: number): string {
    const templates = [
      '夜色渐深，月光透过窗棂洒进屋内，在地面上投下斑驳的光影。微风拂过，带来阵阵花香，混合着泥土的气息。远处传来虫鸣声，此起彼伏，为这寂静的夜晚增添了几分生机。',
      '大殿之中，烛火摇曳，将墙上的壁画照得忽明忽暗。空气中弥漫着淡淡的檀香味，让人心神宁静。高大的石柱上雕刻着精美的图案，诉说着古老的传说。',
      '山谷深处，云雾缭绕，宛如仙境。瀑布从悬崖上倾泻而下，激起漫天水雾，在阳光下折射出七彩光芒。古木参天，遮天蔽日，只有零星的光线透过树叶的缝隙洒落下来。'
    ];
    return templates[variant % templates.length];
  }

  // 模拟心理活动续写
  private static generatePsychologyContinuation(context: string, variant: number): string {
    const templates = [
      '他的心中五味杂陈。多年的坚持，是对是错？曾经的选择，是否值得？这些问题像针一样刺痛着他的心。他闭上眼睛，深深地吸了口气，试图让自己平静下来。但那些回忆，却如潮水般涌来，无法阻挡。',
      '她感到一阵迷茫。前路在何方？该何去何从？这些问题在脑海中盘旋，却找不到答案。她想起了过去的种种，那些欢笑，那些泪水，那些曾经以为会永远的承诺。如今，一切都变了。',
      '此刻，他的内心充满了矛盾。理智告诉他应该放手，但情感却让他无法割舍。这种撕裂般的痛苦，让他几乎无法呼吸。他知道，无论做出什么选择，都会有遗憾。但人生不就是这样吗？在无数个选择中，找到属于自己的路。'
    ];
    return templates[variant % templates.length];
  }

  // 获取风格配置
  static getStyleConfig() {
    return this.styleConfig;
  }

  // 获取所有风格选项
  static getAllStyles() {
    return Object.entries(this.styleConfig).map(([id, config]) => ({
      id: id as ContinueOptions['style'],
      ...config
    }));
  }
}
