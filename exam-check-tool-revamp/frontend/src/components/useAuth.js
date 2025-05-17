import { useCallback } from 'react';

export function useAuth() {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!(user && token);
  const role = user?.role;
  const logout = useCallback(() => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  }, []);
  return { user, isLoggedIn, role, logout };
} 