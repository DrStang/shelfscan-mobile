import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import file from './PrivacyPolicy.md';

const PrivacyModal = ({ isOpen, onClose }) => {
    const [text, setText] = useState('');

    useEffect(() => {
        fetch(file)
            .then((response) => response.text())
            .then((md) => {
                setText(md);
            });
    }, []);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/70 flex items-center justify-center p-4 z-50">
            <div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col relative animate-scale-in"
                style={{
                    marginTop: 'max(1rem, env(safe-area-inset-top))',
                    maxHeight: 'calc(100vh - 8rem)'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors z-10"
                    aria-label="Close modal"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Content */}
                <div className="p-6 sm:p-8 flex-grow overflow-y-auto prose dark:prose-invert max-w-none
                    prose-headings:text-gray-900 dark:prose-headings:text-gray-100
                    prose-p:text-gray-700 dark:prose-p:text-gray-300
                    prose-strong:text-gray-900 dark:prose-strong:text-gray-100
                    prose-a:text-indigo-600 dark:prose-a:text-indigo-400
                    prose-li:text-gray-700 dark:prose-li:text-gray-300
                    prose-hr:border-gray-200 dark:prose-hr:border-gray-700"
                >
                    <ReactMarkdown>{text}</ReactMarkdown>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto float-right px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium active:scale-95"
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyModal;