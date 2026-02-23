require('dotenv').config();
const { summarizeText, generateHeatmapData } = require('./services/aiService');

const testAI = async () => {
    console.log('Testing AI Service...');

    if (!process.env.GOOGLE_API_KEY) {
        console.error('❌ GOOGLE_API_KEY is missing in .env');
        return;
    }
    console.log('✅ API Key found');

    const sampleText = "This is a podcast about the future of AI. We discuss how agents are changing the world. It is very exciting but also a bit scary. We need to be careful with safety.";

    try {
        console.log('\n--- Testing Summarization ---');
        const summary = await summarizeText(sampleText);
        console.log('Summary Result:', summary.substring(0, 100) + '...');
    } catch (error) {
        console.error('❌ Summarization failed:', error);
    }

    try {
        console.log('\n--- Testing Heatmap ---');
        const heatmap = await generateHeatmapData(sampleText);
        console.log('Heatmap Result Length:', heatmap.length);
        console.log('Sample Segment:', JSON.stringify(heatmap[0]));
    } catch (error) {
        console.error('❌ Heatmap failed:', error);
    }
};

testAI();
