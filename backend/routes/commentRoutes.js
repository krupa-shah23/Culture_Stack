const express = require('express');
const router = express.Router();
const { createComment, getComments, updateComment, deleteComment, reactToComment } = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');

// All comment routes require authentication and org membership
router.use(protect);
router.use(ensureOrgMember);

// POST /api/comments - Create a new comment
router.post('/', createComment);

// GET /api/comments/:postId - Get comments for a post
router.get('/:postId', getComments);

// POST /api/comments/:commentId/reaction - Like / Dislike / Remove reaction
router.post('/:commentId/reaction', reactToComment);

// PUT /api/comments/:commentId - Update comment
router.put('/:commentId', updateComment);

// DELETE /api/comments/:commentId - Delete comment
router.delete('/:commentId', deleteComment);

module.exports = router;