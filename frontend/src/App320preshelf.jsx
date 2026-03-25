import React, { useState, useEffect, useCallback } from 'react';
import { Upload, WifiOff, Download, ScanBarcode as Barcode, Book, Star, Loader2, Trash2, AlertCircle, X, Check, RotateCw, Camera, User, LogOut, ChevronRight, History, Globe, BookOpen, Key , Edit3, Share as ShareIcon } from 'lucide-react';
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
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";
import i18n from "./utils/i18n";
import BarcodeScanner from './components/BarcodeScanner';
import ThemeToggle from './components/ThemeToggle';
import LanguageSelector from './components/LanguageSelector';
import { Preferences } from '@capacitor/preferences';
import ScanDetailModal from './components/ScanDetailModal';
import ExportButton from "./components/ExportButton";
import BulkExportModal from './components/BulkExportModal';
import EditBooksModal from './components/EditBooksModal';
import {
  queueScanForSync,
  processPendingScans,
  isOnline,
  getPendingScans,
  cacheBooks
} from "./utils/offlineCache";

i18n.init();

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
  const [isOffline, setIsOffline] = useState(!isOnline());
  const [pendingScans, setPendingScans] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [showScanDetailModal, setShowScanDetailModal] = useState(false);
  const [selectedScan, setSelectedScan] = useState(null);
  const [lastScanDate, setLastScanDate] = useState(null);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingScanId, setEditingScanId] = useState(null);
  const [editingHistoryBooks, setEditingHistoryBooks] = useState(null);

  const {user, session, signOut, loading: authLoading} = useAuth();
  const { isDark } = useTheme();
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
        // Set status bar style based on theme
        await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
        // Set status bar background color to match your header
        await StatusBar.setBackgroundColor({ color: isDark ? '#1f2937' : '#ffffff' });
        // Make content go under status bar (then use safe area insets)
        await StatusBar.setOverlaysWebView({overlay: true});
      }
    };

    setupStatusBar();
  }, [isDark]);

  useEffect(() => {
    const initializeApp = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Setup StatusBar
          await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light });
          await StatusBar.setBackgroundColor({ color: isDark ? '#1f2937' : '#ffffff' });
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
  }, [isDark]);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

// COMPLETE REPLACEMENT for your online/offline useEffect in App.jsx
// Find your existing useEffect that handles 'online' and 'offline' events
// (around lines 137-169) and replace the ENTIRE thing with this:

  useEffect(() => {
    const handleOnline = async () => {
      console.log('📶 Coming back online...');
      setIsOffline(false);
      await Haptics.notification({ type: NotificationType.Success });

      const pending = await getPendingScans();
      console.log(`Found ${pending.length} pending scans to process`);

      if (pending.length > 0) {
        setSyncing(true);

        let lastSuccessfulResult = null;
        let processedCount = 0;
        let failedCount = 0;

        // Process each pending scan
        for (let i = 0; i < pending.length; i++) {
          const scan = pending[i];
          console.log(`Processing scan ${i + 1}/${pending.length}`, scan.id);

          try {
            // Call the API directly with the queued image data
            const response = await fetch(`${API_URL}/api/scan`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                image: scan.image,
                userId: scan.userId
              })
            });

            if (!response.ok) {
              throw new Error(`Server error (${response.status})`);
            }

            const result = await response.json();

            if (result.success && result.books) {
              console.log(`✅ Scan ${scan.id} processed successfully, got ${result.books?.length} books`);
              lastSuccessfulResult = result;
              processedCount++;

              // Cache books for offline access
              await cacheBooks(result.books);

              // Save scan for logged-in users
              if (scan.userId && user) {
                try {
                  await supabase
                      .from('scans')
                      .insert({
                        user_id: user.id,
                        books: result.books,
                        created_at: new Date().toISOString()
                      });
                } catch (saveErr) {
                  console.error('Error saving synced scan:', saveErr);
                }
              }

              // Remove this scan from pending
              const currentPending = await getPendingScans();
              const filtered = currentPending.filter(p => p.id !== scan.id);
              await Preferences.set({
                key: 'pending_scans',
                value: JSON.stringify(filtered)
              });
            }
          } catch (err) {
            console.error(`❌ Failed to process queued scan ${scan.id}:`, err);
            failedCount++;
          }
        }

        setSyncing(false);

        // Update pending scans count
        const remainingPending = await getPendingScans();
        setPendingScans(remainingPending);

        // Show the results from the last successful scan in the UI
        if (lastSuccessfulResult && lastSuccessfulResult.books) {
          console.log(`📚 Displaying ${lastSuccessfulResult.books.length} books from synced scan`);
          setBooks(lastSuccessfulResult.books);
          setMatchedCount(lastSuccessfulResult.matchedInReadingList || 0);
          await Haptics.notification({ type: NotificationType.Success });
        }

        // Show sync summary
        if (processedCount > 0) {
          alert(i18n.t('offline.syncComplete', { count: processedCount }));
        }
        if (failedCount > 0) {
          console.warn(`${failedCount} scans failed to process`);
        }
      }
    };

    const handleOffline = () => {
      console.log('📴 Going offline...');
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, API_URL]);

  useEffect(() => {
    const loadPending = async () => {
      const pending = await getPendingScans();
      setPendingScans(pending);
    };
    loadPending();
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
          .limit(50);

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
      setImageToCrop(event.target.result);
      setShowCropModal(true);
      setBooks([]);
      setError('');
      setIsNetworkError(false);
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
    setIsNetworkError(false);
    setBooks([]);
    setMatchedCount(0);

    // Check if offline
    if (!isOnline()) {
      // Queue for later sync
      await queueScanForSync({
        id: Date.now().toString(),
        image: image,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        status: 'pending'
      });

      const pending = await getPendingScans();
      setPendingScans(pending);

      setError(i18n.t('offline.scanQueued'));
      setLoading(false);
      await Haptics.notification({type: NotificationType.Warning});
      return;
    }

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
        setIsNetworkError(true);
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
          throw new Error('Too many requests. Please wait a few minutes and try again.');
        }

        throw new Error(data.error || `Server error (${response.status})`);
      }

      if (data.success && data.books) {
        setBooks(data.books);
        setLastScanDate(new Date());
        setMatchedCount(data.matchedInReadingList || 0);
        await Haptics.notification({type: NotificationType.Success});

        // Cache books for offline access
        await cacheBooks(data.books);

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

  const handleEditCurrentScan = async (updatedBooks) => {
    setBooks(updatedBooks);
    setShowEditModal(false);

    if (user && scanHistory.length > 0) {
      try {
        const latestScan = scanHistory[0];
        const response = await fetch(`${API_URL}/api/scans/${latestScan.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({books: updatedBooks})
        });

        if (response.ok) {
          await loadScanHistory();
          console.log('✅ Updated scan in database');
        }
      } catch (err) {
        console.error('Failed to update scan in DB:', err);

      }
    }
  };

  const handleEditHistoryScan = (scan) => {
    setEditingScanId(scan.id);
    setEditingHistoryBooks(scan.books);
  };

  const handleSaveHistoryEdit = async (updatedBooks) => {
    if (!editingScanId || !user) return;

    try {
      const response = await fetch(`${API_URL}/api/scans/${editingScanId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ books: updatedBooks })
      });

      if (!response.ok) {
        throw new Error('Failed to update scan');
      }

      await loadScanHistory();
      setEditingScanId(null);
      setEditingHistoryBooks(null);
      console.log('✅ History scan updated');

    } catch (err) {
      console.error('Failed to update history scan:', err);
      throw err;
    }
  };

  const processSingleScan = async (scanData) => {
    const imageToProcess = scanData.image?.image || scanData.image;
    const userIdToUse = scanData.image?.userId || scanData.userId || user?.id;

    try {
      const response = await fetch(`${API_URL}/api/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageToProcess,
          userId: userIdToUse,
        })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error (${response.status})`);
      }
      const data = await response.json();

      if (data.success && data.books) {
        await cacheBooks(data.books);
        if (user) {
          await saveScan(data.books);
        }
        return data;
      }
      throw new Error('Unexpected response from server');
    } catch (err) {
      console.error('Process scan error:', err);
      throw err;
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
    setSelectedBook(bookData);
    setShowLinkModal(true);
  };

  const openDescriptModal = (bookData) => {
    setSelectedBook(bookData);
    setShowDescriptModal(true);
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropConfirm = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
      setImage(croppedImage);
      setShowCropModal(false);
      setImageToCrop(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
    } catch (e) {
      console.error('Error cropping image:', e);
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setImageToCrop(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
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

      alert(i18n.t('account.scheduledForDeletion'));

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
        throw new Error(data.error || i18n.t('error.failedToDeleteScan'));
      }

      setScanHistory(prevHistory => prevHistory.filter(scan => scan.id !== scanId));

      if (Capacitor.isNativePlatform()) {
        await Haptics.notification({ type: NotificationType.Success });
      }

    } catch (error) {
      console.error('Error deleting scan:', error);
      alert(i18n.t('error.failedToDeleteScan'));
      throw error;
    }
  };

  const handleViewScanDetail = (scan) => {
    setSelectedScan(scan);
    setShowScanDetailModal(true);
  };

  const handleViewBookFromDetail = (book) => {
    setShowScanDetailModal(false);
    setSelectedBook(book);
    setShowLinkModal(true);
  }

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

      setImageToCrop(photo.dataUrl);
      setShowCropModal(true);
      setBooks([]);
      setError('');
      setIsNetworkError(false);
    } catch (err) {
      if (err.message !== 'User cancelled photos app') {
        console.error('Camera error:', err);
        setError(i18n.t('error.somethingWentWrong'));
        setIsNetworkError(false);
      }
    } finally {
      setLoading(false);
    }
  };

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
        {isOffline && (
            <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                <WifiOff className="w-4 h-4" />
                <span>{i18n.t('offline.description')}</span>
                {pendingScans.length > 0 && (
                    <span className="ml-2 bg-orange-600 px-2 py-1 rounded-full">
                      {i18n.t('offline.pendingScans', { count: pendingScans.length})}
                    </span>
                )}
              </div>
            </div>
        )}
        {syncing && (
            <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{i18n.t('offline.processing')}</span>
              </div>
            </div>
        )}
        {!isAppReady ? (
            <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-indigo-600 dark:text-indigo-400 animate-spin mx-auto mb-4"/>
                <p className="text-gray-600 dark:text-gray-300">Loading Shelf Scan...</p>
              </div>
            </div>
        ) : (
            <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 flex flex-col">
              <div className="flex-1 overflow-hidden pb-16">
                {/* SCAN TAB */}
                {activeTab === 'scan' && (
                    <div className="h-full overflow-y-auto"
                         style={{
                           WebkitOverflowScrolling: 'touch',
                           overscrollBehavior: 'contain'
                         }}>
                      <div className="max-w-6xl mx-auto p-8 pb-8 min-h-full">
                        {/* Description text */}
                        <div className="text-center mb-6 sm:mb-8">
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">{i18n.t('scan.description')}</p>
                          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 px-4">{i18n.t('scan.loginDescription')}</p>

                          {savingScan && (
                              <div className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">
                                💾 {i18n.t('status.savingScan')}
                              </div>
                          )}
                        </div>

                        {/* Match notification */}
                        {user && matchedCount > 0 && (
                            <div className="mt-4 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4 mb-8">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400"/>
                                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                                    {i18n.t('scan.foundFromList', { count: matchedCount})}
                                  </span>
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                      type="checkbox"
                                      checked={showOnlyMatches}
                                      onChange={(e) => setShowOnlyMatches(e.target.checked)}
                                      className="w-4 h-4 text-emerald-600 rounded"
                                  />
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">{i18n.t('scan.showOnlyMyBooks')}</span>
                                </label>
                              </div>
                            </div>
                        )}

                        {/* Upload area */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8">
                          <div className="flex flex-col items-center gap-4">
                            <label className="w-full cursor-pointer">
                              <div className="border-4 border-dashed border-indigo-200 dark:border-indigo-700 rounded-lg p-12 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
                                {image ? (
                                    <img src={image} alt="Uploaded books" className="max-h-96 mx-auto rounded-lg"/>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                      <Upload className="w-16 h-16 text-indigo-400 dark:text-indigo-500"/>
                                      <p className="text-lg text-gray-600 dark:text-gray-300">{i18n.t('upload.clickToUpload')}</p>
                                      <p className="text-sm text-gray-400 dark:text-gray-500">{i18n.t('upload.fileLimit')}</p>
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
                                <div className="w-full max-w-md space-y-3">
                                  {/* Primary row: Take Photo and Scan Barcode */}
                                  <div className="flex gap-3">
                                    <button
                                        onClick={takeNativePhoto}
                                        className="flex-1 px-4 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full transition-transform active:scale-95 font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                      <Camera className="w-5 h-5 flex-shrink-0"/>
                                      <span className="whitespace-nowrap">{i18n.t('scan.takePhoto')}</span>
                                    </button>

                                    {/*<button
                                        onClick={() => setShowBarcodeScanner(true)}
                                        className="flex-1 px-4 py-3 bg-green-600 dark:bg-green-500 text-white rounded-full font-semibold hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
                                    >
                                      <Barcode className="w-5 h-5 flex-shrink-0"/>
                                      <span className="whitespace-nowrap">{i18n.t('scan.scanBarcode')}</span>
                                    </button>*/}
                                  </div>

                                  {/* Secondary row: Upload File */}
                                  <label className="block cursor-pointer">
                                    <div className="w-full px-4 py-3 bg-gray-600 dark:bg-gray-700 text-white rounded-full font-semibold hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base">
                                      <Upload className="w-5 h-5 flex-shrink-0"/>
                                      <span>{i18n.t('scan.uploadFile')}</span>
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
                                      className="px-8 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 transition-transform"
                                  >
                                    {loading ? (
                                        <>
                                          <Loader2 className="w-5 h-5 animate-spin"/>
                                          {i18n.t('scan.scanning')}
                                        </>
                                    ) : (
                                        <>
                                          <Book className="w-5 h-5"/>
                                          {i18n.t('scan.scanRateBooks')}
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
                                      className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed transition-transform active:scale-95"
                                  >
                                    {i18n.t('scan.clear')}
                                  </button>
                                </div>
                            )}
                          </div>

                          {error && (
                              <div className="mt-4 p-4 border rounded-lg flex items-start gap-3 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5"/>
                                <p>{error}</p>
                              </div>
                          )}
                        </div>

                        {/* Help Text Disclaimer */}
                        <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="text-lg">📸</span>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {i18n.t('upload.photoTips')}
                              </p>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="text-lg">❓</span>
                              <p className="text-sm text-blue-800 dark:text-blue-200">
                                {i18n.t('upload.somethingWrongTryAgain')}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Results - book display */}
                        {topThreeBooks.length > 0 && (
                            <div className="space-y-6 px-4">
                              <div className="text-center py-4">
                                <div className="flex items-center justify-center gap-4 flex-wrap">
                                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
                                    🏆 {i18n.t('editBooks.topRated', { count: Math.min(3, displayBooks.length) })}
                                  </h2>
                                  <button
                                    onClick={() => setShowEditModal(true)}
                                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-gray-700 rounded-lg hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors active:scale-95"
                                  >
                                    <Edit3 className="w-4 h-4"/>
                                    {i18n.t('editBooks.editBooks')}
                                  </button>

                                  <ExportButton books={books} scanDate={lastScanDate || new Date()} />
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 mt-1">
                                  {i18n.t('scan.found', { count: books.length})} • {i18n.t('results.sortedByRating')}
                                </p>
                              </div>
                              {topThreeBooks.map((book, index) => (
                                  <div
                                      key={index}
                                      className={`bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden ${
                                          book.inReadingList ? 'ring-4 ring-emerald-400 dark:ring-emerald-500' : ''
                                      }`}
                                  >
                                    <div className="relative">
                                      <div className="absolute inset-0 bg-gradient-to-b from-indigo-100 dark:from-indigo-900/50 via-indigo-50 dark:via-indigo-900/30 to-white dark:to-gray-800" />

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
                                              {i18n.t('results.onYourList')}
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
                                            <div className="w-40 h-56 sm:w-48 sm:h-68 bg-gray-200 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-xl">
                                              <BookOpen className="w-16 h-16 text-gray-400"/>
                                            </div>
                                        )}
                                      </div>
                                    </div>

                                    <div className="px-6 pb-8 mt-2">
                                      <div className="text-center mb-5">
                                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                                          {book.title}
                                        </h3>
                                        <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">by {book.author}</p>
                                      </div>

                                      <div className="flex justify-center mb-5">
                                        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 px-6 py-4 rounded-2xl border border-amber-200 dark:border-amber-700">
                                          <Star className="w-8 h-8 fill-amber-400 text-amber-400"/>
                                          <div className="text-left">
                                            <span className="text-3xl font-bold text-gray-800 dark:text-white">
                                              {book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      {book.ratingSource && (
                                          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-5">
                                            📊 {book.ratingSource}
                                          </p>
                                      )}

                                      {/* Reading List Info */}
                                      {book.inReadingList && book.readingListInfo && (
                                          <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-2xl p-4 mb-5">
                                            <div className="flex items-center justify-center gap-2 text-emerald-800 dark:text-emerald-200">
                                              <BookOpen className="w-5 h-5" />
                                              <span className="font-semibold">
                                                {book.readingListInfo.shelf === 'read' ? (i18n.t('results.youveReadThis')) :
                                                    book.readingListInfo.shelf === 'currently-reading' ? `📖 ${i18n.t('results.currentlyReading')}` :
                                                        `📚 ${i18n.t('results.onYourToReadList')}`}
                                              </span>
                                              {book.readingListInfo.myRating > 0 && (
                                                  <span className="ml-2">• {i18n.t('results.youRatedIt')} {book.readingListInfo.myRating}★</span>
                                              )}
                                            </div>
                                          </div>
                                      )}

                                      <div className="mb-4">
                                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-center">
                                          {book.description.replace(/<[^>]*>/g, '').substring(0, 200)}
                                          {book.description.length > 200 && (
                                              <>
                                                ...{' '}
                                                <button
                                                    onClick={async () => {
                                                      await Haptics.impact({style: ImpactStyle.Light});
                                                      openDescriptModal(book)
                                                    }}
                                                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 underline font-medium cursor-pointer touch-manipulation transition-transform active:scale-95"
                                                >
                                                  More
                                                </button>
                                              </>
                                          )}
                                        </p>
                                      </div>

                                      {/* External links */}
                                      <div className="flex flex-wrap gap-4 items-center justify-center mb-5">
                                        <a
                                            href={book.amazonUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center justify-center"
                                        >
                                          <img src={amazonImage} alt="Buy on Amazon" className="h-12 w-auto sm:h-14 hover:opacity-80 transition-opacity"/>
                                        </a>
                                        {book.infoLink && (
                                            <a
                                                href={book.infoLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center"
                                            >
                                              <img src={googleImage} alt="See on Google Books" className="h-10 w-auto sm:h-12 hover:opacity-80 transition-opacity"/>
                                            </a>
                                        )}
                                        {book.goodreadsUrl && (
                                            <a
                                                href={book.goodreadsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center"
                                            >
                                              <img src={goodreadsImage} alt="See on Goodreads" className="h-10 w-auto sm:h-12 hover:opacity-80 transition-opacity"/>
                                            </a>
                                        )}
                                      </div>

                                      {/* Share button */}
                                      <div className="flex gap-3 px-4">
                                        <button
                                            onClick={async() => {
                                              Haptics.impact({style: ImpactStyle.Light});
                                              shareBook(book)
                                            }}
                                            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 rounded-xl transition-all active:scale-95"
                                        >
                                          <ShareIcon className="w-5 h-5" />
                                          <span>{i18n.t('book.share')}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                              ))}
                            </div>
                        )}

                        {/* Other books section */}
                        {displayBooks.length > 3 && (
                            <div className="mt-8 px-4">
                              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {i18n.t('results.moreBooksFound')}
                              </h3>
                              <div className="space-y-3">
                                {books.slice(3).map((book, index) => (
                                    <button
                                        key={index}
                                        onClick={async () => {
                                          await Haptics.impact({style: ImpactStyle.Light});
                                          openLinkModal(book)
                                        }}
                                        className={`w-full text-left bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex gap-4 transition-all active:scale-98 hover:shadow-md ${
                                            book.inReadingList ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-200 dark:ring-emerald-700' : 'border-gray-200 dark:border-gray-700'
                                        }`}
                                    >
                                      {book.thumbnail ? (
                                          <img
                                              src={book.thumbnail}
                                              alt={book.title}
                                              className="w-16 h-24 object-cover rounded-xl shadow flex-shrink-0"
                                          />
                                      ) : (
                                          <div className="w-16 h-24 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center flex-shrink-0">
                                            <BookOpen className="w-6 h-6 text-gray-400"/>
                                          </div>
                                      )}

                                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="min-w-0">
                                            <h4 className="font-bold text-gray-900 dark:text-white line-clamp-2">{book.title}</h4>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{book.author}</p>
                                          </div>
                                          {book.inReadingList && (
                                              <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0"/>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-2 mt-2">
                                          <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded-lg">
                                            <Star className="w-4 h-4 fill-amber-400 text-amber-400"/>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                              {book.rating > 0 ? book.rating.toFixed(1) : 'N/A'}
                                            </span>
                                          </div>
                                          {book.ratingsCount > 0 && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                ({book.ratingsCount.toLocaleString()} reviews)
                                              </span>
                                          )}
                                        </div>
                                      </div>

                                      <ChevronRight className="w-5 h-5 text-gray-400 self-center flex-center-0" />
                                    </button>
                                ))}
                                <div className="text-center mb-6 mt-2">
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 mt-2">
                                    📢 {i18n.t('disclaimer.amazonAffiliate')}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {i18n.t('disclaimer.ratingsSource1')}
                                    {i18n.t('disclaimer.ratingsSource2')}
                                  </p>
                                </div>
                              </div>
                            </div>
                        )}
                      </div>
                    </div>
                )}

                {/* LIBRARY TAB */}
                {activeTab === 'library' && (
                    <div className="h-full overflow-y-auto"
                         style={{
                           WebkitOverflowScrolling: 'touch',
                           overscrollBehavior: 'contain'
                         }}>
                      <div className="max-w-6xl mx-auto p-8 pb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{i18n.t('library.title')}</h2>
                        {user ? (
                            <ReadingList isOpen={true} onClose={() => setActiveTab('scan')}/>
                        ) : (
                            <EmptyState
                                type="library"
                                onAction={() => setShowAuthModal(true)}
                                actionLabel={i18n.t('auth.signIn')}

                            />
                        )}
                      </div>
                    </div>
                )}

                {/* HISTORY TAB */}
                {activeTab === 'history' && (
                    <div className="h-full overflow-y-auto"
                         style={{
                           WebkitOverflowScrolling: 'touch',
                           overscrollBehavior: 'contain'
                         }}>
                      <div className="max-w-6xl mx-auto p-8 pb-8">
                        {pulling && pullDistance > 40 && (
                            <div
                                className="fixed top-0 left-0 right-0 flex justify-center transition-all"
                                style={{
                                  transform: `translateY(${Math.min(pullDistance - 40, 60)}px)`,
                                  paddingTop: 'env(safe-area-inset-top)'
                                }}
                            >
                              <div className="bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg">
                                <Loader2 className={`w-6 h-6 text-indigo-600 dark:text-indigo-400 ${pullDistance > 80 ? 'animate-spin' : ''}`} />
                              </div>
                            </div>
                        )}
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{i18n.t('history.title')}</h2>
                        {user && scanHistory.length > 0 && (
                            <button
                              onClick={() => setShowBulkExport(true)}
                              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              Export All
                            </button>
                        )}
                        {user ? (
                            scanHistory.length === 0 ? (
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                                  <History className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
                                  <p className="text-gray-500 dark:text-gray-400">{i18n.t('history.empty')}</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                  {scanHistory.map((scan) => (
                                      <SwipeableScanItem
                                          key={scan.id}
                                          scan={scan}
                                          onDelete={handleDeleteScan}
                                          onViewDetail={handleViewScanDetail}
                                          onEdit={handleEditHistoryScan}
                                      />
                                  ))}
                                </div>
                            )
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                              <p className="text-gray-600 dark:text-gray-300 mb-4">{i18n.t('account.signInToViewHistory')}</p>
                              <button
                                  onClick={() => setShowAuthModal(true)}
                                  className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full transition-transform active:scale-95 font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600"
                              >
                                {i18n.t('profile.signIn')}
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
                      <div className="max-w-6xl mx-auto p-8 pb-8">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{i18n.t('profile.title')}</h2>
                        {user ? (
                            <div className="space-y-4">
                              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center">
                                    <User className="w-8 h-8 text-indigo-600 dark:text-indigo-400"/>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{i18n.t('profile.signedInAs')}</p>
                                    <p className="font-semibold text-gray-800 dark:text-white">{user.email}</p>
                                  </div>
                                </div>

                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                                  <button
                                      onClick={() => setActiveTab('library')}
                                      className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between active:scale-95 transition-transform"
                                  >
                                    <span className="font-medium text-gray-800 dark:text-white">{i18n.t('library.title')}</span>
                                    <BookOpen className="w-5 h-5 text-gray-400"/>
                                  </button>

                                  <button
                                      onClick={() => setActiveTab('history')}
                                      className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between active:scale-95 transition-transform"
                                  >
                                    <span className="font-medium text-gray-800 dark:text-white">{i18n.t('history.title')}</span>
                                    <History className="w-5 h-5 text-gray-400"/>
                                  </button>

                                  <button
                                      onClick={() => setShowPwChangeModal(true)}
                                      className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex items-center justify-between active:scale-95 transition-transform"
                                  >
                                    <span className="font-medium text-gray-800 dark:text-white">{i18n.t('account.changePassword')}</span>
                                    <Key className="w-5 h-5 text-gray-400"/>
                                  </button>
                                </div>
                              </div>

                              {/* Sign Out and Delete Account */}
                              <div className="space-y-3">
                                <button
                                    onClick={handleSignOut}
                                    className="w-full px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <LogOut className="w-4 h-4" />
                                  {i18n.t('profile.signOut')}
                                </button>

                                <button
                                    onClick={() => setShowDeleteAccountModal(true)}
                                    className="w-full px-4 py-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full font-semibold hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors active:scale-95 flex items-center justify-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {i18n.t('account.deleteAccount')}
                                </button>
                              </div>

                              {/* Privacy Notice */}
                              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                                <p className="text-sm text-blue-800 dark:text-blue-200">
                                  {i18n.t('privacy.dataPrivacy')}
                                </p>
                              </div>
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                              <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"/>
                              <p className="text-gray-600 dark:text-gray-300 mb-4">{i18n.t('profile.signInDescription')}</p>
                              <button
                                  onClick={() => setShowAuthModal(true)}
                                  className="px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full transition-transform active:scale-95 font-semibold hover:bg-indigo-700 dark:hover:bg-indigo-600"
                              >
                                {i18n.t('profile.signIn')}
                              </button>
                            </div>
                        )}
                        {/* Theme and Language Settings */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                          <h3 className="font-semibold text-gray-800 dark:text-white mb-4">{i18n.t('account.settings')}</h3>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <ThemeToggle />
                            </div>
                            <div className="flex items-center justify-between">
                              <LanguageSelector />
                            </div>
                          </div>
                        </div>
                        {/* Thank you message - VISIBLE TO EVERYONE */}
                        <div className="text-center mt-6">
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <a href="mailto:admin@shelfscan.xyz" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                              {i18n.t('feedback.thanksForUsing')}
                            </a>
                          </p>
                        </div>
                        <div className="text-center mt-6">
                          <a href="#"
                             onClick={(e) => {
                               e.preventDefault();
                               setShowPrivacyModal(true)
                             }}
                             className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 hover:underline"
                          >
                            {i18n.t('privacy.privacyPolicy')}
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
                        <h3 className="text-lg font-semibold">{i18n.t('imageEditor.adjustPhoto')}</h3>
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
                            aspect={undefined}
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
                          <label className="block text-sm mb-2">{i18n.t('imageEditor.zoom')}</label>
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
                          {i18n.t('imageEditor.rotate90')}
                        </button>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pb-4">
                          <button
                              onClick={handleCropCancel}
                              className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors active:scale-95 font-semibold"
                          >
                            {i18n.t('common.cancel')}
                          </button>
                          <button
                              onClick={handleCropConfirm}
                              className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors active:scale-95 font-semibold"
                          >
                            {i18n.t('imageEditor.usePhoto')}
                          </button>
                        </div>
                      </div>
                    </div>
                )}
              </div>
              {/* Tab Bar - MUST be outside the scrolling container to stay fixed */}
              <TabBar activeTab={activeTab} onTabChange={setActiveTab}/>
            </div>
        )}

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
        <ScanDetailModal
          isOpen={showScanDetailModal}
          onClose={() => setShowScanDetailModal(false)}
          scan={selectedScan}
          onViewBook={handleViewBookFromDetail}
        />
        <BulkExportModal
          isOpen={showBulkExport}
          onClose={() => setShowBulkExport(false)}
          scanHistory={scanHistory}
        />

        {showEditModal && books.length > 0 && (
            <EditBooksModal
              books={books}
              onSave={handleEditCurrentScan}
              onClose={() => setShowEditModal(false)}
              userId={user?.id}
            />
        )}

        {editingHistoryBooks && (
            <EditBooksModal
              books={editingHistoryBooks}
              onSave={handleSaveHistoryEdit}
              onClose={() => {
                setEditingScanId(null);
                setEditingHistoryBooks(null);
              }}
              userId={user?.id}
            />
        )}
        <BarcodeScanner
            show={showBarcodeScanner}
            onClose={() => setShowBarcodeScanner(false)}
            onScanComplete={(books) => {
              setBooks(books);
              setShowBarcodeScanner(false);
            }}
            API_URL={API_URL}
            user={user}
        />
        <HelpButton />
      </>
  );
}

function AppWrapper() {
  return (
      <ThemeProvider>
        <App />
      </ThemeProvider>
  );
}

export default AppWrapper;