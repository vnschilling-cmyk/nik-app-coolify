"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, GraduationCap, Settings, Library } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: Home },
    { label: "Bibel", href: "/bible", icon: BookOpen },
    { label: "Studium", href: "/study", icon: GraduationCap },
    { label: "Bibliothek", href: "/library", icon: Library },
    { label: "Setup", href: "/setup", icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname === "/setup/workbook") return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center p-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pointer-events-none">
            <div className="flex justify-between items-center gap-2 w-full max-w-sm px-4 py-2 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl border border-white/20 dark:border-slate-700/50 shadow-2xl pointer-events-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-indigo-600 text-white shadow-indigo-500/30 shadow-lg"
                                    : "text-zinc-500 hover:bg-zinc-100 dark:hover:bg-slate-700/50"
                            )}
                        >
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="sm:w-6 sm:h-6" />
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
