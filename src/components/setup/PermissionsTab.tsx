"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { User, Shield, Check, X, Search, ChevronRight, ChevronDown, GraduationCap, Users } from "lucide-react";
import { usePermissions, UserRole, RoleConfig, PageId, SectionId, DEFAULT_ROLE_PERMISSIONS } from "@/hooks/usePermissions";
import clsx from "clsx";



const ROLES: { id: UserRole; label: string; description: string; icon: any; color: string }[] = [
    {
        id: "leader",
        label: "Jugendleiter",
        description: "Vollzugriff auf alle Bereiche und die Rechteverwaltung.",
        icon: Shield,
        color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
    },
    {
        id: "staff",
        label: "Mitarbeiter",
        description: "Zugriff auf Studium, Bibliothek und Design. Keine Rechteverwaltung.",
        icon: Users,
        color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
    },
    {
        id: "youth",
        label: "Jugendlicher",
        description: "Basiszugriff auf Bibel und Studium.",
        icon: GraduationCap,
        color: "text-zinc-500 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
    },
];

export default function PermissionsTab() {
    const { isLeader } = usePermissions();
    const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
    const [saving, setSaving] = useState<string | null>(null);

    const toggleCategory = (label: string) => {
        setExpandedCategories(prev =>
            prev.includes(label)
                ? prev.filter(l => l !== label)
                : [...prev, label]
        );
    };

    const PERMISSION_CATEGORIES: { label: string; items: { id: string; label: string; isPage?: boolean }[] }[] = [
        {
            label: "Seitenzugriff",
            items: [
                { id: "dashboard", label: "Dashboard", isPage: true },
                { id: "bible", label: "Bibel", isPage: true },
                { id: "study", label: "Studium", isPage: true },
                { id: "library", label: "Bibliothek", isPage: true },
                { id: "setup", label: "Setup", isPage: true },
            ]
        },
        {
            label: "Bibliothek: Inhalte",
            items: [
                { id: "content_management", label: "Lektionen & Quiz", isPage: false },
                { id: "word_studies", label: "Wortstudien", isPage: false },
                { id: "text_studies", label: "Auslegungen", isPage: false },
                { id: "facts", label: "Infos", isPage: false },
                { id: "quotes", label: "Zitate", isPage: false },
                { id: "illustrations", label: "Illustrationen", isPage: false },
                { id: "measures", label: "Bibel-Maße & Gewichte", isPage: false },
            ]
        },
        {
            label: "KI-Funktionen",
            items: [
                { id: "ai_lesson", label: "Lektionen-Generator", isPage: false },
                { id: "ai_quiz", label: "Quiz-Generator", isPage: false },
                { id: "ai_word_study", label: "Wortstudien-Assistent", isPage: false },
                { id: "ai_analysis", label: "Auslegungen-Assistent", isPage: false },
                { id: "ai_facts", label: "Infos-Generator", isPage: false },
                { id: "ai_quotes", label: "Zitate-Vorschläge", isPage: false },
                { id: "ai_verses", label: "Vers-Vorschläge", isPage: false },
                { id: "ai_illustrations", label: "Illustrationen-Suche", isPage: false },
            ]
        },
        {
            label: "Verwaltung & Sonstiges",
            items: [
                { id: "groups", label: "Gruppen verwalten", isPage: false },
                { id: "design", label: "Design & Stil", isPage: false },
                { id: "permissions", label: "Berechtigungen", isPage: false },
                { id: "dashboard_questions", label: "Frage stellen (Dashboard)", isPage: false },
                { id: "group_statistics", label: "Gruppenstatistik", isPage: false },
                { id: "incoming_questions", label: "Frage-Eingang", isPage: false },
                { id: "app_errors", label: "Fehler melden", isPage: false },
                { id: "app_ideas", label: "Ideen einreichen", isPage: false },
            ]
        }
    ];

    useEffect(() => {
        if (isLeader()) {
            loadData();
        }
    }, [isLeader()]);

    const loadData = async () => {
        setLoading(true);
        try {
            const rolesRes = await pb.collection('role_permissions').getFullList<RoleConfig>().catch(() => []);
            setRoleConfigs(rolesRes);
        } catch (e) {
            console.error("Error loading data:", e);
        } finally {
            setLoading(false);
        }
    };

    const toggleRolePermission = async (roleId: string, type: 'pages' | 'sections', permissionId: string) => {
        setSaving(roleId);
        try {
            const config = roleConfigs.find(c => c.id === roleId);
            if (!config) return;

            const currentList = (config.permissions[type] || []) as string[];
            const newList = currentList.includes(permissionId)
                ? currentList.filter(id => id !== permissionId)
                : [...currentList, permissionId];

            const updatedPermissions = {
                ...config.permissions,
                [type]: newList
            };

            await pb.collection('role_permissions').update(roleId, {
                permissions: updatedPermissions
            });
            setRoleConfigs(prev => prev.map(c => c.id === roleId ? { ...c, permissions: updatedPermissions } : c));
        } catch (e: any) {
            console.error("Error updating role permission:", e);
            alert("Fehler beim Speichern der Berechtigung: " + e.message);
        } finally {
            setSaving(null);
        }
    };

    if (!isLeader()) {
        return (
            <div className="p-8 text-center bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/20">
                <Shield className="mx-auto text-red-500 mb-4" size={48} />
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400">Zugriff verweigert</h2>
                <p className="text-sm text-red-500/80">Nur Jugendleiter können Rollen verwalten.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="grid gap-6">
                {/* Role Configuration */}
                {ROLES.map(role => {
                    const config = roleConfigs.find(c => c.role === role.id);
                    const isExpanded = editingRoleId === role.id;

                    return (
                        <div key={role.id} className="bg-white dark:bg-slate-700 rounded-3xl border border-zinc-200 dark:border-slate-600 overflow-hidden shadow-sm">
                            <button
                                onClick={() => {
                                    setEditingRoleId(isExpanded ? null : role.id);
                                    setExpandedCategories([]); // Reset categories when switching roles
                                }}
                                className="w-full p-6 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center", role.color.split(' ')[2])}>
                                        <role.icon className={role.color.split(' ')[0]} size={28} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="text-xl font-bold">{role.label}</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-0.5">{role.description}</p>
                                    </div>
                                </div>
                                {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                            </button>

                            {isExpanded && (
                                <div className="p-8 border-t border-zinc-100 dark:border-slate-600 bg-zinc-50/50 dark:bg-slate-800/30 space-y-8 animate-slideDown">
                                    {config ? (
                                        <>
                                            {PERMISSION_CATEGORIES.map(category => {
                                                const isCatExpanded = expandedCategories.includes(category.label);
                                                return (
                                                    <div key={category.label}>
                                                        <button
                                                            onClick={() => toggleCategory(category.label)}
                                                            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-4 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors group/cat"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Shield size={14} className="group-hover/cat:text-indigo-500 transition-colors text-zinc-400 dark:text-zinc-500" /> {category.label}
                                                            </div>
                                                            {isCatExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                        </button>

                                                        {isCatExpanded && (
                                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-fadeIn mb-8">
                                                                {category.items.map(item => {
                                                                    const type = item.isPage ? 'pages' : 'sections';
                                                                    const hasAccess = role.id === "leader" || (config.permissions[type] as string[]).includes(item.id);
                                                                    const isDisabled = role.id === "leader" || saving === config.id;

                                                                    return (
                                                                        <label
                                                                            key={item.id}
                                                                            className={clsx(
                                                                                "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none group",
                                                                                hasAccess
                                                                                    ? "bg-emerald-100/30 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800"
                                                                                    : "bg-white dark:bg-slate-700 border-zinc-300 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-slate-500",
                                                                                isDisabled && "opacity-50 cursor-not-allowed"
                                                                            )}
                                                                        >
                                                                            <div className="relative flex items-center justify-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={hasAccess}
                                                                                    disabled={isDisabled}
                                                                                    onChange={() => toggleRolePermission(config.id!, type as any, item.id)}
                                                                                    className="sr-only"
                                                                                />
                                                                                <div className={clsx(
                                                                                    "w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center",
                                                                                    hasAccess
                                                                                        ? "bg-emerald-600 border-emerald-600 text-white shadow-sm shadow-emerald-500/20"
                                                                                        : "bg-white dark:bg-slate-800 border-zinc-400 dark:border-slate-500 group-hover:border-indigo-500"
                                                                                )}>
                                                                                    {hasAccess && <Check size={12} strokeWidth={4} />}
                                                                                </div>
                                                                            </div>
                                                                            <span className={clsx(
                                                                                "text-sm font-bold tracking-tight",
                                                                                hasAccess ? "text-emerald-900 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-400"
                                                                            )}>
                                                                                {item.label}
                                                                            </span>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {role.id === "leader" && (
                                                <p className="text-sm text-zinc-600 dark:text-zinc-400 font-bold bg-zinc-100 dark:bg-slate-800/80 p-5 rounded-2xl border border-zinc-200 dark:border-slate-600 flex items-start gap-3">
                                                    <Shield size={18} className="text-emerald-500 shrink-0 mt-0.5" />
                                                    <span>Die Rolle "Jugendleiter" hat permanent Vollzugriff auf alle Bereiche, um System-Blockaden zu verhindern.</span>
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-zinc-500 mb-4">Keine Konfiguration für diese Rolle in der Datenbank gefunden.</p>
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        const defaults = DEFAULT_ROLE_PERMISSIONS[role.id];
                                                        const newRec = await pb.collection('role_permissions').create({
                                                            role: role.id,
                                                            permissions: defaults
                                                        });
                                                        setRoleConfigs(prev => [...prev, newRec as any]);
                                                    } catch (e) {
                                                        alert("Fehler: Konntest du die Collection 'role_permissions' bereits erstellen?");
                                                    }
                                                }}
                                                className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold"
                                            >
                                                Standard-Werte anlegen
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
