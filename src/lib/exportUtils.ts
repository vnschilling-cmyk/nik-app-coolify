import * as XLSX from 'xlsx';
import { pb } from './pocketbase';

export const exportLessonsToExcel = async (lessonIds: string[]) => {
    try {
        if (lessonIds.length === 0) {
            alert("Bitte wähle mindestens eine Lektion aus.");
            return;
        }

        // 1. Fetch Data
        // Construct filter for selected IDs
        const idsFilter = lessonIds.map(id => `id="${id}"`).join(" || ");
        const lessonFilter = lessonIds.map(id => `lesson_id="${id}"`).join(" || ");

        const [lessons, facts, questions, memoryVerses, quizzes] = await Promise.all([
            pb.collection('lessons').getFullList({ filter: idsFilter, sort: 'order' }),
            pb.collection('facts').getFullList({ filter: lessonFilter, sort: 'verse_start' }),
            pb.collection('questions').getFullList({ filter: lessonFilter, sort: 'verse_start' }),
            pb.collection('memory_verses').getFullList({ filter: lessonFilter }),
            pb.collection('quizzes').getFullList({ filter: lessonFilter }),
        ]);

        // 2. Prepare Sheets Data

        // Sheet: Lektionen (Overview)
        const lessonsData = lessons.map(l => ({
            ID: l.id,
            Titel: l.title,
            Kategorie: l.category,
            "Bibel-Referenz": l.verse_ref,
            Inhalte: l.content // HTML Content
        }));

        // Sheet: Infos & Medien (Facts)
        const factsData = facts.map(f => {
            const relatedLesson = lessons.find(l => l.id === f.lesson_id);
            return {
                "Lektion": relatedLesson?.title || f.lesson_id,
                "Titel": f.title,
                "Typ": f.type,
                "Kategorie": f.category,
                "Beschreibung": f.description,
                "Vers Start": f.verse_start,
                "Vers Ende": f.verse_end
            };
        });

        // Sheet: Fragen
        const questionsData = questions.map(q => {
            const relatedLesson = lessons.find(l => l.id === q.lesson_id);
            return {
                "Lektion": relatedLesson?.title || q.lesson_id,
                "Frage": q.question,
                "Antwort": q.answer,
                "Kategorie": q.category,
                "Vers Bezug": q.verse_start > 0 ? `${q.verse_start}-${q.verse_end}` : ""
            };
        });

        // Sheet: Lernverse
        const memoryVersesData = memoryVerses.map(mv => {
            const relatedLesson = lessons.find(l => l.id === mv.lesson_id);
            return {
                "Lektion": relatedLesson?.title || mv.lesson_id,
                "Text": mv.text,
                "Referenz": `${mv.chapter}:${mv.verse_start}` // Simplified, ideally expand book name
            };
        });

        // Sheet: Quizze
        const quizzesData: any[] = [];
        quizzes.forEach(q => {
            const relatedLesson = lessons.find(l => l.id === q.lesson_id);
            // Flatten quiz questions
            if (Array.isArray(q.questions)) {
                q.questions.forEach((qq: any, idx: number) => {
                    quizzesData.push({
                        "Lektion": relatedLesson?.title || q.lesson_id,
                        "Quiz Titel": q.title,
                        "Frage Nr.": idx + 1,
                        "Frage": qq.question,
                        "Richtige Antwort": qq.correctAnswer,
                        "Optionen": Array.isArray(qq.options) ? qq.options.join(" | ") : ""
                    });
                });
            }
        });


        // 3. Create Workbook
        const workbook = XLSX.utils.book_new();

        if (lessonsData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(lessonsData);
            XLSX.utils.book_append_sheet(workbook, ws, "Übersicht");
        }
        if (factsData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(factsData);
            XLSX.utils.book_append_sheet(workbook, ws, "Infos & Medien");
        }
        if (questionsData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(questionsData);
            XLSX.utils.book_append_sheet(workbook, ws, "Fragen");
        }
        if (memoryVersesData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(memoryVersesData);
            XLSX.utils.book_append_sheet(workbook, ws, "Lernverse");
        }
        if (quizzesData.length > 0) {
            const ws = XLSX.utils.json_to_sheet(quizzesData);
            XLSX.utils.book_append_sheet(workbook, ws, "Quizze");
        }

        // 4. Download
        XLSX.writeFile(workbook, `Lektionen_Export_${new Date().toISOString().slice(0, 10)}.xlsx`);

    } catch (e: any) {
        console.error("Export failed:", e);
        alert("Export fehlgeschlagen: " + e.message);
    }
};
