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
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
}, { timestamps: true });

// Optional: ensure a message has non-empty content
messageSchema.pre('validate', function () {
  if (!this.content || !this.content.trim()) {
    throw new Error('Message content cannot be empty');
  }
});

module.exports = mongoose.model('Message', messageSchema);
