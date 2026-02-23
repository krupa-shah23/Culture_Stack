const axios = require('axios');

// @desc    Get HeyGen Streaming Token
// @route   POST /api/ai/heygen-token
// @access  Private
const getHeyGenToken = async (req, res) => {
  try {
    console.log('🎬 HeyGen token request received');
    console.log('🔑 API Key present:', !!process.env.HEYGEN_API_KEY);
    console.log('🔑 API Key starts with:', process.env.HEYGEN_API_KEY?.substring(0, 10) + '...');

    if (!process.env.HEYGEN_API_KEY) {
      throw new Error('HEYGEN_API_KEY not configured in environment');
    }

    // HeyGen streaming token endpoint requires specific body parameters
    const response = await axios.post(
      'https://api.heygen.com/v1/streaming.create_token',
      {
        // Body should be empty or with minimal params for token creation
      },
      {
        headers: {
          'x-api-key': process.env.HEYGEN_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('✅ HeyGen token received successfully');
    console.log('📦 Response structure:', Object.keys(response.data));
    console.log('📦 Token data:', response.data.data);
    res.status(200).json(response.data);
  } catch (error) {
    console.error('❌ Error fetching HeyGen token');
    console.error('❌ Status code:', error.response?.status);
    console.error('❌ Status text:', error.response?.statusText);
    console.error('❌ Error message:', error.message);
    console.error('❌ Response body:', error.response?.data);
    console.error('❌ Request config:', {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    });
    
    res.status(error.response?.status || 500).json({
      message: 'Failed to fetch HeyGen token',
      error: error.response?.data || error.message,
      status: error.response?.status,
      hint: 'Check if HeyGen API key is valid and not expired'
    });
  }
};

module.exports = {
  getHeyGenToken,
};
