require('dotenv').config();
const axios = require('axios');

const testHeyGenToken = async () => {
  try {
    console.log('🧪 Testing HeyGen Token Generation...\n');
    
    const apiKey = process.env.HEYGEN_API_KEY;
    console.log('🔑 Using API Key:', apiKey?.substring(0, 15) + '...');
    
    if (!apiKey) {
      console.error('❌ HEYGEN_API_KEY not found in .env');
      process.exit(1);
    }

    console.log('\n📤 Sending request to HeyGen...');
    console.log('  URL: https://api.heygen.com/v1/streaming.create_token');
    console.log('  Method: POST');
    console.log('  Header: x-api-key:', apiKey?.substring(0, 15) + '...');

    const response = await axios.post(
      'https://api.heygen.com/v1/streaming.create_token',
      {},
      {
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\n✅ SUCCESS! Token generated\n');
    console.log('Response Status:', response.status);
    console.log('Response Data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('\n❌ ERROR\n');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Error Message:', error.message);
    console.error('Error Data:', JSON.stringify(error.response?.data, null, 2));
    
    if (error.response?.status === 400) {
      console.error('\n💡 Possible causes of 400 error:');
      console.error('  - API key is invalid or expired');
      console.error('  - API key format is incorrect');
      console.error('  - Account/subscription is inactive');
    }
  }
};

testHeyGenToken();
