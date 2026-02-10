"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { User, Shield, Check, X, Search, ChevronRight, ChevronDown, GraduationCap, Users } from "lucide-react";
import { usePermissions, UserRole, RoleConfig, PageId, SectionId, DEFAULT_ROLE_PERMISSIONS } from "@/hooks/usePermissions";
import clsx from "clsx";

interface UserWithRole {
    id: string;
    email: string;
    name: string;
    is_admin: boolean;
    role: UserRole;
}

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
    const [viewMode, setViewMode] = useState<'users' | 'roles'>('users');
    const [users, setUsers] = useState<UserWithRole[]>([]);
    const [roleConfigs, setRoleConfigs] = useState<RoleConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
    const [saving, setSaving] = useState<string | null>(null);

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
            label: "Bibliothek: Bereiche",
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
            label: "Allgemeine Funktionen",
            items: [
                { id: "groups", label: "Gruppen verwalten", isPage: false },
                { id: "ai_features", label: "KI-Funktionen", isPage: false },
                { id: "dashboard_questions", label: "Frage stellen (Dashboard)", isPage: false },
                { id: "design", label: "Design & Stil", isPage: false },
                { id: "permissions", label: "Berechtigungen", isPage: false },
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
            const [usersRes, rolesRes] = await Promise.all([
                pb.collection('users').getFullList({ sort: 'name,email' }),
                pb.collection('role_permissions').getFullList<RoleConfig>().catch(() => [])
            ]);

            setUsers(usersRes.map(u => ({
                id: u.id,
                email: u.email,
                name: u.name || "Unbekannter Benutzer",
                is_admin: u.is_admin || false,
                role: (u.role || "youth") as UserRole
            })));

            setRoleConfigs(rolesRes);
        } catch (e) {
            console.error("Error loading data:", e);
        } finally {
            setLoading(false);
        }
    };

    const updateRole = async (userId: string, newRole: UserRole) => {
        setSaving(userId);
        try {
            await pb.collection('users').update(userId, { role: newRole });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        } catch (e) {
            console.error("Error updating user role:", e);
        } finally {
            setSaving(null);
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
        } catch (e) {
            console.error("Error updating role permission:", e);
        } finally {
            setSaving(null);
        }
    };

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.name.toLowerCase().includes(search.toLowerCase())
    );

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
            {/* View Toggle */}
            <div className="flex p-1 bg-zinc-100 dark:bg-slate-800 rounded-2xl w-fit mx-auto sm:mx-0">
                <button
                    onClick={() => setViewMode('users')}
                    className={clsx(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                        viewMode === 'users' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                >
                    Benutzer
                </button>
                <button
                    onClick={() => setViewMode('roles')}
                    className={clsx(
                        "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                        viewMode === 'roles' ? "bg-white dark:bg-slate-700 text-indigo-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                    )}
                >
                    Rollen konfigurieren
                </button>
            </div>

            {viewMode === 'users' ? (
                <>
                    {/* Search */}
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Benutzer suchen..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
                        />
                    </div>

                    {/* Users List */}
                    <div className="grid gap-4">
                        {filteredUsers.length === 0 ? (
                            <div className="text-center py-12 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-slate-700">
                                <User className="mx-auto text-zinc-300 mb-2" size={48} />
                                <p className="text-zinc-500">Keine Benutzer gefunden.</p>
                            </div>
                        ) : (
                            filteredUsers.map(user => (
                                <div key={user.id} className="bg-white dark:bg-slate-700 rounded-3xl border border-zinc-200 dark:border-slate-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <button
                                        onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                                        className="w-full p-5 flex items-center justify-between group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                <User size={24} />
                                            </div>
                                            <div className="text-left">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-bold text-lg">{user.name}</h3>
                                                    {user.is_admin && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full uppercase tracking-widest font-black">Admin</span>}
                                                </div>
                                                <p className="text-xs text-zinc-500">{user.email} • <span className="font-bold text-indigo-500 uppercase tracking-tight">{ROLES.find(r => r.id === user.role)?.label}</span></p>
                                            </div>
                                        </div>
                                        {editingUserId === user.id ? <ChevronDown size={20} className="text-zinc-400" /> : <ChevronRight size={20} className="text-zinc-400" />}
                                    </button>

                                    {editingUserId === user.id && (
                                        <div className="p-6 border-t border-zinc-100 dark:border-slate-600 bg-zinc-50/50 dark:bg-slate-800/30 space-y-4 animate-slideDown">
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 font-heading">Rolle zuweisen</h4>
                                            <div className="grid gap-3">
                                                {ROLES.map(roleOption => {
                                                    const isSelected = user.role === roleOption.id;
                                                    const Icon = roleOption.icon;
                                                    return (
                                                        <button
                                                            key={roleOption.id}
                                                            disabled={saving === user.id}
                                                            onClick={() => updateRole(user.id, roleOption.id)}
                                                            className={clsx(
                                                                "flex items-center gap-4 p-4 rounded-2xl border transition-all text-left",
                                                                isSelected
                                                                    ? `${roleOption.color} shadow-sm`
                                                                    : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-500 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 hover:border-zinc-300",
                                                                (user.is_admin || saving === user.id) && "opacity-50 cursor-not-allowed"
                                                            )}
                                                        >
                                                            <div className={clsx(
                                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                                                                isSelected ? "bg-white/50 dark:bg-white/10" : "bg-zinc-100 dark:bg-zinc-800"
                                                            )}>
                                                                <Icon size={20} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between">
                                                                    <span className="font-bold text-sm tracking-tight">{roleOption.label}</span>
                                                                    {isSelected && <Check size={16} className="shrink-0" />}
                                                                </div>
                                                                <p className="text-[10px] leading-tight mt-0.5 opacity-80">{roleOption.description}</p>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {user.is_admin && (
                                                <p className="text-[10px] text-zinc-500 font-bold bg-zinc-100 dark:bg-slate-800 p-4 rounded-xl border border-zinc-200 dark:border-slate-600">
                                                    Als Administrator hast du permanenten Vollzugriff. Du kannst deine Rolle hier jedoch anpassen, damit sie korrekt im System angezeigt wird.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="grid gap-6">
                    {/* Role Configuration */}
                    {ROLES.map(role => {
                        const config = roleConfigs.find(c => c.role === role.id);
                        const isExpanded = editingRoleId === role.id;

                        return (
                            <div key={role.id} className="bg-white dark:bg-slate-700 rounded-3xl border border-zinc-200 dark:border-slate-600 overflow-hidden shadow-sm">
                                <button
                                    onClick={() => setEditingRoleId(isExpanded ? null : role.id)}
                                    className="w-full p-6 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center", role.color.split(' ')[2])}>
                                            <role.icon className={role.color.split(' ')[0]} size={28} />
                                        </div>
                                        <div className="text-left">
                                            <h3 className="text-xl font-bold">{role.label}</h3>
                                            <p className="text-sm text-zinc-500 mt-0.5">{role.description}</p>
                                        </div>
                                    </div>
                                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                                </button>

                                {isExpanded && (
                                    <div className="p-8 border-t border-zinc-100 dark:border-slate-600 bg-zinc-50/50 dark:bg-slate-800/30 space-y-8 animate-slideDown">
                                        {config ? (
                                            <>
                                                {PERMISSION_CATEGORIES.map(category => (
                                                    <div key={category.label}>
                                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
                                                            <Shield size={12} /> {category.label}
                                                        </h4>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                                            {category.items.map(item => {
                                                                const type = item.isPage ? 'pages' : 'sections';
                                                                const hasAccess = role.id === "leader" || (config.permissions[type] as string[]).includes(item.id);
                                                                return (
                                                                    <button
                                                                        key={item.id}
                                                                        disabled={role.id === "leader" || saving === config.id}
                                                                        onClick={() => toggleRolePermission(config.id!, type as any, item.id)}
                                                                        className={clsx(
                                                                            "flex items-center justify-between p-3.5 rounded-xl border transition-all text-xs font-bold",
                                                                            hasAccess
                                                                                ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400"
                                                                                : "bg-white dark:bg-slate-700 border-zinc-200 dark:border-slate-600 text-zinc-500",
                                                                            (role.id === "leader" || saving === config.id) && "opacity-50 cursor-not-allowed"
                                                                        )}
                                                                    >
                                                                        {item.label}
                                                                        {hasAccess && <Check size={14} />}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}

                                                {role.id === "leader" && (
                                                    <p className="text-[10px] text-zinc-500 font-bold bg-zinc-100 dark:bg-slate-800 p-4 rounded-xl border border-zinc-200 dark:border-slate-600">
                                                        Die Rolle "Jugendleiter" hat permanent Vollzugriff auf alle Bereiche, um System-Blockaden zu verhindern.
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
            )}
        </div>
    );
}
