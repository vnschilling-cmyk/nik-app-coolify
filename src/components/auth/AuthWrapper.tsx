"use client";

import { useAuth } from "@/hooks/useAuth";
import AuthForm from "@/components/auth/AuthForm";
import Image from "next/image";
import { useDesign } from "@/context/DesignContext";
import { useEffect, useState } from "react";

export default function AuthWrapper({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const { settings } = useDesign();
    // Prevent hydration mismatch
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // While checking auth status
    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    // Not logged in -> Show Login Screen ONLY
    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-500">
                <div className="w-full max-w-sm animate-fadeIn flex flex-col items-center">
                    <div className="flex flex-col items-center text-center w-full">
                        {/* Logo */}
                        <div className="relative w-[350px] h-[350px] -mb-12">
                            <Image
                                src={settings.theme === 'dark' ? "/logo-dark.png" : "/logo-light.png"}
                                alt="Nikodemos Logo"
                                fill
                                className="object-contain drop-shadow-lg"
                                priority
                            />
                        </div>
                    </div>

                    <div className="w-full bg-white dark:bg-slate-800 p-1 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700/50">
                        <AuthForm />
                    </div>

                    <div className="text-center text-xs text-slate-400 dark:text-slate-500">
                        © {new Date().getFullYear()} Nikodemus
                    </div>
                </div>
            </div>
        );
    }

    // Logged in -> Show App Content
    return <>{children}</>;
}
