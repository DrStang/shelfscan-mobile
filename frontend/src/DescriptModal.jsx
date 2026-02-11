import React from 'react';
import { X } from 'lucide-react';

const DescriptModal = ({ show, onClose, book }) => {
    if (!show || !book) {
        return null;
    }

    return (
        <div
            className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col animate-scale-in"
                style={{
                    marginTop: 'max(1rem, env(safe-area-inset-top))',
                    maxHeight: 'calc(100vh - 8rem)'
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 relative">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
                        More Details
                    </h2>
                    <p className="text-xl font-semibold text-indigo-700 dark:text-indigo-400">
                        {book.title}
                    </p>
                    <p className="text-md text-gray-500 dark:text-gray-400">
                        by {book.author || 'Unknown Author'}
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {book.description?.replace(/<[^>]*>/g, '') || 'No description available.'}
                    </p>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptModal;