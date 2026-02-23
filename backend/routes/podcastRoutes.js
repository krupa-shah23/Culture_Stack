const express = require('express');
const router = express.Router();
const {
  uploadPodcast,
  getPodcasts,
  getPodcast,
  updatePodcast,
  deletePodcast,
  searchPodcasts,
  transcribePodcast,
  getUserPodcasts,
  getMyPodcasts
} = require('../controllers/podcastController');
const { protect } = require('../middleware/authMiddleware');
const { ensureOrgMember } = require('../middleware/orgScopeMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All podcast routes require authentication and org membership
router.use(protect);
router.use(ensureOrgMember);

// POST /api/podcasts - Upload a new podcast
router.post('/', upload.single('audio'), uploadPodcast);

// GET /api/podcasts/my - Get current user's podcasts
router.get('/my', getMyPodcasts);

// GET /api/podcasts/user/:userId - Get podcasts for a specific user
router.get('/user/:userId', getUserPodcasts);

// GET /api/podcasts - Get all podcasts in organization
router.get('/', getPodcasts);

// Specific routes (must be before /:podcastId to avoid conflicts)
// POST /api/podcasts/:podcastId/transcribe - Transcribe podcast audio
router.post('/:podcastId/transcribe', transcribePodcast);

// GET /api/podcasts/search - Search podcasts
router.get('/search/query', searchPodcasts);

// GET /api/podcasts/:podcastId - Get single podcast
router.get('/:podcastId', getPodcast);

// PUT /api/podcasts/:podcastId - Update podcast
router.put('/:podcastId', updatePodcast);

// DELETE /api/podcasts/:podcastId - Delete podcast
router.delete('/:podcastId', deletePodcast);

module.exports = router;
