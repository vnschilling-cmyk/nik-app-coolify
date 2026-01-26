"use client";

import { useEffect, useState } from 'react';
import { pb } from '@/lib/pocketbase';

export default function AttendanceSync() {
    const [status, setStatus] = useState<string>("");

    useEffect(() => {
        const sync = async () => {
            const user = pb.authStore.model;
            if (!user) return;

            try {
                // 1. Check if user is a leader
                const memberRecord = await pb.collection('group_members').getFirstListItem(`email = "${user.email}" && role = "leader"`);
                if (!memberRecord) {
                    console.log("AttendanceSync: User is not a leader. Skipping sync.");
                    return;
                }

                console.log("AttendanceSync: Leader detected. Checking for current lesson...");

                // 2. Find current lesson (starting today)
                const today = new Date().toISOString().split('T')[0];
                const lessons = await pb.collection('lessons').getList(1, 1, {
                    filter: `start_date >= "${today} 00:00:00" && start_date <= "${today} 23:59:59" && active = true`
                });

                if (lessons.items.length === 0) {
                    console.log("AttendanceSync: No lesson scheduled for today.");
                    return;
                }

                const currentLesson = lessons.items[0];
                setStatus(`Synchronisiere Anwesenheit für: ${currentLesson.title}`);

                // 3. Find CT Group
                const group = await pb.collection('groups').getOne(memberRecord.group);
                if (!group.ct_id) return;

                // 4. Get CT Config from localStorage (since we don't have a settings collection yet)
                const ctUrl = localStorage.getItem('ct_url');
                const ctToken = localStorage.getItem('ct_token');
                if (!ctUrl || !ctToken) return;

                // 5. Fetch meetings for this group
                const meetingsRes = await fetch('/api/churchtools', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: ctUrl, token: ctToken, endpoint: `groups/${group.ct_id}/meetings` })
                });

                if (!meetingsRes.ok) throw new Error("CT Meetings Fetch failed");
                const meetingsData = await meetingsRes.json();
                const meetings = meetingsData.data || [];

                // Find meeting for today
                const meeting = meetings.find((m: any) => m.startDate.startsWith(today));
                if (!meeting) {
                    console.log("AttendanceSync: No CT meeting found for today.");
                    return;
                }

                // 6. Fetch attendance for this meeting
                const attendanceRes = await fetch('/api/churchtools', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: ctUrl, token: ctToken, endpoint: `groups/${group.ct_id}/meetings/${meeting.id}/members` })
                });

                if (!attendanceRes.ok) throw new Error("CT Attendance Fetch failed");
                const attendanceData = await attendanceRes.json();
                const ctAttendance = attendanceData.data || [];

                console.log(`AttendanceSync: Found ${ctAttendance.length} attendance records in CT.`);

                // 7. Save to PocketBase
                for (const record of ctAttendance) {
                    // Find corresponding local group_member
                    try {
                        const localMember = await pb.collection('group_members').getFirstListItem(`ct_person_id = ${record.personId} && group = "${group.id}"`);

                        const attendanceData = {
                            lesson: currentLesson.id,
                            group_member: localMember.id,
                            status: record.status || 'unsure',
                            sync_date: new Date().toISOString()
                        };

                        // Check if already exists
                        const existing = await pb.collection('attendance').getList(1, 1, {
                            filter: `lesson = "${currentLesson.id}" && group_member = "${localMember.id}"`
                        });

                        if (existing.items.length > 0) {
                            await pb.collection('attendance').update(existing.items[0].id, attendanceData);
                        } else {
                            await pb.collection('attendance').create(attendanceData);
                        }
                    } catch (e) {
                        // Member might not be synced locally yet
                    }
                }

                console.log("AttendanceSync: Success!");
                setStatus(""); // Hide status on success
            } catch (e: any) {
                console.error("AttendanceSync Error:", e);
                setStatus("");
            }
        };

        sync();
    }, []);

    if (!status) return null;

    return (
        <div className="fixed bottom-20 left-4 right-4 bg-indigo-600 text-white p-3 rounded-xl shadow-lg border border-indigo-400 flex items-center gap-3 animate-slideUp z-50">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium">{status}</span>
        </div>
    );
}
