"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, MessageCircleQuestion, User } from "lucide-react";
import clsx from "clsx";

const navItems = [
    { label: "Bibel", href: "/bible", icon: BookOpen },
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Fragen", href: "/questions", icon: MessageCircleQuestion },
    { label: "Profil", href: "/profile", icon: User },
];

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-[env(safe-area-inset-bottom)] z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform",
                                isActive ? "text-blue-600 dark:text-blue-400" : "text-zinc-500 dark:text-zinc-400"
                            )}
                        >
                            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[10px] font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
