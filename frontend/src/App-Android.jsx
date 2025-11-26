import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Book,
  Star,
  Loader2,
  Trash2,
  AlertCircle,
  X,
  Check,
  RotateCw,
  Camera,
  User,
  LogOut,
  History,
  Globe,
  BookOpen,
  Key,
  Share as ShareIcon,
  ChevronRight
} from 'lucide-react';
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
import EmptyState from "./components/EmptyState";
import { usePullToRefresh} from "./hooks/usePullToRefresh";
import DeepLinkHandler from "./DeepLinkHandler";
import PwChangeModal from "./PwChangeModal";
import WelcomeModal from "./components/WelcomeModal";
import HelpButton from "./components/HelpButton";
import Cropper from 'react-easy-crop';
import getCroppedImg from './cropImage';
import DeleteAccountModal from "./components/DeleteAccountModal";
import SwipeableScanItem from "./components/SwipeableScanItem";
import PrivacyModal from './PrivacyModal';

function App() {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [error, setError] = useState('');
  const [isNetworkError, setIsNetworkError] = useState(false);
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({x:0, y:0});
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isAppReady, setIsAppReady] = useState(!Capacitor.isNativePlatform());
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const {user, session, signOut, loading: authLoading} = useAuth();
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';


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

  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Setup StatusBar
          await StatusBar.setStyle({style: Style.Light});
          await StatusBar.setBackgroundColor({color: '#ffffff'});
          await StatusBar.setOverlaysWebView({overlay: true});

          // Small delay to let safe areas calculate
          await new Promise(resolve => setTimeout(resolve, 150));

          setIsAppReady(true);
        } catch (err) {
          console.error('App initialization error:', err);
          setIsAppReady(true); // Proceed anyway
        }
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('hasSeenWelcome', 'true');
  };

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
      setError('Please try a smaller image');
      setIsNetworkError(false);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image');
      setIsNetworkError(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageToCrop(event.target.result);
      setShowCropModal(true);
      setBooks([]);
      setError('');
      setIsNetworkError(false);
    };
    reader.onerror = () => {
      setError('Something went wrong. Please try again.');
      setIsNetworkError(false);
    };
    reader.readAsDataURL(file);
  };
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(
          imageToCrop,
          croppedAreaPixels,
          rotation
      );
      setImage(croppedImage);
      setShowCropModal(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setCroppedAreaPixels(null);
    } catch (e) {
      console.error('Error while croping image:', e);
      setError('Failed to crop image');
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setRotation(0);
    setZoom(1);
    setCroppedAreaPixels(null);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const scanBooks = async () => {
    await Haptics.impact({style: ImpactStyle.Medium});
    if (!image) return;

    setLoading(true);
    setError('');
    setIsNetworkError(false);
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
          userId: user?.id
        })
      }).catch(err => {
        // Network error - can't reach server
        setIsNetworkError(true);
        throw new Error('Check your network connection');
      });

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          throw new Error('Something went wrong. Please try again.');
        }
      } else {
        throw new Error('Something went wrong. Please try again.');
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('You\'ve scanned too many images. Please try again in a few minutes.');
        }

        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      if (data.success && data.books) {
        setBooks(data.books);
        setMatchedCount(data.matchedInReadingList || 0);
        await Haptics.notification({type: NotificationType.Success});

        // Auto-save scan for logged-in users
        if (user) {
          await saveScan(data.books);
        }

        if (data.totalProcessed < data.totalFound) {
          setError(`Found ${data.totalFound} books, but could only get ratings for ${data.totalProcessed}`);
        }
      } else {
        throw new Error('Something went wrong. Please try again.');
      }

    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Something went wrong. Please try again.');
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

  const handleDeleteAccount = async () => {
    try {
      const token = session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/delete-account`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      await signOut();
      setShowDeleteAccountModal(false);

      alert('Your account has been scheduled for deletion. All data will be permanently removed.');

    } catch (err) {
      console.error('Delete account error:', err);
      throw err;
    }
  };
  const handleDeleteScan = async (scanId) => {
    try {
      const token = session?.access_token;
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/scans/${scanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete scan');
      }

      // Remove the scan from local state
      setScanHistory(prevHistory => prevHistory.filter(scan => scan.id !== scanId));

      // Optional: Show success feedback
      console.log('Scan deleted successfully');

      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      }

    } catch (error) {
      console.error('Error deleting scan:', error);
      alert('Failed to delete scan. Please try again.');
      throw error;
    }
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
      setImageToCrop(photo.dataUrl);
      setShowCropModal(true);
      setBooks([]);
      setError('');
      setIsNetworkError(false);
    } catch (err) {
      if (err.message !== 'User cancelled photos app') {
        console.error('Camera error:', err);
        setError('Something went wrong. Please try again.');
        setIsNetworkError(false);
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
        {!isAppReady ? (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4"/>
                <p className="text-gray-600">Loading Shelf Scan...</p>
              </div>
            </div>
        ) : (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
          {/*style={{ paddingTop: 'env(safe-area-inset-top)' }}>*/}
          <div className="flex-1 overflow-hidden pb-16">
            {/* SCAN TAB */}
            {activeTab === 'scan' && (
                <div className="h-full overflow-y-auto"
                     style={{
                       WebkitOverflowScrolling: 'touch',
                       overscrollBehavior: 'contain'
                     }}>
                  <div className="max-w-6xl mt-6 mx-auto p-8 pb-8 min-h-full">
                    {/*style={{ paddingTop: 'max(5rem, env(safe-area-inset-top))' }}>*/}
                    {/* Your existing scan content - keep all of it */}
                    {/* Description text */}
                    <div className="text-center mb-6 sm:mb-8">
                      <p className="text-sm sm:text-base text-gray-600 px-4">Upload a photo of book spines to find the
                        highest-rated books.</p>
                      <p className="text-sm sm:text-base text-gray-600 px-4">Optionally register/sign-in to store your
                        scan history and to see if a scanned book is in your Goodreads reading list!</p>

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
                                    className="px-6 py-3 bg-gray-600 text-white rounded-full font-semibold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2">
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
                          <div className="mt-4 p-4 border rounded-lg flex items-start gap-3 bg-red-50 border-red-200 text-red-700">
                            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                            <p>{error}</p>
                          </div>
                      )}
                    </div>

                    {/* Help Text Disclaimer */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <span className="text-lg">📸</span>
                          <p className="text-sm text-blue-800">
                            <strong>Photo tips:</strong> Make sure book spines are clearly readable, avoid shadows and glare, and limit amount of spines included (5-10 works best!)
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-lg">❓</span>
                          <p className="text-sm text-blue-800">
                            <strong>Something wrong?</strong> Try taking the photo again or re-upload (AI is not perfect!)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Results - keep all your existing book display code */}
                    {topThreeBooks.length > 0 && (
                        <div className="space-y-6 px-4">
                          <div className="text-center py-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                              🏆 Top Rated Books
                            </h2>
                            <p className="text-gray-600 mt-1">
                              Found {books.length} books • Sorted by rating
                            </p>
                          </div>
                          {/* Keep all your existing book cards */}
                          {topThreeBooks.map((book, index) => (
                              <div
                                  key={index}
                                  className={`bg-white rounded-3xl shadow-lg overflow-hidden ${
                                      book.inReadingList ? 'ring-4 ring-emerald-400' : ''
                                  }`}
                              >
                                <div className="relative">
                                  <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 via-indigo-50 to-white" />

                                  <div className="absolute top-4 left-4 z-10">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                                        index === 0 ? 'bg-amber-400' :
                                            index === 1 ? 'bg-gray-400' :
                                                'bg-orange-400'
                                    }`}>
                                      <span className="text-white font-bold text-xl">#{index + 1}</span>
                                    </div>
                                  </div>
                                  {book.inReadingList && (
                                      <div className="absolute top-4 right-4 z-10">
                                        <div className="bg-emerald-500 text-white px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg">
                                          <BookOpen className="w-4 h-4" />
                                          On Your List
                                        </div>
                                      </div>
                                  )}
                                  <div className="relative pt-10 pb-8 flex justify-center">
                                    {book.thumbnail ? (
                                        <img
                                            src={book.thumbnail}
                                            alt={book.title}
                                            className="w-40 h-56 sm:w-48 sm:h-68 object-cover rounded-2xl shadow-2xl"
                                        />
                                    ) : (
                                        <div className="w-40 h-56 sm:w-48 sm:h-68 bg-gray-200 rounded-2xl flex items-center justify-center shadow-xl">
                                          <BookOpen className="w-16 h-16 text-gray-400"/>
                                        </div>
                                    )}
                                  </div>
                                </div>

                                <div className="px-6 pb-8 mt-2">
                                  <div className="text-center mb-5">
                                    <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                                      {book.title}
                                    </h3>
                                    <p className="text-lg text-gray-600 mt-1">by {book.author}</p>
                                  </div>

                                  <div className="flex justify-center mb-5">
                                    <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100 px-6 py-4 rounded-2xl border border-amber-200">
                                      <Star className="w-8 h-8 fill-amber-400 text-amber-400"/>
                                      <div className="text-left">
                                        <span className="text-3xl font-bold text-gray-800">
                                          {book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
                                        </span>
                                        {book.ratingsCount > 0 && (
                                            <p className="text-sm text-gray-600">
                                              {book.ratingsCount.toLocaleString()} ratings
                                            </p>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {book.ratingSource && (
                                      <p className="text-center text-sm text-gray-500 mb-5">
                                        📊 {book.ratingSource}
                                      </p>
                                  )}

                                  {/* Reading List Info */}
                                  {book.inReadingList && book.readingListInfo && (
                                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-5">
                                        <div className="flex items-center justify-center gap-2 text-emerald-800">
                                          <BookOpen className="w-5 h-5" />
                                          <span className="font-semibold">
                                            {book.readingListInfo.shelf === 'read' ? '✓ You\'ve read this!' :
                                                book.readingListInfo.shelf === 'currently-reading' ? '📖 Currently reading' :
                                                    '📚 On your to-read list'}
                                          </span>
                                          {book.readingListInfo.myRating > 0 && (
                                              <span className="ml-2">• You rated it {book.readingListInfo.myRating}★</span>
                                          )}
                                        </div>
                                      </div>
                                  )}

                                  <div className="mb-4">
                                    <p className="text-gray-700 leading-relaxed text-center">
                                      {book.description.replace(/<[^>]*>/g, '').substring(0, 200)}
                                      {book.description.length > 200 && (
                                          <>
                                            ...{' '}
                                            <button
                                                onClick={async () => {
                                                  await Haptics.impact({style: ImpactStyle.Light});
                                                  openDescriptModal(book)
                                                }}
                                                className="text-indigo-600 hover:text-indigo-800 font-semibold"
                                            >
                                              Read More
                                            </button>
                                          </>
                                      )}
                                    </p>
                                  </div>

                                  <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                      <a
                                          href={book.amazonUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 py-4 rounded-2xl transition-all active:scale-95"
                                      >
                                        <img src={amazonImage} alt="Buy on Amazon" className="h-12 w-auto" />
                                      </a>
                                      <a
                                          href={book.goodreadsUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 py-4 rounded-2xl transition-all active:scale-95"
                                      >
                                        <img src={goodreadsImage} alt="See on Goodreads" className="h-12" />
                                      </a>
                                    </div>

                                    <div className="flex gap-3">
                                      {book.infoLink && (
                                          <a
                                              href={book.infoLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-all active:scale-95"
                                          >
                                            <img src={googleImage} alt="See on Google Books" className="h-6" />
                                          </a>
                                      )}
                                      <button
                                          onClick={async() =>{
                                            Haptics.impact({style: ImpactStyle.Light});
                                            shareBook(book)
                                          }}
                                          className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl transition-all active:scale-95"
                                      >
                                        <ShareIcon className="w-5 h-5" />
                                        <span>Share</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                          ))}
                        </div>
                    )}

                    {/* Other books section - keep your existing code */}
                    {displayBooks.length > 3 && (
                        <div className="mt-8 px-4">
                          <h3 className="text-xl font-bold text-gray-900 mb-4">
                            More Books Found
                          </h3>
                          <div className="space-y-3">
                            {books.slice(3).map((book, index) => (
                                <button
                                    key={index}
                                    onClick={async () => {
                                      await Haptics.impact({style: ImpactStyle.Light});
                                      openLinkModal(book)
                                    }}
                                    className={`w-full text-left bg-white rounded-2xl shadow-sm p-4 flex gap-4 transition-all active:scale-98 hover:shadow-md ${
                                        book.inReadingList ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200' : 'border-gray-200'
                                    }`}
                                >

                                  {book.thumbnail ? (
                                      <img
                                          src={book.thumbnail}
                                          alt={book.title}
                                          className="w-16 h-24 object-cover rounded-xl shadow flex-shrink-0"
                                      />
                                  ) : (
                                      <div className="w-16 h-24 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <BookOpen className="w-6 h-6 text-gray-400"/>
                                      </div>
                                  )}

                                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <h4 className="font-bold text-gray-900 line-clamp-2">{book.title}</h4>
                                        <p className="text-sm text-gray-600">{book.author}</p>
                                      </div>
                                      {book.inReadingList && (
                                          <BookOpen className="w-5 h-5 text-emerald-600 flex-shrink-0"/>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                      <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg">
                                        <Star className="w-4 h-4 fill-amber-400 text-amber-400"/>
                                        <span className="text-sm font-bold">
                                      {book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
                                    </span>
                                      </div>
                                      {book.ratingsCount > 0 && (
                                          <span className="text-xs text-gray-500">
                                        {book.ratingsCount.toLocaleString()}
                                      </span>
                                      )}
                                    </div>
                                  </div>

                                  <ChevronRight className="w-5 h-5 text-gray-400 self-center flex-center-0" />
                                </button>
                            ))}
                            <div className="text-center mb-6 mt-2">
                              <p className="text-sm text-gray-600 mb-2 mt-2">
                                <strong className="text-gray-800">📢 Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases.
                                This means if you click on an Amazon link and make a purchase, I may receive a small commission at no extra cost to you.
                              </p>
                              <p className="text-xs text-gray-500">
                                Ratings and reviews are sourced from Google Books and Open Library.
                                This tool is not affiliated with Amazon, Goodreads, or Google.
                              </p>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
                </div>
            )}

            {/* LIBRARY TAB - Keep your existing code */}

            {activeTab === 'library' && (
                <div className="h-full overflow-y-auto"
                     style={{
                       WebkitOverflowScrolling: 'touch',
                       overscrollBehavior: 'contain'
                     }}>
                  <div className="max-w-6xl mx-auto p-8 pb-8">
                       {/*style={{ paddingTop: 'max(env(safe-area-inset-top))'}}*/}
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
                </div>
            )}

            {/* HISTORY TAB - Keep your existing code */}
            {activeTab === 'history' && (
                <div className="h-full overflow-y-auto"
                     style={{
                       WebkitOverflowScrolling: 'touch',
                       overscrollBehavior: 'contain'
                     }}>
                  <div className="max-w-6xl mx-auto p-8 pb-8">
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
                              {/* Swipe instruction hint */}
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                                <p className="text-sm text-blue-800 text-center">
                                  💡 <strong>Tip:</strong> Swipe left on any scan to delete it
                                </p>
                              </div>

                              {scanHistory.map((scan) => (
                                  <SwipeableScanItem
                                      key={scan.id}
                                      scan={scan}
                                      onDelete={handleDeleteScan}
                                  />
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
                </div>
            )}

            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
                <div className="h-full overflow-y-auto"
                     style={{
                       WebkitOverflowScrolling: 'touch',
                       overscrollBehavior: 'contain'
                     }}>
                  <div className="max-w-6xl mx-auto p-8 pb-24">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Profile</h2>

                    {user ? (
                        <div className="space-y-4">
                          {/* User Info Card */}
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

                          {/* Account Actions */}
                          <div className="space-y-3">
                            <button
                                onClick={handleSignOut}
                                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors active:scale-95"
                            >
                              Sign Out
                            </button>

                            <button
                                onClick={() => setShowDeleteAccountModal(true)}
                                className="w-full px-4 py-3 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Trash2 className="w-4 h-4" />
                              Delete Account
                            </button>
                          </div>

                          {/* Privacy Notice */}
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <p className="text-sm text-blue-800">
                              <strong>Data Privacy:</strong> You can delete individual scans by swiping left in your History,
                              or permanently delete your entire account and all associated data with the button above.
                            </p>
                          </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                          <User className="w-16 h-16 text-gray-300 mx-auto mb-4"/>
                          <p className="text-gray-600 mb-4">Sign in to access your profile and saved data</p>
                          <button
                              onClick={() => setShowAuthModal(true)}
                              className="px-6 py-3 bg-indigo-600 text-white rounded-full transition-transform active:scale-95 font-semibold hover:bg-indigo-700"
                          >
                            Sign In
                          </button>
                        </div>
                    )}

                    {/* Thank you message - VISIBLE TO EVERYONE */}
                    <div className="text-center mt-6">
                      <p className="text-sm text-gray-600">
                        Thanks for using Shelf Scan! Let us know if you have any{' '}
                        <a href="mailto:admin@shelfscan.xyz" className="text-indigo-600 hover:underline">
                          comments or suggestions
                        </a>!
                      </p>
                    </div>
                    <div className="text-center mt-6">
                      <a href="#"
                         onClick={(e) => {
                           e.preventDefault();
                           setShowPrivacyModal(true)
                         }}
                         className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                         >
                        Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
            )}

        {/* Crop Modal */}
        {showCropModal && (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
              {/* Crop Header */}
              <div className="bg-gray-900 text-white px-4 py-3 pt-safe flex justify-between items-center flex-shrink-0">
                <button
                    onClick={handleCropCancel}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-lg font-semibold">Adjust Photo</h3>
                <button
                    onClick={handleCropConfirm}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors active:scale-95"
                >
                  <Check className="w-6 h-6 text-green-400" />
                </button>
              </div>

              {/* Crop Area - Takes remaining space */}
              <div className="flex-1 relative min-h-0 overflow-hidden">
                <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={undefined} // Free aspect ratio
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    objectFit="contain"
                />
              </div>

              {/* Crop Controls - Fixed at bottom with safe area padding */}
              <div className="bg-gray-900 text-white px-4 pt-4 space-y-4 flex-shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 3.5rem)' }}>
                {/* Zoom Control */}
                <div>
                  <label className="block text-sm mb-2">Zoom</label>
                  <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => setZoom(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                {/* Rotate Button */}
                <button
                    onClick={handleRotate}
                    className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCw className="w-5 h-5" />
                  Rotate 90°
                </button>

                {/* Action Buttons */}
                <div className="flex gap-3 pb-4">
                  <button
                      onClick={handleCropCancel}
                      className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors active:scale-95 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                      onClick={handleCropConfirm}
                      className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors active:scale-95 font-semibold"
                  >
                    Use Photo
                  </button>
                </div>
              </div>
            </div>
        )}
          </div>
        </div>
      )}

        {/* Tab Bar - MUST be outside the scrolling container to stay fixed */}
        <TabBar activeTab={activeTab} onTabChange={setActiveTab}/>

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
        <PrivacyModal
          isOpen={showPrivacyModal}
          onClose={() => setShowPrivacyModal(false)}
          />
        <PwChangeModal
            isOpen={showPwChangeModal}
            onClose={() => setShowPwChangeModal(false)}
        />
        <WelcomeModal
            isOpen={showWelcome}
            onClose={handleCloseWelcome}
        />
        <DeleteAccountModal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          onConfirmDelete={handleDeleteAccount}
          userEmail={user?.email}
        />
        <HelpButton />

      </>
  );
}
export default App;