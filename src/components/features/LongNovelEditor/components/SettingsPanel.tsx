import React from 'react';
import { useEditorStore, ThemeOption } from '../store/editorStore';
import { useEditorContext } from '../context/EditorContext';

const SettingsPanel: React.FC = () => {
  const { themeClasses } = useEditorContext();
  const {
    themeOption,
    setThemeOption,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    temperature,
    setTemperature,
    maxTokens,
    setMaxTokens,
  } = useEditorStore();

  const themeOptions = [
    { id: 'light' as const, label: '浅色主题', icon: '🌞' },
    { id: 'gray' as const, label: '护眼灰色', icon: '🕶️' },
    { id: 'dark' as const, label: '深色主题', icon: '🌙' },
    { id: 'system' as const, label: '跟随系统', icon: '💻' }
  ];

  const tokenOptions: (number | 'unlimited')[] = ['unlimited', 100, 1024, 2048, 4096];

  return (
    <div className={`flex-1 overflow-y-auto p-4 space-y-5 text-sm ${themeClasses.text}`}>
      {/* 界面设置 */}
      <section className={`rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4 space-y-3`}>
        <p className={`text-sm font-semibold ${themeClasses.text}`}>界面设置</p>
        {themeOptions.map((option) => (
          <button
            key={option.id}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl border ${
              themeOption === option.id ? 'bg-[#2C5F2D] text-white border-[#2C5F2D]' : `${themeClasses.border}`
            }`}
            onClick={() => setThemeOption(option.id)}
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </section>

      {/* 字体设置 */}
      <section className={`rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4 space-y-4`}>
        <div>
          <p className={`text-xs ${themeClasses.textMuted} mb-1`}>字体</p>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className={`w-full rounded-xl border px-3 py-2 ${themeClasses.input}`}
          >
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
          <input
            type="range"
            min={12}
            max={24}
            step={2}
            value={fontSize}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
            className="w-full accent-[#2C5F2D]"
          />
        </div>
        <div>
          <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
            <span>行高</span>
            <span>{lineHeight.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={1.2}
            max={2.4}
            step={0.1}
            value={lineHeight}
            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
            className="w-full accent-[#2C5F2D]"
          />
        </div>
      </section>

      {/* AI 参数设置 */}
      <section className={`rounded-2xl border ${themeClasses.card} ${themeClasses.border} p-4 space-y-4`}>
        <div>
          <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
            <span>温度 (Temperature)</span>
            <span>{temperature.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2}
            step={0.1}
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full accent-[#2C5F2D]"
          />
        </div>
        <div>
          <div className={`flex items-center justify-between text-xs ${themeClasses.textMuted}`}>
            <span>最大输出长度</span>
            <span>{maxTokens === 'unlimited' ? '不限' : maxTokens}</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-xs mt-2">
            {tokenOptions.map((option) => (
              <button
                key={option}
                className={`py-1 rounded-lg border ${maxTokens === option ? 'bg-[#2C5F2D] text-white border-[#2C5F2D]' : themeClasses.border}`}
                onClick={() => setMaxTokens(option)}
              >
                {option === 'unlimited' ? '不限' : option}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPanel;
