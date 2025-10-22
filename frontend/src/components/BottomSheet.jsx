import React, { useEffect } from 'react';
import { X } from 'lucide-react';

function BottomSheet({ isOpen, onClose, title, children, maxHeight = '90vh' }) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity animate-fade-in"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="bg-white rounded-t-3xl shadow-2xl overflow-hidden" style={{ maxHeight }}>
                    {/* Handle bar */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 bg-gray-300 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b">
                        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                        >
                            <X className="w-6 h-6 text-gray-600" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto" style={{ maxHeight: `calc(${maxHeight} - 120px)` }}>
                        <div className="px-6 py-4">
                            {children}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

export default BottomSheet;