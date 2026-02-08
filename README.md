# 天道 (Tiandao) AI 写作工具

一个基于 React + TypeScript + Vite 的现代化 AI 写作工具，使用 Google Gemini AI 提供智能创作辅助。

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

### 2026-02-08
- 🛠️ 修复大量 TypeScript 类型问题与状态更新错误，恢复稳定构建
- ✅ 新增 `npm run typecheck` 与 `npm run test` 脚本，补充基础测试
- ⚡ 主应用改为按功能模块懒加载（`React.lazy + Suspense`），显著降低主包体积
- 🔒 本地安全加固：
  - 备份导入增加结构校验（`safeParseJson + isNovel`）
  - Word/PDF 导出内容增加 `escapeHtml` 处理，降低导出注入风险
  - 未勾选“记住我”时不保留持久会话

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
