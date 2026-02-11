// ThemeToggle.jsx - Theme switcher component
import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import i18n from '../utils/i18n';

function ThemeToggle({ variant = 'full' }) {
    const { theme, setTheme, isDark } = useTheme();

    const handleThemeChange = async (newTheme) => {
        await Haptics.impact({ style: ImpactStyle.Light });
        setTheme(newTheme);
    };

    // Compact toggle button (for header)
    if (variant === 'compact') {
        return (
            <button
                onClick={() => handleThemeChange(isDark ? 'light' : 'dark')}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors active:scale-95"
                aria-label="Toggle theme"
            >
                {isDark ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                    <Moon className="w-5 h-5 text-gray-600" />
                )}
            </button>
        );
    }

    // Full theme selector (for settings page)
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Appearance
            </h3>

            <div className="grid grid-cols-3 gap-3">
                <button
                    onClick={() => handleThemeChange('light')}
                    className={`p-4 rounded-lg border-2 transition-all active:scale-95 ${
                        theme === 'light'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'
                    }`}
                >
                    <Sun className={`w-8 h-8 mx-auto mb-2 ${
                        theme === 'light' ? 'text-indigo-600' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                        theme === 'light' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                        {i18n.t('theme.light')}
                    </p>
                </button>

                <button
                    onClick={() => handleThemeChange('dark')}
                    className={`p-4 rounded-lg border-2 transition-all active:scale-95 ${
                        theme === 'dark'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'
                    }`}
                >
                    <Moon className={`w-8 h-8 mx-auto mb-2 ${
                        theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                        theme === 'dark' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                        {i18n.t('theme.dark')}
                    </p>
                </button>

                <button
                    onClick={() => handleThemeChange('system')}
                    className={`p-4 rounded-lg border-2 transition-all active:scale-95 ${
                        theme === 'system'
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'
                    }`}
                >
                    <Monitor className={`w-8 h-8 mx-auto mb-2 ${
                        theme === 'system' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'
                    }`} />
                    <p className={`text-sm font-medium ${
                        theme === 'system' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                        {i18n.t('theme.system')}
                    </p>
                </button>
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {i18n.t('theme.description')}
            </p>
        </div>
    );
}

export default ThemeToggle;