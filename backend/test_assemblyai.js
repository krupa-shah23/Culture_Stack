require('dotenv').config();
const { transcribeAudioFromUrl } = require('./services/transcriptionService');

const testAssemblyAI = async () => {
    console.log('Testing AssemblyAI Service...');

    const sampleAudioUrl = 'https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3';

    try {
        console.log(`Transcribing sample URL: ${sampleAudioUrl}`);
        const result = await transcribeAudioFromUrl(sampleAudioUrl);

        console.log('\n--- Transcription Result ---');
        console.log('Text Length:', result.text.length);
        console.log('Text Preview:', result.text.substring(0, 100) + '...');

        console.log('\n--- Summary ---');
        console.log(result.summary);

        console.log('\n--- Heatmap (First 2 segments) ---');
        console.log(JSON.stringify(result.heatmap.slice(0, 2), null, 2));

    } catch (error) {
        console.error('❌ AssemblyAI Test Failed:', error);
    }
};

testAssemblyAI();
