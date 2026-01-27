"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, GraduationCap, Settings } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Bibel", href: "/bible", icon: BookOpen },
    { label: "Studium", href: "/study", icon: GraduationCap },
    { label: "Setup", href: "/setup", icon: Settings },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-background/80 dark:bg-background/90 backdrop-blur-xl border-t border-zinc-200/50 dark:border-slate-700/50 pb-[env(safe-area-inset-bottom)] z-50">
            <div className="flex justify-around items-center h-16 max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                                isActive
                                    ? "text-indigo-600 dark:text-indigo-400 scale-105"
                                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 active:scale-95"
                            )}
                        >
                            <div className={clsx(
                                "p-1.5 rounded-xl transition-all",
                                isActive && "bg-indigo-100 dark:bg-indigo-900/40"
                            )}>
                                <Icon size={28} strokeWidth={isActive ? 2.5 : 1.8} />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
