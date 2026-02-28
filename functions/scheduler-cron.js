// ===================================================================
// Campusly v3.0 — Background Scheduler Edge Function
// Handles: Scheduled Messages, Assignment Reminders, Event Reminders
// Deploy as InsForge Edge Function, triggered by external cron (60s)
// ===================================================================

module.exports = async function (request) {
    const API_KEY = request.headers.get('x-api-key');
    const CRON_SECRET = request.headers.get('x-cron-secret');

    // Simple auth check
    if (!CRON_SECRET || CRON_SECRET !== Deno.env.get('CRON_SECRET')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const results = {
        scheduled_messages_sent: 0,
        assignment_reminders_sent: 0,
        event_reminders_sent: 0,
        errors: [],
    };

    try {
        // ─── 1. PROCESS SCHEDULED MESSAGES ───────────────────────────
        const { data: pendingMessages } = await fetch(
            `${Deno.env.get('INSFORGE_URL')}/rest/v1/scheduled_messages?status=eq.pending&scheduled_time=lte.${new Date().toISOString()}&select=*`,
            {
                headers: {
                    'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                    'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                },
            }
        ).then(r => r.json());

        if (pendingMessages?.length) {
            for (const scheduled of pendingMessages) {
                try {
                    // Insert actual message
                    await fetch(`${Deno.env.get('INSFORGE_URL')}/rest/v1/messages`, {
                        method: 'POST',
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                            'Content-Type': 'application/json',
                            'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({
                            conversation_id: scheduled.conversation_id,
                            sender_id: scheduled.user_id,
                            content: scheduled.content,
                            type: scheduled.message_type || 'text',
                            status: 'sent',
                        }),
                    });

                    // Mark scheduled message as sent
                    await fetch(
                        `${Deno.env.get('INSFORGE_URL')}/rest/v1/scheduled_messages?id=eq.${scheduled.id}`,
                        {
                            method: 'PATCH',
                            headers: {
                                'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                                'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ status: 'sent', sent_at: new Date().toISOString() }),
                        }
                    );

                    results.scheduled_messages_sent++;
                } catch (err) {
                    results.errors.push(`scheduled_msg_${scheduled.id}: ${err.message}`);
                }
            }
        }

        // ─── 2. ASSIGNMENT REMINDERS (24h and 2h) ────────────────────
        const now = new Date();
        const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        // 24h reminders
        const { data: assignments24h } = await fetch(
            `${Deno.env.get('INSFORGE_URL')}/rest/v1/group_assignments?due_date=gte.${now.toISOString()}&due_date=lte.${in24h.toISOString()}&select=*`,
            {
                headers: {
                    'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                    'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                },
            }
        ).then(r => r.json());

        if (assignments24h?.length) {
            for (const assignment of assignments24h) {
                // Check if reminder already sent
                const { data: existing } = await fetch(
                    `${Deno.env.get('INSFORGE_URL')}/rest/v1/assignment_reminders?assignment_id=eq.${assignment.id}&reminder_type=eq.24h&select=id`,
                    {
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                        },
                    }
                ).then(r => r.json());

                if (!existing?.length) {
                    // Send system notification message to group
                    await fetch(`${Deno.env.get('INSFORGE_URL')}/rest/v1/messages`, {
                        method: 'POST',
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            conversation_id: assignment.group_id,
                            sender_id: assignment.created_by,
                            content: `⏰ Reminder: "${assignment.title}" is due in less than 24 hours!`,
                            type: 'system',
                            is_important: true,
                        }),
                    });

                    // Log reminder
                    await fetch(`${Deno.env.get('INSFORGE_URL')}/rest/v1/assignment_reminders`, {
                        method: 'POST',
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            assignment_id: assignment.id,
                            reminder_type: '24h',
                        }),
                    });

                    results.assignment_reminders_sent++;
                }
            }
        }

        // ─── 3. EVENT REMINDERS (1 day and 1 hour) ───────────────────
        const { data: events1d } = await fetch(
            `${Deno.env.get('INSFORGE_URL')}/rest/v1/group_events?event_date=gte.${now.toISOString()}&event_date=lte.${in24h.toISOString()}&select=*`,
            {
                headers: {
                    'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                    'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                },
            }
        ).then(r => r.json());

        if (events1d?.length) {
            for (const event of events1d) {
                const { data: existing } = await fetch(
                    `${Deno.env.get('INSFORGE_URL')}/rest/v1/event_reminders?event_id=eq.${event.id}&reminder_type=eq.1d&select=id`,
                    {
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                        },
                    }
                ).then(r => r.json());

                if (!existing?.length) {
                    await fetch(`${Deno.env.get('INSFORGE_URL')}/rest/v1/messages`, {
                        method: 'POST',
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            conversation_id: event.group_id,
                            sender_id: event.created_by,
                            content: `📅 Reminder: "${event.title}" (${event.type}) is tomorrow at ${event.location || 'TBD'}!`,
                            type: 'system',
                            is_important: true,
                        }),
                    });

                    await fetch(`${Deno.env.get('INSFORGE_URL')}/rest/v1/event_reminders`, {
                        method: 'POST',
                        headers: {
                            'apikey': Deno.env.get('INSFORGE_SERVICE_KEY'),
                            'Authorization': `Bearer ${Deno.env.get('INSFORGE_SERVICE_KEY')}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            event_id: event.id,
                            reminder_type: '1d',
                        }),
                    });

                    results.event_reminders_sent++;
                }
            }
        }

    } catch (err) {
        results.errors.push(`global: ${err.message}`);
    }

    return new Response(JSON.stringify(results), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};
