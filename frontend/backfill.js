// ============================================================
// Backfill Script: Extract books from existing scans into user_books
// Run this ONCE after applying the migration SQL
// Usage: node 02-backfill-user-books.js
// ============================================================
// Requires: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars
// ============================================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function backfill() {
    console.log('🔄 Starting backfill of user_books from scans...\n');

    // Get all scans
    const { data: scans, error: scanError } = await supabase
        .from('scans')
        .select('id, user_id, books, created_at')
        .order('created_at', { ascending: true }); // oldest first so newest data wins on conflict

    if (scanError) {
        console.error('❌ Error fetching scans:', scanError);
        process.exit(1);
    }

    console.log(`📚 Found ${scans.length} scans to process\n`);

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const scan of scans) {
        const books = scan.books || [];
        if (books.length === 0) continue;

        console.log(`Processing scan ${scan.id} (${books.length} books, user: ${scan.user_id})`);

        for (const book of books) {
            if (!book.title || !book.title.trim()) {
                totalSkipped++;
                continue;
            }

            const bookRow = {
                user_id: scan.user_id,
                title: book.title.trim(),
                author: book.author?.trim() || null,
                isbn: book.isbn || null,
                isbn13: book.isbn13 || null,
                rating: book.rating || null,
                ratings_count: book.ratingsCount || 0,
                description: book.description || null,
                thumbnail: book.thumbnail || null,
                sources: book.sources || [],
                scan_id: scan.id,
                created_at: scan.created_at,
            };

            const { error: insertError } = await supabase
                .from('user_books')
                .upsert(bookRow, {
                    onConflict: 'user_id, LOWER(TRIM(title)), LOWER(COALESCE(TRIM(author), \'\'))',
                    ignoreDuplicates: false // update with latest data if duplicate
                });

            if (insertError) {
                // If upsert with the constraint fails, try a simpler insert-or-skip approach
                const { error: fallbackError } = await supabase
                    .from('user_books')
                    .insert(bookRow);

                if (fallbackError) {
                    if (fallbackError.code === '23505') {
                        // Duplicate - this is expected and fine
                        totalSkipped++;
                    } else {
                        console.error(`  ⚠️  Error inserting "${book.title}":`, fallbackError.message);
                        totalErrors++;
                    }
                } else {
                    totalInserted++;
                }
            } else {
                totalInserted++;
            }
        }
    }

    console.log('\n✅ Backfill complete!');
    console.log(`   Inserted: ${totalInserted}`);
    console.log(`   Skipped (duplicates): ${totalSkipped}`);
    console.log(`   Errors: ${totalErrors}`);
}

backfill().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});