const express = require('express');
const router = express.Router();
const { searchPosts, getTags, getPostsByTag } = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');

// All search routes require authentication and org membership
router.use(protect);
router.use(ensureOrgMember);

// GET /api/search/tags - Get all tags for organization (must be before /:tagName)
router.get('/tags', getTags);

// GET /api/search/tag/:tagName - Get posts by specific tag
router.get('/tag/:tagName', getPostsByTag);

// GET /api/search - Search posts by keywords and tags (generic search)
router.get('/', searchPosts);

module.exports = router;