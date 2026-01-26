"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Save, RefreshCw, Users, Link as LinkIcon, AlertCircle } from "lucide-react";

export default function GroupsOverview() {
    const [config, setConfig] = useState({
        url: "",
        token: ""
    });
    const [groups, setGroups] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    const [syncing, setSyncing] = useState(false);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const savedUrl = localStorage.getItem('ct_url') || "";
            const savedToken = localStorage.getItem('ct_token') || "";
            setConfig({ url: savedUrl, token: savedToken });

            await loadLocalGroups();
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadLocalGroups = async () => {
        const res = await pb.collection('groups').getFullList();
        setGroups(res);
    };

    const loadGroupMembers = async (groupId: string) => {
        setLoadingMembers(true);
        try {
            const res = await pb.collection('group_members').getFullList({
                filter: `group = "${groupId}"`,
                sort: 'name',
                expand: 'user'
            });
            setGroupMembers(res);
        } catch (e: any) {
            console.error(e);
        } finally {
            setLoadingMembers(false);
        }
    };

    const updateMemberRole = async (memberId: string, role: string) => {
        try {
            await pb.collection('group_members').update(memberId, { role });
            setGroupMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = () => {
        setSaving(true);
        localStorage.setItem('ct_url', config.url);
        localStorage.setItem('ct_token', config.token);
        setTimeout(() => {
            setSaving(false);
        }, 500);
    };

    const syncMembers = async (groupId: string, ctGroupId: string) => {
        if (!config.url || !config.token) return;

        setSyncing(true);
        try {
            const res = await fetch('/api/churchtools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: config.url,
                    token: config.token,
                    endpoint: `groups/${ctGroupId}/members`
                })
            });

            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();
            const ctMembers = data.data || [];

            for (const member of ctMembers) {
                const firstName = member.person?.domainAttributes?.firstName || "";
                const lastName = member.person?.domainAttributes?.lastName || "";
                const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : (member.person?.title || "Unbekannt");
                const email = member.person?.domainAttributes?.email || member.email || "";

                const filter = `group = "${groupId}" && ct_person_id = ${member.personId}`;
                const existing = await pb.collection('group_members').getList(1, 1, { filter });

                const memberData: any = {
                    group: groupId,
                    ct_person_id: member.personId,
                    name: name,
                    email: email,
                    role: 'youth'
                };

                if (member.email) {
                    try {
                        const user = await pb.collection('users').getFirstListItem(`email="${member.email}"`);
                        if (user) memberData.user = user.id;
                    } catch (e) { }
                }

                if (existing.items.length > 0) {
                    await pb.collection('group_members').update(existing.items[0].id, memberData);
                } else {
                    await pb.collection('group_members').create(memberData);
                }
            }

            if (selectedGroupId === groupId) {
                await loadGroupMembers(groupId);
            }
        } catch (e: any) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    };

    const syncGroups = async () => {
        if (!config.url || !config.token) return;

        setSyncing(true);
        try {
            const res = await fetch('/api/churchtools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: config.url,
                    token: config.token,
                    endpoint: 'groups'
                })
            });

            if (!res.ok) throw new Error("Sync failed");
            const data = await res.json();
            const allGroups = data.data || [];
            const ctGroups = allGroups.filter((g: any) => g.id === 19);

            for (const group of ctGroups) {
                const filterStr = `ct_id = ${group.id}`;
                const existing = await pb.collection('groups').getList(1, 1, { filter: filterStr });

                if (existing.items.length > 0) {
                    await pb.collection('groups').update(existing.items[0].id, { name: group.name });
                } else {
                    await pb.collection('groups').create({ name: group.name, ct_id: group.id });
                }
            }
            await loadLocalGroups();
        } catch (e: any) {
            console.error(e);
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header / Info */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Deine Gruppen</h2>
                    <p className="text-sm text-zinc-500">Verwalte deine ChurchTools Gruppen und Mitglieder.</p>
                </div>
                <button
                    onClick={syncGroups}
                    disabled={syncing}
                    className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                    <RefreshCw size={20} className={syncing ? "animate-spin text-indigo-500" : "text-zinc-600 dark:text-zinc-400"} />
                </button>
            </div>

            {/* Groups Grid */}
            <div className="grid gap-4">
                {groups.length === 0 ? (
                    <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                        <Users className="mx-auto text-zinc-300 mb-2" size={48} />
                        <p className="text-zinc-500">Noch keine Gruppen synchronisiert.</p>
                        <p className="text-xs text-zinc-400 mt-1">Überprüfe die ChurchTools Verbindung in den Einstellungen.</p>
                    </div>
                ) : (
                    groups.map(group => (
                        <div key={group.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                            <div className="p-5 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                                        <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{group.name}</h3>
                                        <p className="text-xs text-zinc-500">CT-ID: {group.ct_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => syncMembers(group.id, group.ct_id)}
                                        disabled={syncing}
                                        className="p-2 text-zinc-400 hover:text-indigo-500 transition-colors"
                                    >
                                        <RefreshCw size={18} className={syncing ? "animate-spin" : ""} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedGroupId === group.id) setSelectedGroupId(null);
                                            else {
                                                setSelectedGroupId(group.id);
                                                loadGroupMembers(group.id);
                                            }
                                        }}
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedGroupId === group.id
                                                ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                                                : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                                            }`}
                                    >
                                        {selectedGroupId === group.id ? "Schließen" : "Mitglieder"}
                                    </button>
                                </div>
                            </div>

                            {selectedGroupId === group.id && (
                                <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-5 animate-slideDown">
                                    {loadingMembers ? (
                                        <div className="flex items-center justify-center py-4">
                                            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {groupMembers.length === 0 ? (
                                                <p className="text-center text-sm text-zinc-500 py-4">Keine Mitglieder gefunden. Bitte synchronisieren.</p>
                                            ) : (
                                                groupMembers.map(member => (
                                                    <div key={member.id} className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold">{member.name}</p>
                                                                <p className="text-[10px] text-zinc-500">{member.email || "Keine E-Mail"}</p>
                                                            </div>
                                                        </div>
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                                                            className="text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        >
                                                            <option value="youth">Jugendlicher</option>
                                                            <option value="staff">Mitarbeiter</option>
                                                            <option value="leader">Jugendleiter</option>
                                                        </select>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* CT Config Settings - Compact */}
            <div className="bg-zinc-900/5 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center gap-3 mb-4">
                    <LinkIcon size={18} className="text-indigo-500" />
                    <h3 className="font-bold">ChurchTools Integration</h3>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Instanz URL</label>
                        <input
                            type="url"
                            value={config.url}
                            onChange={e => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://ihre-gemeinde.churchtools.de"
                            className="w-full mt-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider ml-1">Login Token</label>
                        <input
                            type="password"
                            value={config.token}
                            onChange={e => setConfig({ ...config, token: e.target.value })}
                            placeholder="VbLguIRX..."
                            className="w-full mt-1 px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                        />
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-4 w-full py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? "Wird gespeichert..." : "Verbindung aktualisieren"}
                </button>
            </div>
        </div>
    );
}
