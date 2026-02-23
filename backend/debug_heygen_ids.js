require('dotenv').config();
const axios = require('axios');

const USER_IDS = [
    { name: 'Innovator', id: '2819a0bb151d49ca91052de3a3dc9826' },
    { name: 'Risk Evaluator', id: 'af8902e0d9aa4e6681b7b27534cb73ed' },
    { name: 'Strategist', id: '6e847eafc6c641309728f17b91f1aa48' }
];

const debugHeyGenIds = async () => {
    try {
        console.log('🧪 Debugging User Avatar IDs...\n');

        // 1. Get Token
        const tokenRes = await axios.post(
            'https://api.heygen.com/v1/streaming.create_token',
            {},
            { headers: { 'x-api-key': process.env.HEYGEN_API_KEY } }
        );
        const token = tokenRes.data.data.token;
        console.log('✅ Token obtained\n');

        // 2. Test each ID with 'avatarName'
        for (const { name, id } of USER_IDS) {
            console.log(`📍 Testing param 'avatarName' for ${name} (${id})...`);
            try {
                const res = await axios.post(
                    'https://api.heygen.com/v1/streaming.start',
                    {
                        session_id: 'test-session', // Not really needed for start? Wait, endpoint is v1/streaming.new usually?
                        // Actually let's use the start endpoint from the other test file
                        // https://api.heygen.com/v1/streaming.start_avatar is deprecated/legacy? 
                        // The SDK uses streaming.new likely. 
                        // Let's rely on what the test_heygen_avatar.js used: https://api.heygen.com/v1/streaming.start_avatar
                        avatar_name: id,
                        quality: 'low'
                    },
                    {
                        headers: {
                            'X-STREAM-TOKEN': token, // The other test used this header
                            'Authorization': `Bearer ${token}`, // SDK might use this
                            'Content-Type': 'application/json'
                        }
                    }
                );
                // Wait, let's try the EXACT endpoint from test_heygen_avatar.js
                // which was https://api.heygen.com/v1/streaming.start_avatar
            } catch (e) {
                // Fallback to testing the exact way test_heygen_avatar.js did it
            }

            try {
                // RETRY using exact method from working test_heygen_avatar.js
                const response = await axios.post(
                    'https://api.heygen.com/v1/streaming.start_avatar',
                    {
                        quality: 'low',
                        avatarName: id,
                        // voiceId: 'default' // excluded
                    },
                    {
                        headers: {
                            'X-STREAM-TOKEN': token,
                            'Content-Type': 'application/json',
                        },
                    }
                );
                console.log(`  ✅ SUCCESS with avatarName!`);
            } catch (err) {
                console.log(`  ❌ Failed with avatarName: ${err.response?.status} - ${JSON.stringify(err.response?.data)}`);

                // Try with 'avatarId'
                console.log(`  📍 Retrying with 'avatarId'...`);
                try {
                    const res2 = await axios.post(
                        'https://api.heygen.com/v1/streaming.start_avatar',
                        {
                            quality: 'low',
                            avatarId: id
                        },
                        {
                            headers: {
                                'X-STREAM-TOKEN': token,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                    console.log(`  ✅ SUCCESS with avatarId!`);
                } catch (err2) {
                    console.log(`  ❌ Failed with avatarId: ${err2.response?.status} - ${JSON.stringify(err2.response?.data)}`);
                }
            }
            console.log('---');
        }

    } catch (error) {
        console.error('Fatal Error:', error.message);
    }
};

debugHeyGenIds();
