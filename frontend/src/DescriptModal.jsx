import React from 'react';
import { X } from 'lucide-react';

const DescriptModal = ({ show, onClose, book }) => {
    if (!show || !book) {
        return null;
    }


    return (
        <div
            className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col"
                style={{
                    marginTop: 'max(1rem, env(safe-area-inset-top))',
                    marginBottom: 'max(1rem, env(safe-area-inset-bottom))',
                }}
            >
                {/* Header - Fixed */}
                <div className="flex-shrink-0 p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex-1 pr-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-2">
                                {book.title}
                            </h2>
                            <p className="text-lg text-gray-600">
                                by {book.author || 'Unknown Author'}
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-full hover:bg-gray-100"
                            aria-label="Close modal"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <p className="text-gray-700 leading-relaxed text-base whitespace-pre-wrap">
                        {book.description.replace(/<[^>]*>/g, '')}
                    </p>
                </div>

                {/* Footer - Fixed */}
                <div className="flex-shrink-0 p-6 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 active:scale-95 transition-all font-medium"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DescriptModal;