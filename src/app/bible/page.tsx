import { getBookByShortName, getVerses, getBooks, getLessonsForChapter } from "@/lib/bible";
import BiblePageClient from "./client";
import Link from "next/link";

interface BiblePageProps {
    searchParams: {
        book?: string;
        chapter?: string;
    };
}

export default async function BiblePage({ searchParams }: BiblePageProps) {
    const bookParam = searchParams.book || "Gen";
    const chapterParam = parseInt(searchParams.chapter || "1", 10);

    const [book, allBooks] = await Promise.all([
        getBookByShortName(bookParam),
        getBooks()
    ]);

    if (!book) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <p className="text-lg font-medium text-zinc-600">Buch nicht gefunden.</p>
                <Link href="/bible?book=Gen&chapter=1" className="text-blue-600 hover:underline">
                    Zurück zum Anfang
                </Link>
            </div>
        );
    }

    const [verses, lessons] = await Promise.all([
        getVerses(book.id, chapterParam),
        getLessonsForChapter(book.id, chapterParam)
    ]);

    return (
        <BiblePageClient
            verses={verses}
            lessons={lessons}
            book={book}
            chapter={chapterParam}
            allBooks={allBooks}
        />
    );
}
