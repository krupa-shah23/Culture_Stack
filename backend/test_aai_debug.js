require('dotenv').config();
const { transcribeAudioFromUrl } = require('./services/transcriptionService');

const fs = require('fs');

const testAssemblyAI = async () => {
    const logFile = './debug_log.txt';
    fs.writeFileSync(logFile, '--- START DEBUG ---\n');

    const sampleAudioUrl = 'https://storage.googleapis.com/aai-web-samples/5_common_sports_injuries.mp3';

    try {
        const result = await transcribeAudioFromUrl(sampleAudioUrl);
        fs.appendFileSync(logFile, `FULL RESULT TEXT: ${result.text}\n`);
        fs.appendFileSync(logFile, `FULL SUMMARY: ${result.summary}\n`);
        if (result.text.startsWith('[Transcription error')) {
            fs.appendFileSync(logFile, `ERROR DETECTED IN TEXT.\n`);
        }
    } catch (error) {
        fs.appendFileSync(logFile, `FATAL ERROR: ${error.message}\n`);
        fs.appendFileSync(logFile, `STACK: ${error.stack}\n`);
    }
    fs.appendFileSync(logFile, '--- END DEBUG ---\n');
};

testAssemblyAI();
