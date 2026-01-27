import PocketBase from 'pocketbase';

// Determine the base URL
const getBaseUrl = () => {
    // 1. Check environment variable (highest priority)
    if (process.env.NEXT_PUBLIC_POCKETBASE_URL) {
        return process.env.NEXT_PUBLIC_POCKETBASE_URL;
    }

    // 2. In browser, handle production vs local
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;

        // If we are on a nip.io domain (Coolify production)
        if (hostname.includes('195.201.231.49.nip.io')) {
            return `https://pocketbase-nik-app-coolify.195.201.231.49.nip.io`;
        }

        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            // Generic fallback for other external hosts
            return `${window.location.protocol}//pocketbase-${hostname}`;
        }
    }

    // 3. Fallback to localhost (development)
    return 'http://127.0.0.1:8090';
};

const POCKETBASE_URL = getBaseUrl();

if (typeof window !== 'undefined') {
    console.log(`[PocketBase] Connecting to: ${POCKETBASE_URL}`);
}

export const pb = new PocketBase(POCKETBASE_URL);
