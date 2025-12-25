# 项目目录结构

```
new/
├── .env.local                      # 环境变量配置
├── .gitignore                      # Git 忽略文件
├── README.md                       # 项目说明文档
├── REFACTORING.md                  # 重构说明文档
├── index.html                      # HTML 入口文件
├── package.json                    # 项目依赖配置
├── tsconfig.json                   # TypeScript 配置
├── vite.config.ts                  # Vite 构建配置
├── public/                         # 静态资源目录
│
└── src/                            # 源代码目录
    ├── main.tsx                    # 应用入口文件
    ├── App.tsx                     # 主应用组件
    │
    ├── components/                 # 组件目录
    │   ├── layout/                 # 布局组件
    │   │   ├── Sidebar/           # 侧边栏
    │   │   │   └── index.tsx
    │   │   └── AuthModal/         # 认证模态框
    │   │       └── index.tsx
    │   │
    │   └── features/               # 功能组件
    │       ├── Dashboard/          # 仪表盘
    │       │   └── index.tsx
    │       ├── WritingTool/        # 创作工具
    │       │   └── index.tsx
    │       ├── NovelManager/       # 小说管理
    │       │   └── index.tsx
    │       ├── PromptsLibrary/     # 提示词库
    │       │   └── index.tsx
    │       ├── ShortNovel/         # 短篇小说
    │       │   └── index.tsx
    │       ├── LongNovelEditor/    # 长篇小说编辑器
    │       │   └── index.tsx
    │       ├── BookBreaker/        # 拆书工具
    │       │   └── index.tsx
    │       ├── MemberCenter/       # 会员中心
    │       │   └── index.tsx
    │       ├── InviteManager/      # 邀请管理
    │       │   └── index.tsx
    │       └── Settings/           # 设置
    │           └── index.tsx
    │
    ├── hooks/                      # 自定义 Hooks
    │   ├── index.ts               # 统一导出
    │   └── usePersistentState.ts  # 持久化状态 Hook
    │
    ├── services/                   # 服务层
    │   ├── index.ts               # 统一导出
    │   ├── api/                   # API 服务
    │   │   └── gemini.ts          # Gemini AI 服务
    │   └── auth/                  # 认证服务（预留）
    │       └── index.ts
    │
    ├── types/                      # TypeScript 类型定义
    │   ├── index.ts               # 统一导出
    │   ├── common.ts              # 通用类型（Theme, ViewState, NavItem）
    │   ├── user.ts                # 用户相关类型（User, StoredUser, ActivityEntry, InviteRecord）
    │   ├── novel.ts               # 小说相关类型（Novel, Chapter, ShortWork）
    │   └── prompt.ts              # 提示词相关类型（PromptEntry）
    │
    ├── constants/                  # 常量配置
    │   ├── index.ts               # 统一导出
    │   ├── icons.tsx              # SVG 图标组件
    │   └── navigation.ts          # 导航菜单配置（NAV_ITEMS）
    │
    └── utils/                      # 工具函数
        ├── index.ts               # 统一导出
        ├── id.ts                  # ID 生成函数（createId）
        └── hash.ts                # 哈希函数（hashPassword）
```

## 📊 统计信息

- **总文件数**: 35+
- **组件数**: 12 个（2 个布局 + 10 个功能）
- **类型模块数**: 4 个
- **工具函数模块数**: 2 个
- **服务模块数**: 1 个（API）

## 🎯 模块说明

### 组件（Components）
- **layout/**: 应用框架级组件，如侧边栏、导航、模态框等
- **features/**: 业务功能组件，每个对应一个独立的功能模块

### 类型（Types）
- **common.ts**: 应用通用类型（主题、视图状态等）
- **user.ts**: 用户、活动、邀请相关类型
- **novel.ts**: 小说、章节、短篇作品类型
- **prompt.ts**: 提示词条目类型

### 常量（Constants）
- **icons.tsx**: 所有 SVG 图标组件的集合
- **navigation.ts**: 应用导航菜单配置

### 工具（Utils）
- **id.ts**: 生成唯一标识符
- **hash.ts**: 密码哈希处理（仅演示用）

### 服务（Services）
- **api/gemini.ts**: Google Gemini AI 服务接口
- **auth/**: 认证服务（预留扩展）

## 🔄 导入示例

```typescript
// 导入类型
import { ViewState, User, Novel } from '@/types';

// 导入组件
import Sidebar from '@/components/layout/Sidebar';
import Dashboard from '@/components/features/Dashboard';

// 导入工具
import { createId, hashPassword } from '@/utils';

// 导入常量
import { NAV_ITEMS, Icons } from '@/constants';

// 导入 Hooks
import { usePersistentState } from '@/hooks';

// 导入服务
import { geminiService } from '@/services';
```

注意：实际项目中可以在 `tsconfig.json` 配置路径别名 `@` 指向 `src` 目录。
