#!/usr/bin/env node
/**
 * Automated i18n Text Replacement Script
 *
 * This script automatically replaces hardcoded text with i18n.t() calls
 * in your ShelfScan App.jsx file.
 *
 * Usage:
 *   node replace-i18n.js
 *
 * WARNING: Makes changes to App.jsx - commit your code first!
 */

const fs = require('fs');
const path = require('path');

// Backup original file
function backupFile(filePath) {
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    console.log(`✓ Backed up to ${backupPath}`);
}

// Replacement patterns
const replacements = [
    // Navigation
    { find: '>Scan<', replace: ">{i18n.t('nav.scan')}<", category: 'Navigation' },
    { find: '>Library<', replace: ">{i18n.t('nav.library')}<", category: 'Navigation' },
    { find: '>History<', replace: ">{i18n.t('nav.history')}<", category: 'Navigation' },
    { find: '>Profile<', replace: ">{i18n.t('nav.profile')}<", category: 'Navigation' },

    // Scan screen buttons
    { find: '>Take Photo<', replace: ">{i18n.t('scan.takePhoto')}<", category: 'Scan' },
    { find: '>Upload File<', replace: ">{i18n.t('scan.uploadFile')}<", category: 'Scan' },
    { find: '>Scan Barcode<', replace: ">{i18n.t('scan.scanBarcode')}<", category: 'Scan' },
    { find: '>Scan & Rate Books<', replace: ">{i18n.t('scan.scanRateBooks')}<", category: 'Scan' },
    { find: '>Scanning Books...<', replace: ">{i18n.t('scan.scanning')}<", category: 'Scan' },
    { find: '>Clear<', replace: ">{i18n.t('scan.clear')}<", category: 'Scan' },

    // Scan screen headers
    { find: />\s*Top 3 Highest-Rated Books\s*</g, replace: ">{i18n.t('scan.topRated')}<", category: 'Scan' },
    { find: />\s*🏆 Top 3 Highest-Rated Books\s*</g, replace: ">🏆 {i18n.t('scan.topRated')}<", category: 'Scan' },
    { find: '>Other Books Found<', replace: ">{i18n.t('scan.otherBooks')}<", category: 'Scan' },
    { find: '>On Your Reading List!<', replace: ">{i18n.t('scan.onReadingList')}<", category: 'Scan' },
    { find: '>Show only my books<', replace: ">{i18n.t('scan.showOnlyMyBooks')}<", category: 'Scan' },

    // Book details
    { find: '>Buy on Amazon<', replace: ">{i18n.t('book.buyAmazon')}<", category: 'Book Details' },
    { find: '>See on Goodreads<', replace: ">{i18n.t('book.viewGoodreads')}<", category: 'Book Details' },
    { find: '>See on Google Books<', replace: ">{i18n.t('book.viewGoogle')}<", category: 'Book Details' },
    { find: '>Share<', replace: ">{i18n.t('book.share')}<", category: 'Book Details' },
    { find: '>More<', replace: ">{i18n.t('book.more')}<", category: 'Book Details' },

    // Reading list
    { find: '>My Reading List<', replace: ">{i18n.t('library.title')}<", category: 'Library' },
    { find: '>Import from Goodreads<', replace: ">{i18n.t('library.import')}<", category: 'Library' },
    { find: '>Upload CSV<', replace: ">{i18n.t('library.upload')}<", category: 'Library' },
    { find: '>Clear List<', replace: ">{i18n.t('library.clear')}<", category: 'Library' },
    { find: '>Total Books<', replace: ">{i18n.t('library.totalBooks')}<", category: 'Library' },
    { find: '>Read<', replace: ">{i18n.t('library.read')}<", category: 'Library' },
    { find: '>Reading<', replace: ">{i18n.t('library.reading')}<", category: 'Library' },
    { find: '>To Read<', replace: ">{i18n.t('library.toRead')}<", category: 'Library' },
    { find: '>Avg Rating<', replace: ">{i18n.t('library.avgRating')}<", category: 'Library' },
    { find: '>Importing...<', replace: ">{i18n.t('library.importing')}<", category: 'Library' },

    // History
    { find: '>Scan History<', replace: ">{i18n.t('history.title')}<", category: 'History' },

    // Profile
    { find: '>Signed in as<', replace: ">{i18n.t('profile.signedInAs')}<", category: 'Profile' },
    { find: '>Sign Out<', replace: ">{i18n.t('profile.signOut')}<", category: 'Profile' },
    { find: '>Sign In<', replace: ">{i18n.t('auth.signIn')}<", category: 'Auth' },

    // Auth
    { find: '>Create Account<', replace: ">{i18n.t('auth.createAccount')}<", category: 'Auth' },
    { find: '>Welcome Back<', replace: ">{i18n.t('auth.welcomeBack')}<", category: 'Auth' },
    { find: '>Email<', replace: ">{i18n.t('auth.email')}<", category: 'Auth' },
    { find: '>Password<', replace: ">{i18n.t('auth.password')}<", category: 'Auth' },
    { find: '>At least 6 characters<', replace: ">{i18n.t('auth.passwordRequirement')}<", category: 'Auth' },
    { find: '>Creating Account...<', replace: ">{i18n.t('auth.creatingAccount')}<", category: 'Auth' },
    { find: '>Signing In...<', replace: ">{i18n.t('auth.signingIn')}<", category: 'Auth' },

    // Common
    { find: '>Close<', replace: ">{i18n.t('common.close')}<", category: 'Common' },
    { find: '>Done<', replace: ">{i18n.t('common.done')}<", category: 'Common' },
    { find: '>Cancel<', replace: ">{i18n.t('common.cancel')}<", category: 'Common' },
    { find: '>Loading...<', replace: ">{i18n.t('common.loading')}<", category: 'Common' },

    // Status messages
    { find: "'Connected'", replace: "i18n.t('status.backendConnected')", category: 'Status' },
    { find: "'Not reachable'", replace: "i18n.t('status.backendDisconnected')", category: 'Status' },
    { find: "'Error'", replace: "i18n.t('status.error')", category: 'Status' },
    { find: "'Rate Limit Reached'", replace: "i18n.t('status.rateLimitReached')", category: 'Status' },
];

function replaceInFile(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        console.log('Make sure you run this from the frontend directory!');
        process.exit(1);
    }

    // Backup first
    backupFile(filePath);

    let content = fs.readFileSync(filePath, 'utf8');
    let totalChanges = 0;
    const changesByCategory = {};

    // Apply each replacement
    replacements.forEach(({ find, replace, category }) => {
        const before = content;

        if (typeof find === 'string') {
            content = content.split(find).join(replace);
        } else {
            // Regex
            content = content.replace(find, replace);
        }

        if (before !== content) {
            const count = (before.match(new RegExp(find, 'g')) || []).length;
            totalChanges += count;
            changesByCategory[category] = (changesByCategory[category] || 0) + count;
            console.log(`  ✓ Replaced ${count}x: ${find.toString().substring(0, 40)}...`);
        }
    });

    // Write back
    if (totalChanges > 0) {
        fs.writeFileSync(filePath, content, 'utf8');

        console.log('\n✅ Replacement complete!');
        console.log(`\nSummary by category:`);
        Object.entries(changesByCategory)
            .sort((a, b) => b[1] - a[1])
            .forEach(([category, count]) => {
                console.log(`  ${category}: ${count} replacements`);
            });
        console.log(`\nTotal: ${totalChanges} replacements made`);
        console.log(`\n⚠️  Next steps:`);
        console.log(`  1. Review changes: git diff src/App.jsx`);
        console.log(`  2. Test app: npm start`);
        console.log(`  3. If issues: cp src/App.jsx.backup src/App.jsx`);
    } else {
        console.log('\n✓ No replacements needed (already done?)');
    }
}

// Check for i18n import
function checkI18nImport(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes("import i18n from")) {
        console.log('\n⚠️  WARNING: Missing i18n import!');
        console.log('Add this to the top of App.jsx:');
        console.log("  import i18n from './utils/i18n';");
        console.log("  i18n.init();");
        return false;
    }
    return true;
}

// Main
console.log('🔄 ShelfScan i18n Text Replacement Tool\n');

const appPath = path.join(process.cwd(), 'src', 'App.jsx');
console.log(`Target file: ${appPath}\n`);

replaceInFile(appPath);

console.log('\n📋 Manual replacements still needed:');
console.log('  - Dynamic text with variables (e.g., "Found {count} books")');
console.log('  - Error messages in catch blocks');
console.log('  - Alert() and confirm() dialogs');
console.log('  - Placeholder attributes');
console.log('\nSee TEXT_REPLACEMENT_GUIDE.md for details.');

checkI18nImport(appPath);