'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Shield,
    LogIn,
    LogOut,
    UserPlus,
    Key,
    ArrowLeftRight,
    Gem,
    Sparkles,
    AlertTriangle,
    Eye,
    EyeOff,
    Users,
    ScrollText,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { api, User, Middleman, MiddlemanLog, Card as CardType, InventoryItem } from '@/lib/api';

export default function TransferPage() {
    // Middleman auth state
    const [middleman, setMiddleman] = useState<Middleman | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Auth form states
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ username: '', email: '', password: '' });
    const [changePasswordData, setChangePasswordData] = useState({ userid: '', new_password: '' });
    const [resetRequestEmail, setResetRequestEmail] = useState('');
    const [resetData, setResetData] = useState({ token: '', new_password: '' });

    // Transfer state
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<MiddlemanLog[]>([]);
    const [fromUserId, setFromUserId] = useState<string>('');
    const [toUserId, setToUserId] = useState<string>('');
    const [transferType, setTransferType] = useState<'crystals' | 'cards'>('crystals');
    const [crystalAmount, setCrystalAmount] = useState<string>('');
    const [selectedCardId, setSelectedCardId] = useState<string>('');
    const [cardQuantity, setCardQuantity] = useState<string>('1');
    const [fromUserInventory, setFromUserInventory] = useState<InventoryItem[]>([]);

    // Check if middleman is logged in on mount
    useEffect(() => {
        checkMiddlemanSession();
    }, []);

    // Load users and logs when middleman is authenticated
    useEffect(() => {
        if (middleman) {
            loadUsers();
            loadLogs();
        }
    }, [middleman]);

    // Load sender's inventory when fromUserId changes
    useEffect(() => {
        if (fromUserId && middleman) {
            loadUserInventory(parseInt(fromUserId));
        } else {
            setFromUserInventory([]);
        }
    }, [fromUserId, middleman]);

    useEffect(() => {
        console.log('fromUserInventory state updated:', fromUserInventory);
    }, [fromUserInventory]);

    const checkMiddlemanSession = async () => {
        try {
            const profile = await api.middleman.getProfile();
            setMiddleman(profile);
        } catch {
            setMiddleman(null);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await api.middleman.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const loadLogs = async () => {
        try {
            const data = await api.middleman.getLogs();
            setLogs(data);
        } catch (error) {
            console.error('Failed to load logs:', error);
        }
    };

    const loadUserInventory = async (userId: number) => {
        try {
            const data = await api.middleman.getUserInventory(userId);
            setFromUserInventory(data);
            console.log(data);
        } catch (error) {
            console.error('Failed to load inventory:', error);
            setFromUserInventory([]);
        }
    };

    // Auth handlers
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await api.middleman.login(loginData);
            setMiddleman(result.middleman);
            toast.success('Logged in as middleman');
            setLoginData({ email: '', password: '' });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Login failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await api.middleman.register(registerData);
            toast.success('Middleman registered! You can now login.');
            setRegisterData({ username: '', email: '', password: '' });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await api.middleman.logout();
            setMiddleman(null);
            setUsers([]);
            setLogs([]);
            toast.success('Logged out');
        } catch (error) {
            toast.error('Logout failed');
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const payload: { userid?: number; new_password: string } = {
                new_password: changePasswordData.new_password,
            };
            if (changePasswordData.userid) {
                payload.userid = parseInt(changePasswordData.userid);
            }
            await api.middleman.changePassword(payload);
            toast.success('Password changed (IDOR vulnerability demonstrated!)');
            setChangePasswordData({ userid: '', new_password: '' });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to change password');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRequestReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const result = await api.middleman.requestReset(resetRequestEmail);
            if (result.token) {
                setResetData({ ...resetData, token: result.token });
                toast.success(`Predictable token received: ${result.token}`);
            } else {
                toast.info(result.message);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Reset request failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await api.middleman.resetPassword(resetData);
            toast.success('Password reset successfully');
            setResetData({ token: '', new_password: '' });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Reset failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Transfer handlers
    const handleCrystalTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromUserId || !toUserId || !crystalAmount) {
            toast.error('Please fill all fields');
            return;
        }
        setIsLoading(true);
        try {
            const result = await api.middleman.transferCrystals({
                fromUserId: parseInt(fromUserId),
                toUserId: parseInt(toUserId),
                amount: parseInt(crystalAmount),
            });
            toast.success(result.message);
            loadUsers();
            loadLogs();
            setCrystalAmount('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Transfer failed');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCardTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fromUserId || !toUserId || !selectedCardId) {
            toast.error('Please fill all fields');
            return;
        }
        setIsLoading(true);
        try {
            const result = await api.middleman.transferCards({
                fromUserId: parseInt(fromUserId),
                toUserId: parseInt(toUserId),
                cardId: parseInt(selectedCardId),
                quantity: parseInt(cardQuantity) || 1,
            });
            toast.success(result.message);
            loadUsers();
            loadLogs();
            loadUserInventory(parseInt(fromUserId));
            setSelectedCardId('');
            setCardQuantity('1');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Transfer failed');
        } finally {
            setIsLoading(false);
        }
    };

    // Guest view (not logged in as middleman)
    if (!middleman) {
        return (
            <div className="min-h-screen p-6">
                <div className="mx-auto max-w-4xl">
                    {/* Header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-red-600 to-orange-600">
                            <Shield className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-bold text-white">Middleman Portal</h1>
                        <p className="mt-2 text-slate-400">
                            Intentionally In(SECURE)
                        </p>
                    </div>

                    <Tabs defaultValue="login" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="login">Login</TabsTrigger>
                            <TabsTrigger value="register">Register</TabsTrigger>
                            <TabsTrigger value="reset-request">Request Reset</TabsTrigger>
                            <TabsTrigger value="reset">Reset Password</TabsTrigger>
                        </TabsList>

                        {/* Login Tab */}
                        <TabsContent value="login">
                            <Card className="border-slate-800 bg-slate-900/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <LogIn className="h-5 w-5" />
                                        Middleman Login
                                    </CardTitle>
                                    <CardDescription>
                                        Login to your approved middleman account
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleLogin} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="login-email">Email</Label>
                                            <Input
                                                id="login-email"
                                                type="email"
                                                value={loginData.email}
                                                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="login-password">Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="login-password"
                                                    type={showPassword ? 'text' : 'password'}
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    required
                                                    className="border-slate-700 bg-slate-800 pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                                >
                                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Logging in...' : 'Login'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Register Tab */}
                        <TabsContent value="register">
                            <Card className="border-slate-800 bg-slate-900/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <UserPlus className="h-5 w-5" />
                                        Register Middleman
                                    </CardTitle>
                                    <CardDescription>
                                        Make a new middleman account
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reg-username">Username</Label>
                                            <Input
                                                id="reg-username"
                                                value={registerData.username}
                                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reg-email">Email</Label>
                                            <Input
                                                id="reg-email"
                                                type="email"
                                                value={registerData.email}
                                                onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="reg-password">Password</Label>
                                            <Input
                                                id="reg-password"
                                                type="password"
                                                value={registerData.password}
                                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Registering...' : 'Register'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Request Reset Tab */}
                        <TabsContent value="reset-request">
                            <Card className="border-slate-800 bg-slate-900/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Request Password Reset
                                    </CardTitle>
                                    <CardDescription>
                                        Request a password reset token to reset a middleman password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleRequestReset} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-email">Email</Label>
                                            <Input
                                                id="reset-email"
                                                type="email"
                                                value={resetRequestEmail}
                                                onChange={(e) => setResetRequestEmail(e.target.value)}
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Requesting...' : 'Request Reset Link'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Reset Password Tab */}
                        <TabsContent value="reset">
                            <Card className="border-slate-800 bg-slate-900/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Key className="h-5 w-5" />
                                        Reset Password
                                    </CardTitle>
                                    <CardDescription>
                                        Use the reset token to set a new password
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleResetPassword} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reset-token">Reset Token</Label>
                                            <Input
                                                id="reset-token"
                                                value={resetData.token}
                                                onChange={(e) => setResetData({ ...resetData, token: e.target.value })}
                                                placeholder="e.g., MQ== (base64 of user ID)"
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-password">New Password</Label>
                                            <Input
                                                id="new-password"
                                                type="password"
                                                value={resetData.new_password}
                                                onChange={(e) => setResetData({ ...resetData, new_password: e.target.value })}
                                                required
                                                className="border-slate-700 bg-slate-800"
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={isLoading}>
                                            {isLoading ? 'Resetting...' : 'Reset Password'}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        );
    }

    // Authenticated middleman view
    return (
        <div className="min-h-screen p-6">
            <div className="mx-auto max-w-6xl">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-600 to-orange-600">
                            <Shield className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Middleman Dashboard</h1>
                            <p className="text-sm text-slate-400">
                                Logged in as: <span className="text-orange-400">{middleman.username}</span>
                            </p>
                        </div>
                    </div>
                    <Button variant="destructive" onClick={handleLogout} className="gap-2">
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Transfer Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Transfer Card */}
                        <Card className="border-slate-800 bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ArrowLeftRight className="h-5 w-5 text-orange-500" />
                                    Execute Transfer
                                </CardTitle>
                                <CardDescription>
                                    Transfer assets between users without their consent (Middleman Power)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* User Selection */}
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>From User</Label>
                                        <Select value={fromUserId} onValueChange={setFromUserId}>
                                            <SelectTrigger className="border-slate-700 bg-slate-800">
                                                <SelectValue placeholder="Select sender" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.map((user) => (
                                                    <SelectItem key={user.id} value={String(user.id)}>
                                                        {user.username} ({user.crystals} 💎)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>To User</Label>
                                        <Select value={toUserId} onValueChange={setToUserId}>
                                            <SelectTrigger className="border-slate-700 bg-slate-800">
                                                <SelectValue placeholder="Select receiver" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {users.filter(u => String(u.id) !== fromUserId).map((user) => (
                                                    <SelectItem key={user.id} value={String(user.id)}>
                                                        {user.username} ({user.crystals} 💎)
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator className="bg-slate-800" />

                                {/* Transfer Type Tabs */}
                                <Tabs value={transferType} onValueChange={(v) => setTransferType(v as 'crystals' | 'cards')}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="crystals" className="gap-2">
                                            <Gem className="h-4 w-4" />
                                            Crystals
                                        </TabsTrigger>
                                        <TabsTrigger value="cards" className="gap-2">
                                            <Sparkles className="h-4 w-4" />
                                            Cards
                                        </TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="crystals" className="mt-4">
                                        <form onSubmit={handleCrystalTransfer} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="crystal-amount">Amount</Label>
                                                <Input
                                                    id="crystal-amount"
                                                    type="number"
                                                    min="1"
                                                    value={crystalAmount}
                                                    onChange={(e) => setCrystalAmount(e.target.value)}
                                                    placeholder="Enter crystal amount"
                                                    className="border-slate-700 bg-slate-800"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full gap-2 bg-gradient-to-r from-cyan-600 to-blue-600"
                                                disabled={isLoading || !fromUserId || !toUserId}
                                            >
                                                <Gem className="h-4 w-4" />
                                                {isLoading ? 'Transferring...' : 'Transfer Crystals'}
                                            </Button>
                                        </form>
                                    </TabsContent>

                                    <TabsContent value="cards" className="mt-4">
                                        <form onSubmit={handleCardTransfer} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Select Card</Label>
                                                <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                                                    <SelectTrigger className="border-slate-700 bg-slate-800">
                                                        <SelectValue placeholder="Select a card from sender's inventory" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {fromUserInventory.length === 0 ? (
                                                            <SelectItem value="none" disabled>
                                                                {fromUserId ? 'No cards in inventory' : 'Select a sender first'}
                                                            </SelectItem>
                                                        ) : (
                                                            fromUserInventory
                                                                .filter((item) => item.card) // Filter out items without card data
                                                                .map((item) => (
                                                                    <SelectItem key={item.card_id} value={String(item.card_id)}>
                                                                        {item.card.name} ({item.card.rarity}) - Qty: {item.quantity}
                                                                    </SelectItem>
                                                                ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="card-quantity">Quantity</Label>
                                                <Input
                                                    id="card-quantity"
                                                    type="number"
                                                    min="1"
                                                    value={cardQuantity}
                                                    onChange={(e) => setCardQuantity(e.target.value)}
                                                    className="border-slate-700 bg-slate-800"
                                                />
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full gap-2 bg-linear-to-r from-purple-600 to-pink-600"
                                                disabled={isLoading || !fromUserId || !toUserId || !selectedCardId}
                                            >
                                                <Sparkles className="h-4 w-4" />
                                                {isLoading ? 'Transferring...' : 'Transfer Card'}
                                            </Button>
                                        </form>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Transfer Logs */}
                        <Card className="border-slate-800 bg-slate-900/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <ScrollText className="h-5 w-5 text-slate-400" />
                                        Transfer Logs
                                    </CardTitle>
                                    <CardDescription>Recent middleman actions</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={loadLogs}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[300px]">
                                    {logs.length === 0 ? (
                                        <p className="text-center text-slate-500">No transfer logs yet</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {logs.map((log) => (
                                                <div
                                                    key={log.id}
                                                    className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 p-3"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {log.transfer_type === 'crystals' ? (
                                                            <Gem className="h-5 w-5 text-cyan-400" />
                                                        ) : (
                                                            <Sparkles className="h-5 w-5 text-purple-400" />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium text-white">
                                                                {log.from_username} → {log.to_username}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {log.transfer_type === 'crystals'
                                                                    ? `${log.amount} crystals`
                                                                    : `${log.quantity}x ${log.card_name}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <Badge variant="outline" className="text-xs">
                                                            by {log.middleman_name}
                                                        </Badge>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {new Date(log.created_at).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column - Profile & Change Password */}
                    <div className="space-y-6">
                        {/* Profile Card */}
                        <Card className="border-slate-800 bg-slate-900/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-orange-500" />
                                    Middleman Profile
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-xs text-slate-500">Username</p>
                                    <p className="font-medium text-white">{middleman.username}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Email</p>
                                    <p className="font-medium text-white">{middleman.email}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">ID</p>
                                    <p className="font-medium text-orange-400">{middleman.id}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500">Member Since</p>
                                    <p className="font-medium text-white">
                                        {new Date(middleman.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Change Password Card (IDOR Vulnerability) */}
                        <Card className="border-red-500/30 bg-red-950/10">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle className="h-5 w-5" />
                                    Change Password (IDOR!)
                                </CardTitle>
                                <CardDescription className="text-red-300/70">
                                    Vulnerability: Can change ANY middleman&apos;s password by providing their ID
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleChangePassword} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="target-userid">
                                            Target User ID{' '}
                                            <span className="text-xs text-slate-500">(leave empty for self)</span>
                                        </Label>
                                        <Input
                                            id="target-userid"
                                            type="number"
                                            value={changePasswordData.userid}
                                            onChange={(e) =>
                                                setChangePasswordData({ ...changePasswordData, userid: e.target.value })
                                            }
                                            placeholder="e.g., 1, 2, 3..."
                                            className="border-red-900/50 bg-slate-800"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="change-new-password">New Password</Label>
                                        <Input
                                            id="change-new-password"
                                            type="password"
                                            value={changePasswordData.new_password}
                                            onChange={(e) =>
                                                setChangePasswordData({ ...changePasswordData, new_password: e.target.value })
                                            }
                                            required
                                            className="border-red-900/50 bg-slate-800"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="w-full"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Changing...' : 'Change Password'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* User List */}
                        <Card className="border-slate-800 bg-slate-900/50">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg">All Users</CardTitle>
                                    <CardDescription>Available for transfers</CardDescription>
                                </div>
                                <Button variant="ghost" size="icon" onClick={loadUsers}>
                                    <RefreshCw className="h-4 w-4" />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <ScrollArea className="h-[200px]">
                                    <div className="space-y-2">
                                        {users.map((user) => (
                                            <div
                                                key={user.id}
                                                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-800/30 px-3 py-2"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-white">{user.username}</p>
                                                    <p className="text-xs text-slate-500">ID: {user.id}</p>
                                                </div>
                                                <div className="flex items-center gap-1 text-cyan-400">
                                                    <Gem className="h-3 w-3" />
                                                    <span className="text-sm font-semibold">{user.crystals}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
