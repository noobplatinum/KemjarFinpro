'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, useGachaStore } from '@/lib/store';
import { api, Card, PullResult } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Gem, Sparkles, Info, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { SummoningCircle } from '@/components/game/summoning-circle';
import { PullResultsModal } from '@/components/game/card-modal';
import { GACHA_COSTS, RARITY_CONFIG } from '@/lib/constants';
import { toast } from 'sonner';

export default function GachaPage() {
  const router = useRouter();
  const { user, refreshUser, refreshInventory } = useUserStore();
  const { isAnimating, setAnimating, pullResults, setPullResults, clearPullResults } = useGachaStore();
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handlePull = useCallback(async (count: 1 | 10) => {
    if (!user) return;

    const cost = count === 1 ? GACHA_COSTS.SINGLE : GACHA_COSTS.TEN_PULL;
    if (user.crystals < cost) {
      toast.error('Not enough crystals!', {
        description: `You need ${cost} crystals for this pull.`,
      });
      return;
    }

    setAnimating(true);
    
    try {
      const response = await api.gacha.pull(user.id, count);
      
      // Simulate animation time
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      // Handle both single and multi-pull responses
      const cards = response.pulls 
        ? response.pulls 
        : response.pull?.card 
          ? [response.pull.card] 
          : [];
      
      setPullResults(cards);
      setShowResults(true);
      await refreshUser();
      await refreshInventory();
    } catch (error) {
      console.error('Pull failed:', error);
      toast.error('Summoning failed!', {
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setAnimating(false);
    }
  }, [user, refreshUser, refreshInventory, setAnimating, setPullResults]);

  const handleCloseResults = () => {
    setShowResults(false);
    clearPullResults();
  };

  if (!user) return null;

  const canPullSingle = user.crystals >= GACHA_COSTS.SINGLE;
  const canPullTen = user.crystals >= GACHA_COSTS.TEN_PULL;

  return (
    <div className="flex min-h-full flex-col items-center justify-center p-6 lg:p-8">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white">Mystic Summoning</h1>
          <p className="mt-2 text-slate-400">Channel your crystals to summon powerful creatures</p>
        </motion.div>

        {/* Crystal Balance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full bg-slate-800/80 px-6 py-3 backdrop-blur-sm">
            <Gem className="h-6 w-6 text-cyan-400" />
            <span className="text-2xl font-bold text-white">{user.crystals.toLocaleString()}</span>
            <span className="text-slate-400">Crystals</span>
          </div>
        </motion.div>

        {/* Summoning Circle */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <SummoningCircle isActive={isAnimating} size="lg" />
        </motion.div>

        {/* Pull Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            onClick={() => handlePull(1)}
            disabled={isAnimating || !canPullSingle}
            className="w-48 bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Summon x1
            <span className="ml-2 flex items-center text-sm text-violet-200">
              <Gem className="mr-1 h-3 w-3" />
              {GACHA_COSTS.SINGLE}
            </span>
          </Button>

          <Button
            size="lg"
            onClick={() => handlePull(10)}
            disabled={isAnimating || !canPullTen}
            className="w-48 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 disabled:opacity-50"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Summon x10
            <span className="ml-2 flex items-center text-sm text-purple-200">
              <Gem className="mr-1 h-3 w-3" />
              {GACHA_COSTS.TEN_PULL}
            </span>
          </Button>
        </motion.div>

        {/* Rates Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" className="text-slate-400 hover:text-white">
                <Info className="mr-2 h-4 w-4" />
                View Rates
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="border-slate-800 bg-slate-900 text-white">
              <DialogHeader>
                <DialogTitle>Summoning Rates</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Each summoning has the following drop rates:
                </p>
                <div className="space-y-2">
                  {Object.entries(RARITY_CONFIG).map(([rarity, config]) => (
                    <div
                      key={rarity}
                      className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: config.color }}
                        />
                        <span className="capitalize">{rarity}</span>
                      </div>
                      <span className={config.text}>
                        {rarity === 'common' && '50%'}
                        {rarity === 'uncommon' && '30%'}
                        {rarity === 'rare' && '12%'}
                        {rarity === 'epic' && '5%'}
                        {rarity === 'legendary' && '2.5%'}
                        {rarity === 'mythic' && '0.5%'}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Note: 10-pull guarantees at least one Rare or higher.
                </p>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Animation Status */}
        <AnimatePresence>
          {isAnimating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
            >
              <p className="animate-pulse text-lg text-violet-400">
                Channeling mystical energies...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Results Modal */}
      <PullResultsModal
        results={pullResults}
        open={showResults}
        onClose={handleCloseResults}
      />
    </div>
  );
}
