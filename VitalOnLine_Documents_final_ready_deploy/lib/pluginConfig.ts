export type Plugin = {
  id: string;
  name: string;
  emoji: string;
  description: string;
  tags: string[];
  version: string;
  status: string;
  author?: string;
  active: boolean; // ✅ Add this
};

export const pluginList: Plugin[] = [
  {
    id: 'plugin-1',
    name: 'Image Enhancer',
    emoji: '🖼️',
    description: 'Enhances image quality and sharpness.',
    tags: ['media', 'ai', 'image'],
    version: '1.0.1',
    status: 'stable',
    author: 'DocuBuddy AI',
    active: false, // default
  },
  // ...more
];
