import React from 'react';
import { Home, BookOpen, History, User } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor} from "@capacitor/core";

function TabBar({ activeTab, onTabChange }) {
    const tabs = [
        { id: 'scan', icon: Home, label: 'Scan' },
        { id: 'library', icon: BookOpen, label: 'Library' },
        { id: 'history', icon: History, label: 'History' },
        { id: 'profile', icon: User, label: 'Profile' },
    ];

    const handleTabPress = async (tabId) => {
        if (Capacitor.isNativePlatform()) {
            Haptics.impact({style: ImpactStyle.Light});
        }
        onTabChange(tabId);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-inset-bottom z-50">
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