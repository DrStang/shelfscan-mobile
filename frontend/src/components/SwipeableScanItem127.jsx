import React, { useState, useRef, useEffect } from 'react';
import { Trash2, History } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import i18n from "../utils/i18n";

function SwipeableScanItem({ scan, onDelete }) {
    const [swipeX, setSwipeX] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const touchStartX = useRef(0);
    const touchCurrentX = useRef(0);
    const itemRef = useRef(null);

    const SWIPE_THRESHOLD = -80;
    const DELETE_THRESHOLD = -120;

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
                    className="relative bg-white dark:bg-gray-800 p-6 transition-transform duration-200 ease-out"
                    style={{
                        transform: `translateX(${swipeX}px)`,
                        transition: isDeleting ? 'opacity 0.3s ease-out' : 'none',
                        opacity: isDeleting ? 0 : 1,
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(scan.created_at).toLocaleDateString('en-US',{
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })} at{' '}
                            {new Date(scan.created_at).toLocaleTimeString('en-US',{
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}
                        </p>
                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                            {i18n.t('history.books', { count: scan.books.length})}
                        </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {scan.books.slice(0, 3).map((book, idx) => (
                            <span key={idx} className="text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded">
                                {book.title}
                            </span>
                        ))}
                        {scan.books.length > 3 && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {i18n.t('history.more', { count: scan.books.length - 3})}
                            </span>
                        )}
                    </div>
                </div>

                {/* Delete Button (appears when swiped) */}
                {swipeX < -40 && (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
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
                            {i18n.t('history.deleteConfirmation', {date: new Date(scan.created_at).toLocaleDateString(), count: scan.books.length})}
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