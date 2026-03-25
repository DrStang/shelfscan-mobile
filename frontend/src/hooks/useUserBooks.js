// ============================================================
// useUserBooks.js - React hook for user's book collection
// Place in: frontend/src/hooks/useUserBooks.js
// ============================================================

import { useState, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function useUserBooks(session) {
    const [books, setBooks] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [total, setTotal] = useState(0);

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    }), [session]);

    // Fetch books with optional filters
    const loadBooks = useCallback(async (filters = {}) => {
        if (!session?.access_token) return;
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams();
            if (filters.shelfId) params.set('shelfId', filters.shelfId);
            if (filters.search) params.set('search', filters.search);
            if (filters.minRating) params.set('minRating', filters.minRating);
            if (filters.sort) params.set('sort', filters.sort);
            if (filters.limit) params.set('limit', filters.limit);
            if (filters.offset) params.set('offset', filters.offset);
            if (filters.unshelfed) params.set('unshelfed', 'true');

            const url = `${API_URL}/api/user-books?${params.toString()}`;
            const response = await fetch(url, { headers: getHeaders() });
            const data = await response.json();

            if (data.success) {
                setBooks(data.books);
                setTotal(data.total || data.books.length);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error loading books:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session, getHeaders]);

    // Fetch collection stats
    const loadStats = useCallback(async () => {
        if (!session?.access_token) return;

        try {
            const response = await fetch(`${API_URL}/api/user-books/stats`, {
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    }, [session, getHeaders]);

    // Delete a book from collection
    const deleteBook = useCallback(async (bookId) => {
        try {
            const response = await fetch(`${API_URL}/api/user-books/${bookId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setBooks(prev => prev.filter(b => b.id !== bookId));
                setTotal(prev => prev - 1);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error deleting book:', err);
            throw err;
        }
    }, [getHeaders]);

    // Extract books from a scan into the collection
    const extractFromScan = useCallback(async (scanId) => {
        try {
            const response = await fetch(`${API_URL}/api/user-books/extract-from-scan/${scanId}`, {
                method: 'POST',
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error extracting from scan:', err);
            throw err;
        }
    }, [getHeaders]);

    return {
        books,
        stats,
        total,
        loading,
        error,
        loadBooks,
        loadStats,
        deleteBook,
        extractFromScan,
    };
}