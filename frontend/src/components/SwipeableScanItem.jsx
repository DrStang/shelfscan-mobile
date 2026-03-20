import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronRight, Star, BookOpen, Edit3 } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import i18n from "../utils/i18n";

function SwipeableScanItem({ scan, onDelete, onViewDetail, onEdit }) {
    const [swipeX, setSwipeX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const itemRef = useRef(null);

    const SWIPE_THRESHOLD = -80;
    const DELETE_THRESHOLD = -120;

    const books = scan.books || [];
    const topRatedBook = books.length > 0 ? books[0] : null;
    const avgRating = books.filter(b => b.rating > 0).reduce((sum, b, _, arr) =>
        sum + b.rating / arr.length, 0);
    const onListCount = books.filter(b => b.inReadingList).length;

    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        touchCurrentX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
        touchCurrentX.current = e.touches[0].clientX;
        const diff = touchCurrentX.current - touchStartX.current;

        if (diff < 0) {
            setSwipeX(Math.max(diff, DELETE_THRESHOLD - 20));
        }
    };

    const handleTouchEnd = async () => {
        const diff = touchCurrentX.current - touchStartX.current;

        if (diff < DELETE_THRESHOLD) {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Heavy });
            }
            setShowDeleteConfirm(true);
        } else if (diff < SWIPE_THRESHOLD) {
            setSwipeX(SWIPE_THRESHOLD);
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Light });
            }
        } else {
            setSwipeX(0);
        }
    };

    const handleClick = async (e) => {
        // Only trigger if not swiping
        if (swipeX === 0 && onViewDetail) {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Light });
            }
            onViewDetail(scan);
        }
    };

    const handleEditClick = async (e) => {
        e.stopPropagation(); // Prevent triggering onViewDetail
        if (onEdit) {
            if (Capacitor.isNativePlatform()) {
                await Haptics.impact({ style: ImpactStyle.Light });
            }
            onEdit(scan);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);

        if (Capacitor.isNativePlatform()) {
            await Haptics.notification({ type: 'success' });
        }

        try {
            await onDelete(scan.id);
        } catch (error) {
            console.error('Error deleting scan:', error);
            setIsDeleting(false);
            setSwipeX(0);
        }
    };

    const handleCancelDelete = () => {
        setShowDeleteConfirm(false);
        setSwipeX(0);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (itemRef.current && !itemRef.current.contains(event.target) && swipeX !== 0) {
                setSwipeX(0);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [swipeX]);

    return (
        <>
            <div
                ref={itemRef}
                className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow-lg"
            >
                {/* Delete Button Background (revealed when swiping) */}
                <div className="absolute right-0 top-0 bottom-0 w-20 bg-red-500 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-white" />
                </div>

                {/* Main Content (swipeable) */}
                <div
                    className="relative bg-white dark:bg-gray-800 p-5 transition-transform duration-200 ease-out cursor-pointer"
                    style={{
                        transform: `translateX(${swipeX}px)`,
                        transition: isDeleting ? 'opacity 0.3s ease-out' : 'none',
                        opacity: isDeleting ? 0 : 1,
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    onClick={handleClick}
                >
                    {/* Top row: date + book count + edit button + chevron */}
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(scan.created_at).toLocaleDateString()} •
                            {new Date(scan.created_at).toLocaleTimeString()}
                        </p>
                        <div className="flex items-center gap-1.5">
                            <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                {i18n.t('history.books', { count: books.length })}
                            </span>
                            {/* Edit Button */}
                            {onEdit && (
                                <button
                                    onClick={handleEditClick}
                                    className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title={i18n.t('editBooks.editThisScan')}
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                        </div>
                    </div>

                    {/* Top rated book highlight */}
                    {topRatedBook && (
                        <div className="flex items-center gap-2 mb-2">
                            {topRatedBook.thumbnail && (
                                <img
                                    src={topRatedBook.thumbnail}
                                    alt={topRatedBook.title}
                                    className="w-8 h-12 object-cover rounded shadow-sm"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                                    {topRatedBook.title}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-600 dark:text-gray-300">
                                        {topRatedBook.rating > 0 ? topRatedBook.rating.toFixed(1) : 'N/A'}
                                    </span>
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                        {i18n.t('history.topRated')}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Book title tags */}
                    <div className="flex gap-2 flex-wrap">
                        {books.slice(0, 3).map((book, idx) => (
                            <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                {book.title}
                            </span>
                        ))}
                        {books.length > 3 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{books.length - 3} {i18n.t('common.more')}
                            </span>
                        )}
                    </div>

                    {/* Reading list match indicator */}
                    {onListCount > 0 && (
                        <div className="mt-2 flex items-center gap-1">
                            <BookOpen className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                {i18n.t('history.matchesFound', { count: onListCount })}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCancelDelete}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">{i18n.t('history.deleteConfirmTitle')}</h3>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{i18n.t('history.deleteConfirmMessage')}</p>
                        <div className="flex gap-3">
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors active:scale-95"
                            >
                                {i18n.t('common.delete')}
                            </button>
                            <button
                                onClick={handleCancelDelete}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors active:scale-95"
                            >
                                {i18n.t('common.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default SwipeableScanItem;