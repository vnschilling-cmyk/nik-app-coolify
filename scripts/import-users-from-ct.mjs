import PocketBase from 'pocketbase';
import fetch from 'node-fetch';

const token = "VbLguIRXGuMAgzAIhe1N84ORF609OIhhHQHv6dTjpgnYVMsBMs4CvBE02xZy78KnNSM2ejKuew378ZSQOszifOCKRZD1IHNGDnPDAlCG9pYev4ceykMbr1iLZZSRk9PJxTXgsBBazUJ1wOKuYxvJLoGrwUIoLfATmHR9bnOfdVgcH1uq6zFQ1K6VvveaWUV89n9H9OCkSMCssR7kJhgzCd8OnJGVwFFbf4KL3yyr1LcJ8fPGnpvEDCNiRtXXYhUg";
const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function importUsers() {
    try {
        console.log("Connecting to PocketBase...");
        try {
            await pb.admins.authWithPassword('admin@nik-app.de', 'Muenze1980!#');
        } catch (e) {
            console.log("Admin auth failed, trying 'users' collection auth...");
            await pb.collection('users').authWithPassword('admin@nik-app.de', 'Muenze1980!#');
        }
        console.log("Logged in to PB");

        const groupId = 19; // Jugend
        const url = `https://cbggruenberg.church.tools/api/groups/${groupId}/members?limit=200`;

        console.log("Fetching members from ChurchTools...");
        const res = await fetch(url, {
            headers: { 'Authorization': `Login ${token}` }
        });

        if (!res.ok) {
            throw new Error(`CT API Error: ${res.status} ${res.statusText}`);
        }

        const data = await res.json();
        const ctMembers = data.data || [];
        console.log(`Fetched ${ctMembers.length} members from CT`);

        let createdCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;

        for (const member of ctMembers) {
            const firstName = member.person?.domainAttributes?.firstName || "";
            const lastName = member.person?.domainAttributes?.lastName || "";
            const nickname = member.person?.domainAttributes?.nickname || "";

            // Build Display Name: "Vorname Nachname"
            let displayName = firstName;
            if (lastName) displayName += ` ${lastName}`;
            displayName = displayName.trim();

            if (!displayName) {
                console.log(`Skipping member ${member.personId} - No name found`);
                continue;
            }

            // Build Username: "VornameNachname" (Sanitized)
            // Remove spaces, special chars, umlauts to simple chars if possible, or just strict replace
            let username = displayName.toLowerCase()
                .replace(/ä/g, 'ae')
                .replace(/ö/g, 'oe')
                .replace(/ü/g, 'ue')
                .replace(/ß/g, 'ss')
                .replace(/[^a-z0-9]/g, '');

            // Ensure username is not empty
            if (!username) username = `user${member.personId}`;

            // LOGIN EMAIL STRATEGY:
            // Since username auth is disabled/broken on this server, we use a generated email for login.
            // Format: username@nik-app.local
            const email = `${username}@nik-app.local`;
            // We lose real email for auth, but prioritize login requirement.

            console.log(`Processing: ${displayName} -> ${email}`);

            try {
                // Check if user exists by Email (primary unique id usually) or Username
                let existingUser = null;
                try {
                    // Try finding by internal email first (most reliable for re-runs)
                    const existingList = await pb.collection('users').getList(1, 1, { filter: `email="${email}"` });
                    if (existingList.items.length > 0) existingUser = existingList.items[0];
                    else {
                        // Fallback: check username collision
                        const existingUserList = await pb.collection('users').getList(1, 1, { filter: `username="${username}"` });
                        if (existingUserList.items.length > 0) existingUser = existingUserList.items[0];
                    }
                } catch (ignore) { }

                if (existingUser) {
                    console.log(`  -> User exists (${existingUser.id}). Updating name/email.`);
                    await pb.collection('users').update(existingUser.id, {
                        name: displayName,
                        username: username,
                        email: email, // FORCE UPDATE EMAIL for login
                        // Not updating password to not lock them out
                    });
                    updatedCount++;
                } else {
                    console.log(`  -> Creating new user...`);
                    const password = "Jugend2024!";
                    await pb.collection('users').create({
                        username: username,
                        email: email,
                        emailVisibility: true,
                        password: password,
                        passwordConfirm: password,
                        name: displayName,
                        is_admin: false
                    });
                    createdCount++;
                }

            } catch (err) {
                console.error(`  -> Failed to import ${displayName}:`, err.message);
                if (err.data) console.error("     Details:", JSON.stringify(err.data));
            }
        }

        console.log("-----------------------------------");
        console.log(`Import Complete.`);
        console.log(`Created: ${createdCount}`);
        console.log(`Updated: ${updatedCount}`);
        console.log(`Skipped: ${skippedCount}`);

    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

importUsers();
