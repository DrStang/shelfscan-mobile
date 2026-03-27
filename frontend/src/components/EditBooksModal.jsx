import React, { useState, useRef } from 'react';
import { X, Search, ScanBarcode as Barcode, Plus, Trash2, Edit3, Loader2, Check, AlertCircle, BookOpen } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import i18n from "./../utils/i18n";
import BarcodeScanner from './BarcodeScanner';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function EditBooksModal({ books, onSave, onClose, userId }) {
    const [editableBooks, setEditableBooks] = useState(
        books.map((book, idx) => ({ ...book, _editId: idx }))
    );
    const [editingIndex, setEditingIndex] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editAuthor, setEditAuthor] = useState('');
    const [editIsbn, setEditIsbn] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [addTitle, setAddTitle] = useState('');
    const [addAuthor, setAddAuthor] = useState('');
    const [addIsbn, setAddIsbn] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupError, setLookupError] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
    // Track whether barcode scan is for editing an existing book or adding a new one
    const [barcodeScanContext, setBarcodeScanContext] = useState(null); // { mode: 'edit', index } or { mode: 'add' }
    const addTitleRef = useRef(null);
    const editTitleRef = useRef(null);

    const startEditing = (index) => {
        const book = editableBooks[index];
        setEditingIndex(index);
        setEditTitle(book.title);
        setEditAuthor(book.author || '');
        setEditIsbn(book.isbn || '');
        setLookupError('');
        Haptics.impact({ style: ImpactStyle.Light });
        setTimeout(() => editTitleRef.current?.focus(), 100);
    };

    const cancelEditing = () => {
        setEditingIndex(null);
        setEditTitle('');
        setEditAuthor('');
        setEditIsbn('');
        setLookupError('');
    };

    const confirmEdit = async (index) => {
        if (!editTitle.trim()) {
            setLookupError(i18n.t('editBooks.titleRequired'));
            return;
        }

        setLookupLoading(true);
        setLookupError('');

        try {
            const response = await fetch(`${API_URL}/api/lookup-book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: editTitle.trim(),
                    author: editAuthor.trim(),
                    isbn: editIsbn.trim(),
                    userId: userId
                })
            });

            const data = await response.json();
            const newBook = data.book;

            if (newBook) {
                const updated = [...editableBooks];
                updated[index] = { ...newBook, _editId: editableBooks[index]._editId };
                setEditableBooks(updated);
                setHasChanges(true);
                setEditingIndex(null);
                setEditTitle('');
                setEditAuthor('');
                setEditIsbn('');
                await Haptics.notification({ type: NotificationType.Success });
            } else {
                setLookupError(i18n.t('editBooks.bookNotFound'));
            }
        } catch (err) {
            console.error('Lookup error:', err);
            setLookupError(i18n.t('editBooks.lookupFailed'));
        } finally {
            setLookupLoading(false);
        }
    };

    const removeBook = async (index) => {
        await Haptics.impact({ style: ImpactStyle.Medium });
        const updated = editableBooks.filter((_, i) => i !== index);
        setEditableBooks(updated);
        setHasChanges(true);
        if (editingIndex === index) {
            cancelEditing();
        }
    };

    const addBook = async () => {
        if (!addTitle.trim()) {
            setLookupError(i18n.t('editBooks.titleRequired'));
            return;
        }

        setLookupLoading(true);
        setLookupError('');

        try {
            const response = await fetch(`${API_URL}/api/lookup-book`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: addTitle.trim(),
                    author: addAuthor.trim(),
                    isbn: addIsbn.trim(),
                    userId: userId
                })
            });

            const data = await response.json();
            const newBook = data.book;

            if (newBook) {
                const updated = [...editableBooks, { ...newBook, _editId: Date.now() }];
                setEditableBooks(updated);
                setHasChanges(true);
                setAddTitle('');
                setAddAuthor('');
                setAddIsbn('');
                setShowAddForm(false);
                await Haptics.notification({ type: NotificationType.Success });
            } else {
                setLookupError(i18n.t('editBooks.bookNotFound'));
            }
        } catch (err) {
            console.error('Add book error:', err);
            setLookupError(i18n.t('editBooks.lookupFailed'));
        } finally {
            setLookupLoading(false);
        }
    };

    // Handle barcode scan result - inserts or replaces depending on context
    const handleBarcodeScanComplete = (scannedBooks) => {
        if (!scannedBooks || scannedBooks.length === 0) return;

        const scannedBook = scannedBooks[0];

        if (barcodeScanContext?.mode === 'edit' && barcodeScanContext.index != null) {
            // Replace the book being edited
            const updated = [...editableBooks];
            const editId = updated[barcodeScanContext.index]._editId;
            updated[barcodeScanContext.index] = { ...scannedBook, _editId: editId };
            setEditableBooks(updated);
            setEditingIndex(null);
            setEditTitle('');
            setEditAuthor('');
            setEditIsbn('');
        } else {
            // Add as a new book
            const updated = [...editableBooks, { ...scannedBook, _editId: Date.now() }];
            setEditableBooks(updated);
            setShowAddForm(false);
            setAddTitle('');
            setAddAuthor('');
            setAddIsbn('');
        }

        setHasChanges(true);
        setShowBarcodeScanner(false);
        setBarcodeScanContext(null);
    };

    const openBarcodeForEdit = (index) => {
        setBarcodeScanContext({ mode: 'edit', index });
        setShowBarcodeScanner(true);
    };

    const openBarcodeForAdd = () => {
        setBarcodeScanContext({ mode: 'add' });
        setShowBarcodeScanner(true);
    };

    const handleSave = async () => {
        setSaving(true);
        setLookupLoading('');
        try {
            const cleanBooks = editableBooks.map(({ _editId, ...book }) => book);
            cleanBooks.sort((a, b) => {
                if (b.rating !== a.rating) return b.rating - a.rating;
                return b.ratingsCount - a.ratingsCount;
            });

            await onSave(cleanBooks);
            await Haptics.notification({ type: NotificationType.Success });
        } catch (err) {
            console.error('Save error:', err);
            setLookupError(err.message || i18n.t('editBooks.saveFailed'));
            await Haptics.notification({ type: NotificationType.Error });
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div
                className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 overflow-y-auto pt-4 pb-8 px-4"
                onClick={onClose}
            >
                <div
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden"
                    style={{ marginTop: 'max(1rem, env(safe-area-inset-top))' }}
                    onClick={e => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Edit3 className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600 dark:text-indigo-400" />
                                <div>
                                    <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">{i18n.t('editBooks.title')}</h2>
                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                        {i18n.t('editBooks.subtitle', { count: editableBooks.length })}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Book List */}
                    <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto">
                        {editableBooks.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                                <p>{i18n.t('editBooks.noBooksInScan')}</p>
                                <p className="text-sm mt-1">{i18n.t('editBooks.addBookHint')}</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {editableBooks.map((book, index) => (
                                    <div key={book._editId} className="group">
                                        {editingIndex === index ? (
                                            <div className="border-2 border-indigo-300 dark:border-indigo-500 rounded-lg p-4 bg-indigo-50 dark:bg-gray-700">
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">{i18n.t('editBooks.bookTitle')}</label>
                                                        <input
                                                            ref={editTitleRef}
                                                            type="text"
                                                            value={editTitle}
                                                            onChange={e => setEditTitle(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && confirmEdit(index)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
                                                            placeholder={i18n.t('editBooks.bookTitlePlaceholder')}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">{i18n.t('editBooks.authorOptional')}</label>
                                                        <input
                                                            type="text"
                                                            value={editAuthor}
                                                            onChange={e => setEditAuthor(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && confirmEdit(index)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
                                                            placeholder={i18n.t('editBooks.authorPlaceholder')}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">{i18n.t('editBooks.isbnOptional')}</label>
                                                        <input
                                                            type="text"
                                                            value={editIsbn}
                                                            onChange={e => setEditIsbn(e.target.value)}
                                                            onKeyDown={e => e.key === 'Enter' && confirmEdit(index)}
                                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:text-gray-100"
                                                            placeholder={i18n.t('editBooks.isbnPlaceholder')}
                                                        />
                                                    </div>

                                                    {lookupError && (
                                                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                                            <span>{lookupError}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => confirmEdit(index)}
                                                            disabled={lookupLoading}
                                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            {lookupLoading ? (
                                                                <><Loader2 className="w-4 h-4 animate-spin" />{i18n.t('editBooks.lookingUp')}</>
                                                            ) : (
                                                                <><Search className="w-4 h-4" />{i18n.t('editBooks.lookUpReplace')}</>
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => openBarcodeForEdit(index)}
                                                            disabled={lookupLoading}
                                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                                        >
                                                            <Barcode className="w-4 h-4" />
                                                            {i18n.t('editBooks.replaceByBarcode')}
                                                        </button>
                                                        <button
                                                            onClick={cancelEditing}
                                                            disabled={lookupLoading}
                                                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
                                                        >
                                                            {i18n.t('common.cancel')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-indigo-200 dark:hover:border-indigo-500 transition-colors">
                                                {book.thumbnail ? (
                                                    <img src={book.thumbnail} alt={book.title} className="w-10 h-14 sm:w-12 sm:h-16 object-cover rounded shadow-sm flex-shrink-0" />
                                                ) : (
                                                    <div className="w-10 h-14 sm:w-12 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded shadow-sm flex-shrink-0 flex items-center justify-center">
                                                        <BookOpen className="w-5 h-5 text-gray-300 dark:text-gray-500" />
                                                    </div>
                                                )}

                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm sm:text-base truncate">{book.title}</h4>
                                                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{book.author || i18n.t('editBooks.unknownAuthor')}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        {book.rating > 0 && (
                                                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">★ {book.rating.toFixed(1)}</span>
                                                        )}
                                                        {book.inReadingList && (
                                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{i18n.t('editBooks.inReadingList')}</span>
                                                        )}
                                                        {book.manualEntry && (
                                                            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{i18n.t('editBooks.manualEntry')}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                    <button
                                                        onClick={() => startEditing(index)}
                                                        className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title={i18n.t('editBooks.editThisBook')}
                                                    >
                                                        <Edit3 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => removeBook(index)}
                                                        className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                                        title={i18n.t('editBooks.removeThisBook')}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Add Book Section */}
                        {showAddForm ? (
                            <div className="mt-4 border-2 border-dashed border-green-300 dark:border-green-600 rounded-lg p-4 bg-green-50 dark:bg-gray-700">
                                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    {i18n.t('editBooks.addABook')}
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">{i18n.t('editBooks.bookTitle')}</label>
                                        <input
                                            ref={addTitleRef}
                                            type="text"
                                            value={addTitle}
                                            onChange={e => setAddTitle(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addBook()}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                                            placeholder={i18n.t('editBooks.enterBookTitle')}
                                            autoFocus
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">{i18n.t('editBooks.authorHelpsAccuracy')}</label>
                                        <input
                                            type="text"
                                            value={addAuthor}
                                            onChange={e => setAddAuthor(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addBook()}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                                            placeholder={i18n.t('editBooks.enterAuthorName')}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1 block">{i18n.t('editBooks.isbnOptional')}</label>
                                        <input
                                            type="text"
                                            value={addIsbn}
                                            onChange={e => setAddIsbn(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && addBook()}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 dark:bg-gray-800 dark:text-gray-100"
                                            placeholder={i18n.t('editBooks.isbnPlaceholder')}
                                        />
                                    </div>

                                    {lookupError && editingIndex === null && (
                                        <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                            <span>{lookupError}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <button
                                            onClick={addBook}
                                            disabled={lookupLoading}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                                        >
                                            {lookupLoading && editingIndex === null ? (
                                                <><Loader2 className="w-4 h-4 animate-spin" />{i18n.t('editBooks.lookingUp')}</>
                                            ) : (
                                                <><Search className="w-4 h-4" />{i18n.t('editBooks.lookUpAdd')}</>
                                            )}
                                        </button>
                                        <button
                                            onClick={openBarcodeForAdd}
                                            disabled={lookupLoading}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                        >
                                            <Barcode className="w-4 h-4" />
                                            {i18n.t('editBooks.replaceByBarcode')}
                                        </button>
                                        <button
                                            onClick={() => { setShowAddForm(false); setAddTitle(''); setAddAuthor(''); setAddIsbn(''); setLookupError(''); }}
                                            disabled={lookupLoading}
                                            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 transition-colors"
                                        >
                                            {i18n.t('common.cancel')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => { setShowAddForm(true); setLookupError(''); setTimeout(() => addTitleRef.current?.focus(), 100); }}
                                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:border-green-300 dark:hover:border-green-500 hover:bg-green-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                {i18n.t('editBooks.addMissingBook')}
                            </button>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                        <div className="flex gap-3">
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges || saving}
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {saving ? (
                                    <><Loader2 className="w-5 h-5 animate-spin" />{i18n.t('editBooks.saving')}</>
                                ) : (
                                    <><Check className="w-5 h-5" />{i18n.t('editBooks.saveChanges')}</>
                                )}
                            </button>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                                {i18n.t('common.cancel')}
                            </button>
                        </div>
                        {lookupError && !hasChanges && (
                            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{lookupError}</span>
                            </div>
                        )}
                        {hasChanges && !lookupError && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
                                {i18n.t('editBooks.unsavedChangesNote')}
                            </p>
                        )}
                        {hasChanges && lookupError && (
                            <div className="flex items-center justify-center gap-2 mt-2 text-sm text-red-600 dark:text-red-400">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{lookupError}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <BarcodeScanner
                show={showBarcodeScanner}
                onClose={() => {
                    setShowBarcodeScanner(false);
                    setBarcodeScanContext(null);
                }}
                onScanComplete={handleBarcodeScanComplete}
                API_URL={API_URL}
                user={{ id: userId }}
            />
        </>
    );
}

export default EditBooksModal;