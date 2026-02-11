"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, Timer, Trophy } from "lucide-react";
import confetti from "canvas-confetti";
import { pb } from "@/lib/pocketbase";
import { calculateGrade } from "@/lib/grades";

interface Question {
    question: string;
    options: string[];
    correct_index: number;
    difficulty?: string;
}

interface Quiz {
    id: string;
    title: string;
    questions: Question[];
}

interface QuizOverlayProps {
    quiz: Quiz;
    onClose: () => void;
}

export default function QuizOverlay({ quiz, onClose }: QuizOverlayProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<"intro" | "playing" | "feedback" | "finished">("intro");
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

    const [questionCount, setQuestionCount] = useState(5);
    const [timeLimit, setTimeLimit] = useState(30);
    const [difficulty, setDifficulty] = useState<"Bauer" | "Hirte" | "Gamaliel">("Bauer");
    const [activeQuestions, setActiveQuestions] = useState<Question[]>([]);

    // Timer Logic
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (gameState === "playing" && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && gameState === "playing") {
            handleTimeUp();
        }
        return () => clearInterval(timer);
    }, [gameState, timeLeft]);

    const handleTimeUp = () => {
        setIsCorrect(false);
        setGameState("feedback");
        setTimeout(() => nextQuestion(), 2000);
    };

    const startQuiz = () => {
        // Filter questions based on difficulty
        // Logic:
        // - "Bauer": Prefer "Bauer", if not enough, fill with "Hirte" or any.
        // - "Hirte": Prefer "Hirte", allow "Bauer" and "Gamaliel" if needed? Or specific?
        // Let's implement strict preference first, then fallback.

        let filtered = quiz.questions.filter(q => q.difficulty === difficulty);

        // Fallback: If no questions match difficulty, or too few, mix in others?
        // For now, if we have matching questions, use them. If 0, use all (fallback for legacy quizzes).
        if (filtered.length === 0) {
            filtered = [...quiz.questions];
        }

        // Shuffle and slice
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        // If we requested more questions than available, take all available
        const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

        if (selected.length === 0) {
            alert("Keine Fragen für dieses Niveau verfügbar.");
            return;
        }

        setActiveQuestions(selected);

        setCurrentIndex(0);
        setScore(0);
        setTimeLeft(timeLimit);
        setGameState("playing");
    };

    const handleAnswer = (idx: number) => {
        if (gameState !== "playing") return;

        setSelectedOption(idx);
        const correct = idx === activeQuestions[currentIndex].correct_index;
        setIsCorrect(correct);
        // Calculate new score immediately to avoid stale state in timeout
        const newScore = correct ? score + 1 : score;

        if (correct) {
            setScore(s => s + 1);
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        }

        setGameState("feedback");
        setTimeout(() => nextQuestion(newScore), 2000); // Show feedback for 2s
    };

    const nextQuestion = (currentScore?: number) => {
        // Use provided score or fall back to state (though state might be stale in timeout)
        const activeScore = currentScore !== undefined ? currentScore : score;

        if (currentIndex < activeQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(timeLimit);
            setSelectedOption(null);
            setGameState("playing");
        } else {
            finishQuiz(activeScore);
        }
    };

    const finishQuiz = async (finalScore: number) => {
        setGameState("finished");

        // Force update local score state to match final score for display
        setScore(finalScore);

        const total = activeQuestions.length;
        const percentage = Math.round((finalScore / total) * 100);
        const { grade } = calculateGrade(percentage);

        try {
            await pb.collection('quiz_results').create({
                user: pb.authStore.model?.id,
                quiz: quiz.id,
                score: finalScore,
                total: total,
                percentage: percentage,
                grade: grade,
                // store difficulty if we had a field for it, currently skipping
            });
        } catch (e: any) {
            console.error("Failed to save result", e.message);
        }

        if (percentage >= 80) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
    };

    // Safe check if activeQuestions is populated during playing/feedback/finished
    const currentQ = activeQuestions[currentIndex] || quiz.questions[0];

    // Render Intro / Settings
    if (gameState === "intro") {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-800 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="max-w-md w-full space-y-6">
                    <Trophy className="w-20 h-20 mx-auto text-yellow-500 animate-bounce" />
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-2">{quiz.title}</h2>
                        <p className="text-zinc-400 text-sm">Passe dein Training an</p>
                    </div>

                    <div className="bg-slate-700/50 border border-slate-600/50 p-6 rounded-2xl text-left space-y-6 backdrop-blur-sm">

                        {/* Difficulty Selection */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Niveau</label>
                            <div className="grid grid-cols-3 gap-2">
                                {(["Bauer", "Hirte", "Gamaliel"] as const).map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setDifficulty(level)}
                                        className={`py-2 px-1 rounded-lg text-xs font-bold uppercase transition-all border-2 ${difficulty === level
                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                                            : "bg-slate-800 border-slate-700 text-zinc-400 hover:border-slate-500"
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Question Count Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Anzahl Fragen</label>
                                <span className="text-xl font-bold text-white font-mono">{questionCount}</span>
                            </div>
                            <input
                                type="range"
                                min="5"
                                max="10"
                                step="1"
                                value={questionCount}
                                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                                aria-label="Anzahl der Fragen auswählen"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase">
                                <span>5</span>
                                <span>10</span>
                            </div>
                        </div>

                        {/* Time Limit Slider */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-end">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Zeit pro Frage</label>
                                <span className="text-xl font-bold text-white font-mono">{timeLimit}s</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="60"
                                step="5"
                                value={timeLimit}
                                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                                aria-label="Zeitlimit pro Frage auswählen"
                            />
                            <div className="flex justify-between text-[10px] text-zinc-500 font-mono uppercase">
                                <span>10s</span>
                                <span>60s</span>
                            </div>
                        </div>

                    </div>

                    <button
                        onClick={startQuiz}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-indigo-600/30 transition-all scale-100 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        title="Quiz starten"
                    >
                        <span>Test Starten</span>
                    </button>

                    <button onClick={onClose} className="text-zinc-500 hover:text-white text-sm" title="Quiz abbrechen">Abbrechen</button>
                </div>
            </div>
        );
    }

    // Render Finished
    if (gameState === "finished") {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-800 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="max-w-md w-full bg-slate-700 border border-slate-600 rounded-2xl p-8 shadow-2xl relative">
                    <h2 className="text-2xl font-bold text-white mb-6">Ergebnis</h2>

                    <div className="flex justify-center mb-8">
                        <div className="relative w-32 h-32 flex items-center justify-center">
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                <circle cx="64" cy="64" r="60" fill="none" stroke="#1e293b" strokeWidth="8" />
                                <circle
                                    cx="64" cy="64" r="60"
                                    fill="none"
                                    stroke={score > quiz.questions.length / 2 ? "#10b981" : "#eab308"}
                                    strokeWidth="8"
                                    strokeDasharray={`${(score / quiz.questions.length) * 377} 377`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <span className="text-4xl font-bold text-white">{score}/{quiz.questions.length}</span>
                        </div>
                    </div>

                    <p className="text-zinc-400 mb-8">
                        {score === quiz.questions.length ? "Perfekt! Du bist ein Profi. 🏆" :
                            score > quiz.questions.length / 2 ? "Gut gemacht! 👏" : "Übung macht den Meister. 💪"}
                    </p>

                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition-colors"
                        title="Schließen"
                    >
                        Schließen
                    </button>
                </div>
            </div>
        );
    }

    // Render Question (Playing or Feedback)
    return (
        <div className="fixed inset-0 z-[100] bg-slate-800 text-white flex flex-col">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-slate-700/50 backdrop-blur border-b border-slate-600">
                <div className="flex items-center gap-2 text-zinc-400 font-medium">
                    <span>Frage {currentIndex + 1}</span>
                    <span className="text-zinc-600">/</span>
                    <span>{quiz.questions.length}</span>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-600 rounded-full" title="Quiz schließen"><X size={24} /></button>
            </div>

            {/* Timer Bar */}
            <div className="h-1 bg-slate-700 w-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                />
            </div>

            {/* Content SCROLLABLE */}
            <div className="flex-1 overflow-y-auto w-full">
                <div className="min-h-full flex flex-col items-center justify-center p-4 md:p-6 max-w-2xl mx-auto w-full">
                    {/* Question */}
                    <h3 className="text-xl md:text-3xl font-bold text-center mb-6 md:mb-12 leading-snug text-slate-100">
                        {currentQ.question}
                    </h3>

                    {/* Options */}
                    <div className="w-full grid gap-3 md:gap-4">
                        {currentQ.options.map((opt, idx) => {
                            let btnClass = "bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-slate-500"; // Default

                            if (gameState === "feedback") {
                                if (idx === currentQ.correct_index) {
                                    btnClass = "bg-emerald-500/20 border-emerald-500 text-emerald-400"; // Correct
                                } else if (idx === selectedOption) {
                                    btnClass = "bg-red-500/20 border-red-500 text-red-400"; // Wrong selected
                                } else {
                                    btnClass = "bg-slate-700 border-slate-600 opacity-50"; // Others dimmed
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    disabled={gameState !== "playing"}
                                    onClick={() => handleAnswer(idx)}
                                    className={`w-full p-3 md:p-4 rounded-xl border-2 text-base md:text-lg font-medium text-left transition-all transform active:scale-[0.98] ${btnClass} flex justify-between items-center`}
                                >
                                    <span>{opt}</span>
                                    {gameState === "feedback" && idx === currentQ.correct_index && <CheckCircle size={20} className="md:w-6 md:h-6 flex-shrink-0" />}
                                    {gameState === "feedback" && idx === selectedOption && idx !== currentQ.correct_index && <XCircle size={20} className="md:w-6 md:h-6 flex-shrink-0" />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
