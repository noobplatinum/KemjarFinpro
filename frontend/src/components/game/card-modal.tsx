'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/lib/api';
import { RARITY_CONFIG, Rarity } from '@/lib/constants';
import { Creature } from './creature';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Swords, Shield, Zap, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CardDetailModalProps {
  card: Card | null;
  open: boolean;
  onClose: () => void;
}

export function CardDetailModal({ card, open, onClose }: CardDetailModalProps) {
  if (!card) return null;

  const config = RARITY_CONFIG[card.rarity as Rarity];
  const maxStat = 100;

  const stats = [
    { name: 'Attack', value: card.attack, icon: Swords, color: 'from-red-500 to-orange-500' },
    { name: 'Defense', value: card.defense, icon: Shield, color: 'from-blue-500 to-cyan-500' },
    { name: 'Speed', value: card.speed, icon: Zap, color: 'from-green-500 to-emerald-500' },
    { name: 'Magic', value: card.magic, icon: Sparkles, color: 'from-purple-500 to-pink-500' },
  ];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md border-slate-800 bg-slate-950 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div
          className="relative h-48 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${card.color_primary}40, ${card.color_secondary}40)`,
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              background: `radial-gradient(circle at center, ${card.color_glow}, transparent 70%)`,
            }}
          />
          
          <Creature card={card} size="lg" />
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 text-white/60 hover:text-white hover:bg-white/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Name and Rarity */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">{card.name}</h2>
            <span
              className={cn(
                'inline-block rounded-full px-3 py-1 text-sm font-medium uppercase tracking-wide',
                config.bgColor,
                config.text
              )}
            >
              {card.rarity}
            </span>
          </div>

          {/* Description */}
          <p className="text-center text-slate-400 italic">&quot;{card.description}&quot;</p>

          {/* Stats */}
          <div className="space-y-3">
            {stats.map((stat) => (
              <div key={stat.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-400">
                    <stat.icon className="h-4 w-4" />
                    {stat.name}
                  </div>
                  <span className="font-semibold text-white">{stat.value}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full bg-gradient-to-r ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${(stat.value / maxStat) * 100}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Drop Rate */}
          <div className="text-center text-sm text-slate-500">
            Drop Rate: {card.drop_rate}%
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface PullResultsModalProps {
  results: Card[];
  open: boolean;
  onClose: () => void;
}

export function PullResultsModal({ results, open, onClose }: PullResultsModalProps) {
  // Sort by rarity
  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];
  const sortedCards = [...results].sort(
    (a, b) => rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
  );

  const hasRare = results.some((c) =>
    ['rare', 'epic', 'legendary', 'mythic'].includes(c.rarity)
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Celebration particles */}
          {hasRare && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 50 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#ffd700', '#a855f7', '#3b82f6', '#22c55e'][i % 4],
                    left: `${Math.random() * 100}%`,
                  }}
                  initial={{ y: -20, opacity: 1 }}
                  animate={{
                    y: window.innerHeight + 20,
                    opacity: 0,
                    rotate: 360,
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    delay: i * 0.05,
                    ease: 'easeOut',
                  }}
                />
              ))}
            </div>
          )}

          <motion.div
            className="relative max-w-4xl w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <motion.h2
              className="text-center text-3xl font-bold text-amber-400 mb-8"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Summoning Complete!
            </motion.h2>

            {/* Cards Grid */}
            <div className="flex flex-wrap justify-center gap-4">
              {sortedCards.map((card, index) => (
                <motion.div
                  key={`${card.id}-${index}`}
                  initial={{ scale: 0, rotateY: 180 }}
                  animate={{ scale: 1, rotateY: 0 }}
                  transition={{
                    delay: index * 0.15,
                    type: 'spring',
                    stiffness: 200,
                  }}
                  className="relative"
                >
                  <div
                    className={cn(
                      'relative p-4 rounded-xl border bg-slate-900/80 backdrop-blur-sm',
                      RARITY_CONFIG[card.rarity as Rarity].borderColor
                    )}
                    style={{
                      boxShadow: `0 0 30px ${card.color_glow}40`,
                    }}
                  >
                    <Creature card={card} size="md" />
                    <div className="mt-2 text-center">
                      <p className="text-sm font-semibold text-white truncate max-w-[100px]">
                        {card.name}
                      </p>
                      <span
                        className={cn(
                          'text-xs font-medium uppercase',
                          RARITY_CONFIG[card.rarity as Rarity].text
                        )}
                      >
                        {card.rarity}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Continue button */}
            <motion.div
              className="mt-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: results.length * 0.15 + 0.3 }}
            >
              <Button
                onClick={onClose}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
