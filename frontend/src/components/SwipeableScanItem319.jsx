import React, { useState, useRef, useEffect } from 'react';
import { Trash2, ChevronRight, Star, BookOpen } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import i18n from "../utils/i18n";

function SwipeableScanItem({ scan, onDelete, onViewDetail }) {
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
                    {/* Date and Book Count Header */}
                    <div className="flex justify-between items-center mb-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(scan.created_at).toLocaleDateString('en-US',{
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })} • {new Date(scan.created_at).toLocaleTimeString('en-US',{
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                        })}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                                {i18n.t('history.books', { count: books.length })}
                            </span>
                            <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex gap-4 mb-3">
                        {avgRating > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="font-medium text-gray-700 dark:text-gray-300">
                                    {avgRating.toFixed(1)} avg
                                </span>
                            </div>
                        )}
                        {onListCount > 0 && (
                            <div className="flex items-center gap-1 text-sm">
                                <BookOpen className="w-4 h-4 text-emerald-500" />
                                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                                    {onListCount} on list
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Top Rated Book Preview */}
                    {topRatedBook && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded">
                                    #1 Rated
                                </span>
                                {topRatedBook.inReadingList && (
                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                        📚 On List
                                    </span>
                                )}
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                                {topRatedBook.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                    {topRatedBook.author}
                                </span>
                                {topRatedBook.rating > 0 && (
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {topRatedBook.rating.toFixed(1)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Book Titles Preview */}
                    <div className="flex gap-2 flex-wrap">
                        {books.slice(1, 4).map((book, idx) => (
                            <span
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-lg truncate max-w-[140px] ${
                                    book.inReadingList
                                        ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {book.title}
                            </span>
                        ))}
                        {books.length > 4 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">
                                +{books.length - 4} more
                            </span>
                        )}
                    </div>

                    {/* Tap to view hint */}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                        {i18n.t('history.tapToView')}
                    </p>
                </div>

                {/* Delete Button (appears when swiped) */}
                {swipeX < -40 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(true);
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-red-600 text-white p-3 rounded-full shadow-lg z-10"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-sm w-full p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-full flex items-center justify-center">
                                <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{i18n.t('history.deleteTitle')}</h3>
                        </div>

                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {i18n.t('history.deleteConfirmation', {date: new Date(scan.created_at).toLocaleDateString(), count: books.length})}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={handleCancelDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                            >
                                {i18n.t('common.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        {i18n.t('history.deleting')}
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-4 h-4" />
                                        {i18n.t('common.delete')}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default SwipeableScanItem;