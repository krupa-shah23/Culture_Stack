const mongoose = require('mongoose');

const tagSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a tag name']
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    postCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Tag', tagSchema);