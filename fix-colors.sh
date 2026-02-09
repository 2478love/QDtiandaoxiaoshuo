#!/bin/bash

# 配色方案替换脚本
# 主色：#2C5F2D（深绿色）
# 辅助色：#97BC62（嫩绿色）
# 强调色：#F4A460（沙棕色）
# 背景：#FAF9F6（米白色）

# 获取所有需要修改的文件
files=$(find src/ -type f \( -name "*.tsx" -o -name "*.ts" \) -exec grep -l "bg-indigo\|bg-purple\|bg-blue\|text-indigo\|text-purple\|text-blue\|border-indigo\|border-purple\|border-blue" {} \;)

for file in $files; do
  echo "Processing: $file"
  
  # 背景色替换
  sed -i 's/bg-indigo-600/bg-[#2C5F2D]/g' "$file"
  sed -i 's/bg-indigo-700/bg-[#1E4620]/g' "$file"
  sed -i 's/bg-indigo-500/bg-[#2C5F2D]/g' "$file"
  sed -i 's/bg-indigo-50/bg-[#F0F7F0]/g' "$file"
  sed -i 's/bg-indigo-100/bg-[#E8F5E8]/g' "$file"
  sed -i 's/bg-indigo-900\/50/bg-[#2C5F2D]\/20/g' "$file"
  sed -i 's/bg-indigo-900\/20/bg-[#2C5F2D]\/20/g' "$file"
  sed -i 's/bg-indigo-500\/10/bg-[#2C5F2D]\/10/g' "$file"
  sed -i 's/bg-indigo-500\/20/bg-[#2C5F2D]\/20/g' "$file"
  sed -i 's/bg-indigo-900\/30/bg-[#2C5F2D]\/30/g' "$file"
  
  # 文本色替换
  sed -i 's/text-indigo-600/text-[#2C5F2D]/g' "$file"
  sed -i 's/text-indigo-700/text-[#1E4620]/g' "$file"
  sed -i 's/text-indigo-500/text-[#2C5F2D]/g' "$file"
  sed -i 's/text-indigo-400/text-[#97BC62]/g' "$file"
  sed -i 's/text-indigo-300/text-[#97BC62]/g' "$file"
  
  # 边框色替换
  sed -i 's/border-indigo-600/border-[#2C5F2D]/g' "$file"
  sed -i 's/border-indigo-500/border-[#2C5F2D]/g' "$file"
  sed -i 's/border-indigo-400/border-[#97BC62]/g' "$file"
  sed -i 's/border-indigo-300/border-[#97BC62]/g' "$file"
  sed -i 's/border-indigo-200/border-[#E8F5E8]/g' "$file"
  sed -i 's/border-indigo-100/border-[#F0F7F0]/g' "$file"
  sed -i 's/border-indigo-800/border-[#1E4620]/g' "$file"
  sed -i 's/border-indigo-700/border-[#1E4620]/g' "$file"
  sed -i 's/border-indigo-500\/30/border-[#2C5F2D]\/30/g' "$file"
  
  # hover 状态替换
  sed -i 's/hover:bg-indigo-700/hover:bg-[#1E4620]/g' "$file"
  sed -i 's/hover:bg-indigo-600/hover:bg-[#1E4620]/g' "$file"
  sed -i 's/hover:bg-indigo-100/hover:bg-[#E8F5E8]/g' "$file"
  sed -i 's/hover:bg-indigo-500\/20/hover:bg-[#2C5F2D]\/20/g' "$file"
  sed -i 's/hover:text-indigo-700/hover:text-[#1E4620]/g' "$file"
  sed -i 's/hover:text-indigo-600/hover:text-[#1E4620]/g' "$file"
  sed -i 's/hover:text-indigo-500/hover:text-[#1E4620]/g' "$file"
  sed -i 's/hover:text-indigo-300/hover:text-[#97BC62]/g' "$file"
  sed -i 's/hover:border-indigo-300/hover:border-[#97BC62]/g' "$file"
  sed -i 's/hover:border-indigo-400/hover:border-[#97BC62]/g' "$file"
  sed -i 's/hover:border-indigo-500\/30/hover:border-[#2C5F2D]\/30/g' "$file"
  
  # focus 状态替换
  sed -i 's/focus:ring-indigo-500\/20/focus:ring-[#2C5F2D]\/20/g' "$file"
  sed -i 's/focus:border-indigo-500/focus:border-[#2C5F2D]/g' "$file"
  sed -i 's/focus:ring-indigo-500/focus:ring-[#2C5F2D]/g' "$file"
  
  # peer-checked 状态替换
  sed -i 's/peer-checked:bg-indigo-600/peer-checked:bg-[#2C5F2D]/g' "$file"
  sed -i 's/peer-checked:border-indigo-600/peer-checked:border-[#2C5F2D]/g' "$file"
  
  # shadow 替换
  sed -i 's/shadow-indigo-100/shadow-[#E8F5E8]/g' "$file"
  
  # 保留蓝色用于信息提示（Toast info）
  # 不替换 bg-blue-50, text-blue-500 等用于 info 类型的颜色
  
done

echo "✅ 配色替换完成！"
