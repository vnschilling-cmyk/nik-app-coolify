import PocketBase from 'pocketbase';
import fetch from 'node-fetch';

const token = "VbLguIRXGuMAgzAIhe1N84ORF609OIhhHQHv6dTjpgnYVMsBMs4CvBE02xZy78KnNSM2ejKuew378ZSQOszifOCKRZD1IHNGDnPDAlCG9pYev4ceykMbr1iLZZSRk9PJxTXgsBBazUJ1wOKuYxvJLoGrwUIoLfATmHR9bnOfdVgcH1uq6zFQ1K6VvveaWUV89n9H9OCkSMCssR7kJhgzCd8OnJGVwFFbf4KL3yyr1LcJ8fPGnpvEDCNiRtXXYhUg";
const url = "https://cbggruenberg.church.tools/api/groups?limit=200";
const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function sync() {
    try {
        await pb.admins.authWithPassword('admin@nik-app.de', '12345678');
        console.log("Logged in to PB");

        const res = await fetch(url, {
            headers: {
                'Authorization': `Login ${token}`,
                'Accept': 'application/json',
            },
        });

        const data = await res.json();
        const allGroups = data.data || [];
        const ctGroups = allGroups.filter(g => g.id === 19);
        console.log(`Fetched and filtered ${ctGroups.length} groups from CT (Target: ID 19)`);

        for (const group of ctGroups) {
            console.log(`Processing group: ${group.name} (${group.id})`);

            const existing = await pb.collection('groups').getList(1, 1, {
                filter: `ct_id = ${group.id}`
            });

            if (existing.items.length > 0) {
                console.log(`  Updating existing...`);
                await pb.collection('groups').update(existing.items[0].id, {
                    name: group.name
                });
            } else {
                console.log(`  Creating new...`);
                await pb.collection('groups').create({
                    name: group.name,
                    ct_id: group.id
                });
            }
        }
        console.log("Sync complete!");
    } catch (e) {
        console.error("Sync failed:", e.message, JSON.stringify(e.data));
    }
}

sync();
