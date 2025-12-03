import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, User, Card, InventoryItem } from '@/lib/api';

interface UserState {
  user: User | null;
  isLoading: boolean;
  inventory: InventoryItem[];
  setUser: (user: User | null) => void;
  login: (userId: number) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  refreshInventory: () => Promise<void>;
  updateCrystals: (crystals: number) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      inventory: [],

      setUser: (user) => set({ user }),

      login: async (userId: number) => {
        set({ isLoading: true });
        try {
          const user = await api.users.getById(userId);
          const inventory = await api.users.getInventory(userId);
          set({ user, inventory, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => set({ user: null, inventory: [] }),

      refreshUser: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const updatedUser = await api.users.getById(user.id);
          set({ user: updatedUser });
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },

      refreshInventory: async () => {
        const { user } = get();
        if (!user) return;
        try {
          const inventory = await api.users.getInventory(user.id);
          set({ inventory });
        } catch (error) {
          console.error('Failed to refresh inventory:', error);
        }
      },

      updateCrystals: (crystals: number) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, crystals } });
        }
      },
    }),
    {
      name: 'crystal-gacha-user',
      partialize: (state) => ({ user: state.user }),
    }
  )
);

interface GachaState {
  isAnimating: boolean;
  pullResults: Card[];
  showResults: boolean;
  setAnimating: (isAnimating: boolean) => void;
  setPullResults: (results: Card[]) => void;
  setShowResults: (show: boolean) => void;
  clearPullResults: () => void;
}

export const useGachaStore = create<GachaState>((set) => ({
  isAnimating: false,
  pullResults: [],
  showResults: false,
  setAnimating: (isAnimating) => set({ isAnimating }),
  setPullResults: (pullResults) => set({ pullResults, showResults: true }),
  setShowResults: (showResults) => set({ showResults }),
  clearPullResults: () => set({ pullResults: [], showResults: false }),
}));
