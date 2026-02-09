#!/bin/bash

# 替换渐变色
sed -i 's/from-indigo-50 to-violet-50/from-[#F0F7F0] to-[#F0F7F0]/g' src/components/ui/WritingGoalsPanel.tsx
sed -i 's/from-indigo-900\/20 to-violet-900\/20/from-[#2C5F2D]\/20 to-[#2C5F2D]\/20/g' src/components/ui/WritingGoalsPanel.tsx

sed -i 's/from-indigo-600 to-violet-600/from-[#2C5F2D] to-[#1E4620]/g' src/components/ui/SessionExpiryWarning.tsx
sed -i 's/shadow-indigo-200/shadow-[#E8F5E8]/g' src/components/ui/SessionExpiryWarning.tsx
sed -i 's/shadow-indigo-300/shadow-[#97BC62]/g' src/components/ui/SessionExpiryWarning.tsx

sed -i 's/from-indigo-600 to-violet-600/from-[#2C5F2D] to-[#1E4620]/g' src/components/layout/AuthModal/index.tsx
sed -i 's/shadow-indigo-200/shadow-[#E8F5E8]/g' src/components/layout/AuthModal/index.tsx
sed -i 's/shadow-indigo-300/shadow-[#97BC62]/g' src/components/layout/AuthModal/index.tsx
sed -i 's/from-indigo-500 via-purple-500 to-pink-500/from-[#2C5F2D] via-[#97BC62] to-[#F4A460]/g' src/components/layout/AuthModal/index.tsx

sed -i 's/from-indigo-50\/50 to-violet-50\/50/from-[#F0F7F0]\/50 to-[#F0F7F0]\/50/g' src/components/features/MemberCenter/index.tsx
sed -i 's/from-indigo-900\/20 to-violet-900\/20/from-[#2C5F2D]\/20 to-[#2C5F2D]\/20/g' src/components/features/MemberCenter/index.tsx

# 替换 accent 颜色（滑块等）
sed -i 's/accent-indigo-500/accent-[#2C5F2D]/g' src/components/features/LongNovelEditor/index.tsx
sed -i 's/accent-indigo-500/accent-[#2C5F2D]/g' src/components/features/LongNovelEditor/components/SettingsPanel.tsx
sed -i 's/accent-indigo-500/accent-[#2C5F2D]/g' src/components/features/LongNovelEditor/components/AIAssistantChat.tsx
sed -i 's/accent-indigo-500/accent-[#2C5F2D]/g' src/components/features/LongNovelEditor/components/ToolsPanel.tsx

# 替换 ring 颜色
sed -i 's/ring-indigo-300/ring-[#97BC62]/g' src/components/features/LongNovelEditor/index.tsx
sed -i 's/ring-indigo-300/ring-[#97BC62]/g' src/components/features/LongNovelEditor/components/MindMapView.tsx
sed -i 's/ring-indigo-100/ring-[#F0F7F0]/g' src/components/features/Settings/index.tsx
sed -i 's/ring-indigo-500\/20/ring-[#2C5F2D]\/20/g' src/components/features/Settings/index.tsx
sed -i 's/ring-indigo-500/ring-[#2C5F2D]/g' src/components/features/Settings/index.tsx

# 替换渐变进度条
sed -i 's/from-indigo-500 to-purple-500/from-[#2C5F2D] to-[#97BC62]/g' src/components/features/LongNovelEditor/components/AnalysisPanel.tsx

# 替换渐变背景
sed -i 's/from-indigo-50 to-purple-50/from-[#F0F7F0] to-[#F0F7F0]/g' src/components/features/LongNovelEditor/components/ToolsPanel.tsx
sed -i 's/from-indigo-950 to-purple-950/from-[#2C5F2D] to-[#1E4620]/g' src/components/features/LongNovelEditor/components/ToolsPanel.tsx

sed -i 's/from-indigo-50 to-violet-50/from-[#F0F7F0] to-[#F0F7F0]/g' src/components/features/Settings/index.tsx
sed -i 's/from-indigo-900\/20 to-violet-900\/20/from-[#2C5F2D]\/20 to-[#2C5F2D]\/20/g' src/components/features/Settings/index.tsx
sed -i 's/from-indigo-600 to-violet-600/from-[#2C5F2D] to-[#1E4620]/g' src/components/features/Settings/index.tsx
sed -i 's/shadow-indigo-200/shadow-[#E8F5E8]/g' src/components/features/Settings/index.tsx
sed -i 's/shadow-indigo-300/shadow-[#97BC62]/g' src/components/features/Settings/index.tsx

sed -i 's/shadow-indigo-200/shadow-[#E8F5E8]/g' src/components/features/ShortNovel/index.tsx

echo "✅ 剩余颜色替换完成！"
