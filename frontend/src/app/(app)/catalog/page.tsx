'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { api, Card } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, Grid3X3, LayoutGrid, Library } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { GameCard } from '@/components/game/creature';
import { CardDetailModal } from '@/components/game/card-modal';
import { RARITY_CONFIG } from '@/lib/constants';
import { Skeleton } from '@/components/ui/skeleton';

type Rarity = 'all' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
type SortBy = 'name' | 'rarity' | 'attack' | 'defense';

export default function CatalogPage() {
  const router = useRouter();
  const { user, inventory } = useUserStore();
  const [cards, setCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<Rarity>('all');
  const [sortBy, setSortBy] = useState<SortBy>('rarity');
  const [compactView, setCompactView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadCards = async () => {
      try {
        const allCards = await api.cards.getAll();
        setCards(allCards);
      } catch (error) {
        console.error('Failed to load cards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCards();
  }, [user, router]);

  if (!user) return null;

  const ownedCardIds = new Set(inventory.map((item) => item.card.id));
  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  const filteredAndSorted = cards
    .filter((card) => {
      const matchesSearch = card.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRarity =
        rarityFilter === 'all' || card.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'rarity':
          return (
            rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity)
          );
        case 'attack':
          return b.attack - a.attack;
        case 'defense':
          return b.defense - a.defense;
        default:
          return 0;
      }
    });

  const ownedCount = cards.filter((c) => ownedCardIds.has(c.id)).length;
  const completionPercent = cards.length > 0 ? Math.round((ownedCount / cards.length) * 100) : 0;

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Card Catalog</h1>
            <p className="mt-1 text-slate-400">
              Browse all available cards ({cards.length} total)
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2">
            <Library className="h-5 w-5 text-violet-400" />
            <span className="text-sm text-slate-400">Collection:</span>
            <span className="font-bold text-white">
              {ownedCount}/{cards.length}
            </span>
            <span className="text-sm text-violet-400">({completionPercent}%)</span>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.1 }}
          className="h-2 overflow-hidden rounded-full bg-slate-800"
          style={{ transformOrigin: 'left' }}
        >
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-wrap items-center gap-4 rounded-lg bg-slate-900/50 p-4"
        >
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700"
            />
          </div>

          <Select value={rarityFilter} onValueChange={(v) => setRarityFilter(v as Rarity)}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Rarity" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Rarities</SelectItem>
              {Object.keys(RARITY_CONFIG).map((rarity) => (
                <SelectItem key={rarity} value={rarity} className="capitalize">
                  {rarity}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortBy)}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700">
              <SortAsc className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="rarity">Rarity</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="attack">Attack</SelectItem>
              <SelectItem value="defense">Defense</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex gap-1">
            <Button
              variant={compactView ? 'ghost' : 'secondary'}
              size="icon"
              onClick={() => setCompactView(false)}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={compactView ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setCompactView(true)}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Rarity Quick Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2"
        >
          <Badge
            variant={rarityFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setRarityFilter('all')}
          >
            All
          </Badge>
          {Object.entries(RARITY_CONFIG).map(([rarity, config]) => {
            const count = cards.filter((c) => c.rarity === rarity).length;
            const owned = cards.filter(
              (c) => c.rarity === rarity && ownedCardIds.has(c.id)
            ).length;
            return (
              <Badge
                key={rarity}
                variant={rarityFilter === rarity ? 'default' : 'outline'}
                className="cursor-pointer capitalize"
                style={{
                  borderColor: config.color,
                  ...(rarityFilter === rarity && { backgroundColor: config.color }),
                }}
                onClick={() => setRarityFilter(rarity as Rarity)}
              >
                {rarity} ({owned}/{count})
              </Badge>
            );
          })}
        </motion.div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className={`grid gap-4 ${compactView ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] bg-slate-800" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <p className="text-xl text-slate-500">No cards match your filters.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={`grid gap-4 ${
              compactView
                ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8'
                : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
            }`}
          >
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map((card, index) => {
                const owned = ownedCardIds.has(card.id);
                return (
                  <motion.div
                    key={card.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ delay: index * 0.02 }}
                    className={`relative ${!owned ? 'opacity-50 grayscale' : ''}`}
                  >
                    <GameCard
                      card={card}
                      size={compactView ? 'sm' : 'md'}
                      onClick={() => setSelectedCard(card)}
                    />
                    {owned && (
                      <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs">
                        <Library className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        <CardDetailModal
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      </div>
    </div>
  );
}
