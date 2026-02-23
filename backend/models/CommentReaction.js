const mongoose = require('mongoose');

const commentReactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: true },
  reactionType: { type: String, enum: ['like', 'dislike'], required: true }
}, {
  timestamps: true
});

// One reaction per user per comment, fast lookup by commentId
commentReactionSchema.index({ userId: 1, commentId: 1 }, { unique: true });
commentReactionSchema.index({ commentId: 1 });

module.exports = mongoose.model('CommentReaction', commentReactionSchema);
