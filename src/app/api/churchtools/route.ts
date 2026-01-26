import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

console.log(">>> CT Proxy Route Loading...");

export async function POST(req: Request) {
    try {
        let body;
        try {
            body = await req.json();
        } catch (e) {
            console.error("CT Proxy: Failed to parse request JSON");
            return NextResponse.json({ message: "Invalid JSON body" }, { status: 400 });
        }

        const { url, token, endpoint } = body;

        if (endpoint === 'ping') {
            return NextResponse.json({ message: "Proxy is alive!" });
        }

        if (!url || !token || !endpoint) {
            console.error("CT Proxy: Missing parameters", { url: !!url, token: !!token, endpoint });
            return NextResponse.json({ message: "Missing parameters" }, { status: 400 });
        }

        const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
        let ctUrl = `${baseUrl}/api/${endpoint}`;

        // Add default limit if not provided to avoid CT default of 10
        if (!ctUrl.includes('?')) {
            ctUrl += '?limit=200';
        }

        console.log(`Proxying request to ChurchTools: ${ctUrl}`);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const res = await fetch(ctUrl, {
                headers: {
                    'Authorization': `Login ${token}`,
                    'Accept': 'application/json',
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log(`ChurchTools responded with status: ${res.status}`);

            const contentType = res.headers.get("content-type");
            if (!res.ok) {
                const errorText = await res.text();
                console.error(`ChurchTools API error (${res.status}):`, errorText);

                let message = `ChurchTools Fehler: ${res.status}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    message = errorJson.message || message;
                } catch (e) { }

                return NextResponse.json({ message }, { status: res.status });
            }

            if (contentType && contentType.includes("application/json")) {
                const data = await res.json();
                return NextResponse.json(data);
            } else {
                const text = await res.text();
                console.error("ChurchTools returned non-JSON response:", text.slice(0, 200));
                return NextResponse.json({ message: "ChurchTools hat kein JSON zurückgegeben" }, { status: 500 });
            }
        } catch (fetchError: any) {
            clearTimeout(timeoutId);
            if (fetchError.name === 'AbortError') {
                console.error("CT Proxy: Fetch timed out after 10s");
                return NextResponse.json({ message: "ChurchTools Zeitüberschreitung (10s)" }, { status: 504 });
            }
            throw fetchError;
        }

    } catch (e: any) {
        console.error("CT Proxy: Internal Error:", e);
        return NextResponse.json({ message: `Interner Server-Fehler: ${e.message}` }, { status: 500 });
    }
}
