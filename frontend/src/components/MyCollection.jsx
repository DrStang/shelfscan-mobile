// ============================================================
// MyCollection.jsx - PHASE 2 with i18n
// Replace: frontend/src/components/MyCollection.jsx
// ============================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, BookOpen, Star, Loader2, FolderPlus,
    ChevronDown, X, Library, AlertTriangle, Filter, BarChart3
} from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { useShelves } from '../hooks/useShelves';
import { useUserBooks } from '../hooks/useUserBooks';
import CreateShelfModal from './CreateShelfModal';
import AddToShelfModal from './AddToShelfModal';
import DuplicatesModal from './DuplicatesModal';
import i18n from '../utils/i18n';

function MyCollection({ session, scanHistory }) {
    const {
        shelves, loading: shelvesLoading,
        createShelf, updateShelf, deleteShelf,
        addBooksToShelf, removeBookFromShelf, loadShelves
    } = useShelves(session);

    const {
        books, stats, total, loading: booksLoading,
        loadBooks, loadStats, deleteBook, extractFromScan
    } = useUserBooks(session);

    const [activeShelf, setActiveShelf] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [minRating, setMinRating] = useState(null);
    const [showUnshelved, setShowUnshelved] = useState(false);
    const [showCreateShelf, setShowCreateShelf] = useState(false);
    const [editingShelf, setEditingShelf] = useState(null);
    const [addToShelfBook, setAddToShelfBook] = useState(null);
    const [shelfMenuOpen, setShelfMenuOpen] = useState(null);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showDuplicates, setShowDuplicates] = useState(false);
    const [showStatsPanel, setShowStatsPanel] = useState(false);
    const [backfilling, setBackfilling] = useState(false);

    useEffect(() => {
        loadBooks({
            shelfId: activeShelf,
            search: searchQuery,
            sort: sortBy,
            minRating: minRating,
            unshelfed: showUnshelved,
        });
    }, [activeShelf, searchQuery, sortBy, minRating, showUnshelved, loadBooks]);

    useEffect(() => {
        loadStats();
    }, [loadStats]);

    const [debouncedSearch, setDebouncedSearch] = useState('');
    useEffect(() => {
        const timer = setTimeout(() => setSearchQuery(debouncedSearch), 300);
        return () => clearTimeout(timer);
    }, [debouncedSearch]);

    const activeFilterCount = [minRating, showUnshelved].filter(Boolean).length;

    const handleBackfill = async () => {
        if (!scanHistory || scanHistory.length === 0) return;
        setBackfilling(true);
        try {
            for (const scan of scanHistory) {
                await extractFromScan(scan.id);
            }
            await loadBooks({ sort: sortBy });
            await loadStats();
        } catch (err) {
            console.error('Backfill error:', err);
        } finally {
            setBackfilling(false);
        }
    };

    const handleCreateShelf = async ({ name, color, icon }) => {
        return await createShelf(name, color, icon);
    };

    const handleEditShelf = async ({ name, color, icon }) => {
        if (!editingShelf) return;
        await updateShelf(editingShelf.id, { name, color, icon });
        setEditingShelf(null);
    };

    const handleDeleteShelf = async (shelfId) => {
        if (!window.confirm(i18n.t('collection.deleteShelfConfirm'))) return;
        await deleteShelf(shelfId);
        if (activeShelf === shelfId) setActiveShelf(null);
    };

    const handleAddToShelf = async (shelfId, bookId) => {
        await addBooksToShelf(shelfId, [bookId]);
        await loadBooks({ shelfId: activeShelf, search: searchQuery, sort: sortBy, minRating, unshelfed: showUnshelved });
    };

    const handleMergeComplete = async (count) => {
        await loadBooks({ sort: sortBy });
        await loadStats();
    };

    const clearAllFilters = () => {
        setMinRating(null);
        setShowUnshelved(false);
        setActiveShelf(null);
        setDebouncedSearch('');
        setSearchQuery('');
    };

    const sortOptions = [
        { value: 'newest', label: i18n.t('collection.sortNewest') },
        { value: 'oldest', label: i18n.t('collection.sortOldest') },
        { value: 'rating', label: i18n.t('collection.sortHighestRated') },
        { value: 'rating_asc', label: i18n.t('collection.sortLowestRated') },
        { value: 'title', label: i18n.t('collection.sortTitleAZ') },
        { value: 'title_desc', label: i18n.t('collection.sortTitleZA') },
        { value: 'author', label: i18n.t('collection.sortAuthorAZ') },
    ];

    const ratingFilters = [
        { value: null, label: i18n.t('collection.filterAny') },
        { value: 3, label: '3+' },
        { value: 3.5, label: '3.5+' },
        { value: 4, label: '4+' },
        { value: 4.5, label: '4.5+' },
    ];

    const isLoading = shelvesLoading || booksLoading;

    return (
        <div className="space-y-4">
            {/* ── Stats Bar ── */}
            {stats && stats.totalBooks > 0 && (
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => setShowStatsPanel(!showStatsPanel)}
                        className="bg-indigo-50 dark:bg-indigo-900/30 rounded-xl p-3 text-center
                       hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <div className="text-xl font-bold text-indigo-700 dark:text-indigo-400">
                            {stats.totalBooks}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{i18n.t('collection.books')}</div>
                    </button>
                    <div className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 text-center">
                        <div className="text-xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                            {stats.avgRating || '—'}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{i18n.t('collection.avgRating')}</div>
                    </div>
                    {stats.duplicateGroups > 0 ? (
                        <button
                            onClick={() => setShowDuplicates(true)}
                            className="bg-amber-50 dark:bg-amber-900/30 rounded-xl p-3 text-center
                         hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors
                         border border-amber-200 dark:border-amber-700"
                        >
                            <div className="text-xl font-bold text-amber-700 dark:text-amber-400 flex items-center justify-center gap-1">
                                <AlertTriangle className="w-4 h-4" />
                                {stats.duplicateGroups}
                            </div>
                            <div className="text-xs text-amber-600 dark:text-amber-400">{i18n.t('collection.duplicates')}</div>
                        </button>
                    ) : (
                        <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
                                {shelves.length}
                            </div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{i18n.t('collection.shelves')}</div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Expanded Stats Panel ── */}
            {showStatsPanel && stats && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-1.5">
                            <BarChart3 className="w-4 h-4" /> {i18n.t('collection.statsTitle')}
                        </h4>
                        <button onClick={() => setShowStatsPanel(false)}
                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                            <X className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">{i18n.t('collection.ratedBooks')}</span>
                            <span className="float-right font-medium text-gray-900 dark:text-white">{stats.ratedBooks}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">{i18n.t('collection.withCovers')}</span>
                            <span className="float-right font-medium text-gray-900 dark:text-white">{stats.withCovers}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">{i18n.t('collection.unshelved')}</span>
                            <span className="float-right font-medium text-gray-900 dark:text-white">{stats.unshelvedCount}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 dark:text-gray-400">{i18n.t('collection.shelves')}</span>
                            <span className="float-right font-medium text-gray-900 dark:text-white">{shelves.length}</span>
                        </div>
                    </div>

                    {stats.topAuthors && stats.topAuthors.length > 0 && (
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{i18n.t('collection.topAuthors')}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {stats.topAuthors.map((a) => (
                                    <button
                                        key={a.name}
                                        onClick={() => { setDebouncedSearch(a.name); setShowStatsPanel(false); }}
                                        className="text-xs px-2 py-1 bg-white dark:bg-gray-700 rounded-lg
                               border border-gray-200 dark:border-gray-600
                               text-gray-700 dark:text-gray-300 hover:border-indigo-300 transition-colors"
                                    >
                                        {a.name} ({a.count})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Shelf Pills ── */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                <button
                    onClick={() => { setActiveShelf(null); setShowUnshelved(false); }}
                    className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all
            ${!activeShelf && !showUnshelved
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                    {i18n.t('collection.all')} ({total})
                </button>

                {stats?.unshelvedCount > 0 && (
                    <button
                        onClick={() => { setShowUnshelved(!showUnshelved); setActiveShelf(null); }}
                        className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all
              ${showUnshelved
                            ? 'bg-gray-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                        📥 {i18n.t('collection.unshelved')} ({stats.unshelvedCount})
                    </button>
                )}

                {shelves.map((shelf) => (
                    <div key={shelf.id} className="relative flex-shrink-0">
                        <button
                            onClick={() => { setActiveShelf(activeShelf === shelf.id ? null : shelf.id); setShowUnshelved(false); }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setShelfMenuOpen(shelfMenuOpen === shelf.id ? null : shelf.id);
                            }}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all
                ${activeShelf === shelf.id
                                ? 'text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            style={activeShelf === shelf.id ? { backgroundColor: shelf.color } : undefined}
                        >
                            <span className="text-xs">{shelf.icon}</span>
                            {shelf.name}
                            <span className="text-xs opacity-75">({shelf.bookCount || 0})</span>
                        </button>

                        {shelfMenuOpen === shelf.id && (
                            <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg
                              border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[140px]">
                                <button
                                    onClick={() => { setEditingShelf(shelf); setShelfMenuOpen(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300
                             hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    {i18n.t('collection.editShelf')}
                                </button>
                                <button
                                    onClick={() => { handleDeleteShelf(shelf.id); setShelfMenuOpen(null); }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400
                             hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    {i18n.t('common.delete')}
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                <button
                    onClick={() => setShowCreateShelf(true)}
                    className="flex-shrink-0 p-1.5 rounded-full bg-gray-100 dark:bg-gray-700
                     text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={i18n.t('collection.createShelf')}
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* ── Search, Filter & Sort ── */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={debouncedSearch}
                        onChange={(e) => setDebouncedSearch(e.target.value)}
                        placeholder={i18n.t('collection.searchPlaceholder')}
                        className="w-full pl-9 pr-8 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200
                       dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white
                       placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       outline-none transition-all"
                    />
                    {debouncedSearch && (
                        <button onClick={() => setDebouncedSearch('')}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2">
                            <X className="w-4 h-4 text-gray-400" />
                        </button>
                    )}
                </div>

                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`relative flex items-center gap-1 px-3 py-2.5 border rounded-xl text-sm transition-colors
            ${showFilters || activeFilterCount > 0
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                    }`}
                >
                    <Filter className="w-3.5 h-3.5" />
                    {activeFilterCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-600 text-white
                             text-[10px] rounded-full flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
                    )}
                </button>

                <div className="relative">
                    <button
                        onClick={() => setShowSortDropdown(!showSortDropdown)}
                        className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50
                       border border-gray-200 dark:border-gray-600 rounded-xl text-sm
                       text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                        <ChevronDown className="w-3.5 h-3.5" />
                    </button>

                    {showSortDropdown && (
                        <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 rounded-xl
                            shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20 min-w-[160px]">
                            {sortOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => { setSortBy(opt.value); setShowSortDropdown(false); }}
                                    className={`w-full text-left px-3 py-2 text-sm transition-colors
                    ${sortBy === opt.value
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Filter Panel ── */}
            {showFilters && (
                <div className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-3 space-y-3">
                    <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {i18n.t('collection.filters')}
            </span>
                        {activeFilterCount > 0 && (
                            <button onClick={clearAllFilters}
                                    className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                                {i18n.t('collection.clearAll')}
                            </button>
                        )}
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">
                            {i18n.t('collection.minRating')}
                        </label>
                        <div className="flex gap-1.5">
                            {ratingFilters.map((rf) => (
                                <button
                                    key={rf.label}
                                    onClick={() => setMinRating(rf.value)}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${minRating === rf.value
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-700'
                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-gray-300'
                                    }`}
                                >
                                    {rf.value && <Star className="w-3 h-3 fill-amber-400 text-amber-400" />}
                                    {rf.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Close dropdowns on click outside */}
            {(shelfMenuOpen || showSortDropdown) && (
                <div className="fixed inset-0 z-10"
                     onClick={() => { setShelfMenuOpen(null); setShowSortDropdown(false); }} />
            )}

            {/* ── Book Grid ── */}
            {isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-12">
                    {stats?.totalBooks === 0 ? (
                        <>
                            <Library className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {i18n.t('collection.startCollection')}
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-xs mx-auto">
                                {scanHistory && scanHistory.length > 0
                                    ? i18n.t('collection.importFromScansDesc')
                                    : i18n.t('collection.scanFirstDesc')
                                }
                            </p>
                            {scanHistory && scanHistory.length > 0 && (
                                <button
                                    onClick={handleBackfill}
                                    disabled={backfilling}
                                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-medium
                             hover:bg-indigo-700 disabled:opacity-50 transition-colors
                             flex items-center gap-2 mx-auto"
                                >
                                    {backfilling ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {i18n.t('collection.importing')}
                                        </>
                                    ) : (
                                        <>
                                            <BookOpen className="w-4 h-4" />
                                            {i18n.t('collection.importFromScans', { count: scanHistory.length })}
                                        </>
                                    )}
                                </button>
                            )}
                        </>
                    ) : (
                        <>
                            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400 text-sm">
                                {i18n.t('collection.noMatches')}
                            </p>
                            <button onClick={clearAllFilters}
                                    className="mt-3 text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                {i18n.t('collection.clearFilters')}
                            </button>
                        </>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    {books.map((book) => (
                        <div
                            key={book.id}
                            className="flex items-center gap-3 p-3 bg-white dark:bg-gray-800 rounded-xl
                         border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow"
                        >
                            {book.thumbnail ? (
                                <img src={book.thumbnail} alt=""
                                     className="w-10 h-14 rounded object-cover flex-shrink-0 bg-gray-100"
                                     onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                                <div className="w-10 h-14 rounded bg-gray-100 dark:bg-gray-700 flex items-center
                                justify-center flex-shrink-0">
                                    <BookOpen className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                    {book.title}
                                </h4>
                                {book.author && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{book.author}</p>
                                )}
                                {book.shelves && book.shelves.length > 0 && (
                                    <div className="flex gap-1 mt-1 flex-wrap">
                                        {book.shelves.map((shelf) => (
                                            <span key={shelf.id}
                                                  className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5
                                       rounded-full font-medium"
                                                  style={{ backgroundColor: shelf.color + '20', color: shelf.color }}>
                        {shelf.icon} {shelf.name}
                      </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {book.rating > 0 && (
                                <div className="flex items-center gap-1 flex-shrink-0">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {parseFloat(book.rating).toFixed(1)}
                  </span>
                                </div>
                            )}

                            <button
                                onClick={async () => {
                                    if (Capacitor.isNativePlatform()) {
                                        await Haptics.impact({ style: ImpactStyle.Light });
                                    }
                                    setAddToShelfBook(book);
                                }}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400
                           hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                                title={i18n.t('collection.addToShelf')}
                            >
                                <FolderPlus className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modals ── */}
            <CreateShelfModal
                isOpen={showCreateShelf || !!editingShelf}
                onClose={() => { setShowCreateShelf(false); setEditingShelf(null); }}
                onSave={editingShelf ? handleEditShelf : handleCreateShelf}
                editingShelf={editingShelf}
            />

            <AddToShelfModal
                isOpen={!!addToShelfBook}
                onClose={() => setAddToShelfBook(null)}
                book={addToShelfBook}
                shelves={shelves}
                onAddToShelf={handleAddToShelf}
                onCreateShelf={(name) => createShelf(name, '#6366f1', '📚')}
            />

            <DuplicatesModal
                isOpen={showDuplicates}
                onClose={() => setShowDuplicates(false)}
                session={session}
                onMergeComplete={handleMergeComplete}
            />
        </div>
    );
}

export default MyCollection;