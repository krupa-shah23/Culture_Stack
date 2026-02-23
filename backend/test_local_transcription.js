require('dotenv').config();
const { transcribeAudio } = require('./services/transcriptionService');
const path = require('path');

const testLocal = async () => {
    const filePath = path.join(__dirname, 'uploads/audio/1771014648102-124774.mp3');
    console.log('Testing local transcription for:', filePath);
    try {
        const result = await transcribeAudio(filePath);
        console.log('Final Heatmap:', JSON.stringify(result.heatmap));
    } catch (e) {
        console.error(e);
    }
};

testLocal();
