"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Save, RefreshCw, Users, Link as LinkIcon, AlertCircle } from "lucide-react";

export default function ChurchToolsTab() {
    const [config, setConfig] = useState({
        url: "",
        token: "VbLguIRXGuMAgzAIhe1N84ORF609OIhhHQHv6dTjpgnYVMsBMs4CvBE02xZy78KnNSM2ejKuew378ZSQOszifOCKRZD1IHNGDnPDAlCG9pYev4ceykMbr1iLZZSRk9PJxTXgsBBazUJ1wOKuYxvJLoGrwUIoLfATmHR9bnOfdVgcH1uq6zFQ1K6VvveaWUV89n9H9OCkSMCssR7kJhgzCd8OnJGVwFFbf4KL3yyr1LcJ8fPGnpvEDCNiRtXXYhUg"
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
            // Store config in a special settings collection or local storage for now
            // Better: A 'settings' collection in PocketBase
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
        console.log(`Loading members for group ID: ${groupId}`);
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
            alert("Fehler beim Laden der Mitglieder: " + (e.message || "Datenbank-Fehler"));
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
            alert("Rolle konnte nicht aktualisiert werden.");
        }
    };

    const handleSave = () => {
        setSaving(true);
        localStorage.setItem('ct_url', config.url);
        localStorage.setItem('ct_token', config.token);
        setTimeout(() => {
            setSaving(false);
            alert("Konfiguration gespeichert!");
        }, 500);
    };

    const syncMembers = async (groupId: string, ctGroupId: string) => {
        if (!config.url || !config.token) return;

        setSyncing(true);
        try {
            console.log(`Syncing members for group ${ctGroupId}...`);
            const res = await fetch('/api/churchtools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: config.url,
                    token: config.token,
                    endpoint: `groups/${ctGroupId}/members`
                })
            });

            if (!res.ok) throw new Error("Mitglieder-Sync fehlgeschlagen");
            const data = await res.json();
            const ctMembers = data.data || [];

            console.log(`Found ${ctMembers.length} members in CT. Saving to DB...`);

            for (const member of ctMembers) {
                const firstName = member.person?.domainAttributes?.firstName || "";
                const lastName = member.person?.domainAttributes?.lastName || "";
                const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : (member.person?.title || "Unbekannt");
                const email = member.person?.domainAttributes?.email || member.email || "";

                // Check if already in group_members
                const filter = `group = "${groupId}" && ct_person_id = ${member.personId}`;
                const existing = await pb.collection('group_members').getList(1, 1, { filter });

                const memberData: any = {
                    group: groupId,
                    ct_person_id: member.personId,
                    name: name,
                    email: email,
                    role: 'youth' // Default
                };

                // Try to find local user by email
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

            alert(`${ctMembers.length} Mitglieder erfolgreich synchronisiert!`);
            if (selectedGroupId === groupId) {
                await loadGroupMembers(groupId);
            }
        } catch (e: any) {
            console.error(e);
            alert("Fehler beim Mitglieder-Sync: " + e.message);
        } finally {
            setSyncing(false);
        }
    };
    const syncGroups = async () => {
        if (!config.url || !config.token) {
            alert("Bitte URL und Token zuerst speichern!");
            return;
        }

        setSyncing(true);
        let ctGroups = [];
        try {
            console.log("Starting CT Sync Fetch...");
            const res = await fetch('/api/churchtools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: config.url,
                    token: config.token,
                    endpoint: 'groups'
                })
            });

            const text = await res.text();
            if (!res.ok) {
                console.error("CT Sync API Error:", text);
                throw new Error(`API Fehler (${res.status}): ${text.slice(0, 100)}`);
            }

            const data = JSON.parse(text);
            const allGroups = data.data || [];
            // Filter only for ID 19 as requested by user
            ctGroups = allGroups.filter((g: any) => g.id === 19);
            console.log("Successfully fetched and filtered CT groups:", ctGroups.length, ctGroups[0]?.name);
        } catch (e: any) {
            console.error("CT Fetch Exception:", e);
            alert("Fehler beim Abruf von ChurchTools: " + e.message);
            setSyncing(false);
            return;
        }

        try {
            console.log("Updating PocketBase groups...", {
                authValid: pb.authStore.isValid,
                userId: pb.authStore.model?.id,
                token: pb.authStore.token?.slice(0, 10) + "..."
            });
            for (const group of ctGroups) {
                // Check existing
                const filterStr = `ct_id = ${group.id}`;
                console.log(`Checking existence for ${group.name}: ${filterStr}`);

                const existing = await pb.collection('groups').getList(1, 1, {
                    filter: filterStr
                });

                console.log(`  Existing found: ${existing.items.length}`);

                if (existing.items.length > 0) {
                    console.log(`  Updating ${existing.items[0].id}`);
                    await pb.collection('groups').update(existing.items[0].id, {
                        name: group.name
                    });
                } else {
                    console.log(`  Creating new group ${group.name}`);
                    await pb.collection('groups').create({
                        name: group.name,
                        ct_id: group.id
                    });
                }
            }
            await loadLocalGroups();
            alert(`${ctGroups.length} Gruppen erfolgreich synchronisiert!`);
        } catch (e: any) {
            console.error("PocketBase Update Error:", e);
            if (e.response) console.error("PB Response Data:", e.response);
            const detail = e.data ? JSON.stringify(e.data) : (e.message || "Unbekannter Fehler");
            alert("Speichern fehlgeschlagen: " + detail);
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 border border-zinc-200 dark:border-slate-600 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <LinkIcon className="text-blue-600 dark:text-blue-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">ChurchTools Anbindung</h3>
                        <p className="text-sm text-zinc-500">Verbinde deine Gruppe für automatischen Datenabgleich.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Instanz URL</label>
                        <input
                            type="url"
                            value={config.url}
                            onChange={e => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://ihre-gemeinde.churchtools.de"
                            className="w-full mt-1 px-4 py-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Login Token</label>
                        <input
                            type="password"
                            value={config.token}
                            onChange={e => setConfig({ ...config, token: e.target.value })}
                            placeholder="VbLguIRX..."
                            className="w-full mt-1 px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">Erhältlich in ChurchTools unter Profil → Sicherheit → Login Token</p>
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save size={18} /> {saving ? "Speichern..." : "Verbindung speichern"}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 border border-zinc-200 dark:border-slate-600 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                            <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                        </div>
                        <h3 className="text-lg font-bold">Gruppen & Mitglieder</h3>
                    </div>
                    <button
                        onClick={syncGroups}
                        disabled={syncing}
                        className="p-2 text-zinc-400 hover:text-emerald-500 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={20} className={syncing ? "animate-spin" : ""} />
                    </button>
                </div>

                {groups.length === 0 ? (
                    <div className="text-center py-8 bg-zinc-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-zinc-300 dark:border-slate-700">
                        <AlertCircle className="mx-auto text-zinc-300 mb-2" size={32} />
                        <p className="text-zinc-500 text-sm">Noch keine Gruppen konfiguriert.</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
                        {groups.map(group => (
                            <div key={group.id} className="p-4 bg-zinc-50 dark:bg-slate-800 rounded-xl border border-zinc-200 dark:border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold">{group.name}</p>
                                        <p className="text-xs text-zinc-500">CT-ID: {group.ct_id || "Nicht verknüpft"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => {
                                                if (selectedGroupId === group.id) {
                                                    setSelectedGroupId(null);
                                                } else {
                                                    setSelectedGroupId(group.id);
                                                    loadGroupMembers(group.id);
                                                }
                                            }}
                                            className="px-3 py-1.5 bg-zinc-100 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg text-xs font-medium hover:bg-zinc-200 dark:hover:bg-slate-600 transition-colors"
                                        >
                                            Mitglieder {selectedGroupId === group.id ? "ausblenden" : "anzeigen"}
                                        </button>
                                        <button
                                            onClick={() => syncMembers(group.id, group.ct_id)}
                                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                                        >
                                            Synchronisieren
                                        </button>
                                    </div>
                                </div>

                                {selectedGroupId === group.id && (
                                    <div className="mt-4 pl-4 border-l-2 border-zinc-100 dark:border-slate-700 space-y-2 animate-fadeIn">
                                        {loadingMembers ? (
                                            <p className="text-xs text-zinc-500 py-2">Lade Mitglieder...</p>
                                        ) : groupMembers.length === 0 ? (
                                            <p className="text-xs text-zinc-500 py-2">Keine Mitglieder synchronisiert. Klicke auf "Synchronisieren".</p>
                                        ) : (
                                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
                                                {groupMembers.map(member => (
                                                    <div key={member.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-zinc-100 dark:border-slate-700 text-sm">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{member.name}</span>
                                                            <span className="text-[10px] text-zinc-500">{member.email || "Keine Email"}</span>
                                                        </div>
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                                                            className="text-xs bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                                        >
                                                            <option value="youth">Jugendlicher</option>
                                                            <option value="staff">Mitarbeiter</option>
                                                            <option value="leader">Jugendleiter (Admin)</option>
                                                        </select>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
}
