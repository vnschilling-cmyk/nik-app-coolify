"use client";

import { useState } from "react";
import { Plus, Save, Trash2, UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { pb } from "@/lib/pocketbase";

export default function ManualCreationView() {
    const [groupName, setGroupName] = useState("");
    const [members, setMembers] = useState([{ name: "", email: "", role: "youth" }]);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    const addMemberRow = () => {
        setMembers([...members, { name: "", email: "", role: "youth" }]);
    };

    const removeMemberRow = (index: number) => {
        const newMembers = [...members];
        newMembers.splice(index, 1);
        setMembers(newMembers);
    };

    const updateMember = (index: number, field: string, value: string) => {
        const newMembers = [...members];
        (newMembers[index] as any)[field] = value;
        setMembers(newMembers);
    };

    const handleCreate = async () => {
        setError("");
        setSuccess(false);

        if (!groupName.trim()) {
            setError("Bitte gib einen Gruppennamen ein.");
            return;
        }

        const validMembers = members.filter(m => m.name.trim() !== "");
        if (validMembers.length === 0) {
            setError("Bitte füge mindestens ein Mitglied mit Namen hinzu.");
            return;
        }

        setSaving(true);

        try {
            // 1. Create Group
            const group = await pb.collection('groups').create({
                name: groupName,
                ct_id: 0
            });

            // 2. Create Members
            for (const member of validMembers) {
                const memberData: any = {
                    group: group.id,
                    name: member.name,
                    email: member.email,
                    role: member.role,
                    ct_person_id: 0
                };

                if (member.email) {
                    try {
                        const user = await pb.collection('users').getFirstListItem(`email="${member.email}"`);
                        if (user) memberData.user = user.id;
                    } catch (e) { }
                }

                await pb.collection('group_members').create(memberData);
            }

            setSuccess(true);
            setGroupName("");
            setMembers([{ name: "", email: "", role: "youth" }]);
            alert(`Gruppe "${groupName}" erfolgreich erstellt!`);

        } catch (e: any) {
            setError(e.message || "Fehler beim Erstellen der Gruppe.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {success && (
                <div className="bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-200 p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle size={20} />
                    <span>Gruppe erfolgreich erstellt!</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 border border-zinc-200 dark:border-slate-600">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg">
                        <Plus className="text-pink-600 dark:text-pink-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">Neue Gruppe erstellen</h3>
                        <p className="text-sm text-zinc-500">Name & Mitglieder manuell erfassen.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Gruppenname</label>
                        <input
                            type="text"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="z.B. Jugendkreis"
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-pink-500 outline-none text-sm"
                        />
                    </div>

                    <div className="border-t border-zinc-100 dark:border-slate-600 my-4 pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">Mitglieder</label>
                            <button
                                onClick={addMemberRow}
                                className="w-8 h-8 flex items-center justify-center bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-100 dark:hover:bg-pink-900/40 transition-colors"
                                title="Mitglied hinzufügen"
                            >
                                <UserPlus size={16} />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {members.map((member, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-zinc-50 dark:bg-slate-800/50 p-3 rounded-xl border border-zinc-100 dark:border-slate-600">
                                    <div className="flex-1 w-full">
                                        <input
                                            type="text"
                                            value={member.name}
                                            onChange={(e) => updateMember(index, "name", e.target.value)}
                                            placeholder="Name"
                                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-lg text-xs outline-none focus:border-pink-500"
                                        />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <input
                                            type="email"
                                            value={member.email}
                                            onChange={(e) => updateMember(index, "email", e.target.value)}
                                            placeholder="E-Mail (optional)"
                                            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-lg text-xs outline-none focus:border-pink-500"
                                        />
                                    </div>
                                    <div className="w-full sm:w-32">
                                        <select
                                            value={member.role}
                                            onChange={(e) => updateMember(index, "role", e.target.value)}
                                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-lg text-xs outline-none focus:border-pink-500"
                                        >
                                            <option value="youth">Jugendlicher</option>
                                            <option value="staff">Mitarbeiter</option>
                                            <option value="leader">Jugendleiter</option>
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => removeMemberRow(index)}
                                        disabled={members.length === 1}
                                        className="p-1.5 text-zinc-400 hover:text-red-500 disabled:opacity-30 transition-colors"
                                        title="Lösche Zeile"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> {error}
                        </div>
                    )}

                    <button
                        onClick={handleCreate}
                        disabled={saving}
                        className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-4"
                    >
                        {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                        Gruppe speichern
                    </button>
                </div>
            </div>
        </div>
    );
}
