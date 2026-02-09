# 配色方案对比 - 文学雅致风

## 🎨 配色变更对照表

### 主色调变更

| 元素 | 之前 (蓝紫色系) | 之后 (文学雅致风) | 说明 |
|------|----------------|------------------|------|
| 主按钮 | `bg-indigo-600` (#4F46E5) | `bg-[#2C5F2D]` | 深绿色，象征生机 |
| 主按钮悬停 | `hover:bg-indigo-700` (#4338CA) | `hover:bg-[#1E4620]` | 深绿暗调 |
| 链接颜色 | `text-indigo-600` | `text-[#2C5F2D]` | 统一深绿色 |
| 激活状态 | `bg-indigo-600` | `bg-[#2C5F2D]` | 导航激活 |
| 辅助色 | `text-indigo-400` | `text-[#97BC62]` | 嫩绿色，活力 |
| 点缀色 | - | `text-[#F4A460]` | 沙棕色，温暖 |

### 背景色变更

| 元素 | 之前 | 之后 | 说明 |
|------|------|------|------|
| 全局背景 | `bg-[#F9FAFB]` | `bg-[#FAF9F6]` | 米白色，纸张质感 |
| 卡片背景 | `bg-white` | `bg-white` | 保持纯白 |
| 悬停背景 | `hover:bg-slate-50` | `hover:bg-[#97BC62]/10` | 嫩绿色半透明 |

### 文字色变更

| 元素 | 之前 | 之后 | 说明 |
|------|------|------|------|
| 主要文字 | `text-slate-800` (#1E293B) | `text-[#2C3E50]` | 深灰蓝 |
| 次要文字 | `text-slate-500` | `text-slate-500` | 保持不变 |

## 📊 组件配色详细变更

### 1. Dashboard (仪表盘)

#### 新建创作按钮
```tsx
// 之前
className="bg-indigo-600 hover:bg-indigo-700"

// 之后
className="bg-[#2C5F2D] hover:bg-[#1E4620]"
```

#### 数据卡片图标
```tsx
// 之前
长篇小说: color: 'text-indigo-600', bgColor: 'bg-indigo-50'
短篇作品: color: 'text-pink-600', bgColor: 'bg-pink-50'
总作品数: color: 'text-blue-600', bgColor: 'bg-blue-50'
AI调用: color: 'text-emerald-600', bgColor: 'bg-emerald-50'

// 之后
长篇小说: color: 'text-[#2C5F2D]', bgColor: 'bg-[#97BC62]/10'
短篇作品: color: 'text-[#F4A460]', bgColor: 'bg-[#F4A460]/10'
总作品数: color: 'text-[#2C5F2D]', bgColor: 'bg-[#97BC62]/10'
AI调用: color: 'text-[#97BC62]', bgColor: 'bg-[#2C5F2D]/10'
```

### 2. NovelManager (小说管理)

#### 主要按钮
```tsx
// 新建小说按钮
// 之前: bg-indigo-600 hover:bg-indigo-700
// 之后: bg-[#2C5F2D] hover:bg-[#1E4620]

// 开始创作按钮
// 之前: bg-indigo-600 hover:bg-indigo-700
// 之后: bg-[#2C5F2D] hover:bg-[#1E4620]

// 确认导入按钮
// 之前: bg-indigo-600 hover:bg-indigo-700
// 之后: bg-[#2C5F2D] hover:bg-[#1E4620]

// 创建小说按钮
// 之前: bg-indigo-600 hover:bg-indigo-700
// 之后: bg-[#2C5F2D] hover:bg-[#1E4620]
```

#### 表单元素
```tsx
// 输入框焦点环
// 之前: focus:ring-indigo-500
// 之后: focus:ring-[#2C5F2D]

// 滑块颜色
// 之前: accent-indigo-600
// 之后: accent-[#2C5F2D]

// 目标字数显示
// 之前: text-indigo-600
// 之后: text-[#2C5F2D]
```

#### 筛选器
```tsx
// 激活状态
// 之前: bg-indigo-600 text-white shadow-sm
// 之后: bg-[#2C5F2D] text-white shadow-sm
```

#### 操作图标
```tsx
// 编辑图标
// 之前: text-indigo-600 hover:bg-indigo-50
// 之后: text-[#2C5F2D] hover:bg-[#97BC62]/10

// 复制图标
// 之前: text-emerald-600 hover:bg-emerald-50
// 之后: text-[#97BC62] hover:bg-[#97BC62]/10
```

### 3. Sidebar (侧边栏)

#### 品牌标识
```tsx
// 渐变背景
// 之前: from-indigo-600 to-violet-700
// 之后: from-[#2C5F2D] to-[#97BC62]

// 光晕效果
// 之前: bg-indigo-500
// 之后: bg-[#2C5F2D]

// 副标题
// 之前: text-indigo-500
// 之后: text-[#2C5F2D] (亮色) / text-[#97BC62] (暗色)
```

#### 导航菜单
```tsx
// 激活状态
// 之前: bg-indigo-600 shadow-indigo-200
// 之后: bg-[#2C5F2D] shadow-[#2C5F2D]/20

// 悬停状态
// 之前: hover:bg-slate-50 hover:text-indigo-600
// 之后: hover:bg-[#97BC62]/10 hover:text-[#2C5F2D]
```

#### 底部链接
```tsx
// 文档链接
// 之前: text-indigo-500
// 之后: text-[#2C5F2D] (亮色) / text-[#97BC62] (暗色)
```

## 🎯 配色原则

### 1. 主色调 - 深绿色 (#2C5F2D)
**使用场景：**
- 主要按钮
- 激活状态
- 品牌标识
- 重要链接
- 操作图标

**设计意图：**
- 象征生机与创作
- 体现文学气息
- 提供视觉焦点

### 2. 辅助色 - 嫩绿色 (#97BC62)
**使用场景：**
- 悬停背景（半透明）
- 次要图标
- 品牌渐变
- 暗色模式强调

**设计意图：**
- 代表灵感与活力
- 提供柔和过渡
- 增强层次感

### 3. 点缀色 - 沙棕色 (#F4A460)
**使用场景：**
- 短篇作品图标
- 特殊标识
- 温暖点缀

**设计意图：**
- 增添温暖感
- 体现文学气息
- 丰富视觉层次

### 4. 背景色 - 米白色 (#FAF9F6)
**使用场景：**
- 全局背景
- 页面底色

**设计意图：**
- 模拟纸张质感
- 护眼舒适
- 营造阅读氛围

## 📈 视觉效果提升

### 统一性
- ✅ 所有主色统一为深绿色系
- ✅ 按钮配色保持一致
- ✅ 图标颜色协调统一
- ✅ 品牌识别度增强

### 舒适度
- ✅ 米白色背景减少眼睛疲劳
- ✅ 色彩对比度适中
- ✅ 适合长时间使用
- ✅ 护眼效果显著

### 文学气息
- ✅ 深绿色象征生机
- ✅ 米白色模拟纸张
- ✅ 整体配色优雅沉稳
- ✅ 体现书香墨韵

### 用户体验
- ✅ 悬停状态清晰
- ✅ 激活状态明确
- ✅ 操作反馈及时
- ✅ 视觉层次分明

## 🔍 技术实现

### CSS 变量定义
```css
/* src/styles/colors.css */
:root {
  /* 主色调 */
  --primary: #2C5F2D;
  --primary-light: #97BC62;
  --primary-dark: #1E4620;
  --accent: #F4A460;
  
  /* 背景色 */
  --bg-primary: #FAF9F6;
  --bg-secondary: #F5F3EE;
  --bg-card: #FFFFFF;
  
  /* 文字色 */
  --text-primary: #2C3E50;
  --text-secondary: #7F8C8D;
  --text-link: #2C5F2D;
}
```

### Tailwind 使用方式
```tsx
// 直接使用十六进制颜色
className="bg-[#2C5F2D]"
className="text-[#97BC62]"
className="hover:bg-[#1E4620]"

// 使用半透明
className="bg-[#97BC62]/10"
className="bg-[#2C5F2D]/10"
```

## 📝 维护建议

### 1. 保持一致性
- 新增组件使用相同配色
- 遵循既定的颜色使用规则
- 定期检查配色一致性

### 2. 扩展性
- 可以添加更多色彩变量
- 支持主题切换功能
- 考虑用户自定义配色

### 3. 无障碍
- 检查色彩对比度（WCAG 标准）
- 支持高对比度模式
- 提供色盲友好选项

### 4. 文档更新
- 记录新增配色规则
- 更新组件使用指南
- 维护配色方案文档

---

**配色方案名称**：文学雅致风  
**主题**：书香墨韵，优雅沉稳  
**实施日期**：2026-02-09  
**版本**：v1.0  
