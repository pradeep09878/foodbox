import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface Vendor {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  logo?: string;
  cuisine_type?: string;
  description?: string;
  is_open: boolean;
  rating: number;
}

interface AuthState {
  user: User | null;
  vendor: Vendor | null;
  authType: 'user' | 'vendor' | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  loginUser: (email: string, password: string) => Promise<void>;
  loginVendor: (email: string, password: string) => Promise<void>;
  registerUser: (name: string, email: string, phone: string, password: string) => Promise<void>;
  registerVendor: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    cuisine_type?: string;
    description?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshVendor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    vendor: null,
    authType: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    loadFromStorage();
  }, []);

  async function loadFromStorage() {
    try {
      const token = await AsyncStorage.getItem('token');
      const authType = await AsyncStorage.getItem('authType') as 'user' | 'vendor' | null;
      const storedData = await AsyncStorage.getItem('authData');
      if (token && authType && storedData) {
        const parsed = JSON.parse(storedData);
        setState({
          user: authType === 'user' ? parsed : null,
          vendor: authType === 'vendor' ? parsed : null,
          authType,
          token,
          loading: false,
        });
      } else {
        setState(s => ({ ...s, loading: false }));
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }

  async function loginUser(email: string, password: string) {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('authType', 'user');
    await AsyncStorage.setItem('authData', JSON.stringify(user));
    setState({ user, vendor: null, authType: 'user', token, loading: false });
  }

  async function loginVendor(email: string, password: string) {
    const res = await api.post('/vendor/login', { email, password });
    const { token, vendor } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('authType', 'vendor');
    await AsyncStorage.setItem('authData', JSON.stringify(vendor));
    setState({ user: null, vendor, authType: 'vendor', token, loading: false });
  }

  async function registerUser(name: string, email: string, phone: string, password: string) {
    const res = await api.post('/auth/register', { name, email, phone, password });
    const { token, user } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('authType', 'user');
    await AsyncStorage.setItem('authData', JSON.stringify(user));
    setState({ user, vendor: null, authType: 'user', token, loading: false });
  }

  async function registerVendor(data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string;
    cuisine_type?: string;
    description?: string;
  }) {
    const res = await api.post('/vendor/register', data);
    const { token, vendor } = res.data;
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('authType', 'vendor');
    await AsyncStorage.setItem('authData', JSON.stringify(vendor));
    setState({ user: null, vendor, authType: 'vendor', token, loading: false });
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'authType', 'authData']);
    setState({ user: null, vendor: null, authType: null, token: null, loading: false });
  }

  async function refreshUser() {
    try {
      const res = await api.get('/user/profile');
      const user = res.data.user;
      await AsyncStorage.setItem('authData', JSON.stringify(user));
      setState(s => ({ ...s, user }));
    } catch {}
  }

  async function refreshVendor() {
    try {
      const res = await api.get('/vendor/profile');
      const vendor = res.data.vendor;
      await AsyncStorage.setItem('authData', JSON.stringify(vendor));
      setState(s => ({ ...s, vendor }));
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ ...state, loginUser, loginVendor, registerUser, registerVendor, logout, refreshUser, refreshVendor }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
