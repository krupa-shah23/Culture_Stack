const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  voteType: { type: String, enum: ['upvote', 'downvote'], required: true },
}, {
  timestamps: true
});

// Ensure one vote per user per post and fast lookups by postId
voteSchema.index({ userId: 1, postId: 1 }, { unique: true });
voteSchema.index({ postId: 1 });

module.exports = mongoose.model('Vote', voteSchema);
