export type Theme = 'light' | 'dark' | 'system';

export enum ViewState {
  DASHBOARD = 'dashboard',
  WRITING_TOOL = 'writing_tool',
  NOVEL_MANAGER = 'novel_manager',
  PROMPTS = 'prompts',
  SHORT_NOVEL = 'short_novel',
  LONG_NOVEL = 'long_novel',
  BOOK_BREAKER = 'book_breaker',
  MEMBER = 'member',
  INVITE = 'invite',
  SETTINGS = 'settings'
}

export interface NavItem {
  id: ViewState;
  label: string;
  icon: React.ReactNode;
}
