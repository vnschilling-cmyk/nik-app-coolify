export interface CTGroup {
    id: number;
    name: string;
}

export interface CTMember {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
}

export class ChurchToolsClient {
    private baseUrl: string;
    private token: string;

    constructor(baseUrl: string, token: string) {
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        this.token = token;
    }

    private async request(endpoint: string, options: RequestInit = {}) {
        const url = `${this.baseUrl}/api/${endpoint}`;
        const res = await fetch(url, {
            ...options,
            headers: {
                ...options.headers,
                'Authorization': `Login ${this.token}`,
                'Accept': 'application/json',
            },
        });

        if (!res.ok) {
            const error = await res.json().catch(() => ({ message: res.statusText }));
            throw new Error(error.message || `CT Request failed: ${res.status}`);
        }

        return res.json();
    }

    async getGroups(): Promise<CTGroup[]> {
        const data = await this.request('groups');
        return data.data.map((g: any) => ({
            id: g.id,
            name: g.name
        }));
    }

    async getGroupMembers(groupId: number): Promise<CTMember[]> {
        const data = await this.request(`groups/${groupId}/members?limit=200`);
        return data.data.map((m: any) => ({
            id: m.personId,
            firstName: m.person?.domainAttributes?.firstName || m.firstName,
            lastName: m.person?.domainAttributes?.lastName || m.lastName,
            email: m.person?.domainAttributes?.email || m.email || ""
        }));
    }

    async getMeetings(groupId: number): Promise<any[]> {
        const data = await this.request(`groups/${groupId}/meetings`);
        return data.data || [];
    }

    async getMeetingAttendance(groupId: number, meetingId: number): Promise<any[]> {
        const data = await this.request(`groups/${groupId}/meetings/${meetingId}/members`);
        return data.data || [];
    }
}
