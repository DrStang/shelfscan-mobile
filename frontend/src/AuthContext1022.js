import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔍 AuthContext: Initializing...');

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('📱 Initial session check:', { session, error });
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      console.log('✅ Initial state set. User:', session?.user?.email || 'none');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 Auth state changed:', event);
      console.log('📧 New session user:', session?.user?.email || 'none');
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email, password) => {
    console.log('📝 AuthContext.signUp called');
    const url = `${process.env.REACT_APP_SUPABASE_URL}/auth/v1/signup`;
    const apikey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log('URL:', url);
    console.log('Has apikey:', !!apikey);

    try {
      const response = await window.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apikey,
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { data: null, error: { message: data.message || data.error_description } };
      }

      if (data.access_token) {
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });
      }

      console.log('✅ SignUp successful');
      return { data, error: null };
    } catch (err) {
      console.error('❌ SignUp exception:', err);
      return { data: null, error: err };
    }
  };

  const signIn = async (email, password) => {
    console.log('🔓 AuthContext.signIn called');
    console.log('Email:', email);
    console.log('ENV check:', {
      hasSupabaseUrl: !!process.env.REACT_APP_SUPABASE_URL,
      hasAnonKey: !!process.env.REACT_APP_SUPABASE_ANON_KEY,
    });

    const url = `${process.env.REACT_APP_SUPABASE_URL}/auth/v1/token?grant_type=password`;
    const apikey = process.env.REACT_APP_SUPABASE_ANON_KEY;

    console.log('Full URL:', url);
    console.log('Apikey length:', apikey?.length);

    try {
      console.log('About to call window.fetch...');

      const response = await window.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': apikey,
        },
        body: JSON.stringify({ email, password }),
      });

      console.log('✅ Fetch completed, status:', response.status);
      const data = await response.json();
      console.log('✅ JSON parsed');

      if (!response.ok) {
        console.error('Response not OK:', data);
        return { data: null, error: { message: data.message || data.error_description } };
      }

      if (data.access_token) {
        console.log('Setting session...');
        const { error } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (error) {
          console.error('❌ Error setting session:', error);
          return { data: null, error };
        }
        console.log('✅ Session set!');
      }

      console.log('✅ SignIn successful');
      return { data, error: null };
    } catch (err) {
      console.error('❌ SignIn exception:', err);
      console.error('Exception type:', typeof err);
      console.error('Exception keys:', Object.keys(err));
      console.error('Message:', err.message);
      console.error('Name:', err.name);
      console.error('Stack:', err.stack);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    console.log('🚪 AuthContext.signOut called');
    const { error } = await supabase.auth.signOut();
    if (error) console.error('❌ SignOut error:', error);
    else console.log('✅ SignOut successful');
    return { error };
  };

  const value = { user, session, loading, signUp, signIn, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};