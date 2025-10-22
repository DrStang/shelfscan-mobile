import React, { useState } from 'react';
import { X, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { supabase } from './supabaseClient'; // Import directly for testing

export default function AuthModal({ isOpen, onClose }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [debugInfo, setDebugInfo] = useState('');

  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  // Add a test button to check Supabase connection
  const testConnection = async () => {
    console.log('🧪 Testing Supabase connection...');
    setDebugInfo('Testing connection...');

    try {
      const { data, error } = await supabase.auth.getSession();
      console.log('Session check:', { data, error });
      setDebugInfo(`Session: ${JSON.stringify(data, null, 2)}`);
    } catch (err) {
      console.error('Connection test failed:', err);
      setDebugInfo(`Error: ${err.message}`);
    }
  };

  const handleSubmit = async (e) => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    e.preventDefault();
    setError('');
    setSuccess('');
    setDebugInfo('');
    setLoading(true);

    console.log('=== AUTH ATTEMPT START ===');
    console.log('Email:', email);
    console.log('Is SignUp:', isSignUp);

    try {
      if (isSignUp) {
        console.log('📝 Calling signUp...');
        const result = await signUp(email, password);
        console.log('SignUp result:', result);

        if (result.error) {
          console.error('SignUp error:', result.error);
          throw result.error;
        }

        console.log('✅ SignUp successful:', result.data);
        await Haptics.notification({ type: NotificationType.Success });
        setSuccess('Account created! Check your email to verify.');
        setDebugInfo(`Success: ${JSON.stringify(result.data?.user?.email)}`);
      } else {
        console.log('🔓 Calling signIn...');
        const result = await signIn(email, password);
        console.log('SignIn result:', result);

        if (result.error) {
          console.error('SignIn error:', result.error);
          throw result.error;
        }

        console.log('✅ SignIn successful:', result.data);
        await Haptics.notification({ type: NotificationType.Success });
        setSuccess('Signed in successfully!');
        setDebugInfo(`Success: ${JSON.stringify(result.data?.user?.email)}`);

        // Check if user is actually set
        setTimeout(() => {
          console.log('Checking session after 1s...');
          supabase.auth.getSession().then(({ data }) => {
            console.log('Session 1s later:', data);
          });
        }, 1000);

        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      console.error('❌ Auth error:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.status,
        name: err.name
      });

      await Haptics.notification({ type: NotificationType.Error });
      setError(err.message || 'An error occurred');
      setDebugInfo(`Error: ${err.message} (${err.status || 'no status'})`);
    } finally {
      setLoading(false);
      console.log('=== AUTH ATTEMPT END ===');
    }
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8 relative max-h-[90vh] overflow-y-auto">
          <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isSignUp ? 'Sign up to save your scans' : 'Sign in to access your library'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="••••••••"
                />
              </div>
              {isSignUp && (
                  <p className="text-xs text-gray-500 mt-1">At least 6 characters</p>
              )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
            )}

            {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
            )}

            {/* Debug info */}
            {debugInfo && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs font-mono overflow-auto max-h-32">
                  {debugInfo}
                </div>
            )}

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isSignUp ? 'Creating Account...' : 'Signing In...'}
                  </>
              ) : (
                  isSignUp ? 'Create Account' : 'Sign In'
              )}
            </button>

            {/* Test connection button */}
            <button
                type="button"
                onClick={testConnection}
                className="w-full py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
            >
              🧪 Test Connection
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
                onClick={async() => {
                  await Haptics.impact({ style: ImpactStyle.Light });
                  setIsSignUp(!isSignUp);
                  setError('');
                  setSuccess('');
                  setDebugInfo('');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>

          <p className="mt-4 text-xs text-gray-500 text-center">
            App works without an account. Sign in to save your scans.
          </p>
        </div>
      </div>
  );
}