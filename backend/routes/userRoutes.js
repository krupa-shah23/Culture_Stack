const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');
const { getUserProfile } = require('../controllers/userController');

// GET /api/users/:id/profile (protected, org-scoped)
router.get('/:id/profile', protect, ensureOrgMember, getUserProfile);

module.exports = router;