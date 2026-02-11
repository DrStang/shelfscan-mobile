// offlineCache.js - Offline mode with automatic sync
import { Preferences } from '@capacitor/preferences';

const CACHE_KEYS = {
    PENDING_SCANS: 'pending_scans',
    CACHED_BOOKS: 'cached_books',
    LAST_SYNC: 'last_sync'
};

// Store a scan for later processing when offline
// Now accepts the full scan object with image, userId, etc.
export const queueScanForSync = async (scanData) => {
    try {
        const { value } = await Preferences.get({ key: CACHE_KEYS.PENDING_SCANS });
        const pending = value ? JSON.parse(value) : [];

        // Store the scan data with an ID and timestamp
        pending.push({
            id: scanData.id || Date.now().toString(),
            image: scanData.image,
            userId: scanData.userId,
            timestamp: scanData.timestamp || new Date().toISOString(),
            status: 'pending'
        });

        await Preferences.set({
            key: CACHE_KEYS.PENDING_SCANS,
            value: JSON.stringify(pending)
        });

        return pending.length;
    } catch (err) {
        console.error('Error queueing scan:', err);
        return 0;
    }
};

// Get all pending scans
export const getPendingScans = async () => {
    try {
        const { value } = await Preferences.get({ key: CACHE_KEYS.PENDING_SCANS });
        return value ? JSON.parse(value) : [];
    } catch (err) {
        console.error('Error getting pending scans:', err);
        return [];
    }
};

// Remove a specific scan from pending
export const removePendingScan = async (scanId) => {
    try {
        const { value } = await Preferences.get({ key: CACHE_KEYS.PENDING_SCANS });
        const pending = value ? JSON.parse(value) : [];

        const filtered = pending.filter(scan => scan.id !== scanId);

        await Preferences.set({
            key: CACHE_KEYS.PENDING_SCANS,
            value: JSON.stringify(filtered)
        });

        return filtered.length;
    } catch (err) {
        console.error('Error removing pending scan:', err);
        return -1;
    }
};

// Process pending scans when back online
// scanFunction should accept (imageData, userId) and return the scan result
export const processPendingScans = async (scanFunction, onProgress) => {
    try {
        let pending = await getPendingScans();

        if (pending.length === 0) {
            return { success: true, processed: 0, results: [] };
        }

        const results = [];

        for (let i = 0; i < pending.length; i++) {
            const scan = pending[i];

            try {
                onProgress?.(i + 1, pending.length, scan);

                // Process the scan - pass image and userId
                const result = await scanFunction(scan.image, scan.userId);

                results.push({
                    scanId: scan.id,
                    success: true,
                    data: result
                });

                // Remove from pending after successful processing
                await removePendingScan(scan.id);

            } catch (err) {
                console.error('Error processing scan:', err);
                results.push({
                    scanId: scan.id,
                    success: false,
                    error: err.message
                });
            }
        }

        await Preferences.set({
            key: CACHE_KEYS.LAST_SYNC,
            value: new Date().toISOString()
        });

        return {
            success: true,
            processed: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results
        };

    } catch (err) {
        console.error('Error processing pending scans:', err);
        return { success: false, error: err.message, processed: 0, results: [] };
    }
};

// Clear all pending scans
export const clearPendingScans = async () => {
    await Preferences.remove({ key: CACHE_KEYS.PENDING_SCANS });
};

// Cache book data for offline viewing
export const cacheBooks = async (books) => {
    try {
        const { value } = await Preferences.get({ key: CACHE_KEYS.CACHED_BOOKS });
        const cached = value ? JSON.parse(value) : [];

        // Merge new books with existing cache (avoid duplicates by ISBN)
        const newBooks = books.filter(book =>
            !cached.some(c => c.isbn === book.isbn && c.title === book.title)
        );

        const updated = [...cached, ...newBooks];

        // Keep only last 100 books to avoid storage limits
        const trimmed = updated.slice(-100);

        await Preferences.set({
            key: CACHE_KEYS.CACHED_BOOKS,
            value: JSON.stringify(trimmed)
        });

        return trimmed.length;
    } catch (err) {
        console.error('Error caching books:', err);
        return 0;
    }
};

// Check network status
export const isOnline = () => {
    return navigator.onLine;
};


