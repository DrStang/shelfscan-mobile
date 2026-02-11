// ThemeContext.js - Dark mode support
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Preferences } from '@capacitor/preferences';

const ThemeContext = createContext({});

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        // Synchronously check for dark mode preference to prevent flash
        if (typeof window !== 'undefined') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            return prefersDark ? 'dark' : 'light';
        }
        return 'light';
    });
    const [loading, setLoading] = useState(true);

    // Apply theme immediately on mount (before first paint)
    useEffect(() => {
        applyTheme(theme);
    }, []);

    useEffect(() => {
        loadTheme();
    }, []);

    const loadTheme = async () => {
        try {
            const { value } = await Preferences.get({ key: 'theme' });

            if (value) {
                setTheme(value);
                applyTheme(value);
            } else {
                // Check system preference
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const systemTheme = prefersDark ? 'dark' : 'light';
                setTheme(systemTheme);
                applyTheme(systemTheme);
            }
        } catch (err) {
            console.error('Error loading theme:', err);
        } finally {
            setLoading(false);
        }
    };

    const applyTheme = (newTheme) => {
        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.style.colorScheme = 'dark';
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.style.colorScheme = 'light';
        }
    };

    const toggleTheme = async () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        applyTheme(newTheme);

        try {
            await Preferences.set({ key: 'theme', value: newTheme });
        } catch (err) {
            console.error('Error saving theme:', err);
        }
    };

    const setThemePreference = async (newTheme) => {
        setTheme(newTheme);
        applyTheme(newTheme);

        try {
            await Preferences.set({ key: 'theme', value: newTheme });
        } catch (err) {
            console.error('Error saving theme:', err);
        }
    };

    const value = {
        theme,
        loading,
        toggleTheme,
        setTheme: setThemePreference,
        isDark: theme === 'dark'
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};