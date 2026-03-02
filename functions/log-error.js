module.exports = async function (request) {
    if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
    }

    try {
        const body = await request.json();
        const logs = Array.isArray(body) ? body : [body];

        // Simple rate limiting: 10 per minute per user
        // Note: Real production would use Redis/KV. 
        // Here we can use metadata or a separate rate_limit table if needed.
        // For atomic scale, we just insert.

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

        const { data, error } = await insforge.database
            .from('error_logs')
            .upsert(mappedLogs, { onConflict: 'message, stack, route' }) // Group recurring errors
            .select();

        if (error) throw error;

        return new Response(JSON.stringify({ success: true, count: mappedLogs.length }), {
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
