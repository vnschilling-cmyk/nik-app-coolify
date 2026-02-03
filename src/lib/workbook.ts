import { pb } from './pocketbase';
import { VerseData } from '@/components/features/BibleReader';

export interface WorkbookLesson {
    id: string;
    title: string;
    content: string;
    category: string;
    verse_ref: string;
    book_id: string;
    chapter_start: number;
    chapter_end: number;
    verse_start: number;
    verse_end: number;
    facts: any[];
    questions: any[];
    quizzes: any[];
    memoryVerses: any[];
    verses: VerseData[];
}

export const fetchWorkbookData = async (lessonIds: string[]): Promise<WorkbookLesson[]> => {
    if (lessonIds.length === 0) return [];

    const idsFilter = lessonIds.map(id => `id="${id}"`).join(" || ");
    const lessonFilter = lessonIds.map(id => `lesson_id="${id}"`).join(" || ");

    const [lessons, facts, questions, memoryVerses, quizzes] = await Promise.all([
        pb.collection('lessons').getFullList({ filter: idsFilter, sort: 'order' }),
        pb.collection('facts').getFullList({ filter: lessonFilter, sort: 'order' }),
        pb.collection('questions').getFullList({ filter: lessonFilter, sort: 'question' }),
        pb.collection('memory_verses').getFullList({ filter: lessonFilter }),
        pb.collection('quizzes').getFullList({ filter: lessonFilter }),
    ]);

    // Fetch verses for each lesson that has a bible ref
    const workbookLessons = await Promise.all(lessons.map(async (l) => {
        let verses: VerseData[] = [];
        if (l.book_id && l.chapter_start > 0) {
            try {
                const verseRecords = await pb.collection('verses').getFullList({
                    filter: `book="${l.book_id}" && chapter=${l.chapter_start} && verse >= ${l.verse_start} && verse <= ${l.verse_end}`,
                    sort: 'verse'
                });
                verses = verseRecords.map(v => ({ verse: v.verse, text: v.text }));
            } catch (e) {
                console.error(`Failed to fetch verses for lesson ${l.id}:`, e);
            }
        }

        const collator = new Intl.Collator('de', { numeric: true, sensitivity: 'base' });
        return {
            id: l.id,
            title: l.title,
            content: l.content || "",
            category: l.category || "",
            verse_ref: l.verse_ref || "",
            book_id: l.book_id,
            chapter_start: l.chapter_start,
            chapter_end: l.chapter_end,
            verse_start: l.verse_start,
            verse_end: l.verse_end,
            facts: facts.filter(f => f.lesson_id === l.id),
            questions: questions.filter(q => q.lesson_id === l.id).sort((a, b) => collator.compare(a.question, b.question)),
            quizzes: quizzes.filter(q => q.lesson_id === l.id),
            memoryVerses: memoryVerses.filter(mv => mv.lesson_id === l.id),
            verses
        };
    }));

    // Maintain the order in which IDs were provided if possible, or use lesson.order
    return workbookLessons;
};
