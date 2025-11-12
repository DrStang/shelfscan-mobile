// VideoTutorialModal.js - Using Capacitor Browser (Best Mobile UX)

import React from 'react';
import { X, PlayCircle, ExternalLink } from 'lucide-react';
import { Browser } from '@capacitor/browser';

function VideoTutorialModal({ isOpen, onClose, videoType = 'mobile' }) {
    if (!isOpen) return null;

    const videos = {
        mobile: {
            title: '📱 Mobile Import Tutorial',
            description: 'Watch how to import your Goodreads library on mobile in under 45 seconds',
            youtubeId: 'NMbJxk2yeBk',
            youtubeUrl: 'https://www.youtube.com/watch?v=NMbJxk2yeBk',
            thumbnailUrl: 'https://img.youtube.com/vi/NMbJxk2yeBk/maxresdefault.jpg',
            steps: [
                'Export library on Goodreads',
                'Select and copy the table',
                'Paste into ShelfScan',
                'Done!'
            ]
        },
        desktop: {
            title: '💻 Desktop Import Tutorial',
            description: 'Quick guide to importing on desktop',
            youtubeId: 'YOUR_YOUTUBE_VIDEO_ID',
            youtubeUrl: 'https://www.youtube.com/watch?v=YOUR_YOUTUBE_VIDEO_ID',
            thumbnailUrl: 'https://img.youtube.com/vi/YOUR_YOUTUBE_VIDEO_ID/maxresdefault.jpg',
            steps: [
                'Export library on Goodreads',
                'Download CSV file',
                'Upload to ShelfScan',
                'Done!'
            ]
        }
    };

    const video = videos[videoType];

    const handleWatchVideo = async () => {
        try {
            await Browser.open({
                url: video.youtubeUrl,
                presentationStyle: 'popover' // Shows as modal on iOS
            });
        } catch (error) {
            console.error('Error opening browser:', error);
            // Fallback to regular window.open
            window.open(video.youtubeUrl, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">{video.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Video Content */}
                <div className="p-6">
                    {/* Video Thumbnail with Play Button */}
                    <div
                        onClick={handleWatchVideo}
                        className="aspect-video bg-cover bg-center rounded-lg cursor-pointer relative group overflow-hidden mb-4"
                        style={{
                            backgroundImage: `url(${video.thumbnailUrl})`,
                            backgroundSize: 'cover'
                        }}
                    >
                        {/* Dark overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-40 group-hover:bg-opacity-50 transition-opacity" />

                        {/* Play button */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-red-600 rounded-full p-6 group-hover:scale-110 transition-transform shadow-2xl">
                                <PlayCircle className="w-16 h-16 text-white" fill="white" />
                            </div>
                        </div>

                        {/* Duration badge (optional) */}
                        <div className="absolute bottom-4 right-4 bg-black bg-opacity-80 text-white text-sm px-2 py-1 rounded">
                            0:45
                        </div>
                    </div>

                    {/* Watch Button */}
                    <button
                        onClick={handleWatchVideo}
                        className="w-full mb-4 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 font-semibold shadow-md"
                    >
                        <PlayCircle className="w-5 h-5" />
                        <span>Watch Tutorial on YouTube</span>
                        <ExternalLink className="w-4 h-4" />
                    </button>

                    {/* Quick Steps Summary */}
                    <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="font-semibold text-indigo-900 mb-2">Quick Steps:</p>
                        <ol className="list-decimal ml-5 space-y-1 text-indigo-800">
                            {video.steps.map((step, index) => (
                                <li key={index}>{step}</li>
                            ))}
                        </ol>
                    </div>

                    {/* Action Button */}
                    <button
                        onClick={onClose}
                        className="w-full mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                    >
                        Got it, let's import!
                    </button>
                </div>
            </div>
        </div>
    );
}

export default VideoTutorialModal;