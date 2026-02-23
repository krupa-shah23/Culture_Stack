const mongoose = require('mongoose');
const Podcast = require('./models/Podcast');
require('dotenv').config();

const inspectPodcast = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const podcast = await Podcast.findOne().sort({ createdAt: -1 });

        const fs = require('fs');
        if (!podcast) {
            fs.writeFileSync('db_inspection.txt', 'No podcasts found');
        } else {
            let output = `Latest Podcast: ${podcast.title}\n`;
            output += `Heatmap Data: ${JSON.stringify(podcast.heatmap, null, 2)}\n`;
            output += `Summary: ${podcast.summary}\n`;
            output += `Transcription Text Length: ${podcast.transcription?.text?.length}\n`;
            fs.writeFileSync('db_inspection.txt', output);
        }
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

inspectPodcast();
