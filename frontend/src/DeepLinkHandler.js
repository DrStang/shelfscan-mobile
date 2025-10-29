import { useEffect } from 'react';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { supabase } from './supabaseClient';
export default function DeepLinkHandler() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) {
            console.log('[DeepLink] Web platform detected, skipping deep link handler');
            return; // Exit early for web
        }
        console.log('[DeepLink] Setting up deep link handler for native platform');

        const handleAppUrlOpen = async (event) => {
            console.log('[DeepLink] Received deep link:', event.url);

            try {
                // Check if this is an auth callback
                if (event.url.includes('auth/callback')) {
                    console.log('[DeepLink] Processing auth callback...');

                    // Parse the URL
                    // Example URL: shelfscan://auth/callback#access_token=xxx&refresh_token=yyy&type=signup
                    const url = new URL(event.url);

                    // Supabase puts tokens in the hash fragment
                    const hash = url.hash.substring(1); // Remove the '#'
                    const hashParams = new URLSearchParams(hash);

                    const access_token = hashParams.get('access_token');
                    const refresh_token = hashParams.get('refresh_token');
                    const type = hashParams.get('type'); // 'signup', 'recovery', etc.

                    console.log('[DeepLink] Type:', type);
                    console.log('[DeepLink] Has tokens:', !!access_token, !!refresh_token);

                    if (access_token && refresh_token) {
                        // Set the session in Supabase
                        const { data, error } = await supabase.auth.setSession({
                            access_token,
                            refresh_token
                        });

                        if (error) {
                            console.error('[DeepLink] Error setting session:', error);
                            alert('Authentication failed. Please try signing in again.');
                        } else {
                            console.log('[DeepLink] Session set successfully!', data);

                            // Show success message based on type
                            if (type === 'signup') {
                                alert('Email confirmed! Welcome to Shelf Scan! 🎉');
                            } else if (type === 'recovery') {
                                alert('Password reset link verified. You can now change your password.');
                            } else {
                                alert('Authentication successful!');
                            }

                            // The AuthContext will automatically update via onAuthStateChange
                        }
                    } else {
                        console.error('[DeepLink] Missing tokens in URL');

                        // Check for error parameters
                        const error = hashParams.get('error');
                        const error_description = hashParams.get('error_description');

                        if (error) {
                            console.error('[DeepLink] Auth error:', error, error_description);
                            alert(`Authentication error: ${error_description || error}`);
                        } else {
                            alert('Invalid authentication link. Please try again.');
                        }
                    }
                } else {
                    console.log('[DeepLink] Not an auth callback, ignoring');
                }
            } catch (err) {
                console.error('[DeepLink] Error processing deep link:', err);
                alert('Error processing authentication link. Please try again.');
            }
        };

        // Add the listener
        const listener = CapacitorApp.addListener('appUrlOpen', handleAppUrlOpen);

        console.log('[DeepLink] Listener added');

        // Cleanup function
        return () => {
            console.log('[DeepLink] Removing listener');
            listener.remove();
        };
    }, []); // Empty dependency array = run once on mount

    // This component doesn't render anything
    return null;
}