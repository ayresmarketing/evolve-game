import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionState {
  subscribed: boolean;
  trial: boolean;
  subscriptionEnd: string | null;
  trialEnd: string | null;
  status: string | null;
  loading: boolean;
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  openCheckout: () => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const OWNER_EMAIL = 'ayresmarketingoficial@gmail.com';

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    subscribed: false, trial: false,
    subscriptionEnd: null, trialEnd: null,
    status: null, loading: true,
  });

  const checkSubscription = useCallback(async () => {
    // Owner account always bypasses Stripe
    if (user?.email === OWNER_EMAIL) {
      setState({ subscribed: true, trial: false, subscriptionEnd: null, trialEnd: null, status: 'owner', loading: false });
      return;
    }
    if (!session?.access_token) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      setState({
        subscribed: data.subscribed ?? false,
        trial: data.trial ?? false,
        subscriptionEnd: data.subscription_end ?? null,
        trialEnd: data.trial_end ?? null,
        status: data.status ?? null,
        loading: false,
      });
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [user?.email, session?.access_token]);

  // Check on mount and every 60 seconds
  useEffect(() => {
    if (!user) {
      setState({ subscribed: false, trial: false, subscriptionEnd: null, trialEnd: null, status: null, loading: false });
      return;
    }
    checkSubscription();
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  // Check after returning from checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      // Small delay to let Stripe process
      setTimeout(checkSubscription, 2000);
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [checkSubscription]);

  const openCheckout = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.url) window.open(data.url, '_blank');
    } catch (err: any) {
      console.error('Checkout error:', err);
      throw err;
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) window.open(data.url, '_blank');
    } catch (err) {
      console.error('Portal error:', err);
      throw err;
    }
  }, []);

  return (
    <SubscriptionContext.Provider value={{ ...state, checkSubscription, openCheckout, openCustomerPortal }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
