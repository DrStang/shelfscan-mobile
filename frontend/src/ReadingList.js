import React, { useState, useEffect } from 'react';
import { Upload, Book, Trash2, ClipboardPaste, Loader2, AlertCircle, PlayCircle, X, Star } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import VideoTutorialModal from './VideoTutorialModal';

function ReadingList({ isOpen, onClose }) {
  const [readingList, setReadingList] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState(null);
  const [lastImportDate, setLastImportDate] = useState(null);
  const { user, session } = useAuth();
  const [csvText, setCsvText] = useState('');
  const [pasteImporting, setPasteImporting] = useState(false);
  const [showVideoTutorial, setShowVideoTutorial] = useState(false);
  const [videoType, setVideoType] = useState('mobile');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  // Helper to detect if user is on mobile (moved up to use in initial state)
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Set default tab based on device: 'paste' for mobile, 'file' for desktop
  const [importMethod, setImportMethod] = useState(isMobile ? 'paste' : 'file');

  useEffect(() => {
    if (isOpen && user) {
      loadReadingList();
    }
  }, [isOpen, user]);

  const loadReadingList = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/api/reading-list`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load reading list');
      }

      setReadingList(data.books || []);
      setFilteredBooks(data.books || []);
      calculateStats(data.books || []);
      if (data.books && data.books.length > 0) {
        const dates = data.books
            .map(book => book.created_at)
            .filter(date => date)
            .sort((a, b) => new Date(b) - new Date(a));
        if (dates.length > 0) {
          setLastImportDate(dates[0]);
        }
      }
    } catch (err) {
      console.error('Error loading reading list:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (books) => {
    const read = books.filter(b => b.exclusive_shelf === 'read').length;
    const currentlyReading = books.filter(b => b.exclusive_shelf === 'currently-reading').length;
    const toRead = books.filter(b => b.exclusive_shelf === 'to-read').length;
    const avgRating = books
        .filter(b => b.my_rating && b.my_rating > 0)
        .reduce((sum, b, _, arr) => sum + b.my_rating / arr.length, 0);

    setStats({
      total: books.length,
      read,
      currentlyReading,
      toRead,
      avgRating: avgRating > 0 ? avgRating.toFixed(1) : 'N/A'
    });
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);

    if (filter === 'all') {
      setFilteredBooks(readingList);
    } else {
      const filtered = readingList.filter(book => book.exclusive_shelf === filter);
      setFilteredBooks(filtered);
    }
  };

  const handleFileUpload = async (e) => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/api/import-goodreads`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        await Haptics.notification({ type: NotificationType.Error });
        throw new Error(data.error || 'Failed to import');
      }

      setSuccess(`Successfully imported ${data.imported} books!`);
      await Haptics.notification({ type: NotificationType.Success });
      await loadReadingList();
      setActiveFilter('all');
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleClearList = async () => {
    await Haptics.impact({ style: ImpactStyle.Heavy });
    if (!window.confirm('Are you sure you want to clear your entire reading list? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/reading-list`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        await Haptics.notification({ type: NotificationType.Error });
        throw new Error(data.error || 'Failed to clear list');
      }

      setSuccess('Reading list cleared successfully');
      await Haptics.notification({ type: NotificationType.Success });
      setReadingList([]);
      setFilteredBooks([]);
      setStats(null);
      setActiveFilter('all');
    } catch (err) {
      console.error('Clear error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handlePasteImport = async () => {
    if (!csvText.trim()) {
      setError('Please paste CSV data');
      return;
    }

    await Haptics.impact({ style: ImpactStyle.Medium });
    setPasteImporting(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_URL}/api/import-goodreads-text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ csvText })
      });

      const data = await response.json();

      if (!response.ok) {
        await Haptics.notification({ type: NotificationType.Error });
        throw new Error(data.error || 'Failed to import');
      }

      setSuccess(`Successfully imported ${data.imported} books!`);
      await Haptics.notification({ type: NotificationType.Success });
      await loadReadingList();
      setActiveFilter('all');
      setCsvText('');
    } catch (err) {
      console.error('Import error:', err);
      setError(err.message);
    } finally {
      setPasteImporting(false);
    }
  };
  const openVideoTutorial = (type) => {
    setVideoType(type);
    setShowVideoTutorial(true);
    Haptics.impact({ style: ImpactStyle.Light });
  };

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-6">
        <div
            className="relative bg-white rounded-2xl shadow-2xl w-[min(100vw-1.5rem,64rem)] max-h-[calc(100dvh-1.5rem-env(safe-area-inset-bottom))] sm:max-h-[calc(100dvh-3rem)-env(safe-area-inset-bottom)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="px-6 pt-4 pb-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Book className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-gray-800">My Reading List</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0">
            {/* Import Section */}
            <div className="mb-6 p-2 bg-indigo-50 rounded-lg">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Import from Goodreads
                  {lastImportDate && (
                      <span className="text-sm font-normal text-gray-600 block mt-1">
                      Last imported: {new Date(lastImportDate).toLocaleDateString()}
                        {new Date() - new Date(lastImportDate) > 14 * 24 * 60 * 60 * 1000 && (
                            <span className="text-amber-600 ml-2">⚠️ Consider re-importing</span>
                        )}
                      </span>
                  )}
                </h3>

                {/*Video Tutorial Button*/}
                <button
                  onClick={() => openVideoTutorial(isMobile ? 'mobile' : 'desktop')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-indigo-300 text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors text-sm font-medium"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Watch Tutorial</span>
                  <span className="sm:hidden">Video</span>
                </button>
              </div>

              <p className="text-xs text-gray-600 mb-4">
                Due to Goodreads restrictions, your library cannot be directly connected here and must be exported. Note because of this, changes to your library will not be automatically imported. We recommend re-importing your list every 2 weeks, or sooner if your library changes frequently.
                <button
                  onClick={() => openVideoTutorial(isMobile ? 'mobile' : 'desktop')}
                  className="text-indigo-600 hover:text-indigo-700 ml-1 underline"
                >
                  Watch how →
                </button>
              </p>
                    {/* Tab Selection */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">

                {isMobile && (
                    <button
                        onClick={() => setImportMethod('paste')}
                        className={`px-4 py-2 font-medium transition-colors ${
                            importMethod === 'paste'
                                ? 'text-indigo-600 border-b-2 border-indigo-600'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                      📋 Paste Reading List CSV File
                    </button>
                )}
                <button
                    onClick={() => setImportMethod('file')}
                    className={`px-4 py-2 font-medium transition-colors ${
                        importMethod === 'file'
                            ? 'text-indigo-600 border-b-2 border-indigo-600'
                            : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  📁 Upload CSV File
                </button>
              </div>
              {/* Paste CSV Method (Mobile Only) */}
              {importMethod === 'paste' && isMobile && (
                  <>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-blue-900 mb-2">📱 How to use Paste Import:</p>
                        <button
                          onClick={() => openVideoTutorial('mobile')}
                          className="flex items-center gap-1 text-xs text-blue-700 hover:text-blue-900 font-medium"
                        >
                          <PlayCircle className="w-3.5 h-3.5" />
                          Watch
                        </button>
                      </div>
                      <ol className="text-blue-800 space-y-1 ml-4 list-decimal text-xs">
                        <li>Open <a href="https://www.goodreads.com/review/import" target="_blank" rel="noopener noreferrer" className="underline font-medium">Goodreads Export</a> in a new tab</li>
                        <li>Tap "Export Library"</li>
                        <li>Your library will open as a table in the browser</li>
                        <li>Press and hold on top of table and drag to select all the data</li>
                        <li>Release your finger and select 'copy'</li>
                        <li>Come back here and paste into the box below by holding your finger in the box and selecting 'paste'</li>
                        <li>Tap "Import from Clipboard"</li>
                      </ol>
                      <p className="text-amber-700 mt-2 text-xs">
                        💡 Make sure to copy ALL the data including the top (header) row!
                      </p>
                    </div>

                    <textarea
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder="Paste your Goodreads CSV data here..."
                        rows={8}
                        disabled={pasteImporting}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-base mb-3"
                        style={{ fontSize: '16px'}}
                    />

                    <div className="flex gap-3">
                      <button
                          onClick={handlePasteImport}
                          disabled={pasteImporting || !csvText.trim()}
                          className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {pasteImporting ? (
                            <>
                              <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                              <span>Importing...</span>
                            </>
                        ) : (
                            <>
                              <ClipboardPaste className="w-5 h-5" />
                              <span>Import from Clipboard</span>
                            </>
                        )}
                      </button>

                      {readingList.length > 0 && (
                          <button
                              onClick={handleClearList}
                              disabled={loading}
                              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                      )}
                    </div>
                  </>
              )}

              {/* File Upload Method */}
              {importMethod === 'file' && (
                  <>
                    <p className="text-sm text-gray-600 mb-4">
                      {isMobile ? (
                          <>
                            <strong>Mobile:</strong> Export on desktop and email the CSV to yourself, then download and upload it here.
                          </>
                      ) : (
                          <>
                            Export your library and upload the CSV file.
                          </>
                      )}
                      <a
                          href="https://www.goodreads.com/review/import"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-700 ml-1"
                      >
                        Get your export →
                      </a>
                    </p>

                    <div className="flex gap-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className="hidden"
                        />
                        <div className="px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                          {uploading ? (
                              <>
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                                <span>Importing...</span>
                              </>
                          ) : (
                              <>
                                <Upload className="w-5 h-5" />
                                <span>Choose CSV File</span>
                              </>
                          )}
                        </div>
                      </label>

                      {readingList.length > 0 && (
                          <button
                              onClick={handleClearList}
                              disabled={loading}
                              className="px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-5 h-5" />
                            <span className="hidden sm:inline">Clear</span>
                          </button>
                      )}
                    </div>
                  </>
              )}

              {/* Success/Error Messages */}
              {error && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error}
                  </div>
              )}
              {success && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                    {success}
                  </div>
              )}
            </div>


            {/* Stats */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                  <button
                      onClick={async() => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        handleFilterClick('all')
                      }}
                      className={`rounded-lg p-4 text-center transition-all hover:shadow-md ${
                          activeFilter === 'all' ? 'ring-2 ring-indigo-500 bg-indigo-50' : 'bg-gray-50'
                      }`}
                  >
                    <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
                    <div className="text-sm text-gray-600">Total Books</div>
                  </button>

                  <button
                      onClick={async() => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        handleFilterClick('read')
                      }}
                      className={`rounded-lg p-4 text-center transition-all hover:shadow-md ${
                          activeFilter === 'read' ? 'ring-2 ring-green-500 bg-green-100' : 'bg-green-50'
                      }`}
                  >
                    <div className="text-2xl font-bold text-green-700">{stats.read}</div>
                    <div className="text-sm text-gray-600">Read</div>
                  </button>

                  <button
                      onClick={async() => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        handleFilterClick('currently-reading')
                      }}
                      className={`rounded-lg p-4 text-center transition-all hover:shadow-md ${
                          activeFilter === 'currently-reading' ? 'ring-2 ring-blue-500 bg-blue-100' : 'bg-blue-50'
                      }`}
                  >
                    <div className="text-2xl font-bold text-blue-700">{stats.currentlyReading}</div>
                    <div className="text-sm text-gray-600">Reading</div>
                  </button>

                  <button
                      onClick={async() => {
                        await Haptics.impact({ style: ImpactStyle.Light });
                        handleFilterClick('to-read')
                      }}
                      className={`rounded-lg p-4 text-center transition-all hover:shadow-md ${
                          activeFilter === 'to-read' ? 'ring-2 ring-amber-500 bg-amber-100' : 'bg-amber-50'
                      }`}
                  >
                    <div className="text-2xl font-bold text-amber-700">{stats.toRead}</div>
                    <div className="text-sm text-gray-600">To Read</div>
                  </button>

                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-purple-700 flex items-center justify-center gap-1">
                      <Star className="w-5 h-5 fill-purple-700" />
                      {stats.avgRating}
                    </div>
                    <div className="text-sm text-gray-600">Avg Rating</div>
                  </div>
                </div>
            )}

            {/* Reading List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
            ) : readingList.length === 0 ? (
                <div className="text-center py-12">
                  <Book className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No books in your reading list yet.</p>
                  <p className="text-sm text-gray-400 mt-2">Upload your Goodreads CSV to get started!</p>
                </div>
            ) : (
                <div>
                  {activeFilter !== 'all' && (
                      <div className="mb-4 flex items-center justify-between bg-indigo-50 px-4 py-2 rounded-lg">
                        <p className="text-sm text-indigo-700">
                          Showing {filteredBooks.length} {
                          activeFilter === 'read' ? 'read' :
                              activeFilter === 'currently-reading' ? 'currently reading' :
                                  'to-read'
                        } books
                        </p>
                        <button
                            onClick={() => handleFilterClick('all')}
                            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                        >
                          Clear filter
                        </button>
                      </div>
                  )}

                  <div className="max-h-96 overflow-y-auto">
                    <div className="space-y-2">
                      {filteredBooks.map((book, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:border-indigo-300 transition-colors">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-800 truncate">{book.title}</h4>
                              <p className="text-sm text-gray-600 truncate">{book.author}</p>
                              <div className="flex items-center gap-3 mt-1">
                                {book.my_rating > 0 && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                      <span className="text-sm font-medium">{book.my_rating}</span>
                                    </div>
                                )}
                                {book.exclusive_shelf && (
                                    <span className={`text-xs px-2 py-1 rounded ${
                                        book.exclusive_shelf === 'read' ? 'bg-green-100 text-green-700' :
                                            book.exclusive_shelf === 'currently-reading' ? 'bg-blue-100 text-blue-700' :
                                                'bg-amber-100 text-amber-700'
                                    }`}>
                              {book.exclusive_shelf === 'currently-reading' ? 'Reading' :
                                  book.exclusive_shelf === 'to-read' ? 'To Read' : 'Read'}
                            </span>
                                )}
                                {book.isbn13 && (
                                    <span className="text-xs text-gray-400">ISBN: {book.isbn13}</span>
                                )}
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </div>
            )}
          </div>

          {/* Footer - Always visible at bottom of modal */}
          <div
              className="p-4 border-t border-gray-200 bg-gray-50 flex-shrink-0"
              style={{
                paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))',
                flexShrink: 0
              }}
          >
            <button
                onClick={onClose}
                className="w-full px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium shadow-sm"
            >
              Close
            </button>
          </div>
        </div>
        <VideoTutorialModal
            isOpen={showVideoTutorial}
            onClose={() => setShowVideoTutorial(false)}
            videoType={videoType}
        />
      </div>

  );
}

export default ReadingList;