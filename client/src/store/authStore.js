import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:        null,
      token:       null,
      permissions: [],

      setAuth: (user, token, permissions) => set({ user, token, permissions }),

      updateUser: user => set(state => ({
        user: state.user ? { ...state.user, ...user } : user,
      })),

      logout: () => set({ user: null, token: null, permissions: [] }),

      hasPermission: (module, action) => {
        const { user, permissions } = get();
        if (!user) return false;
        if (user.role === 'superadmin' || user.role === 'admin') return true;
        const perm = permissions.find(p => p.module === module);
        if (!perm) return false;
        const key = `can_${action}`;
        return !!perm[key];
      },
    }),
    {
      name: 'insurance-auth',
      partialize: state => ({ user: state.user, token: state.token }),
    }
  )
);

export default useAuthStore;
