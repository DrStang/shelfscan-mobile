import React, { useState, useEffect } from 'react';
import { Upload, Book, Star, Loader2, AlertCircle, Camera, User, LogOut, History, Globe, BookOpen, Key , Share as ShareIcon } from 'lucide-react';
import { useAuth } from './AuthContext';
import AuthModal from './AuthModal';
import ReadingList from './ReadingList';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor} from "@capacitor/core";
import { supabase } from './supabaseClient';
import { Camera as CapacitorCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import LinkModal from './LinkModal';
import DescriptModal from './DescriptModal';
import TabBar from './components/TabBar';
import amazonImage from './amazon.png';
import googleImage from './Google_Play_Books_icon_(2023).svg.png';
import goodreadsImage from './Goodreads_logo_2025.png';
import { Share as CapacitorShare } from '@capacitor/share';
import BottomSheet from './components/BottomSheet';
import EmptyState from "./components/EmptyState";
import { usePullToRefresh} from "./hooks/usePullToRefresh";
import DeepLinkHandler from "./DeepLinkHandler";
import PwChangeModal from "./PwChangeModal";

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [rateLimitError, setRateLimitError] = useState(false);
  const [backendStatus, setBackendStatus] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReadingList, setShowReadingList] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showDescriptModal, setShowDescriptModal] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [savingScan, setSavingScan] = useState(false);
  const [showOnlyMatches, setShowOnlyMatches] = useState(false);
  const [matchedCount, setMatchedCount] = useState(0);
  const [activeTab, setActiveTab] = useState('scan');
  const [showPwChangeModal, setShowPwChangeModal] = useState(false);

  const {user, signOut, loading: authLoading} = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';


  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_URL}/api/health`);
        const data = await response.json();
        if (data.status === 'ok') {
          setBackendStatus('connected');
        } else {
          setBackendStatus('error');
        }
      } catch (err) {
        setBackendStatus('disconnected');
      }
    };
    checkBackend();
  }, [API_URL]);

  // Load scan history when user logs in
  useEffect(() => {
    if (user) {
      loadScanHistory();
      setShowAuthModal(false);
    } else {
      setScanHistory([]);
    }
  }, [user]);

  useEffect(() => {
    const setupStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        // Set status bar style
        await StatusBar.setStyle({style: Style.Light});

        // Set status bar background color to match your header
        await StatusBar.setBackgroundColor({color: '#ffffff'});

        // Make content go under status bar (then use safe area insets)
        await StatusBar.setOverlaysWebView({overlay: true});
      }
    };

    setupStatusBar();
  }, []);

  const loadScanHistory = async () => {
    if (!user) return;

    try {
      const {data, error} = await supabase
          .from('scans')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', {ascending: false})
          .limit(10);

      if (error) throw error;
      setScanHistory(data || []);
    } catch (err) {
      console.error('Error loading scan history:', err);
    }
  };

  const saveScan = async (booksData) => {
    if (!user) return;

    setSavingScan(true);
    try {
      const {error} = await supabase
          .from('scans')
          .insert({
            user_id: user.id,
            books: booksData,
            created_at: new Date().toISOString()
          });

      if (error) throw error;
      await loadScanHistory();
    } catch (err) {
      console.error('Error saving scan:', err);
    } finally {
      setSavingScan(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImageFile(file);
    }
  };

  const processImageFile = (file) => {
    if (file.size > 10 * 1024 * 1024) {
      setError('Image size must be less than 10MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target.result);
      setBooks([]);
      setError('');
      setRateLimitError(false);
    };
    reader.onerror = () => {
      setError('Failed to read image file');
    };
    reader.readAsDataURL(file);
  };

  const scanBooks = async () => {
    await Haptics.impact({style: ImpactStyle.Medium});
    if (!image) return;

    setLoading(true);
    setError('');
    setRateLimitError(false);
    setBooks([]);
    setMatchedCount(0);

    try {
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image,
          userId: user?.id  // NEW: Pass user ID for cross-reference
        })
      }).catch(err => {
        throw new Error(`Cannot connect to backend at ${API_URL}. Make sure the backend server is running.`);
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error('Backend returned invalid JSON. Check backend logs for errors.');
        }
      } else {
        const text = await response.text();
        throw new Error(`Backend error: ${text.substring(0, 200)}`);
      }

      if (!response.ok) {
        if (response.status === 429) {
          setRateLimitError(true);
          throw new Error('Too many requests. Please wait a few minutes and try again.');
        }

        throw new Error(data.error || `Server error (${response.status})`);
      }

      if (data.success && data.books) {
        setBooks(data.books);
        setMatchedCount(data.matchedInReadingList || 0);  // NEW: Store match count
        await Haptics.notification({type: NotificationType.Success});

        // Auto-save scan for logged-in users
        if (user) {
          await saveScan(data.books);
        }

        if (data.totalProcessed < data.totalFound) {
          setError(`Found ${data.totalFound} books, but could only get ratings for ${data.totalProcessed}`);
        }
      } else {
        throw new Error('Unexpected response from server');
      }

    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'An error occurred while scanning books');
      await Haptics.notification({type: NotificationType.Error});
    } finally {
      setLoading(false);
    }
  };
  const handleSignOut = async () => {
    await signOut();
    setShowHistory(false);
  };

  const displayBooks = showOnlyMatches
      ? books.filter(book => book.inReadingList)
      : books;

  const openLinkModal = (bookData) => {
    console.log("Opening modal for book:", bookData); // <--- ADD THIS LINE FOR TESTING
    setSelectedBook(bookData);
    setShowLinkModal(true);
  };
  const openDescriptModal = (bookData) => {
    setSelectedBook(bookData);
    setShowDescriptModal(true);
  };
  const takeNativePhoto = async () => {
    await Haptics.impact({style: ImpactStyle.Light});
    setLoading(true);
    try {
      const photo = await CapacitorCamera.getPhoto({
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        quality: 90,
        saveToGallery: false,
        webUseInput: false
      });

      // photo.dataUrl is already in base64 format!
      setImage(photo.dataUrl);
      setBooks([]);
      setError('');
      setRateLimitError(false);
    } catch (err) {
      if (err.message !== 'User cancelled photos app') {
        console.error('Camera error:', err);
        setError('Failed to access camera');
      }
    } finally {
      setLoading(false);
    }
  };

// Add this function in your App component
  const shareBook = async (book) => {
    await Haptics.impact({ style: ImpactStyle.Light });

    try {
      await CapacitorShare.share({
        title: book.title,
        text: `Check out "${book.title}" by ${book.author} - ${book.rating}★ rating!`,
        url: book.goodreadsUrl,
        dialogTitle: 'Share this book',
      });
    } catch (err) {
      console.log('Share cancelled or failed:', err);
    }
  };
  const handleRefresh = async () => {
    await Haptics.impact({ style: ImpactStyle.Medium });
    await loadScanHistory();
  };
  const { pulling, pullDistance } = usePullToRefresh(handleRefresh);


  const topThreeBooks = displayBooks.slice(0, 3);

  return (
      <>
        <DeepLinkHandler/>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col"
              style={{ paddingTop: 'max(5rem, env(safe-area-inset-top))' }}>
          <div className="flex-1 pb-20"
                style= {{
                overflow: 'auto',
                 WebkitOverflowScrolling: 'touch',
                 touchAction: 'pan-y',
                 overscrollBehavior: 'contain'
                 }}
                 >
              {/* SCAN TAB */}
              {activeTab === 'scan' && (
                    <div className="max-w-6xl mx-auto p-8 pb-24 min-h-full"
                          style={{ paddingTop: 'max(5rem, env(safe-area-inset-top))' }}>
                      {/* Your existing scan content - keep all of it */}
                      {/* Description text */}
                      <div className="text-center mb-6 sm:mb-8">
                        <p className="text-sm sm:text-base text-gray-600 px-4">Upload a photo of book spines to find the
                          highest-rated books.</p>
                        <p className="text-sm sm:text-base text-gray-600 px-4">Optionally register/sign-in to store your
                          scan history and to see if a scanned book is in your Goodreads reading list!</p>

                        {backendStatus && (
                            <div className="mt-3 flex items-center justify-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                  backendStatus === 'connected' ? 'bg-green-500' :
                                      backendStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <span className="text-sm text-gray-500">
                        Backend: {backendStatus === 'connected' ? 'Connected' :
                                  backendStatus === 'disconnected' ? `Not reachable at ${API_URL}` : 'Error'}
                      </span>
                            </div>
                        )}

                        {savingScan && (
                            <div className="mt-2 text-sm text-indigo-600">
                              💾 Saving scan to your library...
                            </div>
                        )}
                      </div>

                      {/* Match notification */}
                      {user && matchedCount > 0 && (
                          <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-8">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <BookOpen className="w-5 h-5 text-emerald-600"/>
                                <span className="font-semibold text-emerald-800">
                          Found {matchedCount} book{matchedCount !== 1 ? 's' : ''} from your reading list!
                        </span>
                              </div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={showOnlyMatches}
                                    onChange={(e) => setShowOnlyMatches(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded"
                                />
                                <span className="text-sm font-medium text-emerald-700">Show only my books</span>
                              </label>
                            </div>
                          </div>
                      )}

                      {/* Upload area - your existing code */}
                      <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                        {/* Keep all your existing upload/camera UI */}
                        <div className="flex flex-col items-center gap-4">
                          <label className="w-full cursor-pointer">
                            <div
                                className="border-4 border-dashed border-indigo-200 rounded-lg p-12 text-center hover:border-indigo-400 transition-colors">
                              {image ? (
                                  <img src={image} alt="Uploaded books" className="max-h-96 mx-auto rounded-lg"/>
                              ) : (
                                  <div className="flex flex-col items-center gap-3">
                                    <Upload className="w-16 h-16 text-indigo-400"/>
                                    <p className="text-lg text-gray-600">Click to upload or take a photo</p>
                                    <p className="text-sm text-gray-400">JPG, PNG up to 10MB</p>
                                  </div>
                              )}
                            </div>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                          </label>

                          {!image && (
                              <div className="flex gap-3 w-full max-w-md">
                                <button
                                    onClick={takeNativePhoto}
                                    className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-full transition-transform active:scale-95 font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2"
                                >
                                  <Camera className="w-5 h-5"/>
                                  Take Photo
                                </button>

                                <label className="flex-1 cursor-pointer">
                                  <div
                                      className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
                                    <Upload className="w-5 h-5"/>
                                    Upload File
                                  </div>
                                  <input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleImageUpload}
                                      className="hidden"
                                  />
                                </label>
                              </div>
                          )}

                          {image && (
                              <div className="flex gap-3">
                                <button
                                    onClick={scanBooks}
                                    disabled={loading}
                                    className="px-8 py-3 bg-indigo-600 text-white rounded-full font-semibold hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-transform"
                                >
                                  {loading ? (
                                      <>
                                        <Loader2 className="w-5 h-5 animate-spin"/>
                                        Scanning Books...
                                      </>
                                  ) : (
                                      <>
                                        <Book className="w-5 h-5"/>
                                        Scan & Rate Books
                                      </>
                                  )}
                                </button>

                                <button
                                    onClick={() => {
                                      setImage(null);
                                      setBooks([]);
                                      setError('');
                                    }}
                                    disabled={loading}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-full font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed transition-transform active:scale-95"
                                >
                                  Clear
                                </button>
                              </div>
                          )}
                        </div>

                        {error && (
                            <div className={`mt-4 p-4 border rounded-lg flex items-start gap-3 ${
                                rateLimitError
                                    ? 'bg-orange-50 border-orange-200 text-orange-700'
                                    : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                              <div>
                                <p className="font-semibold">{rateLimitError ? 'Rate Limit Reached' : 'Error'}</p>
                                <p>{error}</p>
                              </div>
                            </div>
                        )}
                      </div>

                      {/* Results - keep all your existing book display code */}
                      {topThreeBooks.length > 0 && (
                          <div className="space-y-6">
                            <h2 className="text-3xl font-bold text-gray-800 text-center mb-6">
                              🏆 Top 3 Highest-Rated Books
                            </h2>
                            {/* Keep all your existing book cards */}
                            {topThreeBooks.map((book, index) => (
                                <div key={index}
                                     className={`bg-white rounded-2xl shadow-sm mx-4 mb-4 overflow-hidden active:scale-95 transition-transform ${
                                         book.inReadingList ? 'ring-4 ring-emerald-400' : ''
                                     }`}>
                                  <div className="flex gap-6 p-6">
                                    {book.thumbnail && (
                                        <img
                                            src={book.thumbnail}
                                            alt={book.title}
                                            className="w-32 h-48 object-cover rounded-lg shadow-md"
                                        />
                                    )}

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-3">
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span
                                                className="text-2xl sm:text-3xl font-bold text-indigo-600">#{index + 1}</span>
                                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{book.title}</h3>
                                          </div>
                                          <p className="text-base sm:text-lg text-gray-600 mb-2">by {book.author}</p>
                                        </div>
                                      </div>
                                      {/* Reading List Badge - ADD THIS */}
                                      {book.inReadingList && (
                                          <div
                                              className="mb-4 inline-flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-lg border border-emerald-300">
                                            <BookOpen className="w-5 h-5"/>
                                            <div>
                                              <span className="font-bold">📚 On Your Reading List!</span>
                                              {book.readingListInfo && (
                                                  <div className="text-sm mt-1">
                                                    Shelf: <span
                                                      className="capitalize">{book.readingListInfo.shelf?.replace('-', ' ')}</span>
                                                    {book.readingListInfo.myRating && (
                                                        <span> • Your Rating: {book.readingListInfo.myRating}★</span>
                                                    )}
                                                  </div>
                                              )}
                                            </div>
                                          </div>
                                      )}

                                      <div className="flex items-center gap-4 mb-4">
                                        <div className="flex items-center gap-1">
                                          <Star className="w-6 h-6 fill-yellow-400 text-yellow-400"/>
                                          <span className="text-2xl font-bold text-gray-800">
                                    {book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
                                  </span>
                                        </div>
                                        {book.ratingsCount > 0 && (
                                            <span className="text-gray-500">
                                    ({book.ratingsCount.toLocaleString()} ratings)
                                  </span>
                                        )}
                                      </div>

                                      {book.ratingSource && (
                                          <div
                                              className="mb-4 text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg inline-block">
                                            📊 Rating from: {book.ratingSource}
                                          </div>
                                      )}

                                      <div className="mb-4">
                                        <p className="text-gray-700 leading-relaxed">
                                          {book.description.replace(/<[^>]*>/g, '').substring(0, 150)}
                                          {book.description.length > 150 && (
                                              <>
                                                ...{' '}
                                                <button
                                                    onClick={async () => {
                                                      await Haptics.impact({style: ImpactStyle.Light});
                                                      openDescriptModal(book)
                                                    }}
                                                    className="min-h-[44px]text-blue-600 hover:text-blue-800 underline font-medium cursor-pointer touch-manipulation transition-transform active:scale-95"
                                                >
                                                  More
                                                </button>
                                              </>
                                          )}
                                        </p>

                                      </div>

                                      <div className="flex flex-wrap gap-4 items-center justify-start">
                                        <a
                                            href={book.amazonUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center"
                                        >
                                          <img src={amazonImage} alt="Buy on Amazon"
                                               className="h-12 w-auto sm:h-14 hover:opacity-80 transition-opacity"/>

                                        </a>
                                        {book.infoLink && (
                                            <a
                                                href={book.infoLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center"
                                            >
                                              <img src={googleImage} alt="See on Google Books"
                                                   className="h-10 w-auto sm:h-12 hover:opacity-80 transition-opacity"/>
                                              {/* className="inline-flex items-center justify-center px-2 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-medium min-h-[36px] text-xs sm:text-sm sm:px-4 sm:py-2"

                                  >
                                    Google → */}
                                            </a>
                                        )}
                                        {book.goodreadsUrl && (
                                            <a
                                                href={book.goodreadsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center"
                                            >
                                              <img src={goodreadsImage} alt="See on Goodreads"
                                                   className="h-10 w-auto sm:h-12 hover:opacity-80 transition-opacity"/>
                                              {/* className="inline-flex items-center justify-center px-2 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors font-medium min-h-[36px] text-xs sm:text-sm sm:px-4 sm:py-2"
                                    >
                                    Goodreads → */}
                                            </a>
                                        )}
                                        <button
                                          onClick={async() =>{
                                            Haptics.impact({style: ImpactStyle.Light});
                                            shareBook(book)
                                          }}
                                          className="inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-transform active:scale-95 font-medium"
                                        >
                                          <ShareIcon className="w-4 h-4 mr-2" />
                                          Share
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                            ))}
                          </div>
                      )}

                      {/* Other books section - keep your existing code */}
                      {books.length > 3 && (
                          <div className="mt-8 bg-white rounded-xl shadow-lg p-6 active:scale-95 transition-transform">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">Other Books Found</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {books.slice(3).map((book, index) => (
                                  <div
                                      key={index}
                                      className={`flex gap-3 p-4 border rounded-lg hover:border-indigo-300 transition-colors ${
                                          book.inReadingList ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'border-gray-200'
                                      }`}
                                      onClick={async () => {
                                        await Haptics.impact({style: ImpactStyle.Light});
                                        openLinkModal(book)
                                      }}
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-start justify-between">
                                        <h4 className="font-semibold text-gray-800">{book.title}</h4>
                                        {book.inReadingList && (
                                            <BookOpen className="w-4 h-4 text-emerald-600 flex-shrink-0 ml-2"/>
                                        )}
                                      </div>
                                      <p className="text-sm text-gray-600">{book.author}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400"/>
                                        <span className="text-sm font-medium">
                                  {book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
                                </span>
                                        {book.ratingsCount > 0 && (
                                            <span className="text-xs text-gray-500">({book.ratingsCount})</span>
                                        )}
                                        {book.sources && book.sources.length > 0 && (
                                            <span className="text-xs text-gray-400 ml-1">
                                    • {book.sources.join('+')}
                                  </span>
                                        )}
                                      </div>
                                      {/* NEW: Show shelf for matched books */}
                                      {book.inReadingList && book.readingListInfo && (
                                          <div className="text-xs text-emerald-700 mt-1 font-medium">
                                            {book.readingListInfo.shelf?.replace('-', ' ')}
                                          </div>
                                      )}
                                    </div>
                                  </div>

                              ))}
                            </div>
                          </div>
                      )}
                    </div>

              )}

              {/* LIBRARY TAB - Keep your existing code */}

              {activeTab === 'library' && (
                  <div className="max-w-6xl mx-auto p-8 pb-24 min-h-full"
                        style={{ paddingTop: 'max(5rem, env(safe-area-inset-top))'}}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">My Reading List</h2>
                    {user ? (
                        <ReadingList isOpen={true} onClose={() => setActiveTab('scan')}/>
                    ) : (
                        <EmptyState
                            type="library"
                            onAction={() => setShowAuthModal(true)}
                            actionLabel="Sign In"
                        />
                    )}
                  </div>
              )}

              {/* HISTORY TAB - Keep your existing code */}
              {activeTab === 'history' && (
                  <div className="max-w-6xl mx-auto p-8 pb-24 min-h-full"
                        style={{ paddingTop: 'max(5rem, env(safe-area-inset-top))'}}>
                    {pulling && pullDistance >40 && (
                        <div
                            className="fixed top-0 left-0 right-0 flex justify-center transition-all"
                            style={{
                              transform: `translateY(${Math.min(pullDistance - 40, 60)}px)`,
                              paddingTop: 'env(safe-area-inset-top)'
                            }}
                        >
                          <div className="bg-white rounded-full p-3 shadow-lg">
                            <Loader2 className={`w-6 h-6 text-indigo-600 ${pullDistance > 80 ? 'animate-spin' : ''}`} />
                          </div>
                        </div>
                    )}
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Scan History</h2>
                    {user ? (
                        scanHistory.length === 0 ? (
                            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                              <History className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                              <p className="text-gray-500">No scans yet. Start scanning books to build your history!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                              {scanHistory.map((scan) => (
                                  <div key={scan.id} className="bg-white rounded-xl shadow-lg p-6">
                                    <div className="flex justify-between items-start mb-2">
                                      <p className="text-sm text-gray-500">
                                        {new Date(scan.created_at).toLocaleDateString()} at{' '}
                                        {new Date(scan.created_at).toLocaleTimeString()}
                                      </p>
                                      <span className="text-sm font-medium text-indigo-600">
                            {scan.books.length} books
                          </span>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                      {scan.books.slice(0, 3).map((book, idx) => (
                                          <span key={idx} className="text-sm bg-gray-100 px-2 py-1 rounded">
                              {book.title}
                            </span>
                                      ))}
                                      {scan.books.length > 3 && (
                                          <span className="text-sm text-gray-500">
                              +{scan.books.length - 3} more
                            </span>
                                      )}
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                          <p className="text-gray-600 mb-4">Sign in to view your scan history</p>
                          <button
                              onClick={() => setShowAuthModal(true)}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-full transition-transform active:scale-95 font-semibold"
                          >
                            Sign In
                          </button>
                        </div>
                    )}
                  </div>
              )}

              {/* PROFILE TAB - Keep your existing code */}
              {activeTab === 'profile' && (
                  <div className="max-w-6xl mx-auto p-8 min-h-screen overflow-hidden"
                        style={{ paddingTop: 'max(5rem, env(safe-area-inset-top))' }}>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>
                    {user ? (
                        <div className="space-y-4">
                          <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                                <User className="w-8 h-8 text-indigo-600"/>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Signed in as</p>
                                <p className="font-semibold text-gray-800">{user.email}</p>
                              </div>
                            </div>

                            <div className="border-t pt-4 space-y-3">
                              <button
                                  onClick={() => setActiveTab('library')}
                                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-full flex items-center justify-between active:scale-95 transition-transform"
                              >
                                <span className="font-medium">Reading List</span>
                                <BookOpen className="w-5 h-5 text-gray-400"/>
                              </button>

                              <button
                                  onClick={() => setActiveTab('history')}
                                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-full transition-transform active:scale-95 flex items-center justify-between"
                              >
                                <span className="font-medium">Scan History</span>
                                <History className="w-5 h-5 text-gray-400"/>
                              </button>
                              <button
                                  onClick={() => setShowPwChangeModal(true)}
                                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-full flex items-center justify-between active:scale-95 transition-transform"
                              >
                                <span className="font-medium">Change Password</span>
                                <Key className="w-5 h-5 text-gray-400"/>
                              </button>
                            </div>
                          </div>

                          <button
                              onClick={handleSignOut}
                              className="w-full px-4 py-3 bg-red-100 text-red-700 rounded-full transition-transform active:scale-95 font-semibold"
                          >
                            Sign Out
                          </button>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                          <User className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                          <p className="text-gray-600 mb-4">Sign in to access your profile and saved data</p>
                          <button
                              onClick={() => setShowAuthModal(true)}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-full transition-transform active:scale-95 font-semibold"
                          >
                            Sign In
                          </button>

                        </div>
                    )}
                  </div>
              )}
          </div>
          {/* Tab Bar - OUTSIDE all conditional content */}
          <TabBar activeTab={activeTab} onTabChange={setActiveTab}/>
        </div>

        {/* Modals - outside main container */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

        <LinkModal
            show={showLinkModal}
            onClose={() => setShowLinkModal(false)}
            book={selectedBook}
        />
        <DescriptModal
            show={showDescriptModal}
            onClose={() => setShowDescriptModal(false)}
            book={selectedBook}
        />
        <PwChangeModal
            isOpen={showPwChangeModal}
            onClose={() => setShowPwChangeModal(false)}
        />
      </>
  );
}
export default App;