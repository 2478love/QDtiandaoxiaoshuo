import React from 'react';
import { ViewState, User } from '../../../types';
import { NAV_ITEMS } from '../../../constants';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  user: User | null;
  onLoginClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, user, onLoginClick }) => {
  return (
    <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col z-20 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300">
      {/* 品牌标识 */}
      <div className="h-24 flex items-center px-8 mb-4">
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => onNavigate(ViewState.DASHBOARD)}>
            <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-xl rotate-3 group-hover:rotate-0 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path d="m12 19-7-7 14-14 7 7-14 14-4-4z"/></svg>
                </div>
            </div>
            <div className="flex flex-col">
                <span className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tighter leading-none">天道</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-500 font-bold mt-1">Writer Pro</span>
            </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto py-2 custom-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`group w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none translate-x-1'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-indigo-600 dark:hover:text-indigo-400'
              }`}
            >
              <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110 opacity-70 group-hover:opacity-100'}`}>
                {item.icon}
              </span>
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm"></div>
              )}
            </button>
          );
        })}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 mt-auto">
        {user ? (
             <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700">
                 <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                     <span className="text-xs font-bold text-slate-600 dark:text-slate-300">天道算法在线</span>
                 </div>
                 <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">v3.2.0-Alpha</span>
                    <button className="text-[10px] text-indigo-500 font-bold hover:underline">文档</button>
                 </div>
            </div>
        ) : (
             <button
                onClick={onLoginClick}
                className="w-full py-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                登录开启天道
             </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
