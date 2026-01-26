import PocketBase from 'pocketbase';
import fetch from 'node-fetch';

const token = "VbLguIRXGuMAgzAIhe1N84ORF609OIhhHQHv6dTjpgnYVMsBMs4CvBE02xZy78KnNSM2ejKuew378ZSQOszifOCKRZD1IHNGDnPDAlCG9pYev4ceykMbr1iLZZSRk9PJxTXgsBBazUJ1wOKuYxvJLoGrwUIoLfATmHR9bnOfdVgcH1uq6zFQ1K6VvveaWUV89n9H9OCkSMCssR7kJhgzCd8OnJGVwFFbf4KL3yyr1LcJ8fPGnpvEDCNiRtXXYhUg";
const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function syncMembers() {
    try {
        await pb.admins.authWithPassword('admin@nik-app.de', '12345678');
        console.log("Logged in to PB");

        const groupId = "wqdzdycr6okbk77"; // Jugend
        const url = `https://cbggruenberg.church.tools/api/groups/19/members?limit=200`;

        const res = await fetch(url, {
            headers: { 'Authorization': `Login ${token}` }
        });

        const data = await res.json();
        const ctMembers = data.data || [];
        console.log(`Fetched ${ctMembers.length} members from CT`);

        for (const member of ctMembers) {
            const firstName = member.person?.domainAttributes?.firstName || "";
            const lastName = member.person?.domainAttributes?.lastName || "";
            const name = firstName || lastName ? `${firstName} ${lastName}`.trim() : (member.person?.title || "Unbekannt");
            const email = member.person?.domainAttributes?.email || member.email || "";

            console.log(`Processing ${name} (${member.personId})`);

            const filter = `group = "${groupId}" && ct_person_id = ${member.personId}`;
            const existing = await pb.collection('group_members').getList(1, 1, { filter });

            const memberData = {
                group: groupId,
                ct_person_id: member.personId,
                name: name,
                email: email,
                role: 'youth'
            };

            if (existing.items.length > 0) {
                await pb.collection('group_members').update(existing.items[0].id, memberData);
            } else {
                await pb.collection('group_members').create(memberData);
            }
        }
        console.log("Sync complete!");
    } catch (e) {
        console.error("Sync failed:", e.message, JSON.stringify(e.data));
    }
}

syncMembers();
