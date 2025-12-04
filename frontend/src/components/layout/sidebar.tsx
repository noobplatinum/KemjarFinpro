'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/store';
import {
  Home,
  Sparkles,
  BookOpen,
  Library,
  Store,
  LogOut,
  User,
  Gem,
  Menu,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Summon', href: '/gacha', icon: Sparkles },
  { name: 'Collection', href: '/collection', icon: Library },
  { name: 'Catalog', href: '/catalog', icon: BookOpen },
  { name: 'Shop', href: '/shop', icon: Store },
  { name: 'Middleman', href: '/transfer', icon: Shield },
];

function NavContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useUserStore();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
          <Gem className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Crystal Gacha</h1>
          <p className="text-xs text-slate-400">Summon Your Destiny</p>
        </div>
      </div>

      <Separator className="bg-slate-800" />

      {/* User Info */}
      {user && (
        <div className="p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
            <Avatar className="h-10 w-10 border-2 border-violet-500/50">
              <AvatarFallback className="bg-violet-600 text-white">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-white">{user.username}</p>
              <div className="flex items-center gap-1 text-cyan-400">
                <Gem className="h-3 w-3" />
                <span className="text-sm font-semibold">{user.crystals.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-violet-600/20 text-violet-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className={cn('h-5 w-5', isActive && 'text-violet-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-slate-800" />

      {/* Footer */}
      <div className="p-3">
        {user ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-red-400"
            onClick={() => {
              logout();
              onNavigate?.();
            }}
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </Button>
        ) : (
          <Link href="/login" onClick={onNavigate}>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <User className="h-5 w-5" />
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-slate-800 bg-slate-950 lg:block">
      <NavContent />
    </aside>
  );
}

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { user } = useUserStore();

  return (
    <header className="fixed left-0 right-0 top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-950/80 px-4 backdrop-blur-lg lg:hidden">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-purple-600">
          <Gem className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-white">Crystal Gacha</span>
      </div>

      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-1 text-cyan-400">
            <Gem className="h-4 w-4" />
            <span className="text-sm font-semibold">{user.crystals.toLocaleString()}</span>
          </div>
        )}

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 border-slate-800 bg-slate-950 p-0">
            <NavContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}