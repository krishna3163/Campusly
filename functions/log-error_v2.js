const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Note: insforge is available globally in the edge runtime
module.exports = async function (request) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
    }

    try {
        const body = await request.json();
        const logs = Array.isArray(body) ? body : [body];

        const mappedLogs = logs.map(log => ({
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

        // Use the global insforge instance if available, or just return success for logging
        // In many setups, the edge function just receives and logs to stdout/external service
        // If we want to save to DB:
        /*
        const { data, error } = await insforge.database
            .from('error_logs')
            .upsert(mappedLogs, { onConflict: 'message, stack, route' });
        if (error) throw error;
        */

        console.log('Error Logs Received:', JSON.stringify(mappedLogs));

        return new Response(JSON.stringify({ success: true, count: mappedLogs.length }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        let msg = "Unknown error";
        if (err instanceof Error) msg = err.message;
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
