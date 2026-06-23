// ============================================================
// CreateShelfModal.jsx - Modal for creating/editing a shelf
// Place in: frontend/src/components/CreateShelfModal.jsx
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const SHELF_COLORS = [
    { value: '#6366f1', label: 'Indigo' },
    { value: '#8b5cf6', label: 'Purple' },
    { value: '#ec4899', label: 'Pink' },
    { value: '#ef4444', label: 'Red' },
    { value: '#f97316', label: 'Orange' },
    { value: '#eab308', label: 'Yellow' },
    { value: '#22c55e', label: 'Green' },
    { value: '#14b8a6', label: 'Teal' },
    { value: '#3b82f6', label: 'Blue' },
    { value: '#6b7280', label: 'Gray' },
];

const SHELF_ICONS = ['📚', '🏠', '💼', '🎁', '❤️', '📖', '🔖', '📕', '🏢', '🛋️', '📦', '⭐'];

function CreateShelfModal({ isOpen, onClose, onSave, editingShelf }) {
    const [name, setName] = useState('');
    const [color, setColor] = useState('#6366f1');
    const [icon, setIcon] = useState('📚');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (editingShelf) {
            setName(editingShelf.name || '');
            setColor(editingShelf.color || '#6366f1');
            setIcon(editingShelf.icon || '📚');
        } else {
            setName('');
            setColor('#6366f1');
            setIcon('📚');
        }
        setError('');
    }, [editingShelf, isOpen]);

    // Lock body scroll while open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name.trim()) {
            setError('Please enter a shelf name');
            return;
        }

        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
        }

        setSaving(true);
        setError('');

        try {
            await onSave({ name: name.trim(), color, icon });
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to save shelf');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-12 px-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl
                           flex flex-col animate-scale-in"
                style={{
                    maxHeight: 'calc(100vh - 6rem)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 pb-3 flex-shrink-0">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingShelf ? 'Edit Shelf' : 'Create Shelf'}
                    </h3>
                    <button onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Scrollable middle */}
                <div
                    className="flex-1 overflow-y-auto px-5 min-h-0"
                    style={{ WebkitOverflowScrolling: 'touch' }}
                >
                    {/* Name Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Shelf name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Living Room, Favorites, Lent Out..."
                            maxLength={50}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleSave()}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl
                                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                       placeholder-gray-400 focus:ring-2 focus:ring-indigo-500
                                       focus:border-transparent outline-none transition-all"
                            style={{ fontSize: '16px' }}
                        />
                    </div>

                    {/* Icon Picker */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Icon
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SHELF_ICONS.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setIcon(emoji)}
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg 
                                                transition-all ${
                                        icon === emoji
                                            ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500'
                                            : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color Picker */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Color
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {SHELF_COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    onClick={() => setColor(c.value)}
                                    className={`w-9 h-9 rounded-full transition-all ${
                                        color === c.value
                                            ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110'
                                            : 'hover:scale-110'
                                    }`}
                                    style={{ backgroundColor: c.value }}
                                    title={c.label}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="mb-2 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview</p>
                        <div className="flex items-center gap-2">
                            <span className="text-lg">{icon}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {name || 'Shelf Name'}
                            </span>
                            <span className="ml-auto w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400
                                        text-sm rounded-xl">
                            {error}
                        </div>
                    )}
                </div>

                {/* Action buttons — always visible, pinned bottom */}
                <div className="flex gap-3 p-5 pt-3 flex-shrink-0 border-t border-gray-100 dark:border-gray-700">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 border border-gray-200 dark:border-gray-600
                                   text-gray-700 dark:text-gray-300 rounded-xl font-medium
                                   hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !name.trim()}
                        className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-xl font-medium
                                   hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed
                                   transition-colors flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            editingShelf ? 'Save Changes' : 'Create Shelf'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CreateShelfModal;