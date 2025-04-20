// src/config/plugin-config.ts

export type Plugin = {
  id: string
  name: string
  emoji: string
  description: string
  tag: string
  tagColor?: string
  enabled?: boolean
}

export const plugins: Plugin[] = [
  {
    id: 'docubuddy',
    name: 'DocuBuddy AI',
    emoji: '📄',
    description: 'Smart document assistant with voice + plugins',
    tag: 'AI Assistant',
    tagColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    enabled: true,
  },
  {
    id: 'pdf-tools',
    name: 'PDF Tools',
    emoji: '🧰',
    description: 'Split, merge, or compress PDF files easily',
    tag: 'Utilities',
    tagColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100',
    enabled: true,
  },
  {
    id: 'image-gen',
    name: 'AI Image Generator',
    emoji: '🎨',
    description: 'Generate images using AI from prompts',
    tag: 'Creative',
    tagColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
    enabled: true,
  }
]
