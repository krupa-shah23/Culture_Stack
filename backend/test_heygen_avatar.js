require('dotenv').config();
const axios = require('axios');

const testHeyGenAvatar = async () => {
  try {
    console.log('🧪 Testing HeyGen Avatar Session Creation...\n');
    
    // Step 1: Get Token
    console.log('📍 Step 1: Getting streaming token...');
    const tokenResponse = await axios.post(
      'https://api.heygen.com/v1/streaming.create_token',
      {},
      {
        headers: {
          'x-api-key': process.env.HEYGEN_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    
    const token = tokenResponse.data.data.token;
    console.log('✅ Token obtained:', token.substring(0, 30) + '...\n');

    // Step 2: Try to create avatar session with different avatar IDs
    const avatarIds = [
      'wayne_20240711_151645_utc',
      'josh_lite3_20230714',
      'DEFAULT',
      'anna_lite3_20230714'
    ];

    for (const avatarId of avatarIds) {
      try {
        console.log(`\n📍 Attempting avatar session with ID: ${avatarId}`);
        console.log('  Parameters:', {
          quality: 'low',
          avatarName: avatarId,
        });

        const response = await axios.post(
          'https://api.heygen.com/v1/streaming.start_avatar',
          {
            quality: 'low',
            avatarName: avatarId,
          },
          {
            headers: {
              'X-STREAM-TOKEN': token,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('  ✅ SUCCESS! Avatar session created');
        console.log('  Response:', JSON.stringify(response.data, null, 2));
        break;
        
      } catch (err) {
        console.log(`  ❌ Failed: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
        if (err.response?.data) {
          console.log('     Details:', JSON.stringify(err.response.data, null, 2));
        }
      }
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR\n');
    console.error('Error:', error.message);
  }
};

testHeyGenAvatar();
