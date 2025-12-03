'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { api, Card } from '@/lib/api';
import { motion } from 'framer-motion';
import { Gem, Sparkles, Library, TrendingUp, Clock } from 'lucide-react';
import { Card as UICard, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GameCard } from '@/components/game/creature';
import { CardDetailModal } from '@/components/game/card-modal';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const { user, inventory, refreshUser, refreshInventory } = useUserStore();
  const [recentPulls, setRecentPulls] = useState<{ name: string; rarity: string; created_at: string }[]>([]);
  const [featuredCards, setFeaturedCards] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        await refreshUser();
        await refreshInventory();

        const [history, cards] = await Promise.all([
          api.gacha.getHistory(user.id, 5),
          api.cards.getAll(),
        ]);

        setRecentPulls(history);
        // Get some rare+ cards for featured section
        const featured = cards
          .filter((c) => ['epic', 'legendary', 'mythic'].includes(c.rarity))
          .slice(0, 4);
        setFeaturedCards(featured);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, router, refreshUser, refreshInventory]);

  if (!user) return null;

  const stats = [
    {
      title: 'Crystals',
      value: user.crystals.toLocaleString(),
      icon: Gem,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
    },
    {
      title: 'Total Cards',
      value: inventory.reduce((sum, item) => sum + item.quantity, 0).toString(),
      icon: Library,
      color: 'text-violet-400',
      bgColor: 'bg-violet-400/10',
    },
    {
      title: 'Unique Cards',
      value: inventory.length.toString(),
      icon: Sparkles,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
    },
    {
      title: 'VIP Level',
      value: user.vip_level.toString(),
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white">
            Welcome back, <span className="text-violet-400">{user.username}</span>
          </h1>
          <p className="mt-1 text-slate-400">Ready to summon some new creatures?</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <UICard key={stat.title} className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm text-slate-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
              </CardContent>
            </UICard>
          ))}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <Link href="/gacha">
            <UICard className="group cursor-pointer border-slate-800 bg-gradient-to-br from-violet-600/10 to-purple-600/10 transition-all hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/20">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-violet-600 p-3">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Summon Now</h3>
                  <p className="text-sm text-slate-400">Try your luck!</p>
                </div>
              </CardContent>
            </UICard>
          </Link>

          <Link href="/shop">
            <UICard className="group cursor-pointer border-slate-800 bg-gradient-to-br from-cyan-600/10 to-blue-600/10 transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/20">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-cyan-600 p-3">
                  <Gem className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Get Crystals</h3>
                  <p className="text-sm text-slate-400">Top up your balance</p>
                </div>
              </CardContent>
            </UICard>
          </Link>

          <Link href="/collection">
            <UICard className="group cursor-pointer border-slate-800 bg-gradient-to-br from-amber-600/10 to-orange-600/10 transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="rounded-lg bg-amber-600 p-3">
                  <Library className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">My Collection</h3>
                  <p className="text-sm text-slate-400">View your cards</p>
                </div>
              </CardContent>
            </UICard>
          </Link>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Pulls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <UICard className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="h-5 w-5 text-slate-400" />
                  Recent Pulls
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full bg-slate-800" />
                    ))}
                  </div>
                ) : recentPulls.length === 0 ? (
                  <p className="text-center text-slate-500 py-8">
                    No pulls yet. Start summoning!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recentPulls.map((pull, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-slate-800/50 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-2 w-2 rounded-full ${
                              pull.rarity === 'mythic'
                                ? 'bg-pink-400'
                                : pull.rarity === 'legendary'
                                ? 'bg-amber-400'
                                : pull.rarity === 'epic'
                                ? 'bg-purple-400'
                                : pull.rarity === 'rare'
                                ? 'bg-blue-400'
                                : pull.rarity === 'uncommon'
                                ? 'bg-emerald-400'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className="text-sm text-white">{pull.name}</span>
                        </div>
                        <span className="text-xs text-slate-500 capitalize">{pull.rarity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </UICard>
          </motion.div>

          {/* Featured Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <UICard className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  Featured Cards
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="aspect-[3/4] bg-slate-800" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {featuredCards.map((card) => (
                      <GameCard
                        key={card.id}
                        card={card}
                        size="sm"
                        onClick={() => setSelectedCard(card)}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </UICard>
          </motion.div>
        </div>

        <CardDetailModal
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      </div>
    </div>
  );
}
