import { Category } from '../types';

export const categories: Category[] = [
  {
    id: 'art',
    name: '예술',
    icon: '🎨',
    color: '#FF6B6B',
  },
  {
    id: 'science',
    name: '과학',
    icon: '🔬',
    color: '#4ECDC4',
  },
  {
    id: 'business',
    name: '비즈니스',
    icon: '💼',
    color: '#45B7D1',
  },
  {
    id: 'philosophy',
    name: '철학',
    icon: '🦉',
    color: '#96CEB4',
  },
  {
    id: 'sport',
    name: '스포츠',
    icon: '🏆',
    color: '#FFEAA7',
  },
  {
    id: 'literature',
    name: '문학',
    icon: '📚',
    color: '#DDA0DD',
  },
  {
    id: 'music',
    name: '음악',
    icon: '🎵',
    color: '#98D8C8',
  },
  {
    id: 'politics',
    name: '정치',
    icon: '🌍',
    color: '#F7DC6F',
  },
];

export const getCategoryById = (id: string): Category | undefined =>
  categories.find((c) => c.id === id);
