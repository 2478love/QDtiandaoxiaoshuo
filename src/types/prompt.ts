export interface PromptEntry {
  id: string;
  title: string;
  description: string;
  author: string;
  visibility: 'public' | 'private';
  usageCount: number;
  category: string;
  tags: string[];
  iconType: 'book' | 'file' | 'sparkles' | 'pen' | 'star' | 'box';
  isFavorite?: boolean;
  content: string;
  updatedAt: string;
}
