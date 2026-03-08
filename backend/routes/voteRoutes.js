const express = require('express');
const router = express.Router();
const { handleVote, getUserVote } = require('../controllers/voteController');
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');

// All vote routes require authentication and org membership
router.use(protect);
router.use(ensureOrgMember);

// POST /api/votes - Create, Switch, or Remove a vote
router.post('/', handleVote);

// GET /api/votes/:postId - Get user's active vote status
router.get('/:postId', getUserVote);

module.exports = router;
