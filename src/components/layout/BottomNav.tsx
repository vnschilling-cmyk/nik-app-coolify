"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, GraduationCap, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Bibel", href: "/bible", icon: BookOpen },
    { label: "Studium", href: "/study", icon: GraduationCap },
    { label: "Setup", href: "/setup", icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === "/setup/workbook") return null;

    return (
        <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-6 pointer-events-none">
            <div className="flex justify-between items-center pointer-events-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 shadow-xl border backdrop-blur-lg",
                                isActive
                                    ? "bg-indigo-600 text-white border-indigo-500"
                                    : "bg-white/90 dark:bg-slate-800/90 text-zinc-400 dark:text-zinc-500 border-white dark:border-slate-700/50 hover:scale-105 active:scale-95"
                            )}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
