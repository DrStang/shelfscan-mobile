import React, { useState } from 'react';
import { Download, FileText, Table, ChevronDown, Loader2 } from 'lucide-react';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { Share as CapacitorShare } from '@capacitor/share';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import i18n from '../utils/i18n';

function ExportButton({ books, scanDate = new Date() }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [exportFormat, setExportFormat] = useState(null);

    if (!books || books.length === 0) return null;

    const formatDate = (date) => {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    // Generate CSV content
    const generateCSV = () => {
        const headers = ['Title', 'Author', 'Rating', 'Ratings Count', 'ISBN', 'Publish Year', 'On Reading List', 'Goodreads URL', 'Amazon URL'];
        const rows = books.map(book => [
            `"${(book.title || '').replace(/"/g, '""')}"`,
            `"${(book.author || '').replace(/"/g, '""')}"`,
            book.rating || '',
            book.ratingsCount || '',
            book.isbn || '',
            book.publishYear || '',
            book.inReadingList ? 'Yes' : 'No',
            book.goodreadsUrl || '',
            book.amazonUrl || ''
        ]);

        return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    };

    // Generate plain text content
    const generateText = () => {
        let content = `Shelf Scan Export\n`;
        content += `${'='.repeat(50)}\n\n`;
        content += `Scan Date: ${formatDate(scanDate)} at ${formatTime(scanDate)}\n`;
        content += `Total Books: ${books.length}\n\n`;
        content += `${'='.repeat(50)}\n\n`;

        books.forEach((book, index) => {
            content += `${index + 1}. ${book.title}\n`;
            content += `   Author: ${book.author || 'Unknown'}\n`;
            content += `   Rating: ${book.rating ? book.rating.toFixed(1) : 'N/A'}`;
            if (book.ratingsCount) {
                content += ` (${book.ratingsCount.toLocaleString()} reviews)`;
            }
            content += '\n';
            if (book.isbn) content += `   ISBN: ${book.isbn}\n`;
            if (book.inReadingList) content += `   📚 On your reading list\n`;
            content += `   Goodreads: ${book.goodreadsUrl || 'N/A'}\n`;
            content += '\n';
        });

        content += `\n${'='.repeat(50)}\n`;
        content += `Exported from Shelf Scan - https://shelfscan.xyz\n`;

        return content;
    };

    // Generate HTML for PDF-like export
    const generateHTML = () => {
        const avgRating = books.filter(b => b.rating > 0).reduce((sum, b, _, arr) =>
            sum + b.rating / arr.length, 0);

        return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Shelf Scan Export - ${formatDate(scanDate)}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #4f46e5;
        }
        .header h1 { color: #4f46e5; font-size: 28px; margin-bottom: 10px; }
        .header .date { color: #666; font-size: 14px; }
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            padding: 20px;
            background: #f3f4f6;
            border-radius: 8px;
        }
        .stat { text-align: center; }
        .stat-value { font-size: 24px; font-weight: bold; color: #4f46e5; }
        .stat-label { font-size: 12px; color: #666; }
        .book {
            display: flex;
            gap: 20px;
            padding: 20px;
            margin: 15px 0;
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
        }
        .book-rank {
            width: 40px;
            height: 40px;
            background: #4f46e5;
            color: white;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        .book-info { flex: 1; }
        .book-title { font-size: 18px; font-weight: bold; color: #111; }
        .book-author { color: #666; margin-top: 4px; }
        .book-rating {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            margin-top: 8px;
            padding: 4px 12px;
            background: #fef3c7;
            border-radius: 20px;
            font-size: 14px;
        }
        .book-rating .star { color: #f59e0b; }
        .reading-list-badge {
            display: inline-block;
            margin-top: 8px;
            margin-left: 8px;
            padding: 4px 12px;
            background: #d1fae5;
            color: #065f46;
            border-radius: 20px;
            font-size: 12px;
        }
        .book-links { margin-top: 10px; font-size: 12px; }
        .book-links a { color: #4f46e5; margin-right: 15px; }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #999;
            font-size: 12px;
        }
        @media print {
            body { padding: 20px; }
            .book { break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📚 Shelf Scan Export</h1>
        <div class="date">${formatDate(scanDate)} at ${formatTime(scanDate)}</div>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-value">${books.length}</div>
            <div class="stat-label">Books Found</div>
        </div>
        <div class="stat">
            <div class="stat-value">${avgRating > 0 ? avgRating.toFixed(1) : 'N/A'}</div>
            <div class="stat-label">Avg Rating</div>
        </div>
        <div class="stat">
            <div class="stat-value">${books.filter(b => b.inReadingList).length}</div>
            <div class="stat-label">On Reading List</div>
        </div>
    </div>
    
    ${books.map((book, index) => `
        <div class="book">
            <div class="book-rank">#${index + 1}</div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">by ${book.author || 'Unknown Author'}</div>
                <div>
                    <span class="book-rating">
                        <span class="star">★</span>
                        ${book.rating ? book.rating.toFixed(1) : 'N/A'}
                        ${book.ratingsCount ? `(${book.ratingsCount.toLocaleString()} reviews)` : ''}
                    </span>
                    ${book.inReadingList ? '<span class="reading-list-badge">📚 On Your List</span>' : ''}
                </div>
                <div class="book-links">
                    ${book.goodreadsUrl ? `<a href="${book.goodreadsUrl}" target="_blank">Goodreads</a>` : ''}
                    ${book.amazonUrl ? `<a href="${book.amazonUrl}" target="_blank">Amazon</a>` : ''}
                    ${book.isbn ? `<span>ISBN: ${book.isbn}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('')}
    
    <div class="footer">
        Exported from Shelf Scan • https://shelfscan.xyz
    </div>
</body>
</html>`;
    };

    const handleExport = async (format) => {
        if (Capacitor.isNativePlatform()) {
            await Haptics.impact({ style: ImpactStyle.Medium });
        }

        setExporting(true);
        setExportFormat(format);
        setShowDropdown(false);

        try {
            let content, mimeType, filename;

            switch (format) {
                case 'csv':
                    content = generateCSV();
                    mimeType = 'text/csv';
                    filename = `shelf-scan-${scanDate.toISOString().split('T')[0]}.csv`;
                    break;
                case 'txt':
                    content = generateText();
                    mimeType = 'text/plain';
                    filename = `shelf-scan-${scanDate.toISOString().split('T')[0]}.txt`;
                    break;
                case 'html':
                    content = generateHTML();
                    mimeType = 'text/html';
                    filename = `shelf-scan-${scanDate.toISOString().split('T')[0]}.html`;
                    break;
                default:
                    throw new Error('Unknown format');
            }

            if (Capacitor.isNativePlatform()) {
                // For native platforms: Save file to cache directory, then share
                try {
                    // Write file to cache directory
                    const result = await Filesystem.writeFile({
                        path: filename,
                        data: content,
                        directory: Directory.Cache,
                        encoding: Encoding.UTF8
                    });

                    console.log('File written to:', result.uri);

                    // Share the file using its URI
                    // Note: Only pass 'files' - adding 'title' or 'text' creates extra share items on iOS
                    await CapacitorShare.share({
                        files: [result.uri],
                    });

                    // Optionally clean up the file after sharing (delayed)
                    setTimeout(async () => {
                        try {
                            await Filesystem.deleteFile({
                                path: filename,
                                directory: Directory.Cache
                            });
                        } catch (e) {
                            // Ignore cleanup errors
                        }
                    }, 5000);

                } catch (fsError) {
                    console.error('Filesystem error:', fsError);

                    // Fallback: Try sharing as text if file sharing fails
                    if (format === 'txt' || format === 'csv') {
                        await CapacitorShare.share({
                            title: `Shelf Scan Export`,
                            text: content,
                            dialogTitle: 'Export Scan Results',
                        });
                    } else {
                        throw fsError;
                    }
                }
            } else {
                // For web, trigger download
                const blob = new Blob([content], { type: mimeType });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            if (Capacitor.isNativePlatform()) {
                await Haptics.notification({ type: NotificationType.Success });
            }
        } catch (err) {
            console.error('Export error:', err);
            if (Capacitor.isNativePlatform()) {
                await Haptics.notification({ type: NotificationType.Error });
            }
            // Show user-friendly error
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
            setExportFormat(null);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={async () => {
                    if (Capacitor.isNativePlatform()) {
                        await Haptics.impact({ style: ImpactStyle.Light });
                    }
                    setShowDropdown(!showDropdown);
                }}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
                {exporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                <span>{i18n.t('export.export')}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                        <button
                            onClick={() => handleExport('csv')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Table className="w-5 h-5 text-green-600 dark:text-green-400" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900 dark:text-white">CSV</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{i18n.t('export.csvDescription')}</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleExport('html')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900 dark:text-white">HTML/PDF</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{i18n.t('export.htmlDescription')}</div>
                            </div>
                        </button>
                        <button
                            onClick={() => handleExport('txt')}
                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <div className="text-left">
                                <div className="font-medium text-gray-900 dark:text-white">Text</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{i18n.t('export.txtDescription')}</div>
                            </div>
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

export default ExportButton;