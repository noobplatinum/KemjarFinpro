'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { Gem, Sparkles, Library, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { user } = useUserStore();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-slate-950 to-purple-950/50" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-violet-500/20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-2xl shadow-violet-500/30">
            <Gem className="h-12 w-12 text-white" />
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 text-center text-5xl font-bold tracking-tight text-white md:text-6xl"
        >
          Crystal Gacha
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12 max-w-md text-center text-lg text-slate-400"
        >
          Summon mystical creatures, build your collection, and become the ultimate summoner
        </motion.p>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12 grid gap-6 md:grid-cols-3"
        >
          {[
            {
              icon: Sparkles,
              title: 'Summon',
              description: 'Pull from mystical banners',
            },
            {
              icon: Library,
              title: 'Collect',
              description: '20+ unique creatures',
            },
            {
              icon: Gem,
              title: 'Earn',
              description: 'Collect crystals daily',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm"
            >
              <feature.icon className="mb-3 h-8 w-8 text-violet-400" />
              <h3 className="mb-1 font-semibold text-white">{feature.title}</h3>
              <p className="text-sm text-slate-400">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row"
        >
          <Link href="/login">
            <Button
              size="lg"
              className="min-w-[200px] bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/catalog">
            <Button
              size="lg"
              variant="outline"
              className="min-w-[200px] border-slate-700 bg-transparent hover:bg-slate-800"
            >
              View Catalog
            </Button>
          </Link>
        </motion.div>

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-16 text-sm text-slate-600"
        >
          A penetration testing demo application
        </motion.p>
      </div>
    </div>
  );
}
