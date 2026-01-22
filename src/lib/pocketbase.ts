import PocketBase from 'pocketbase';

// In production, this should be an environment variable
const POCKETBASE_URL = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';

// Global instance to avoid multiple connections in dev HMR (though for REST client it's fine)
export const pb = new PocketBase(POCKETBASE_URL);

// Optional: Type definitions for collections can be added here or in a separate types file
