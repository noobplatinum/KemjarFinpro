const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// CSRF Token cache
let csrfToken: string | null = null;

// Ambil CSRF token dari backend
async function fetchCsrfToken(): Promise<string> {
  if (csrfToken) return csrfToken;
  
  const response = await fetch(`${API_URL}/transfer/csrf-token`, {
    credentials: 'include',
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token');
  }
  
  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken ?? '';
}

// Clear cached CSRF token (call after logout or on error)
export function clearCsrfToken() {
  csrfToken = null;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  // Add CSRF token for POST/PUT/DELETE requests to /transfer endpoints
  if (endpoint.startsWith('/transfer') && options.method && ['POST', 'PUT', 'DELETE'].includes(options.method)) {
    try {
      const token = await fetchCsrfToken();
      headers['X-CSRF-Token'] = token;
    } catch (error) {
      console.warn('Could not fetch CSRF token:', error);
    }
  }

  const response = await fetch(url, { 
    ...options,
    headers,
  });
  const data = await response.json();

  if (!response.ok) {
    // If CSRF token is invalid, clear cache and let caller retry
    if (data.code === 'EBADCSRFTOKEN' || response.status === 403) {
      clearCsrfToken();
    }
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  crystals: number;
  vip_level: number;
  created_at: string;
}

export interface Card {
  id: number;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
  attack: number;
  defense: number;
  speed: number;
  magic: number;
  color_primary: string;
  color_secondary: string;
  color_glow: string;
  shape: 'blob' | 'stickman' | 'slime' | 'spirit';
  drop_rate: number;
}

export interface InventoryItem {
  card: Card;
  card_id: number;
  quantity: number;
  is_favorite: boolean;
  obtained_at: string;
}

export interface Package {
  id: string;
  name: string;
  crystals: number;
  bonus?: number;
  price: number;
}

export interface PullResult {
  success: boolean;
  pull?: {
    card: Card;
    isNew: boolean;
    crystalsSpent: number;
    remainingCrystals: number;
  };
  pulls?: Card[];
  summary?: {
    total: number;
    crystalsSpent: number;
    remainingCrystals: number;
    byRarity: Record<string, number>;
  };
}

export interface Transaction {
  id: number;
  type: string;
  amount: number;
  description: string;
  reference_id?: string;
  created_at: string;
}

// Middleman types (for pentest training feature)
export interface Middleman {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface TransferResult {
  success: boolean;
  message: string;
  transfer: {
    from: { id: number; username: string };
    to: { id: number; username: string };
    amount?: number;
    card?: { id: number; name: string };
    quantity?: number;
    executedBy: string;
  };
}

export interface MiddlemanLog {
  id: number;
  middleman_id: number;
  middleman_name: string;
  action_type: string;
  from_user_id: number;
  from_username: string;
  to_user_id: number;
  to_username: string;
  transfer_type: 'crystals' | 'card';
  amount?: number;
  card_id?: number;
  card_name?: string;
  quantity?: number;
  created_at: string;
}

// API Functions
export const api = {
  users: {
    getAll: () => request<User[]>('/users'),
    getById: (id: number) => request<User>(`/users/${id}`),
    create: (data: { username: string; email: string; password: string }) =>
      request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: Partial<User>) =>
      request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request<{ message: string }>(`/users/${id}`, { method: 'DELETE' }),
    getInventory: async (userId: number): Promise<InventoryItem[]> => {
      const rawData = await request<any[]>(`/users/${userId}/inventory`);
      // Transform flat structure to nested card object
      return rawData.map((item) => ({
        card: {
          id: item.card_id,
          name: item.name,
          description: item.description,
          rarity: item.rarity,
          attack: item.attack,
          defense: item.defense,
          speed: item.speed,
          magic: item.magic,
          color_primary: item.color_primary,
          color_secondary: item.color_secondary,
          color_glow: item.color_glow,
          shape: item.shape,
          drop_rate: item.drop_rate || 0,
        },
        card_id: item.card_id,
        quantity: item.quantity,
        is_favorite: item.is_favorite,
        obtained_at: item.obtained_at,
      }));
    },
  },

  cards: {
    getAll: (rarity?: string) => request<Card[]>(`/cards${rarity ? `?rarity=${rarity}` : ''}`),
    getById: (id: number) => request<Card>(`/cards/${id}`),
    getRarities: () => request<{ rarity: string; count: number; total_rate: number }[]>('/cards/rarities'),
  },

  gacha: {
    pull: (userId: number, count: 1 | 10 = 1) => {
      const endpoint = count === 10 ? `/gacha/pull10/${userId}` : `/gacha/pull/${userId}`;
      return request<PullResult>(endpoint, { method: 'POST' });
    },
    getHistory: (userId: number, limit = 50) =>
      request<{ name: string; rarity: string; created_at: string }[]>(`/gacha/history/${userId}?limit=${limit}`),
    getRates: () => request<{ cost: { single: number; multi10: number }; rates: Record<string, number> }>('/gacha/rates'),
  },

  shop: {
    getPackages: () => request<Package[]>('/shop/packages'),
    purchase: (userId: number, packageId: string) =>
      request<{ success: boolean; crystalsAdded: number; newBalance: number }>('/shop/topup', {
        method: 'POST',
        body: JSON.stringify({ userId, packageId }),
      }),
    getTransactions: (userId: number) =>
      request<Transaction[]>(`/shop/transactions/${userId}`),
  },

  admin: {
    getAllUsers: () => request<{ users: (User & { password_hash: string })[] }>('/admin/users'),
    modifyCrystals: (userId: number, amount: number, action: 'add' | 'subtract' | 'set' = 'add') =>
      request<{ success: boolean; user: User }>('/admin/crystals', {
        method: 'PUT',
        body: JSON.stringify({ userId, amount, action }),
      }),
    getStats: () => request<Record<string, unknown>>('/admin/stats'),
  },

  // Middleman API - INTENTIONALLY INSECURE for Pentest Training
  middleman: {
    // Auth endpoints (vulnerable)
    register: (data: { username: string; email: string; password: string }) =>
      request<{ message: string; middleman: Middleman }>('/transfer/register', {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      }),
    
    login: (data: { email: string; password: string }) =>
      request<{ message: string; middleman: Middleman }>('/transfer/login', {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      }),
    
    logout: () =>
      request<{ message: string }>('/transfer/logout', {
        credentials: 'include',
      }),
    
    getProfile: () =>
      request<Middleman>('/transfer/profile', {
        credentials: 'include',
      }),
    
    // SECURED: Now requires current password verification (IDOR fixed)
    changePassword: (data: { current_password: string; new_password: string }) =>
      request<{ message: string }>('/transfer/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      }),
    
    // VULNERABLE: Predictable token returned in response
    requestReset: (email: string) =>
      request<{ message: string; resetLink?: string; token?: string }>('/transfer/request-reset', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    
    // VULNERABLE: Token is just base64(userId), no expiry
    resetPassword: (data: { token: string; new_password: string }) =>
      request<{ message: string }>('/transfer/reset', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    // Transfer endpoints (middleman power - no user consent needed)
    transferCrystals: (data: { fromUserId: number; toUserId: number; amount: number }) =>
      request<TransferResult>('/transfer/crystals', {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      }),
    
    transferCards: (data: { fromUserId: number; toUserId: number; cardId: number; quantity?: number }) =>
      request<TransferResult>('/transfer/cards', {
        method: 'POST',
        body: JSON.stringify(data),
        credentials: 'include',
      }),
    
    // Get all users (for middleman to select from/to)
    getUsers: () =>
      request<User[]>('/transfer/users', {
        credentials: 'include',
      }),
    
    // Get user's inventory (for card transfers)
    getUserInventory: (userId: number) =>
      request<InventoryItem[]>(`/transfer/users/${userId}/inventory`, {
        credentials: 'include',
      }),
    
    // Get transfer logs
    getLogs: () =>
      request<MiddlemanLog[]>('/transfer/logs', {
        credentials: 'include',
      }),
  },
};