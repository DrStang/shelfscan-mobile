import React, { useState, useEffect } from 'react';
import { X, Camera, Sparkles, BookOpen, ArrowRight, ArrowLeft } from 'lucide-react';

const WelcomeModal = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            title: "Welcome to Shelf Scan! 📚",
            icon: <Sparkles className="w-16 h-16 text-indigo-600 mx-auto mb-4" />,
            content: (
                <div className="text-center">
                    <p className="text-lg text-gray-700 mb-4">
                        Discover your highest-rated books in seconds
                    </p>
                    <p className="text-gray-600">
                        Scan a bookshelf and let AI find the top rated books!
                    </p>
                </div>
            )
        },
        {
            title: "How It Works",
            icon: <Camera className="w-16 h-16 text-indigo-600 mx-auto mb-4" />,
            content: (
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-indigo-600 font-bold">1</span>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">Take a Photo</p>
                            <p className="text-sm text-gray-600">Snap a pic of your bookshelf spines</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-indigo-600 font-bold">2</span>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">AI Identifies Books</p>
                            <p className="text-sm text-gray-600">Wait 15-30 seconds for magic</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-indigo-600 font-bold">3</span>
                        </div>
                        <div className="text-left">
                            <p className="font-semibold text-gray-800">See Top-Rated Books</p>
                            <p className="text-sm text-gray-600">Get instant recommendations</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            title: "Pro Tips 💡",
            icon: <Camera className="w-16 h-16 text-indigo-600 mx-auto mb-4" />,
            content: (
                <div className="space-y-3">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-left">
                        <p className="text-sm font-semibold text-green-800 mb-1">✅ Do This:</p>
                        <ul className="text-sm text-green-700 space-y-1 ml-4">
                            <li>• Good lighting</li>
                            <li>• 5-10 books per photo</li>
                            <li>• Clear, readable titles</li>
                            <li>• Hold camera steady</li>
                        </ul>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-left">
                        <p className="text-sm font-semibold text-red-800 mb-1">❌ Avoid:</p>
                        <ul className="text-sm text-red-700 space-y-1 ml-4">
                            <li>• Dim lighting or glare</li>
                            <li>• Blurry photos</li>
                            <li>• Too many books (20+)</li>
                        </ul>
                    </div>
                </div>
            )
        },
        {
            title: "Optional: Create Account 🎁",
            icon: <BookOpen className="w-16 h-16 text-indigo-600 mx-auto mb-4" />,
            content: (
                <div className="text-center">
                    <p className="text-gray-700 mb-4">
                        No account needed to scan!
                    </p>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
                        <p className="font-semibold text-indigo-800 mb-2">Free Account Unlocks:</p>
                        <ul className="text-sm text-indigo-700 space-y-2 text-left">
                            <li className="flex items-center gap-2">
                                <span className="text-indigo-600">📜</span>
                                <span>Save scan history</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-indigo-600">📚</span>
                                <span>Import Goodreads library</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-indigo-600">✨</span>
                                <span>Auto-highlight books you own</span>
                            </li>
                        </ul>
                    </div>
                    <p className="text-sm text-gray-600">
                        You can create an account anytime!
                    </p>
                </div>
            )
        }
    ];

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="relative p-6 pb-4">
                    <button
                        onClick={handleSkip}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <div className="text-center">
                        {steps[currentStep].icon}
                        <h2 className="text-2xl font-bold text-gray-800">
                            {steps[currentStep].title}
                        </h2>
                    </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 min-h-[250px]">
                    {steps[currentStep].content}
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2 mb-4">
                    {steps.map((_, index) => (
                        <div
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentStep
                                    ? 'bg-indigo-600 w-6'
                                    : 'bg-gray-300'
                            }`}
                        />
                    ))}
                </div>

                {/* Footer Buttons */}
                <div className="px-6 pb-6 flex gap-3">
                    {currentStep > 0 && (
                        <button
                            onClick={handlePrev}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                        {currentStep === steps.length - 1 ? (
                            <>
                                Start Scanning!
                                <Sparkles className="w-4 h-4" />
                            </>
                        ) : (
                            <>
                                Next
                                <ArrowRight className="w-4 h-4" />
                            </>
                        )}
                    </button>
                </div>

                {/* Skip Tutorial Link */}
                {currentStep < steps.length - 1 && (
                    <div className="text-center pb-4">
                        <button
                            onClick={handleSkip}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                        >
                            Skip tutorial
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WelcomeModal;