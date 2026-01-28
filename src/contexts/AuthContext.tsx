'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'doctor' | 'helper' | 'patient' | 'unauthorized';

export interface AuthUser {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isLoading: boolean;
  isAuthorized: boolean;
  fullName?: string;
}

interface AuthContextType extends AuthUser {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>('unauthorized');
  const [isLoading, setIsLoading] = useState(true);
  const [fullName, setFullName] = useState<string>();

  const fetchUserRole = async (userEmail: string) => {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('role, full_name, is_active')
        .eq('email', userEmail)
        .single();

      if (error || !data || !data.is_active) {
        setRole('unauthorized');
        setFullName(undefined);
        return;
      }

      setRole(data.role as UserRole);
      setFullName(data.full_name || undefined);

      // Log the login
      await supabase.rpc('log_user_login', { user_email: userEmail });
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole('unauthorized');
      setFullName(undefined);
    }
  };

  const refreshUserRole = async () => {
    if (user?.email) {
      await fetchUserRole(user.email);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.email) {
        fetchUserRole(session.user.email).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user?.email) {
        await fetchUserRole(session.user.email);
      } else {
        setRole('unauthorized');
        setFullName(undefined);
      }
      
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    setRole('unauthorized');
    setFullName(undefined);
  };

  const value = {
    user,
    session,
    role,
    isLoading,
    isAuthorized: role !== 'unauthorized',
    fullName,
    signInWithGoogle,
    signOut,
    refreshUserRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
