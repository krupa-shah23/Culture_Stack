const express = require('express');
const router = express.Router();
const { getHeyGenToken } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

// Protected route to get streaming token
router.post('/heygen-token', protect, getHeyGenToken);

module.exports = router;
