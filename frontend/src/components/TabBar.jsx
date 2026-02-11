import React from 'react';
import { Home, BookOpen, History, User } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor} from "@capacitor/core";
import i18n from "../utils/i18n";

function TabBar({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'scan', icon: Home, label: i18n.t('nav.scan') },
        { id: 'library', icon: BookOpen, label: i18n.t('nav.library') },
        { id: 'history', icon: History, label: i18n.t('nav.history') },
        { id: 'profile', icon: User, label: i18n.t('nav.profile') },
    ];

    const handleTabPress = async (tabId) => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({style: ImpactStyle.Light});
        }
        onTabChange(tabId);
    };

    return (
        <div
            className="fixed left-0 right-0 bg-white border-t border-gray-200 z-50"
            style={{
                bottom: 0,
                paddingBottom: 'env(safe-area-inset-bottom)',
                minHeight: '4rem',
                height: 'calc(2rem + env(safe-area-inset-bottom))',
                transform: 'translate3d(0, 0, 0)',
                WebkitTransform: 'translate3d(0, 0, 0)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                position: 'fixed' // Explicitly set position in style
            }}
        >
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => handleTabPress(tab.id)}
                            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                                isActive ? 'text-indigo-600' : 'text-gray-400'
                            }`}
                        >
                            <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : ''}`} />
                            <span className="text-xs mt-1 font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default TabBar;