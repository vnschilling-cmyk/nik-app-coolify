import 'dotenv/config';
import PocketBase from 'pocketbase';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const PB_URL = process.env.PB_URL || 'http://127.0.0.1:8090';
const PB_EMAIL = process.env.PB_EMAIL;
const PB_PASSWORD = process.env.PB_PASSWORD;

if (!PB_EMAIL || !PB_PASSWORD) {
    console.error("Please set PB_EMAIL and PB_PASSWORD environment variables.");
    process.exit(1);
}

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);

// Standard Bible Book definitions (German Names)
const BOOKS = [
    // OT
    { name: '1. Mose', short: 'Gen', chapters: 50, testament: 'OT', order: 1 },
    { name: '2. Mose', short: 'Ex', chapters: 40, testament: 'OT', order: 2 },
    { name: '3. Mose', short: 'Lev', chapters: 27, testament: 'OT', order: 3 },
    { name: '4. Mose', short: 'Num', chapters: 36, testament: 'OT', order: 4 },
    { name: '5. Mose', short: 'Deut', chapters: 34, testament: 'OT', order: 5 },
    { name: 'Josua', short: 'Jos', chapters: 24, testament: 'OT', order: 6 },
    { name: 'Richter', short: 'Ri', chapters: 21, testament: 'OT', order: 7 },
    { name: 'Rut', short: 'Rut', chapters: 4, testament: 'OT', order: 8 },
    { name: '1. Samuel', short: '1Sam', chapters: 31, testament: 'OT', order: 9 },
    { name: '2. Samuel', short: '2Sam', chapters: 24, testament: 'OT', order: 10 },
    { name: '1. Könige', short: '1Kön', chapters: 22, testament: 'OT', order: 11 },
    { name: '2. Könige', short: '2Kön', chapters: 25, testament: 'OT', order: 12 },
    { name: '1. Chronik', short: '1Chr', chapters: 29, testament: 'OT', order: 13 },
    { name: '2. Chronik', short: '2Chr', chapters: 36, testament: 'OT', order: 14 },
    { name: 'Esra', short: 'Esr', chapters: 10, testament: 'OT', order: 15 },
    { name: 'Nehemia', short: 'Neh', chapters: 13, testament: 'OT', order: 16 },
    { name: 'Ester', short: 'Est', chapters: 10, testament: 'OT', order: 17 },
    { name: 'Hiob', short: 'Hiob', chapters: 42, testament: 'OT', order: 18 },
    { name: 'Psalm', short: 'Ps', chapters: 150, testament: 'OT', order: 19 },
    { name: 'Sprüche', short: 'Spr', chapters: 31, testament: 'OT', order: 20 },
    { name: 'Prediger', short: 'Pred', chapters: 12, testament: 'OT', order: 21 },
    { name: 'Hohelied', short: 'Hoh', chapters: 8, testament: 'OT', order: 22 },
    { name: 'Jesaja', short: 'Jes', chapters: 66, testament: 'OT', order: 23 },
    { name: 'Jeremia', short: 'Jer', chapters: 52, testament: 'OT', order: 24 },
    { name: 'Klagelieder', short: 'Klgl', chapters: 5, testament: 'OT', order: 25 },
    { name: 'Hesekiel', short: 'Hes', chapters: 48, testament: 'OT', order: 26 },
    { name: 'Daniel', short: 'Dan', chapters: 12, testament: 'OT', order: 27 },
    { name: 'Hosea', short: 'Hos', chapters: 14, testament: 'OT', order: 28 },
    { name: 'Joel', short: 'Jo', chapters: 3, testament: 'OT', order: 29 },
    { name: 'Amos', short: 'Am', chapters: 9, testament: 'OT', order: 30 },
    { name: 'Obadja', short: 'Ob', chapters: 1, testament: 'OT', order: 31 },
    { name: 'Jona', short: 'Jon', chapters: 4, testament: 'OT', order: 32 },
    { name: 'Micha', short: 'Mi', chapters: 7, testament: 'OT', order: 33 },
    { name: 'Nahum', short: 'Nah', chapters: 3, testament: 'OT', order: 34 },
    { name: 'Habakuk', short: 'Hab', chapters: 3, testament: 'OT', order: 35 },
    { name: 'Zefanja', short: 'Zef', chapters: 3, testament: 'OT', order: 36 },
    { name: 'Haggai', short: 'Hag', chapters: 2, testament: 'OT', order: 37 },
    { name: 'Sacharja', short: 'Sach', chapters: 14, testament: 'OT', order: 38 },
    { name: 'Maleachi', short: 'Mal', chapters: 3, testament: 'OT', order: 39 },
    // NT
    { name: 'Matthäus', short: 'Mt', chapters: 28, testament: 'NT', order: 40 },
    { name: 'Markus', short: 'Mk', chapters: 16, testament: 'NT', order: 41 },
    { name: 'Lukas', short: 'Lk', chapters: 24, testament: 'NT', order: 42 },
    { name: 'Johannes', short: 'Joh', chapters: 21, testament: 'NT', order: 43 },
    { name: 'Apostelgeschichte', short: 'Apg', chapters: 28, testament: 'NT', order: 44 },
    { name: 'Römer', short: 'Röm', chapters: 16, testament: 'NT', order: 45 },
    { name: '1. Korinther', short: '1Kor', chapters: 16, testament: 'NT', order: 46 },
    { name: '2. Korinther', short: '2Kor', chapters: 13, testament: 'NT', order: 47 },
    { name: 'Galater', short: 'Gal', chapters: 6, testament: 'NT', order: 48 },
    { name: 'Epheser', short: 'Eph', chapters: 6, testament: 'NT', order: 49 },
    { name: 'Philipper', short: 'Phil', chapters: 4, testament: 'NT', order: 50 },
    { name: 'Kolosser', short: 'Kol', chapters: 4, testament: 'NT', order: 51 },
    { name: '1. Thessalonicher', short: '1Thess', chapters: 5, testament: 'NT', order: 52 },
    { name: '2. Thessalonicher', short: '2Thess', chapters: 3, testament: 'NT', order: 53 },
    { name: '1. Timotheus', short: '1Tim', chapters: 6, testament: 'NT', order: 54 },
    { name: '2. Timotheus', short: '2Tim', chapters: 4, testament: 'NT', order: 55 },
    { name: 'Titus', short: 'Tit', chapters: 3, testament: 'NT', order: 56 },
    { name: 'Philemon', short: 'Phlm', chapters: 1, testament: 'NT', order: 57 },
    { name: 'Hebräer', short: 'Hebr', chapters: 13, testament: 'NT', order: 58 },
    { name: 'Jakobus', short: 'Jak', chapters: 5, testament: 'NT', order: 59 },
    { name: '1. Petrus', short: '1Petr', chapters: 5, testament: 'NT', order: 60 },
    { name: '2. Petrus', short: '2Petr', chapters: 3, testament: 'NT', order: 61 },
    { name: '1. Johannes', short: '1Joh', chapters: 5, testament: 'NT', order: 62 },
    { name: '2. Johannes', short: '2Joh', chapters: 1, testament: 'NT', order: 63 },
    { name: '3. Johannes', short: '3Joh', chapters: 1, testament: 'NT', order: 64 },
    { name: 'Judas', short: 'Jud', chapters: 1, testament: 'NT', order: 65 },
    { name: 'Offenbarung', short: 'Offb', chapters: 22, testament: 'NT', order: 66 },
];

async function main() {
    console.log(`Connecting to ${PB_URL}...`);
    console.log('Authenticating...');
    try {
        await pb.admins.authWithPassword(PB_EMAIL, PB_PASSWORD);
        console.log('Logged in.');
    } catch (e) {
        console.error('Authentication failed:', e.message);
        process.exit(1);
    }

    // 1. Ensure Books exist and get IDs
    console.log('Verifying Books...');
    const bookMap = new Map(); // order -> id

    for (const book of BOOKS) {
        try {
            const existing = await pb.collection('bible_books').getFirstListItem(`name="${book.name}"`);
            // console.log(`Book ${book.name} exists. ID: ${existing.id}`);
            bookMap.set(book.order, existing.id);
        } catch (e) {
            if (e.status === 404) {
                console.log(`Creating book: ${book.name}`);
                const record = await pb.collection('bible_books').create({
                    name: book.name,
                    short_name: book.short,
                    order: book.order,
                    testament: book.testament,
                    chapter_count: book.chapters
                });
                bookMap.set(book.order, record.id);
            } else {
                console.error(`Error checking book ${book.name}:`, e);
            }
        }
    }
    console.log('Books verified.');

    // 2. Load JSON
    const filePath = path.join(process.cwd(), 'scripts', 'de_schlachter.json');
    console.log(`Loading JSON from ${filePath}...`);
    let raw, json;
    try {
        raw = await fs.readFile(filePath, 'utf-8');

        // Strip potential BOM
        if (raw.charCodeAt(0) === 0xFEFF) {
            raw = raw.slice(1);
        }

        json = JSON.parse(raw);
        console.log(`JSON loaded. Found ${json.length} books.`);
    } catch (e) {
        console.error("Failed to load JSON:", e);
        // Print first 50 chars to debug
        if (raw) console.log("Partial content:", raw.substring(0, 50));
        process.exit(1);
    }

    // 3. Import
    const BATCH_SIZE = 50;
    const TRANSLATION = 'SCH2000';

    for (let i = 0; i < json.length; i++) {
        const bookData = json[i];
        const bookOrder = i + 1;

        // Safety check just in case
        if (bookOrder > 66) break;

        const bookDef = BOOKS[i];
        if (!bookDef) {
            console.error(`No definition for book index ${i}`);
            continue;
        }
        const bookName = bookDef.name;
        const bookId = bookMap.get(bookOrder);

        console.log(`\nProcessing ${bookName} (Order: ${bookOrder}, ID: ${bookId})...`);

        if (!bookId) {
            console.error(`Missing Book ID for ${bookName}`);
            continue;
        }

        const chapters = bookData.chapters; // Array of Arrays of Strings
        if (!chapters || !Array.isArray(chapters)) {
            console.error(`Invalid chapters data for ${bookName}`);
            continue;
        }
        console.log(`  Chapters: ${chapters.length}`);

        for (let chIndex = 0; chIndex < chapters.length; chIndex++) {
            const chapterNum = chIndex + 1;
            const verses = chapters[chIndex]; // Array of strings used as verse text

            if (!verses || !Array.isArray(verses)) {
                console.warn(`  Warning: Chapter ${chapterNum} is not an array.`);
                continue;
            }

            // Prepare promises
            const promises = verses.map((text, vIndex) => {
                const verseNum = vIndex + 1;

                return pb.collection('verses').create({
                    book: bookId,
                    chapter: chapterNum,
                    verse: verseNum,
                    text: text,
                    translation: TRANSLATION
                }).catch(e => {
                    if (e.status !== 400) { // Ignore unique constraint violations (duplicates)
                        console.error(`  Error insert ${bookName} ${chapterNum}:${verseNum}:`, e.message);
                    }
                    return null;
                });
            });

            // Run in batches
            for (let j = 0; j < promises.length; j += BATCH_SIZE) {
                const batch = promises.slice(j, j + BATCH_SIZE);
                await Promise.all(batch);
                process.stdout.write('.');
            }
        }
        process.stdout.write(' Done');
    }

    console.log('\nImport Complete!');
}

main().catch(console.error);
