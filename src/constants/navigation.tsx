import { ViewState, NavItem } from '../types';
import { Icons } from './icons';

/**
 * 导航菜单项配置
 */
export const NAV_ITEMS: NavItem[] = [
  { id: ViewState.DASHBOARD, label: '仪表盘', icon: <Icons.Dashboard /> },
  { id: ViewState.NOVEL_MANAGER, label: '小说管理', icon: <Icons.Book /> },
  { id: ViewState.PROMPTS, label: '提示词库', icon: <Icons.MessageSquare /> },
  { id: ViewState.WRITING_TOOL, label: '创作工具', icon: <Icons.PenTool /> },
  { id: ViewState.SHORT_NOVEL, label: '短篇小说', icon: <Icons.Feather /> },
  { id: ViewState.BOOK_BREAKER, label: '拆书工具', icon: <Icons.Scissors /> },
  { id: ViewState.MEMBER, label: '会员中心', icon: <Icons.User /> },
  { id: ViewState.INVITE, label: '我的邀请', icon: <Icons.Mail /> },
  { id: ViewState.SETTINGS, label: '设置', icon: <Icons.Settings /> },
];
