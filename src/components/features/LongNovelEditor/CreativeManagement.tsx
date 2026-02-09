import React, { useState, useEffect } from 'react';
import { Character, Worldview, TimelineEvent, Reference } from '../../../types';
import { generateCreativeContentStream } from '../../../services/api/gemini';

type ManagementType = 'characters' | 'worldview' | 'events' | 'references';

interface CreativeManagementModalProps {
  type: ManagementType;
  isOpen: boolean;
  onClose: () => void;
  novelTitle?: string;
  novelDescription?: string;
  // 人物相关
  characters: Character[];
  onAddCharacter: (data: Omit<Character, 'id' | 'createdAt'>) => void;
  onUpdateCharacter: (id: string, data: Partial<Character>) => void;
  onDeleteCharacter: (id: string) => void;
  // 世界观相关
  worldviews: Worldview[];
  onAddWorldview: (data: Omit<Worldview, 'id' | 'createdAt'>) => void;
  onUpdateWorldview: (id: string, data: Partial<Worldview>) => void;
  onDeleteWorldview: (id: string) => void;
  // 事件线相关
  events: TimelineEvent[];
  onAddEvent: (data: Omit<TimelineEvent, 'id' | 'createdAt'>) => void;
  onUpdateEvent: (id: string, data: Partial<TimelineEvent>) => void;
  onDeleteEvent: (id: string) => void;
  // 语料库相关
  references: Reference[];
  onAddReference: (data: Omit<Reference, 'id' | 'createdAt'>) => void;
  onUpdateReference: (id: string, data: Partial<Reference>) => void;
  onDeleteReference: (id: string) => void;
}

// 角色类型选项
const ROLE_TYPES = ['主角', '配角', '反派', '导师', '龙套', '其他'];
// 性别选项
const GENDERS = ['男', '女', '未知', '其他'];
// 事件类型选项
const EVENT_TYPES = ['主线事件', '支线事件', '背景事件', '转折点', '高潮', '结局', '其他'];
// 语料类型选项
const REFERENCE_TYPES = ['参考', '灵感', '素材', '笔记', '其他'];

// 空箱子 SVG 图标
const EmptyBoxIcon = () => (
  <svg className="w-24 h-24 text-slate-200" viewBox="0 0 100 100" fill="none">
    <path d="M20 35L50 20L80 35V65L50 80L20 65V35Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M50 20V50M20 35L50 50L80 35" stroke="currentColor" strokeWidth="2"/>
    <path d="M50 50V80" stroke="currentColor" strokeWidth="2"/>
    <rect x="35" y="55" width="30" height="20" fill="currentColor" opacity="0.1"/>
  </svg>
);

const CreativeManagementModal: React.FC<CreativeManagementModalProps> = ({
  type,
  isOpen,
  onClose,
  novelTitle,
  novelDescription,
  characters,
  onAddCharacter,
  onUpdateCharacter,
  onDeleteCharacter,
  worldviews,
  onAddWorldview,
  onUpdateWorldview,
  onDeleteWorldview,
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  references,
  onAddReference,
  onUpdateReference,
  onDeleteReference,
}) => {
  // 当前选中的项目ID
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // 是否处于添加模式
  const [isAdding, setIsAdding] = useState(false);
  // AI生成状态
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratingField, setAiGeneratingField] = useState<string | null>(null);

  // 人物表单状态
  const [charForm, setCharForm] = useState({
    name: '',
    age: '',
    gender: '',
    role: '主角',
    appearance: '',
    personality: '',
    description: '',
    background: '',
    traits: [] as string[],
  });

  // 世界观表单状态
  const [worldForm, setWorldForm] = useState({
    title: '',
    category: '力量体系',
    geography: '',
    history: '',
    culture: '',
    magicSystem: '',
    content: '',
  });

  // 事件线表单状态
  const [eventForm, setEventForm] = useState({
    title: '',
    time: '',
    description: '',
    eventType: '主线事件',
    location: '',
    keyEvent: '',
    characters: [] as string[],
  });

  // 语料库表单状态
  const [refForm, setRefForm] = useState({
    title: '',
    content: '',
    category: '参考',
  });

  // 重置表单
  const resetForms = () => {
    setCharForm({
      name: '', age: '', gender: '', role: '主角',
      appearance: '', personality: '', description: '', background: '', traits: [],
    });
    setWorldForm({
      title: '', category: '力量体系', geography: '', history: '',
      culture: '', magicSystem: '', content: '',
    });
    setEventForm({
      title: '', time: '', description: '', eventType: '主线事件',
      location: '', keyEvent: '', characters: [],
    });
    setRefForm({ title: '', content: '', category: '参考' });
  };

  // 当选中项目变化时，加载数据到表单
  useEffect(() => {
    if (!selectedId) {
      if (!isAdding) resetForms();
      return;
    }
    setIsAdding(false);

    if (type === 'characters') {
      const char = characters.find(c => c.id === selectedId);
      if (char) {
        setCharForm({
          name: char.name,
          age: char.age || '',
          gender: char.gender || '',
          role: char.role,
          appearance: char.appearance || '',
          personality: char.personality || '',
          description: char.description,
          background: char.background || '',
          traits: char.traits,
        });
      }
    } else if (type === 'worldview') {
      const world = worldviews.find(w => w.id === selectedId);
      if (world) {
        setWorldForm({
          title: world.title,
          category: world.category,
          geography: world.geography || '',
          history: world.history || '',
          culture: world.culture || '',
          magicSystem: world.magicSystem || '',
          content: world.content,
        });
      }
    } else if (type === 'events') {
      const event = events.find(e => e.id === selectedId);
      if (event) {
        setEventForm({
          title: event.title,
          time: event.time,
          description: event.description,
          eventType: event.eventType || '主线事件',
          location: event.location || '',
          keyEvent: event.keyEvent || '',
          characters: event.characters,
        });
      }
    } else if (type === 'references') {
      const ref = references.find(r => r.id === selectedId);
      if (ref) {
        setRefForm({
          title: ref.title,
          content: ref.content,
          category: ref.category,
        });
      }
    }
  }, [selectedId, type, characters, worldviews, events, references, isAdding]);

  // 开始添加新项目
  const handleStartAdd = () => {
    setSelectedId(null);
    setIsAdding(true);
    resetForms();
  };

  // 保存表单
  const handleSave = () => {
    if (type === 'characters') {
      if (!charForm.name.trim()) {
        alert('请输入姓名');
        return;
      }
      if (selectedId && !isAdding) {
        onUpdateCharacter(selectedId, charForm);
      } else {
        onAddCharacter(charForm);
      }
    } else if (type === 'worldview') {
      if (!worldForm.title.trim()) {
        alert('请输入名称');
        return;
      }
      if (selectedId && !isAdding) {
        onUpdateWorldview(selectedId, worldForm);
      } else {
        onAddWorldview(worldForm);
      }
    } else if (type === 'events') {
      if (!eventForm.title.trim()) {
        alert('请输入事件名称');
        return;
      }
      if (selectedId && !isAdding) {
        onUpdateEvent(selectedId, eventForm);
      } else {
        onAddEvent(eventForm);
      }
    } else if (type === 'references') {
      if (!refForm.title.trim()) {
        alert('请输入素材标题');
        return;
      }
      if (selectedId && !isAdding) {
        onUpdateReference(selectedId, refForm);
      } else {
        onAddReference(refForm);
      }
    }
    setIsAdding(false);
    setSelectedId(null);
    resetForms();
  };

  // 取消编辑
  const handleCancel = () => {
    setIsAdding(false);
    setSelectedId(null);
    resetForms();
  };

  // 删除项目
  const handleDelete = (id: string) => {
    if (!window.confirm('确定要删除这个项目吗？')) return;
    if (type === 'characters') onDeleteCharacter(id);
    else if (type === 'worldview') onDeleteWorldview(id);
    else if (type === 'events') onDeleteEvent(id);
    else if (type === 'references') onDeleteReference(id);
    if (selectedId === id) {
      setSelectedId(null);
      resetForms();
    }
  };

  // ============ AI 生成功能 ============

  // AI 生成人物外貌特征
  const aiGenerateAppearance = async () => {
    if (!charForm.name.trim()) {
      alert('请先输入姓名');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('appearance');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

请为以下人物生成外貌特征描述（50-100字）：
人物姓名：${charForm.name}
年龄：${charForm.age || '未设定'}
性别：${charForm.gender || '未设定'}
角色定位：${charForm.role}

要求：
1. 描述身高、体型、发色、眼色、特殊标记等
2. 符合角色定位和网络小说风格
3. 描写要生动形象
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setCharForm(prev => ({ ...prev, appearance: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成人物性格特点
  const aiGeneratePersonality = async () => {
    if (!charForm.name.trim()) {
      alert('请先输入姓名');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('personality');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
人物姓名：${charForm.name}
角色定位：${charForm.role}
外貌特征：${charForm.appearance || '暂无'}

请为这个人物生成性格特点描述（50-100字）：
要求：
1. 描述性格倾向、行为习惯、说话方式等
2. 性格要鲜明，有特点
3. 既有正面也有负面特点，让人物更立体
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setCharForm(prev => ({ ...prev, personality: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成人物描述
  const aiGenerateCharDescription = async () => {
    if (!charForm.name.trim()) {
      alert('请先输入姓名');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('charDescription');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

请为以下人物生成综合描述（100-200字）：
人物姓名：${charForm.name}
年龄：${charForm.age || '未设定'}
性别：${charForm.gender || '未设定'}
角色定位：${charForm.role}
外貌特征：${charForm.appearance || '暂无'}
性格特点：${charForm.personality || '暂无'}

要求：
1. 综合描述人物的整体形象
2. 包括人物的特点、能力、身份等
3. 符合网络小说风格
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setCharForm(prev => ({ ...prev, description: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成人物背景
  const aiGenerateBackground = async () => {
    if (!charForm.name.trim()) {
      alert('请先输入姓名');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('background');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

请为以下人物生成背景故事（100-200字）：
人物姓名：${charForm.name}
年龄：${charForm.age || '未设定'}
性别：${charForm.gender || '未设定'}
角色定位：${charForm.role}
外貌特征：${charForm.appearance || '暂无'}
性格特点：${charForm.personality || '暂无'}

要求：
1. 描述人物的身世来历、过往经历
2. 可以设置一些隐藏秘密或伏笔
3. 与角色定位相符
4. 直接输出背景内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setCharForm(prev => ({ ...prev, background: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成地理环境
  const aiGenerateGeography = async () => {
    if (!worldForm.title.trim()) {
      alert('请先输入名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('geography');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}
世界观名称：${worldForm.title}

请生成这个世界的地理环境描述（100-200字）：
要求：
1. 描述地形、气候、地标等
2. 具有独特性和创意
3. 适合网络小说的设定风格
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setWorldForm(prev => ({ ...prev, geography: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成历史背景
  const aiGenerateHistory = async () => {
    if (!worldForm.title.trim()) {
      alert('请先输入名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('history');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}
世界观名称：${worldForm.title}
地理环境：${worldForm.geography || '暂无'}

请生成这个世界的历史背景描述（100-200字）：
要求：
1. 描述重要事件、朝代更替等
2. 具有史诗感和创意
3. 为后续剧情留下伏笔
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setWorldForm(prev => ({ ...prev, history: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成文化特色
  const aiGenerateCulture = async () => {
    if (!worldForm.title.trim()) {
      alert('请先输入名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('culture');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
世界观名称：${worldForm.title}
地理环境：${worldForm.geography || '暂无'}
历史背景：${worldForm.history || '暂无'}

请生成这个世界的文化特色描述（100-200字）：
要求：
1. 描述风俗习惯、宗教信仰、社会制度等
2. 与地理和历史相呼应
3. 具有独特性
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setWorldForm(prev => ({ ...prev, culture: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成魔法体系
  const aiGenerateMagicSystem = async () => {
    if (!worldForm.title.trim()) {
      alert('请先输入名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('magicSystem');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}
世界观名称：${worldForm.title}

请生成这个世界的魔法/力量体系描述（100-200字）：
要求：
1. 描述魔法原理、等级划分、使用方式等
2. 逻辑自洽，有层次感
3. 适合网络小说的成长系统
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setWorldForm(prev => ({ ...prev, magicSystem: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成世界观描述
  const aiGenerateWorldDescription = async () => {
    if (!worldForm.title.trim()) {
      alert('请先输入名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('worldDescription');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
世界观名称：${worldForm.title}
地理环境：${worldForm.geography || '暂无'}
历史背景：${worldForm.history || '暂无'}
文化特色：${worldForm.culture || '暂无'}
魔法体系：${worldForm.magicSystem || '暂无'}

请生成这个世界观的综合描述（100-200字）：
要求：
1. 总结性描述这个世界的核心特点
2. 突出独特卖点
3. 具有画面感
4. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setWorldForm(prev => ({ ...prev, content: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成事件描述
  const aiGenerateEventDescription = async () => {
    if (!eventForm.title.trim()) {
      alert('请先输入事件名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('eventDescription');

    const relatedChars = eventForm.characters
      .map(id => characters.find(c => c.id === id)?.name)
      .filter(Boolean)
      .join('、');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

请为以下事件生成详细描述（100-200字）：
事件名称：${eventForm.title}
事件类型：${eventForm.eventType}
时间点：${eventForm.time || '未指定'}
关键地点：${eventForm.location || '未指定'}
${relatedChars ? `相关人物：${relatedChars}` : ''}

要求：
1. 描述事件的内容和过程
2. 要有戏剧性和张力
3. 直接输出描述内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setEventForm(prev => ({ ...prev, description: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成关键事件
  const aiGenerateKeyEvent = async () => {
    if (!eventForm.title.trim()) {
      alert('请先输入事件名称');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('keyEvent');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
事件名称：${eventForm.title}
事件类型：${eventForm.eventType}
事件描述：${eventForm.description || '暂无'}

请描述这个事件中的关键转折点或重要情节（50-100字）：
要求：
1. 突出戏剧性转折
2. 为后续剧情埋下伏笔
3. 直接输出内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setEventForm(prev => ({ ...prev, keyEvent: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成语料内容
  const aiGenerateRefContent = async () => {
    if (!refForm.title.trim()) {
      alert('请先输入素材标题');
      return;
    }
    setIsAiGenerating(true);
    setAiGeneratingField('refContent');

    const prompt = `你是一个专业的网络小说创作助手。

小说标题：${novelTitle || '未命名'}
小说简介：${novelDescription || '暂无'}

请为以下素材生成详细内容（100-300字）：
素材标题：${refForm.title}
内容类型：${refForm.category}

要求：
1. 内容要详实、有参考价值
2. 适合作为创作参考资料
3. 直接输出内容，不要加任何标题或说明`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setRefForm(prev => ({ ...prev, content: result }));
      }, 'gemini-2.0-flash', { temperature: 0.9 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingField(null);
    }
  };

  // AI 生成按钮组件
  const AiButton: React.FC<{ onClick: () => void; loading: boolean; fieldKey: string }> = ({ onClick, loading, fieldKey }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isAiGenerating}
      className="text-xs text-[#2C5F2D] hover:text-[#1E4620] flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isAiGenerating && aiGeneratingField === fieldKey ? (
        <>
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          生成中...
        </>
      ) : (
        <>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          AI 生成
        </>
      )}
    </button>
  );

  // 获取标题
  const getTitle = () => {
    switch (type) {
      case 'characters': return '人物管理';
      case 'worldview': return '世界观管理';
      case 'events': return '事件线管理';
      case 'references': return '语料库管理';
    }
  };

  // 获取添加按钮文本
  const getAddButtonText = () => {
    switch (type) {
      case 'characters': return '+ 添加人物';
      case 'worldview': return '+ 添加世界观';
      case 'events': return '+ 添加事件线';
      case 'references': return '+ 添加语料';
    }
  };

  // 获取列表标题
  const getListTitle = () => {
    switch (type) {
      case 'characters': return '人物列表';
      case 'worldview': return '世界观列表';
      case 'events': return '事件线列表';
      case 'references': return '语料库列表';
    }
  };

  // 获取空状态提示
  const getEmptyText = () => {
    switch (type) {
      case 'characters': return '暂无人物数据';
      case 'worldview': return '暂无世界观数据';
      case 'events': return '暂无事件线数据';
      case 'references': return '暂无语料数据';
    }
  };

  // 获取当前列表数据
  const getListData = () => {
    switch (type) {
      case 'characters': return characters;
      case 'worldview': return worldviews;
      case 'events': return events;
      case 'references': return references;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[900px] max-h-[85vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <h2 className="text-lg font-bold text-slate-800">{getTitle()}</h2>
          <button className="text-slate-400 hover:text-slate-600 transition-colors" onClick={onClose}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 主体 */}
        <div className="flex flex-1 min-h-0">
          {/* 左侧列表 */}
          <div className="w-[280px] border-r border-slate-100 flex flex-col bg-slate-50/50">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="font-semibold text-slate-700">{getListTitle()}</span>
              <button
                onClick={handleStartAdd}
                className="px-3 py-1.5 bg-slate-900 text-white text-xs rounded-lg hover:bg-slate-800 transition-colors"
              >
                {getAddButtonText()}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {getListData().length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <EmptyBoxIcon />
                  <p className="text-sm mt-4">{getEmptyText()}</p>
                </div>
              ) : (
                getListData().map((item: any) => (
                  <div
                    key={item.id}
                    className={`group relative p-3 rounded-xl cursor-pointer transition-all ${
                      selectedId === item.id
                        ? 'bg-[#F0F7F0] border border-[#E8F5E8]'
                        : 'bg-white border border-slate-100 hover:border-[#E8F5E8] hover:shadow-sm'
                    }`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-slate-800 text-sm truncate pr-2">
                        {item.name || item.title}
                      </span>
                      <button
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                        onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    {type === 'characters' && (
                      <span className="text-xs text-slate-400 mt-1 block">{(item as Character).role}</span>
                    )}
                    {type === 'worldview' && (
                      <span className="text-xs text-slate-400 mt-1 block">{(item as Worldview).category}</span>
                    )}
                    {type === 'events' && (
                      <span className="text-xs text-slate-400 mt-1 block">{(item as TimelineEvent).eventType || '未分类'}</span>
                    )}
                    {type === 'references' && (
                      <span className="text-xs text-slate-400 mt-1 block">{(item as Reference).category}</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 右侧表单 */}
          <div className="flex-1 flex flex-col bg-white">
            {!selectedId && !isAdding ? (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <EmptyBoxIcon />
                <p className="text-sm mt-4">请选择一个项目进行编辑</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6">
                {/* 人物表单 */}
                {type === 'characters' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">
                        <span className="text-rose-500">*</span> 姓名
                      </label>
                      <input
                        value={charForm.name}
                        onChange={e => setCharForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入人物姓名"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-slate-500 mb-1.5 block">年龄</label>
                        <input
                          value={charForm.age}
                          onChange={e => setCharForm(prev => ({ ...prev, age: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                          placeholder="请输入年龄"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 mb-1.5 block">性别</label>
                        <select
                          value={charForm.gender}
                          onChange={e => setCharForm(prev => ({ ...prev, gender: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        >
                          <option value="">请选择性别</option>
                          {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm text-slate-500 mb-1.5 block">角色类型</label>
                        <select
                          value={charForm.role}
                          onChange={e => setCharForm(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        >
                          {ROLE_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">外貌特征</label>
                        <AiButton onClick={aiGenerateAppearance} loading={isAiGenerating} fieldKey="appearance" />
                      </div>
                      <textarea
                        value={charForm.appearance}
                        onChange={e => setCharForm(prev => ({ ...prev, appearance: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述人物的外貌特征，如身高、体型、发色、眼色、特殊标记等"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">性格特点</label>
                        <AiButton onClick={aiGeneratePersonality} loading={isAiGenerating} fieldKey="personality" />
                      </div>
                      <textarea
                        value={charForm.personality}
                        onChange={e => setCharForm(prev => ({ ...prev, personality: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述人物的性格特点，如性格倾向、行为习惯、说话方式等"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">描述</label>
                        <AiButton onClick={aiGenerateCharDescription} loading={isAiGenerating} fieldKey="charDescription" />
                      </div>
                      <textarea
                        value={charForm.description}
                        onChange={e => setCharForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入人物描述"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">背景</label>
                        <AiButton onClick={aiGenerateBackground} loading={isAiGenerating} fieldKey="background" />
                      </div>
                      <textarea
                        value={charForm.background}
                        onChange={e => setCharForm(prev => ({ ...prev, background: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入人物背景"
                      />
                    </div>
                  </div>
                )}

                {/* 世界观表单 */}
                {type === 'worldview' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">
                        <span className="text-rose-500">*</span> 名称
                      </label>
                      <input
                        value={worldForm.title}
                        onChange={e => setWorldForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入世界观名称"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">地理环境</label>
                        <AiButton onClick={aiGenerateGeography} loading={isAiGenerating} fieldKey="geography" />
                      </div>
                      <textarea
                        value={worldForm.geography}
                        onChange={e => setWorldForm(prev => ({ ...prev, geography: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述世界的地理环境，如地形、气候、地标等"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">历史背景</label>
                        <AiButton onClick={aiGenerateHistory} loading={isAiGenerating} fieldKey="history" />
                      </div>
                      <textarea
                        value={worldForm.history}
                        onChange={e => setWorldForm(prev => ({ ...prev, history: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述世界的历史背景，如重要事件、朝代更替等"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">文化特色</label>
                        <AiButton onClick={aiGenerateCulture} loading={isAiGenerating} fieldKey="culture" />
                      </div>
                      <textarea
                        value={worldForm.culture}
                        onChange={e => setWorldForm(prev => ({ ...prev, culture: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述世界的文化特色，如风俗习惯、宗教信仰、社会制度等"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">魔法体系</label>
                        <AiButton onClick={aiGenerateMagicSystem} loading={isAiGenerating} fieldKey="magicSystem" />
                      </div>
                      <textarea
                        value={worldForm.magicSystem}
                        onChange={e => setWorldForm(prev => ({ ...prev, magicSystem: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述世界的魔法体系，如魔法原理、等级划分、使用方式等"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">描述</label>
                        <AiButton onClick={aiGenerateWorldDescription} loading={isAiGenerating} fieldKey="worldDescription" />
                      </div>
                      <textarea
                        value={worldForm.content}
                        onChange={e => setWorldForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入世界观描述"
                      />
                    </div>
                  </div>
                )}

                {/* 事件线表单 */}
                {type === 'events' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">
                        <span className="text-rose-500">*</span> 事件名称
                      </label>
                      <input
                        value={eventForm.title}
                        onChange={e => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入事件名称"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">事件描述</label>
                        <AiButton onClick={aiGenerateEventDescription} loading={isAiGenerating} fieldKey="eventDescription" />
                      </div>
                      <textarea
                        value={eventForm.description}
                        onChange={e => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[100px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请详细描述事件的内容和过程"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">事件类型</label>
                      <select
                        value={eventForm.eventType}
                        onChange={e => setEventForm(prev => ({ ...prev, eventType: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                      >
                        {EVENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">关键地点</label>
                      <input
                        value={eventForm.location}
                        onChange={e => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入事件发生的关键地点"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">关键事件</label>
                        <AiButton onClick={aiGenerateKeyEvent} loading={isAiGenerating} fieldKey="keyEvent" />
                      </div>
                      <textarea
                        value={eventForm.keyEvent}
                        onChange={e => setEventForm(prev => ({ ...prev, keyEvent: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[80px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请描述事件中的关键转折点或重要情节"
                      />
                    </div>
                  </div>
                )}

                {/* 语料库表单 */}
                {type === 'references' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">
                        <span className="text-rose-500">*</span> 素材标题
                      </label>
                      <input
                        value={refForm.title}
                        onChange={e => setRefForm(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入素材标题"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-sm text-slate-500">
                          <span className="text-rose-500">*</span> 素材内容
                        </label>
                        <AiButton onClick={aiGenerateRefContent} loading={isAiGenerating} fieldKey="refContent" />
                      </div>
                      <textarea
                        value={refForm.content}
                        onChange={e => setRefForm(prev => ({ ...prev, content: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm min-h-[200px] focus:border-[#97BC62] focus:outline-none"
                        placeholder="请输入素材内容"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-500 mb-1.5 block">内容类型</label>
                      <select
                        value={refForm.category}
                        onChange={e => setRefForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm focus:border-[#97BC62] focus:outline-none"
                      >
                        {REFERENCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 底部按钮 */}
            {(selectedId || isAdding) && (
              <div className="px-6 py-4 border-t border-slate-100 flex justify-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={isAiGenerating}
                  className="px-8 py-2.5 bg-[#2C5F2D] text-white text-sm font-medium rounded-lg hover:bg-[#1E4620] transition-colors disabled:opacity-50"
                >
                  保存
                </button>
                <button
                  onClick={handleCancel}
                  className="px-8 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
                >
                  取消
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreativeManagementModal;
