import PocketBase from 'pocketbase';

const pb = new PocketBase('https://pocketbase-nik-app-coolify.195.201.231.49.nip.io');

async function testUserUpdate() {
    try {
        // Authenticate as Viktor (User)
        console.log("Authenticating as Viktor (User)...");
        // We need the internal email for login
        const email = 'viktorschilling@nik-app.local';
        const password = 'Jugend2024!';

        const authData = await pb.collection('users').authWithPassword(email, password);
        console.log(`Logged in as ${authData.record.name} (${authData.record.id})`);

        // Attempt update
        console.log("Attempting to update password_changed...");

        // We WON'T actually change the password so we can run this multiple times, 
        // but we will try to set password_changed to true (or false)
        try {
            await pb.collection('users').update(authData.record.id, {
                password_changed: true
            });
            console.log("Success: Updated password_changed.");
        } catch (e) {
            console.error("Update password_changed FAILED:", e.message);
            if (e.data) console.log(JSON.stringify(e.data, null, 2));
        }

        // Attempt full password update simulation (changing to same password)
        console.log("Attempting full password update...");
        try {
            await pb.collection('users').update(authData.record.id, {
                password: password,
                passwordConfirm: password,
                password_changed: true
            });
            console.log("Success: Full update worked.");
        } catch (e) {
            console.error("Full update FAILED:", e.message);
            if (e.data) console.log(JSON.stringify(e.data, null, 2));
        }

    } catch (e) {
        console.error("Fatal Error:", e);
    }
}

testUserUpdate();
