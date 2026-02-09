import React, { useEffect, useRef, useState } from 'react';
import { ActivityEntry } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';
import { getApiSettings, getAvailableModels, getProviderDisplayName } from '../../../config/apiConfig';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useFocusMode } from '../../../hooks';

interface ToolCard {
  id: string;
  title: string;
  roleName: string;
  description: string;
  tag: string;
  usageCount: number;
  systemPrompt: string;
}

const TOOLS_DATA: ToolCard[] = [
  {
    id: 'world-view',
    title: '世界观生成助手',
    roleName: 'World Architect',
    description: '帮助你构建完整的架空世界：包含力量体系、社会结构、地理风貌与传说背景。',
    tag: '创意助手',
    usageCount: 2021,
    systemPrompt: `你是一位资深的网络小说世界观架构师，专精于构建宏大、逻辑自洽的架空世界。

【核心能力】
1. 力量体系设计：创建独特的修炼/能力体系，包括等级划分、进阶条件、核心机制
2. 社会结构规划：设计王朝/宗门/组织的架构、阶层关系、权力运作
3. 地理环境构建：描绘大陆版图、险地秘境、资源分布
4. 历史背景编写：编织上古传说、历史事件、种族起源

【输出原则】
- 保持内在逻辑一致性，设定之间相互呼应
- 留有发展空间，便于后续剧情拓展
- 融入网文爽点元素，如稀缺资源、隐藏传承等
- 使用分层结构，从宏观到微观逐步细化

【风格要求】
- 语言凝练有力，专业术语适度
- 设定要有独特性，避免过度借鉴
- 注重画面感和代入感`
  },
  {
    id: 'character',
    title: '人物雕刻助手',
    roleName: 'Character Sculptor',
    description: '快速生成有血有肉的角色设定，涵盖外貌、性格、背景和成长弧线。',
    tag: '创意助手',
    usageCount: 563,
    systemPrompt: `你是一位专业的网络小说人物设计师，擅长创造令读者印象深刻的角色。

【核心能力】
1. 外貌塑造：标志性特征、气质描写、服饰风格
2. 性格刻画：核心性格、行为模式、说话风格、心理特点
3. 背景故事：身世来历、过往经历、隐藏秘密
4. 成长弧线：初始状态、转折点、最终蜕变
5. 人物关系：与主角的羁绊、潜在冲突、情感纽带

【输出原则】
- 角色要有鲜明记忆点（外号、口头禅、标志动作等）
- 性格要有合理的形成原因
- 留有性格反差或隐藏面，增加层次感
- 考虑角色在剧情中的功能定位（助攻、反派、导师等）

【风格要求】
- 人物描写要生动立体，避免脸谱化
- 融入网文常见但受欢迎的人设元素
- 注重人物魅力塑造，让读者产生情感共鸣`
  },
  {
    id: 'gold-finger',
    title: '金手指设计器',
    roleName: 'Cheat Forge',
    description: '量身打造独特外挂或系统能力，兼顾成长性与剧情融合度。',
    tag: '创意助手',
    usageCount: 208,
    systemPrompt: `你是一位网络小说金手指/外挂系统设计专家，精通各类成长型能力的构建。

【核心能力】
1. 系统类金手指：签到系统、任务系统、抽奖系统、面板系统
2. 传承类金手指：上古传承、神秘空间、绝世功法、远古血脉
3. 异能类金手指：特殊体质、天赋神通、独特感知、时空能力
4. 辅助类金手指：鉴定能力、预知未来、读心术、复制能力

【设计原则】
- 能力要有成长性，不能一开始就太逆天
- 设置合理限制条件（冷却时间、消耗、副作用等）
- 能力获取要有合理契机，不能太刻意
- 与世界观设定相融合，不能过于违和
- 留有升级空间和隐藏功能

【爽点设计】
- 初期小惊喜，中期大逆转，后期震撼揭秘
- 设计让主角"闷声发大财"的机制
- 考虑如何通过金手指制造装逼打脸场景`
  },
  {
    id: 'opening',
    title: '黄金开篇助手',
    roleName: 'Opening Expert',
    description: '专注前三章节奏，完成"立人设、埋悬念、出金手、造冲突"四大目标。',
    tag: '创意助手',
    usageCount: 499,
    systemPrompt: `你是一位网络小说黄金开篇专家，精通如何在前三章抓住读者眼球。

【黄金开篇四要素】
1. 立人设：第一章就要让主角形象鲜明，有记忆点
2. 埋悬念：设置引人入胜的谜团，让读者想往下看
3. 出金手：暗示或初现主角的特殊机遇
4. 造冲突：制造紧张感，让主角面临困境或挑战

【章节节奏】
- 第一章：强势开场，建立世界观，主角登场，遭遇困境
- 第二章：金手指初现，小试牛刀，埋下伏笔
- 第三章：初次爽点，小规模打脸/逆袭，吸引继续阅读

【核心技巧】
- 开篇避免大段设定介绍，要在行动中展示
- 第一句话就要有吸引力
- 每章结尾留悬念（断章技巧）
- 对话要有张力，推动剧情
- 融入小爽点，让读者获得即时满足

【禁忌事项】
- 避免冗长的背景介绍
- 避免主角开局就无敌
- 避免过多角色同时出场`
  },
  {
    id: 'synopsis',
    title: '简介润色助手',
    roleName: 'Synopsis Master',
    description: '把复杂剧情提炼成 200-300 字的高转化简介，突出卖点与爽点。',
    tag: '创意助手',
    usageCount: 148,
    systemPrompt: `你是一位网络小说简介撰写专家，擅长用精炼的文字吸引读者点击。

【简介结构公式】
1. 钩子句（1-2句）：制造悬念或冲击，吸引注意力
2. 主角介绍（1-2句）：身份、处境、特点
3. 核心卖点（2-3句）：金手指、主线剧情、爽点预告
4. 收尾悬念（1句）：留白或金句，引发好奇

【核心技巧】
- 用数字增强冲击力（如"三千年后重生"）
- 用对比制造张力（如"人人唾弃的废物竟是..."）
- 用疑问句引发好奇
- 用短句增强节奏感
- 关键词前置（系统、重生、穿越等）

【优化方向】
- 突出差异化卖点，避免千篇一律
- 保持神秘感，不剧透关键转折
- 文风要与正文一致
- 200-300字最佳，不宜过长

【禁忌事项】
- 不要写成故事大纲
- 不要堆砌太多设定
- 不要使用过于俗套的开头`
  },
  {
    id: 'title',
    title: '书名灵感工坊',
    roleName: 'Title Creator',
    description: '根据题材与风格生成一批高记忆点书名，助力作品脱颖而出。',
    tag: '创意助手',
    usageCount: 202,
    systemPrompt: `你是一位网络小说书名创意专家，精通各类吸睛书名的命名技巧。

【书名类型】
1. 身份型：突出主角身份（如《神医弃妃》《全球高武》）
2. 金手指型：突出核心能力（如《万古第一神》《无限恐怖》）
3. 悬念型：制造疑问（如《这个人仙太过正经》）
4. 数字型：用数字增强记忆（如《一世之尊》《三寸人间》）
5. 反差型：制造冲突感（如《赘婿》《废材逆袭》）
6. 金句型：有格调的短语（如《诡秘之主》《道君》）

【命名原则】
- 简洁有力：4-8字最佳
- 易读易记：避免生僻字
- 题材明确：让读者一眼知道类型
- 独特性：避免与热门作品撞名
- 画面感：能联想到具体场景

【生成要求】
- 每次提供 8-12 个备选
- 包含不同风格类型
- 标注每个书名的特点和适用场景
- 考虑搜索关键词优化`
  },
  {
    id: 'idea',
    title: '脑洞孵化器',
    roleName: 'Idea Generator',
    description: '组合不同元素与题材，产出新颖设定与剧情钩子，开启写作灵感。',
    tag: '创意助手',
    usageCount: 437,
    systemPrompt: `你是一位网络小说创意激发专家，擅长融合元素、碰撞灵感、产出新颖点子。

【创意激发方法】
1. 元素混搭：将不同题材/设定进行创新组合
2. 反转套路：颠覆常见桥段，制造意外
3. 视角转换：换一个角度看待常见设定
4. 现实嫁接：将现实概念融入幻想世界
5. "如果..."假设：大胆假设，小心求证

【题材元素库】
- 题材：玄幻、仙侠、都市、科幻、游戏、历史、末世
- 流派：无敌流、系统流、种田流、群像流、无限流
- 元素：重生、穿越、夺舍、召唤、副本、位面
- 背景：修真界、星际时代、末日废土、平行世界

【输出形式】
- 核心创意：一句话概括
- 详细展开：2-3段说明
- 发展方向：可能的剧情走向
- 爽点预设：能制造哪些爽点场景

【创新准则】
- 保持可行性，不要过于天马行空
- 考虑市场接受度
- 留有深挖空间`
  },
  {
    id: 'full-assistant',
    title: '网文全流程助手',
    roleName: 'WebNovel Sage',
    description: '从灵感引导到章节润色，全流程协助网络作者打磨作品。',
    tag: '通用助手',
    usageCount: 650,
    systemPrompt: `你是一位全能的网络小说创作顾问，精通网文创作的各个环节。

【服务范围】
1. 前期策划：选题分析、大纲规划、人设构建、世界观设计
2. 写作辅助：情节推进、对话润色、场景描写、战斗场面
3. 优化提升：节奏把控、爽点设计、伏笔布局、断章技巧
4. 问题诊断：找出卡文原因、分析数据下滑、给出改进建议

【核心理念】
- 读者体验优先：时刻考虑读者的阅读感受
- 商业与艺术平衡：既要有爽点，也要有深度
- 因材施教：根据不同作者风格给出个性化建议

【交互原则】
- 先了解需求，再给出方案
- 提供多个选项，让作者自主选择
- 解释建议背后的原因
- 鼓励作者保持个人风格

【网文核心要素】
- 代入感：让读者能代入主角视角
- 爽感：制造持续的满足感和期待感
- 节奏感：张弛有度，高潮迭起
- 独特性：有辨识度的设定或写法

请告诉我你需要什么帮助，我会尽力协助你。`
  }
];

const TONES = [
  { id: 'standard', label: '标准' },
  { id: 'vivid', label: '生动' },
  { id: 'serious', label: '严肃' },
  { id: 'humor', label: '幽默' }
];

interface WritingToolProps {
  onRecordActivity?: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;
}

const WritingTool: React.FC<WritingToolProps> = ({ onRecordActivity }) => {
  const [selectedTool, setSelectedTool] = useState<ToolCard>(TOOLS_DATA[0]);
  const [tone, setTone] = useState(TONES[0].id);

  // 专注模式
  const { isFocusMode, setIsFocusMode } = useFocusMode();

  // 从 API 设置获取当前配置
  const [apiSettings, setApiSettings] = useState(getApiSettings);
  const [availableModels, setAvailableModels] = useState(getAvailableModels);
  const [model, setModel] = useState(apiSettings.selectedModel || availableModels[0]?.id || '');

  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  // 使用 ref 存储最新的 model 值，避免闭包问题
  const modelRef = useRef(model);
  useEffect(() => {
    modelRef.current = model;
  }, [model]);

  // 监听 API 设置变化（只注册一次，使用 ref 获取最新状态）
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = getApiSettings();
      setApiSettings(newSettings);
      const newModels = getAvailableModels(newSettings);
      setAvailableModels(newModels);
      // 使用 ref 获取最新的 model 值
      if (!newModels.find(m => m.id === modelRef.current)) {
        setModel(newSettings.selectedModel || newModels[0]?.id || '');
      }
    };

    // 初始化时也更新一次
    handleStorageChange();

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (generatedText && outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [generatedText]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setGeneratedText('');

    // 构建语气描述
    const toneMap: Record<string, string> = {
      standard: '标准、专业的语气',
      vivid: '生动、形象的语气，多用比喻和描写',
      serious: '严肃、正式的语气',
      humor: '幽默、轻松的语气'
    };
    const toneDesc = toneMap[tone] || '标准语气';

    // 用户提示词
    const userPrompt = `【语气要求】${toneDesc}\n\n【用户需求】${prompt}`;

    let content = '';
    await generateCreativeContentStream(userPrompt, (chunk) => {
      content += chunk;
      setGeneratedText((prev) => prev + chunk);
    }, model, {
      systemInstruction: selectedTool.systemPrompt,
      temperature: 0.85
    });
    setIsGenerating(false);
    if (content) {
      onRecordActivity?.({
        type: 'ai_call',
        description: `使用 ${selectedTool.title} 生成内容`,
        deltaPoints: -1,
        createdAt: new Date().toISOString(),
        metadata: { words: content.length }
      });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // 专注模式渲染
  if (isFocusMode) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] dark:bg-slate-950 flex flex-col">
        {/* 顶部工具栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{selectedTool.title}</h2>
            <span className="text-sm text-slate-500 dark:text-slate-400">专注模式</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {generatedText.length} 字
            </span>
            <button
              onClick={() => setIsFocusMode(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="退出专注模式 (ESC)"
            >
              <Minimize2 className="w-4 h-4" />
              退出专注
            </button>
          </div>
        </div>

        {/* 主编辑区域 */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full p-8">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              placeholder='请输入指令，例如"帮我写一段热血战斗桥段"。'
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-base bg-white dark:bg-slate-900 mb-4"
            />
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 rounded-xl bg-[#2C5F2D] dark:bg-[#3a7a3d] text-white text-sm font-medium disabled:opacity-60 hover:bg-[#234d24] dark:hover:bg-[#2d6230] transition-colors"
              >
                {isGenerating ? '生成中...' : '开始生成'}
              </button>
              <button
                onClick={handleCopy}
                disabled={!generatedText}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                {isCopied ? '已复制' : '复制内容'}
              </button>
            </div>

            <div ref={outputRef} className="flex-1 overflow-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              {generatedText ? (
                <article className="prose dark:prose-invert max-w-none text-base leading-relaxed">
                  {generatedText}
                  {isGenerating && <span className="inline-block w-2 h-6 bg-[#2C5F2D] ml-1 animate-pulse" />}
                </article>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-600">
                  <p>输入需求后点击"开始生成"，AI 将为你输出内容。</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 max-w-[1600px] mx-auto">
      <div className="w-[360px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col gap-4 overflow-y-auto">
        {TOOLS_DATA.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setSelectedTool(tool)}
            className={`text-left rounded-2xl border px-4 py-3 transition ${
              selectedTool.id === tool.id
                ? 'border-[#2C5F2D] bg-[#F0F7F0] dark:bg-[#2C5F2D]/30 text-[#1E4620] dark:text-[#97BC62]'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="text-xs text-slate-400 flex justify-between">
              <span>{tool.tag}</span>
              <span>调用 {tool.usageCount}</span>
            </div>
            <p className="text-base font-semibold text-slate-800 dark:text-slate-100 mt-1">{tool.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{tool.description}</p>
          </button>
        ))}
      </div>

      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">当前助手</p>
            <p className="text-lg font-bold text-slate-900 dark:text-slate-100">{selectedTool.title}</p>
          </div>
          <div className="flex gap-3 text-sm items-center">
            <button
              onClick={() => setIsFocusMode(true)}
              className="p-2 text-[#7F8C8D] dark:text-slate-400 hover:text-[#2C5F2D] dark:hover:text-[#a8d5aa] hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              title="专注模式 (F11)"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <select value={tone} onChange={(e) => setTone(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white dark:bg-slate-900">
              {TONES.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
            <select value={model} onChange={(e) => setModel(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 bg-white dark:bg-slate-900">
              {availableModels.map((item) => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={5}
            placeholder='请输入指令，例如"帮我写一段热血战斗桥段"。'
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm bg-white dark:bg-slate-900"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-sm disabled:opacity-60"
            >
              {isGenerating ? '生成中...' : '开始生成'}
            </button>
            <button
              onClick={handleCopy}
              disabled={!generatedText}
              className="px-4 py-2 rounded-2xl border border-slate-200 text-sm disabled:opacity-50"
            >
              {isCopied ? '已复制' : '复制内容'}
            </button>
          </div>
        </div>

        <div ref={outputRef} className="flex-1 border-t border-slate-100 dark:border-slate-800 px-6 py-4 overflow-auto">
          {generatedText ? (
            <article className="prose dark:prose-invert max-w-none text-sm leading-relaxed">
              {generatedText}
              {isGenerating && <span className="inline-block w-2 h-5 bg-[#2C5F2D] ml-1 animate-pulse" />}
            </article>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 dark:text-slate-600">
              <p>输入需求后点击"开始生成"，AI 将为你输出内容。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WritingTool;
