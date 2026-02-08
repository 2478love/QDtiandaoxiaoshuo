/**
 * 敏感词检测工具
 * 
 * 功能：
 * 1. 多级敏感词检测（严重/中等/轻微）
 * 2. 精确定位敏感词位置
 * 3. 提供上下文和替换建议
 * 4. 支持变体检测（拆字、谐音、符号替换）
 */

export type SensitivityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface SensitiveWord {
  word: string;
  level: SensitivityLevel;
  category: string;
  alternatives?: string[]; // 替换建议
}

export interface SensitiveWordMatch {
  word: string;
  originalWord: string;    // 原文中的词（可能是变体）
  level: SensitivityLevel;
  category: string;
  chapterId: string;
  chapterTitle: string;
  position: number;
  context: string;
  alternatives?: string[];
}

export interface SensitiveWordCheckResult {
  totalMatches: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  matches: SensitiveWordMatch[];
  summary: string;
}

/**
 * 敏感词库（分级）
 */
const SENSITIVE_WORDS_DB: SensitiveWord[] = [
  // 严重级别 - 政治敏感
  { word: '政变', level: 'critical', category: '政治' },
  { word: '颠覆', level: 'critical', category: '政治' },
  { word: '分裂', level: 'critical', category: '政治' },
  { word: '暴动', level: 'critical', category: '政治' },
  { word: '革命', level: 'critical', category: '政治', alternatives: ['变革', '改革'] },
  
  // 严重级别 - 色情内容
  { word: '性交', level: 'critical', category: '色情' },
  { word: '淫秽', level: 'critical', category: '色情' },
  { word: '裸体', level: 'critical', category: '色情', alternatives: ['赤身', '未着衣物'] },
  
  // 严重级别 - 违法犯罪
  { word: '贩毒', level: 'critical', category: '违法' },
  { word: '吸毒', level: 'critical', category: '违法' },
  { word: '赌博', level: 'critical', category: '违法' },
  { word: '传销', level: 'critical', category: '违法' },
  
  // 高级别 - 暴力血腥
  { word: '杀人', level: 'high', category: '暴力', alternatives: ['击败', '制服'] },
  { word: '自杀', level: 'high', category: '暴力', alternatives: ['轻生', '了结'] },
  { word: '血腥', level: 'high', category: '暴力', alternatives: ['激烈', '惨烈'] },
  { word: '虐待', level: 'high', category: '暴力' },
  { word: '恐怖', level: 'high', category: '暴力', alternatives: ['可怕', '惊悚'] },
  
  // 中等级别 - 可能敏感
  { word: '政府', level: 'medium', category: '政治', alternatives: ['官府', '朝廷', '当局'] },
  { word: '领导', level: 'medium', category: '政治', alternatives: ['首领', '统领', '掌权者'] },
  { word: '暴力', level: 'medium', category: '暴力', alternatives: ['武力', '强力'] },
  { word: '色情', level: 'medium', category: '色情' },
  { word: '赌', level: 'medium', category: '违法', alternatives: ['博弈', '对赌'] },
  
  // 低级别 - 需注意
  { word: '死亡', level: 'low', category: '暴力', alternatives: ['逝去', '离世', '陨落'] },
  { word: '鲜血', level: 'low', category: '暴力', alternatives: ['血液', '殷红'] },
  { word: '尸体', level: 'low', category: '暴力', alternatives: ['遗体', '躯壳'] },
];

/**
 * 常见变体字符映射（用于检测规避）
 */
const VARIANT_CHARS: Record<string, string[]> = {
  '政': ['正', '政', '証'],
  '府': ['付', '府', '腐'],
  '杀': ['杀', '煞', '刹'],
  '死': ['死', '亡', '逝'],
  '血': ['血', '鲜', '红'],
  '色': ['色', '涩', '瑟'],
  '情': ['情', '青', '清'],
  '赌': ['赌', '堵', '睹'],
  '毒': ['毒', '独', '读'],
};

/**
 * 符号替换映射
 */
const SYMBOL_REPLACEMENTS: Record<string, string> = {
  '@': 'a',
  '$': 's',
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '8': 'b',
  '*': '',
  '#': '',
  '·': '',
  '•': '',
};

/**
 * 规范化文本（移除符号、统一变体）
 */
function normalizeText(text: string): string {
  let normalized = text.toLowerCase();
  
  // 移除常见规避符号
  Object.entries(SYMBOL_REPLACEMENTS).forEach(([symbol, replacement]) => {
    normalized = normalized.split(symbol).join(replacement);
  });
  
  // 移除空格
  normalized = normalized.replace(/\s+/g, '');
  
  return normalized;
}

/**
 * 生成词的可能变体
 */
function generateVariants(word: string): string[] {
  const variants = new Set<string>([word]);
  
  // 添加拆字变体（如：政府 -> 政 府）
  variants.add(word.split('').join(' '));
  variants.add(word.split('').join('·'));
  variants.add(word.split('').join('*'));
  
  // 添加字符变体
  const chars = word.split('');
  const variantCombinations: string[][] = chars.map(char => {
    const charVariants = VARIANT_CHARS[char];
    return charVariants ? [char, ...charVariants] : [char];
  });
  
  // 生成所有组合（限制数量避免爆炸）
  function combine(index: number, current: string) {
    if (index === variantCombinations.length) {
      variants.add(current);
      return;
    }
    if (variants.size > 100) return; // 限制变体数量
    
    variantCombinations[index].forEach(char => {
      combine(index + 1, current + char);
    });
  }
  
  combine(0, '');
  
  return Array.from(variants);
}

/**
 * 提取上下文
 */
function extractContext(content: string, position: number, length: number, contextLength: number = 30): string {
  const start = Math.max(0, position - contextLength);
  const end = Math.min(content.length, position + length + contextLength);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < content.length ? '...' : '';
  
  const before = content.substring(start, position);
  const match = content.substring(position, position + length);
  const after = content.substring(position + length, end);
  
  return `${prefix}${before}【${match}】${after}${suffix}`;
}

/**
 * 在文本中查找敏感词
 */
function findSensitiveWords(
  content: string,
  sensitiveWord: SensitiveWord,
  chapterId: string,
  chapterTitle: string
): SensitiveWordMatch[] {
  const matches: SensitiveWordMatch[] = [];
  const normalized = normalizeText(content);
  const variants = generateVariants(sensitiveWord.word);
  
  variants.forEach(variant => {
    const normalizedVariant = normalizeText(variant);
    let pos = 0;
    
    while ((pos = normalized.indexOf(normalizedVariant, pos)) !== -1) {
      // 在原文中找到对应位置
      let originalPos = 0;
      let normalizedPos = 0;
      
      while (normalizedPos < pos && originalPos < content.length) {
        const char = content[originalPos];
        const normalizedChar = normalizeText(char);
        if (normalizedChar) {
          normalizedPos += normalizedChar.length;
        }
        originalPos++;
      }
      
      // 提取原文中的词
      const originalWord = content.substring(originalPos, originalPos + variant.length);
      
      matches.push({
        word: sensitiveWord.word,
        originalWord,
        level: sensitiveWord.level,
        category: sensitiveWord.category,
        chapterId,
        chapterTitle,
        position: originalPos,
        context: extractContext(content, originalPos, originalWord.length),
        alternatives: sensitiveWord.alternatives,
      });
      
      pos += normalizedVariant.length;
    }
  });
  
  return matches;
}

/**
 * 检查敏感词
 */
export function checkSensitiveWords(
  chapters: Array<{ id: string; title: string; content: string }>,
  customWords: SensitiveWord[] = []
): SensitiveWordCheckResult {
  const allWords = [...SENSITIVE_WORDS_DB, ...customWords];
  const allMatches: SensitiveWordMatch[] = [];
  
  let criticalCount = 0;
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  
  chapters.forEach(chapter => {
    allWords.forEach(sensitiveWord => {
      const matches = findSensitiveWords(
        chapter.content,
        sensitiveWord,
        chapter.id,
        chapter.title
      );
      
      matches.forEach(match => {
        allMatches.push(match);
        
        switch (match.level) {
          case 'critical':
            criticalCount++;
            break;
          case 'high':
            highCount++;
            break;
          case 'medium':
            mediumCount++;
            break;
          case 'low':
            lowCount++;
            break;
        }
      });
    });
  });
  
  // 生成摘要
  let summary = '';
  if (criticalCount > 0) {
    summary = `发现 ${criticalCount} 处严重敏感词，建议立即修改！`;
  } else if (highCount > 0) {
    summary = `发现 ${highCount} 处高风险敏感词，建议修改。`;
  } else if (mediumCount > 0) {
    summary = `发现 ${mediumCount} 处中等敏感词，建议审查。`;
  } else if (lowCount > 0) {
    summary = `发现 ${lowCount} 处低风险词汇，可酌情修改。`;
  } else {
    summary = '未发现明显敏感词，内容相对安全。';
  }
  
  return {
    totalMatches: allMatches.length,
    criticalCount,
    highCount,
    mediumCount,
    lowCount,
    matches: allMatches.sort((a, b) => {
      // 按严重程度排序
      const levelOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return levelOrder[a.level] - levelOrder[b.level];
    }),
    summary,
  };
}

/**
 * 批量替换敏感词
 */
export function replaceSensitiveWords(
  content: string,
  replacements: Array<{ from: string; to: string }>
): string {
  let result = content;
  
  // 按长度降序排序
  const sortedReplacements = [...replacements].sort((a, b) => b.from.length - a.from.length);
  
  sortedReplacements.forEach(({ from, to }) => {
    result = result.split(from).join(to);
  });
  
  return result;
}

/**
 * 获取默认敏感词库
 */
export function getSensitiveWordsDatabase(): SensitiveWord[] {
  return [...SENSITIVE_WORDS_DB];
}

/**
 * 添加自定义敏感词
 */
export function addCustomSensitiveWord(word: SensitiveWord): void {
  SENSITIVE_WORDS_DB.push(word);
}
