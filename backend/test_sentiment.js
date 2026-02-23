require('dotenv').config();
const { transcribeAudioFromUrl } = require('./services/transcriptionService');

const testSentiment = async () => {
    const sampleUrl = 'https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3';
    console.log('Testing sentiment for:', sampleUrl);
    try {
        const result = await transcribeAudioFromUrl(sampleUrl);
        console.log('Final Heatmap:', JSON.stringify(result.heatmap));
    } catch (e) {
        console.error(e);
    }
};

testSentiment();
