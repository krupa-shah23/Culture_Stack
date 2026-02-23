const express = require('express');
const router = express.Router();
const { createOrganization, getMyOrganization, addMember, getOrganization } = require('../controllers/organizationController');
const { protect } = require('../middleware/authMiddleware');

// All org routes require authentication
router.use(protect);

// POST /api/organizations - Create a new organization
router.post('/', createOrganization);

// GET /api/organizations/my-org - Get my organization (must be before /:orgId)
router.get('/my-org', getMyOrganization);

// POST /api/organizations/:orgId/members - Add member to organization
router.post('/:orgId/members', addMember);

// GET /api/organizations/:orgId - Get organization by ID
router.get('/:orgId', getOrganization);

module.exports = router;
