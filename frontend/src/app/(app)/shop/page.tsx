'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { api, Package } from '@/lib/api';
import { motion } from 'framer-motion';
import { Gem, Sparkles, Star, Crown, Zap, Check, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function ShopPage() {
  const router = useRouter();
  const { user, refreshUser } = useUserStore();
  const [packages, setPackages] = useState<Package[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [successPurchase, setSuccessPurchase] = useState<{ pkg: Package; oldBalance: number } | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [pkgs, txns] = await Promise.all([
          api.shop.getPackages(),
          api.shop.getTransactions(user.id),
        ]);
        setPackages(pkgs);
        setTransactions(txns);
      } catch (error) {
        console.error('Failed to load shop data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user, router]);

  const handlePurchase = async (pkg: Package) => {
    if (!user) return;

    setPurchasing(pkg.id);
    const oldBalance = user.crystals;

    try {
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      await api.shop.purchase(user.id, pkg.id);
      await refreshUser();

      setSuccessPurchase({ pkg, oldBalance });

      // Refresh transactions
      const txns = await api.shop.getTransactions(user.id);
      setTransactions(txns);
    } catch (error) {
      console.error('Purchase failed:', error);
      toast.error('Purchase failed!', {
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setPurchasing(null);
    }
  };

  if (!user) return null;

  const getPackageIcon = (index: number) => {
    const icons = [Gem, Sparkles, Star, Crown, Zap];
    const Icon = icons[index % icons.length];
    return Icon;
  };

  const getPackageGradient = (index: number) => {
    const gradients = [
      'from-cyan-600/20 to-blue-600/20',
      'from-violet-600/20 to-purple-600/20',
      'from-amber-600/20 to-orange-600/20',
      'from-emerald-600/20 to-teal-600/20',
      'from-pink-600/20 to-rose-600/20',
    ];
    return gradients[index % gradients.length];
  };

  const getPackageBorder = (index: number) => {
    const borders = [
      'border-cyan-500/30 hover:border-cyan-500',
      'border-violet-500/30 hover:border-violet-500',
      'border-amber-500/30 hover:border-amber-500',
      'border-emerald-500/30 hover:border-emerald-500',
      'border-pink-500/30 hover:border-pink-500',
    ];
    return borders[index % borders.length];
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Crystal Shop</h1>
            <p className="mt-1 text-slate-400">Top up your crystals to summon more creatures</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/50 px-4 py-2">
              <Gem className="h-5 w-5 text-cyan-400" />
              <span className="font-bold text-white">{user.crystals.toLocaleString()}</span>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowHistory(true)}
              className="border-slate-700"
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Button>
          </div>
        </motion.div>

        {/* VIP Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-amber-500/30 bg-gradient-to-r from-amber-600/10 to-orange-600/10">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="rounded-lg bg-amber-600 p-3">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white">VIP Level {user.vip_level}</h3>
                <p className="text-sm text-slate-400">
                  Spend more to unlock exclusive rewards and bonuses
                </p>
              </div>
              <Badge variant="outline" className="border-amber-500 text-amber-400">
                {user.vip_level === 0 && 'Bronze'}
                {user.vip_level === 1 && 'Silver'}
                {user.vip_level === 2 && 'Gold'}
                {user.vip_level >= 3 && 'Diamond'}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>

        {/* Packages Grid */}
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-80 bg-slate-800" />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
          >
            {packages.map((pkg, index) => {
              const Icon = getPackageIcon(index);
              const isPopular = index === 2;
              const isBest = index === packages.length - 1;

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                >
                  <Card
                    className={`relative overflow-hidden bg-gradient-to-b ${getPackageGradient(index)} ${getPackageBorder(index)} transition-all hover:shadow-lg`}
                  >
                    {isPopular && (
                      <div className="absolute -right-8 top-4 rotate-45 bg-amber-500 px-10 py-1 text-xs font-bold text-black">
                        POPULAR
                      </div>
                    )}
                    {isBest && (
                      <div className="absolute -right-8 top-4 rotate-45 bg-gradient-to-r from-violet-500 to-purple-500 px-10 py-1 text-xs font-bold text-white">
                        BEST VALUE
                      </div>
                    )}

                    <CardHeader className="text-center">
                      <div className="mx-auto mb-2 rounded-full bg-slate-800 p-4">
                        <Icon className="h-8 w-8 text-cyan-400" />
                      </div>
                      <CardTitle className="text-xl text-white">{pkg.name}</CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Gem className="h-6 w-6 text-cyan-400" />
                        <span className="text-3xl font-bold text-white">
                          {pkg.crystals.toLocaleString()}
                        </span>
                      </div>

                      {pkg.bonus && pkg.bonus > 0 && (
                        <Badge className="bg-emerald-600">
                          +{pkg.bonus.toLocaleString()} Bonus!
                        </Badge>
                      )}

                      <div className="text-2xl font-bold text-white">
                        {formatPrice(pkg.price)}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing !== null}
                      >
                        {purchasing === pkg.id ? (
                          <span className="animate-pulse">Processing...</span>
                        ) : (
                          'Purchase'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid gap-4 sm:grid-cols-3"
        >
          {[
            { title: 'Instant Delivery', desc: 'Crystals added immediately' },
            { title: 'Secure Payment', desc: 'Safe and encrypted transactions' },
            { title: '24/7 Support', desc: 'Help whenever you need it' },
          ].map((feature) => (
            <Card key={feature.title} className="border-slate-800 bg-slate-900/50">
              <CardContent className="flex items-center gap-3 p-4">
                <Check className="h-5 w-5 text-emerald-400" />
                <div>
                  <p className="font-medium text-white">{feature.title}</p>
                  <p className="text-sm text-slate-500">{feature.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Purchase History Dialog */}
        <Dialog open={showHistory} onOpenChange={setShowHistory}>
          <DialogContent className="border-slate-800 bg-slate-900 text-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Purchase History</DialogTitle>
              <DialogDescription className="text-slate-400">
                Your recent crystal purchases
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <p className="text-center py-8 text-slate-500">No purchases yet</p>
              ) : (
                transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-lg bg-slate-800/50 p-4"
                  >
                    <div>
                      <p className="font-medium text-white">{tx.description}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-cyan-400">
                        <Gem className="h-4 w-4" />
                        <span>{tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-500 capitalize">
                        {tx.type}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Success Purchase Dialog */}
        <Dialog open={!!successPurchase} onOpenChange={() => setSuccessPurchase(null)}>
          <DialogContent className="border-slate-800 bg-slate-900 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-600"
            >
              <Check className="h-10 w-10 text-white" />
            </motion.div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-2xl">Purchase Successful!</DialogTitle>
              <DialogDescription className="text-slate-400">
                Your crystals have been added to your account
              </DialogDescription>
            </DialogHeader>
            {successPurchase && (
              <div className="space-y-4 py-4">
                <div className="text-lg text-white">{successPurchase.pkg.name}</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-slate-400">{successPurchase.oldBalance.toLocaleString()}</span>
                  <span className="text-slate-500">→</span>
                  <span className="flex items-center gap-1 text-xl font-bold text-cyan-400">
                    <Gem className="h-5 w-5" />
                    {user.crystals.toLocaleString()}
                  </span>
                </div>
                <div className="text-emerald-400">
                  +{(successPurchase.pkg.crystals + (successPurchase.pkg.bonus || 0)).toLocaleString()} Crystals
                </div>
              </div>
            )}
            <Button onClick={() => setSuccessPurchase(null)} className="w-full">
              Awesome!
            </Button>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
