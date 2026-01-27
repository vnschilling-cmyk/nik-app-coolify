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
    const [timeLeft, setTimeLeft] = useState(20);
    const [score, setScore] = useState(0);
    const [gameState, setGameState] = useState<"intro" | "playing" | "feedback" | "finished">("intro");
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isCorrect, setIsCorrect] = useState(false);

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
        setTimeout(nextQuestion, 2000);
    };

    const handleAnswer = (idx: number) => {
        if (gameState !== "playing") return;

        setSelectedOption(idx);
        const correct = idx === quiz.questions[currentIndex].correct_index;
        setIsCorrect(correct);
        if (correct) {
            setScore(s => s + 1);
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 }
            });
        }

        setGameState("feedback");
        setTimeout(nextQuestion, 2000); // Show feedback for 2s
    };

    const nextQuestion = () => {
        if (currentIndex < quiz.questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setTimeLeft(20);
            setSelectedOption(null);
            setGameState("playing");
        } else {
            finishQuiz();
        }
    };

    const finishQuiz = async () => {
        setGameState("finished");

        const finalScore = score + (selectedOption === quiz.questions[currentIndex].correct_index ? 1 : 0);
        const total = quiz.questions.length;
        const percentage = Math.round((finalScore / total) * 100);
        const { grade } = calculateGrade(percentage);

        try {
            await pb.collection('quiz_results').create({
                user: pb.authStore.model?.id,
                quiz: quiz.id,
                score: finalScore,
                total: total,
                percentage: percentage,
                grade: grade
            });
        } catch (e: any) {
            console.error("Failed to save result", e.message);
        }

        if (percentage >= 80) {
            confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
        }
    };

    const currentQ = quiz.questions[currentIndex];

    // Render Intro
    if (gameState === "intro") {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-800 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="max-w-md w-full space-y-8">
                    <Trophy className="w-24 h-24 mx-auto text-yellow-500 animate-bounce" />
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{quiz.title}</h2>
                        <p className="text-zinc-400">Teste dein Wissen mit {quiz.questions.length} Fragen!</p>
                    </div>

                    <div className="bg-slate-700 border border-slate-600 p-4 rounded-xl text-left space-y-2">
                        <div className="flex items-center gap-3 text-zinc-300">
                            <Timer size={20} className="text-indigo-400" />
                            <span>20 Sekunden pro Frage</span>
                        </div>
                        <div className="flex items-center gap-3 text-zinc-300">
                            <CheckCircle size={20} className="text-emerald-400" />
                            <span>4 Antwortmöglichkeiten</span>
                        </div>
                    </div>

                    <button
                        onClick={() => { setGameState("playing"); setTimeLeft(20); }}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xl shadow-lg shadow-indigo-600/30 transition-all scale-100 hover:scale-105 active:scale-95"
                    >
                        Test Starten
                    </button>

                    <button onClick={onClose} className="text-zinc-500 hover:text-white">Abbrechen</button>
                </div>
            </div>
        );
    }

    // Render Finished
    if (gameState === "finished") {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-800 flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
                <div className="max-w-md w-full bg-slate-700 border border-slate-600 rounded-2xl p-8 shadow-2xl">
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
                <button onClick={onClose} className="p-2 hover:bg-slate-600 rounded-full"><X size={24} /></button>
            </div>

            {/* Timer Bar */}
            <div className="h-1 bg-slate-700 w-full overflow-hidden">
                <div
                    className={`h-full transition-all duration-1000 ease-linear ${timeLeft < 5 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(timeLeft / 20) * 100}%` }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full">
                {/* Question */}
                <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 leading-snug">
                    {currentQ.question}
                </h3>

                {/* Options */}
                <div className="w-full grid gap-4">
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
                                className={`w-full p-4 rounded-xl border-2 text-lg font-medium text-left transition-all transform active:scale-[0.98] ${btnClass} flex justify-between items-center`}
                            >
                                <span>{opt}</span>
                                {gameState === "feedback" && idx === currentQ.correct_index && <CheckCircle size={24} />}
                                {gameState === "feedback" && idx === selectedOption && idx !== currentQ.correct_index && <XCircle size={24} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
