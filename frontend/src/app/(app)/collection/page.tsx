'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Card } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, SortAsc, Grid3X3, LayoutGrid } from 'lucide-react';
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
type SortBy = 'name' | 'rarity' | 'quantity' | 'newest';

export default function CollectionPage() {
  const router = useRouter();
  const { user, inventory, refreshInventory } = useUserStore();
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

    const loadInventory = async () => {
      try {
        await refreshInventory();
      } finally {
        setIsLoading(false);
      }
    };

    loadInventory();
  }, [user, router, refreshInventory]);

  if (!user) return null;

  const rarityOrder = ['mythic', 'legendary', 'epic', 'rare', 'uncommon', 'common'];

  const filteredAndSorted = inventory
    .filter((item) => {
      const matchesSearch = item.card.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesRarity =
        rarityFilter === 'all' || item.card.rarity === rarityFilter;
      return matchesSearch && matchesRarity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.card.name.localeCompare(b.card.name);
        case 'rarity':
          return (
            rarityOrder.indexOf(a.card.rarity) -
            rarityOrder.indexOf(b.card.rarity)
          );
        case 'quantity':
          return b.quantity - a.quantity;
        case 'newest':
          return (
            new Date(b.obtained_at).getTime() -
            new Date(a.obtained_at).getTime()
          );
        default:
          return 0;
      }
    });

  const totalCards = inventory.reduce((sum, item) => sum + item.quantity, 0);

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
            <h1 className="text-3xl font-bold text-white">My Collection</h1>
            <p className="mt-1 text-slate-400">
              {inventory.length} unique cards / {totalCards} total
            </p>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
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
              <SelectItem value="quantity">Quantity</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
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
            const count = inventory.filter((i) => i.card.rarity === rarity).length;
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
                {rarity} ({count})
              </Badge>
            );
          })}
        </motion.div>

        {/* Cards Grid */}
        {isLoading ? (
          <div className={`grid gap-4 ${compactView ? 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-8' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'}`}>
            {[...Array(10)].map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] bg-slate-800" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <p className="text-xl text-slate-500">
              {inventory.length === 0
                ? 'No cards yet. Start summoning!'
                : 'No cards match your filters.'}
            </p>
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
              {filteredAndSorted.map((item, index) => (
                <motion.div
                  key={item.card.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.02 }}
                  className="relative"
                >
                  <GameCard
                    card={item.card}
                    size={compactView ? 'sm' : 'md'}
                    onClick={() => setSelectedCard(item.card)}
                  />
                  {item.quantity > 1 && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                      x{item.quantity}
                    </div>
                  )}
                </motion.div>
              ))}
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
