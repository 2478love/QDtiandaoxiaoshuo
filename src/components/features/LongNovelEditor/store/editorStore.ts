import { create } from 'zustand';
import {
  Novel, Chapter, Volume, Character, Worldview, TimelineEvent, Reference,
  MindMap, MindMapNode, OutlineNode, Foreshadowing, WritingGoal, WritingRecord,
  Location, Item, ChapterTemplate
} from '../../../../types';
import { createId, createMessageId } from '../../../../utils/id';

// 编辑器模式
export type EditorMode = 'writing' | 'mindmap';
export type AssistantTab = 'ai' | 'tools' | 'settings';
export type ThemeOption = 'light' | 'gray' | 'dark' | 'system';
export type CreativeManagementTab = 'characters' | 'worldview' | 'events' | 'references';

// AI 会话类型
export interface AIChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: string;
}

export interface AIChatSession {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: string;
  updatedAt: string;
}

// 搜索结果类型
export interface SearchResult {
  chapterId: string;
  index: number;
  text: string;
}

// AI 会话存储 Key
const AI_SESSIONS_KEY = 'tiandao_longnovel_ai_sessions';

// 内存缓存
let cachedSessions: AIChatSession[] | null = null;

// 获取保存的 AI 会话（同步版本，用于初始化）
const getSavedAISessions = (): AIChatSession[] => {
  if (cachedSessions) return cachedSessions;

  try {
    const saved = localStorage.getItem(AI_SESSIONS_KEY);
    if (saved) {
      cachedSessions = JSON.parse(saved);
      return cachedSessions!;
    }
  } catch (e) {
    console.error('Failed to load AI sessions:', e);
  }
  return [];
};

// 保存 AI 会话（只使用 localStorage）
const saveAISessions = (sessions: AIChatSession[]) => {
  cachedSessions = sessions;

  // 保存到 localStorage
  try {
    localStorage.setItem(AI_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save AI sessions:', e);
  }
};

// 加载 AI 会话
const loadAISessionsAsync = async (): Promise<AIChatSession[]> => {
  return getSavedAISessions();
};

// Store 接口定义
interface EditorState {
  // Novel 数据
  novel: Novel | null;

  // 基础编辑状态
  selectedChapterId: string | null;
  mode: EditorMode;
  assistantTab: AssistantTab;
  isStreaming: boolean;

  // AI 会话状态
  aiSessions: AIChatSession[];
  currentSessionId: string | null;
  chatInput: string;
  showSessionList: boolean;
  showPromptPicker: boolean;
  showAiSettings: boolean;
  selectedModel: string;

  // 编辑设置
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  temperature: number;
  maxTokens: number | 'unlimited';
  themeOption: ThemeOption;

  // 创作管理
  characters: Character[];
  worldviews: Worldview[];
  timelineEvents: TimelineEvent[];
  references: Reference[];
  creativeModalType: CreativeManagementTab | null;

  // 卷管理
  volumes: Volume[];
  collapsedVolumes: Set<string>;
  editingVolumeId: string | null;
  editingVolumeTitle: string;
  showVolumePickerFor: string | null;

  // 章节编辑
  editingChapterId: string | null;
  editingChapterTitle: string;

  // 思维导图
  mindMaps: MindMap[];
  selectedMapId: string | null;
  selectedNodeId: string | null;
  mindMapScale: number;
  editingMapName: string | null;
  newMapName: string;

  // 大纲和伏笔
  showOutlineManager: boolean;
  outlineNodes: OutlineNode[];
  showForeshadowingTracker: boolean;
  foreshadowings: Foreshadowing[];

  // 写作目标
  showWritingGoal: boolean;
  writingGoals: WritingGoal[];
  writingRecords: WritingRecord[];

  // 查找替换
  showSearchReplace: boolean;
  searchText: string;
  replaceText: string;
  searchResults: SearchResult[];
  currentSearchIndex: number;
  searchScope: 'current' | 'all';

  // AI 文本工具
  showAiTextTools: boolean;
  selectedText: string;
  aiTextToolType: 'expand' | 'polish' | 'rewrite' | null;
  isAiTextProcessing: boolean;
  aiTextResult: string;

  // 场景/地点
  locations: Location[];
  showLocationManager: boolean;

  // 道具/技能
  items: Item[];
  showItemManager: boolean;

  // 章节模板
  chapterTemplates: ChapterTemplate[];
  showTemplateManager: boolean;

  // 写作统计
  showStatsPanel: boolean;

  // AI 对话生成
  showDialogGenerator: boolean;
  dialogCharacters: string[];
  dialogContext: string;
  generatedDialog: string;
  isGeneratingDialog: boolean;

  // 专有名词检查
  showNameChecker: boolean;
  nameCheckResults: {name: string; variants: string[]; chapters: string[]}[];

  // 敏感词检测
  showSensitiveChecker: boolean;
  sensitiveResults: {word: string; chapter: string; position: number}[];

  // 文件导入
  showImportModal: boolean;
  importPreview: {title: string; content: string}[];

  // 番茄钟
  showPomodoro: boolean;
  pomodoroTime: number;
  pomodoroRunning: boolean;
  pomodoroMode: 'work' | 'break';
  pomodoroCount: number;

  // 备份
  showBackupModal: boolean;

  // 富文本
  showRichTextToolbar: boolean;

  // AI 生成状态
  isAiGenerating: boolean;
  aiGeneratingType: 'mindmap' | 'character' | 'worldview' | 'event' | 'reference' | null;

  // 联网搜索
  webSearchEnabled: boolean;
  isSearching: boolean;

  // 语音朗读
  isSpeaking: boolean;
  voice: string;
  voiceRate: number;
}

interface EditorActions {
  // Novel 操作
  setNovel: (novel: Novel | null) => void;

  // 基础状态操作
  setSelectedChapterId: (id: string | null) => void;
  setMode: (mode: EditorMode) => void;
  setAssistantTab: (tab: AssistantTab) => void;
  setIsStreaming: (streaming: boolean) => void;

  // AI 会话操作
  setAiSessions: (sessions: AIChatSession[]) => void;
  addAiSession: (session: AIChatSession) => void;
  updateAiSession: (sessionId: string, updates: Partial<AIChatSession>) => void;
  deleteAiSession: (sessionId: string) => void;
  setCurrentSessionId: (id: string | null) => void;
  setChatInput: (input: string) => void;
  setShowSessionList: (show: boolean) => void;
  setShowPromptPicker: (show: boolean) => void;
  setShowAiSettings: (show: boolean) => void;
  setSelectedModel: (model: string) => void;

  // 编辑设置操作
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setLineHeight: (height: number) => void;
  setTemperature: (temp: number) => void;
  setMaxTokens: (tokens: number | 'unlimited') => void;
  setThemeOption: (theme: ThemeOption) => void;

  // 创作管理操作
  setCharacters: (characters: Character[]) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  setWorldviews: (worldviews: Worldview[]) => void;
  setTimelineEvents: (events: TimelineEvent[]) => void;
  setReferences: (refs: Reference[]) => void;
  setCreativeModalType: (type: CreativeManagementTab | null) => void;

  // 卷管理操作
  setVolumes: (volumes: Volume[]) => void;
  addVolume: () => void;
  deleteVolume: (id: string) => void;
  renameVolume: (id: string, title: string) => void;
  toggleVolumeCollapse: (id: string) => void;
  setEditingVolumeId: (id: string | null) => void;
  setEditingVolumeTitle: (title: string) => void;
  setShowVolumePickerFor: (chapterId: string | null) => void;

  // 章节操作
  setEditingChapterId: (id: string | null) => void;
  setEditingChapterTitle: (title: string) => void;

  // 思维导图操作
  setMindMaps: (maps: MindMap[]) => void;
  setSelectedMapId: (id: string | null) => void;
  setSelectedNodeId: (id: string | null) => void;
  setMindMapScale: (scale: number) => void;
  setEditingMapName: (name: string | null) => void;
  setNewMapName: (name: string) => void;

  // 大纲和伏笔操作
  setShowOutlineManager: (show: boolean) => void;
  setOutlineNodes: (nodes: OutlineNode[]) => void;
  setShowForeshadowingTracker: (show: boolean) => void;
  setForeshadowings: (foreshadowings: Foreshadowing[]) => void;

  // 写作目标操作
  setShowWritingGoal: (show: boolean) => void;
  setWritingGoals: (goals: WritingGoal[]) => void;
  setWritingRecords: (records: WritingRecord[]) => void;

  // 查找替换操作
  setShowSearchReplace: (show: boolean) => void;
  setSearchText: (text: string) => void;
  setReplaceText: (text: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setCurrentSearchIndex: (index: number) => void;
  setSearchScope: (scope: 'current' | 'all') => void;

  // AI 文本工具操作
  setShowAiTextTools: (show: boolean) => void;
  setSelectedText: (text: string) => void;
  setAiTextToolType: (type: 'expand' | 'polish' | 'rewrite' | null) => void;
  setIsAiTextProcessing: (processing: boolean) => void;
  setAiTextResult: (result: string) => void;

  // 场景/地点操作
  setLocations: (locations: Location[]) => void;
  addLocation: (location: Omit<Location, 'id' | 'createdAt'>) => void;
  deleteLocation: (id: string) => void;
  setShowLocationManager: (show: boolean) => void;

  // 道具/技能操作
  setItems: (items: Item[]) => void;
  addItem: (item: Omit<Item, 'id' | 'createdAt'>) => void;
  deleteItem: (id: string) => void;
  setShowItemManager: (show: boolean) => void;

  // 章节模板操作
  setChapterTemplates: (templates: ChapterTemplate[]) => void;
  setShowTemplateManager: (show: boolean) => void;

  // 写作统计操作
  setShowStatsPanel: (show: boolean) => void;

  // AI 对话生成操作
  setShowDialogGenerator: (show: boolean) => void;
  setDialogCharacters: (characters: string[]) => void;
  setDialogContext: (context: string) => void;
  setGeneratedDialog: (dialog: string) => void;
  setIsGeneratingDialog: (generating: boolean) => void;

  // 专有名词检查操作
  setShowNameChecker: (show: boolean) => void;
  setNameCheckResults: (results: {name: string; variants: string[]; chapters: string[]}[]) => void;

  // 敏感词检测操作
  setShowSensitiveChecker: (show: boolean) => void;
  setSensitiveResults: (results: {word: string; chapter: string; position: number}[]) => void;

  // 文件导入操作
  setShowImportModal: (show: boolean) => void;
  setImportPreview: (preview: {title: string; content: string}[]) => void;

  // 番茄钟操作
  setShowPomodoro: (show: boolean) => void;
  setPomodoroTime: (time: number) => void;
  setPomodoroRunning: (running: boolean) => void;
  setPomodoroMode: (mode: 'work' | 'break') => void;
  setPomodoroCount: (count: number) => void;

  // 备份操作
  setShowBackupModal: (show: boolean) => void;

  // 富文本操作
  setShowRichTextToolbar: (show: boolean) => void;

  // AI 生成操作
  setIsAiGenerating: (generating: boolean) => void;
  setAiGeneratingType: (type: 'mindmap' | 'character' | 'worldview' | 'event' | 'reference' | null) => void;

  // 联网搜索操作
  setWebSearchEnabled: (enabled: boolean) => void;
  setIsSearching: (searching: boolean) => void;

  // 语音朗读操作
  setIsSpeaking: (speaking: boolean) => void;
  setVoice: (voice: string) => void;
  setVoiceRate: (rate: number) => void;

  // 从 Novel 初始化数据
  initializeFromNovel: (novel: Novel) => void;

  // 重置状态
  reset: () => void;
}

const initialState: EditorState = {
  novel: null,
  selectedChapterId: null,
  mode: 'writing',
  assistantTab: 'ai',
  isStreaming: false,

  aiSessions: getSavedAISessions(),
  currentSessionId: null,
  chatInput: '',
  showSessionList: false,
  showPromptPicker: false,
  showAiSettings: false,
  selectedModel: 'gemini-2.0-flash',

  fontFamily: '微软雅黑',
  fontSize: 16,
  lineHeight: 1.8,
  temperature: 0.7,
  maxTokens: 'unlimited',
  themeOption: 'light',

  characters: [],
  worldviews: [],
  timelineEvents: [],
  references: [],
  creativeModalType: null,

  volumes: [],
  collapsedVolumes: new Set(),
  editingVolumeId: null,
  editingVolumeTitle: '',
  showVolumePickerFor: null,

  editingChapterId: null,
  editingChapterTitle: '',

  mindMaps: [],
  selectedMapId: null,
  selectedNodeId: null,
  mindMapScale: 1,
  editingMapName: null,
  newMapName: '',

  showOutlineManager: false,
  outlineNodes: [],
  showForeshadowingTracker: false,
  foreshadowings: [],

  showWritingGoal: false,
  writingGoals: [],
  writingRecords: [],

  showSearchReplace: false,
  searchText: '',
  replaceText: '',
  searchResults: [],
  currentSearchIndex: 0,
  searchScope: 'current',

  showAiTextTools: false,
  selectedText: '',
  aiTextToolType: null,
  isAiTextProcessing: false,
  aiTextResult: '',

  locations: [],
  showLocationManager: false,

  items: [],
  showItemManager: false,

  chapterTemplates: [],
  showTemplateManager: false,

  showStatsPanel: false,

  showDialogGenerator: false,
  dialogCharacters: [],
  dialogContext: '',
  generatedDialog: '',
  isGeneratingDialog: false,

  showNameChecker: false,
  nameCheckResults: [],

  showSensitiveChecker: false,
  sensitiveResults: [],

  showImportModal: false,
  importPreview: [],

  showPomodoro: false,
  pomodoroTime: 25 * 60,
  pomodoroRunning: false,
  pomodoroMode: 'work',
  pomodoroCount: 0,

  showBackupModal: false,

  showRichTextToolbar: true,

  isAiGenerating: false,
  aiGeneratingType: null,

  webSearchEnabled: false,
  isSearching: false,

  isSpeaking: false,
  voice: 'Microsoft Yunxi Online (Natural) - Chinese (Mainland)',
  voiceRate: 1.0,
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,

  // Novel 操作
  setNovel: (novel) => set({ novel }),

  // 基础状态操作
  setSelectedChapterId: (selectedChapterId) => set({ selectedChapterId }),
  setMode: (mode) => set({ mode }),
  setAssistantTab: (assistantTab) => set({ assistantTab }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),

  // AI 会话操作
  setAiSessions: (sessions) => {
    set({ aiSessions: sessions });
    saveAISessions(sessions);
  },
  addAiSession: (session) => {
    const newSessions = [...get().aiSessions, session];
    set({ aiSessions: newSessions });
    saveAISessions(newSessions);
  },
  updateAiSession: (sessionId, updates) => {
    const newSessions = get().aiSessions.map(s =>
      s.id === sessionId ? { ...s, ...updates } : s
    );
    set({ aiSessions: newSessions });
    saveAISessions(newSessions);
  },
  deleteAiSession: (sessionId) => {
    const newSessions = get().aiSessions.filter(s => s.id !== sessionId);
    set({ aiSessions: newSessions, currentSessionId: get().currentSessionId === sessionId ? null : get().currentSessionId });
    saveAISessions(newSessions);
  },
  setCurrentSessionId: (currentSessionId) => set({ currentSessionId }),
  setChatInput: (chatInput) => set({ chatInput }),
  setShowSessionList: (showSessionList) => set({ showSessionList }),
  setShowPromptPicker: (showPromptPicker) => set({ showPromptPicker }),
  setShowAiSettings: (showAiSettings) => set({ showAiSettings }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),

  // 编辑设置操作
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLineHeight: (lineHeight) => set({ lineHeight }),
  setTemperature: (temperature) => set({ temperature }),
  setMaxTokens: (maxTokens) => set({ maxTokens }),
  setThemeOption: (themeOption) => set({ themeOption }),

  // 创作管理操作
  setCharacters: (characters) => set({ characters }),
  addCharacter: (character) => set({ characters: [...get().characters, character] }),
  updateCharacter: (id, updates) => set({
    characters: get().characters.map(c => c.id === id ? { ...c, ...updates } : c)
  }),
  deleteCharacter: (id) => set({ characters: get().characters.filter(c => c.id !== id) }),
  setWorldviews: (worldviews) => set({ worldviews }),
  setTimelineEvents: (timelineEvents) => set({ timelineEvents }),
  setReferences: (references) => set({ references }),
  setCreativeModalType: (creativeModalType) => set({ creativeModalType }),

  // 卷管理操作
  setVolumes: (volumes) => set({ volumes }),
  addVolume: () => {
    const newVolume: Volume = {
      id: createId(),
      title: `第 ${get().volumes.length + 1} 卷`,
      order: get().volumes.length,
      createdAt: new Date().toISOString()
    };
    set({ volumes: [...get().volumes, newVolume] });
  },
  deleteVolume: (id) => set({ volumes: get().volumes.filter(v => v.id !== id) }),
  renameVolume: (id, title) => set({
    volumes: get().volumes.map(v => v.id === id ? { ...v, title } : v),
    editingVolumeId: null
  }),
  toggleVolumeCollapse: (id) => {
    const next = new Set(get().collapsedVolumes);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    set({ collapsedVolumes: next });
  },
  setEditingVolumeId: (editingVolumeId) => set({ editingVolumeId }),
  setEditingVolumeTitle: (editingVolumeTitle) => set({ editingVolumeTitle }),
  setShowVolumePickerFor: (showVolumePickerFor) => set({ showVolumePickerFor }),

  // 章节操作
  setEditingChapterId: (editingChapterId) => set({ editingChapterId }),
  setEditingChapterTitle: (editingChapterTitle) => set({ editingChapterTitle }),

  // 思维导图操作
  setMindMaps: (mindMaps) => set({ mindMaps }),
  setSelectedMapId: (selectedMapId) => set({ selectedMapId }),
  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
  setMindMapScale: (mindMapScale) => set({ mindMapScale }),
  setEditingMapName: (editingMapName) => set({ editingMapName }),
  setNewMapName: (newMapName) => set({ newMapName }),

  // 大纲和伏笔操作
  setShowOutlineManager: (showOutlineManager) => set({ showOutlineManager }),
  setOutlineNodes: (outlineNodes) => set({ outlineNodes }),
  setShowForeshadowingTracker: (showForeshadowingTracker) => set({ showForeshadowingTracker }),
  setForeshadowings: (foreshadowings) => set({ foreshadowings }),

  // 写作目标操作
  setShowWritingGoal: (showWritingGoal) => set({ showWritingGoal }),
  setWritingGoals: (writingGoals) => set({ writingGoals }),
  setWritingRecords: (writingRecords) => set({ writingRecords }),

  // 查找替换操作
  setShowSearchReplace: (showSearchReplace) => set({ showSearchReplace }),
  setSearchText: (searchText) => set({ searchText }),
  setReplaceText: (replaceText) => set({ replaceText }),
  setSearchResults: (searchResults) => set({ searchResults }),
  setCurrentSearchIndex: (currentSearchIndex) => set({ currentSearchIndex }),
  setSearchScope: (searchScope) => set({ searchScope }),

  // AI 文本工具操作
  setShowAiTextTools: (showAiTextTools) => set({ showAiTextTools }),
  setSelectedText: (selectedText) => set({ selectedText }),
  setAiTextToolType: (aiTextToolType) => set({ aiTextToolType }),
  setIsAiTextProcessing: (isAiTextProcessing) => set({ isAiTextProcessing }),
  setAiTextResult: (aiTextResult) => set({ aiTextResult }),

  // 场景/地点操作
  setLocations: (locations) => set({ locations }),
  addLocation: (locationData) => {
    const newLocation: Location = {
      ...locationData,
      id: createId(),
      createdAt: new Date().toISOString()
    };
    set({ locations: [...get().locations, newLocation] });
  },
  deleteLocation: (id) => set({ locations: get().locations.filter(l => l.id !== id) }),
  setShowLocationManager: (showLocationManager) => set({ showLocationManager }),

  // 道具/技能操作
  setItems: (items) => set({ items }),
  addItem: (itemData) => {
    const newItem: Item = {
      ...itemData,
      id: createId(),
      createdAt: new Date().toISOString()
    };
    set({ items: [...get().items, newItem] });
  },
  deleteItem: (id) => set({ items: get().items.filter(i => i.id !== id) }),
  setShowItemManager: (showItemManager) => set({ showItemManager }),

  // 章节模板操作
  setChapterTemplates: (chapterTemplates) => set({ chapterTemplates }),
  setShowTemplateManager: (showTemplateManager) => set({ showTemplateManager }),

  // 写作统计操作
  setShowStatsPanel: (showStatsPanel) => set({ showStatsPanel }),

  // AI 对话生成操作
  setShowDialogGenerator: (showDialogGenerator) => set({ showDialogGenerator }),
  setDialogCharacters: (dialogCharacters) => set({ dialogCharacters }),
  setDialogContext: (dialogContext) => set({ dialogContext }),
  setGeneratedDialog: (generatedDialog) => set({ generatedDialog }),
  setIsGeneratingDialog: (isGeneratingDialog) => set({ isGeneratingDialog }),

  // 专有名词检查操作
  setShowNameChecker: (showNameChecker) => set({ showNameChecker }),
  setNameCheckResults: (nameCheckResults) => set({ nameCheckResults }),

  // 敏感词检测操作
  setShowSensitiveChecker: (showSensitiveChecker) => set({ showSensitiveChecker }),
  setSensitiveResults: (sensitiveResults) => set({ sensitiveResults }),

  // 文件导入操作
  setShowImportModal: (showImportModal) => set({ showImportModal }),
  setImportPreview: (importPreview) => set({ importPreview }),

  // 番茄钟操作
  setShowPomodoro: (showPomodoro) => set({ showPomodoro }),
  setPomodoroTime: (pomodoroTime) => set({ pomodoroTime }),
  setPomodoroRunning: (pomodoroRunning) => set({ pomodoroRunning }),
  setPomodoroMode: (pomodoroMode) => set({ pomodoroMode }),
  setPomodoroCount: (pomodoroCount) => set({ pomodoroCount }),

  // 备份操作
  setShowBackupModal: (showBackupModal) => set({ showBackupModal }),

  // 富文本操作
  setShowRichTextToolbar: (showRichTextToolbar) => set({ showRichTextToolbar }),

  // AI 生成操作
  setIsAiGenerating: (isAiGenerating) => set({ isAiGenerating }),
  setAiGeneratingType: (aiGeneratingType) => set({ aiGeneratingType }),

  // 联网搜索操作
  setWebSearchEnabled: (webSearchEnabled) => set({ webSearchEnabled }),
  setIsSearching: (isSearching) => set({ isSearching }),

  // 语音朗读操作
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setVoice: (voice) => set({ voice }),
  setVoiceRate: (voiceRate) => set({ voiceRate }),

  // 从 Novel 初始化数据
  initializeFromNovel: (novel) => {
    const chapters = novel.chapters || [];
    set({
      novel,
      selectedChapterId: chapters[0]?.id || null,
      characters: novel.characters || [],
      worldviews: novel.worldviews || [],
      timelineEvents: novel.timelineEvents || [],
      references: novel.references || [],
      volumes: novel.volumes || [],
      outlineNodes: novel.outlineNodes || [],
      foreshadowings: novel.foreshadowings || [],
      writingGoals: novel.writingGoals || [],
      writingRecords: novel.writingRecords || [],
      locations: novel.locations || [],
      items: novel.items || [],
      chapterTemplates: novel.chapterTemplates || [],
      mindMaps: novel.mindMaps || [],
    });

    // 初始化思维导图选择
    if (novel.mindMaps && novel.mindMaps.length > 0) {
      set({
        selectedMapId: novel.mindMaps[0].id,
        selectedNodeId: novel.mindMaps[0].root.id
      });
    }
  },

  // 重置状态
  reset: () => set(initialState),
}));

export default useEditorStore;
