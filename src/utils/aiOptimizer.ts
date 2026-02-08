/**
 * AI 去机械感优化工具
 * 
 * 功能：
 * 1. 预设提示词模板（减少 AI 味）
 * 2. 两段式生成：提纲 -> 正文 -> 审校去模板
 * 3. 检测和移除常见 AI 模板化表达
 * 4. 提供人性化改写建议
 */

// ============ AI 机械感特征检测 ============

/**
 * 常见 AI 机械化表达模式
 */
const AI_PATTERNS = [
  // 开头模板
  /^在.*的.*中[，,]/,
  /^随着.*的.*[，,]/,
  /^当.*的时候[，,]/,
  /^在这个.*的.*里[，,]/,
  
  // 转折模板
  /然而[，,].*并非/,
  /但是[，,]事情并非/,
  /不过[，,].*却/,
  
  // 总结模板
  /总的来说[，,]/,
  /总而言之[，,]/,
  /综上所述[，,]/,
  /由此可见[，,]/,
  
  // 过度修饰
  /深深地.*着/,
  /紧紧地.*着/,
  /静静地.*着/,
  /默默地.*着/,
  
  // 重复结构
  /不仅.*而且.*更/,
  /既.*又.*还/,
  /一方面.*另一方面/,
];

/**
 * 检测文本中的 AI 机械感
 */
export function detectAIPatterns(text: string): {
  score: number; // 0-100，越高越机械
  patterns: Array<{ pattern: string; position: number; context: string }>;
  suggestions: string[];
} {
  const matches: Array<{ pattern: string; position: number; context: string }> = [];
  
  AI_PATTERNS.forEach(pattern => {
    const regex = new RegExp(pattern, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(text.length, match.index + match[0].length + 20);
      matches.push({
        pattern: pattern.source,
        position: match.index,
        context: text.substring(start, end),
      });
    }
  });
  
  // 计算机械感分数
  const score = Math.min(100, matches.length * 15);
  
  // 生成建议
  const suggestions: string[] = [];
  if (score > 60) {
    suggestions.push('文本存在较多模板化表达，建议重写');
  } else if (score > 30) {
    suggestions.push('部分句式过于规整，可适当调整');
  }
  
  if (matches.some(m => m.pattern.includes('^'))) {
    suggestions.push('开头过于模板化，建议直接切入场景或对话');
  }
  
  if (matches.some(m => m.pattern.includes('总'))) {
    suggestions.push('避免使用"总的来说"等总结性开头');
  }
  
  return { score, patterns: matches, suggestions };
}

// ============ 预设提示词模板 ============

/**
 * 写作风格预设
 */
export const WRITING_STYLE_PRESETS = {
  // 网文风格
  webnovel: {
    name: '网文轻小说',
    systemPrompt: `你是一位经验丰富的网文作家。写作要求：
1. 直接、生动，避免冗长描述
2. 多用对话推进剧情，少用旁白
3. 节奏紧凑，每段都有信息量
4. 避免"在...的...中"、"随着...的..."等模板开头
5. 人物对话要有个性，符合人设
6. 场景描写简洁有力，不要堆砌形容词
7. 情节转折自然，不要刻意总结`,
    temperature: 0.85,
  },
  
  // 传统文学
  literary: {
    name: '传统文学',
    systemPrompt: `你是一位文学作家。写作要求：
1. 语言凝练，意境深远
2. 注重细节描写和心理刻画
3. 善用比喻、象征等修辞手法
4. 避免口语化和网络用语
5. 节奏舒缓，留白适度
6. 人物塑造立体，避免脸谱化`,
    temperature: 0.75,
  },
  
  // 悬疑推理
  mystery: {
    name: '悬疑推理',
    systemPrompt: `你是一位悬疑推理作家。写作要求：
1. 信息布局精准，伏笔自然
2. 氛围营造紧张，细节真实
3. 逻辑严密，推理合理
4. 避免过度渲染和夸张描写
5. 对话简洁，信息量大
6. 节奏张弛有度，悬念层层递进`,
    temperature: 0.7,
  },
  
  // 都市情感
  romance: {
    name: '都市情感',
    systemPrompt: `你是一位都市情感作家。写作要求：
1. 语言贴近生活，真实自然
2. 情感细腻，心理描写到位
3. 对话生动，符合现代人说话方式
4. 避免过度煽情和刻意制造冲突
5. 场景描写简洁，突出氛围
6. 人物关系复杂但不狗血`,
    temperature: 0.8,
  },
  
  // 玄幻修仙
  fantasy: {
    name: '玄幻修仙',
    systemPrompt: `你是一位玄幻修仙作家。写作要求：
1. 世界观设定清晰，体系完整
2. 战斗场面简洁有力，避免冗长
3. 境界提升自然，不要突兀
4. 对话要有江湖气，但不要过度文言
5. 避免"深深地"、"紧紧地"等重复修饰
6. 情节推进快速，少用环境描写`,
    temperature: 0.85,
  },
};

/**
 * 去 AI 味通用提示词
 */
export const ANTI_AI_PROMPT = `
【重要】写作禁忌：
1. 禁止使用"在...的...中"、"随着...的..."等模板开头
2. 禁止使用"总的来说"、"综上所述"等总结性表达
3. 禁止过度使用"深深地"、"紧紧地"、"静静地"等副词
4. 禁止使用"不仅...而且...更"等刻板句式
5. 禁止堆砌形容词和过度修饰
6. 对话要自然，避免"某某说道"、"某某开口道"等重复表达
7. 直接切入场景，不要铺垫过多背景

【写作原则】
- 简洁有力，每句话都有信息量
- 多用动作和对话，少用旁白
- 场景描写点到为止，突出关键细节
- 人物语言要有个性，符合身份
- 情节转折自然流畅，不要刻意
`;

// ============ 两段式生成 ============

/**
 * 第一阶段：生成提纲
 */
export function generateOutlinePrompt(
  requirement: string,
  style: keyof typeof WRITING_STYLE_PRESETS = 'webnovel'
): string {
  const stylePreset = WRITING_STYLE_PRESETS[style];
  
  return `${stylePreset.systemPrompt}

${ANTI_AI_PROMPT}

【任务】根据以下需求，生成详细的章节提纲：

${requirement}

【提纲要求】
1. 列出3-5个关键场景或情节点
2. 每个场景包含：地点、人物、核心冲突、情节走向
3. 标注重点对话或动作
4. 提纲要简洁，每个场景2-3句话
5. 不要写正文，只写提纲框架

请直接输出提纲，不要有多余的说明。`;
}

/**
 * 第二阶段：根据提纲生成正文
 */
export function generateContentFromOutlinePrompt(
  outline: string,
  style: keyof typeof WRITING_STYLE_PRESETS = 'webnovel',
  wordCount: number = 2000
): string {
  const stylePreset = WRITING_STYLE_PRESETS[style];
  
  return `${stylePreset.systemPrompt}

${ANTI_AI_PROMPT}

【任务】根据以下提纲，扩写成完整的章节内容：

${outline}

【扩写要求】
1. 目标字数：约${wordCount}字
2. 严格按照提纲展开，不要偏离
3. 多用对话和动作推进剧情
4. 场景描写简洁，突出关键细节
5. 人物对话要有个性，符合人设
6. 避免使用模板化开头和结尾
7. 不要总结，直接结束在情节高潮或转折点

请直接输出正文，不要有任何说明或标题。`;
}

/**
 * 第三阶段：审校去模板
 */
export function generateReviewPrompt(content: string): string {
  return `${ANTI_AI_PROMPT}

【任务】审校以下文本，去除 AI 机械感和模板化表达：

${content}

【审校要点】
1. 删除或改写模板化开头（如"在...的...中"）
2. 删除总结性表达（如"总的来说"）
3. 简化过度修饰（如"深深地"、"紧紧地"）
4. 优化重复句式
5. 让对话更自然，减少"说道"、"开口道"
6. 保持原文风格和情节，只优化表达

请直接输出优化后的文本，不要有说明。`;
}

// ============ 批量去 AI 味处理 ============

/**
 * 移除常见 AI 模板表达
 */
export function removeAITemplates(text: string): string {
  let result = text;
  
  // 移除模板化开头
  result = result.replace(/^在.*?的.*?中[，,]\s*/gm, '');
  result = result.replace(/^随着.*?的.*?[，,]\s*/gm, '');
  result = result.replace(/^当.*?的时候[，,]\s*/gm, '');
  
  // 移除总结性表达
  result = result.replace(/总的来说[，,]\s*/g, '');
  result = result.replace(/总而言之[，,]\s*/g, '');
  result = result.replace(/综上所述[，,]\s*/g, '');
  result = result.replace(/由此可见[，,]\s*/g, '');
  
  // 简化过度修饰
  result = result.replace(/深深地/g, '');
  result = result.replace(/紧紧地/g, '');
  result = result.replace(/静静地/g, '');
  result = result.replace(/默默地/g, '');
  
  // 优化对话标签
  result = result.replace(/说道/g, '说');
  result = result.replace(/开口道/g, '说');
  result = result.replace(/回答道/g, '回答');
  
  return result;
}

/**
 * 两段式生成配置
 */
export interface TwoStageGenerationConfig {
  requirement: string;
  style: keyof typeof WRITING_STYLE_PRESETS;
  wordCount: number;
  enableReview: boolean; // 是否启用第三阶段审校
}

/**
 * 两段式生成结果
 */
export interface TwoStageGenerationResult {
  outline: string;
  content: string;
  reviewedContent?: string;
  aiScore: number;
  suggestions: string[];
}
