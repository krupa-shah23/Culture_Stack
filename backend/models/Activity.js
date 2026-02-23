const mongoose = require('mongoose');

const activitySchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  type: {
    type: String,
    enum: ['post', 'comment', 'reflection', 'podcast', 'like', 'vote', 'ai_feedback', 'join'],
    required: true
  },
  text: {
    type: String, // "John posted a new reflection"
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId, // ID of the post/comment/podcast
  },
  targetModel: {
    type: String, // 'Post', 'Podcast', etc.
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Activity', activitySchema);
