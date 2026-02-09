/**
 * 人物塑造评估器 - 分析人物性格一致性、对话风格、行为动机
 * 
 * 核心能力：
 * 1. 性格一致性检查（前后矛盾、OOC）
 * 2. 对话风格差异化（口头禅、语气、用词）
 * 3. 行为动机合理性（动机-行为链）
 * 4. 人物成长曲线（性格变化轨迹）
 * 5. 人物关系网络（互动模式）
 */

// ============ 类型定义 ============

export interface CharacterProfile {
  name: string;
  appearances: CharacterAppearance[];
  dialogues: CharacterDialogue[];
  actions: CharacterAction[];
  traits: string[]; // 性格特征
  relationships: Record<string, string>; // 与其他角色的关系
}

export interface CharacterAppearance {
  position: number;
  context: string;
  description: string;
}

export interface CharacterDialogue {
  position: number;
  speaker: string;
  content: string;
  emotion?: string;
  target?: string; // 对话对象
}

export interface CharacterAction {
  position: number;
  actor: string;
  action: string;
  motivation?: string;
  consequence?: string;
}

export interface ConsistencyIssue {
  type: 'personality' | 'behavior' | 'dialogue' | 'motivation';
  severity: 'high' | 'medium' | 'low';
  position: number;
  description: string;
  evidence: string[];
  suggestion: string;
}

export interface DialogueStyle {
  character: string;
  vocabulary: string[]; // 常用词汇
  catchphrases: string[]; // 口头禅
  sentenceLength: number; // 平均句长
  formalityLevel: number; // 正式程度 0-100
  emotionalTone: string; // 情感基调
  uniqueness: number; // 独特性评分 0-100
}

export interface MotivationChain {
  character: string;
  motivation: string;
  actions: string[];
  outcome: string;
  consistency: number; // 一致性评分 0-100
  issues: string[];
}

export interface CharacterGrowth {
  character: string;
  stages: GrowthStage[];
  trajectory: 'positive' | 'negative' | 'complex' | 'static';
  believability: number; // 可信度 0-100
  pacing: number; // 节奏评分 0-100
}

export interface GrowthStage {
  position: number;
  phase: string;
  traits: string[];
  keyEvent: string;
  change: string;
}

export interface CharacterAnalysis {
  profiles: CharacterProfile[];
  consistencyIssues: ConsistencyIssue[];
  dialogueStyles: DialogueStyle[];
  motivationChains: MotivationChain[];
  growthCurves: CharacterGrowth[];
  overallScore: number; // 0-100
  recommendations: string[];
}

// ============ 核心分析函数 ============

/**
 * 提取文本中的人物信息
 */
export function extractCharacters(text: string): CharacterProfile[] {
  const profiles: CharacterProfile[] = [];
  const lines = text.split('\n');
  
  // 简单的人物识别（基于对话和动作描写）
  const dialoguePattern = /["「『]([^"」』]+)["」』]/g;
  const actionPattern = /([^，。！？\s]+)(说|道|笑|怒|叹|想|看|走|跑|打|拿|给)/g;
  
  const characterMap = new Map<string, CharacterProfile>();
  
  lines.forEach((line, index) => {
    // 识别对话
    const dialogues = Array.from(line.matchAll(dialoguePattern));
    dialogues.forEach(match => {
      const content = match[1];
      // 尝试识别说话者（简化版）
      const speakerMatch = line.match(/([^，。！？\s]{2,4})(说|道|笑|怒|叹)/);
      if (speakerMatch) {
        const speaker = speakerMatch[1];
        if (!characterMap.has(speaker)) {
          characterMap.set(speaker, {
            name: speaker,
            appearances: [],
            dialogues: [],
            actions: [],
            traits: [],
            relationships: {},
          });
        }
        characterMap.get(speaker)!.dialogues.push({
          position: index,
          speaker,
          content,
        });
      }
    });
    
    // 识别动作
    const actions = Array.from(line.matchAll(actionPattern));
    actions.forEach(match => {
      const actor = match[1];
      const action = match[0];
      if (!characterMap.has(actor)) {
        characterMap.set(actor, {
          name: actor,
          appearances: [],
          dialogues: [],
          actions: [],
          traits: [],
          relationships: {},
        });
      }
      characterMap.get(actor)!.actions.push({
        position: index,
        actor,
        action,
      });
    });
  });
  
  return Array.from(characterMap.values());
}

/**
 * 检查性格一致性
 */
export function checkConsistency(profile: CharacterProfile): ConsistencyIssue[] {
  const issues: ConsistencyIssue[] = [];
  
  // 检查对话风格一致性
  if (profile.dialogues.length >= 3) {
    const styles = profile.dialogues.map(d => ({
      length: d.content.length,
      hasQuestion: d.content.includes('？') || d.content.includes('?'),
      hasExclamation: d.content.includes('！') || d.content.includes('!'),
      formal: /您|敬|请|劳驾/.test(d.content),
    }));
    
    const avgLength = styles.reduce((sum, s) => sum + s.length, 0) / styles.length;
    const lengthVariance = styles.reduce((sum, s) => sum + Math.abs(s.length - avgLength), 0) / styles.length;
    
    // 如果句长变化过大，可能存在风格不一致
    if (lengthVariance > avgLength * 0.8) {
      issues.push({
        type: 'dialogue',
        severity: 'medium',
        position: profile.dialogues[profile.dialogues.length - 1].position,
        description: `${profile.name}的对话风格前后差异较大`,
        evidence: [
          `平均句长：${avgLength.toFixed(1)}字`,
          `句长波动：${lengthVariance.toFixed(1)}字`,
        ],
        suggestion: '保持角色对话风格的一致性，注意句式长度和用词习惯',
      });
    }
  }
  
  // 检查行为模式一致性
  if (profile.actions.length >= 3) {
    const actionTypes = profile.actions.map(a => {
      if (/说|道|笑|怒|叹/.test(a.action)) return 'verbal';
      if (/看|望|瞧|盯/.test(a.action)) return 'observe';
      if (/走|跑|冲|退/.test(a.action)) return 'move';
      if (/打|击|攻|防/.test(a.action)) return 'combat';
      return 'other';
    });
    
    const typeCount = actionTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 如果某个角色突然出现不符合其性格的行为类型
    const dominantType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0];
    const lastAction = actionTypes[actionTypes.length - 1];
    
    if (lastAction !== dominantType[0] && typeCount[lastAction] === 1) {
      issues.push({
        type: 'behavior',
        severity: 'low',
        position: profile.actions[profile.actions.length - 1].position,
        description: `${profile.name}的行为模式出现变化`,
        evidence: [
          `主要行为类型：${dominantType[0]}（${dominantType[1]}次）`,
          `新出现行为：${lastAction}`,
        ],
        suggestion: '确认角色行为变化是否符合剧情发展和性格成长',
      });
    }
  }
  
  return issues;
}

/**
 * 分析对话风格
 */
export function analyzeDialogueStyle(profile: CharacterProfile): DialogueStyle {
  const dialogues = profile.dialogues;
  
  if (dialogues.length === 0) {
    return {
      character: profile.name,
      vocabulary: [],
      catchphrases: [],
      sentenceLength: 0,
      formalityLevel: 50,
      emotionalTone: 'neutral',
      uniqueness: 0,
    };
  }
  
  // 提取词汇
  const allWords = dialogues.flatMap(d => 
    d.content.match(/[\u4e00-\u9fa5]{2,}/g) || []
  );
  const wordFreq = allWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const vocabulary = Object.entries(wordFreq)
    .sort((a, b) => (b[1] as number) - (a[1] as number))
    .slice(0, 10)
    .map(([word]) => word);
  
  // 识别口头禅（出现3次以上的短语）
  const catchphrases = Object.entries(wordFreq)
    .filter(([word, count]) => {
      const wordCount = Number(count);
      return wordCount >= 3 && word.length <= 4;
    })
    .map(([word]) => word);
  
  // 计算平均句长
  const avgLength = dialogues.reduce((sum, d) => sum + d.content.length, 0) / dialogues.length;
  
  // 计算正式程度
  const formalWords = dialogues.filter(d => 
    /您|敬|请|劳驾|恕|鄙人|在下/.test(d.content)
  ).length;
  const formalityLevel = (formalWords / dialogues.length) * 100;
  
  // 分析情感基调
  const emotionCounts = {
    positive: dialogues.filter(d => /哈|呵|笑|好|棒|妙/.test(d.content)).length,
    negative: dialogues.filter(d => /哼|呸|糟|坏|差|烂/.test(d.content)).length,
    neutral: 0,
  };
  emotionCounts.neutral = dialogues.length - emotionCounts.positive - emotionCounts.negative;
  
  const emotionalTone = 
    emotionCounts.positive > emotionCounts.negative ? 'positive' :
    emotionCounts.negative > emotionCounts.positive ? 'negative' : 'neutral';
  
  // 计算独特性（基于词汇多样性）
  const uniqueWords = new Set(allWords).size;
  const uniqueness = Math.min(100, (uniqueWords / allWords.length) * 100);
  
  return {
    character: profile.name,
    vocabulary,
    catchphrases,
    sentenceLength: avgLength,
    formalityLevel,
    emotionalTone,
    uniqueness,
  };
}

/**
 * 分析动机-行为链
 */
export function analyzeMotivation(profile: CharacterProfile, context: string): MotivationChain[] {
  const chains: MotivationChain[] = [];
  
  // 简化版：基于动作序列推断动机
  if (profile.actions.length >= 2) {
    const actionSequence = profile.actions.map(a => a.action).join(' → ');
    
    // 识别常见动机模式
    let motivation = '未知动机';
    let consistency = 50;
    const issues: string[] = [];
    
    if (/攻|打|击/.test(actionSequence)) {
      motivation = '战斗/对抗';
      consistency = 70;
    } else if (/逃|退|躲/.test(actionSequence)) {
      motivation = '自保/逃避';
      consistency = 75;
    } else if (/说|劝|解释/.test(actionSequence)) {
      motivation = '沟通/说服';
      consistency = 65;
    } else if (/看|观察|思考/.test(actionSequence)) {
      motivation = '观察/分析';
      consistency = 60;
    }
    
    // 检查动机一致性
    const actionTypes = new Set(profile.actions.map(a => {
      if (/攻|打/.test(a.action)) return 'aggressive';
      if (/逃|退/.test(a.action)) return 'defensive';
      if (/说|劝/.test(a.action)) return 'communicative';
      return 'other';
    }));
    
    if (actionTypes.size > 2) {
      issues.push('角色行为模式多变，动机不够明确');
      consistency -= 20;
    }
    
    chains.push({
      character: profile.name,
      motivation,
      actions: profile.actions.map(a => a.action),
      outcome: '待观察',
      consistency: Math.max(0, consistency),
      issues,
    });
  }
  
  return chains;
}

/**
 * 分析人物成长曲线
 */
export function analyzeGrowth(profile: CharacterProfile, text: string): CharacterGrowth {
  const stages: GrowthStage[] = [];
  
  // 简化版：基于出场位置划分成长阶段
  const totalAppearances = profile.dialogues.length + profile.actions.length;
  
  if (totalAppearances >= 3) {
    const stageSize = Math.ceil(totalAppearances / 3);
    const allEvents = [
      ...profile.dialogues.map(d => ({ position: d.position, type: 'dialogue', content: d.content })),
      ...profile.actions.map(a => ({ position: a.position, type: 'action', content: a.action })),
    ].sort((a, b) => a.position - b.position);
    
    for (let i = 0; i < 3; i++) {
      const stageEvents = allEvents.slice(i * stageSize, (i + 1) * stageSize);
      if (stageEvents.length > 0) {
        stages.push({
          position: stageEvents[0].position,
          phase: ['初期', '中期', '后期'][i],
          traits: [], // 简化版不提取具体特征
          keyEvent: stageEvents[0].content,
          change: i > 0 ? '性格/行为发生变化' : '初始状态',
        });
      }
    }
  }
  
  // 判断成长轨迹
  let trajectory: 'positive' | 'negative' | 'complex' | 'static' = 'static';
  if (stages.length >= 2) {
    trajectory = 'complex'; // 简化版默认为复杂成长
  }
  
  // 计算可信度和节奏
  const believability = stages.length >= 2 ? 70 : 50;
  const pacing = stages.length >= 3 ? 75 : 60;
  
  return {
    character: profile.name,
    stages,
    trajectory,
    believability,
    pacing,
  };
}

/**
 * 综合人物分析
 */
export function analyzeCharacters(text: string): CharacterAnalysis {
  const profiles = extractCharacters(text);
  
  const consistencyIssues: ConsistencyIssue[] = [];
  const dialogueStyles: DialogueStyle[] = [];
  const motivationChains: MotivationChain[] = [];
  const growthCurves: CharacterGrowth[] = [];
  
  profiles.forEach(profile => {
    // 只分析出场次数较多的角色
    if (profile.dialogues.length + profile.actions.length >= 2) {
      consistencyIssues.push(...checkConsistency(profile));
      dialogueStyles.push(analyzeDialogueStyle(profile));
      motivationChains.push(...analyzeMotivation(profile, text));
      growthCurves.push(analyzeGrowth(profile, text));
    }
  });
  
  // 计算综合评分
  const issueScore = Math.max(0, 100 - consistencyIssues.length * 10);
  const styleScore = dialogueStyles.length > 0 
    ? dialogueStyles.reduce((sum, s) => sum + s.uniqueness, 0) / dialogueStyles.length 
    : 50;
  const motivationScore = motivationChains.length > 0
    ? motivationChains.reduce((sum, m) => sum + m.consistency, 0) / motivationChains.length
    : 50;
  const growthScore = growthCurves.length > 0
    ? growthCurves.reduce((sum, g) => sum + g.believability, 0) / growthCurves.length
    : 50;
  
  const overallScore = Math.round((issueScore + styleScore + motivationScore + growthScore) / 4);
  
  // 生成建议
  const recommendations: string[] = [];
  
  if (consistencyIssues.length > 0) {
    recommendations.push(`发现 ${consistencyIssues.length} 个性格一致性问题，建议检查角色前后表现`);
  }
  
  if (dialogueStyles.length > 0) {
    const lowUniqueness = dialogueStyles.filter(s => s.uniqueness < 40);
    if (lowUniqueness.length > 0) {
      recommendations.push(`${lowUniqueness.map(s => s.character).join('、')} 的对话风格不够独特，建议增加个性化表达`);
    }
  }
  
  if (motivationChains.some(m => m.consistency < 60)) {
    recommendations.push('部分角色的行为动机不够明确，建议加强动机描写');
  }
  
  if (growthCurves.some(g => g.believability < 60)) {
    recommendations.push('部分角色的成长曲线不够自然，建议增加过渡和铺垫');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('人物塑造整体良好，继续保持');
  }
  
  return {
    profiles,
    consistencyIssues,
    dialogueStyles,
    motivationChains,
    growthCurves,
    overallScore,
    recommendations,
  };
}

/**
 * 生成人物分析报告
 */
export function generateCharacterReport(analysis: CharacterAnalysis): string {
  const lines: string[] = [];
  
  lines.push('# 人物塑造分析报告\n');
  lines.push(`**综合评分：** ${analysis.overallScore}/100\n`);
  lines.push(`**角色数量：** ${analysis.profiles.length}\n`);
  
  // 性格一致性
  lines.push('## 性格一致性检查\n');
  if (analysis.consistencyIssues.length === 0) {
    lines.push('✅ 未发现明显的性格一致性问题\n');
  } else {
    analysis.consistencyIssues.forEach(issue => {
      const icon = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      lines.push(`${icon} **${issue.description}**`);
      lines.push(`   - 位置：第 ${issue.position} 行`);
      lines.push(`   - 证据：${issue.evidence.join('；')}`);
      lines.push(`   - 建议：${issue.suggestion}\n`);
    });
  }
  
  // 对话风格
  lines.push('## 对话风格分析\n');
  analysis.dialogueStyles.forEach(style => {
    lines.push(`### ${style.character}`);
    lines.push(`- **独特性：** ${style.uniqueness.toFixed(1)}/100`);
    lines.push(`- **平均句长：** ${style.sentenceLength.toFixed(1)}字`);
    lines.push(`- **正式程度：** ${style.formalityLevel.toFixed(1)}/100`);
    lines.push(`- **情感基调：** ${style.emotionalTone}`);
    if (style.catchphrases.length > 0) {
      lines.push(`- **口头禅：** ${style.catchphrases.join('、')}`);
    }
    if (style.vocabulary.length > 0) {
      lines.push(`- **常用词：** ${style.vocabulary.slice(0, 5).join('、')}`);
    }
    lines.push('');
  });
  
  // 动机分析
  lines.push('## 行为动机分析\n');
  analysis.motivationChains.forEach(chain => {
    lines.push(`### ${chain.character}`);
    lines.push(`- **动机：** ${chain.motivation}`);
    lines.push(`- **一致性：** ${chain.consistency}/100`);
    lines.push(`- **行为序列：** ${chain.actions.slice(0, 5).join(' → ')}`);
    if (chain.issues.length > 0) {
      lines.push(`- **问题：** ${chain.issues.join('；')}`);
    }
    lines.push('');
  });
  
  // 成长曲线
  lines.push('## 人物成长曲线\n');
  analysis.growthCurves.forEach(growth => {
    lines.push(`### ${growth.character}`);
    lines.push(`- **成长轨迹：** ${growth.trajectory}`);
    lines.push(`- **可信度：** ${growth.believability}/100`);
    lines.push(`- **节奏评分：** ${growth.pacing}/100`);
    lines.push(`- **成长阶段：** ${growth.stages.length} 个`);
    lines.push('');
  });
  
  // 改进建议
  lines.push('## 改进建议\n');
  analysis.recommendations.forEach((rec, index) => {
    lines.push(`${index + 1}. ${rec}`);
  });
  
  return lines.join('\n');
}

/**
 * 生成人物优化提示词
 */
export function generateCharacterPrompt(analysis: CharacterAnalysis): string {
  const issues: string[] = [];
  
  if (analysis.consistencyIssues.length > 0) {
    issues.push(`性格一致性问题：${analysis.consistencyIssues.map(i => i.description).join('；')}`);
  }
  
  const lowUniqueness = analysis.dialogueStyles.filter(s => s.uniqueness < 40);
  if (lowUniqueness.length > 0) {
    issues.push(`对话风格单一：${lowUniqueness.map(s => s.character).join('、')}`);
  }
  
  const weakMotivation = analysis.motivationChains.filter(m => m.consistency < 60);
  if (weakMotivation.length > 0) {
    issues.push(`动机不明确：${weakMotivation.map(m => m.character).join('、')}`);
  }
  
  if (issues.length === 0) {
    return '人物塑造整体良好，继续保持角色的独特性和一致性。';
  }
  
  return `请优化以下人物塑造问题：\n\n${issues.map((issue, i) => `${i + 1}. ${issue}`).join('\n')}\n\n重点关注：\n- 保持角色性格前后一致\n- 增强对话的个性化和差异化\n- 明确角色行为的内在动机\n- 让角色成长更加自然可信`;
}
