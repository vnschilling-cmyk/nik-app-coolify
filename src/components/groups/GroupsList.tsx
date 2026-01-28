"use client";

import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { Users, RefreshCw, AlertCircle, ChevronDown, ChevronUp, Trash2, Pencil, Check, X } from "lucide-react";

export default function GroupsList() {
    const [groups, setGroups] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [groupMembers, setGroupMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");

    useEffect(() => {
        loadGroups();
    }, []);

    const loadGroups = async () => {
        try {
            const res = await pb.collection('groups').getFullList({
                sort: 'name',
            });
            setGroups(res);
        } catch (e) {
            console.error("Error loading groups:", e);
        } finally {
            setLoading(false);
        }
    };

    const startEditing = (group: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingGroupId(group.id);
        setEditName(group.name);
    };

    const saveGroupName = async (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!editName.trim()) return;

        try {
            await pb.collection('groups').update(groupId, { name: editName });
            setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: editName } : g));
            setEditingGroupId(null);
        } catch (err) {
            console.error("Error updating group name:", err);
            alert("Fehler beim Umbenennen.");
        }
    };

    const cancelEditing = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingGroupId(null);
        setEditName("");
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
            console.error("Error loading members:", e);
        } finally {
            setLoadingMembers(false);
        }
    };

    const updateMemberRole = async (memberId: string, role: string) => {
        try {
            await pb.collection('group_members').update(memberId, { role });
            setGroupMembers(prev => prev.map(m => m.id === memberId ? { ...m, role } : m));
        } catch (e) {
            console.error("Error updating role:", e);
            alert("Rolle konnte nicht aktualisiert werden.");
        }
    };

    const deleteMember = async (memberId: string) => {
        if (!confirm("Mitglied wirklich entfernen?")) return;
        try {
            await pb.collection('group_members').delete(memberId);
            setGroupMembers(prev => prev.filter(m => m.id !== memberId));
        } catch (e) {
            console.error("Error deleting member:", e);
            alert("Mitglied konnte nicht gelöscht werden.");
        }
    };

    const deleteGroup = async (groupId: string) => {
        if (!confirm("Gruppe und alle Mitglieder wirklich löschen?")) return;
        try {
            // PB cascades delete if configured, otherwise we should delete members first manually if needed.
            // Assuming PB cascade rules or manual cleanup for now.
            await pb.collection('groups').delete(groupId);
            setGroups(prev => prev.filter(g => g.id !== groupId));
            if (selectedGroupId === groupId) setSelectedGroupId(null);
        } catch (e) {
            console.error("Error deleting group:", e);
            alert("Gruppe konnte nicht gelöscht werden.");
        }
    };

    // Helper function to keep JSX clean
    const renderGroupHeader = (group: any) => {
        if (editingGroupId === group.id) {
            return (
                <div className="flex items-center gap-2 flex-1" onClick={e => e.stopPropagation()}>
                    <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="flex-1 bg-zinc-100 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg px-3 py-1 text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        autoFocus
                    />
                    <button
                        onClick={(e) => saveGroupName(group.id, e)}
                        className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                        title="Speichern"
                    >
                        <Check size={20} />
                    </button>
                    <button
                        onClick={cancelEditing}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Abbrechen"
                    >
                        <X size={20} />
                    </button>
                </div>
            );
        }

        return (
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center">
                    <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
                </div>
                <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        {group.name}
                        <button
                            onClick={(e) => startEditing(group, e)}
                            className="text-zinc-400 hover:text-indigo-500 transition-colors p-1"
                            title="Bearbeiten"
                        >
                            <Pencil size={16} />
                        </button>
                    </h3>
                    <p className="text-xs text-zinc-500">{group.ct_id ? `CT-ID: ${group.ct_id}` : 'Lokale Gruppe'}</p>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fadeIn">
            {groups.length === 0 ? (
                <div className="text-center py-12 bg-zinc-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-zinc-200 dark:border-slate-700">
                    <Users className="mx-auto text-zinc-300 mb-2" size={48} />
                    <p className="text-zinc-500">Keine Gruppen vorhanden.</p>
                </div>
            ) : (
                groups.map(group => (
                    <div key={group.id} className="bg-white dark:bg-slate-700 rounded-2xl border border-zinc-200 dark:border-slate-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div
                            className="p-5 flex items-center justify-between cursor-pointer"
                            onClick={() => {
                                if (editingGroupId === group.id) return; // Don't toggle expansion when editing
                                if (selectedGroupId === group.id) {
                                    setSelectedGroupId(null);
                                } else {
                                    setSelectedGroupId(group.id);
                                    loadGroupMembers(group.id);
                                }
                            }}
                        >
                            {renderGroupHeader(group)}
                            <div className="flex items-center gap-3">
                                {selectedGroupId === group.id ? <ChevronUp className="text-zinc-400" /> : <ChevronDown className="text-zinc-400" />}
                            </div>
                        </div>

                        {selectedGroupId === group.id && (
                            <div className="border-t border-zinc-100 dark:border-slate-600 bg-zinc-50/50 dark:bg-slate-800/30 p-5 animate-slideDown">
                                {loadingMembers ? (
                                    <div className="flex items-center justify-center py-4">
                                        <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{groupMembers.length} Mitglieder</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteGroup(group.id);
                                                }}
                                                className="w-8 h-8 flex items-center justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Gruppe löschen"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {groupMembers.length === 0 ? (
                                            <p className="text-center text-sm text-zinc-500 py-4">Keine Mitglieder in dieser Gruppe.</p>
                                        ) : (
                                            groupMembers.map(member => (
                                                <div key={member.id} className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-zinc-200 dark:border-slate-600 flex items-center justify-between shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500">
                                                            {member.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{member.name}</p>
                                                            <p className="text-[10px] text-zinc-500">{member.email || "Keine E-Mail"}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <select
                                                            value={member.role}
                                                            onChange={(e) => updateMemberRole(member.id, e.target.value)}
                                                            className="text-xs bg-zinc-50 dark:bg-slate-700 border border-zinc-200 dark:border-slate-600 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                                                        >
                                                            <option value="youth">Jugendlicher</option>
                                                            <option value="staff">Mitarbeiter</option>
                                                            <option value="leader">Leitung</option>
                                                        </select>
                                                        <button
                                                            onClick={() => deleteMember(member.id)}
                                                            className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                                                            title="Mitglied entfernen"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
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
    );
}
