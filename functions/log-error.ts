import { createClient } from 'npm:@insforge/sdk';

export default async function (req: Request): Promise<Response> {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    if (req.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (req.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const logs = Array.isArray(body) ? body : [body];

        const client = createClient({
            baseUrl: Deno.env.get('INSFORGE_BASE_URL') || '',
            anonKey: Deno.env.get('ANON_KEY') || Deno.env.get('VITE_INSFORGE_ANON_KEY') || ''
        });

        const mappedLogs = logs.map((log: any) => ({
            user_id: log.userId || null,
            message: log.message,
            stack: log.stack || null,
            route: log.route || '/',
            environment: log.environment || 'production',
            severity: log.severity || 'error',
            device_info: log.device || {},
            metadata: {
                url: log.url,
                userAgent: log.userAgent,
                timestamp: log.timestamp
            },
            resolved: false,
            recurring_count: 1
        }));

        // Grouping recurring errors by (message, stack, route)
        // We use upsert with onConflict if we want to increment recurring_count
        // However, basic Supabase upsert doesn't easily increment.
        // We'll just insert and let the recurring_count be handled by a trigger or just multiple rows for now.
        // The user's rule says "resolved (boolean)" and "recurring_count" should exist.
        // I'll just insert for now.

        const { error } = await client.database
            .from('error_logs')
            .insert(mappedLogs);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: mappedLogs.length }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
