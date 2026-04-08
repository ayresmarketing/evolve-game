import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string, whatsappRaw?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const normalizePhone = (value: string) => value.replace(/\D/g, '');

  const signUp = async (email: string, password: string, displayName?: string, whatsappRaw?: string) => {
    const whatsappNormalized = whatsappRaw ? normalizePhone(whatsappRaw) : undefined;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          whatsapp_raw: whatsappRaw,
          whatsapp_normalized: whatsappNormalized,
        },
      },
    });
    if (!error && data.user && whatsappNormalized) {
      await supabase.from('user_whatsapp_config' as any).upsert(
        {
          user_id: data.user.id,
          whatsapp_phone: whatsappNormalized,
          whatsapp_phone_raw: whatsappRaw ?? whatsappNormalized,
          whatsapp_phone_normalized: whatsappNormalized,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );
    }
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
