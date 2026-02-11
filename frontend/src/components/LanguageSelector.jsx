// LanguageSelector.jsx - Language selection component
import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import i18n from '../utils/i18n';

function LanguageSelector({ variant = 'full' }) {
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [languages, setLanguages] = useState([]);

    useEffect(() => {
        setCurrentLanguage(i18n.getLanguage());
        setLanguages(i18n.getAvailableLanguages());
    }, []);

    const handleLanguageChange = async (langCode) => {
        await Haptics.impact({ style: ImpactStyle.Light });
        const success = await i18n.setLanguage(langCode);
        if (success) {
            setCurrentLanguage(langCode);
            // Reload to apply new language
            window.location.reload();
        }
    };

    // Compact dropdown (for header)
    if (variant === 'compact') {
        return (
            <div className="relative">
                <select
                    value={currentLanguage}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="appearance-none bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-4 py-2 pr-8 text-sm font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    {languages.map(lang => (
                        <option key={lang.code} value={lang.code}>
                            {lang.name}
                        </option>
                    ))}
                </select>
                <Globe className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>
        );
    }

    // Full language selector (for settings page)
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
                <Globe className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    {i18n.t('profile.language')}
                </h3>
            </div>

            <div className="space-y-2">
                {languages.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => handleLanguageChange(lang.code)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all active:scale-95 ${
                            currentLanguage === lang.code
                                ? 'bg-indigo-50 dark:bg-indigo-900 border-2 border-indigo-500'
                                : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                    >
                        <div className="flex items-center justify-between">
              <span className={`font-medium ${
                  currentLanguage === lang.code
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-700 dark:text-gray-300'
              }`}>
                {lang.name}
              </span>
                            {currentLanguage === lang.code && (
                                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                {currentLanguage === 'en'
                    ? 'Select your preferred language for the app interface.'
                    : i18n.t('settings.languageDescription')}
            </p>
        </div>
    );
}

export default LanguageSelector;