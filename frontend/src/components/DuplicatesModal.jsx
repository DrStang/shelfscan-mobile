// ============================================================
// DuplicatesModal.jsx - Review and merge duplicate books
// Place in: frontend/src/components/DuplicatesModal.jsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import { X, Loader2, Check, AlertTriangle, BookOpen, Star, Merge, Zap } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function DuplicatesModal({ isOpen, onClose, session, onMergeComplete }) {
    const [duplicates, setDuplicates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [merging, setMerging] = useState(null); // normKey being merged
    const [autoMerging, setAutoMerging] = useState(false);
    const [stats, setStats] = useState(null);

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    }), [session]);

    // Load duplicates
    useEffect(() => {
        if (isOpen && session) {
            loadDuplicates();
        }
    }, [isOpen, session]);

    const loadDuplicates = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/user-books/duplicates`, {
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setDuplicates(data.duplicates || []);
                setStats({
                    groups: data.totalDuplicateGroups,
                    extraBooks: data.totalDuplicateBooks,
                });
            }
        } catch (err) {
            console.error('Error loading duplicates:', err);
        } finally {
            setLoading(false);
        }
    };

    // Merge a single group
    const handleMerge = async (group) => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
        }

        setMerging(group.normKey);
        try {
            const deleteIds = group.books
                .filter(b => b.id !== group.recommended_keep)
                .map(b => b.id);

            const response = await fetch(`${API_URL}/api/user-books/merge`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    keepId: group.recommended_keep,
                    deleteIds,
                }),
            });

            const data = await response.json();
            if (data.success) {
                // Remove this group from the list
                setDuplicates(prev => prev.filter(d => d.normKey !== group.normKey));
                setStats(prev => prev ? {
                    ...prev,
                    groups: prev.groups - 1,
                    extraBooks: prev.extraBooks - deleteIds.length,
                } : null);

                if (Capacitor.isNativePlatform()) {
                    await Haptics.notification({ type: NotificationType.Success });
                }
            }
        } catch (err) {
            console.error('Error merging:', err);
        } finally {
            setMerging(null);
        }
    };

    // Auto-merge all
    const handleAutoMergeAll = async () => {
        if (!window.confirm(
            `This will automatically merge ${stats?.extraBooks || 0} duplicate books, keeping the version with the best metadata (ratings, covers, ISBNs). Shelf assignments will be preserved. Continue?`
        )) return;

        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        }

        setAutoMerging(true);
        try {
            const response = await fetch(`${API_URL}/api/user-books/merge-all`, {
                method: 'POST',
                headers: getHeaders(),
            });

            const data = await response.json();
            if (data.success) {
                setDuplicates([]);
                setStats({ groups: 0, extraBooks: 0 });

                if (Capacitor.isNativePlatform()) {
                    await Haptics.notification({ type: NotificationType.Success });
                }

                if (onMergeComplete) onMergeComplete(data.merged);
            }
        } catch (err) {
            console.error('Error auto-merging:', err);
        } finally {
            setAutoMerging(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
             onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="bg-white dark:bg-gray-800 w-full sm:w-[520px] rounded-t-2xl sm:rounded-2xl
                      max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100 dark:border-gray-700">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Duplicate Books
                        </h3>
                        {stats && stats.groups > 0 && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                {stats.groups} group{stats.groups !== 1 ? 's' : ''} · {stats.extraBooks} extra book{stats.extraBooks !== 1 ? 's' : ''}
                            </p>
                        )}
                    </div>
                    <button onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    ) : duplicates.length === 0 ? (
                        <div className="text-center py-12">
                            <Check className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
                            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No duplicates found</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your collection is clean!</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Auto-merge button */}
                            <button
                                onClick={handleAutoMergeAll}
                                disabled={autoMerging}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4
                           bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700
                           rounded-xl text-amber-700 dark:text-amber-400 font-medium text-sm
                           hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors
                           disabled:opacity-50"
                            >
                                {autoMerging ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Merging all duplicates...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        Auto-merge all ({stats?.extraBooks} duplicates)
                                    </>
                                )}
                            </button>

                            {/* Duplicate groups */}
                            {duplicates.map((group) => (
                                <div key={group.normKey}
                                     className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                                    {/* Group header */}
                                    <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 flex items-center justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                {group.title}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {group.author} · {group.count} copies
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleMerge(group)}
                                            disabled={merging === group.normKey}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white
                                 rounded-lg text-xs font-medium hover:bg-indigo-700
                                 disabled:opacity-50 flex-shrink-0 ml-3"
                                        >
                                            {merging === group.normKey ? (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            ) : (
                                                <Merge className="w-3.5 h-3.5" />
                                            )}
                                            Merge
                                        </button>
                                    </div>

                                    {/* Book entries */}
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {group.books.map((book, idx) => {
                                            const isKeep = book.id === group.recommended_keep;
                                            return (
                                                <div key={book.id}
                                                     className={`flex items-center gap-3 px-4 py-2.5 ${
                                                         isKeep ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                                                     }`}>
                                                    {/* Thumbnail */}
                                                    {book.thumbnail ? (
                                                        <img src={book.thumbnail} alt=""
                                                             className="w-8 h-11 rounded object-cover flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-8 h-11 rounded bg-gray-100 dark:bg-gray-700
                                            flex items-center justify-center flex-shrink-0">
                                                            <BookOpen className="w-4 h-4 text-gray-300" />
                                                        </div>
                                                    )}

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-1.5">
                                                            {isKeep && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30
                                                 text-emerald-700 dark:text-emerald-400 rounded font-medium">
                                  KEEP
                                </span>
                                                            )}
                                                            {!isKeep && (
                                                                <span className="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30
                                                 text-red-600 dark:text-red-400 rounded font-medium">
                                  REMOVE
                                </span>
                                                            )}
                                                            {book.rating > 0 && (
                                                                <span className="flex items-center gap-0.5 text-xs text-gray-500">
                                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                                                    {parseFloat(book.rating).toFixed(1)}
                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                                                            {book.isbn && <span>ISBN: {book.isbn}</span>}
                                                            {book.shelves?.length > 0 && (
                                                                <span>{book.shelves.map(s => s.icon + s.name).join(', ')}</span>
                                                            )}
                                                            <span>{new Date(book.created_at).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default DuplicatesModal;