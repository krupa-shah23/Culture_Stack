const express = require('express');
const router = express.Router();
const { createPost, getPosts, getPost, updatePost, deletePost, getPerspectives, getSentiment, getRelatedPosts, toggleLike, voteOnPost, regenerateAiFeedback, getUserPosts, getTrendingPosts } = require('../controllers/postController');
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All post routes require authentication and org membership
router.use(protect);
router.use(ensureOrgMember);

// POST /api/posts - Create a new post
router.post('/', upload.single('media'), createPost);

// GET /api/posts/user/:userId - Get posts for a specific user
router.get('/user/:userId', getUserPosts);

// GET /api/posts - Get all posts in organization
router.get('/', getPosts);

// GET /api/posts/trending - Trending posts for organization
router.get('/trending', getTrendingPosts);

// Get specific post features (must come before /:postId route)
// POST /api/posts/:postId/like - Toggle like/unlike
router.post('/:postId/like', toggleLike);

// POST /api/posts/:postId/vote - Upvote / Downvote / Remove vote
router.post('/:postId/vote', voteOnPost);

// POST /api/posts/:postId/ai - Regenerate / persist AI feedback for a post
router.post('/:postId/ai', regenerateAiFeedback);

// GET /api/posts/:postId/perspectives - Get perspective rewrites
router.get('/:postId/perspectives', getPerspectives);

// GET /api/posts/:postId/sentiment - Get sentiment analysis
router.get('/:postId/sentiment', getSentiment);

// GET /api/posts/:postId/related - Get related posts
router.get('/:postId/related', getRelatedPosts);

// GET /api/posts/:postId - Get single post
router.get('/:postId', getPost);

// PUT /api/posts/:postId - Update post
router.put('/:postId', updatePost);

// DELETE /api/posts/:postId - Delete post
router.delete('/:postId', deletePost);

module.exports = router;