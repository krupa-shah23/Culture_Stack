const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Please add comment content']
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    // Comment reactions (cached counters for fast reads)
    likeCount: {
        type: Number,
        default: 0,
        index: true
    },
    dislikeCount: {
        type: Number,
        default: 0,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);