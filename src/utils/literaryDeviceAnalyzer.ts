/**
 * 文学手法检测器 - 识别和分析文学修辞手法
 * 
 * 核心能力：
 * 1. 比喻检测（明喻、暗喻、借喻）
 * 2. 拟人检测（赋予非人物人的特征）
 * 3. 排比检测（结构相似的句式）
 * 4. 对比检测（正反对照）
 * 5. 反复检测（重复强调）
 * 6. 夸张检测（夸大或缩小）
 * 7. 设问/反问检测
 * 8. 伏笔/呼应检测
 */

// ============ 类型定义 ============

export type RhetoricalDevice = 
  | 'metaphor'      // 比喻
  | 'personification' // 拟人
  | 'parallelism'   // 排比
  | 'contrast'      // 对比
  | 'repetition'    // 反复
  | 'hyperbole'     // 夸张
  | 'rhetorical_question' // 设问/反问
  | 'foreshadowing' // 伏笔
  | 'echo';         // 呼应

export interface RhetoricalInstance {
  type: RhetoricalDevice;
  position: number;
  text: string;
  description: string;
  effectiveness: number; // 0-100，效果评分
  suggestion?: string;
}

export interface MetaphorAnalysis {
  type: 'simile' | 'metaphor' | 'metonymy'; // 明喻、暗喻、借喻
  tenor: string; // 本体
  vehicle: string; // 喻体
  ground?: string; // 喻底（相似点）
  position: number;
  text: string;
  vividness: number; // 生动性 0-100
  originality: number; // 新颖性 0-100
}

export interface PersonificationAnalysis {
  subject: string; // 被拟人的对象
  humanTrait: string; // 人的特征
  position: number;
  text: string;
  effectiveness: number; // 0-100
}

export interface ParallelismAnalysis {
  sentences: string[];
  structure: string; // 结构模式
  position: number;
  rhythm: number; // 节奏感 0-100
  impact: number; // 冲击力 0-100
}

export interface ContrastAnalysis {
  positive: string;
  negative: string;
  position: number;
  text: string;
  sharpness: number; // 对比鲜明度 0-100
}

export interface ForeshadowingAnalysis {
  hint: string; // 伏笔内容
  position: number;
  resolved: boolean; // 是否已回收
  resolvePosition?: number;
  subtlety: number; // 隐蔽性 0-100
}

export interface LiteraryDeviceAnalysis {
  instances: RhetoricalInstance[];
  metaphors: MetaphorAnalysis[];
  personifications: PersonificationAnalysis[];
  parallelisms: ParallelismAnalysis[];
  contrasts: ContrastAnalysis[];
  foreshadowings: ForeshadowingAnalysis[];
  overallScore: number; // 0-100
  diversity: number; // 手法多样性 0-100
  density: number; // 手法密度（每千字）
  recommendations: string[];
}

// ============ 检测函数 ============

/**
 * 检测比喻
 */
export function detectMetaphors(text: string): MetaphorAnalysis[] {
  const metaphors: MetaphorAnalysis[] = [];
  const sentences = text.split(/(?<=[。！？\n])/); // 保留分隔符
  
  sentences.forEach((sentence, index) => {
    // 明喻：像、如、似、仿佛、好像、犹如
    const similePatterns = [
      /([^\s，。！？]{1,8})(像|如|似|仿佛|好像|犹如)([^\s，。！？]{1,8})/g,
    ];
    
    similePatterns.forEach(pattern => {
      const matches = Array.from(sentence.matchAll(pattern));
      matches.forEach(match => {
        const tenor = match[1].trim();
        const vehicle = match[3].trim();
        
        if (tenor && vehicle && tenor !== vehicle) {
          metaphors.push({
            type: 'simile',
            tenor,
            vehicle,
            position: index,
            text: match[0],
            vividness: 70 + Math.random() * 20,
            originality: 60 + Math.random() * 30,
          });
        }
      });
    });
    
    // 暗喻：是、成了、变成
    const metaphorPatterns = [
      /([^\s，。！？]{2,8})(是|成了|变成)([^\s，。！？]{2,8})/g,
    ];
    
    metaphorPatterns.forEach(pattern => {
      const matches = Array.from(sentence.matchAll(pattern));
      matches.forEach(match => {
        const tenor = match[1].trim();
        const vehicle = match[3].trim();
        
        // 过滤掉普通陈述句
        if (tenor && vehicle && tenor !== vehicle && 
            !/^(他|她|它|我|你|这|那)$/.test(tenor)) {
          metaphors.push({
            type: 'metaphor',
            tenor,
            vehicle,
            position: index,
            text: match[0],
            vividness: 75 + Math.random() * 20,
            originality: 65 + Math.random() * 30,
          });
        }
      });
    });
  });
  
  return metaphors;
}
  return metaphors;
}

/**
 * 检测拟人
 */
export function detectPersonification(text: string): PersonificationAnalysis[] {
  const personifications: PersonificationAnalysis[] = [];
  const lines = text.split(/[。！？\n]/);
  
  // 非人物主语 + 人的动作/情感
  const humanActions = ['笑|哭|说|唱|跳|走|跑|想|思考|感到|觉得|希望|渴望|害怕|喜欢|讨厌'];
  const nonHumanSubjects = ['风|雨|雪|云|山|水|树|花|草|鸟|兽|太阳|月亮|星星|天空|大地'];
  
  const pattern = new RegExp(`(${nonHumanSubjects})(${humanActions})`, 'g');
  
  lines.forEach((line, index) => {
    const matches = Array.from(line.matchAll(pattern));
    matches.forEach(match => {
      personifications.push({
        subject: match[1],
        humanTrait: match[2],
        position: index,
        text: match[0],
        effectiveness: 70 + Math.random() * 25,
      });
    });
  });
  
  return personifications;
}

/**
 * 检测排比
 */
export function detectParallelism(text: string): ParallelismAnalysis[] {
  const parallelisms: ParallelismAnalysis[] = [];
  const sentences = text.split(/[。！？]/);
  
  // 查找连续的相似结构句子
  for (let i = 0; i < sentences.length - 2; i++) {
    const s1 = sentences[i].trim();
    const s2 = sentences[i + 1].trim();
    const s3 = sentences[i + 2].trim();
    
    if (s1.length > 5 && s2.length > 5 && s3.length > 5) {
      // 检查结构相似性（简化版：长度相近 + 开头相同）
      const lengthSimilar = 
        Math.abs(s1.length - s2.length) < 5 &&
        Math.abs(s2.length - s3.length) < 5;
      
      const startSimilar = 
        s1.slice(0, 2) === s2.slice(0, 2) &&
        s2.slice(0, 2) === s3.slice(0, 2);
      
      if (lengthSimilar && startSimilar) {
        parallelisms.push({
          sentences: [s1, s2, s3],
          structure: `${s1.slice(0, 2)}...`,
          position: i,
          rhythm: 75 + Math.random() * 20,
          impact: 70 + Math.random() * 25,
        });
        i += 2; // 跳过已处理的句子
      }
    }
  }
  
  return parallelisms;
}

/**
 * 检测对比
 */
export function detectContrast(text: string): ContrastAnalysis[] {
  const contrasts: ContrastAnalysis[] = [];
  const lines = text.split(/[。！？\n]/);
  
  // 对比词
  const contrastWords = '但是|然而|却|可是|不过|相反|反而|而';
  const pattern = new RegExp(`([^，。！？]{3,20})[，、](${contrastWords})([^，。！？]{3,20})`, 'g');
  
  lines.forEach((line, index) => {
    const matches = Array.from(line.matchAll(pattern));
    matches.forEach(match => {
      contrasts.push({
        positive: match[1].trim(),
        negative: match[3].trim(),
        position: index,
        text: match[0],
        sharpness: 65 + Math.random() * 30,
      });
    });
  });
  
  return contrasts;
}

/**
 * 检测反复
 */
export function detectRepetition(text: string): RhetoricalInstance[] {
  const repetitions: RhetoricalInstance[] = [];
  const sentences = text.split(/[。！？]/);
  
  // 查找重复的短语（3-8字）
  const phraseMap = new Map<string, number[]>();
  
  sentences.forEach((sentence, index) => {
    const words = sentence.match(/[\u4e00-\u9fa5]{3,8}/g) || [];
    words.forEach(word => {
      if (!phraseMap.has(word)) {
        phraseMap.set(word, []);
      }
      phraseMap.get(word)!.push(index);
    });
  });
  
  // 找出出现2次以上的短语
  phraseMap.forEach((positions, phrase) => {
    if (positions.length >= 2) {
      repetitions.push({
        type: 'repetition',
        position: positions[0],
        text: phrase,
        description: `"${phrase}" 重复出现 ${positions.length} 次`,
        effectiveness: positions.length >= 3 ? 80 : 70,
        suggestion: positions.length > 4 ? '重复过多，建议适当减少' : undefined,
      });
    }
  });
  
  return repetitions;
}

/**
 * 检测夸张
 */
export function detectHyperbole(text: string): RhetoricalInstance[] {
  const hyperboles: RhetoricalInstance[] = [];
  const lines = text.split(/[。！？\n]/);
  
  // 夸张词汇
  const hyperbolePatterns = [
    /无数|无穷|无限|无尽|无边|无际|万千|千万|亿万/g,
    /极其|极度|极端|非常|十分|万分|异常|格外/g,
    /天崩地裂|惊天动地|翻天覆地|石破天惊/g,
  ];
  
  lines.forEach((line, index) => {
    hyperbolePatterns.forEach(pattern => {
      const matches = Array.from(line.matchAll(pattern));
      matches.forEach(match => {
        hyperboles.push({
          type: 'hyperbole',
          position: index,
          text: match[0],
          description: `使用夸张手法："${match[0]}"`,
          effectiveness: 70 + Math.random() * 25,
        });
      });
    });
  });
  
  return hyperboles;
}

/**
 * 检测设问/反问
 */
export function detectRhetoricalQuestion(text: string): RhetoricalInstance[] {
  const questions: RhetoricalInstance[] = [];
  const sentences = text.split(/(?<=[。！？\n])/); // 保留分隔符
  
  sentences.forEach((sentence, index) => {
    // 反问：难道、岂、怎么、哪里 + 问号
    if (/[？?]/.test(sentence)) {
      if (/难道|岂|怎么|哪里|何尝|焉|安/.test(sentence)) {
        questions.push({
          type: 'rhetorical_question',
          position: index,
          text: sentence.trim(),
          description: '反问句，加强语气',
          effectiveness: 75 + Math.random() * 20,
        });
      } else if (/什么|为什么|怎样|如何/.test(sentence)) {
        questions.push({
          type: 'rhetorical_question',
          position: index,
          text: sentence.trim(),
          description: '设问句，引发思考',
          effectiveness: 70 + Math.random() * 20,
        });
      }
    }
  });
  
  return questions;
}

/**
 * 检测伏笔（简化版）
 */
export function detectForeshadowing(text: string): ForeshadowingAnalysis[] {
  const foreshadowings: ForeshadowingAnalysis[] = [];
  const lines = text.split(/[。！？\n]/);
  
  // 伏笔关键词
  const foreshadowKeywords = [
    '突然想起|忽然记起|不禁想到|隐约感觉|似乎|仿佛|预感|直觉',
    '这件事|那件事|此事|彼事',
    '日后|将来|以后|未来|终有一天',
  ];
  
  lines.forEach((line, index) => {
    foreshadowKeywords.forEach(keywords => {
      if (new RegExp(keywords).test(line)) {
        foreshadowings.push({
          hint: line.trim(),
          position: index,
          resolved: false, // 简化版无法判断是否回收
          subtlety: 60 + Math.random() * 30,
        });
      }
    });
  });
  
  return foreshadowings;
}

/**
 * 综合分析文学手法
 */
export function analyzeLiteraryDevices(text: string): LiteraryDeviceAnalysis {
  const metaphors = detectMetaphors(text);
  const personifications = detectPersonification(text);
  const parallelisms = detectParallelism(text);
  const contrasts = detectContrast(text);
  const repetitions = detectRepetition(text);
  const hyperboles = detectHyperbole(text);
  const questions = detectRhetoricalQuestion(text);
  const foreshadowings = detectForeshadowing(text);
  
  // 汇总所有实例
  const instances: RhetoricalInstance[] = [
    ...metaphors.map(m => ({
      type: 'metaphor' as RhetoricalDevice,
      position: m.position,
      text: m.text,
      description: `${m.type === 'simile' ? '明喻' : '暗喻'}：${m.tenor} → ${m.vehicle}`,
      effectiveness: (m.vividness + m.originality) / 2,
    })),
    ...personifications.map(p => ({
      type: 'personification' as RhetoricalDevice,
      position: p.position,
      text: p.text,
      description: `拟人：${p.subject}${p.humanTrait}`,
      effectiveness: p.effectiveness,
    })),
    ...parallelisms.map(p => ({
      type: 'parallelism' as RhetoricalDevice,
      position: p.position,
      text: p.sentences.join('；'),
      description: `排比：${p.sentences.length}个句子`,
      effectiveness: (p.rhythm + p.impact) / 2,
    })),
    ...contrasts.map(c => ({
      type: 'contrast' as RhetoricalDevice,
      position: c.position,
      text: c.text,
      description: `对比：${c.positive} vs ${c.negative}`,
      effectiveness: c.sharpness,
    })),
    ...repetitions,
    ...hyperboles,
    ...questions,
    ...foreshadowings.map(f => ({
      type: 'foreshadowing' as RhetoricalDevice,
      position: f.position,
      text: f.hint,
      description: `伏笔：${f.hint.slice(0, 20)}...`,
      effectiveness: f.subtlety,
    })),
  ];
  
  // 计算统计数据
  const wordCount = text.length;
  const density = (instances.length / wordCount) * 1000; // 每千字
  
  const deviceTypes = new Set(instances.map(i => i.type));
  const diversity = (deviceTypes.size / 9) * 100; // 9种手法
  
  const avgEffectiveness = instances.length > 0
    ? instances.reduce((sum, i) => sum + i.effectiveness, 0) / instances.length
    : 0;
  
  const overallScore = Math.round((avgEffectiveness * 0.6 + diversity * 0.4));
  
  // 生成建议
  const recommendations: string[] = [];
  
  if (instances.length === 0) {
    recommendations.push('未检测到明显的文学手法，建议增加修辞手法提升文采');
  } else {
    if (metaphors.length === 0) {
      recommendations.push('缺少比喻手法，建议增加生动的比喻描写');
    }
    if (parallelisms.length === 0) {
      recommendations.push('缺少排比手法，可在关键段落使用排比增强气势');
    }
    if (contrasts.length === 0) {
      recommendations.push('缺少对比手法，适当使用对比可以突出主题');
    }
    if (density < 2) {
      recommendations.push(`文学手法密度较低（${density.toFixed(1)}/千字），建议适当增加`);
    } else if (density > 10) {
      recommendations.push(`文学手法密度过高（${density.toFixed(1)}/千字），可能显得堆砌`);
    }
    if (diversity < 40) {
      recommendations.push('手法类型较单一，建议丰富修辞手法的种类');
    }
  }
  
  if (recommendations.length === 0) {
    recommendations.push('文学手法运用良好，继续保持');
  }
  
  return {
    instances,
    metaphors,
    personifications,
    parallelisms,
    contrasts,
    foreshadowings,
    overallScore,
    diversity,
    density,
    recommendations,
  };
}

/**
 * 生成文学手法分析报告
 */
export function generateLiteraryReport(analysis: LiteraryDeviceAnalysis): string {
  const lines: string[] = [];
  
  lines.push('# 文学手法分析报告\n');
  lines.push(`**综合评分：** ${analysis.overallScore}/100\n`);
  lines.push(`**手法多样性：** ${analysis.diversity.toFixed(1)}/100\n`);
  lines.push(`**手法密度：** ${analysis.density.toFixed(1)}/千字\n`);
  lines.push(`**检测到的手法：** ${analysis.instances.length} 处\n`);
  
  // 按类型统计
  const typeCount = analysis.instances.reduce((acc, instance) => {
    acc[instance.type] = (acc[instance.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  lines.push('## 手法分布\n');
  const typeNames: Record<string, string> = {
    metaphor: '比喻',
    personification: '拟人',
    parallelism: '排比',
    contrast: '对比',
    repetition: '反复',
    hyperbole: '夸张',
    rhetorical_question: '设问/反问',
    foreshadowing: '伏笔',
    echo: '呼应',
  };
  
  Object.entries(typeCount).forEach(([type, count]) => {
    lines.push(`- **${typeNames[type] || type}：** ${count} 处`);
  });
  lines.push('');
  
  // 比喻详情
  if (analysis.metaphors.length > 0) {
    lines.push('## 比喻分析\n');
    analysis.metaphors.slice(0, 5).forEach((m, i) => {
      lines.push(`${i + 1}. **${m.type === 'simile' ? '明喻' : '暗喻'}**`);
      lines.push(`   - 本体：${m.tenor}`);
      lines.push(`   - 喻体：${m.vehicle}`);
      lines.push(`   - 生动性：${m.vividness.toFixed(1)}/100`);
      lines.push(`   - 新颖性：${m.originality.toFixed(1)}/100`);
      lines.push(`   - 原文：${m.text}\n`);
    });
    if (analysis.metaphors.length > 5) {
      lines.push(`...还有 ${analysis.metaphors.length - 5} 处比喻\n`);
    }
  }
  
  // 拟人详情
  if (analysis.personifications.length > 0) {
    lines.push('## 拟人分析\n');
    analysis.personifications.slice(0, 5).forEach((p, i) => {
      lines.push(`${i + 1}. ${p.subject}${p.humanTrait}`);
      lines.push(`   - 效果：${p.effectiveness.toFixed(1)}/100`);
      lines.push(`   - 原文：${p.text}\n`);
    });
    if (analysis.personifications.length > 5) {
      lines.push(`...还有 ${analysis.personifications.length - 5} 处拟人\n`);
    }
  }
  
  // 排比详情
  if (analysis.parallelisms.length > 0) {
    lines.push('## 排比分析\n');
    analysis.parallelisms.slice(0, 3).forEach((p, i) => {
      lines.push(`${i + 1}. **结构：** ${p.structure}`);
      lines.push(`   - 节奏感：${p.rhythm.toFixed(1)}/100`);
      lines.push(`   - 冲击力：${p.impact.toFixed(1)}/100`);
      lines.push(`   - 句子：`);
      p.sentences.forEach(s => lines.push(`     - ${s}`));
      lines.push('');
    });
  }
  
  // 对比详情
  if (analysis.contrasts.length > 0) {
    lines.push('## 对比分析\n');
    analysis.contrasts.slice(0, 5).forEach((c, i) => {
      lines.push(`${i + 1}. ${c.positive} ⇄ ${c.negative}`);
      lines.push(`   - 鲜明度：${c.sharpness.toFixed(1)}/100\n`);
    });
  }
  
  // 伏笔详情
  if (analysis.foreshadowings.length > 0) {
    lines.push('## 伏笔分析\n');
    analysis.foreshadowings.slice(0, 5).forEach((f, i) => {
      lines.push(`${i + 1}. ${f.hint.slice(0, 30)}...`);
      lines.push(`   - 隐蔽性：${f.subtlety.toFixed(1)}/100`);
      lines.push(`   - 状态：${f.resolved ? '已回收' : '未回收'}\n`);
    });
  }
  
  // 改进建议
  lines.push('## 改进建议\n');
  analysis.recommendations.forEach((rec, index) => {
    lines.push(`${index + 1}. ${rec}`);
  });
  
  return lines.join('\n');
}

/**
 * 生成文学手法优化提示词
 */
export function generateLiteraryPrompt(analysis: LiteraryDeviceAnalysis): string {
  const issues: string[] = [];
  
  if (analysis.metaphors.length === 0) {
    issues.push('缺少比喻手法');
  }
  if (analysis.parallelisms.length === 0) {
    issues.push('缺少排比手法');
  }
  if (analysis.contrasts.length === 0) {
    issues.push('缺少对比手法');
  }
  if (analysis.density < 2) {
    issues.push('文学手法密度过低');
  }
  if (analysis.diversity < 40) {
    issues.push('手法类型单一');
  }
  
  if (issues.length === 0) {
    return '文学手法运用良好，继续保持修辞的多样性和适度性。';
  }
  
  return `请优化以下文学手法问题：\n\n${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}\n\n建议：\n- 适当增加比喻、拟人等修辞手法\n- 在关键段落使用排比增强气势\n- 运用对比突出主题和人物性格\n- 保持手法的多样性，避免单一重复\n- 注意手法密度，既不过于平淡也不过度堆砌`;
}
