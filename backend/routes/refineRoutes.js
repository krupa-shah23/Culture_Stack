const express = require('express');
const router = express.Router();
const { refineRant } = require('../controllers/refineController');

// POST /api/refine - Refine raw text into professional reflection
router.post('/', refineRant);

module.exports = router;
