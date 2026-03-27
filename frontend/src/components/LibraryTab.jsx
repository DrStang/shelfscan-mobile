// ============================================================
// LibraryTab.jsx - Library tab with subtabs (i18n version)
// Replace: frontend/src/components/LibraryTab.jsx
// ============================================================

import React, { useState } from 'react';
import { Library, BookOpen } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import MyCollection from './MyCollection';
import ReadingList from '../ReadingList';
import i18n from '../utils/i18n';

function LibraryTab({ session, scanHistory, onEditBook }) {
    const [activeSubtab, setActiveSubtab] = useState('collection');

    const handleTabSwitch = async (tab) => {
        if (tab === activeSubtab) return;
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
        setActiveSubtab(tab);
    };

    return (
        <div className="space-y-4">
            {/* Subtab Toggle */}
            <div className="flex bg-gray-100 dark:bg-gray-700/50 rounded-xl p-1">
                <button
                    onClick={() => handleTabSwitch('collection')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
            ${activeSubtab === 'collection'
                        ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <Library className="w-4 h-4" />
                    {i18n.t('collection.myCollection')}
                </button>
                <button
                    onClick={() => handleTabSwitch('goodreads')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all
            ${activeSubtab === 'goodreads'
                        ? 'bg-white dark:bg-gray-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <BookOpen className="w-4 h-4" />
                    {i18n.t('collection.goodreadsImport')}
                </button>
            </div>

            {/* Subtab Content */}
            {activeSubtab === 'collection' ? (
                <MyCollection session={session} scanHistory={scanHistory} onEditBook={onEditBook} />
            ) : (
                <ReadingList isOpen={true} onClose={() => setActiveSubtab('collection')} />
            )}
        </div>
    );
}

export default LibraryTab;