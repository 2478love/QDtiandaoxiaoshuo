# 天道 (Tiandao) AI 写作工具

一个基于 React + TypeScript + Vite 的现代化 AI 写作工具，支持 17 种主流 AI API 服务，提供智能创作辅助。

## ✨ 核心功能

### 📚 小说管理
- **小说创建与编辑**：支持创建多部小说，管理章节、卷册
- **TXT 导入**：支持 TXT 文件导入，自动识别章节标题（支持多种格式）
- **项目副本**：一键复制小说项目，包含所有章节和设定

### 🤖 AI 创作助手
- **三模态 AI 角色**：
  - 💬 **助手**：回答问题，提供创作建议
  - ✍️ **作家**：改写、润色、扩写内容
  - 🔍 **审校**：检查 OOC、逻辑漏洞
- **RAG 记忆系统**：AI 能记住全书内容，检索相关前文剧情
- **联网搜索**：支持联网获取实时信息辅助创作

### 🎨 风格控制矩阵
- **保留度**：20-100%，控制改写对原文的保留程度
- **扩写倾向**：保守（精炼）/ 适中 / 激进（详细）
- **内容尺度**：全年龄 / 普通 / 成熟向
- **文风倾向**：自定义输入（如网文轻小说、古典文学、硬科幻等）

### 🔧 创作工具
- **批量精修**：多章节选择批量 AI 精修，支持暂停/继续/停止
- **Diff 对比编辑**：AI 改写后左右对比显示，一键应用
- **查找替换**：支持当前章节或全部章节范围
- **语音朗读**：章节内容转语音，支持语速调节

### 🎯 智能分析系统（新增）
- **综合分析工具**：一站式分析，整合所有维度
  - 综合评分（0-100分）+ 等级评定（S/A/B/C/D）
  - 优先级问题识别（按影响分数排序）
  - 改进建议生成（快速见效/重要/锦上添花）
  - 详细综合报告 + 优化提示词

- **写作风格增强器**：
  - 五感描写分析（视觉、听觉、嗅觉、味觉、触觉）
  - 对话质量检测（水对话、说明书对话、缺乏个性）
  - 动作描写评估（平铺直叙、节奏单调）
  - 场景渲染分析（缺乏细节、静态描写）
  - 心理描写检测（直白心理、过度心理）

- **情节张力分析器**：
  - 冲突强度检测（人物冲突、环境冲突、内心冲突）
  - 悬念设置评估（疑问句、未解之谜、危机预告、伏笔）
  - 转折点识别（反转、意外、揭秘）
  - 高潮布局分析（强度、铺垫、解决完整度）
  - 节奏控制评估（句式变化、段落密度、呼吸感）

- **情绪曲线追踪器**：
  - 情绪词汇识别（8种基本情绪：喜怒哀惧等）
  - 情绪强度评分（-100到100，正负极性）
  - 情绪起伏曲线（波峰波谷识别）
  - 情绪传递效果（共鸣度0-100）
  - 情绪平衡度计算 + 主导情绪识别

- **网文能力分析器**：
  - 7种核心写作模式（黄金三章、打脸循环、力量进阶等）
  - 6种爽点类型（力量、打脸、宝物、突破、认可、复仇）
  - 黄金三章分析 + 爽点密度检测
  - 章末钩子识别 + 节奏评分

- **内容检查器**：
  - 专有名词一致性检查（人名、地名、道具名）
  - 敏感词检测（四级分类，变体识别）
  - AI味检测和评分
  - 批量去AI味处理

### 🚀 新增功能（2026-02-09）

- **UI 集成 - 智能分析面板**：
  - 将分析工具集成到编辑器界面
  - 四大分析维度：综合分析、写作风格、情节张力、情绪曲线
  - 实时分析反馈，可视化展示结果
  - 优势/问题/建议一目了然

- **批量初稿生成**：
  - 基于大纲节点批量生成章节初稿
  - 支持暂停/继续/停止控制
  - 自动保存进度到本地存储
  - 可调整生成参数（字数、风格、语气、视角等）
  - 失败重试机制（最多3次）
  - 生成报告和导出功能（TXT/Markdown）

- **AI 优化建议生成器**：
  - 基于分析结果自动生成针对性优化提示词
  - 8大类优化模板（对话、动作、场景、情绪、张力等）
  - 按优先级和预期提升排序
  - 快速见效 vs 战略性改进分类
  - 支持批量生成和导出报告

- **增量分析缓存系统**：
  - 智能缓存分析结果，避免重复计算
  - LRU 缓存淘汰策略
  - 内容哈希校验，自动失效
  - 命中缓存时分析时间 < 1ms
  - 持久化到 localStorage

- **快捷键管理系统**：
  - 20+ 默认快捷键（文件、编辑、AI、导航、视图、工具）
  - 快捷键冲突检测
  - 自定义快捷键配置
  - 快捷键帮助文档
  - 持久化配置

- **批量章节操作工具**：
  - 批量选择管理器（全选/反选/排除）
  - 批量删除、移动、复制章节
  - 批量导出（TXT/Markdown）
  - 批量标签管理（添加/移除）
  - 批量设置卷
  - 批量排序和筛选
  - 操作历史和撤销

### 📋 创作管理
- **人物管理**：创建和管理角色设定
- **世界观设定**：构建小说世界观体系
- **事件线/时间线**：管理故事事件流程
- **大纲管理**：层级式大纲结构
- **伏笔追踪**：埋设和回收伏笔管理
- **思维导图**：可视化构思工具
- **场景/地点管理**：管理故事场景设定
- **道具/技能管理**：管理道具和技能设定
- **语料库**：收集和管理参考资料

### 📊 写作辅助
- **写作目标**：设置每日字数目标，追踪连续写作天数
- **写作统计**：总字数、写作天数、日均字数、最高纪录
- **番茄钟**：专注写作计时器
- **章节模板**：预设模板快速开始写作

### 📤 导出功能
- 导出为 TXT、Markdown、Word、PDF
- 支持单章节或全部章节导出
- 完整项目备份与恢复

## 📁 项目结构

```
QDtiandaoxiaoshuo/
├── src/                          # 源代码目录
│   ├── main.tsx                  # 应用入口文件
│   ├── App.tsx                   # 主应用组件
│   │
│   ├── components/               # 组件目录
│   │   ├── layout/              # 布局组件
│   │   │   ├── Sidebar/         # 侧边栏组件
│   │   │   └── AuthModal/       # 认证模态框组件
│   │   └── features/            # 功能组件
│   │       ├── Dashboard/       # 仪表盘
│   │       ├── WritingTool/     # 创作工具
│   │       ├── NovelManager/    # 小说管理
│   │       ├── PromptsLibrary/  # 提示词库
│   │       ├── ShortNovel/      # 短篇小说
│   │       ├── LongNovelEditor/ # 长篇小说编辑器
│   │       ├── BookBreaker/     # 拆书工具
│   │       ├── MemberCenter/    # 会员中心
│   │       ├── InviteManager/   # 邀请管理
│   │       └── Settings/        # 设置
│   │
│   ├── hooks/                   # 自定义 Hooks
│   │   ├── index.ts            # 统一导出
│   │   └── usePersistentState.ts # 持久化状态 Hook
│   │
│   ├── services/                # 服务层
│   │   ├── index.ts            # 统一导出
│   │   ├── api/                # API 服务
│   │   │   ├── gemini.ts       # Gemini AI 服务
│   │   │   └── webSearch.ts    # 联网搜索服务
│   │   ├── auth/               # 认证服务
│   │   │   └── index.ts
│   │   └── rag/                # RAG 记忆服务
│   │       └── RagService.ts   # TF-IDF 向量检索
│   │
│   ├── types/                   # TypeScript 类型定义
│   │   ├── index.ts            # 统一导出
│   │   ├── common.ts           # 通用类型
│   │   ├── user.ts             # 用户相关类型
│   │   ├── novel.ts            # 小说相关类型
│   │   └── prompt.ts           # 提示词相关类型
│   │
│   ├── constants/               # 常量配置
│   │   ├── index.ts            # 统一导出
│   │   ├── icons.tsx           # 图标组件
│   │   └── navigation.ts       # 导航配置
│   │
│   └── utils/                   # 工具函数
│       ├── index.ts            # 统一导出
│       ├── id.ts               # ID 生成工具
│       └── hash.ts             # 哈希工具
│
├── public/                      # 静态资源目录
├── index.html                   # HTML 入口文件
├── package.json                 # 项目依赖配置
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── .env.local                  # 环境变量（本地）
├── .gitignore                  # Git 忽略配置
└── README.md                   # 项目说明文档
```

## 🎯 架构设计理念

### 1. 清晰的分层架构
- **components/layout**: 布局组件，负责应用的整体框架
- **components/features**: 功能组件，每个功能模块独立管理
- **services**: 服务层，处理所有外部交互（API、RAG、存储等）
- **types**: 类型定义，提供完整的类型安全
- **utils**: 工具函数，复用的通用逻辑
- **constants**: 常量配置，集中管理配置项

### 2. 模块化设计
- 每个模块都有自己的 `index.ts` 统一导出
- 避免深层嵌套的导入路径
- 便于模块的重构和迁移

### 3. 状态管理
- 使用 Zustand 进行状态管理
- 编辑器状态集中在 `editorStore.ts`
- 支持持久化存储

### 4. 类型安全
- 所有类型定义集中在 `types` 目录
- 按功能域分类（user、novel、prompt等）
- 使用 barrel exports 简化导入

## 🚀 快速开始

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

### 类型检查
```bash
npm run typecheck
```

### 运行测试
```bash
npm run test
```

## 🤖 支持的 AI 服务

天道写作工具支持 **17 种主流 AI API 服务**，包括国际和国内领先的大模型平台：

### 国际服务商

#### 1. **Google Gemini** 🌟
- **特点**：多模态能力、长上下文、高性价比
- **模型**：
  - Gemini 2.0 Flash - 高效 & 均衡
  - Gemini 2.5 Flash - 最新预览版
  - Gemini 2.5 Pro - 高智能 & 复杂逻辑
  - Gemini 1.5 Pro - 长上下文
  - Gemini 1.5 Flash - 快速响应

#### 2. **OpenAI** 🔥
- **特点**：业界标杆、强大的通用能力
- **模型**：
  - GPT-4o - 旗舰多模态
  - GPT-4o Mini - 高效经济
  - GPT-4 Turbo - 增强版

#### 3. **Anthropic Claude** 🧠
- **特点**：强大的推理能力、长上下文、安全可靠
- **官网**：https://www.anthropic.com
- **模型**：
  - Claude Opus 4.6 - 最强推理能力，适合复杂创作
  - Claude Sonnet 4.5 - 平衡性能与成本
  - Claude Haiku 4.5 - 快速响应，经济实惠

#### 4. **Groq** ⚡
- **特点**：业界最快的推理速度、开源模型托管
- **官网**：https://groq.com
- **模型**：
  - Llama 3.3 70B - Meta 最新开源模型
  - Mixtral 8x7B - Mistral 混合专家模型
  - Gemma 7B - Google 轻量开源模型

#### 5. **Mistral AI** 🇪🇺
- **特点**：欧洲开源 AI 领导者、高质量模型、多语言支持
- **官网**：https://mistral.ai
- **模型**：
  - Mistral Large 2 - 旗舰模型，强大性能
  - Mistral Medium - 中等规模，平衡选择
  - Mistral Small - 轻量快速，经济实惠

#### 6. **Cohere** 🏢
- **特点**：企业级 AI 平台、强大的文本理解
- **官网**：https://cohere.com
- **模型**：
  - Command R+ - 增强版，最强性能
  - Command R - 标准版，均衡选择
  - Command - 基础版，快速响应

#### 7. **Together AI** 🤝
- **特点**：开源模型托管平台、丰富的模型选择
- **官网**：https://www.together.ai
- **模型**：
  - Llama 3.1 405B - Meta 超大规模模型
  - Qwen 2.5 72B - 阿里通义千问开源版

### 国内服务商

#### 8. **DeepSeek** 🔍
- **特点**：高性能、开源友好、代码能力强
- **模型**：
  - DeepSeek Chat - 对话优化
  - DeepSeek Coder - 代码专精

#### 9. **硅基流动 (SiliconFlow)** 💎
- **特点**：国内领先的 AI 推理平台
- **模型**：
  - DeepSeek V3 - 高性能通用
  - DeepSeek V3 0324 - 最新版本
  - Qwen 2.5 72B - 大参数量
  - Qwen 2.5 7B - 轻量快速

#### 10. **通义千问 (Aliyun)** ☁️
- **特点**：阿里云大模型、中文理解优秀、稳定可靠、生态完善
- **官网**：https://dashscope.aliyun.com
- **模型**：
  - Qwen Max - 最强性能，复杂任务
  - Qwen Plus - 增强版，平衡选择
  - Qwen Turbo - 快速响应，高性价比

#### 11. **智谱 AI (Zhipu)** 🎓
- **特点**：清华系大模型、学术背景、中文能力强、多模态支持
- **官网**：https://open.bigmodel.cn
- **模型**：
  - GLM-4 Plus - 增强版，最强性能
  - GLM-4 Air - 轻量版，快速响应
  - GLM-4 Flash - 闪电版，极速推理

#### 12. **月之暗面 (Moonshot)** 🌙
- **特点**：Kimi 智能助手、超长上下文（128K）、联网搜索、文件解析
- **官网**：https://www.moonshot.cn
- **模型**：
  - Moonshot v1 128K - 超长上下文，适合长文本
  - Moonshot v1 32K - 标准上下文，平衡选择
  - Moonshot v1 8K - 短上下文，快速响应

#### 13. **零一万物 (01.AI)** 🚀
- **特点**：李开复创立、多模态能力、推理能力强、中英双语
- **官网**：https://www.lingyiwanwu.com
- **模型**：
  - Yi Large - 大规模模型，强大性能
  - Yi Medium - 中等规模，平衡选择
  - Yi Spark - 轻量快速，经济实惠

#### 14. **百川智能 (Baichuan)** 🔎
- **特点**：搜狗创始人王小川创立、搜索增强、知识问答、中文优化
- **官网**：https://www.baichuan-ai.com
- **模型**：
  - Baichuan 4 - 第四代模型，最新技术
  - Baichuan 3 Turbo - 快速版本，高性价比

#### 15. **MiniMax** 🎯
- **特点**：国内领先的通用大模型、文本生成、语音合成、多模态能力
- **官网**：https://www.minimaxi.com
- **模型**：
  - abab 6.5 Chat - 最新版本，性能提升
  - abab 6 Chat - 稳定版本，可靠选择

#### 16. **字节豆包 (Doubao)** 🫘
- **特点**：字节跳动大模型、多场景应用、内容创作、智能对话
- **官网**：https://www.volcengine.com/product/doubao
- **模型**：
  - Doubao Pro - 专业版，强大性能
  - Doubao Lite - 轻量版，快速响应

#### 17. **自定义 (Custom)** ⚙️
- **特点**：支持任意兼容 OpenAI API 格式的服务
- **用途**：私有部署、本地模型、其他第三方服务

### 如何配置 AI 服务

1. **进入设置页面**：点击侧边栏的"设置"按钮
2. **选择 API 模式**：
   - **会员模式**：使用平台提供的 API（需要会员账号）
   - **自定义模式**：使用自己的 API Key
3. **选择服务商**：从下拉列表中选择你要使用的 AI 服务
4. **输入 API Key**：
   - 各服务商的 API Key 获取方式请访问对应官网
   - API Key 会使用 AES-GCM 加密存储在本地
5. **选择模型**：根据需求选择合适的模型
6. **保存设置**：点击保存按钮完成配置

### API Key 获取指南

- **Google Gemini**：https://aistudio.google.com/app/apikey
- **OpenAI**：https://platform.openai.com/api-keys
- **Anthropic**：https://console.anthropic.com/
- **Groq**：https://console.groq.com/
- **Mistral AI**：https://console.mistral.ai/
- **Cohere**：https://dashboard.cohere.com/api-keys
- **Together AI**：https://api.together.xyz/settings/api-keys
- **DeepSeek**：https://platform.deepseek.com/api_keys
- **通义千问**：https://dashscope.console.aliyun.com/apiKey
- **智谱 AI**：https://open.bigmodel.cn/usercenter/apikeys
- **月之暗面**：https://platform.moonshot.cn/console/api-keys
- **零一万物**：https://platform.lingyiwanwu.com/apikeys
- **百川智能**：https://platform.baichuan-ai.com/console/apikey
- **MiniMax**：https://www.minimaxi.com/user-center/basic-information/interface-key
- **字节豆包**：https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey

### 安全说明

- ✅ **本地加密存储**：所有 API Key 使用 AES-GCM 加密存储
- ✅ **设备指纹派生**：加密密钥基于设备指纹生成
- ✅ **不上传服务器**：API Key 仅存储在本地浏览器
- ✅ **自动重加密**：检测到旧格式时自动升级加密

## 📦 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Tailwind CSS** - 样式框架
- **Zustand** - 状态管理
- **Google Gemini AI** - AI 能力
- **Recharts** - 数据可视化

## 🔧 配置说明

### 环境变量
在 `.env.local` 文件中配置：
```
VITE_GEMINI_API_KEY=your_api_key_here
```

### TypeScript 配置
- 使用严格模式
- 启用所有类型检查
- 支持 ES2020+ 特性

### Vite 配置
- 使用 React 插件
- 支持热模块替换（HMR）
- 优化的构建输出

## 📝 开发规范

### 文件命名
- 组件文件：PascalCase（如 `Dashboard.tsx`）
- 工具函数：camelCase（如 `createId.ts`）
- 类型文件：camelCase（如 `user.ts`）

### 导入顺序
1. React 相关
2. 第三方库
3. 内部组件
4. 类型定义
5. 工具函数
6. 常量

### 代码组织
- 每个功能组件独立目录
- 相关逻辑就近放置
- 使用 barrel exports

## 🎨 样式系统

- 使用 Tailwind CSS 实用类
- 支持深色模式
- 自定义主题配置
- 响应式设计

## 🔄 更新日志

### 2026-02-09 (下午 - AI API 服务扩展)
- 🌐 **新增 12 个主流 AI API 服务支持**：
  - **国际服务商**（5个）：
    - Anthropic Claude (Opus 4.6, Sonnet 4.5, Haiku 4.5)
    - Groq (Llama 3.3 70B, Mixtral 8x7B, Gemma 7B)
    - Mistral AI (Large 2, Medium, Small)
    - Cohere (Command R+, Command R, Command)
    - Together AI (Llama 3.1 405B, Qwen 2.5 72B)
  - **国内服务商**（7个）：
    - 通义千问/Aliyun (Qwen Max, Plus, Turbo)
    - 智谱 AI/Zhipu (GLM-4 Plus, Air, Flash)
    - 月之暗面/Moonshot (v1 128K, 32K, 8K)
    - 零一万物/01.AI (Yi Large, Medium, Spark)
    - 百川智能/Baichuan (Baichuan 4, 3 Turbo)
    - MiniMax (abab 6.5, abab 6)
    - 字节豆包/Doubao (Pro, Lite)
- 📝 **完善文档**：
  - 更新 README.md，添加所有服务商的详细说明
  - 包含特点介绍、官网链接、模型列表
  - 提供 API Key 获取指南
  - 添加安全说明和配置教程
- ✅ **质量保证**：
  - TypeScript 类型检查通过 ✅
  - 构建成功 ✅
  - 890 个测试用例全部通过 ✅
- 🎯 **总计支持**：17 种 AI 服务，共 50+ 个模型可选

### 2026-02-09 (自主优化 - 2小时工作)
- 🎨 **UI 集成 - 智能分析面板**：将分析工具集成到编辑器界面
  - 新增 AnalysisPanel 组件，集成四大分析器
  - 实时分析反馈，可视化展示结果
  - 支持综合分析、写作风格、情节张力、情绪曲线四个维度
  
- 📝 **批量初稿生成**：基于大纲批量生成章节初稿
  - 支持暂停/继续/停止控制
  - 自动保存进度到本地存储
  - 可调整生成参数（字数、风格、语气、视角等）
  - 失败重试机制（最多3次）
  - 生成报告和导出功能（TXT/Markdown）
  
- 🤖 **AI 优化建议生成器**：基于分析结果自动生成优化提示词
  - 8大类优化模板（对话、动作、场景、情绪、张力等）
  - 20+ 提示词模板
  - 按优先级和预期提升排序
  - 快速见效 vs 战略性改进分类
  
- ⚡ **增量分析缓存系统**：提升分析性能
  - 智能缓存分析结果，避免重复计算
  - LRU 缓存淘汰策略
  - 命中缓存时分析时间 < 1ms
  - 持久化到 localStorage
  
- ⌨️ **快捷键管理系统**：提升编辑器操作效率
  - 20+ 默认快捷键（文件、编辑、AI、导航、视图、工具）
  - 快捷键冲突检测
  - 自定义快捷键配置
  - 快捷键帮助文档

- 🔧 **批量章节操作工具**：提升批量处理效率
  - 批量选择管理器（全选/反选/排除）
  - 批量删除、移动、复制章节
  - 批量导出（TXT/Markdown）
  - 批量标签管理、批量设置卷
  - 批量排序和筛选
  - 操作历史和撤销

- 📊 **测试覆盖**：从 718 个增加到 872 个测试用例（+154）

### 2026-02-08 (夜间优化)
- 🎯 **智能分析系统**：新增四大分析器 + 综合分析工具
  - **综合分析工具**：整合所有维度，一站式分析（S/A/B/C/D等级评定）
  - **写作风格增强器**：五感描写、对话优化、动作镜头感、场景渲染、心理描写
  - **情节张力分析器**：冲突检测、悬念评估、转折识别、高潮分析、节奏控制
  - **情绪曲线追踪器**：8种情绪识别、起伏分析、共鸣度评估、情绪平衡
  - **网文能力分析器**：7种写作模式、6种爽点类型、黄金三章、钩子识别
  - **内容检查器**：专有名词一致性、敏感词检测、AI味识别
- 📊 **测试覆盖**：从 4 个增加到 234 个测试用例（增长 58 倍）
- 🛠️ **代码质量**：严格类型检查、完整测试覆盖、稳定构建

### 2026-02-08 (早期)
- 🛠️ 修复大量 TypeScript 类型问题与状态更新错误，恢复稳定构建
- ✅ 新增 `npm run typecheck` 与 `npm run test` 脚本，补充基础测试
- ⚡ 主应用改为按功能模块懒加载（`React.lazy + Suspense`），显著降低主包体积
- 🔒 本地安全加固：
  - 备份导入增加结构校验（`safeParseJson + isNovel`）
  - Word/PDF 导出内容增加 `escapeHtml` 处理，降低导出注入风险
  - 未勾选"记住我"时不保留持久会话

### 2025-01-02
- ✨ 新增 RAG 记忆系统，AI 能记住全书内容
- ✨ 新增三模态 AI 角色（助手/作家/审校）
- ✨ 新增风格控制矩阵（保留度、扩写倾向、内容尺度、文风）
- ✨ 新增批量精修功能，支持多章节批量 AI 润色
- ✨ 新增 Diff 对比编辑器，改写前后对比显示
- ✨ 新增 TXT 文件导入，自动识别章节
- ✨ 新增项目副本功能，一键复制小说

## 📄 许可证

MIT
