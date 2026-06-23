import React, { useState } from 'react';
import { HelpCircle, X, Camera, BookOpen, History, User } from 'lucide-react';
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import i18n from '../utils/i18n';

const HelpButton = () => {
    const [showHelp, setShowHelp] = useState(false);
    const platform = Capacitor.getPlatform();
    const isAndroid = platform === 'android';
    const isIOS = platform === 'ios';

    const handleOpen = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
        setShowHelp(true);
    };

    const handleClose = async () => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Light });
        }
        setShowHelp(false);
    };

    return (
        <>
            {/* Help Button - Fixed Position */}
            <button
                onClick={handleOpen}
                className="fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full shadow-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all hover:scale-110 active:scale-95 z-40 flex items-center justify-center"
                aria-label={i18n.t('help.title')}
            >
                <HelpCircle className="w-6 h-6" />
            </button>

            {/* Help Modal/Sidebar */}
            {showHelp && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-50"
                        onClick={handleClose}
                    />

                    {/* Slide-in Panel */}
                    <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl z-50 overflow-y-auto animate-slide-in-right">
                        {/* Header - Sticky with safe area */}
                        <div
                            className="sticky top-0 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-700 dark:to-indigo-800 text-white shadow-md z-10"
                            style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))', paddingBottom: '1.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-2xl font-bold mb-1">{i18n.t('help.title')}</h2>
                                    <p className="text-indigo-100 text-sm">{i18n.t('help.subtitle')}</p>
                                </div>
                                <button
                                    onClick={handleClose}
                                    className="text-white hover:text-indigo-100 transition-colors active:scale-95"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 1.5rem)' }}>
                            {/* Quick Start */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3 flex items-center gap-2">
                                    <Camera className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                    {i18n.t('help.quickStart')}
                                </h3>
                                <div className="space-y-3">
                                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600 dark:border-indigo-400 p-4 rounded">
                                        <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                            {i18n.t('help.step1Title')}
                                        </p>
                                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                            {i18n.t('help.step1Desc')}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600 dark:border-indigo-400 p-4 rounded">
                                        <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                            {i18n.t('help.step2Title')}
                                        </p>
                                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                            {i18n.t('help.step2Desc')}
                                        </p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-600 dark:border-indigo-400 p-4 rounded">
                                        <p className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                            {i18n.t('help.step3Title')}
                                        </p>
                                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                                            {i18n.t('help.step3Desc')}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Pro Tips */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                                    {i18n.t('help.proTips')}
                                </h3>
                                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-4">
                                    <p className="font-semibold text-green-800 dark:text-green-200 mb-2">
                                        {i18n.t('help.bestResults')}
                                    </p>
                                    <ul className="text-sm text-green-700 dark:text-green-300 space-y-1 ml-4">
                                        <li>• {i18n.t('help.tip1')}</li>
                                        <li>• {i18n.t('help.tip2')}</li>
                                        <li>• {i18n.t('help.tip3')}</li>
                                        <li>• {i18n.t('help.tip4')}</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Features */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                                    {i18n.t('help.optionalFeatures')}
                                </h3>
                                <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-3">
                                    <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                                        <strong>{i18n.t('help.noAccountNeeded')}</strong>
                                    </p>
                                </div>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                                    {i18n.t('help.createAccountToUnlock')}
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                                {i18n.t('help.featureScanHistory')}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {i18n.t('help.featureScanHistoryDesc')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                                {i18n.t('help.featureGoodreads')}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {i18n.t('help.featureGoodreadsDesc')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                        <User className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-semibold text-gray-800 dark:text-gray-200 text-sm">
                                                {i18n.t('help.featureLibrary')}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                                {i18n.t('help.featureLibraryDesc')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Goodreads Import - Android */}
                            {isAndroid && (
                                <section>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                                        {i18n.t('help.importGoodreads')}
                                    </h3>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-3">
                                            {i18n.t('help.importDesc')}
                                        </p>
                                        <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                                            <ol className="ml-4 space-y-1 list-decimal">
                                                <li>{i18n.t('help.importAndroid1')}</li>
                                                <li>{i18n.t('help.importAndroid2')}</li>
                                                <li>{i18n.t('help.importAndroid3')}</li>
                                                <li>{i18n.t('help.importAndroid4')}</li>
                                                <li>{i18n.t('help.importAndroid5')}</li>
                                                <li>{i18n.t('help.importAndroid6')}</li>
                                            </ol>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Goodreads Import - iOS */}
                            {isIOS && (
                                <section>
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                                        {i18n.t('help.importGoodreads')}
                                    </h3>
                                    <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
                                        <p className="text-sm text-emerald-800 dark:text-emerald-200 mb-3">
                                            {i18n.t('help.importDesc')}
                                        </p>
                                        <div className="space-y-2 text-sm text-emerald-700 dark:text-emerald-300">
                                            <ol className="ml-4 space-y-1 list-decimal">
                                                <li>{i18n.t('help.importIOS1')}</li>
                                                <li>{i18n.t('help.importIOS2')}</li>
                                                <li>{i18n.t('help.importIOS3')}</li>
                                                <li>{i18n.t('help.importIOS4')}</li>
                                                <li>{i18n.t('help.importIOS5')}</li>
                                                <li>{i18n.t('help.importIOS6')}</li>
                                                <li>{i18n.t('help.importIOS7')}</li>
                                            </ol>
                                        </div>
                                    </div>
                                </section>
                            )}

                            {/* Troubleshooting */}
                            <section>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
                                    {i18n.t('help.troubleshooting')}
                                </h3>
                                <div className="space-y-3 text-sm">
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {i18n.t('help.troubleNotRecognized')}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {i18n.t('help.troubleNotRecognizedDesc')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {i18n.t('help.troubleWrongResults')}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {i18n.t('help.troubleWrongResultsDesc')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {i18n.t('help.troubleNetwork')}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {i18n.t('help.troubleNetworkDesc')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800 dark:text-gray-200">
                                            {i18n.t('help.troubleTooMany')}
                                        </p>
                                        <p className="text-gray-600 dark:text-gray-400">
                                            {i18n.t('help.troubleTooManyDesc')}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            {/* Contact */}
                            <section className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                                    {i18n.t('help.needMoreHelp')}{' '}
                                    <a
                                        href="mailto:admin@shelfscan.xyz"
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold"
                                    >
                                        {i18n.t('help.contactUs')}
                                    </a>
                                </p>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default HelpButton;