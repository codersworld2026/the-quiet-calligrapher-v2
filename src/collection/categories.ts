import { services } from '../components/services';

// The Collection's categories: the five services, then Behind the Scenes. A service's id is the one its homepage
// section and its own page use.
export const categories = [
  ...services.map(({ id, label }) => ({ id, label })),
  { id: 'behind-the-scenes', label: 'Behind the Scenes' }
];

export const isCategory = (id: unknown): id is string => categories.some((category) => category.id === id);

export const categoryLabel = (id: string) => categories.find((category) => category.id === id)?.label ?? id;
