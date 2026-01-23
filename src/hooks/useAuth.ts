import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';

export function useAuth() {
    const [user, setUser] = useState<RecordModel | null>(pb.authStore.model);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialsync
        setUser(pb.authStore.model);

        // Listen to changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const login = async (email: string, pass: string) => {
        setIsLoading(true);
        try {
            await pb.collection('users').authWithPassword(email, pass);
        } catch (e) {
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (email: string, pass: string, passwordConfirm: string) => {
        setIsLoading(true);
        try {
            await pb.collection('users').create({
                email,
                password: pass,
                passwordConfirm: passwordConfirm,
            });
            // Auto login after reg
            await login(email, pass);
        } catch (e) {
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithProvider = async (provider: 'google' | 'apple') => {
        setIsLoading(true);
        console.log(`Starting ${provider} login...`);
        try {
            const authData = await pb.collection('users').authWithOAuth2({ provider });
            console.log("Auth successful:", authData);
        } catch (e: any) {
            console.error("Auth failed:", e);
            console.error("Details:", e.originalError || e.message);
            alert("Login Fehler: " + (e.message || "Unbekannt"));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        pb.authStore.clear();
    };

    return { user, isLoading, login, register, loginWithProvider, logout };
}
