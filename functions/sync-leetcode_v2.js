const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

module.exports = async function (request) {
    if (request.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const body = await request.json();
        const { userId, username } = body;

        if (!userId || !username || username.username < 3) {
            // No, username.length < 3
        }

        // Call LeetCode GraphQL API
        const query = `
            query getUserProfile($username: String!) {
                matchedUser(username: $username) {
                    username
                    profile {
                        ranking
                    }
                    submitStats {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                    badges {
                        name
                        icon
                    }
                }
                userContestRanking(username: $username) {
                    rating
                }
            }
        `;

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Mozilla/5.0'
            },
            body: JSON.stringify({
                query,
                variables: { username }
            })
        });

        const lcData = await response.json();

        if (!lcData.data || !lcData.data.matchedUser) {
            return new Response(JSON.stringify({ error: 'User not found on LeetCode' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const matchedUser = lcData.data.matchedUser;
        const contestRanking = lcData.data.userContestRanking;

        const acSubmissionNum = matchedUser.submitStats?.acSubmissionNum || [];
        const getTotal = (diff) => acSubmissionNum.find(d => d.difficulty === diff)?.count || 0;

        const total_solved = getTotal('All');
        const easy_count = getTotal('Easy');
        const medium_count = getTotal('Medium');
        const hard_count = getTotal('Hard');

        const ranking = matchedUser.profile?.ranking || 0;
        const rating = contestRanking?.rating || 0;
        const badges = matchedUser.badges || [];

        const profileResponse = {
            user_id: userId,
            username: matchedUser.username,
            total_solved,
            easy_count,
            medium_count,
            hard_count,
            ranking,
            rating,
            badges,
            streak_days: 0,
            longest_streak: 0,
            last_synced: new Date().toISOString()
        };

        return new Response(JSON.stringify(profileResponse), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 's-maxage=21600' }
        });
    } catch (err) {
        let msg = "Unknown error";
        if (err instanceof Error) msg = err.message;
        return new Response(JSON.stringify({ error: msg }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
};
