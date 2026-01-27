import { useState, useEffect } from 'react';
import { pb } from '@/lib/pocketbase';
import { RecordModel } from 'pocketbase';

export function useAuth() {
    const [user, setUser] = useState<RecordModel | null>(pb.authStore.model);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Initialsync
        setUser(pb.authStore.model);

        // Force refresh from server to get latest data (e.g. admin status changes)
        // This ensures that stale localStorage data is updated
        if (pb.authStore.isValid) {
            pb.collection('users').authRefresh()
                .then((authData) => {
                    console.log("Auth refreshed:", authData.record.email);
                    setUser(authData.record);
                })
                .catch((e) => {
                    console.error("Auth refresh failed:", e);
                    // Optional: logout if refresh fails?
                    // pb.authStore.clear(); 
                });
        }

        // Listen to changes
        const unsubscribe = pb.authStore.onChange((token, model) => {
            setUser(model);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const login = async (identity: string, pass: string) => {
        setIsLoading(true);
        try {
            await pb.collection('users').authWithPassword(identity, pass);
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

    const changePassword = async (pass: string, confirm: string, oldPass: string) => {
        if (!user) throw new Error("Nicht eingeloggt");
        setIsLoading(true);
        try {
            // 1. Update User (Change Password + Flag)
            // This invalidates the current token!
            await pb.collection('users').update(user.id, {
                oldPassword: oldPass,
                password: pass,
                passwordConfirm: confirm,
                password_changed: true
            });

            // 2. Re-Authenticate to get a fresh token
            // We use the email/username from the current user object
            const loginIdentity = user.email || user.username;
            if (loginIdentity) {
                const authData = await pb.collection('users').authWithPassword(loginIdentity, pass);
                // Update local state with the FRESH user record (where password_changed is true)
                setUser(authData.record);
            } else {
                // Fallback (should not happen for valid users)
                setUser(prev => prev ? { ...prev, password_changed: true } : null);
            }
        } catch (e: any) {
            console.error("Change password failed:", e);
            throw e;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        pb.authStore.clear();
    };

    return { user, isLoading, login, register, loginWithProvider, changePassword, logout };
}
