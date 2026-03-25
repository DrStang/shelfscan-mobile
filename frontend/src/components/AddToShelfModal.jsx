// ============================================================
// AddToShelfModal.jsx - Modal for adding a book to shelf(s)
// Place in: frontend/src/components/AddToShelfModal.jsx
// ============================================================

import React, { useState } from 'react';
import { X, Plus, Check, Loader2 } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import i18n from '../utils/i18n';

function AddToShelfModal({ isOpen, onClose, book, shelves, onAddToShelf, onCreateShelf }) {
    const [saving, setSaving] = useState(null); // shelf ID being saved
    const [showCreate, setShowCreate] = useState(false);
    const [newShelfName, setNewShelfName] = useState('');
    const [creating, setCreating] = useState(false);

    if (!isOpen || !book) return null;

    // Check which shelves this book is already on
    const bookShelfIds = new Set((book.shelves || []).map(s => s.id));

    const handleToggleShelf = async (shelf) => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }

        setSaving(shelf.id);
        try {
            await onAddToShelf(shelf.id, book.id);
            if (Capacitor.isNativePlatform()) {
                await Haptics.notification({ type: NotificationType.Success });
            }
        } catch (err) {
            console.error('Error toggling shelf:', err);
        } finally {
            setSaving(null);
        }
    };

    const handleQuickCreate = async () => {
        if (!newShelfName.trim()) return;

        setCreating(true);
        try {
            const newShelf = await onCreateShelf(newShelfName.trim());
            // Automatically add book to the new shelf
            if (newShelf) {
                await onAddToShelf(newShelf.id, book.id);
            }
            setNewShelfName('');
            setShowCreate(false);
            if (Capacitor.isNativePlatform()) {
                await Haptics.notification({ type: NotificationType.Success });
            }
        } catch (err) {
            console.error('Error creating shelf:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
             onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white dark:bg-gray-800 w-full sm:w-[380px] rounded-t-2xl sm:rounded-2xl p-5
                      max-h-[70vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex-1 min-w-0 pr-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Add to shelf</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {book.title}
                        </p>
                    </div>
                    <button onClick={onClose}
                            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Shelf List */}
                {shelves.length === 0 ? (
                    <div className="text-center py-6">
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">No shelves yet</p>
                    </div>
                ) : (
                    <div className="space-y-1.5 mb-4">
                        {shelves.map((shelf) => {
                            const isOnShelf = bookShelfIds.has(shelf.id);
                            const isSaving = saving === shelf.id;

                            return (
                                <button
                                    key={shelf.id}
                                    onClick={() => handleToggleShelf(shelf)}
                                    disabled={isSaving}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all
                    ${isOnShelf
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    <span className="text-base">{shelf.icon || '📚'}</span>
                                    <span className={`flex-1 text-left text-sm font-medium ${
                                        isOnShelf
                                            ? 'text-indigo-700 dark:text-indigo-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                    }`}>
                    {shelf.name}
                  </span>
                                    <span className="text-xs text-gray-400">{shelf.bookCount || 0}</span>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center 
                    ${isOnShelf
                                        ? 'bg-indigo-600 text-white'
                                        : 'border-2 border-gray-300 dark:border-gray-500'
                                    }`}
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        ) : isOnShelf ? (
                                            <Check className="w-3.5 h-3.5" />
                                        ) : null}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Quick Create */}
                {showCreate ? (
                    <div className="flex gap-2 mb-2">
                        <input
                            type="text"
                            value={newShelfName}
                            onChange={(e) => setNewShelfName(e.target.value)}
                            placeholder="New shelf name..."
                            maxLength={50}
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                            className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm
                         placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            onClick={handleQuickCreate}
                            disabled={creating || !newShelfName.trim()}
                            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium
                         disabled:opacity-50 flex items-center gap-1"
                        >
                            {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Add'}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCreate(true)}
                        className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed
                       border-gray-200 dark:border-gray-600 rounded-xl text-gray-500
                       dark:text-gray-400 hover:border-indigo-300 hover:text-indigo-600
                       dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {i18n.t('collection.createShelf')}
                    </button>
                )}
            </div>
        </div>
    );
}

export default AddToShelfModal;