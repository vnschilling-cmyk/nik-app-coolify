"use server";

import { pb } from "@/lib/pocketbase";
import { SearchResult } from "@/lib/bible";

export type SearchResponse =
    | { success: true; data: SearchResult[]; count: number }
    | { success: false; error: string };

export async function searchBibleAction(
    query: string,
    filter?: { bookId?: string; testament?: 'OT' | 'NT' },
    limit: number = 50
): Promise<SearchResponse> {
    const baseUrl = pb.baseUrl || process.env.NEXT_PUBLIC_POCKETBASE_URL;

    try {
        console.log(`Server Action (fetch): Searching for "${query}" at ${baseUrl}`);

        // 1. Build Filter
        const parts = [`text ~ "${query.replace(/"/g, '')}"`];

        if (filter?.bookId) {
            parts.push(`book = "${filter.bookId}"`);
        } else if (filter?.testament) {
            // Retrieve books for filter via fetch to avoid sdk issues
            try {
                const booksUrl = new URL(`${baseUrl}/api/collections/bible_books/records`);
                booksUrl.searchParams.append('perPage', '200');

                const booksRes = await fetch(booksUrl.toString(), { cache: 'no-store' });
                if (booksRes.ok) {
                    const booksData = await booksRes.json();
                    const ids = booksData.items
                        .filter((b: any) => b.testament === filter.testament)
                        .map((b: any) => `book="${b.id}"`)
                        .join("||");
                    if (ids) parts.push(`(${ids})`);
                }
            } catch (e) {
                console.warn("Failed to fetch books for filter:", e);
            }
        }

        const filterParam = parts.join(' && ');

        // 2. Fetch Verses
        const url = new URL(`${baseUrl}/api/collections/verses/records`);
        url.searchParams.append('page', '1');
        url.searchParams.append('perPage', limit.toString());
        // 'order' field does not exist in verses schema, causing 400.
        // We will sort in memory after fetching.
        // url.searchParams.append('sort', 'order'); 
        url.searchParams.append('filter', filterParam);
        url.searchParams.append('expand', 'book');

        const res = await fetch(url.toString(), {
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!res.ok) {
            const errText = await res.text();
            throw new Error(`API ${res.status}: ${errText.substring(0, 100)}`);
        }

        const data = await res.json();

        let results = data.items.map((r: any) => {
            const bookData = r.expand?.book;
            return {
                id: r.id || "",
                book: r.book || "",
                chapter: r.chapter || 0,
                verse: r.verse || 0,
                text: r.text || "",
                translation: r.translation || "",
                bookName: bookData?.name || "Unbekannt",
                bookShort: bookData?.short_name || "Unk",
                // Internal use for sorting
                _bookOrder: bookData?.order || 999
            };
        });

        // Sort results by Book Order -> Chapter -> Verse
        results.sort((a: any, b: any) => {
            if (a._bookOrder !== b._bookOrder) return a._bookOrder - b._bookOrder;
            if (a.chapter !== b.chapter) return a.chapter - b.chapter;
            return a.verse - b.verse;
        });

        // Clean up internal field if needed, but extra fields are fine
        return { success: true, data: results, count: data.totalItems };

    } catch (e: any) {
        console.error("Server Action failed:", e);
        return {
            success: false,
            error: `Fehler (${baseUrl}): ${e.message || "Unbekannt"}`
        };
    }
}
