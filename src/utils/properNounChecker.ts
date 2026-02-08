/**
 * 专有名词一致性检查工具
 * 
 * 功能：
 * 1. 检测人物、地点、道具名称的不一致写法
 * 2. 提供智能纠正建议
 * 3. 支持同音字、形近字检测
 * 4. 提供批量替换功能
 */

export interface ProperNounVariant {
  standard: string;        // 标准写法
  variant: string;         // 变体写法
  occurrences: number;     // 出现次数
  locations: Location[];   // 出现位置
  similarity: number;      // 相似度 (0-1)
  type: 'typo' | 'homophone' | 'similar' | 'abbreviation'; // 变体类型
}

export interface Location {
  chapterId: string;
  chapterTitle: string;
  position: number;        // 字符位置
  context: string;         // 上下文（前后各20字）
}

export interface ProperNounCheckResult {
  name: string;            // 名词
  category: 'character' | 'location' | 'item' | 'other';
  standardForm: string;    // 推荐的标准形式
  variants: ProperNounVariant[];
  totalOccurrences: number;
  confidence: number;      // 检测置信度 (0-1)
}

/**
 * 计算两个字符串的编辑距离（Levenshtein距离）
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const dp: number[][] = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }

  return dp[len1][len2];
}

/**
 * 计算字符串相似度
 */
function calculateSimilarity(str1: string, str2: string): number {
  if (str1 === str2) return 1;
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1;
  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * 常见同音字映射（简化版）
 */
const HOMOPHONE_MAP: Record<string, string[]> = {
  '张': ['章', '彰'],
  '李': ['理', '里', '礼'],
  '王': ['往', '望', '旺'],
  '刘': ['留', '流', '柳'],
  '陈': ['沉', '晨', '辰'],
  '杨': ['扬', '洋', '阳'],
  '赵': ['照', '兆'],
  '黄': ['皇', '煌'],
  '周': ['州', '洲'],
  '吴': ['无', '武', '伍'],
  '徐': ['许', '续'],
  '孙': ['损', '笋'],
  '马': ['码', '玛'],
  '朱': ['珠', '株'],
  '胡': ['湖', '壶'],
  '郭': ['国', '锅'],
  '何': ['和', '河', '荷'],
  '高': ['糕', '膏'],
  '林': ['临', '琳'],
  '罗': ['萝', '锣'],
};

/**
 * 检测是否为同音字变体
 */
function isHomophoneVariant(standard: string, variant: string): boolean {
  if (standard.length !== variant.length) return false;
  
  for (let i = 0; i < standard.length; i++) {
    const char1 = standard[i];
    const char2 = variant[i];
    
    if (char1 === char2) continue;
    
    // 检查是否在同音字映射中
    const homophones = HOMOPHONE_MAP[char1] || [];
    if (!homophones.includes(char2)) {
      // 反向检查
      const reverseHomophones = HOMOPHONE_MAP[char2] || [];
      if (!reverseHomophones.includes(char1)) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * 判断变体类型
 */
function detectVariantType(standard: string, variant: string): ProperNounVariant['type'] {
  if (standard === variant) return 'typo';
  
  // 检查是否为缩写
  if (variant.length < standard.length && standard.includes(variant)) {
    return 'abbreviation';
  }
  
  // 检查是否为同音字
  if (isHomophoneVariant(standard, variant)) {
    return 'homophone';
  }
  
  // 检查相似度
  const similarity = calculateSimilarity(standard, variant);
  if (similarity > 0.7) {
    return 'similar';
  }
  
  return 'typo';
}

/**
 * 提取上下文
 */
function extractContext(content: string, position: number, contextLength: number = 20): string {
  const start = Math.max(0, position - contextLength);
  const end = Math.min(content.length, position + contextLength);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < content.length ? '...' : '';
  return prefix + content.substring(start, end) + suffix;
}

/**
 * 在文本中查找所有匹配项
 */
function findAllOccurrences(
  content: string,
  pattern: string,
  chapterId: string,
  chapterTitle: string
): Location[] {
  const locations: Location[] = [];
  let pos = 0;
  
  while ((pos = content.indexOf(pattern, pos)) !== -1) {
    locations.push({
      chapterId,
      chapterTitle,
      position: pos,
      context: extractContext(content, pos + Math.floor(pattern.length / 2)),
    });
    pos += pattern.length;
  }
  
  return locations;
}

/**
 * 检查专有名词一致性
 */
export function checkProperNouns(
  standardNames: Array<{ name: string; category: ProperNounCheckResult['category'] }>,
  chapters: Array<{ id: string; title: string; content: string }>
): ProperNounCheckResult[] {
  const results: ProperNounCheckResult[] = [];
  
  standardNames.forEach(({ name, category }) => {
    const variantsMap = new Map<string, ProperNounVariant>();
    let totalOccurrences = 0;
    
    // 在所有章节中搜索
    chapters.forEach(chapter => {
      const content = chapter.content;
      
      // 精确匹配
      const exactLocations = findAllOccurrences(content, name, chapter.id, chapter.title);
      if (exactLocations.length > 0) {
        totalOccurrences += exactLocations.length;
        if (!variantsMap.has(name)) {
          variantsMap.set(name, {
            standard: name,
            variant: name,
            occurrences: 0,
            locations: [],
            similarity: 1,
            type: 'typo',
          });
        }
        const variant = variantsMap.get(name)!;
        variant.occurrences += exactLocations.length;
        variant.locations.push(...exactLocations);
      }
      
      // 模糊匹配（检测可能的变体）
      const words = content.match(/[\u4e00-\u9fa5]{2,}/g) || [];
      words.forEach(word => {
        if (word === name) return; // 跳过精确匹配
        
        const similarity = calculateSimilarity(name, word);
        
        // 相似度阈值：至少70%相似
        if (similarity >= 0.7 && similarity < 1) {
          const locations = findAllOccurrences(content, word, chapter.id, chapter.title);
          if (locations.length > 0) {
            totalOccurrences += locations.length;
            if (!variantsMap.has(word)) {
              variantsMap.set(word, {
                standard: name,
                variant: word,
                occurrences: 0,
                locations: [],
                similarity,
                type: detectVariantType(name, word),
              });
            }
            const variant = variantsMap.get(word)!;
            variant.occurrences += locations.length;
            variant.locations.push(...locations);
          }
        }
      });
    });
    
    // 只有发现变体时才添加结果
    const variants = Array.from(variantsMap.values());
    if (variants.length > 1 || (variants.length === 1 && variants[0].variant !== name)) {
      // 计算置信度：基于变体数量和相似度
      const avgSimilarity = variants.reduce((sum, v) => sum + v.similarity, 0) / variants.length;
      const confidence = Math.min(1, avgSimilarity * (1 - 0.1 * (variants.length - 1)));
      
      results.push({
        name,
        category,
        standardForm: name,
        variants: variants.sort((a, b) => b.occurrences - a.occurrences),
        totalOccurrences,
        confidence,
      });
    }
  });
  
  return results.sort((a, b) => b.totalOccurrences - a.totalOccurrences);
}

/**
 * 批量替换专有名词
 */
export function replaceProperNouns(
  content: string,
  replacements: Array<{ from: string; to: string }>
): string {
  let result = content;
  
  // 按长度降序排序，避免短词替换影响长词
  const sortedReplacements = [...replacements].sort((a, b) => b.from.length - a.from.length);
  
  sortedReplacements.forEach(({ from, to }) => {
    // 使用全局替换
    result = result.split(from).join(to);
  });
  
  return result;
}
