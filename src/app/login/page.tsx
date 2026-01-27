"use client";

import AuthForm from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user) {
            router.back();
        }
    }, [user, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-slate-900">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl p-8 border border-zinc-200 dark:border-slate-600 shadow-xl">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Willkommen zurück</h1>
                    <p className="text-zinc-500">Bitte melde dich an, um fortzufahren.</p>
                </div>

                <AuthForm />
            </div>
        </div>
    );
}
