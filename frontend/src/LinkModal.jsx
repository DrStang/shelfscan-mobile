import React from 'react';
import { X, Share2 } from 'lucide-react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import amazonImage from './amazon.png';
import googleImage from './Google_Play_Books_icon_(2023).svg.png';
import goodreadsImage from './Goodreads_logo_2025.png';

const LinkModal = ({ show, onClose, book }) => {
    if (!show || !book) {
        return null;
    }

    const shareBook = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
        try {
            await Share.share({
                title: book.title,
                text: `Check out "${book.title}" by ${book.author} - ${book.rating ? book.rating.toFixed(1) + '★' : ''} rating!`,
                url: book.goodreadsUrl || book.amazonUrl,
                dialogTitle: 'Share this book',
            });
        } catch (err) {
            console.log('Share cancelled or failed:', err);
        }
    };

    const handleLinkClick = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
                onClick={e => e.stopPropagation()}
            >
                {/* Header with drag handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all active:scale-95"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="px-6 pb-6">
                    {/* Book Info Header */}
                    <div className="flex gap-4 mb-6">
                        {book.thumbnail ? (
                            <img
                                src={book.thumbnail}
                                alt={book.title}
                                className="w-20 h-28 object-cover rounded-lg shadow-md flex-shrink-0"
                            />
                        ) : (
                            <div className="w-20 h-28 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-gray-400 dark:text-gray-500 text-xs">No Cover</span>
                            </div>
                        )}
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-1">
                                {book.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                by {book.author || 'Unknown Author'}
                            </p>
                            {book.rating > 0 && (
                                <div className="flex items-center gap-1">
                                    <span className="text-yellow-500">★</span>
                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                        {book.rating.toFixed(1)}
                                    </span>
                                    {book.ratingsCount > 0 && (
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                            ({book.ratingsCount.toLocaleString()})
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Links Section */}
                    <div className="space-y-3 mb-6">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            View on
                        </p>

                        <div className="flex flex-wrap gap-4 items-center">
                            {book.amazonUrl && (
                                <a
                                    href={book.amazonUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"
                                >
                                    <img
                                        src={amazonImage}
                                        alt="Amazon"
                                        className="h-10 w-auto dark:brightness-110"
                                    />
                                </a>
                            )}

                            {book.goodreadsUrl && (
                                <a
                                    href={book.goodreadsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"
                                >
                                    <img
                                        src={goodreadsImage}
                                        alt="Goodreads"
                                        className="h-10 w-auto dark:brightness-110"
                                    />
                                </a>
                            )}

                            {book.infoLink && (
                                <a
                                    href={book.infoLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={handleLinkClick}
                                    className="flex items-center justify-center p-3 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95"
                                >
                                    <img
                                        src={googleImage}
                                        alt="Google Books"
                                        className="h-10 w-auto"
                                    />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Description Preview */}
                    {book.description && (
                        <div className="mb-6">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                                About
                            </p>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm line-clamp-4">
                                {book.description.replace(/<[^>]*>/g, '').substring(0, 250)}
                                {book.description.length > 250 ? '...' : ''}
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={shareBook}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-all active:scale-95"
                        >
                            <Share2 className="w-4 h-4" />
                            Share
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-all active:scale-95"
                        >
                            Done
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkModal;