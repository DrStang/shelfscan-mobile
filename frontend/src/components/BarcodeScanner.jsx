// BarcodeScanner.jsx - ISBN barcode scanning
import React, { useState } from 'react';
import { BarcodeScanner as CapacitorBarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Camera, X, Loader2 } from 'lucide-react';
import i18n from '../utils/i18n';

function BarcodeScanner({ show, onScanComplete, onClose, API_URL, user }) {
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Don't render if not shown
    if (!show) return null;

    const startScan = async () => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        setScanning(true);
        setError('');

        try {
            // Request camera permission
            const { camera } = await CapacitorBarcodeScanner.requestPermissions();

            if (camera === 'denied' || camera === 'restricted') {
                throw new Error(i18n.t('barcode.permissionDenied'));
            }

            // Start scanning
            const result = await CapacitorBarcodeScanner.scan({
                formats: [
                    'EAN_13', // Standard book barcode
                    'EAN_8',
                    'UPC_A',
                    'UPC_E'
                ]
            });

            if (result.barcodes && result.barcodes.length > 0) {
                const isbn = result.barcodes[0].rawValue;
                console.log('Scanned ISBN:', isbn);
                await processISBN(isbn);
            } else {
                setError(i18n.t('barcode.noBarcode'));
            }

        } catch (err) {
            console.error('Barcode scan error:', err);
            // Don't show error if user cancelled
            if (err.message !== 'User cancelled scanning') {
                setError(err.message || i18n.t('barcode.scanFailed'));
            }
        } finally {
            setScanning(false);
        }
    };

    const processISBN = async (isbn) => {
        setLoading(true);
        setError('');

        try {
            // Fetch book data by ISBN (much faster than image scanning!)
            const response = await fetch(`${API_URL}/api/scan-isbn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    isbn: isbn.replace(/[-\s]/g, ''), // Clean ISBN
                    userId: user?.id
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || i18n.t('barcode.fetchFailed'));
            }

            if (data.success && data.book) {
                await Haptics.notification({ type: NotificationType.Success });
                onScanComplete([data.book]); // Return as array for consistency
                // onClose is handled by App.jsx in onScanComplete callback
            } else {
                throw new Error(i18n.t('barcode.bookNotFound'));
            }

        } catch (err) {
            console.error('ISBN processing error:', err);
            setError(err.message || i18n.t('barcode.processFailed'));
            await Haptics.notification({ type: NotificationType.Error });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = async () => {
        await Haptics.impact({ style: ImpactStyle.Light });
        setError('');
        setScanning(false);
        setLoading(false);
        onClose();
    };

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col items-center justify-center p-6"
            style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
        >
            <button
                onClick={handleClose}
                className="absolute top-8 right-8 text-white p-3 rounded-full bg-gray-800 hover:bg-gray-700 active:scale-95 transition-transform"
                style={{ top: 'max(2rem, env(safe-area-inset-top))' }}
            >
                <X className="w-6 h-6" />
            </button>

            <div className="text-center text-white max-w-md">
                <Camera className="w-20 h-20 mx-auto mb-6 text-indigo-400" />

                <h2 className="text-3xl font-bold mb-4">{i18n.t('barcode.title')}</h2>

                <p className="text-gray-300 mb-8">
                    {i18n.t('barcode.description')}
                </p>

                {error && (
                    <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-400 rounded-lg">
                        <p className="text-red-200">{error}</p>
                    </div>
                )}

                {!scanning && !loading && (
                    <button
                        onClick={startScan}
                        className="w-full py-4 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        <Camera className="w-6 h-6" />
                        {i18n.t('barcode.startScanning')}
                    </button>
                )}

                {(scanning || loading) && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-400" />
                        <p className="text-gray-300">
                            {scanning ? i18n.t('barcode.scanning') : i18n.t('barcode.lookingUp')}
                        </p>
                    </div>
                )}

                <div className="mt-8 p-4 bg-gray-800 bg-opacity-50 rounded-lg text-left">
                    <h3 className="font-semibold mb-2 text-indigo-300">{i18n.t('barcode.tips')}</h3>
                    <ul className="text-sm text-gray-300 space-y-1">
                        <li>• {i18n.t('barcode.tip1')}</li>
                        <li>• {i18n.t('barcode.tip2')}</li>
                        <li>• {i18n.t('barcode.tip3')}</li>
                        <li>• {i18n.t('barcode.tip4')}</li>
                    </ul>
                </div>

                {/* Cancel button at bottom */}
                <button
                    onClick={handleClose}
                    className="mt-6 w-full py-3 bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-600 transition-all active:scale-95"
                >
                    {i18n.t('common.cancel')}
                </button>
            </div>
        </div>
    );
}

export default BarcodeScanner;