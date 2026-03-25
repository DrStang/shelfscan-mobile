// ============================================================
// useShelves.js - React hook for shelf management
// Place in: frontend/src/hooks/useShelves.js
// ============================================================

import { useState, useEffect, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export function useShelves(session) {
    const [shelves, setShelves] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getHeaders = useCallback(() => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
    }), [session]);

    // Fetch all shelves
    const loadShelves = useCallback(async () => {
        if (!session?.access_token) return;
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/api/shelves`, {
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setShelves(data.shelves);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error loading shelves:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [session, getHeaders]);

    // Create a shelf
    const createShelf = useCallback(async (name, color, icon) => {
        try {
            const response = await fetch(`${API_URL}/api/shelves`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ name, color, icon }),
            });
            const data = await response.json();
            if (data.success) {
                setShelves(prev => [...prev, data.shelf]);
                return data.shelf;
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error creating shelf:', err);
            throw err;
        }
    }, [getHeaders]);

    // Update a shelf
    const updateShelf = useCallback(async (shelfId, updates) => {
        try {
            const response = await fetch(`${API_URL}/api/shelves/${shelfId}`, {
                method: 'PUT',
                headers: getHeaders(),
                body: JSON.stringify(updates),
            });
            const data = await response.json();
            if (data.success) {
                setShelves(prev => prev.map(s => s.id === shelfId ? { ...s, ...data.shelf } : s));
                return data.shelf;
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error updating shelf:', err);
            throw err;
        }
    }, [getHeaders]);

    // Delete a shelf
    const deleteShelf = useCallback(async (shelfId) => {
        try {
            const response = await fetch(`${API_URL}/api/shelves/${shelfId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setShelves(prev => prev.filter(s => s.id !== shelfId));
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error deleting shelf:', err);
            throw err;
        }
    }, [getHeaders]);

    // Add books to a shelf
    const addBooksToShelf = useCallback(async (shelfId, bookIds) => {
        try {
            const response = await fetch(`${API_URL}/api/shelves/${shelfId}/books`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({ bookIds }),
            });
            const data = await response.json();
            if (data.success) {
                // Update the book count locally
                setShelves(prev => prev.map(s =>
                    s.id === shelfId ? { ...s, bookCount: (s.bookCount || 0) + bookIds.length } : s
                ));
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error adding books to shelf:', err);
            throw err;
        }
    }, [getHeaders]);

    // Remove a book from a shelf
    const removeBookFromShelf = useCallback(async (shelfId, bookId) => {
        try {
            const response = await fetch(`${API_URL}/api/shelves/${shelfId}/books/${bookId}`, {
                method: 'DELETE',
                headers: getHeaders(),
            });
            const data = await response.json();
            if (data.success) {
                setShelves(prev => prev.map(s =>
                    s.id === shelfId ? { ...s, bookCount: Math.max(0, (s.bookCount || 0) - 1) } : s
                ));
                return data;
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            console.error('Error removing book from shelf:', err);
            throw err;
        }
    }, [getHeaders]);

    // Load on mount
    useEffect(() => {
        loadShelves();
    }, [loadShelves]);

    return {
        shelves,
        loading,
        error,
        loadShelves,
        createShelf,
        updateShelf,
        deleteShelf,
        addBooksToShelf,
        removeBookFromShelf,
    };
}