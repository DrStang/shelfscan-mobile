import React from 'react';
import { BookOpen, Camera, History } from 'lucide-react';

function EmptyState({ type = 'scan', onAction, actionLabel }) {
    const states = {
        scan: {
            icon: Camera,
            title: 'No scans yet',
            description: 'Take a photo of your bookshelf to discover the highest-rated books',
            defaultActionLabel: 'Scan Books',
            iconBg: 'bg-indigo-100',
            iconColor: 'text-indigo-600',
        },
        history: {
            icon: History,
            title: 'No scan history',
            description: 'Your past scans will appear here once you start scanning',
            defaultActionLabel: 'Start Scanning',
            iconBg: 'bg-purple-100',
            iconColor: 'text-purple-600',
        },
        library: {
            icon: BookOpen,
            title: 'No reading list',
            description: 'Upload your Goodreads CSV to see which scanned books are on your list',
            defaultActionLabel: 'Import CSV',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
        },
    };

    const state = states[type];
    const Icon = state.icon;

    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className={`w-24 h-24 ${state.iconBg} rounded-full flex items-center justify-center mb-6`}>
                <Icon className={`w-12 h-12 ${state.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{state.title}</h3>
            <p className="text-gray-600 mb-8 max-w-sm">{state.description}</p>
            {onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
                >
                    {actionLabel || state.defaultActionLabel}
                </button>
            )}
        </div>
    );
}

export default EmptyState;