import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Chapter, ActivityEntry, Novel, Character, Worldview, TimelineEvent, Reference, MindMap, MindMapNode, PromptEntry, Volume, OutlineNode, Foreshadowing, WritingGoal, WritingRecord, Location, Item, ChapterTemplate } from '../../../types';
import { generateCreativeContentStream, GenerateOptions } from '../../../services/api/gemini';
import { getApiSettings, getAvailableModels } from '../../../config/apiConfig';
import CreativeManagementModal from './CreativeManagement';
import OutlineManager from './OutlineManager';
import ForeshadowingTracker from './ForeshadowingTracker';
import {
  createId,
  createChapterId,
  createVolumeId,
  createCharacterId,
  createWorldviewId,
  createTimelineId,
  createReferenceId,
  createMindMapId,
  createLocationId,
  createItemId,
  createTemplateId,
  createMessageId,
  createRecordId,
  createGoalId
} from '../../../utils/id';

// AI 助手会话相关类型
interface AIChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

interface AIChatSession {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

interface LongNovelEditorProps {
  novel: Novel | null;
  onUpdateNovel: (updates: Partial<Novel>) => void;
  onBack: () => void;
  onRecordActivity?: (entry: Omit<ActivityEntry, 'id' | 'createdAt'> & { createdAt?: string }) => void;
  prompts?: PromptEntry[];
}

type AssistantTab = 'ai' | 'tools' | 'settings';
type EditorMode = 'writing' | 'mindmap';
type CreativeManagementTab = 'characters' | 'worldview' | 'events' | 'references';

const NODE_COLORS = [
  { id: 'rose', bg: 'bg-rose-500', label: '玫红' },
  { id: 'indigo', bg: 'bg-indigo-500', label: '靛蓝' },
  { id: 'emerald', bg: 'bg-emerald-500', label: '翠绿' },
  { id: 'amber', bg: 'bg-amber-500', label: '琥珀' },
  { id: 'violet', bg: 'bg-violet-500', label: '紫罗兰' },
  { id: 'cyan', bg: 'bg-cyan-500', label: '青色' },
  { id: 'slate', bg: 'bg-slate-500', label: '灰色' },
];

// 创建新节点
const createNode = (title: string, color?: string): MindMapNode => ({
  id: createMindMapId(),
  title,
  color: color || NODE_COLORS[Math.floor(Math.random() * NODE_COLORS.length)].bg,
  children: []
});

// 创建新思维导图
const createMindMapData = (name: string, rootTitle: string): MindMap => ({
  id: createMindMapId(),
  name,
  root: createNode(rootTitle, 'bg-rose-500'),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

// 获取默认章节模板
const getDefaultTemplates = (): ChapterTemplate[] => [
  {
    id: 'tpl-battle-1',
    name: '战斗开场',
    category: '战斗',
    content: '【战斗场景】\n\n空气中弥漫着紧张的气息，双方对峙而立。\n\n"来吧！"主角沉声说道，体内真气翻涌，一股强大的气势从身上爆发而出。\n\n对方冷笑一声，同样释放出强大的气场，两股气势在空中碰撞，激起层层涟漪。\n\n',
    description: '适用于战斗章节的开场描写',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-daily-1',
    name: '日常场景',
    category: '日常',
    content: '【日常场景】\n\n阳光透过窗户洒进房间，尘埃在光束中轻轻飘动。\n\n主角伸了个懒腰，从修炼中缓缓睁开双眼。新的一天开始了。\n\n',
    description: '适用于日常生活场景的描写',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-upgrade-1',
    name: '突破升级',
    category: '升级',
    content: '【突破场景】\n\n丹田中的真气如潮水般涌动，一道道气旋在体内形成，冲击着那道屏障。\n\n"破！"\n\n随着一声低喝，那道困扰已久的瓶颈轰然碎裂，一股强大的能量从体内爆发而出，直冲云霄！\n\n',
    description: '适用于修炼突破的描写',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-flashback-1',
    name: '回忆开场',
    category: '回忆',
    content: '【回忆场景】\n\n思绪飘回到多年前的那个夜晚...\n\n那时的天空布满繁星，月光如水般洒落大地。年少的身影站在山巅，望着远方的灯火，心中满怀憧憬。\n\n"总有一天，我一定会..."那时的誓言仿佛还在耳边回响。\n\n',
    description: '适用于回忆、闪回场景',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-dialog-1',
    name: '对话场景',
    category: '对话',
    content: '【对话场景】\n\n两人相对而坐，气氛有些凝重。\n\n"此事...你怎么看？"开口的人眉头紧锁。\n\n对方沉默片刻，缓缓说道："事已至此，唯有一战。"\n\n',
    description: '适用于重要对话场景',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tpl-climax-1',
    name: '高潮转折',
    category: '高潮',
    content: '【高潮场景】\n\n就在千钧一发之际——\n\n一道璀璨的光芒从天而降，强大的威压笼罩四方，所有人都愣住了。\n\n"这是...！"有人惊呼出声。\n\n局势，在这一刻发生了翻天覆地的变化。\n\n',
    description: '适用于剧情高潮和转折点',
    isBuiltIn: true,
    createdAt: new Date().toISOString()
  }
];

// 常见敏感词列表（简化版，实际应用中应该更完善）
const SENSITIVE_WORDS = [
  '政治', '领导', '政府', '国家机密', '颠覆', '分裂',
  '色情', '淫秽', '裸体', '性交',
  '赌博', '博彩', '六合彩',
  '毒品', '吸毒', '贩毒',
  '暴力', '恐怖', '杀人', '自杀',
  '邪教', '法轮', '传销',
  // 可以根据平台要求扩展
];

// 在树中查找节点
const findNodeInTree = (root: MindMapNode, nodeId: string): MindMapNode | null => {
  if (root.id === nodeId) return root;
  for (const child of root.children) {
    const found = findNodeInTree(child, nodeId);
    if (found) return found;
  }
  return null;
};

// 在树中查找父节点
const findParentNode = (root: MindMapNode, nodeId: string): MindMapNode | null => {
  for (const child of root.children) {
    if (child.id === nodeId) return root;
    const found = findParentNode(child, nodeId);
    if (found) return found;
  }
  return null;
};

// 深拷贝节点树
const cloneTree = (node: MindMapNode): MindMapNode => ({
  ...node,
  children: node.children.map(cloneTree)
});

// 更新树中的节点
const updateNodeInTree = (root: MindMapNode, nodeId: string, updates: Partial<MindMapNode>): MindMapNode => {
  if (root.id === nodeId) {
    return { ...root, ...updates, children: updates.children || root.children };
  }
  return {
    ...root,
    children: root.children.map(child => updateNodeInTree(child, nodeId, updates))
  };
};

// 删除树中的节点
const deleteNodeFromTree = (root: MindMapNode, nodeId: string): MindMapNode => {
  return {
    ...root,
    children: root.children
      .filter(child => child.id !== nodeId)
      .map(child => deleteNodeFromTree(child, nodeId))
  };
};

// 添加子节点到指定节点
const addChildToNode = (root: MindMapNode, parentId: string, newNode: MindMapNode): MindMapNode => {
  if (root.id === parentId) {
    return { ...root, children: [...root.children, newNode] };
  }
  return {
    ...root,
    children: root.children.map(child => addChildToNode(child, parentId, newNode))
  };
};

// 添加同级节点
const addSiblingNode = (root: MindMapNode, siblingId: string, newNode: MindMapNode): MindMapNode => {
  const newChildren = [];
  for (const child of root.children) {
    newChildren.push(child);
    if (child.id === siblingId) {
      newChildren.push(newNode);
    }
  }
  if (newChildren.length !== root.children.length) {
    return { ...root, children: newChildren.map(c => c.id === newNode.id ? c : addSiblingNode(c, siblingId, newNode)) };
  }
  return {
    ...root,
    children: root.children.map(child => addSiblingNode(child, siblingId, newNode))
  };
};

// AI 会话存储 Key
const AI_SESSIONS_KEY = 'tiandao_longnovel_ai_sessions';

// 获取保存的会话
const getSavedAISessions = (): AIChatSession[] => {
  try {
    const saved = localStorage.getItem(AI_SESSIONS_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load AI sessions:', e);
  }
  return [];
};

// 保存会话
const saveAISessions = (sessions: AIChatSession[]) => {
  try {
    localStorage.setItem(AI_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save AI sessions:', e);
  }
};

// 格式化日期
const formatSessionDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${date.getFullYear()}/${month}/${day} ${hours}:${minutes}:${seconds}`;
};

const LongNovelEditor: React.FC<LongNovelEditorProps> = ({ novel, onUpdateNovel, onBack, onRecordActivity, prompts = [] }) => {
  const chapters = useMemo(() => novel?.chapters || [], [novel?.chapters]);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(chapters[0]?.id || null);
  const [mode, setMode] = useState<EditorMode>('writing');
  const [assistantTab, setAssistantTab] = useState<AssistantTab>('ai');
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatInput, setChatInput] = useState('');

  // AI 会话管理状态
  const [aiSessions, setAiSessions] = useState<AIChatSession[]>(getSavedAISessions);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showSessionList, setShowSessionList] = useState(false);
  const [showPromptPicker, setShowPromptPicker] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [selectedModel, setSelectedModel] = useState(() => {
    const settings = getApiSettings();
    return settings.selectedModel || 'gemini-2.0-flash';
  });
  const [availableModels, setAvailableModels] = useState(getAvailableModels);

  // 获取当前会话
  const currentSession = useMemo(() => {
    return aiSessions.find(s => s.id === currentSessionId) || null;
  }, [aiSessions, currentSessionId]);

  // 当前会话的消息
  const messages = useMemo(() => {
    if (currentSession) {
      return currentSession.messages;
    }
    return [{ id: 'init', role: 'ai' as const, content: '我是你的笔灵助手，随时听候差遣。', createdAt: new Date().toLocaleString() }];
  }, [currentSession]);

  // 章节编辑状态
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState('');

  // 用于跟踪是否已从 novel 初始化数据
  const dataInitializedRef = useRef(false);
  const novelIdRef = useRef<string | null>(null);

  // 思维导图状态
  const [mindMaps, setMindMaps] = useState<MindMap[]>([]);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [editingMapName, setEditingMapName] = useState<string | null>(null);
  const [newMapName, setNewMapName] = useState('');
  const [mindMapScale, setMindMapScale] = useState(1); // 思维导图缩放比例

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [fontFamily, setFontFamily] = useState('微软雅黑');
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.8);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState<number | 'unlimited'>('unlimited');
  const [themeOption, setThemeOption] = useState<'light' | 'gray' | 'dark' | 'system'>('light');
  const [voice, setVoice] = useState('Microsoft Yunxi Online (Natural) - Chinese (Mainland)');
  const [voiceRate, setVoiceRate] = useState(1.0);

  // 创作管理状态
  const [creativeTab, setCreativeTab] = useState<CreativeManagementTab>('characters');
  const [characters, setCharacters] = useState<Character[]>([]);
  const [worldviews, setWorldviews] = useState<Worldview[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  // 新版创作管理模态框类型状态：null 表示关闭，其他表示打开对应类型的模态框
  const [creativeModalType, setCreativeModalType] = useState<CreativeManagementTab | null>(null);

  // 卷管理状态
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [collapsedVolumes, setCollapsedVolumes] = useState<Set<string>>(new Set());
  const [showQuickSort, setShowQuickSort] = useState(false);
  const [editingVolumeId, setEditingVolumeId] = useState<string | null>(null);
  const [editingVolumeTitle, setEditingVolumeTitle] = useState('');
  const [showVolumePickerFor, setShowVolumePickerFor] = useState<string | null>(null); // 显示卷选择器的章节ID

  // AI 生成状态
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratingType, setAiGeneratingType] = useState<'mindmap' | 'character' | 'worldview' | 'event' | 'reference' | null>(null);

  // 大纲管理器状态
  const [showOutlineManager, setShowOutlineManager] = useState(false);
  const [outlineNodes, setOutlineNodes] = useState<OutlineNode[]>([]);

  // 伏笔追踪状态
  const [showForeshadowingTracker, setShowForeshadowingTracker] = useState(false);
  const [foreshadowings, setForeshadowings] = useState<Foreshadowing[]>([]);

  // 写作目标状态
  const [showWritingGoal, setShowWritingGoal] = useState(false);
  const [writingGoals, setWritingGoals] = useState<WritingGoal[]>([]);
  const [writingRecords, setWritingRecords] = useState<WritingRecord[]>([]);

  // 查找替换状态
  const [showSearchReplace, setShowSearchReplace] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [searchResults, setSearchResults] = useState<{chapterId: string; index: number; text: string}[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');

  // AI 扩写/润色状态
  const [showAiTextTools, setShowAiTextTools] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [aiTextToolType, setAiTextToolType] = useState<'expand' | 'polish' | 'rewrite' | null>(null);
  const [isAiTextProcessing, setIsAiTextProcessing] = useState(false);
  const [aiTextResult, setAiTextResult] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 场景/地点管理状态
  const [locations, setLocations] = useState<Location[]>([]);
  const [showLocationManager, setShowLocationManager] = useState(false);

  // 道具/技能管理状态
  const [items, setItems] = useState<Item[]>([]);
  const [showItemManager, setShowItemManager] = useState(false);

  // 章节模板状态
  const [chapterTemplates, setChapterTemplates] = useState<ChapterTemplate[]>([]);
  const [showTemplateManager, setShowTemplateManager] = useState(false);

  // 写作统计面板状态
  const [showStatsPanel, setShowStatsPanel] = useState(false);

  // AI 角色对话生成状态
  const [showDialogGenerator, setShowDialogGenerator] = useState(false);
  const [dialogCharacters, setDialogCharacters] = useState<string[]>([]);
  const [dialogContext, setDialogContext] = useState('');
  const [generatedDialog, setGeneratedDialog] = useState('');
  const [isGeneratingDialog, setIsGeneratingDialog] = useState(false);

  // 专有名词检查状态
  const [showNameChecker, setShowNameChecker] = useState(false);
  const [nameCheckResults, setNameCheckResults] = useState<{name: string; variants: string[]; chapters: string[]}[]>([]);

  // 敏感词检测状态
  const [showSensitiveChecker, setShowSensitiveChecker] = useState(false);
  const [sensitiveResults, setSensitiveResults] = useState<{word: string; chapter: string; position: number}[]>([]);

  // 文件导入状态
  const [showImportModal, setShowImportModal] = useState(false);
  const [importPreview, setImportPreview] = useState<{title: string; content: string}[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 番茄钟状态
  const [showPomodoro, setShowPomodoro] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60); // 默认25分钟（秒）
  const [pomodoroRunning, setPomodoroRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const pomodoroIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 作品备份恢复状态
  const [showBackupModal, setShowBackupModal] = useState(false);
  const backupInputRef = useRef<HTMLInputElement>(null);

  // 富文本编辑状态
  const [showRichTextToolbar, setShowRichTextToolbar] = useState(true);

  // 从 novel 初始化数据（处理首次加载和切换小说的情况）
  useEffect(() => {
    if (!novel) return;

    // 检查是否切换了小说或首次加载
    if (novelIdRef.current !== novel.id) {
      novelIdRef.current = novel.id;
      dataInitializedRef.current = false;
    }

    // 只在首次加载时初始化数据
    if (dataInitializedRef.current) return;
    dataInitializedRef.current = true;

    // 加载创作管理数据
    setCharacters(novel.characters || []);
    setWorldviews(novel.worldviews || []);
    setTimelineEvents(novel.timelineEvents || []);
    setReferences(novel.references || []);

    // 加载卷数据
    setVolumes(novel.volumes || []);

    // 加载大纲数据
    setOutlineNodes(novel.outlineNodes || []);

    // 加载伏笔数据
    setForeshadowings(novel.foreshadowings || []);

    // 加载写作目标和记录
    setWritingGoals(novel.writingGoals || []);
    setWritingRecords(novel.writingRecords || []);

    // 加载场景/地点数据
    setLocations(novel.locations || []);

    // 加载道具/技能数据
    setItems(novel.items || []);

    // 加载章节模板数据
    setChapterTemplates(novel.chapterTemplates || getDefaultTemplates());

    // 加载思维导图数据
    if (novel.mindMaps && novel.mindMaps.length > 0) {
      setMindMaps(novel.mindMaps);
      setSelectedMapId(novel.mindMaps[0].id);
      setSelectedNodeId(novel.mindMaps[0].root.id);
    } else {
      // 创建默认思维导图
      const defaultMap = createMindMapData('思维导图 1', novel.title || '中心主题');
      defaultMap.root.children = [
        createNode('分支主题 1', 'bg-indigo-500'),
        createNode('分支主题 2', 'bg-violet-500')
      ];
      setMindMaps([defaultMap]);
      setSelectedMapId(defaultMap.id);
      setSelectedNodeId(defaultMap.root.id);
    }
  }, [novel]);

  // 语音朗读状态
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // 系统主题偏好
  const [systemDark, setSystemDark] = useState(() =>
    window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
  );

  // 计算实际主题
  const effectiveTheme = useMemo(() => {
    if (themeOption === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return themeOption;
  }, [themeOption, systemDark]);

  // 主题样式类
  const themeClasses = useMemo(() => {
    switch (effectiveTheme) {
      case 'dark':
        return {
          main: 'bg-slate-900 text-slate-100 border-slate-700',
          sidebar: 'bg-slate-800 border-slate-700',
          card: 'bg-slate-800 border-slate-700',
          input: 'bg-slate-800 border-slate-600 text-slate-100',
          text: 'text-slate-100',
          textMuted: 'text-slate-400',
          border: 'border-slate-700'
        };
      case 'gray':
        return {
          main: 'bg-[#e8e6e3] text-slate-800 border-slate-300',
          sidebar: 'bg-[#d9d7d4] border-slate-300',
          card: 'bg-[#f0eeeb] border-slate-300',
          input: 'bg-[#f5f3f0] border-slate-300 text-slate-800',
          text: 'text-slate-800',
          textMuted: 'text-slate-500',
          border: 'border-slate-300'
        };
      default: // light
        return {
          main: 'bg-white text-slate-800 border-slate-100',
          sidebar: 'bg-slate-50/90 border-slate-100',
          card: 'bg-white border-slate-200',
          input: 'bg-white border-slate-200 text-slate-800',
          text: 'text-slate-800',
          textMuted: 'text-slate-400',
          border: 'border-slate-100'
        };
    }
  }, [effectiveTheme]);

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return;

    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // 初始化选中第一个思维导图
  useEffect(() => {
    if (mindMaps.length > 0 && !selectedMapId) {
      setSelectedMapId(mindMaps[0].id);
      setSelectedNodeId(mindMaps[0].root.id);
    }
  }, [mindMaps, selectedMapId]);

  // 当前选中的思维导图
  const currentMap = useMemo(() =>
    mindMaps.find(m => m.id === selectedMapId) || null
  , [mindMaps, selectedMapId]);

  // 当前选中的节点
  const selectedNode = useMemo(() => {
    if (!currentMap || !selectedNodeId) return null;
    return findNodeInTree(currentMap.root, selectedNodeId);
  }, [currentMap, selectedNodeId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 保存 AI 会话到 localStorage
  useEffect(() => {
    saveAISessions(aiSessions);
  }, [aiSessions]);

  // 使用 ref 存储最新的 selectedModel，避免闭包问题
  const selectedModelRef = useRef(selectedModel);
  useEffect(() => {
    selectedModelRef.current = selectedModel;
  }, [selectedModel]);

  // 监听 API 设置变化（只注册一次，使用 ref 获取最新状态）
  useEffect(() => {
    const handleStorageChange = () => {
      const newSettings = getApiSettings();
      const newModels = getAvailableModels(newSettings);
      setAvailableModels(newModels);
      // 使用 ref 获取最新的 selectedModel 值
      if (!newModels.find(m => m.id === selectedModelRef.current)) {
        setSelectedModel(newSettings.selectedModel || newModels[0]?.id || '');
      }
    };
    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []); // 空依赖数组 - 只注册一次

  useEffect(() => {
    if (!chapters.length) return;
    if (!selectedChapterId || !chapters.find((c) => c.id === selectedChapterId)) {
      setSelectedChapterId(chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  // 初始化语音合成
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices.filter(v => v.lang.includes('zh') || v.lang.includes('en')));
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // 保存创作管理数据到 novel
  useEffect(() => {
    if (!novel) return;
    // 防止初始化时触发保存
    const hasChanges =
      JSON.stringify(characters) !== JSON.stringify(novel.characters || []) ||
      JSON.stringify(worldviews) !== JSON.stringify(novel.worldviews || []) ||
      JSON.stringify(timelineEvents) !== JSON.stringify(novel.timelineEvents || []) ||
      JSON.stringify(references) !== JSON.stringify(novel.references || []) ||
      JSON.stringify(volumes) !== JSON.stringify(novel.volumes || []) ||
      JSON.stringify(outlineNodes) !== JSON.stringify(novel.outlineNodes || []) ||
      JSON.stringify(foreshadowings) !== JSON.stringify(novel.foreshadowings || []) ||
      JSON.stringify(writingGoals) !== JSON.stringify(novel.writingGoals || []) ||
      JSON.stringify(writingRecords) !== JSON.stringify(novel.writingRecords || []) ||
      JSON.stringify(locations) !== JSON.stringify(novel.locations || []) ||
      JSON.stringify(items) !== JSON.stringify(novel.items || []) ||
      JSON.stringify(chapterTemplates.filter(t => !t.isBuiltIn)) !== JSON.stringify((novel.chapterTemplates || []).filter(t => !t.isBuiltIn));

    if (hasChanges) {
      onUpdateNovel({
        characters,
        worldviews,
        timelineEvents,
        references,
        volumes,
        outlineNodes,
        foreshadowings,
        writingGoals,
        writingRecords,
        locations,
        items,
        chapterTemplates: chapterTemplates.filter(t => !t.isBuiltIn), // 只保存自定义模板
      });
    }
  }, [characters, worldviews, timelineEvents, references, volumes, outlineNodes, foreshadowings, writingGoals, writingRecords, locations, items, chapterTemplates, novel, onUpdateNovel]);

  // 保存思维导图数据到 novel
  useEffect(() => {
    if (!novel) return;
    // 防止初始化时触发保存
    const hasChanges = JSON.stringify(mindMaps) !== JSON.stringify(novel.mindMaps || []);

    if (hasChanges) {
      onUpdateNovel({ mindMaps });
    }
  }, [mindMaps, novel, onUpdateNovel]);

  const currentChapter = useMemo(() => chapters.find((c) => c.id === selectedChapterId) || null, [chapters, selectedChapterId]);

  // ============ 语音朗读功能 ============
  const startSpeaking = useCallback(() => {
    if (!currentChapter?.content) {
      alert('当前章节没有内容');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentChapter.content);
    utterance.rate = voiceRate;
    utterance.lang = 'zh-CN';

    // 查找匹配的语音
    const selectedVoice = availableVoices.find(v => v.name.includes('Yunxi') || v.name.includes('Xiaoxiao'))
      || availableVoices.find(v => v.lang.includes('zh'))
      || availableVoices[0];
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  }, [currentChapter?.content, voiceRate, availableVoices]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const toggleSpeaking = useCallback(() => {
    if (isSpeaking) {
      stopSpeaking();
    } else {
      startSpeaking();
    }
  }, [isSpeaking, startSpeaking, stopSpeaking]);

  // ============ 导出功能 ============
  const exportToTXT = useCallback(() => {
    if (!currentChapter) {
      alert('请先选择章节');
      return;
    }
    const content = `${currentChapter.title}\n\n${currentChapter.content}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentChapter]);

  const exportToMarkdown = useCallback(() => {
    if (!currentChapter) {
      alert('请先选择章节');
      return;
    }
    const content = `# ${currentChapter.title}\n\n${currentChapter.content}`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentChapter]);

  const exportToWord = useCallback(() => {
    if (!currentChapter) {
      alert('请先选择章节');
      return;
    }
    // 使用HTML格式创建Word兼容文档
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
      <head>
        <meta charset="utf-8">
        <title>${currentChapter.title}</title>
        <style>
          body { font-family: '微软雅黑', sans-serif; font-size: 14pt; line-height: 1.8; }
          h1 { font-size: 18pt; text-align: center; }
          p { text-indent: 2em; margin: 0.5em 0; }
        </style>
      </head>
      <body>
        <h1>${currentChapter.title}</h1>
        ${currentChapter.content.split('\n').map(p => `<p>${p}</p>`).join('')}
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentChapter.title}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentChapter]);

  const exportToPDF = useCallback(() => {
    if (!currentChapter) {
      alert('请先选择章节');
      return;
    }
    // 创建打印友好的HTML并调用打印
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('请允许弹出窗口以导出PDF');
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${currentChapter.title}</title>
        <style>
          body { font-family: '微软雅黑', sans-serif; font-size: 12pt; line-height: 1.8; padding: 40px; }
          h1 { font-size: 18pt; text-align: center; margin-bottom: 30px; }
          p { text-indent: 2em; margin: 0.8em 0; }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <h1>${currentChapter.title}</h1>
        ${currentChapter.content.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }, [currentChapter]);

  // 导出全部章节
  const exportAllChapters = useCallback((format: 'txt' | 'md') => {
    if (!chapters.length) {
      alert('没有可导出的章节');
      return;
    }
    let content = '';
    if (format === 'txt') {
      content = chapters.map(ch => `${ch.title}\n\n${ch.content}`).join('\n\n---\n\n');
    } else {
      content = chapters.map(ch => `# ${ch.title}\n\n${ch.content}`).join('\n\n---\n\n');
    }
    const blob = new Blob([content], { type: format === 'txt' ? 'text/plain;charset=utf-8' : 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${novel?.title || '小说'}_全部章节.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [chapters, novel?.title]);

  // ============ 创作管理功能 ============
  // 添加人物
  const addCharacter = useCallback((data: Omit<Character, 'id' | 'createdAt'>) => {
    const newCharacter: Character = {
      ...data,
      id: createCharacterId(),
      createdAt: new Date().toISOString()
    };
    setCharacters(prev => [...prev, newCharacter]);
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 更新人物
  const updateCharacter = useCallback((id: string, data: Partial<Character>) => {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 删除人物
  const deleteCharacter = useCallback((id: string) => {
    if (!window.confirm('确定要删除这个人物吗？')) return;
    setCharacters(prev => prev.filter(c => c.id !== id));
  }, []);

  // 添加世界观
  const addWorldview = useCallback((data: Omit<Worldview, 'id' | 'createdAt'>) => {
    const newWorldview: Worldview = {
      ...data,
      id: createWorldviewId(),
      createdAt: new Date().toISOString()
    };
    setWorldviews(prev => [...prev, newWorldview]);
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 更新世界观
  const updateWorldview = useCallback((id: string, data: Partial<Worldview>) => {
    setWorldviews(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 删除世界观
  const deleteWorldview = useCallback((id: string) => {
    if (!window.confirm('确定要删除这个世界观设定吗？')) return;
    setWorldviews(prev => prev.filter(w => w.id !== id));
  }, []);

  // 添加事件
  const addTimelineEvent = useCallback((data: Omit<TimelineEvent, 'id' | 'createdAt'>) => {
    const newEvent: TimelineEvent = {
      ...data,
      id: createTimelineId(),
      createdAt: new Date().toISOString()
    };
    setTimelineEvents(prev => [...prev, newEvent]);
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 更新事件
  const updateTimelineEvent = useCallback((id: string, data: Partial<TimelineEvent>) => {
    setTimelineEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 删除事件
  const deleteTimelineEvent = useCallback((id: string) => {
    if (!window.confirm('确定要删除这个事件吗？')) return;
    setTimelineEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // 添加资料
  const addReference = useCallback((data: Omit<Reference, 'id' | 'createdAt'>) => {
    const newRef: Reference = {
      ...data,
      id: createReferenceId(),
      createdAt: new Date().toISOString()
    };
    setReferences(prev => [...prev, newRef]);
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 更新资料
  const updateReference = useCallback((id: string, data: Partial<Reference>) => {
    setReferences(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    setShowCreativeModal(false);
    setEditingItem(null);
  }, []);

  // 删除资料
  const deleteReference = useCallback((id: string) => {
    if (!window.confirm('确定要删除这个资料吗？')) return;
    setReferences(prev => prev.filter(r => r.id !== id));
  }, []);

  // ============ 卷管理操作 ============
  const addVolume = useCallback(() => {
    const newVolume: Volume = {
      id: createVolumeId(),
      title: `第 ${volumes.length + 1} 卷`,
      order: volumes.length,
      createdAt: new Date().toISOString()
    };
    setVolumes(prev => [...prev, newVolume]);
  }, [volumes.length]);

  const deleteVolume = useCallback((volumeId: string) => {
    const volume = volumes.find(v => v.id === volumeId);
    if (!window.confirm(`确定要删除"${volume?.title}"吗？卷内章节将变为未分类。`)) return;

    setVolumes(prev => prev.filter(v => v.id !== volumeId));
    // 将该卷下的章节的 volumeId 清空
    const next = chapters.map(ch =>
      ch.volumeId === volumeId ? { ...ch, volumeId: undefined } : ch
    );
    onUpdateNovel({ chapters: next });
  }, [volumes, chapters, onUpdateNovel]);

  const renameVolume = useCallback((volumeId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    setVolumes(prev => prev.map(v =>
      v.id === volumeId ? { ...v, title: newTitle.trim() } : v
    ));
    setEditingVolumeId(null);
  }, []);

  const toggleVolumeCollapse = useCallback((volumeId: string) => {
    setCollapsedVolumes(prev => {
      const next = new Set(prev);
      if (next.has(volumeId)) {
        next.delete(volumeId);
      } else {
        next.add(volumeId);
      }
      return next;
    });
  }, []);

  const moveChapterToVolume = useCallback((chapterId: string, volumeId: string | undefined) => {
    const next = chapters.map(ch =>
      ch.id === chapterId ? { ...ch, volumeId } : ch
    );
    onUpdateNovel({ chapters: next });
  }, [chapters, onUpdateNovel]);

  // ============ 章节操作 ============
  const addChapter = (volumeId?: string) => {
    const volumeChapters = volumeId
      ? chapters.filter(ch => ch.volumeId === volumeId)
      : chapters.filter(ch => !ch.volumeId);
    const chapter: Chapter = {
      id: createChapterId(),
      title: `第 ${chapters.length + 1} 章`,
      content: '',
      wordCount: 0,
      volumeId
    };
    const next = [...chapters, chapter];
    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });
    setSelectedChapterId(chapter.id);
  };

  const updateChapter = (chapterId: string, updates: Partial<Chapter>) => {
    const next = chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, ...updates, wordCount: (updates.content ?? ch.content).length } : ch
    );
    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });
  };

  // 删除章节
  const deleteChapter = useCallback((chapterId: string) => {
    if (chapters.length <= 1) {
      alert('至少保留一个章节');
      return;
    }
    const chapter = chapters.find(c => c.id === chapterId);
    if (!window.confirm(`确定要删除"${chapter?.title}"吗？此操作不可撤销。`)) return;

    const next = chapters.filter(ch => ch.id !== chapterId);
    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });

    // 如果删除的是当前选中的章节，选中第一个章节
    if (selectedChapterId === chapterId) {
      setSelectedChapterId(next[0]?.id || null);
    }
  }, [chapters, selectedChapterId, onUpdateNovel]);

  // 重命名章节
  const renameChapter = useCallback((chapterId: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    const next = chapters.map((ch) =>
      ch.id === chapterId ? { ...ch, title: newTitle.trim() } : ch
    );
    onUpdateNovel({ chapters: next });
    setEditingChapterId(null);
  }, [chapters, onUpdateNovel]);

  // 复制章节
  const duplicateChapter = useCallback((chapterId: string) => {
    const sourceChapter = chapters.find(c => c.id === chapterId);
    if (!sourceChapter) return;

    const newChapter: Chapter = {
      id: createChapterId(),
      title: `${sourceChapter.title} (副本)`,
      content: sourceChapter.content,
      wordCount: sourceChapter.wordCount
    };

    // 在源章节后面插入新章节
    const sourceIndex = chapters.findIndex(c => c.id === chapterId);
    const next = [...chapters];
    next.splice(sourceIndex + 1, 0, newChapter);

    onUpdateNovel({ chapters: next, wordCount: next.reduce((sum, ch) => sum + ch.wordCount, 0) });
    setSelectedChapterId(newChapter.id);
  }, [chapters, onUpdateNovel]);

  // 上移章节
  const moveChapterUp = useCallback((chapterId: string) => {
    const index = chapters.findIndex(c => c.id === chapterId);
    if (index <= 0) return;

    const next = [...chapters];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    onUpdateNovel({ chapters: next });
  }, [chapters, onUpdateNovel]);

  // 下移章节
  const moveChapterDown = useCallback((chapterId: string) => {
    const index = chapters.findIndex(c => c.id === chapterId);
    if (index < 0 || index >= chapters.length - 1) return;

    const next = [...chapters];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    onUpdateNovel({ chapters: next });
  }, [chapters, onUpdateNovel]);

  // ============ AI 上下文构建 ============

  // 将思维导图转换为文本
  const mindMapToText = useCallback((node: MindMapNode, level: number = 0): string => {
    const indent = '  '.repeat(level);
    let text = `${indent}- ${node.title}\n`;
    for (const child of node.children) {
      text += mindMapToText(child, level + 1);
    }
    return text;
  }, []);

  // 构建创作管理上下文
  const buildCreativeContext = useCallback((): string => {
    let context = '';

    // 人物设定
    if (characters.length > 0) {
      context += '\n【人物设定】\n';
      characters.forEach(char => {
        context += `• ${char.name}（${char.role}）：${char.description}`;
        if (char.traits.length > 0) {
          context += `\n  性格特征：${char.traits.join('、')}`;
        }
        context += '\n';
      });
    }

    // 世界观设定
    if (worldviews.length > 0) {
      context += '\n【世界观设定】\n';
      worldviews.forEach(world => {
        context += `• ${world.title}（${world.category}）：${world.content}\n`;
      });
    }

    // 事件线
    if (timelineEvents.length > 0) {
      context += '\n【重要事件】\n';
      timelineEvents.forEach(event => {
        const relatedChars = event.characters
          .map(charId => characters.find(c => c.id === charId)?.name)
          .filter(Boolean)
          .join('、');
        context += `• ${event.title}（${event.time}）：${event.description}`;
        if (relatedChars) {
          context += `\n  相关人物：${relatedChars}`;
        }
        context += '\n';
      });
    }

    // 资料库
    if (references.length > 0) {
      context += '\n【参考资料】\n';
      references.forEach(ref => {
        context += `• ${ref.title}（${ref.category}）：${ref.content}\n`;
      });
    }

    return context;
  }, [characters, worldviews, timelineEvents, references]);

  // 构建思维导图上下文
  const buildMindMapContext = useCallback((): string => {
    if (mindMaps.length === 0) return '';

    let context = '\n【故事结构/思维导图】\n';
    mindMaps.forEach(map => {
      context += `\n${map.name}：\n`;
      context += mindMapToText(map.root);
    });
    return context;
  }, [mindMaps, mindMapToText]);

  // 获取前几章的内容摘要
  const getPreviousChaptersContext = useCallback((currentChapterIndex: number, maxChapters: number = 5): string => {
    if (chapters.length === 0 || currentChapterIndex <= 0) return '';

    const startIndex = Math.max(0, currentChapterIndex - maxChapters);
    const previousChapters = chapters.slice(startIndex, currentChapterIndex);

    if (previousChapters.length === 0) return '';

    let context = '\n【前文内容摘要】\n';
    previousChapters.forEach((chapter, idx) => {
      // 每章取前800字作为摘要
      const summary = chapter.content.slice(0, 800);
      const truncated = chapter.content.length > 800 ? '...' : '';
      context += `\n第${startIndex + idx + 1}章 ${chapter.title}（${chapter.wordCount}字）：\n${summary}${truncated}\n`;
    });

    return context;
  }, [chapters]);

  // 构建完整的 AI 系统提示
  const buildSystemPrompt = useCallback((): string => {
    const currentIndex = chapters.findIndex(c => c.id === selectedChapterId);

    let systemPrompt = `你是一个专业的网络小说创作助手，正在协助创作《${novel?.title || '未命名作品'}》。

请基于以下设定和前文内容进行创作，保持风格统一、人物性格一致、剧情连贯。`;

    // 添加创作管理上下文
    const creativeContext = buildCreativeContext();
    if (creativeContext) {
      systemPrompt += '\n' + creativeContext;
    }

    // 添加思维导图上下文
    const mindMapContext = buildMindMapContext();
    if (mindMapContext) {
      systemPrompt += '\n' + mindMapContext;
    }

    // 添加前文章节上下文
    const chaptersContext = getPreviousChaptersContext(currentIndex, 5);
    if (chaptersContext) {
      systemPrompt += '\n' + chaptersContext;
    }

    // 添加当前章节信息
    if (currentChapter) {
      systemPrompt += `\n\n【当前章节】第${currentIndex + 1}章 ${currentChapter.title}（已写${currentChapter.wordCount}字）`;
      if (currentChapter.content) {
        // 当前章节取后1500字作为续写参考
        const recentContent = currentChapter.content.slice(-1500);
        const prefix = currentChapter.content.length > 1500 ? '...' : '';
        systemPrompt += `\n当前章节最近内容：\n${prefix}${recentContent}`;
      }
    }

    return systemPrompt;
  }, [novel?.title, chapters, selectedChapterId, currentChapter, buildCreativeContext, buildMindMapContext, getPreviousChaptersContext]);

  const continueWriting = async () => {
    if (!currentChapter || isStreaming) return;
    setIsStreaming(true);

    // 构建包含完整上下文的提示
    const systemPrompt = buildSystemPrompt();
    const prompt = `请续写当前章节内容，保持风格一致，约300-500字。直接输出续写内容，不要输出标题或其他说明。`;

    let addition = '';
    const options: GenerateOptions = {
      temperature,
      maxTokens: maxTokens,
      systemInstruction: systemPrompt
    };
    await generateCreativeContentStream(prompt, (chunk) => {
      addition += chunk;
      updateChapter(currentChapter.id, { content: currentChapter.content + addition });
    }, 'gemini-2.0-flash', options);
    setIsStreaming(false);
    onRecordActivity?.({
      type: 'ai_call',
      description: 'AI 续写章节',
      deltaPoints: -3,
      createdAt: new Date().toISOString(),
      metadata: { words: addition.length }
    });
  };

  // 将 AI 内容插入到正文
  const insertToContent = useCallback((content: string) => {
    if (!currentChapter) {
      alert('请先选择一个章节');
      return;
    }
    // 在当前内容末尾添加（如果有内容则换行）
    const newContent = currentChapter.content
      ? `${currentChapter.content}\n\n${content}`
      : content;
    updateChapter(currentChapter.id, { content: newContent });
  }, [currentChapter, updateChapter]);

  // ============ AI 会话管理 ============

  // 创建新会话
  const createNewSession = useCallback(() => {
    const newSession: AIChatSession = {
      id: createMessageId(),
      title: '新建会话',
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAiSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setShowSessionList(false);
  }, []);

  // 选择会话
  const selectSession = useCallback((sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessionList(false);
  }, []);

  // 删除会话
  const deleteSession = useCallback((sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('确定删除此会话？')) return;
    setAiSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
    }
  }, [currentSessionId]);

  // 选择提示词
  const selectPrompt = useCallback((prompt: PromptEntry) => {
    setChatInput(prompt.content);
    setShowPromptPicker(false);
  }, []);

  // 复制消息
  const copyMessage = useCallback((content: string) => {
    navigator.clipboard.writeText(content);
  }, []);

  // 引用消息
  const quoteMessage = useCallback((content: string) => {
    setChatInput(prev => prev + '\n> ' + content.split('\n').join('\n> ') + '\n');
  }, []);

  // 引用当前章节选中的文本
  const quoteSelectedText = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString().trim();
      setChatInput(prev => {
        const prefix = prev ? prev + '\n' : '';
        return prefix + '> ' + selectedText.split('\n').join('\n> ') + '\n';
      });
    } else if (currentChapter) {
      // 如果没有选中文本，引用整个章节的前200字
      const preview = currentChapter.content.slice(0, 200);
      setChatInput(prev => {
        const prefix = prev ? prev + '\n' : '';
        return prefix + '> ' + preview.split('\n').join('\n> ') + (currentChapter.content.length > 200 ? '...' : '') + '\n';
      });
    }
  }, [currentChapter]);

  const sendMessage = async () => {
    if (!chatInput.trim() || isStreaming) return;
    const text = chatInput.trim();
    setChatInput('');
    setIsStreaming(true);

    let sessionId = currentSessionId;
    let updatedSessions = [...aiSessions];

    // 如果没有当前会话，创建新会话
    if (!sessionId) {
      const newSession: AIChatSession = {
        id: createMessageId(),
        title: text.slice(0, 20) + (text.length > 20 ? '...' : ''),
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      updatedSessions = [newSession, ...aiSessions];
      sessionId = newSession.id;
      setCurrentSessionId(sessionId);
    }

    // 添加用户消息
    const userMessage: AIChatMessage = {
      id: createMessageId(),
      role: 'user',
      content: text,
      createdAt: new Date().toLocaleString(),
    };

    // 创建 AI 回复占位
    const aiMessage: AIChatMessage = {
      id: createMessageId(),
      role: 'ai',
      content: '',
      createdAt: new Date().toLocaleString(),
    };

    // 更新会话
    setAiSessions(prev => {
      const sessions = sessionId === currentSessionId ? prev : updatedSessions;
      return sessions.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            title: s.messages.length === 0 ? text.slice(0, 20) + (text.length > 20 ? '...' : '') : s.title,
            messages: [...s.messages, userMessage, aiMessage],
            updatedAt: new Date().toISOString(),
          };
        }
        return s;
      });
    });

    // 构建包含完整上下文的系统提示
    const systemPrompt = buildSystemPrompt();

    const options: GenerateOptions = {
      temperature,
      maxTokens: maxTokens,
      systemInstruction: systemPrompt
    };

    try {
      let content = '';
      await generateCreativeContentStream(text, (chunk) => {
        content += chunk;
        setAiSessions(prev => prev.map(s => {
          if (s.id === sessionId) {
            return {
              ...s,
              messages: s.messages.map(m =>
                m.id === aiMessage.id ? { ...m, content } : m
              ),
            };
          }
          return s;
        }));
      }, selectedModel, options);

      onRecordActivity?.({
        type: 'ai_call',
        description: 'AI 助手对话',
        deltaPoints: -1,
        metadata: { words: content.length },
      });
    } catch (error) {
      console.error('Generation error:', error);
    } finally {
      setIsStreaming(false);
    }
  };

  // ============ 思维导图操作 ============

  // 新建思维导图
  const addMindMap = useCallback(() => {
    const newMap = createMindMapData(`思维导图 ${mindMaps.length + 1}`, novel?.title || '中心主题');
    setMindMaps(prev => [...prev, newMap]);
    setSelectedMapId(newMap.id);
    setSelectedNodeId(newMap.root.id);
  }, [mindMaps.length, novel?.title]);

  // 删除思维导图
  const deleteMindMap = useCallback((mapId: string) => {
    if (mindMaps.length <= 1) {
      alert('至少保留一个思维导图');
      return;
    }
    if (!window.confirm('确定要删除这个思维导图吗？')) return;
    setMindMaps(prev => prev.filter(m => m.id !== mapId));
    if (selectedMapId === mapId) {
      const remaining = mindMaps.filter(m => m.id !== mapId);
      setSelectedMapId(remaining[0]?.id || null);
      setSelectedNodeId(remaining[0]?.root.id || null);
    }
  }, [mindMaps, selectedMapId]);

  // 重命名思维导图
  const renameMindMap = useCallback((mapId: string, newName: string) => {
    setMindMaps(prev => prev.map(m =>
      m.id === mapId ? { ...m, name: newName, updatedAt: new Date().toISOString() } : m
    ));
    setEditingMapName(null);
  }, []);

  // 更新思维导图（通用）
  const updateMindMap = useCallback((mapId: string, updater: (map: MindMap) => MindMap) => {
    setMindMaps(prev => prev.map(m =>
      m.id === mapId ? { ...updater(m), updatedAt: new Date().toISOString() } : m
    ));
  }, []);

  // 添加子节点
  const addChildNode = useCallback(() => {
    if (!currentMap || !selectedNodeId) return;
    const newNode = createNode('新节点');
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: addChildToNode(map.root, selectedNodeId, newNode)
    }));
    setSelectedNodeId(newNode.id);
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 添加同级节点
  const addSibling = useCallback(() => {
    if (!currentMap || !selectedNodeId) return;
    // 不能给根节点添加同级节点
    if (selectedNodeId === currentMap.root.id) {
      alert('根节点不能添加同级节点');
      return;
    }
    const newNode = createNode('新节点');
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: addSiblingNode(map.root, selectedNodeId, newNode)
    }));
    setSelectedNodeId(newNode.id);
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 删除节点
  const deleteNode = useCallback(() => {
    if (!currentMap || !selectedNodeId) return;
    // 不能删除根节点
    if (selectedNodeId === currentMap.root.id) {
      alert('不能删除根节点');
      return;
    }
    if (!window.confirm('确定要删除这个节点及其所有子节点吗？')) return;

    // 找到父节点，删除后选中父节点
    const parent = findParentNode(currentMap.root, selectedNodeId);
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: deleteNodeFromTree(map.root, selectedNodeId)
    }));
    setSelectedNodeId(parent?.id || currentMap.root.id);
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 更新节点标题
  const updateNodeTitle = useCallback((title: string) => {
    if (!currentMap || !selectedNodeId) return;
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: updateNodeInTree(map.root, selectedNodeId, { title })
    }));
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 更新节点颜色
  const updateNodeColor = useCallback((color: string) => {
    if (!currentMap || !selectedNodeId) return;
    updateMindMap(currentMap.id, (map) => ({
      ...map,
      root: updateNodeInTree(map.root, selectedNodeId, { color })
    }));
  }, [currentMap, selectedNodeId, updateMindMap]);

  // 导出思维导图为JSON
  const exportMindMap = useCallback(() => {
    if (!currentMap) return;
    const data = JSON.stringify(currentMap, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentMap.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [currentMap]);

  // 导入思维导图
  const importMindMap = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string) as MindMap;
          // 生成新ID避免冲突
          data.id = createId();
          data.name = `${data.name} (导入)`;
          setMindMaps(prev => [...prev, data]);
          setSelectedMapId(data.id);
          setSelectedNodeId(data.root.id);
          alert('导入成功！');
        } catch {
          alert('导入失败，请确保文件格式正确');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  // 手动保存（数据已自动保存到 novel，此处仅显示确认）
  const saveMindMaps = useCallback(() => {
    alert('数据已自动保存！');
  }, []);

  // ============ AI 一键生成功能 ============

  // AI 生成思维导图子节点
  const aiGenerateMindMapNodes = useCallback(async () => {
    if (!currentMap || !selectedNode || isAiGenerating) return;

    setIsAiGenerating(true);
    setAiGeneratingType('mindmap');

    const context = buildCreativeContext();
    const currentNodePath = selectedNode.title;

    const prompt = `你是一个专业的网络小说创作助手，正在帮助作者构建思维导图。

小说标题：${novel?.title || '未命名'}
${context}

当前思维导图主题：${currentMap.name}
当前选中节点：${currentNodePath}
${selectedNode.children.length > 0 ? `已有子节点：${selectedNode.children.map(c => c.title).join('、')}` : '该节点暂无子节点'}

请为当前节点生成 3-5 个合适的子节点标题，这些子节点应该：
1. 与当前节点主题相关且有逻辑联系
2. 适合网络小说创作场景
3. 简洁明了，每个标题 2-8 个字

请直接输出子节点标题，每行一个，不要加序号或其他符号。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.8 });

      // 解析生成的节点
      const newTitles = result.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && line.length <= 20);

      if (newTitles.length > 0) {
        // 为每个标题创建新节点并添加到选中节点下
        let updatedRoot = currentMap.root;
        newTitles.forEach(title => {
          const newNode = createNode(title);
          updatedRoot = addChildToNode(updatedRoot, selectedNodeId!, newNode);
        });

        updateMindMap(currentMap.id, (map) => ({
          ...map,
          root: updatedRoot
        }));

        onRecordActivity?.({
          type: 'ai_call',
          description: 'AI 生成思维导图节点',
          deltaPoints: -2,
          createdAt: new Date().toISOString(),
          metadata: { count: newTitles.length }
        });
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingType(null);
    }
  }, [currentMap, selectedNode, selectedNodeId, isAiGenerating, novel?.title, buildCreativeContext, updateMindMap, onRecordActivity]);

  // AI 生成人物
  const aiGenerateCharacter = useCallback(async () => {
    if (isAiGenerating) return;

    setIsAiGenerating(true);
    setAiGeneratingType('character');

    const context = buildCreativeContext();
    const existingNames = characters.map(c => c.name).join('、');

    const prompt = `你是一个专业的网络小说创作助手，正在帮助作者创建人物设定。

小说标题：${novel?.title || '未命名'}
小说简介：${novel?.description || '暂无'}
${context}
${existingNames ? `已有人物：${existingNames}` : ''}

请创建一个新的人物设定，输出格式如下（严格按此格式）：
【名称】人物名字
【角色】主角/配角/反派/龙套/其他
【描述】人物的外貌、背景、经历等描述（50-150字）
【性格】性格特征1、性格特征2、性格特征3（用顿号分隔，3-5个特征）

请确保人物与小说风格相符，且不与已有人物重复。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.9 });

      // 解析生成的人物
      const nameMatch = result.match(/【名称】(.+?)(?:\n|【)/);
      const roleMatch = result.match(/【角色】(.+?)(?:\n|【)/);
      const descMatch = result.match(/【描述】(.+?)(?:\n|【)/s);
      const traitsMatch = result.match(/【性格】(.+?)(?:\n|$)/s);

      if (nameMatch && descMatch) {
        const name = nameMatch[1].trim();
        const role = roleMatch?.[1].trim() || '配角';
        const description = descMatch[1].trim();
        const traitsStr = traitsMatch?.[1].trim() || '';
        const traits = traitsStr.split(/[、,，]/).map(t => t.trim()).filter(t => t.length > 0);

        const newCharacter: Character = {
          id: createCharacterId(),
          name,
          role,
          description,
          traits,
          createdAt: new Date().toISOString()
        };

        setCharacters(prev => [...prev, newCharacter]);

        onRecordActivity?.({
          type: 'ai_call',
          description: `AI 生成人物：${name}`,
          deltaPoints: -2,
          createdAt: new Date().toISOString(),
        });
      } else {
        alert('AI 生成的格式不正确，请重试');
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingType(null);
    }
  }, [isAiGenerating, novel?.title, novel?.description, characters, buildCreativeContext, onRecordActivity]);

  // AI 生成世界观
  const aiGenerateWorldview = useCallback(async () => {
    if (isAiGenerating) return;

    setIsAiGenerating(true);
    setAiGeneratingType('worldview');

    const context = buildCreativeContext();
    const existingTitles = worldviews.map(w => w.title).join('、');

    const prompt = `你是一个专业的网络小说创作助手，正在帮助作者构建世界观设定。

小说标题：${novel?.title || '未命名'}
小说简介：${novel?.description || '暂无'}
${context}
${existingTitles ? `已有世界观设定：${existingTitles}` : ''}

请创建一个新的世界观设定，输出格式如下（严格按此格式）：
【标题】设定名称
【分类】力量体系/社会结构/地理环境/历史背景/种族设定/其他
【内容】详细的世界观描述（100-300字）

请确保设定具有创意且与小说整体风格相符。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.9 });

      const titleMatch = result.match(/【标题】(.+?)(?:\n|【)/);
      const categoryMatch = result.match(/【分类】(.+?)(?:\n|【)/);
      const contentMatch = result.match(/【内容】(.+?)(?:\n|$)/s);

      if (titleMatch && contentMatch) {
        const title = titleMatch[1].trim();
        const category = categoryMatch?.[1].trim() || '其他';
        const content = contentMatch[1].trim();

        const newWorldview: Worldview = {
          id: createWorldviewId(),
          title,
          category,
          content,
          createdAt: new Date().toISOString()
        };

        setWorldviews(prev => [...prev, newWorldview]);

        onRecordActivity?.({
          type: 'ai_call',
          description: `AI 生成世界观：${title}`,
          deltaPoints: -2,
          createdAt: new Date().toISOString(),
        });
      } else {
        alert('AI 生成的格式不正确，请重试');
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingType(null);
    }
  }, [isAiGenerating, novel?.title, novel?.description, worldviews, buildCreativeContext, onRecordActivity]);

  // AI 生成事件
  const aiGenerateEvent = useCallback(async () => {
    if (isAiGenerating) return;

    setIsAiGenerating(true);
    setAiGeneratingType('event');

    const context = buildCreativeContext();
    const existingEvents = timelineEvents.map(e => e.title).join('、');

    const prompt = `你是一个专业的网络小说创作助手，正在帮助作者构建故事事件线。

小说标题：${novel?.title || '未命名'}
小说简介：${novel?.description || '暂无'}
${context}
${existingEvents ? `已有事件：${existingEvents}` : ''}

请创建一个新的故事事件，输出格式如下（严格按此格式）：
【标题】事件名称
【时间】时间点描述（如：故事开始前10年、第一卷第三章等）
【描述】事件的详细经过和影响（50-200字）
【人物】相关人物名称（用顿号分隔，如果有已存在的人物请优先使用）

请确保事件具有戏剧性，能推动剧情发展。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.9 });

      const titleMatch = result.match(/【标题】(.+?)(?:\n|【)/);
      const timeMatch = result.match(/【时间】(.+?)(?:\n|【)/);
      const descMatch = result.match(/【描述】(.+?)(?:\n|【)/s);
      const charsMatch = result.match(/【人物】(.+?)(?:\n|$)/s);

      if (titleMatch && descMatch) {
        const title = titleMatch[1].trim();
        const time = timeMatch?.[1].trim() || '';
        const description = descMatch[1].trim();
        const charNames = charsMatch?.[1].trim().split(/[、,，]/).map(n => n.trim()).filter(n => n.length > 0) || [];

        // 匹配已有人物ID
        const characterIds = charNames
          .map(name => characters.find(c => c.name === name)?.id)
          .filter((id): id is string => id !== undefined);

        const newEvent: TimelineEvent = {
          id: createTimelineId(),
          title,
          time,
          description,
          characters: characterIds,
          createdAt: new Date().toISOString()
        };

        setTimelineEvents(prev => [...prev, newEvent]);

        onRecordActivity?.({
          type: 'ai_call',
          description: `AI 生成事件：${title}`,
          deltaPoints: -2,
          createdAt: new Date().toISOString(),
        });
      } else {
        alert('AI 生成的格式不正确，请重试');
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingType(null);
    }
  }, [isAiGenerating, novel?.title, novel?.description, timelineEvents, characters, buildCreativeContext, onRecordActivity]);

  // AI 生成资料
  const aiGenerateReference = useCallback(async () => {
    if (isAiGenerating) return;

    setIsAiGenerating(true);
    setAiGeneratingType('reference');

    const context = buildCreativeContext();
    const existingRefs = references.map(r => r.title).join('、');

    const prompt = `你是一个专业的网络小说创作助手，正在帮助作者整理创作资料。

小说标题：${novel?.title || '未命名'}
小说简介：${novel?.description || '暂无'}
${context}
${existingRefs ? `已有资料：${existingRefs}` : ''}

请创建一条对创作有帮助的资料，输出格式如下（严格按此格式）：
【标题】资料名称
【分类】背景资料/参考素材/灵感记录/写作笔记/其他
【内容】详细的资料内容（100-300字）

可以是：历史背景知识、文化习俗、技术原理、情节灵感、写作技巧等。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
      }, 'gemini-2.0-flash', { temperature: 0.9 });

      const titleMatch = result.match(/【标题】(.+?)(?:\n|【)/);
      const categoryMatch = result.match(/【分类】(.+?)(?:\n|【)/);
      const contentMatch = result.match(/【内容】(.+?)(?:\n|$)/s);

      if (titleMatch && contentMatch) {
        const title = titleMatch[1].trim();
        const category = categoryMatch?.[1].trim() || '其他';
        const content = contentMatch[1].trim();

        const newRef: Reference = {
          id: createReferenceId(),
          title,
          category,
          content,
          createdAt: new Date().toISOString()
        };

        setReferences(prev => [...prev, newRef]);

        onRecordActivity?.({
          type: 'ai_call',
          description: `AI 生成资料：${title}`,
          deltaPoints: -2,
          createdAt: new Date().toISOString(),
        });
      } else {
        alert('AI 生成的格式不正确，请重试');
      }
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsAiGenerating(false);
      setAiGeneratingType(null);
    }
  }, [isAiGenerating, novel?.title, novel?.description, references, buildCreativeContext, onRecordActivity]);

  // ============ 查找替换功能 ============

  // 执行查找
  const performSearch = useCallback(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }

    const results: {chapterId: string; index: number; text: string}[] = [];
    const searchLower = searchText.toLowerCase();

    if (searchScope === 'current' && currentChapter) {
      // 只在当前章节查找
      let index = 0;
      let pos = currentChapter.content.toLowerCase().indexOf(searchLower);
      while (pos !== -1) {
        const start = Math.max(0, pos - 20);
        const end = Math.min(currentChapter.content.length, pos + searchText.length + 20);
        results.push({
          chapterId: currentChapter.id,
          index: pos,
          text: '...' + currentChapter.content.slice(start, end) + '...'
        });
        pos = currentChapter.content.toLowerCase().indexOf(searchLower, pos + 1);
      }
    } else {
      // 在所有章节查找
      chapters.forEach(chapter => {
        let pos = chapter.content.toLowerCase().indexOf(searchLower);
        while (pos !== -1) {
          const start = Math.max(0, pos - 20);
          const end = Math.min(chapter.content.length, pos + searchText.length + 20);
          results.push({
            chapterId: chapter.id,
            index: pos,
            text: '...' + chapter.content.slice(start, end) + '...'
          });
          pos = chapter.content.toLowerCase().indexOf(searchLower, pos + 1);
        }
      });
    }

    setSearchResults(results);
    setCurrentSearchIndex(0);
  }, [searchText, searchScope, currentChapter, chapters]);

  // 替换当前
  const replaceCurrentResult = useCallback(() => {
    if (searchResults.length === 0 || currentSearchIndex >= searchResults.length) return;

    const result = searchResults[currentSearchIndex];
    const chapter = chapters.find(c => c.id === result.chapterId);
    if (!chapter) return;

    const before = chapter.content.slice(0, result.index);
    const after = chapter.content.slice(result.index + searchText.length);
    const newContent = before + replaceText + after;

    updateChapter(result.chapterId, { content: newContent });

    // 重新搜索
    setTimeout(() => performSearch(), 100);
  }, [searchResults, currentSearchIndex, chapters, searchText, replaceText, updateChapter, performSearch]);

  // 全部替换
  const replaceAllResults = useCallback(() => {
    if (!searchText.trim()) return;

    const affectedChapters = new Map<string, string>();

    if (searchScope === 'current' && currentChapter) {
      const newContent = currentChapter.content.split(searchText).join(replaceText);
      affectedChapters.set(currentChapter.id, newContent);
    } else {
      chapters.forEach(chapter => {
        if (chapter.content.includes(searchText)) {
          const newContent = chapter.content.split(searchText).join(replaceText);
          affectedChapters.set(chapter.id, newContent);
        }
      });
    }

    affectedChapters.forEach((content, chapterId) => {
      updateChapter(chapterId, { content });
    });

    setSearchResults([]);
    alert(`已替换 ${affectedChapters.size} 个章节中的内容`);
  }, [searchText, replaceText, searchScope, currentChapter, chapters, updateChapter]);

  // 跳转到搜索结果
  const goToSearchResult = useCallback((index: number) => {
    if (index < 0 || index >= searchResults.length) return;
    setCurrentSearchIndex(index);
    const result = searchResults[index];
    if (result.chapterId !== selectedChapterId) {
      setSelectedChapterId(result.chapterId);
    }
  }, [searchResults, selectedChapterId]);

  // ============ AI 扩写/润色功能 ============

  // 获取选中的文本
  const handleTextSelection = useCallback(() => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    if (start !== end) {
      const selected = textarea.value.slice(start, end);
      setSelectedText(selected);
      setShowAiTextTools(true);
    }
  }, []);

  // AI 文本处理
  const processTextWithAI = useCallback(async (type: 'expand' | 'polish' | 'rewrite') => {
    if (!selectedText.trim() || isAiTextProcessing) return;

    setAiTextToolType(type);
    setIsAiTextProcessing(true);
    setAiTextResult('');

    const prompts = {
      expand: `请将以下文本扩写，增加更多细节描写，保持原有风格和语气，扩写后约为原文的2-3倍长度：\n\n${selectedText}`,
      polish: `请润色以下文本，使其更加流畅、优美，修正语法错误，但保持原意不变：\n\n${selectedText}`,
      rewrite: `请改写以下文本，用不同的表达方式重新叙述，但保持核心内容不变：\n\n${selectedText}`
    };

    const systemPrompt = buildSystemPrompt();

    try {
      let result = '';
      await generateCreativeContentStream(prompts[type], (chunk) => {
        result += chunk;
        setAiTextResult(result);
      }, 'gemini-2.0-flash', { temperature: 0.7, systemInstruction: systemPrompt });

      onRecordActivity?.({
        type: 'ai_call',
        description: `AI ${type === 'expand' ? '扩写' : type === 'polish' ? '润色' : '改写'}`,
        deltaPoints: -2,
        createdAt: new Date().toISOString(),
        metadata: { inputLength: selectedText.length, outputLength: result.length }
      });
    } catch (error) {
      console.error('AI 处理失败:', error);
      alert('AI 处理失败，请稍后重试');
    } finally {
      setIsAiTextProcessing(false);
    }
  }, [selectedText, isAiTextProcessing, buildSystemPrompt, onRecordActivity]);

  // 应用 AI 结果到正文
  const applyAiTextResult = useCallback(() => {
    if (!aiTextResult || !currentChapter || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const before = currentChapter.content.slice(0, start);
      const after = currentChapter.content.slice(end);
      updateChapter(currentChapter.id, { content: before + aiTextResult + after });
    }

    setShowAiTextTools(false);
    setSelectedText('');
    setAiTextResult('');
    setAiTextToolType(null);
  }, [aiTextResult, currentChapter, updateChapter]);

  // ============ 写作目标功能 ============

  // 获取今日写作字数
  const getTodayWrittenWords = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const record = writingRecords.find(r => r.date === today);
    return record?.wordsWritten || 0;
  }, [writingRecords]);

  // 获取连续写作天数
  const getStreakDays = useCallback(() => {
    if (writingRecords.length === 0) return 0;

    const sortedRecords = [...writingRecords].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const record of sortedRecords) {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === streak && record.wordsWritten > 0) {
        streak++;
      } else if (diffDays > streak) {
        break;
      }
    }

    return streak;
  }, [writingRecords]);

  // 获取当前活跃的写作目标
  const activeGoal = useMemo(() => {
    return writingGoals.find(g => g.isActive && g.type === 'daily') || null;
  }, [writingGoals]);

  // 记录今日写作
  const recordTodayWriting = useCallback((words: number) => {
    const today = new Date().toISOString().split('T')[0];
    const existingIndex = writingRecords.findIndex(r => r.date === today);

    if (existingIndex >= 0) {
      const updated = [...writingRecords];
      updated[existingIndex] = {
        ...updated[existingIndex],
        wordsWritten: words,
      };
      setWritingRecords(updated);
    } else {
      setWritingRecords([...writingRecords, {
        id: createRecordId(),
        date: today,
        wordsWritten: words,
        chaptersCompleted: 0
      }]);
    }
  }, [writingRecords]);

  // 添加写作目标
  const addWritingGoal = useCallback((targetWords: number, type: WritingGoal['type'] = 'daily') => {
    // 先停用同类型的其他目标
    const updatedGoals = writingGoals.map(g =>
      g.type === type ? { ...g, isActive: false } : g
    );

    const newGoal: WritingGoal = {
      id: createGoalId(),
      type,
      targetWords,
      currentWords: 0,
      startDate: new Date().toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setWritingGoals([...updatedGoals, newGoal]);
  }, [writingGoals]);

  // 更新写作目标进度
  useEffect(() => {
    if (!activeGoal) return;
    const todayWords = getTodayWrittenWords();
    if (todayWords !== activeGoal.currentWords) {
      setWritingGoals(prev => prev.map(g =>
        g.id === activeGoal.id ? { ...g, currentWords: todayWords } : g
      ));
    }
  }, [activeGoal, getTodayWrittenWords]);

  // 监控字数变化，记录写作数据
  const lastWordCountRef = useRef(novel?.wordCount || 0);
  useEffect(() => {
    if (!novel) return;
    const currentWordCount = novel.wordCount;
    const diff = currentWordCount - lastWordCountRef.current;

    if (diff > 0) {
      const todayWords = getTodayWrittenWords();
      recordTodayWriting(todayWords + diff);
    }

    lastWordCountRef.current = currentWordCount;
  }, [novel?.wordCount, getTodayWrittenWords, recordTodayWriting]);

  // ============ 场景/地点管理功能 ============

  const addLocation = useCallback((data: Omit<Location, 'id' | 'createdAt'>) => {
    const newLocation: Location = {
      ...data,
      id: createLocationId(),
      createdAt: new Date().toISOString()
    };
    setLocations(prev => [...prev, newLocation]);
  }, []);

  const updateLocation = useCallback((id: string, data: Partial<Location>) => {
    setLocations(prev => prev.map(l => l.id === id ? { ...l, ...data } : l));
  }, []);

  const deleteLocation = useCallback((id: string) => {
    setLocations(prev => prev.filter(l => l.id !== id));
  }, []);

  // ============ 道具/技能管理功能 ============

  const addItem = useCallback((data: Omit<Item, 'id' | 'createdAt'>) => {
    const newItem: Item = {
      ...data,
      id: createItemId(),
      createdAt: new Date().toISOString()
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const updateItem = useCallback((id: string, data: Partial<Item>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
  }, []);

  const deleteItem = useCallback((id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  }, []);

  // ============ 章节模板管理功能 ============

  const addTemplate = useCallback((data: Omit<ChapterTemplate, 'id' | 'createdAt' | 'isBuiltIn'>) => {
    const newTemplate: ChapterTemplate = {
      ...data,
      id: createTemplateId(),
      isBuiltIn: false,
      createdAt: new Date().toISOString()
    };
    setChapterTemplates(prev => [...prev, newTemplate]);
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setChapterTemplates(prev => prev.filter(t => t.id !== id || t.isBuiltIn));
  }, []);

  const applyTemplate = useCallback((templateId: string) => {
    const template = chapterTemplates.find(t => t.id === templateId);
    if (template && currentChapter) {
      const newContent = currentChapter.content + '\n\n' + template.content;
      updateChapter(currentChapter.id, { content: newContent });
    }
  }, [chapterTemplates, currentChapter, updateChapter]);

  // ============ 专有名词检查功能 ============

  const checkProperNouns = useCallback(() => {
    const allNames: Map<string, {variants: Set<string>; chapters: Set<string>}> = new Map();

    // 从人物中收集名字
    characters.forEach(char => {
      const baseName = char.name.toLowerCase();
      if (!allNames.has(baseName)) {
        allNames.set(baseName, { variants: new Set([char.name]), chapters: new Set() });
      }
    });

    // 从地点中收集名字
    locations.forEach(loc => {
      const baseName = loc.name.toLowerCase();
      if (!allNames.has(baseName)) {
        allNames.set(baseName, { variants: new Set([loc.name]), chapters: new Set() });
      }
    });

    // 从道具中收集名字
    items.forEach(item => {
      const baseName = item.name.toLowerCase();
      if (!allNames.has(baseName)) {
        allNames.set(baseName, { variants: new Set([item.name]), chapters: new Set() });
      }
    });

    // 在章节中检查名词的不同写法
    chapters.forEach(chapter => {
      const content = chapter.content;

      allNames.forEach((data, baseName) => {
        // 简单的模糊匹配 - 检查是否有相似但不完全相同的写法
        const regex = new RegExp(baseName.split('').join('.?'), 'gi');
        const matches = content.match(regex);
        if (matches) {
          matches.forEach(match => {
            data.variants.add(match);
            data.chapters.add(chapter.title);
          });
        }
      });
    });

    // 只返回有多个变体的名词
    const results = Array.from(allNames.entries())
      .filter(([_, data]) => data.variants.size > 1)
      .map(([name, data]) => ({
        name,
        variants: Array.from(data.variants),
        chapters: Array.from(data.chapters)
      }));

    setNameCheckResults(results);
    setShowNameChecker(true);
  }, [characters, locations, items, chapters]);

  // ============ 敏感词检测功能 ============

  const checkSensitiveWords = useCallback(() => {
    const results: {word: string; chapter: string; position: number}[] = [];

    chapters.forEach(chapter => {
      const content = chapter.content.toLowerCase();
      SENSITIVE_WORDS.forEach(word => {
        let pos = content.indexOf(word.toLowerCase());
        while (pos !== -1) {
          results.push({
            word,
            chapter: chapter.title,
            position: pos
          });
          pos = content.indexOf(word.toLowerCase(), pos + 1);
        }
      });
    });

    setSensitiveResults(results);
    setShowSensitiveChecker(true);
  }, [chapters]);

  // ============ AI 角色对话生成功能 ============

  const generateCharacterDialog = useCallback(async () => {
    if (dialogCharacters.length < 2 || isGeneratingDialog) return;

    setIsGeneratingDialog(true);
    setGeneratedDialog('');

    const selectedChars = characters.filter(c => dialogCharacters.includes(c.id));
    const charDescriptions = selectedChars.map(c =>
      `${c.name}（${c.role}）：性格${c.personality || '未设定'}，特点${c.traits?.join('、') || '未设定'}`
    ).join('\n');

    const prompt = `你是一个专业的网络小说对话撰写专家。

参与对话的角色：
${charDescriptions}

场景/情境：${dialogContext || '日常对话'}

请为这些角色生成一段符合各自性格特点的对话，要求：
1. 对话要体现每个角色的性格特点
2. 对话自然流畅，有情绪起伏
3. 每个角色至少有2-3句话
4. 对话格式为："角色名"说道/道/...，"对话内容"

请直接输出对话内容，不要有其他说明。`;

    try {
      let result = '';
      await generateCreativeContentStream(prompt, (chunk) => {
        result += chunk;
        setGeneratedDialog(result);
      }, 'gemini-2.0-flash', { temperature: 0.8 });
    } catch (error) {
      console.error('AI 生成失败:', error);
      alert('AI 生成失败，请稍后重试');
    } finally {
      setIsGeneratingDialog(false);
    }
  }, [dialogCharacters, dialogContext, characters, isGeneratingDialog]);

  const applyGeneratedDialog = useCallback(() => {
    if (!generatedDialog || !currentChapter) return;
    const newContent = currentChapter.content + '\n\n' + generatedDialog;
    updateChapter(currentChapter.id, { content: newContent });
    setShowDialogGenerator(false);
    setGeneratedDialog('');
  }, [generatedDialog, currentChapter, updateChapter]);

  // ============ 文件导入功能 ============

  // 处理 TXT 文件导入
  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const previews: {title: string; content: string}[] = [];
    let loaded = 0;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        let title = file.name.replace(/\.(txt|doc|docx|md)$/i, '');

        // 尝试从内容提取标题（第一行如果较短可能是标题）
        const lines = content.split('\n').filter(line => line.trim());
        if (lines.length > 0 && lines[0].length < 50) {
          title = lines[0].trim();
        }

        previews.push({ title, content });
        loaded++;

        if (loaded === files.length) {
          setImportPreview(previews);
          setShowImportModal(true);
        }
      };
      reader.readAsText(file, 'UTF-8');
    });

    // 重置 input 以允许重复选择同一文件
    event.target.value = '';
  }, []);

  // 确认导入章节
  const confirmImport = useCallback(() => {
    if (importPreview.length === 0) return;

    const now = new Date().toISOString();
    const newChapters: Chapter[] = importPreview.map((preview, index) => ({
      id: createChapterId(),
      title: preview.title || `导入章节 ${chapters.length + index + 1}`,
      content: preview.content,
      wordCount: preview.content.replace(/\s/g, '').length,
    }));

    onUpdateNovel({
      chapters: [...chapters, ...newChapters],
      wordCount: (novel?.wordCount || 0) + newChapters.reduce((sum, ch) => sum + ch.wordCount, 0),
      updatedAt: now,
    });

    setImportPreview([]);
    setShowImportModal(false);

    // 选中第一个导入的章节
    if (newChapters.length > 0) {
      setSelectedChapterId(newChapters[0].id);
    }
  }, [importPreview, chapters, novel, onUpdateNovel]);

  // ============ 番茄钟功能 ============

  // 开始番茄钟计时
  const startPomodoro = useCallback(() => {
    setPomodoroRunning(true);
    pomodoroIntervalRef.current = setInterval(() => {
      setPomodoroTime(prev => {
        if (prev <= 1) {
          // 计时结束
          if (pomodoroIntervalRef.current) {
            clearInterval(pomodoroIntervalRef.current);
          }
          setPomodoroRunning(false);

          // 播放提示音
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleAACtdr/umwPBg==');
            audio.play().catch(() => {});
          } catch {}

          // 切换模式
          setPomodoroMode(currentMode => {
            if (currentMode === 'work') {
              setPomodoroCount(c => c + 1);
              return 'break';
            } else {
              return 'work';
            }
          });

          // 设置下一轮时间
          return pomodoroMode === 'work' ? 5 * 60 : 25 * 60; // 工作25分钟，休息5分钟
        }
        return prev - 1;
      });
    }, 1000);
  }, [pomodoroMode]);

  // 暂停番茄钟
  const pausePomodoro = useCallback(() => {
    if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
    }
    setPomodoroRunning(false);
  }, []);

  // 重置番茄钟
  const resetPomodoro = useCallback(() => {
    if (pomodoroIntervalRef.current) {
      clearInterval(pomodoroIntervalRef.current);
    }
    setPomodoroRunning(false);
    setPomodoroMode('work');
    setPomodoroTime(25 * 60);
  }, []);

  // 格式化时间显示
  const formatPomodoroTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // 清理计时器
  useEffect(() => {
    return () => {
      if (pomodoroIntervalRef.current) {
        clearInterval(pomodoroIntervalRef.current);
      }
    };
  }, []);

  // ============ 作品备份恢复功能 ============

  // 导出完整备份
  const exportBackup = useCallback(() => {
    if (!novel) return;

    const backupData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      novel: {
        ...novel,
        chapters,
        volumes,
        characters,
        worldviews,
        timelineEvents,
        references,
        mindMaps,
        outlineNodes,
        foreshadowings,
        writingGoals,
        writingRecords,
        locations,
        items,
        chapterTemplates,
      }
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${novel.title || '小说'}_备份_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [novel, chapters, volumes, characters, worldviews, timelineEvents, references, mindMaps, outlineNodes, foreshadowings, writingGoals, writingRecords, locations, items, chapterTemplates]);

  // 处理备份文件导入
  const handleBackupImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.novel) {
          alert('无效的备份文件格式');
          return;
        }

        // 确认恢复
        if (!window.confirm(`确定要从备份恢复吗？\n\n备份时间：${data.exportDate || '未知'}\n小说标题：${data.novel.title || '未命名'}\n\n注意：这将覆盖当前所有数据！`)) {
          return;
        }

        const novelData = data.novel;

        // 更新所有状态
        if (novelData.chapters) {
          onUpdateNovel({ chapters: novelData.chapters });
        }
        if (novelData.volumes) setVolumes(novelData.volumes);
        if (novelData.characters) setCharacters(novelData.characters);
        if (novelData.worldviews) setWorldviews(novelData.worldviews);
        if (novelData.timelineEvents) setTimelineEvents(novelData.timelineEvents);
        if (novelData.references) setReferences(novelData.references);
        if (novelData.mindMaps) setMindMaps(novelData.mindMaps);
        if (novelData.outlineNodes) setOutlineNodes(novelData.outlineNodes);
        if (novelData.foreshadowings) setForeshadowings(novelData.foreshadowings);
        if (novelData.writingGoals) setWritingGoals(novelData.writingGoals);
        if (novelData.writingRecords) setWritingRecords(novelData.writingRecords);
        if (novelData.locations) setLocations(novelData.locations);
        if (novelData.items) setItems(novelData.items);
        if (novelData.chapterTemplates) setChapterTemplates(novelData.chapterTemplates);

        // 更新小说基本信息
        onUpdateNovel({
          title: novelData.title,
          description: novelData.description,
          type: novelData.type,
          targetWordCount: novelData.targetWordCount,
          wordCount: novelData.wordCount,
          status: novelData.status,
          tags: novelData.tags,
          outline: novelData.outline,
          updatedAt: new Date().toISOString(),
        });

        setShowBackupModal(false);
        alert('备份恢复成功！');
      } catch (error) {
        console.error('备份恢复失败:', error);
        alert('备份文件解析失败，请确保文件格式正确');
      }
    };
    reader.readAsText(file, 'UTF-8');
    event.target.value = '';
  }, [onUpdateNovel]);

  // ============ 富文本编辑功能 ============

  // 在光标位置插入格式化文本
  const insertFormattedText = useCallback((type: 'bold' | 'italic' | 'dialog' | 'thought' | 'emphasis') => {
    if (!textareaRef.current || !currentChapter) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const content = currentChapter.content;
    const selectedText = content.substring(start, end);

    let newText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        newText = `**${selectedText || '粗体文字'}**`;
        cursorOffset = selectedText ? newText.length : 2;
        break;
      case 'italic':
        newText = `*${selectedText || '斜体文字'}*`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'dialog':
        newText = `"${selectedText || '对话内容'}"`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'thought':
        newText = `『${selectedText || '心理活动'}』`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
      case 'emphasis':
        newText = `【${selectedText || '强调内容'}】`;
        cursorOffset = selectedText ? newText.length : 1;
        break;
    }

    const newContent = content.substring(0, start) + newText + content.substring(end);
    updateChapter(currentChapter.id, { content: newContent });

    // 设置光标位置
    setTimeout(() => {
      textarea.focus();
      if (selectedText) {
        textarea.setSelectionRange(start + newText.length, start + newText.length);
      } else {
        textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + (type === 'bold' ? 4 : type === 'italic' ? 4 : type === 'dialog' ? 4 : type === 'thought' ? 4 : 4));
      }
    }, 0);
  }, [currentChapter, updateChapter]);

  // 格式化对话（自动为引号内容添加格式）
  const formatDialogs = useCallback(() => {
    if (!currentChapter) return;

    let content = currentChapter.content;

    // 将英文引号替换为中文引号
    content = content.replace(/"([^"]+)"/g, '"$1"');

    // 将单引号对话替换为双引号
    content = content.replace(/'([^']+)'/g, '"$1"');

    updateChapter(currentChapter.id, { content });
  }, [currentChapter, updateChapter]);

  // ============ 写作统计计算 ============

  const getWeeklyStats = useCallback(() => {
    const stats: {date: string; words: number}[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = writingRecords.find(r => r.date === dateStr);
      stats.push({
        date: dateStr.slice(5), // MM-DD
        words: record?.wordsWritten || 0
      });
    }
    return stats;
  }, [writingRecords]);

  const getMonthlyStats = useCallback(() => {
    const stats: {date: string; words: number}[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const record = writingRecords.find(r => r.date === dateStr);
      stats.push({
        date: dateStr.slice(5),
        words: record?.wordsWritten || 0
      });
    }
    return stats;
  }, [writingRecords]);

  const getTotalStats = useMemo(() => {
    const totalWords = writingRecords.reduce((sum, r) => sum + r.wordsWritten, 0);
    const totalDays = writingRecords.filter(r => r.wordsWritten > 0).length;
    const avgDaily = totalDays > 0 ? Math.round(totalWords / totalDays) : 0;
    const maxDaily = Math.max(...writingRecords.map(r => r.wordsWritten), 0);
    return { totalWords, totalDays, avgDaily, maxDaily };
  }, [writingRecords]);

  // ============ 渲染思维导图节点 ============
  const renderMindMapNode = (node: MindMapNode, level: number = 0, isLast: boolean = true, parentPath: boolean[] = []): React.ReactNode => {
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id} className="flex items-start">
        {/* 连接线 */}
        {level > 0 && (
          <div className="flex items-center h-full mr-2">
            <div className="flex flex-col items-center">
              {parentPath.map((showLine, idx) => (
                <div
                  key={idx}
                  className={`w-px h-4 ${showLine ? 'bg-slate-300' : 'bg-transparent'}`}
                />
              ))}
            </div>
            <div className="w-6 border-t-2 border-dashed border-slate-300" />
          </div>
        )}

        <div className="flex flex-col">
          {/* 节点本身 */}
          <button
            onClick={() => setSelectedNodeId(node.id)}
            className={`px-4 py-2 rounded-xl text-white text-sm font-medium shadow-md transition-all duration-200 whitespace-nowrap ${node.color} ${
              isSelected
                ? 'ring-4 ring-indigo-300 ring-offset-2 scale-105'
                : 'hover:scale-102 hover:shadow-lg'
            }`}
          >
            {node.title}
          </button>

          {/* 子节点 */}
          {hasChildren && (
            <div className="mt-3 ml-4 space-y-2">
              {node.children.map((child, idx) =>
                renderMindMapNode(
                  child,
                  level + 1,
                  idx === node.children.length - 1,
                  [...parentPath, !isLast]
                )
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============ 渲染视图 ============
  const renderWritingView = () => {
    if (!currentChapter) {
      return (
        <div className={`flex-1 flex flex-col items-center justify-center ${themeClasses.textMuted} gap-4`}>
          <div className="text-center space-y-2">
            <p>请选择或创建一个章节开始编辑</p>
            <button className={`px-4 py-2 border ${themeClasses.border} rounded-lg`} onClick={() => addChapter()}>+ 创建第一章</button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col">
        <div className={`px-6 py-3 border-b ${themeClasses.border} flex items-center justify-between`}>
          <div>
            <p className={`text-base font-semibold ${themeClasses.text}`}>{currentChapter.title}</p>
            <p className={`text-xs ${themeClasses.textMuted}`}>{currentChapter.wordCount} 字</p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs disabled:opacity-60" onClick={continueWriting} disabled={isStreaming}>
            {isStreaming ? '推演中...' : 'AI 续写'}
          </button>
        </div>
        {/* 富文本编辑工具栏 */}
        {showRichTextToolbar && (
          <div className={`px-6 py-2 border-b ${themeClasses.border} flex items-center gap-2`}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => insertFormattedText('bold')}
                className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted} font-bold`}
                title="粗体 **文字**"
              >
                B
              </button>
              <button
                onClick={() => insertFormattedText('italic')}
                className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted} italic`}
                title="斜体 *文字*"
              >
                I
              </button>
              <div className={`w-px h-4 mx-1 ${themeClasses.border}`} />
              <button
                onClick={() => insertFormattedText('dialog')}
                className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
                title='对话 "文字"'
              >
                " "
              </button>
              <button
                onClick={() => insertFormattedText('thought')}
                className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
                title="心理 『文字』"
              >
                『』
              </button>
              <button
                onClick={() => insertFormattedText('emphasis')}
                className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
                title="强调 【文字】"
              >
                【】
              </button>
              <div className={`w-px h-4 mx-1 ${themeClasses.border}`} />
              <button
                onClick={formatDialogs}
                className={`px-2 py-1 text-xs rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
                title="自动格式化引号"
              >
                格式化引号
              </button>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => setShowRichTextToolbar(false)}
              className={`p-1 rounded hover:bg-slate-100 ${themeClasses.textMuted}`}
              title="隐藏工具栏"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {!showRichTextToolbar && (
          <div className={`px-6 py-1 border-b ${themeClasses.border}`}>
            <button
              onClick={() => setShowRichTextToolbar(true)}
              className={`text-xs ${themeClasses.textMuted} hover:text-indigo-500`}
            >
              显示格式工具栏
            </button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          value={currentChapter.content}
          onChange={(e) => updateChapter(currentChapter.id, { content: e.target.value })}
          onSelect={handleTextSelection}
          style={{ fontFamily, fontSize: `${fontSize}px`, lineHeight }}
          className={`flex-1 w-full p-6 text-base leading-relaxed focus:outline-none transition-colors duration-300 ${
            effectiveTheme === 'dark' ? 'bg-slate-900 text-slate-100' :
            effectiveTheme === 'gray' ? 'bg-[#f5f3f0] text-slate-800' :
            'bg-white text-slate-800'
          }`}
          placeholder="在此开始书写正文...（选中文本可使用 AI 扩写/润色）"
        />
      </div>
    );
  };

  const renderMindMapView = () => (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 min-h-0">
      {/* 顶部工具栏 */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white/80 backdrop-blur-sm">
        <div className="text-sm text-slate-600">
          <span className="text-slate-400">当前导图：</span>
          <span className="font-medium">{currentMap?.name || '未选择'}</span>
          {selectedNode && (
            <span className="ml-3 text-slate-400">
              已选节点：<span className="text-indigo-600">{selectedNode.title}</span>
            </span>
          )}
        </div>
        <div className="flex gap-2 text-xs">
          {/* 缩放控制 */}
          <div className="flex items-center gap-1 mr-2 px-2 py-1 bg-slate-100 rounded-lg">
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
              onClick={() => setMindMapScale(s => Math.max(0.25, s - 0.1))}
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
              </svg>
            </button>
            <span className="w-12 text-center text-xs font-medium text-slate-600">
              {Math.round(mindMapScale * 100)}%
            </span>
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors"
              onClick={() => setMindMapScale(s => Math.min(2, s + 0.1))}
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-200 transition-colors ml-1"
              onClick={() => setMindMapScale(1)}
              title="重置缩放"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <button
            className="px-3 py-1.5 border rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={saveMindMaps}
          >
            手动保存
          </button>
          <button
            className="px-3 py-1.5 border rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={importMindMap}
          >
            导入
          </button>
          <button
            className="px-3 py-1.5 border rounded-xl border-slate-200 hover:bg-slate-50 transition-colors"
            onClick={exportMindMap}
          >
            导出
          </button>
        </div>
      </div>

      {/* 思维导图画布 - 使用 min-h-0 和 flex-1 确保正确滚动 */}
      <div className="flex-1 min-h-0 overflow-auto p-8">
        {currentMap ? (
          <div
            className="inline-flex min-w-full justify-center origin-top-left transition-transform duration-200"
            style={{ transform: `scale(${mindMapScale})` }}
          >
            {renderMindMapNode(currentMap.root)}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-400">
            请从左侧选择或创建一个思维导图
          </div>
        )}
      </div>

      {/* 底部节点编辑栏 - 使用 flex-shrink-0 确保不被压缩 */}
      <div className="flex-shrink-0 border-t border-slate-200 px-6 py-4 bg-white">
        <div className="flex items-center gap-4">
          {/* 节点标题编辑 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">节点标题</span>
            <input
              value={selectedNode?.title || ''}
              onChange={(e) => updateNodeTitle(e.target.value)}
              disabled={!selectedNode}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm w-40 disabled:bg-slate-50 disabled:text-slate-400"
              placeholder="选择节点后编辑"
            />
          </div>

          {/* 节点颜色选择 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">颜色</span>
            <div className="flex gap-1">
              {NODE_COLORS.map(color => (
                <button
                  key={color.id}
                  onClick={() => updateNodeColor(color.bg)}
                  disabled={!selectedNode}
                  className={`w-6 h-6 rounded-full ${color.bg} transition-transform hover:scale-110 disabled:opacity-40 ${
                    selectedNode?.color === color.bg ? 'ring-2 ring-offset-2 ring-slate-400' : ''
                  }`}
                  title={color.label}
                />
              ))}
            </div>
          </div>

          {/* 节点操作按钮 */}
          <div className="flex gap-2 ml-auto">
            <button
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs hover:bg-indigo-700 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              onClick={aiGenerateMindMapNodes}
              disabled={!selectedNode || isAiGenerating}
            >
              {isAiGenerating && aiGeneratingType === 'mindmap' ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  生成中...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  AI 生成子节点
                </>
              )}
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={addChildNode}
              disabled={!selectedNode}
            >
              + 子节点
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs hover:bg-slate-50 transition-colors disabled:opacity-40"
              onClick={addSibling}
              disabled={!selectedNode || selectedNodeId === currentMap?.root.id}
            >
              + 同级节点
            </button>
            <button
              className="px-4 py-2 rounded-xl border border-rose-200 text-rose-500 text-xs hover:bg-rose-50 transition-colors disabled:opacity-40"
              onClick={deleteNode}
              disabled={!selectedNode || selectedNodeId === currentMap?.root.id}
            >
              删除节点
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (!novel) {
    return (
      <div className="flex h-[calc(100vh-140px)] items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white">
        <div className="text-center space-y-3">
          <p className="text-sm text-slate-500">请选择要编辑的小说。</p>
          <button className="text-indigo-600 text-sm underline" onClick={onBack}>
            返回小说管理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen rounded-3xl border overflow-hidden transition-colors duration-300 ${themeClasses.main}`}>
      {/* 左侧边栏 */}
      <aside className={`w-72 border-r flex flex-col ${themeClasses.sidebar} ${themeClasses.border}`}>
        <div className={`p-4 border-b ${themeClasses.border}`}>
          <button className={`text-xs ${themeClasses.textMuted} flex items-center gap-1 hover:text-indigo-500`} onClick={onBack}>
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <div className={`mt-2 text-xs ${themeClasses.textMuted}`}>{novel.title}</div>
          <button className={`mt-3 w-full text-xs py-2 rounded-xl border ${themeClasses.border} hover:border-indigo-500`} onClick={() => addChapter()}>
            + 新建章节
          </button>
        </div>

        {/* 思维导图列表 */}
        <div className={`px-4 py-3 border-b ${themeClasses.border}`}>
          <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted} mb-2`}>
            <span>思维导图</span>
            <button
              className="text-indigo-500 hover:text-indigo-600 font-medium"
              onClick={addMindMap}
            >
              + 新建
            </button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {mindMaps.map((map) => (
              <div
                key={map.id}
                className={`group relative rounded-xl border px-3 py-2 text-sm transition-colors cursor-pointer ${
                  selectedMapId === map.id
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                    : `${themeClasses.border} ${themeClasses.textMuted} hover:border-indigo-400/50`
                }`}
                onClick={() => {
                  setSelectedMapId(map.id);
                  setSelectedNodeId(map.root.id);
                  setMode('mindmap');
                }}
              >
                {editingMapName === map.id ? (
                  <input
                    value={newMapName}
                    onChange={(e) => setNewMapName(e.target.value)}
                    onBlur={() => {
                      if (newMapName.trim()) {
                        renameMindMap(map.id, newMapName.trim());
                      }
                      setEditingMapName(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newMapName.trim()) {
                        renameMindMap(map.id, newMapName.trim());
                      }
                      if (e.key === 'Escape') {
                        setEditingMapName(null);
                      }
                    }}
                    className={`w-full bg-transparent border-none outline-none text-sm ${themeClasses.text}`}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="truncate">{map.name}</span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewMapName(map.name);
                          setEditingMapName(map.id);
                        }}
                        title="重命名"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMindMap(map.id);
                        }}
                        title="删除"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 章节列表 */}
        <div className="px-4 py-3 flex-1 overflow-y-auto">
          {/* 快速排序按钮 */}
          <button
            onClick={() => setShowQuickSort(!showQuickSort)}
            className={`w-full mb-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
              showQuickSort
                ? 'bg-indigo-600 text-white'
                : `border ${themeClasses.border} ${themeClasses.textMuted} hover:border-indigo-400`
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            快速排序
          </button>

          {/* 标题和操作按钮 */}
          <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted} mb-2`}>
            <span className="font-medium">章节 ({chapters.length})</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => addChapter()}
                className="px-2 py-1 rounded-lg bg-orange-500 text-white text-[10px] font-medium hover:bg-orange-600 transition-colors"
                title="添加章节"
              >
                + 章
              </button>
              <button
                onClick={addVolume}
                className="px-2 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-medium hover:bg-indigo-600 transition-colors"
                title="添加卷"
              >
                + 卷
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {chapters.length === 0 && volumes.length === 0 ? (
              <div className={`text-xs ${themeClasses.textMuted} text-center border border-dashed ${themeClasses.border} rounded-2xl py-8 space-y-2`}>
                <svg className={`w-10 h-10 mx-auto ${themeClasses.textMuted} opacity-50`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p>暂无章节内容</p>
                <p className="text-[10px]">点击上方按钮开始创建</p>
              </div>
            ) : (
              <>
                {/* 显示卷和卷内章节 */}
                {volumes.map((volume) => {
                  const volumeChapters = chapters.filter(ch => ch.volumeId === volume.id);
                  const isCollapsed = collapsedVolumes.has(volume.id);

                  return (
                    <div key={volume.id} className="space-y-1">
                      {/* 卷标题 */}
                      <div
                        className={`group flex items-center gap-2 px-3 py-2 rounded-xl border ${themeClasses.border} ${themeClasses.card} cursor-pointer hover:border-indigo-400/50`}
                        onClick={() => toggleVolumeCollapse(volume.id)}
                      >
                        <button className={`${themeClasses.textMuted} transition-transform ${isCollapsed ? '' : 'rotate-90'}`}>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        {editingVolumeId === volume.id ? (
                          <input
                            value={editingVolumeTitle}
                            onChange={(e) => setEditingVolumeTitle(e.target.value)}
                            onBlur={() => {
                              if (editingVolumeTitle.trim()) {
                                renameVolume(volume.id, editingVolumeTitle.trim());
                              }
                              setEditingVolumeId(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && editingVolumeTitle.trim()) {
                                renameVolume(volume.id, editingVolumeTitle.trim());
                              }
                              if (e.key === 'Escape') {
                                setEditingVolumeId(null);
                              }
                            }}
                            className={`flex-1 bg-transparent border-none outline-none text-sm font-medium ${themeClasses.text}`}
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <>
                            <span className={`flex-1 text-sm font-medium ${themeClasses.text}`}>{volume.title}</span>
                            <span className={`text-[10px] ${themeClasses.textMuted}`}>{volumeChapters.length} 章</span>
                          </>
                        )}
                        <div className="hidden group-hover:flex items-center gap-0.5">
                          <button
                            className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              addChapter(volume.id);
                            }}
                            title="添加章节到此卷"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                          <button
                            className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingVolumeTitle(volume.title);
                              setEditingVolumeId(volume.id);
                            }}
                            title="重命名"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteVolume(volume.id);
                            }}
                            title="删除卷"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* 卷内章节列表 */}
                      {!isCollapsed && (
                        <div className="ml-4 space-y-1">
                          {volumeChapters.map((chapter, index) => (
                            <div
                              key={chapter.id}
                              className={`group relative rounded-xl px-3 py-2 border text-sm transition-colors cursor-pointer ${
                                chapter.id === selectedChapterId
                                  ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                                  : `${themeClasses.border} ${themeClasses.text} hover:border-indigo-400/50`
                              }`}
                              onClick={() => {
                                if (editingChapterId !== chapter.id) {
                                  setSelectedChapterId(chapter.id);
                                  setMode('writing');
                                }
                              }}
                            >
                              {editingChapterId === chapter.id ? (
                                <input
                                  value={editingChapterTitle}
                                  onChange={(e) => setEditingChapterTitle(e.target.value)}
                                  onBlur={() => {
                                    if (editingChapterTitle.trim()) {
                                      renameChapter(chapter.id, editingChapterTitle.trim());
                                    }
                                    setEditingChapterId(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && editingChapterTitle.trim()) {
                                      renameChapter(chapter.id, editingChapterTitle.trim());
                                    }
                                    if (e.key === 'Escape') {
                                      setEditingChapterId(null);
                                    }
                                  }}
                                  className={`w-full bg-transparent border-none outline-none text-sm font-medium ${themeClasses.text}`}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium truncate pr-2">{chapter.title}</span>
                                    <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                                      <button
                                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                        onClick={(e) => { e.stopPropagation(); moveChapterUp(chapter.id); }}
                                        title="上移"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                        </svg>
                                      </button>
                                      <button
                                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                        onClick={(e) => { e.stopPropagation(); moveChapterDown(chapter.id); }}
                                        title="下移"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                      </button>
                                      <button
                                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                        onClick={(e) => { e.stopPropagation(); setEditingChapterTitle(chapter.title); setEditingChapterId(chapter.id); }}
                                        title="重命名"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                                        onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                                        title="删除"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                  <span className={`block text-[11px] ${themeClasses.textMuted} mt-0.5`}>{chapter.wordCount} 字</span>
                                </>
                              )}
                            </div>
                          ))}
                          {volumeChapters.length === 0 && (
                            <div className={`text-xs ${themeClasses.textMuted} text-center py-4 border border-dashed ${themeClasses.border} rounded-xl`}>
                              此卷暂无章节
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* 显示未分类章节（没有 volumeId 的章节） */}
                {(() => {
                  const unassignedChapters = chapters.filter(ch => !ch.volumeId);
                  if (unassignedChapters.length === 0) return null;

                  return (
                    <div className="space-y-1">
                      {volumes.length > 0 && (
                        <div className={`text-xs ${themeClasses.textMuted} px-3 py-1.5 font-medium`}>
                          未分类章节
                        </div>
                      )}
                      {unassignedChapters.map((chapter, index) => (
                        <div
                          key={chapter.id}
                          className={`group relative rounded-2xl px-3 py-2 border text-sm transition-colors cursor-pointer ${
                            chapter.id === selectedChapterId
                              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-400'
                              : `${themeClasses.border} ${themeClasses.text} hover:border-indigo-400/50`
                          }`}
                          onClick={() => {
                            if (editingChapterId !== chapter.id) {
                              setSelectedChapterId(chapter.id);
                              setMode('writing');
                            }
                          }}
                        >
                          {editingChapterId === chapter.id ? (
                            <input
                              value={editingChapterTitle}
                              onChange={(e) => setEditingChapterTitle(e.target.value)}
                              onBlur={() => {
                                if (editingChapterTitle.trim()) {
                                  renameChapter(chapter.id, editingChapterTitle.trim());
                                }
                                setEditingChapterId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editingChapterTitle.trim()) {
                                  renameChapter(chapter.id, editingChapterTitle.trim());
                                }
                                if (e.key === 'Escape') {
                                  setEditingChapterId(null);
                                }
                              }}
                              className={`w-full bg-transparent border-none outline-none text-sm font-medium ${themeClasses.text}`}
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <>
                              <div className="flex items-center justify-between">
                                <span className="font-medium truncate pr-2">{chapter.title}</span>
                                <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                                  {/* 移动到卷按钮 */}
                                  {volumes.length > 0 && (
                                    <div className="relative">
                                      <button
                                        className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} ${showVolumePickerFor === chapter.id ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setShowVolumePickerFor(showVolumePickerFor === chapter.id ? null : chapter.id);
                                        }}
                                        title="移动到卷"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                                        </svg>
                                      </button>
                                      {/* 卷选择下拉菜单 */}
                                      {showVolumePickerFor === chapter.id && (
                                        <div
                                          className={`absolute left-0 top-full mt-1 z-20 min-w-[120px] py-1 rounded-xl shadow-lg border ${themeClasses.card} ${themeClasses.border}`}
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <div className={`px-2 py-1 text-[10px] ${themeClasses.textMuted} font-medium border-b ${themeClasses.border}`}>
                                            选择目标卷
                                          </div>
                                          {volumes.map(vol => (
                                            <button
                                              key={vol.id}
                                              className={`w-full text-left px-3 py-1.5 text-xs ${themeClasses.text} hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors`}
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                moveChapterToVolume(chapter.id, vol.id);
                                                setShowVolumePickerFor(null);
                                              }}
                                            >
                                              {vol.title}
                                            </button>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                  <button
                                    className={`p-1 rounded ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''} ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                    onClick={(e) => { e.stopPropagation(); moveChapterUp(chapter.id); }}
                                    disabled={index === 0}
                                    title="上移"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                  <button
                                    className={`p-1 rounded ${index === unassignedChapters.length - 1 ? 'opacity-30 cursor-not-allowed' : ''} ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                    onClick={(e) => { e.stopPropagation(); moveChapterDown(chapter.id); }}
                                    disabled={index === unassignedChapters.length - 1}
                                    title="下移"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  <button
                                    className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                    onClick={(e) => { e.stopPropagation(); setEditingChapterTitle(chapter.title); setEditingChapterId(chapter.id); }}
                                    title="重命名"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    className={`p-1 rounded ${effectiveTheme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                                    onClick={(e) => { e.stopPropagation(); duplicateChapter(chapter.id); }}
                                    title="复制章节"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    className="p-1 hover:bg-rose-100 text-rose-500 rounded"
                                    onClick={(e) => { e.stopPropagation(); deleteChapter(chapter.id); }}
                                    title="删除"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <span className={`block text-[11px] ${themeClasses.textMuted} mt-0.5`}>{chapter.wordCount} 字</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* 主内容区 */}
      <section className="flex-1 flex flex-col">
        <div className={`px-6 py-3 border-b ${themeClasses.border} flex items-center gap-3`}>
          {(['writing', 'mindmap'] as const).map((view) => (
            <button
              key={view}
              className={`px-4 py-2 rounded-2xl text-sm border transition-colors ${
                mode === view
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : `${themeClasses.border} ${themeClasses.textMuted} hover:border-indigo-400`
              }`}
              onClick={() => setMode(view)}
            >
              {view === 'writing' ? '章节写作' : '思维导图'}
            </button>
          ))}
          <div className={`ml-auto flex items-center gap-2 text-xs ${themeClasses.textMuted}`}>
            <span>文字变化后 30 秒内自动保存</span>
            <button className={`px-3 py-1.5 rounded-xl border ${themeClasses.border} hover:border-indigo-400`}>导入</button>
            <button className={`px-3 py-1.5 rounded-xl border ${themeClasses.border} hover:border-indigo-400`}>小说信息</button>
            <button className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">保存</button>
          </div>
        </div>
        {mode === 'writing' ? renderWritingView() : renderMindMapView()}
      </section>

      {/* 创作管理模态框 */}
      <CreativeManagementModal
        type={creativeModalType || 'characters'}
        isOpen={creativeModalType !== null}
        onClose={() => setCreativeModalType(null)}
        novelTitle={novel?.title}
        novelDescription={novel?.description}
        characters={characters}
        onAddCharacter={addCharacter}
        onUpdateCharacter={updateCharacter}
        onDeleteCharacter={deleteCharacter}
        worldviews={worldviews}
        onAddWorldview={addWorldview}
        onUpdateWorldview={updateWorldview}
        onDeleteWorldview={deleteWorldview}
        events={timelineEvents}
        onAddEvent={addTimelineEvent}
        onUpdateEvent={updateTimelineEvent}
        onDeleteEvent={deleteTimelineEvent}
        references={references}
        onAddReference={addReference}
        onUpdateReference={updateReference}
        onDeleteReference={deleteReference}
      />

      {/* 大纲管理器 */}
      <OutlineManager
        isOpen={showOutlineManager}
        onClose={() => setShowOutlineManager(false)}
        outlineNodes={outlineNodes}
        onUpdateOutlineNodes={setOutlineNodes}
        chapters={chapters}
        volumes={volumes}
        novelTitle={novel?.title}
        novelDescription={novel?.description}
      />

      {/* 伏笔追踪器 */}
      <ForeshadowingTracker
        isOpen={showForeshadowingTracker}
        onClose={() => setShowForeshadowingTracker(false)}
        foreshadowings={foreshadowings}
        onUpdateForeshadowings={setForeshadowings}
        chapters={chapters}
        characters={characters}
        novelTitle={novel?.title}
        novelDescription={novel?.description}
      />

      {/* 写作目标设置模态框 */}
      {showWritingGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWritingGoal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[400px] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">设置写作目标</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowWritingGoal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center space-y-2">
                <p className="text-sm text-slate-500">连续写作天数</p>
                <p className="text-4xl font-bold text-indigo-600">{getStreakDays()}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1000, 2000, 3000, 5000, 8000, 10000].map(words => (
                  <button
                    key={words}
                    onClick={() => { addWritingGoal(words); setShowWritingGoal(false); }}
                    className={`py-3 rounded-xl text-sm font-medium transition-colors ${
                      activeGoal?.targetWords === words
                        ? 'bg-indigo-500 text-white'
                        : 'border border-slate-200 hover:border-indigo-400 text-slate-700'
                    }`}
                  >
                    {words >= 1000 ? `${words / 1000}k` : words} 字/天
                  </button>
                ))}
              </div>
              {activeGoal && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl">
                  <p className="text-sm text-slate-600">
                    当前目标: <span className="font-semibold">{activeGoal.targetWords}</span> 字/天
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    今日已写: <span className="font-semibold text-indigo-600">{getTodayWrittenWords()}</span> 字
                  </p>
                </div>
              )}
              {writingRecords.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-slate-500 mb-2">最近 7 天</p>
                  <div className="flex gap-1">
                    {Array.from({ length: 7 }).map((_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      const dateStr = date.toISOString().split('T')[0];
                      const record = writingRecords.find(r => r.date === dateStr);
                      const hasWritten = record && record.wordsWritten > 0;
                      return (
                        <div
                          key={i}
                          className={`flex-1 h-8 rounded ${
                            hasWritten ? 'bg-green-500' : 'bg-slate-200'
                          }`}
                          title={`${dateStr}: ${record?.wordsWritten || 0} 字`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI 扩写/润色浮动工具栏 */}
      {showAiTextTools && selectedText && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50 w-[500px]">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-slate-800">AI 文本处理</h4>
            <button
              className="text-slate-400 hover:text-slate-600"
              onClick={() => { setShowAiTextTools(false); setSelectedText(''); setAiTextResult(''); }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-3">
            <p className="text-xs text-slate-500 mb-1">选中文本 ({selectedText.length} 字)</p>
            <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-2 max-h-20 overflow-y-auto line-clamp-3">
              {selectedText}
            </p>
          </div>

          <div className="flex gap-2 mb-3">
            <button
              onClick={() => processTextWithAI('expand')}
              disabled={isAiTextProcessing}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                aiTextToolType === 'expand' ? 'bg-indigo-500 text-white' : 'border border-slate-200 hover:border-indigo-400'
              } disabled:opacity-50`}
            >
              扩写
            </button>
            <button
              onClick={() => processTextWithAI('polish')}
              disabled={isAiTextProcessing}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                aiTextToolType === 'polish' ? 'bg-indigo-500 text-white' : 'border border-slate-200 hover:border-indigo-400'
              } disabled:opacity-50`}
            >
              润色
            </button>
            <button
              onClick={() => processTextWithAI('rewrite')}
              disabled={isAiTextProcessing}
              className={`flex-1 py-2 text-sm rounded-lg transition-colors ${
                aiTextToolType === 'rewrite' ? 'bg-indigo-500 text-white' : 'border border-slate-200 hover:border-indigo-400'
              } disabled:opacity-50`}
            >
              改写
            </button>
          </div>

          {isAiTextProcessing && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 mb-3">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              AI 处理中...
            </div>
          )}

          {aiTextResult && (
            <div className="space-y-2">
              <p className="text-xs text-slate-500">处理结果 ({aiTextResult.length} 字)</p>
              <div className="text-sm text-slate-700 bg-green-50 rounded-lg p-3 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {aiTextResult}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={applyAiTextResult}
                  className="flex-1 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  应用到正文
                </button>
                <button
                  onClick={() => navigator.clipboard.writeText(aiTextResult)}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  复制
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 场景/地点管理模态框 */}
      {showLocationManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowLocationManager(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">场景/地点管理</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowLocationManager(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* 添加新场景表单 */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  addLocation({
                    name: formData.get('name') as string,
                    type: formData.get('type') as string,
                    region: formData.get('region') as string,
                    description: formData.get('description') as string,
                    features: formData.get('features') as string,
                    significance: formData.get('significance') as string,
                  });
                  form.reset();
                }} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <p className="font-semibold text-sm text-slate-700">添加新场景</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="name" placeholder="场景名称 *" required className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <select name="type" className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
                      <option value="城市">城市</option>
                      <option value="村庄">村庄</option>
                      <option value="秘境">秘境</option>
                      <option value="宗门">宗门</option>
                      <option value="山脉">山脉</option>
                      <option value="森林">森林</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <input name="region" placeholder="所属区域" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <textarea name="description" placeholder="场景描述 *" required rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <input name="features" placeholder="特色描述" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <input name="significance" placeholder="剧情重要性" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <button type="submit" className="w-full py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600">添加场景</button>
                </form>

                {/* 场景列表 */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-slate-700">已添加的场景 ({locations.length})</p>
                  {locations.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">暂无场景</p>
                  ) : (
                    locations.map(loc => (
                      <div key={loc.id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🏔️</span>
                            <span className="font-semibold">{loc.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{loc.type}</span>
                          </div>
                          <button onClick={() => deleteLocation(loc.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        {loc.region && <p className="text-xs text-slate-500 mb-1">所属区域：{loc.region}</p>}
                        <p className="text-sm text-slate-600">{loc.description}</p>
                        {loc.features && <p className="text-xs text-slate-500 mt-1">特色：{loc.features}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 道具/技能管理模态框 */}
      {showItemManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowItemManager(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">道具/技能管理</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowItemManager(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {/* 添加新道具表单 */}
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  addItem({
                    name: formData.get('name') as string,
                    type: formData.get('type') as Item['type'],
                    category: formData.get('category') as string,
                    description: formData.get('description') as string,
                    effects: formData.get('effects') as string,
                    origin: formData.get('origin') as string,
                  });
                  form.reset();
                }} className="p-4 bg-slate-50 rounded-xl space-y-3">
                  <p className="font-semibold text-sm text-slate-700">添加新道具/技能</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input name="name" placeholder="名称 *" required className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                    <select name="type" className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
                      <option value="weapon">武器</option>
                      <option value="armor">防具</option>
                      <option value="accessory">饰品</option>
                      <option value="skill">技能</option>
                      <option value="technique">功法</option>
                      <option value="artifact">法宝</option>
                      <option value="other">其他</option>
                    </select>
                  </div>
                  <input name="category" placeholder="品级/子类型" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <textarea name="description" placeholder="描述 *" required rows={3} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <input name="effects" placeholder="效果说明" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <input name="origin" placeholder="来源" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                  <button type="submit" className="w-full py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600">添加</button>
                </form>

                {/* 道具列表 */}
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-slate-700">已添加的道具/技能 ({items.length})</p>
                  {items.length === 0 ? (
                    <p className="text-center text-slate-400 py-8">暂无道具/技能</p>
                  ) : (
                    items.map(item => (
                      <div key={item.id} className="p-4 border border-slate-200 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{item.type === 'weapon' ? '⚔️' : item.type === 'skill' ? '✨' : item.type === 'technique' ? '📖' : item.type === 'artifact' ? '💎' : '🎯'}</span>
                            <span className="font-semibold">{item.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {item.type === 'weapon' ? '武器' : item.type === 'armor' ? '防具' : item.type === 'accessory' ? '饰品' : item.type === 'skill' ? '技能' : item.type === 'technique' ? '功法' : item.type === 'artifact' ? '法宝' : '其他'}
                            </span>
                            {item.category && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{item.category}</span>}
                          </div>
                          <button onClick={() => deleteItem(item.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-slate-600">{item.description}</p>
                        {item.effects && <p className="text-xs text-indigo-600 mt-1">效果：{item.effects}</p>}
                        {item.origin && <p className="text-xs text-slate-500 mt-1">来源：{item.origin}</p>}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI 角色对话生成模态框 */}
      {showDialogGenerator && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDialogGenerator(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">AI 角色对话生成</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => { setShowDialogGenerator(false); setGeneratedDialog(''); }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* 选择角色 */}
              <div>
                <p className="font-semibold text-sm text-slate-700 mb-2">选择参与对话的角色（至少2个）</p>
                <div className="flex flex-wrap gap-2">
                  {characters.map(char => (
                    <button
                      key={char.id}
                      onClick={() => {
                        setDialogCharacters(prev =>
                          prev.includes(char.id)
                            ? prev.filter(id => id !== char.id)
                            : [...prev, char.id]
                        );
                      }}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        dialogCharacters.includes(char.id)
                          ? 'bg-indigo-500 text-white'
                          : 'border border-slate-200 hover:border-indigo-400'
                      }`}
                    >
                      {char.name}
                    </button>
                  ))}
                </div>
                {characters.length === 0 && (
                  <p className="text-sm text-slate-400 mt-2">请先添加人物设定</p>
                )}
              </div>

              {/* 对话场景 */}
              <div>
                <p className="font-semibold text-sm text-slate-700 mb-2">对话场景/情境</p>
                <textarea
                  value={dialogContext}
                  onChange={(e) => setDialogContext(e.target.value)}
                  placeholder="描述对话发生的场景或情境，例如：两人在酒楼相遇，讨论最近的江湖大事..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg"
                />
              </div>

              {/* 生成按钮 */}
              <button
                onClick={generateCharacterDialog}
                disabled={dialogCharacters.length < 2 || isGeneratingDialog}
                className="w-full py-2.5 bg-indigo-500 text-white text-sm font-medium rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGeneratingDialog ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    生成中...
                  </>
                ) : (
                  '生成对话'
                )}
              </button>

              {/* 生成结果 */}
              {generatedDialog && (
                <div className="space-y-3">
                  <p className="font-semibold text-sm text-slate-700">生成结果</p>
                  <div className="p-4 bg-green-50 rounded-xl">
                    <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">{generatedDialog}</pre>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={applyGeneratedDialog}
                      className="flex-1 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600"
                    >
                      插入到章节
                    </button>
                    <button
                      onClick={() => navigator.clipboard.writeText(generatedDialog)}
                      className="px-4 py-2 border border-slate-200 text-sm rounded-lg hover:bg-slate-50"
                    >
                      复制
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 专有名词检查结果模态框 */}
      {showNameChecker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNameChecker(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[70vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">专有名词检查结果</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowNameChecker(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {nameCheckResults.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">✅</span>
                  <p className="text-slate-600 mt-3">未发现名词不一致的问题</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    发现 {nameCheckResults.length} 个可能存在不一致写法的名词
                  </p>
                  {nameCheckResults.map((result, idx) => (
                    <div key={idx} className="p-4 border border-amber-200 rounded-xl bg-amber-50/50">
                      <p className="font-semibold text-slate-800 mb-2">"{result.name}"</p>
                      <p className="text-sm text-slate-600 mb-1">发现的变体写法：</p>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {result.variants.map((v, i) => (
                          <span key={i} className="px-2 py-0.5 text-xs bg-white border border-amber-300 rounded">{v}</span>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">出现在：{result.chapters.join('、')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 敏感词检测结果模态框 */}
      {showSensitiveChecker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowSensitiveChecker(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[500px] max-h-[70vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-800">敏感词检测结果</h3>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowSensitiveChecker(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {sensitiveResults.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">✅</span>
                  <p className="text-slate-600 mt-3">未检测到敏感词</p>
                  <p className="text-xs text-slate-400 mt-1">您的内容可以安全发布</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-rose-600 bg-rose-50 p-3 rounded-lg">
                    检测到 {sensitiveResults.length} 处敏感词，建议修改后再发布
                  </p>
                  <div className="space-y-2">
                    {sensitiveResults.map((result, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 border border-rose-200 rounded-lg bg-rose-50/50">
                        <div>
                          <span className="px-2 py-0.5 bg-rose-500 text-white text-xs rounded">{result.word}</span>
                          <span className="text-sm text-slate-600 ml-2">{result.chapter}</span>
                        </div>
                        <span className="text-xs text-slate-400">位置: {result.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 文件导入预览模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImportModal(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-[600px] max-h-[80vh] overflow-hidden flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">导入预览</h3>
                <p className="text-xs text-slate-500 mt-1">共 {importPreview.length} 个文件待导入</p>
              </div>
              <button className="text-slate-400 hover:text-slate-600" onClick={() => setShowImportModal(false)}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {importPreview.map((item, idx) => (
                <div key={idx} className="p-4 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => {
                        const updated = [...importPreview];
                        updated[idx].title = e.target.value;
                        setImportPreview(updated);
                      }}
                      className="font-semibold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-200 focus:border-indigo-400 focus:outline-none px-1"
                    />
                    <button
                      onClick={() => setImportPreview(prev => prev.filter((_, i) => i !== idx))}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">
                    约 {item.content.replace(/\s/g, '').length.toLocaleString()} 字
                  </p>
                  <p className="text-sm text-slate-600 line-clamp-3 whitespace-pre-wrap">
                    {item.content.slice(0, 200)}...
                  </p>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={confirmImport}
                disabled={importPreview.length === 0}
                className="px-4 py-2 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50"
              >
                确认导入 ({importPreview.length} 章)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 右侧AI助手面板 */}
      <aside className={`w-80 border-l flex flex-col ${themeClasses.sidebar} ${themeClasses.border}`}>
        <div className={`flex border-b ${themeClasses.border}`}>
          {(['ai', 'tools', 'settings'] as const).map((tab) => (
            <button key={tab} className={`flex-1 py-3 text-sm ${assistantTab === tab ? `${themeClasses.text} font-semibold` : themeClasses.textMuted}`} onClick={() => setAssistantTab(tab)}>
              {tab === 'ai' ? 'AI助手' : tab === 'tools' ? '工具' : '设置'}
            </button>
          ))}
        </div>

        {assistantTab === 'ai' && (
          <div className="flex-1 flex flex-col relative overflow-hidden">
            {/* 头部 - 会话标题和按钮 */}
            <div className={`px-4 py-3 border-b ${themeClasses.border} flex items-center justify-between`}>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium ${themeClasses.text} truncate`}>
                  {currentSession?.title || '新建会话'}
                </div>
                <div className={`text-xs ${themeClasses.textMuted}`}>
                  {currentSession ? formatSessionDate(currentSession.createdAt) : formatSessionDate(new Date().toISOString())}
                </div>
              </div>
              <div className="flex items-center gap-1.5 ml-2">
                <button
                  onClick={createNewSession}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  新建
                </button>
                <button
                  onClick={() => setShowSessionList(!showSessionList)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                    showSessionList
                      ? 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                      : `${themeClasses.textMuted} ${themeClasses.border} hover:border-indigo-300`
                  }`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  列表
                </button>
              </div>
            </div>

            {/* 会话列表侧边栏 */}
            {showSessionList && (
              <div className={`absolute right-0 top-14 w-72 h-[calc(100%-56px)] ${themeClasses.sidebar} border-l ${themeClasses.border} z-10 flex flex-col shadow-lg`}>
                <div className={`p-3 border-b ${themeClasses.border}`}>
                  <h3 className={`font-semibold text-sm ${themeClasses.text}`}>历史会话</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {aiSessions.length === 0 ? (
                    <p className={`text-center ${themeClasses.textMuted} py-8 text-xs`}>暂无会话记录</p>
                  ) : (
                    aiSessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => selectSession(session.id)}
                        className={`w-full text-left p-2.5 rounded-xl mb-1 transition-colors group ${
                          currentSessionId === session.id
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400'
                            : `hover:bg-slate-50 dark:hover:bg-slate-800 ${themeClasses.text}`
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-xs truncate flex-1">{session.title}</p>
                          <button
                            onClick={(e) => deleteSession(session.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-all"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        <p className={`text-[10px] ${themeClasses.textMuted} mt-0.5`}>
                          {formatSessionDate(session.updatedAt)} · {session.messages.length} 条消息
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 消息区域 */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 || (messages.length === 1 && messages[0].id === 'init') ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-8">
                  <div className={`w-14 h-14 ${themeClasses.card} rounded-full flex items-center justify-center mb-3 border ${themeClasses.border}`}>
                    <svg className={`w-7 h-7 ${themeClasses.textMuted}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                    </svg>
                  </div>
                  <h3 className={`text-sm font-semibold ${themeClasses.text} mb-1`}>笔灵助手</h3>
                  <p className={`${themeClasses.textMuted} text-xs max-w-[200px]`}>
                    我是你的专属创作助手，可以帮助你构思情节、完善人物、润色文笔。
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`rounded-2xl p-3 text-sm ${msg.role === 'ai' ? `${themeClasses.card} border ${themeClasses.border} ${themeClasses.text}` : 'bg-indigo-600 text-white ml-8'}`}
                  >
                    <div className={`text-[10px] ${msg.role === 'ai' ? themeClasses.textMuted : 'text-indigo-200'} mb-1`}>{msg.createdAt}</div>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {/* AI 消息显示操作按钮 */}
                    {msg.role === 'ai' && msg.content && msg.id !== 'init' && (
                      <div className={`flex items-center gap-2 mt-3 pt-2 border-t ${themeClasses.border}`}>
                        <button
                          onClick={() => insertToContent(msg.content)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                          </svg>
                          插入
                        </button>
                        <button
                          onClick={() => copyMessage(msg.content)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs ${themeClasses.border} hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          复制
                        </button>
                        <button
                          onClick={() => quoteMessage(msg.content)}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs ${themeClasses.border} hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          引用
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
              {isStreaming && (
                <div className={`rounded-2xl p-3 ${themeClasses.card} border ${themeClasses.border}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    <span className={`text-xs ${themeClasses.textMuted}`}>正在思考...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 底部输入区域 */}
            <div className={`border-t ${themeClasses.border} p-3 space-y-2`}>
              {/* 工具栏 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <button
                    className={`p-1.5 rounded-lg ${themeClasses.textMuted} hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                    title="分享会话"
                    onClick={() => {
                      if (currentSession && currentSession.messages.length > 0) {
                        const content = currentSession.messages.map(m => `${m.role === 'user' ? '我' : 'AI'}: ${m.content}`).join('\n\n');
                        navigator.clipboard.writeText(content);
                        alert('会话内容已复制到剪贴板');
                      }
                    }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  <button
                    className={`p-1.5 rounded-lg ${themeClasses.textMuted} hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors`}
                    title="引用文本 (选中文本后点击，或引用章节内容)"
                    onClick={quoteSelectedText}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </button>
                  <button
                    className={`p-1.5 rounded-lg transition-colors ${
                      showAiSettings
                        ? 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                        : `${themeClasses.textMuted} hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800`
                    }`}
                    title="AI 设置"
                    onClick={() => setShowAiSettings(!showAiSettings)}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPromptPicker(!showPromptPicker)}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-lg transition-colors ${
                      showPromptPicker
                        ? 'text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                        : `${themeClasses.textMuted} ${themeClasses.border} hover:border-indigo-300`
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    选择提示词
                  </button>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={`px-2 py-1 text-xs ${themeClasses.input} border rounded-lg`}
                  >
                    {availableModels.map(model => (
                      <option key={model.id} value={model.id}>{model.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* AI 设置面板 */}
              {showAiSettings && (
                <div className={`p-3 ${themeClasses.card} rounded-xl border ${themeClasses.border} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-medium ${themeClasses.text}`}>AI 参数设置</span>
                    <button
                      onClick={() => setShowAiSettings(false)}
                      className={`p-1 rounded ${themeClasses.textMuted} hover:text-slate-600`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-xs ${themeClasses.textMuted}`}>创意度 (Temperature)</label>
                        <span className={`text-xs font-medium ${themeClasses.text}`}>{temperature}</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <div className={`flex justify-between text-[10px] ${themeClasses.textMuted} mt-0.5`}>
                        <span>保守</span>
                        <span>创意</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className={`text-xs ${themeClasses.textMuted}`}>最大输出</label>
                        <span className={`text-xs font-medium ${themeClasses.text}`}>
                          {maxTokens === 'unlimited' ? '无限制' : maxTokens}
                        </span>
                      </div>
                      <select
                        value={maxTokens === 'unlimited' ? 'unlimited' : maxTokens}
                        onChange={(e) => setMaxTokens(e.target.value === 'unlimited' ? 'unlimited' : parseInt(e.target.value))}
                        className={`w-full px-2 py-1.5 text-xs ${themeClasses.input} border rounded-lg`}
                      >
                        <option value="unlimited">无限制</option>
                        <option value="1000">1000 tokens</option>
                        <option value="2000">2000 tokens</option>
                        <option value="4000">4000 tokens</option>
                        <option value="8000">8000 tokens</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* 提示词选择器 */}
              {showPromptPicker && prompts.length > 0 && (
                <div className={`p-2 ${themeClasses.card} rounded-xl border ${themeClasses.border} max-h-32 overflow-y-auto`}>
                  <div className="grid grid-cols-2 gap-1.5">
                    {prompts.slice(0, 8).map(prompt => (
                      <button
                        key={prompt.id}
                        onClick={() => selectPrompt(prompt)}
                        className={`text-left p-2 rounded-lg ${themeClasses.sidebar} border ${themeClasses.border} hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors`}
                      >
                        <p className={`text-xs font-medium ${themeClasses.text} truncate`}>{prompt.title}</p>
                        <p className={`text-[10px] ${themeClasses.textMuted} truncate mt-0.5`}>{prompt.content.slice(0, 25)}...</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 输入框 */}
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                rows={2}
                className={`w-full rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${themeClasses.input}`}
                placeholder="输入消息，按 Enter 发送..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
                <span>{chatInput.length} / 8000 字</span>
                <button
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                  onClick={sendMessage}
                  disabled={isStreaming || !chatInput.trim()}
                >
                  {isStreaming ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      生成中
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                      发送
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {assistantTab === 'tools' && (
          <div className={`flex-1 overflow-y-auto p-4 space-y-6 text-sm ${themeClasses.text}`}>
            {/* 创作管理 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>创作管理</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'characters', label: '人物', count: characters.length },
                  { key: 'worldview', label: '世界观', count: worldviews.length },
                  { key: 'events', label: '事件线', count: timelineEvents.length },
                  { key: 'references', label: '语料库', count: references.length }
                ].map((item) => (
                  <button
                    key={item.key}
                    onClick={() => setCreativeModalType(item.key as CreativeManagementTab)}
                    className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
                  >
                    <p className={`text-xs ${themeClasses.textMuted}`}>{item.label}</p>
                    <p className="text-xl font-semibold mt-1">{item.count}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* 大纲与伏笔 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>规划工具</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowOutlineManager(true)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>📋</span>
                    <p className={`text-xs ${themeClasses.textMuted}`}>大纲管理</p>
                  </div>
                  <p className="text-xl font-semibold">{outlineNodes.length}</p>
                </button>
                <button
                  onClick={() => setShowForeshadowingTracker(true)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>🌱</span>
                    <p className={`text-xs ${themeClasses.textMuted}`}>伏笔追踪</p>
                  </div>
                  <p className="text-xl font-semibold">{foreshadowings.filter(f => f.status === 'planted').length}</p>
                </button>
              </div>
            </section>

            {/* 写作目标 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${themeClasses.text}`}>写作目标</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>连续 {getStreakDays()} 天</p>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
                  onClick={() => setShowWritingGoal(true)}
                >
                  设置目标
                </button>
              </div>
              {activeGoal ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className={themeClasses.textMuted}>今日进度</span>
                    <span>{getTodayWrittenWords()} / {activeGoal.targetWords} 字</span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${effectiveTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}>
                    <div
                      className={`h-full transition-all duration-500 ${
                        getTodayWrittenWords() >= activeGoal.targetWords ? 'bg-green-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(100, (getTodayWrittenWords() / activeGoal.targetWords) * 100)}%` }}
                    />
                  </div>
                  {getTodayWrittenWords() >= activeGoal.targetWords && (
                    <p className="text-xs text-green-500 text-center">今日目标已完成!</p>
                  )}
                </div>
              ) : (
                <p className={`text-xs ${themeClasses.textMuted}`}>尚未设置写作目标</p>
              )}
            </section>

            {/* 查找替换 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeClasses.text}`}>查找替换</p>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
                  onClick={() => setShowSearchReplace(!showSearchReplace)}
                >
                  {showSearchReplace ? '收起' : '展开'}
                </button>
              </div>
              {showSearchReplace && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                        searchScope === 'current'
                          ? 'bg-indigo-500 text-white'
                          : `border ${themeClasses.border}`
                      }`}
                      onClick={() => setSearchScope('current')}
                    >
                      当前章节
                    </button>
                    <button
                      className={`flex-1 py-1.5 text-xs rounded-lg transition-colors ${
                        searchScope === 'all'
                          ? 'bg-indigo-500 text-white'
                          : `border ${themeClasses.border}`
                      }`}
                      onClick={() => setSearchScope('all')}
                    >
                      全部章节
                    </button>
                  </div>
                  <input
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="查找内容..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${themeClasses.input}`}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                  />
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="替换为..."
                    className={`w-full px-3 py-2 text-sm rounded-lg border ${themeClasses.input}`}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={performSearch}
                      className="flex-1 py-2 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
                    >
                      查找
                    </button>
                    <button
                      onClick={replaceCurrentResult}
                      disabled={searchResults.length === 0}
                      className="flex-1 py-2 text-xs bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
                    >
                      替换
                    </button>
                    <button
                      onClick={replaceAllResults}
                      disabled={searchResults.length === 0}
                      className="flex-1 py-2 text-xs bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50"
                    >
                      全部替换
                    </button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={themeClasses.textMuted}>
                          找到 {searchResults.length} 个结果
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => goToSearchResult(currentSearchIndex - 1)}
                            disabled={currentSearchIndex === 0}
                            className={`px-2 py-1 rounded border ${themeClasses.border} disabled:opacity-50`}
                          >
                            上一个
                          </button>
                          <button
                            onClick={() => goToSearchResult(currentSearchIndex + 1)}
                            disabled={currentSearchIndex >= searchResults.length - 1}
                            className={`px-2 py-1 rounded border ${themeClasses.border} disabled:opacity-50`}
                          >
                            下一个
                          </button>
                        </div>
                      </div>
                      <div className={`max-h-32 overflow-y-auto space-y-1 text-xs ${themeClasses.textMuted}`}>
                        {searchResults.slice(0, 10).map((result, idx) => (
                          <div
                            key={idx}
                            onClick={() => goToSearchResult(idx)}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              idx === currentSearchIndex
                                ? 'bg-indigo-500/20 border border-indigo-500/30'
                                : `hover:${effectiveTheme === 'dark' ? 'bg-slate-700' : 'bg-slate-100'}`
                            }`}
                          >
                            <span className="font-medium">
                              {chapters.find(c => c.id === result.chapterId)?.title || '未知章节'}
                            </span>
                            <p className="truncate mt-0.5">{result.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 语音朗读 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${themeClasses.text}`}>语音朗读</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>将当前章节转换为语音</p>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs transition-colors ${
                    isSpeaking
                      ? 'bg-rose-500 text-white'
                      : `border ${themeClasses.border} hover:border-indigo-400`
                  }`}
                  onClick={toggleSpeaking}
                >
                  {isSpeaking ? '停止朗读' : '开始朗读'}
                </button>
              </div>
              <div>
                <p className={`text-xs ${themeClasses.textMuted} mb-1`}>可用语音 ({availableVoices.length})</p>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 text-sm ${themeClasses.input}`}
                >
                  {availableVoices.length > 0 ? (
                    availableVoices.map((v, i) => (
                      <option key={i} value={v.name}>{v.name}</option>
                    ))
                  ) : (
                    <>
                      <option>系统默认语音</option>
                      <option>Microsoft Yunxi Online (Natural)</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <p className={`text-xs ${themeClasses.textMuted} mb-1`}>语速调节</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${themeClasses.textMuted} w-8`}>{voiceRate.toFixed(1)}x</span>
                  <input
                    type="range"
                    min={0.5}
                    max={2}
                    step={0.1}
                    value={voiceRate}
                    onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
                    className="flex-1 accent-indigo-500"
                  />
                </div>
              </div>
            </section>

            {/* 导出工具 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeClasses.text}`}>导出工具</p>
                <span className={`text-xs ${themeClasses.textMuted}`}>导出当前章节</span>
              </div>
              <button
                onClick={exportToTXT}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>📄</span>
                导出为 TXT
              </button>
              <button
                onClick={exportToMarkdown}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>📝</span>
                导出为 Markdown
              </button>
              <button
                onClick={exportToWord}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>📘</span>
                导出为 Word
              </button>
              <button
                onClick={exportToPDF}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>📕</span>
                导出为 PDF
              </button>
              <div className={`border-t ${themeClasses.border} pt-3 mt-3`}>
                <p className={`text-xs ${themeClasses.textMuted} mb-2`}>导出全部章节</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportAllChapters('txt')}
                    className={`flex-1 px-3 py-1.5 rounded-xl border ${themeClasses.border} text-xs hover:border-indigo-400`}
                  >
                    全部 TXT
                  </button>
                  <button
                    onClick={() => exportAllChapters('md')}
                    className={`flex-1 px-3 py-1.5 rounded-xl border ${themeClasses.border} text-xs hover:border-indigo-400`}
                  >
                    全部 Markdown
                  </button>
                </div>
              </div>
            </section>

            {/* 场景/道具管理 */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold ${themeClasses.textMuted}`}>设定管理</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowLocationManager(true)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>🏔️</span>
                    <p className={`text-xs ${themeClasses.textMuted}`}>场景地点</p>
                  </div>
                  <p className="text-xl font-semibold">{locations.length}</p>
                </button>
                <button
                  onClick={() => setShowItemManager(true)}
                  className={`rounded-2xl border px-4 py-3 text-left transition-colors ${themeClasses.border} ${themeClasses.card} hover:border-indigo-400/50`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span>⚔️</span>
                    <p className={`text-xs ${themeClasses.textMuted}`}>道具技能</p>
                  </div>
                  <p className="text-xl font-semibold">{items.length}</p>
                </button>
              </div>
            </section>

            {/* 章节模板 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${themeClasses.text}`}>章节模板</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>{chapterTemplates.length} 个模板</p>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
                  onClick={() => setShowTemplateManager(!showTemplateManager)}
                >
                  {showTemplateManager ? '收起' : '展开'}
                </button>
              </div>
              {showTemplateManager && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {chapterTemplates.map(template => (
                    <div
                      key={template.id}
                      className={`p-2 rounded-xl border ${themeClasses.border} hover:border-indigo-400/50 transition-colors`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{template.name}</span>
                        <div className="flex items-center gap-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${themeClasses.sidebar} ${themeClasses.textMuted}`}>
                            {template.category}
                          </span>
                          {!template.isBuiltIn && (
                            <button
                              onClick={() => deleteTemplate(template.id)}
                              className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      <p className={`text-xs ${themeClasses.textMuted} line-clamp-2`}>{template.description || template.content.slice(0, 50)}...</p>
                      <button
                        onClick={() => applyTemplate(template.id)}
                        className="mt-2 w-full py-1.5 text-xs bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                      >
                        应用到当前章节
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* 写作统计 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeClasses.text}`}>写作统计</p>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
                  onClick={() => setShowStatsPanel(!showStatsPanel)}
                >
                  {showStatsPanel ? '收起' : '查看详情'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
                  <p className={themeClasses.textMuted}>总字数</p>
                  <p className="text-lg font-semibold">{getTotalStats.totalWords.toLocaleString()}</p>
                </div>
                <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
                  <p className={themeClasses.textMuted}>写作天数</p>
                  <p className="text-lg font-semibold">{getTotalStats.totalDays}</p>
                </div>
                <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
                  <p className={themeClasses.textMuted}>日均字数</p>
                  <p className="text-lg font-semibold">{getTotalStats.avgDaily.toLocaleString()}</p>
                </div>
                <div className={`p-2 rounded-lg ${themeClasses.sidebar}`}>
                  <p className={themeClasses.textMuted}>最高纪录</p>
                  <p className="text-lg font-semibold">{getTotalStats.maxDaily.toLocaleString()}</p>
                </div>
              </div>
              {showStatsPanel && (
                <div className="space-y-3 pt-2">
                  <p className={`text-xs font-medium ${themeClasses.text}`}>近7天写作趋势</p>
                  <div className="flex items-end gap-1 h-20">
                    {getWeeklyStats().map((stat, idx) => {
                      const maxWords = Math.max(...getWeeklyStats().map(s => s.words), 1);
                      const height = (stat.words / maxWords) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <div
                            className={`w-full rounded-t transition-all ${stat.words > 0 ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                            style={{ height: `${Math.max(height, 4)}%` }}
                            title={`${stat.date}: ${stat.words}字`}
                          />
                          <span className={`text-[9px] ${themeClasses.textMuted}`}>{stat.date}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </section>

            {/* AI 角色对话生成 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${themeClasses.text}`}>AI 对话生成</p>
                  <p className={`text-xs ${themeClasses.textMuted}`}>基于人物设定生成对话</p>
                </div>
                <button
                  className={`px-3 py-1.5 rounded-xl text-xs border transition-colors ${themeClasses.border} hover:border-indigo-400`}
                  onClick={() => setShowDialogGenerator(true)}
                  disabled={characters.length < 2}
                >
                  {characters.length < 2 ? '需要2+人物' : '生成对话'}
                </button>
              </div>
            </section>

            {/* 检查工具 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <p className={`text-sm font-semibold ${themeClasses.text}`}>检查工具</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={checkProperNouns}
                  className={`px-3 py-2 text-xs rounded-xl border ${themeClasses.border} hover:border-amber-400 transition-colors flex flex-col items-center gap-1`}
                >
                  <span>📝</span>
                  <span>专有名词检查</span>
                </button>
                <button
                  onClick={checkSensitiveWords}
                  className={`px-3 py-2 text-xs rounded-xl border ${themeClasses.border} hover:border-rose-400 transition-colors flex flex-col items-center gap-1`}
                >
                  <span>🚨</span>
                  <span>敏感词检测</span>
                </button>
              </div>
            </section>

            {/* 导入工具 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeClasses.text}`}>导入工具</p>
                <span className={`text-xs ${themeClasses.textMuted}`}>批量导入章节</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.md"
                onChange={handleFileImport}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-indigo-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>📥</span>
                导入 TXT/Markdown 文件
              </button>
              <p className={`text-[10px] ${themeClasses.textMuted}`}>
                支持多选，每个文件将作为一个新章节导入
              </p>
            </section>

            {/* 番茄钟 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeClasses.text}`}>番茄钟</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${pomodoroMode === 'work' ? 'bg-rose-100 text-rose-600' : 'bg-green-100 text-green-600'}`}>
                  {pomodoroMode === 'work' ? '专注' : '休息'}
                </span>
              </div>
              <div className="text-center">
                <p className={`text-4xl font-mono font-bold ${pomodoroMode === 'work' ? 'text-rose-500' : 'text-green-500'}`}>
                  {formatPomodoroTime(pomodoroTime)}
                </p>
                <p className={`text-xs ${themeClasses.textMuted} mt-1`}>
                  已完成 {pomodoroCount} 个番茄
                </p>
              </div>
              <div className="flex gap-2">
                {!pomodoroRunning ? (
                  <button
                    onClick={startPomodoro}
                    className="flex-1 py-2 text-sm bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
                  >
                    开始
                  </button>
                ) : (
                  <button
                    onClick={pausePomodoro}
                    className="flex-1 py-2 text-sm bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
                  >
                    暂停
                  </button>
                )}
                <button
                  onClick={resetPomodoro}
                  className={`flex-1 py-2 text-sm rounded-xl border ${themeClasses.border} hover:border-slate-400 transition-colors`}
                >
                  重置
                </button>
              </div>
              <p className={`text-[10px] ${themeClasses.textMuted} text-center`}>
                专注25分钟，休息5分钟
              </p>
            </section>

            {/* 备份恢复 */}
            <section className={`space-y-3 rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4`}>
              <div className="flex items-center justify-between">
                <p className={`text-sm font-semibold ${themeClasses.text}`}>备份恢复</p>
                <span className={`text-xs ${themeClasses.textMuted}`}>完整项目</span>
              </div>
              <button
                onClick={exportBackup}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-green-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>💾</span>
                导出完整备份
              </button>
              <input
                ref={backupInputRef}
                type="file"
                accept=".json"
                onChange={handleBackupImport}
                className="hidden"
              />
              <button
                onClick={() => backupInputRef.current?.click()}
                className={`w-full text-left px-3 py-2 rounded-xl border ${themeClasses.border} text-sm flex items-center gap-2 hover:border-blue-400 transition-colors`}
              >
                <span className={themeClasses.textMuted}>📂</span>
                从备份恢复
              </button>
              <p className={`text-[10px] ${themeClasses.textMuted}`}>
                备份包含：章节、人物、大纲、伏笔等所有数据
              </p>
            </section>
          </div>
        )}

        {assistantTab === 'settings' && (
          <div className={`flex-1 overflow-y-auto p-4 space-y-5 text-sm ${themeClasses.text}`}>
            <section className={`rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4 space-y-3`}>
              <p className={`text-sm font-semibold ${themeClasses.text}`}>界面设置</p>
              {[
                { id: 'light', label: '浅色主题', icon: '🌞' },
                { id: 'gray', label: '护眼灰色', icon: '🕶️' },
                { id: 'dark', label: '深色主题', icon: '🌙' },
                { id: 'system', label: '跟随系统', icon: '💻' }
              ].map((option) => (
                <button
                  key={option.id}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border ${
                    themeOption === option.id ? 'bg-indigo-600 text-white border-indigo-600' : `${themeClasses.border}`
                  }`}
                  onClick={() => setThemeOption(option.id as typeof themeOption)}
                >
                  <span>{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </section>
            <section className={`rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4 space-y-4`}>
              <div>
                <p className={`text-xs ${themeClasses.textMuted} mb-1`}>字体</p>
                <select value={fontFamily} onChange={(e) => setFontFamily(e.target.value)} className={`w-full rounded-xl border px-3 py-2 ${themeClasses.input}`}>
                  <option>微软雅黑</option>
                  <option>苹方</option>
                  <option>思源黑体</option>
                </select>
              </div>
              <div>
                <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
                  <span>字号</span>
                  <span>{fontSize}px</span>
                </div>
                <input type="range" min={12} max={24} step={2} value={fontSize} onChange={(e) => setFontSize(parseInt(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
                  <span>行高</span>
                  <span>{lineHeight.toFixed(1)}</span>
                </div>
                <input type="range" min={1.2} max={2.4} step={0.1} value={lineHeight} onChange={(e) => setLineHeight(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
            </section>
            <section className={`rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4 space-y-4`}>
              <div>
                <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
                  <span>温度 (Temperature)</span>
                  <span>{temperature.toFixed(1)}</span>
                </div>
                <input type="range" min={0.1} max={2} step={0.1} value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
              </div>
              <div>
                <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
                  <span>最大输出长度</span>
                  <span>{maxTokens === 'unlimited' ? '不限' : maxTokens}</span>
                </div>
                <div className="grid grid-cols-5 gap-2 text-xs mt-2">
                  {(['unlimited', 100, 1024, 2048, 4096] as const).map((option) => (
                    <button
                      key={option}
                      className={`py-1 rounded-lg border ${maxTokens === option ? 'bg-indigo-600 text-white border-indigo-600' : themeClasses.border}`}
                      onClick={() => setMaxTokens(option)}
                    >
                      {option === 'unlimited' ? '不限' : option}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </aside>
    </div>
  );
};

export default LongNovelEditor;
