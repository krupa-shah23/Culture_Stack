const mongoose = require('mongoose');

const conversationSchema = mongoose.Schema({
  participants: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  ],
  // deterministic key to enforce unique conversation between two users
  conversationKey: {
    type: String,
    unique: true,
    required: true,
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
  },
}, { timestamps: true });

// Ensure exactly two participants
conversationSchema.pre('validate', function (next) {
  if (!this.participants || this.participants.length !== 2) {
    return next(new Error('Conversation must have exactly two participants'));
  }
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
