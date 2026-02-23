const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Optional: ensure a message has non-empty content
messageSchema.pre('validate', function (next) {
  if (!this.content || !this.content.trim()) {
    return next(new Error('Message content cannot be empty'));
  }
  next();
});

module.exports = mongoose.model('Message', messageSchema);
