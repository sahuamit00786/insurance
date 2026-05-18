import useAuthStore from '../store/authStore';

export default function usePermission(module, action) {
  return useAuthStore(s => s.hasPermission(module, action));
}
