import { pb } from './pocketbase';

export interface BibleBook {
    id: string;
    name: string;
    short_name: string; // e.g., 'Gen'
    order: number;
    testament: 'OT' | 'NT';
    chapter_count: number;
    chapters: number; // Alias
}

export interface BibleVerse {
    id: string;
    book: string; // Book ID
    chapter: number;
    verse: number;
    text: string;
    translation: string;
}

export interface LinkedLesson {
    id: string;
    title: string;
    category: string;
    verse_start: number;
    verse_end: number;
}

// Cache for books to avoid repeated fetches
let cachedBooks: BibleBook[] | null = null;

export async function getBooks(): Promise<BibleBook[]> {
    if (cachedBooks) return cachedBooks;

    try {
        const records = await pb.collection('bible_books').getFullList({
            sort: 'order',
        });

        // Map to typed interface just to be safe
        cachedBooks = records.map(r => ({
            id: r.id,
            name: r.name,
            short_name: r.short_name,
            order: r.order,
            testament: r.testament,
            chapter_count: r.chapter_count,
            chapters: r.chapter_count // Alias for frontend compatibility
        }));

        return cachedBooks;
    } catch (e) {
        console.error("Failed to fetch books:", e);
        return [];
    }
}

export async function getBookByShortName(shortName: string): Promise<BibleBook | undefined> {
    const books = await getBooks();
    return books.find(b => b.short_name.toLowerCase() === shortName.toLowerCase()) ||
        books.find(b => b.name.toLowerCase() === shortName.toLowerCase()); // Fallback to full name
}

export async function getVerses(bookId: string, chapter: number): Promise<BibleVerse[]> {
    try {
        const records = await pb.collection('verses').getList(1, 200, {
            filter: `book="${bookId}" && chapter=${chapter}`,
            sort: 'verse',
        });

        return records.items.map(r => ({
            id: r.id,
            book: r.book,
            chapter: r.chapter,
            verse: r.verse,
            text: r.text,
            translation: r.translation
        }));
    } catch (e) {
        console.error(`Failed to fetch verses for book ${bookId} ch ${chapter}:`, e);
        return [];
    }
}

export async function getLessonsForChapter(bookId: string, chapter: number): Promise<LinkedLesson[]> {
    try {
        // Filter: book_id matches AND chapter range overlaps with current chapter (simplified: equal start/end or within)
        // For simplicity, we assume lessons are usually single chapter or we check for start range match.
        // Let's broaden it: book_id matches. Client can filter precisely if needed, or we use complex filter.
        // Filter: book_id = '...' && chapter_start <= X && chapter_end >= X
        const filter = `book_id="${bookId}" && chapter_start<=${chapter} && chapter_end>=${chapter}`;

        const records = await pb.collection('lessons').getFullList({
            filter: filter,
            sort: 'verse_start',
        });

        return records.map(r => ({
            id: r.id,
            title: r.title,
            category: r.category,
            verse_start: r.verse_start,
            verse_end: r.verse_end,
        }));
    } catch (e) {
        console.error(`Failed to fetch lessons for book ${bookId} ch ${chapter}:`, e);
        return [];
    }
}
