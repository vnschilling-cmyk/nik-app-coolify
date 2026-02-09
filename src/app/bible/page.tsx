import { getBookByShortName, getVerses, getBooks, getLessonsForChapter, getTextStudiesForChapter, getFactsAndQuestionsForChapter } from "@/lib/bible";
import BiblePageClient from "./client";
import Link from "next/link";

interface BiblePageProps {
    searchParams: {
        book?: string;
        chapter?: string;
    };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BiblePage({ searchParams }: BiblePageProps) {
    const bookParam = searchParams.book || "Gen";
    const chapterParam = parseInt(searchParams.chapter || "1", 10);

    const [bookRes, allBooks] = await Promise.all([
        getBookByShortName(bookParam),
        getBooks()
    ]);

    console.log(`[BiblePage] Request for book: '${bookParam}', chapter: ${chapterParam}`);
    console.log(`[BiblePage] Total books loaded: ${allBooks.length}`);

    // Robust fallback strategy
    let targetBook = bookRes;

    if (!targetBook && allBooks.length > 0) {
        // Try precise match first
        const normalize = (s: string) => s.toLowerCase().replace(/[.\s]/g, '');
        const searchTarget = normalize(bookParam);

        targetBook = allBooks.find(b => normalize(b.short_name) === searchTarget) ||
            allBooks.find(b => normalize(b.name) === searchTarget);

        if (targetBook) {
            console.log(`[BiblePage] Recovered book '${bookParam}' via fallback as '${targetBook.short_name}'`);
        }
    }

    // Default to Gen if specifically requested "Gen" and failed (though fallback above should catch it)
    if (!targetBook && allBooks.length > 0 && bookParam === "Gen") {
        console.log(`[BiblePage] Default 'Gen' not found, falling back to '${allBooks[0].short_name}'`);
        targetBook = allBooks[0];
    }

    if (!targetBook) {
        console.error(`[BiblePage] Book '${bookParam}' not found. Available books samples:`, allBooks.slice(0, 3).map(b => b.short_name));
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center">
                <p className="text-lg font-medium text-zinc-600">Buch "{bookParam}" nicht gefunden.</p>
                <Link href={allBooks.length > 0 ? `/bible?book=${allBooks[0].short_name}&chapter=1` : "/"} className="text-blue-600 hover:underline">
                    {allBooks.length > 0 ? `Gehe zu ${allBooks[0].name}` : "Zurück zur Startseite"}
                </Link>
            </div>
        );
    }

    // Use targetBook from here on
    const [verses, lessons, textStudies] = await Promise.all([
        getVerses(targetBook.id, chapterParam),
        getLessonsForChapter(targetBook.id, chapterParam),
        getTextStudiesForChapter(targetBook.id, chapterParam)
    ]);

    return (
        <BiblePageClient
            verses={verses}
            lessons={lessons}
            textStudies={textStudies}
            book={targetBook}
            chapter={chapterParam}
            allBooks={allBooks}
        />
    );
}
