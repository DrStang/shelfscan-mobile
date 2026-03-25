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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
             onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white dark:bg-gray-800 w-full sm:w-[420px] rounded-t-2xl sm:rounded-2xl p-6
                      max-h-[85vh] overflow-y-auto animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingShelf ? 'Edit Shelf' : 'Create Shelf'}
                    </h3>
                    <button onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Name Input */}
                <div className="mb-5">
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
                        className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                       placeholder-gray-400 focus:ring-2 focus:ring-indigo-500
                       focus:border-transparent outline-none transition-all text-base"
                    />
                </div>

                {/* Icon Picker */}
                <div className="mb-5">
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
                                        ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500 scale-110'
                                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                                }`}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Picker */}
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                        Color
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {SHELF_COLORS.map((c) => (
                            <button
                                key={c.value}
                                onClick={() => setColor(c.value)}
                                className={`w-8 h-8 rounded-full transition-all ${
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
                <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
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
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400
                          text-sm rounded-xl">
                        {error}
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
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