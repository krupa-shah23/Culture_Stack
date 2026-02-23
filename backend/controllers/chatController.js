const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// Helper: deterministic key for two participants within an organization
const makeConversationKey = (idA, idB, orgId) => {
  const [a, b] = [idA.toString(), idB.toString()].sort();
  return `${a}_${b}_${orgId.toString()}`;
};

// POST /api/conversations  -> { recipientId }
// returns existing or newly-created conversation between req.user and recipient
const getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) return res.status(400).json({ message: 'recipientId is required' });
    if (recipientId.toString() === senderId.toString()) return res.status(400).json({ message: 'Cannot create conversation with yourself' });

    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    // Ensure same organization
    if (!recipient.organization || recipient.organization.toString() !== req.user.organization.toString()) {
      return res.status(403).json({ message: 'Users must belong to the same organization to start a conversation' });
    }

    const key = makeConversationKey(senderId, recipientId, req.user.organization);

    let conv = await Conversation.findOne({ conversationKey: key });
    if (!conv) {
      conv = await Conversation.create({
        participants: [senderId, recipientId],
        conversationKey: key,
        organization: req.user.organization,
      });
    }

    const populated = await Conversation.findById(conv._id).populate('participants', 'fullName department');
    return res.status(200).json(populated);
  } catch (error) {
    console.error('chatController.getOrCreateConversation error', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/conversations  -> list conversations of current user
const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .sort({ updatedAt: -1 })
      .populate('participants', 'fullName department')
      .lean();

    // Attach lastMessage for each conversation
    const convsWithLast = await Promise.all(
      conversations.map(async (c) => {
        const last = await Message.findOne({ conversation: c._id }).sort({ createdAt: -1 }).lean();
        return { ...c, lastMessage: last || null };
      })
    );

    res.json(convsWithLast);
  } catch (error) {
    console.error('chatController.getMyConversations error', error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/conversations/:id/messages
const getMessages = async (req, res) => {
  try {
    const convId = req.params.id;
    const conv = await Conversation.findById(convId);
    if (!conv) return res.status(404).json({ message: 'Conversation not found' });

    // Authorization: only participants may access
    const isParticipant = conv.participants.some((p) => p.toString() === req.user._id.toString());
    if (!isParticipant) return res.status(403).json({ message: 'Not authorized to view messages in this conversation' });

    const messages = await Message.find({ conversation: convId }).sort({ createdAt: 1 }).populate('sender', 'fullName');
    res.json(messages);
  } catch (error) {
    console.error('chatController.getMessages error', error);
    res.status(500).json({ message: error.message });
  }
};

// POST /api/messages  -> { conversationId?, recipientId?, content }
// If conversationId omitted, conversation will be created between sender and recipient if allowed
const sendMessage = async (req, res) => {
  try {
    const { conversationId, recipientId, content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ message: 'Message content required' });

    let conv = null;

    if (conversationId) {
      conv = await Conversation.findById(conversationId);
      if (!conv) return res.status(404).json({ message: 'Conversation not found' });

      if (!conv.participants.some((p) => p.toString() === req.user._id.toString())) {
        return res.status(403).json({ message: 'Not authorized to post in this conversation' });
      }
    } else {
      // require recipientId
      if (!recipientId) return res.status(400).json({ message: 'recipientId (or conversationId) required' });
      if (recipientId.toString() === req.user._id.toString()) return res.status(400).json({ message: 'Cannot message yourself' });

      const recipient = await User.findById(recipientId);
      if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

      if (!recipient.organization || recipient.organization.toString() !== req.user.organization.toString()) {
        return res.status(403).json({ message: 'Users must belong to the same organization to message' });
      }

      const key = makeConversationKey(req.user._id, recipientId, req.user.organization);
      conv = await Conversation.findOne({ conversationKey: key });
      if (!conv) {
        conv = await Conversation.create({ participants: [req.user._id, recipientId], conversationKey: key, organization: req.user.organization });
      }
    }

    const message = await Message.create({ conversation: conv._id, sender: req.user._id, content });

    // update conversation timestamp
    conv.updatedAt = new Date();
    await conv.save();

    const populated = await Message.findById(message._id).populate('sender', 'fullName');
    res.status(201).json({ message: populated, conversation: conv });
  } catch (error) {
    console.error('chatController.sendMessage error', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrCreateConversation,
  getMyConversations,
  getMessages,
  sendMessage,
};
