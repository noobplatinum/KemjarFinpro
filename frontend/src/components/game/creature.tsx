'use client';

import { motion } from 'framer-motion';
import { Card } from '@/lib/api';
import { RARITY_CONFIG, Rarity } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface CreatureProps {
  card: Card;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export function Creature({ card, size = 'md', animate = true }: CreatureProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  const eyeSize = {
    sm: 'w-2 h-3',
    md: 'w-3 h-4',
    lg: 'w-4 h-5',
  };

  const pupilSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const shapeClasses = {
    blob: 'rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%]',
    slime: 'rounded-[50%_50%_50%_50%_/_70%_70%_30%_30%]',
    spirit: 'rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] opacity-90',
    stickman: 'rounded-full',
  };

  const animations = {
    blob: {
      scale: [1, 1.05, 1],
      borderRadius: [
        '50% 50% 50% 50% / 60% 60% 40% 40%',
        '60% 40% 50% 50% / 50% 60% 40% 50%',
        '50% 50% 50% 50% / 60% 60% 40% 40%',
      ],
    },
    slime: {
      scaleY: [1, 0.9, 1],
      scaleX: [1, 1.1, 1],
    },
    spirit: {
      y: [0, -8, 0],
      opacity: [0.9, 1, 0.9],
    },
    stickman: {
      rotate: [-3, 3, -3],
    },
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Glow effect */}
      <div
        className={cn('absolute blur-xl opacity-50', sizeClasses[size])}
        style={{ backgroundColor: card.color_glow }}
      />

      {/* Creature body */}
      <motion.div
        className={cn(
          'relative flex items-center justify-center',
          sizeClasses[size],
          shapeClasses[card.shape]
        )}
        style={{
          background: `linear-gradient(135deg, ${card.color_primary}, ${card.color_secondary})`,
          boxShadow: `0 0 30px ${card.color_glow}40`,
        }}
        animate={animate ? animations[card.shape] : undefined}
        transition={{
          duration: card.shape === 'spirit' ? 3 : 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Eyes */}
        {card.shape !== 'stickman' && (
          <div className="flex gap-3">
            {[0, 1].map((i) => (
              <motion.div
                key={i}
                className={cn('rounded-full bg-white', eyeSize[size])}
                animate={{ scaleY: [1, 0.1, 1] }}
                transition={{
                  duration: 0.2,
                  repeat: Infinity,
                  repeatDelay: 3 + Math.random() * 2,
                }}
              >
                <div
                  className={cn(
                    'absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900',
                    pupilSize[size]
                  )}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Stickman face */}
        {card.shape === 'stickman' && (
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2">
              <div className={cn('rounded-full bg-white', pupilSize[size])} />
              <div className={cn('rounded-full bg-white', pupilSize[size])} />
            </div>
            <div
              className={cn(
                'rounded-full bg-white/80',
                size === 'sm' ? 'h-0.5 w-2' : size === 'md' ? 'h-0.5 w-3' : 'h-1 w-4'
              )}
            />
          </div>
        )}
      </motion.div>

      {/* Spirit tail */}
      {card.shape === 'spirit' && (
        <motion.div
          className="absolute -bottom-2 h-4 w-8 opacity-60"
          style={{
            background: `linear-gradient(to bottom, ${card.color_primary}, transparent)`,
            borderRadius: '0 0 50% 50%',
          }}
          animate={{ scaleY: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </div>
  );
}

interface GameCardProps {
  card: Card;
  quantity?: number;
  showDetails?: boolean;
  onClick?: () => void;
  isNew?: boolean;
  size?: 'sm' | 'md';
}

export function GameCard({
  card,
  quantity,
  showDetails = true,
  onClick,
  isNew,
  size = 'md',
}: GameCardProps) {
  const config = RARITY_CONFIG[card.rarity as Rarity];

  return (
    <motion.div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-xl border bg-slate-900/50 backdrop-blur-sm transition-all hover:scale-105',
        config.borderColor,
        size === 'sm' ? 'p-3' : 'p-4'
      )}
      onClick={onClick}
      whileHover={{ y: -4 }}
      style={{
        boxShadow: `0 4px 20px ${card.color_glow}20`,
      }}
    >
      {/* Rarity glow */}
      <div
        className="absolute inset-0 opacity-10 transition-opacity group-hover:opacity-20"
        style={{
          background: `radial-gradient(circle at center, ${card.color_glow}, transparent 70%)`,
        }}
      />

      {/* New badge */}
      {isNew && (
        <div className="absolute right-2 top-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-black">
          NEW
        </div>
      )}

      {/* Quantity badge */}
      {quantity && quantity > 1 && (
        <div className="absolute left-2 top-2 rounded bg-slate-800 px-1.5 py-0.5 text-xs font-bold text-white">
          x{quantity}
        </div>
      )}

      {/* Creature */}
      <div className={cn('flex items-center justify-center', size === 'sm' ? 'py-2' : 'py-4')}>
        <Creature card={card} size={size === 'sm' ? 'sm' : 'md'} />
      </div>

      {/* Info */}
      {showDetails && (
        <div className="mt-2 space-y-1 border-t border-slate-800 pt-2 text-center">
          <p className="truncate text-sm font-semibold text-white">{card.name}</p>
          <span
            className={cn(
              'inline-block rounded px-2 py-0.5 text-xs font-medium uppercase tracking-wide',
              config.bgColor,
              config.text
            )}
          >
            {card.rarity}
          </span>
        </div>
      )}
    </motion.div>
  );
}
