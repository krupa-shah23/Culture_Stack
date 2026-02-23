const { refineText } = require('../services/aiService');

// @desc    Refine raw text (rant) into professional reflection
// @route   POST /api/refine
// @access  Public
const refineRant = async (req, res) => {
  try {
    const { rant } = req.body;

    // Validate required field
    if (!rant || typeof rant !== 'string' || rant.trim() === '') {
      return res.status(400).json({ message: 'Please provide a non-empty "rant" field' });
    }

    // Check if client requested AI feedback (analysis) instead of just refining
    if (req.body.getFeedback) {
      const { analyzePost } = require('../services/aiService');
      const aiFeedback = await analyzePost(rant.trim());
      return res.status(200).json({ aiFeedback });
    }

    // Refine the text using AI
    const refinedText = await refineText(rant.trim());

    res.status(200).json({ refinedText });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { refineRant };
