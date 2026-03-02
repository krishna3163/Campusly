const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

module.exports = async function (request) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const externalJobs = [
            {
                id: 'ext-google-1',
                title: 'Software Engineer Intern',
                company: 'Google',
                location: 'Remote',
                experience_required: '0-1 years',
                salary_range: 'Stipend',
                job_type: 'internship',
                skills_required: ['React', 'TypeScript', 'Node.js'],
                apply_url: 'https://careers.google.com',
                posted_date: new Date().toISOString(),
                source: 'external',
            },
            {
                id: 'ext-meta-1',
                title: 'Frontend Developer',
                company: 'Meta',
                location: 'Menlo Park, CA',
                experience_required: '2+ years',
                salary_range: '$120k - $150k',
                job_type: 'full-time',
                skills_required: ['React', 'GraphQL', 'CSS'],
                apply_url: 'https://metacareers.com',
                posted_date: new Date(Date.now() - 86400000).toISOString(),
                source: 'external',
            }
        ];

        return new Response(JSON.stringify(externalJobs), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (e) {
        let msg = "Unknown error";
        if (e instanceof Error) msg = e.message;
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
}
