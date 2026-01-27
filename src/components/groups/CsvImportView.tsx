"use client";

import { useState } from "react";
import { FileSpreadsheet, Save, Download, AlertCircle, CheckCircle } from "lucide-react";
import { pb } from "@/lib/pocketbase";

export default function CsvImportView() {
    const [groupName, setGroupName] = useState("");
    const [csvText, setCsvText] = useState("");
    const [parsedMembers, setParsedMembers] = useState<any[]>([]);
    const [previewing, setPreviewing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const parseCsv = () => {
        setError("");

        if (!groupName.trim()) {
            setError("Bitte gib einen Gruppennamen ein.");
            return;
        }

        if (!csvText.trim()) {
            setError("Bitte gib CSV-Daten ein.");
            return;
        }

        try {
            const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
            const members = lines.map((line, index) => {
                const parts = line.split(',');
                // Expect simple format: Name,Email,Role(optional)
                // If header exists and user pasted it, we might want to skip, but for now we assume raw data
                // or handle simple heuristic

                let name = parts[0]?.trim() || "";
                let email = parts[1]?.trim() || "";
                let role = parts[2]?.trim().toLowerCase() || "youth";

                // Normalize role
                if (!['youth', 'staff', 'leader'].includes(role)) {
                    role = 'youth';
                }

                if (!name && !email) return null; // Skip empty rows

                return { name, email, role };
            }).filter(Boolean);

            if (members.length === 0) {
                setError("Keine gültigen Mitgliederdaten gefunden.");
                return;
            }

            setParsedMembers(members);
            setPreviewing(true);
        } catch (e) {
            setError("Fehler beim Parsen der CSV. Bitte Format prüfen.");
        }
    };

    const handleImport = async () => {
        setImporting(true);
        setError("");
        setSuccess(false);

        try {
            // 1. Create Group
            const group = await pb.collection('groups').create({
                name: groupName,
                ct_id: 0 // Local group
            });

            // 2. Create Members
            let count = 0;
            for (const member of parsedMembers) {
                try {
                    const memberData: any = {
                        group: group.id,
                        name: member.name,
                        email: member.email,
                        role: member.role,
                        ct_person_id: 0
                    };

                    // Link user if exists
                    if (member.email) {
                        try {
                            const user = await pb.collection('users').getFirstListItem(`email="${member.email}"`);
                            if (user) memberData.user = user.id;
                        } catch (e) { }
                    }

                    await pb.collection('group_members').create(memberData);
                    count++;
                } catch (e) {
                    console.error("Failed to create member:", member, e);
                }
            }

            setSuccess(true);
            setGroupName("");
            setCsvText("");
            setParsedMembers([]);
            setPreviewing(false);
            alert(`Gruppe "${groupName}" mit ${count} Mitgliedern erstellt!`);

        } catch (e: any) {
            setError(e.message || "Fehler beim Erstellen der Gruppe.");
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            {success && (
                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200 p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle size={20} />
                    <span>Import erfolgreich!</span>
                </div>
            )}

            <div className="bg-white dark:bg-slate-700 rounded-2xl p-6 border border-zinc-200 dark:border-slate-600 text-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                        <FileSpreadsheet className="text-emerald-600 dark:text-emerald-400" size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold">CSV Import</h3>
                        <p className="text-zinc-500">Kopiere deine Liste hier rein.</p>
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
                            className="w-full px-4 py-2 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider">CSV Daten</label>
                            <span className="text-[10px] text-zinc-400">Format: Name, Email, Rolle</span>
                        </div>
                        <textarea
                            value={csvText}
                            onChange={(e) => {
                                setCsvText(e.target.value);
                                setPreviewing(false);
                            }}
                            placeholder={`Max Mustermann, max@test.de, leader\nLisa Musterfrau, lisa@test.de, youth\nTim Tester, tim@test.de, staff`}
                            rows={8}
                            className="w-full px-4 py-3 bg-zinc-50 dark:bg-slate-800 border border-zinc-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-xs"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs flex items-center gap-1">
                            <AlertCircle size={12} /> {error}
                        </div>
                    )}

                    {!previewing ? (
                        <button
                            onClick={parseCsv}
                            className="w-full py-2 bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-zinc-900 dark:text-white rounded-xl font-bold transition-colors"
                        >
                            Vorschau anzeigen
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-zinc-50 dark:bg-slate-800/50 rounded-xl max-h-[200px] overflow-y-auto border border-zinc-200 dark:border-slate-600">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-zinc-100 dark:bg-slate-700 sticky top-0">
                                        <tr>
                                            <th className="p-2 text-xs font-bold text-zinc-500">Name</th>
                                            <th className="p-2 text-xs font-bold text-zinc-500">Email</th>
                                            <th className="p-2 text-xs font-bold text-zinc-500">Rolle</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {parsedMembers.map((m, i) => (
                                            <tr key={i} className="border-b border-zinc-100 dark:border-slate-700/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-slate-800/30">
                                                <td className="p-2">{m.name}</td>
                                                <td className="p-2 text-zinc-500">{m.email}</td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-medium 
                                                        ${m.role === 'leader' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                            m.role === 'staff' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                'bg-zinc-100 text-zinc-600 dark:bg-slate-800 dark:text-zinc-400'}`}>
                                                        {m.role}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPreviewing(false)}
                                    className="flex-1 py-3 bg-zinc-100 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400 rounded-xl font-bold hover:bg-zinc-200 transition-colors"
                                >
                                    Zurück
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={importing}
                                    className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {importing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                                    {parsedMembers.length} Mitglieder importieren
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
