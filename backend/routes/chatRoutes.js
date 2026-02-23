const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');
const { getOrCreateConversation, getMyConversations, getMessages, sendMessage } = require('../controllers/chatController');

// All chat routes require authentication and organization membership
router.use(protect, ensureOrgMember);

// POST /api/conversations  -> { recipientId }
router.post('/conversations', getOrCreateConversation);

// GET /api/conversations  -> list user's conversations
router.get('/conversations', getMyConversations);

// GET /api/conversations/:id/messages  -> messages for conversation
router.get('/conversations/:id/messages', getMessages);

// POST /api/messages  -> { conversationId?, recipientId?, content }
router.post('/messages', sendMessage);

module.exports = router;
