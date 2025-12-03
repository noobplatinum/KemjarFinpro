'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SummoningCircleProps {
  isActive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function SummoningCircle({ isActive = false, size = 'lg' }: SummoningCircleProps) {
  const sizeClasses = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-80 h-80',
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
      {/* Outer glow */}
      <motion.div
        className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-600/20 to-purple-600/20 blur-3xl"
        animate={
          isActive
            ? {
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.6, 0.3],
              }
            : {
                scale: [1, 1.1, 1],
                opacity: [0.2, 0.3, 0.2],
              }
        }
        transition={{
          duration: isActive ? 0.5 : 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer ring */}
      <motion.div
        className="absolute inset-4 rounded-full border-2 border-dashed border-violet-500/30"
        animate={{ rotate: 360 }}
        transition={{
          duration: isActive ? 3 : 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Middle ring */}
      <motion.div
        className="absolute inset-12 rounded-full border-2 border-violet-500/50"
        animate={{ rotate: -360 }}
        transition={{
          duration: isActive ? 2 : 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        {/* Ring markers */}
        {[0, 60, 120, 180, 240, 300].map((deg) => (
          <div
            key={deg}
            className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400"
            style={{
              transform: `rotate(${deg}deg) translateY(-50%)`,
              transformOrigin: 'center calc(50% + 50px)',
              boxShadow: isActive ? '0 0 15px #22d3ee' : '0 0 10px #22d3ee',
            }}
          />
        ))}
      </motion.div>

      {/* Inner ring */}
      <motion.div
        className="absolute inset-20 rounded-full border border-purple-400/60"
        animate={{ rotate: 360 }}
        transition={{
          duration: isActive ? 1.5 : 15,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Center circle */}
      <motion.div
        className={cn(
          'absolute rounded-full bg-gradient-to-br from-violet-600 to-purple-600',
          size === 'lg' ? 'h-24 w-24' : size === 'md' ? 'h-16 w-16' : 'h-12 w-12'
        )}
        animate={
          isActive
            ? {
                scale: [1, 1.2, 1],
                boxShadow: [
                  '0 0 20px rgba(139, 92, 246, 0.5)',
                  '0 0 60px rgba(139, 92, 246, 0.8)',
                  '0 0 20px rgba(139, 92, 246, 0.5)',
                ],
              }
            : {}
        }
        transition={{
          duration: 0.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)',
        }}
      />

      {/* Rune symbols */}
      {isActive && (
        <>
          {[0, 72, 144, 216, 288].map((deg, i) => (
            <motion.div
              key={deg}
              className="absolute text-violet-400 text-2xl font-bold"
              style={{
                transform: `rotate(${deg}deg) translateY(-120px)`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{
                duration: 1,
                delay: i * 0.1,
                repeat: Infinity,
              }}
            >
              ✦
            </motion.div>
          ))}
        </>
      )}

      {/* Energy particles when active */}
      {isActive && (
        <div className="absolute inset-0">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-cyan-400"
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                x: (Math.random() - 0.5) * 200,
                y: (Math.random() - 0.5) * 200,
                opacity: 0,
              }}
              transition={{
                duration: 1,
                delay: i * 0.05,
                repeat: Infinity,
                repeatDelay: 0.5,
              }}
              style={{
                boxShadow: '0 0 10px #22d3ee',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
