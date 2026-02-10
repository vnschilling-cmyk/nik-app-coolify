import { useState, useEffect } from "react";
import { pb } from "@/lib/pocketbase";
import { useAuth } from "./useAuth";

export type PageId = "dashboard" | "bible" | "study" | "library" | "setup";
export type SectionId = "groups" | "content_management" | "design" | "permissions" | "word_studies" | "text_studies" | "facts" | "quotes" | "illustrations" | "measures" | "ai_features" | "dashboard_questions" | "incoming_questions" | "group_statistics";

export type UserRole = "leader" | "staff" | "youth";

export interface RoleConfig {
    id?: string;
    role: UserRole;
    permissions: {
        pages: PageId[];
        sections: SectionId[];
    };
}

// Hardcoded defaults to ensure the app works even if PB collection is missing
export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, { pages: PageId[], sections: SectionId[] }> = {
    leader: {
        pages: ["dashboard", "bible", "study", "library", "setup"],
        sections: ["groups", "content_management", "design", "permissions", "word_studies", "text_studies", "facts", "quotes", "illustrations", "measures", "ai_features", "dashboard_questions", "incoming_questions", "group_statistics"]
    },
    staff: {
        pages: ["dashboard", "bible", "study", "library", "setup"],
        sections: ["content_management", "design", "word_studies", "text_studies", "facts", "quotes", "illustrations", "measures", "ai_features", "dashboard_questions", "group_statistics"]
    },
    youth: {
        pages: ["dashboard", "bible", "study"],
        sections: ["design", "group_statistics"]
    }
};

export function usePermissions() {
    const { user } = useAuth();
    const [roleConfigs, setRoleConfigs] = useState<Record<UserRole, { pages: PageId[], sections: SectionId[] }>>(DEFAULT_ROLE_PERMISSIONS);
    const [loading, setLoading] = useState(true);

    const role = (user?.role || "youth") as UserRole;
    const is_admin = user?.is_admin === true;

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const records = await pb.collection('role_permissions').getFullList<RoleConfig>();
                if (records.length > 0) {
                    const newConfigs = { ...DEFAULT_ROLE_PERMISSIONS };
                    records.forEach(rec => {
                        newConfigs[rec.role] = rec.permissions;
                    });
                    setRoleConfigs(newConfigs);
                }
            } catch (e) {
                // If collection doesn't exist, we just stick with defaults
                console.info("[usePermissions] Using default roles (collection 'role_permissions' not found or empty)");
            } finally {
                setLoading(false);
            }
        };

        fetchConfigs();
    }, []);

    const canAccessPage = (pageId: PageId): boolean => {
        if (is_admin || role === "leader") return true;
        const perms = roleConfigs[role] || DEFAULT_ROLE_PERMISSIONS[role];
        return perms.pages.includes(pageId);
    };

    const canAccessSection = (sectionId: SectionId): boolean => {
        if (is_admin || role === "leader") return true;
        const perms = roleConfigs[role] || DEFAULT_ROLE_PERMISSIONS[role];
        return perms.sections.includes(sectionId);
    };

    const isLeader = (): boolean => {
        return is_admin || role === "leader";
    };

    return { canAccessPage, canAccessSection, isLeader, user, role, loadingPermissions: loading };
}
