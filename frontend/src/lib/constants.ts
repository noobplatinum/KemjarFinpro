export const RARITY_CONFIG = {
  common: {
    label: 'Common',
    color: '#94a3b8',
    text: 'text-slate-400',
    bgColor: 'bg-slate-400/10',
    borderColor: 'border-slate-400/30',
    glowColor: 'shadow-slate-400/20',
  },
  uncommon: {
    label: 'Uncommon',
    color: '#34d399',
    text: 'text-emerald-400',
    bgColor: 'bg-emerald-400/10',
    borderColor: 'border-emerald-400/30',
    glowColor: 'shadow-emerald-400/20',
  },
  rare: {
    label: 'Rare',
    color: '#60a5fa',
    text: 'text-blue-400',
    bgColor: 'bg-blue-400/10',
    borderColor: 'border-blue-400/30',
    glowColor: 'shadow-blue-400/20',
  },
  epic: {
    label: 'Epic',
    color: '#a78bfa',
    text: 'text-purple-400',
    bgColor: 'bg-purple-400/10',
    borderColor: 'border-purple-400/30',
    glowColor: 'shadow-purple-400/20',
  },
  legendary: {
    label: 'Legendary',
    color: '#fbbf24',
    text: 'text-amber-400',
    bgColor: 'bg-amber-400/10',
    borderColor: 'border-amber-400/30',
    glowColor: 'shadow-amber-400/30',
  },
  mythic: {
    label: 'Mythic',
    color: '#f472b6',
    text: 'text-pink-400',
    bgColor: 'bg-gradient-to-r from-pink-500/10 to-cyan-500/10',
    borderColor: 'border-pink-400/30',
    glowColor: 'shadow-pink-400/30',
  },
} as const;

export const GACHA_COSTS = {
  SINGLE: 100,
  TEN_PULL: 900,
};

export type Rarity = keyof typeof RARITY_CONFIG;
