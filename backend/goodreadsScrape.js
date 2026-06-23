const { fetch } = require ('undici');
const cheerio = require ('cheerio');
const { decode } = require ('html-entities');

async function getGoodreads(isbn, name, author){
    let url

    if (isbn) {
        url = `https://www.goodreads.com/book/isbn/${encodeURIComponent(isbn)}`;
    } else {
        const site = new URL(`https://www.goodreads.com/search`);
        site.searchParams.set("q", `${name} ${author}`.trim());
        const searchRes = await fetch(site);
        const searchHtml = await searchRes.text();
        const $s = cheerio.load(searchHtml);
        const bookPath = $s('a.bookTitle').first().attr('href');
        if (!bookPath) return null;
        url = `https://www.goodreads.com${bookPath}`;
    }
    const response = await fetch(url, { signal: AbortSignal.timeout(5000) });

    if(!response.ok) return null;

    const html = await response.text();

    try {
        const $ = cheerio.load(html)
        const script = $('script[type="application/ld+json"]').html();
        if (!script) return null;

        const raw = JSON.parse(script);
        const rating = raw.aggregateRating;
        const desc = $('[data-testid="description"]');
        let author = raw.author?.[0]?.name;


        return {
            name: decode(raw.name),
            isbn: raw.isbn,
            author: decode(author),
            image: raw.image,
            average_rating: rating?.ratingValue != null ? Number(rating.ratingValue) : null,
            ratings_count: rating?.ratingCount != null ? Number(rating.ratingCount) : null,
            description: desc.text().trim(),
            source: 'goodreads',
        }

    } catch (err){
        console.error('Goodreads parse error:', err.message);
        return null;
    }

}


