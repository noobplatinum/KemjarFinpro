'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/store';
import { api, User } from '@/lib/api';
import { Gem, User as UserIcon, Mail, Lock, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  // Load demo users for quick login
  useEffect(() => {
    const loadDemoUsers = async () => {
      try {
        const users = await api.users.getAll();
        setDemoUsers(users.slice(0, 3)); // First 3 users for demo
      } catch (error) {
        console.error('Failed to load demo users:', error);
      }
    };
    loadDemoUsers();
  }, []);

  // Login form state
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  // Register form state
  const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // For demo: find user by username
      const users = await api.users.getAll();
      const user = users.find((u) => u.username === loginData.username);

      if (!user) {
        toast.error('User not found');
        setIsLoading(false);
        return;
      }

      await login(user.id);
      toast.success(`Welcome back, ${user.username}!`);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Login failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = await api.users.create(registerData);
      await login(user.id);
      toast.success('Account created! Welcome to Crystal Gacha!');
      router.push('/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userId: number) => {
    setIsLoading(true);
    try {
      await login(userId);
      const user = await api.users.getById(userId);
      toast.success(`Logged in as ${user.username}`);
      router.push('/dashboard');
    } catch (error) {
      toast.error('Quick login failed');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950/50 via-slate-950 to-purple-950/50" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Back button */}
        <Link
          href="/"
          className="absolute left-4 top-4 flex items-center gap-2 text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-xl shadow-violet-500/30">
              <Gem className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">Crystal Gacha</h1>
          </div>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Welcome</CardTitle>
              <CardDescription className="text-slate-400">
                Sign in to start summoning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="mb-6 grid w-full grid-cols-2 bg-slate-800">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username" className="text-slate-300">
                        Username
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                          value={loginData.username}
                          onChange={(e) =>
                            setLoginData({ ...loginData, username: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password" className="text-slate-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                          id="password"
                          type="password"
                          placeholder="Enter your password"
                          className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({ ...loginData, password: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username" className="text-slate-300">
                        Username
                      </Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                          id="reg-username"
                          type="text"
                          placeholder="Choose a username"
                          className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                          value={registerData.username}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, username: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-slate-300">
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email"
                          className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                          value={registerData.email}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password" className="text-slate-300">
                        Password
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                        <Input
                          id="reg-password"
                          type="password"
                          placeholder="Create a password"
                          className="border-slate-700 bg-slate-800 pl-10 text-white placeholder:text-slate-500"
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, password: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Create Account'
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Quick login section */}
              <div className="mt-6 border-t border-slate-800 pt-6">
                <p className="mb-3 text-center text-sm text-slate-500">Demo Quick Login</p>
                <div className="grid grid-cols-3 gap-2">
                  {demoUsers.length > 0 ? (
                    demoUsers.map((user) => (
                      <Button
                        key={user.id}
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
                        onClick={() => handleQuickLogin(user.id)}
                        disabled={isLoading}
                      >
                        {user.username}
                      </Button>
                    ))
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800"
                        disabled
                      >
                        Loading...
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
