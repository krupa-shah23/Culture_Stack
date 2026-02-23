const mongoose = require('mongoose');

const podcastSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a podcast title']
    },
    description: {
        type: String
    },
    audioUrl: {
        type: String,
        required: [true, 'Please add an audio file']
    },
    audioFileName: {
        type: String
    },
    duration: {
        type: Number // Duration in seconds
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    tags: [{
        type: String
    }],
    playCount: {
        type: Number,
        default: 0
    },
    summary: {
        type: String
    },
    transcription: {
        text: String,
        confidence: Number,
        words: [
            {
                word: String,
                startTime: Number,
                endTime: Number,
                confidence: Number
            }
        ],
        isTranscribed: {
            type: Boolean,
            default: false
        },
        transcribedAt: Date
    },
    heatmap: [
        {
            segment: Number,
            sentiment: String,
            score: Number
        }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Podcast', podcastSchema);
