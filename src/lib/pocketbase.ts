import PocketBase from 'pocketbase';

// Determine the base URL
const getBaseUrl = () => {
    // 1. Check environment variable
    if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
        return process.env.NEXT_PUBLIC_POCKETBASE_URL;
    }

    // 2. In browser, if we accessed via IP (like 192.168.x.x), use that same IP for PocketBase
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        // Only if it looks like an IP or external hostname
        return `http://${window.location.hostname}:8090`;
    }

    // 3. Fallback to localhost
    return 'http://127.0.0.1:8090';
};

const POCKETBASE_URL = getBaseUrl();

if (typeof window !== 'undefined') {
    console.log(`[PocketBase] Connecting to: ${POCKETBASE_URL}`);
}

export const pb = new PocketBase(POCKETBASE_URL);
