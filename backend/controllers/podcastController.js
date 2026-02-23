const Podcast = require('../models/Podcast');
const { transcribeAudio, transcribeAudioFromUrl } = require('../services/transcriptionService');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/audio');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload a new podcast
// @route   POST /api/podcasts
// @access  Private
const uploadPodcast = async (req, res) => {
  try {
    const { title, description, duration, tags } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Podcast title is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Audio file is required' });
    }

    // Create audio URL path (files are saved in uploads/media by uploadMiddleware)
    const audioUrl = `/uploads/media/${req.file.filename}`;

    const podcast = new Podcast({
      title,
      description,
      audioUrl,
      audioFileName: req.file.originalname,
      duration: parseInt(duration) || 0,
      author: req.user._id,
      organization: req.organization,
      tags: tags ? JSON.parse(tags) : []
    });

    const savedPodcast = await podcast.save();
    const populatedPodcast = await Podcast.findById(savedPodcast._id)
      .populate('author', 'fullName email department');

    // Log activity
    const { logActivity } = require('./activityController');
    await logActivity(
      req.user._id,
      req.organization,
      'podcast',
      `${req.user.fullName} uploaded a new podcast: "${title}"`,
      savedPodcast._id,
      'Podcast'
    );

    res.status(201).json(populatedPodcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all podcasts for user's organization
// @route   GET /api/podcasts
// @access  Private
const getPodcasts = async (req, res) => {
  try {
    const podcasts = await Podcast.find({ organization: req.organization })
      .populate('author', 'fullName email department')
      .sort({ createdAt: -1 });

    res.status(200).json(podcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single podcast by ID
// @route   GET /api/podcasts/:podcastId
// @access  Private
const getPodcast = async (req, res) => {
  try {
    const { podcastId } = req.params;

    const podcast = await Podcast.findById(podcastId)
      .populate('author', 'fullName email department');

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Verify podcast belongs to user's organization
    if (podcast.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot access podcast from different organization' });
    }

    // Increment play count
    podcast.playCount += 1;
    await podcast.save();

    res.status(200).json(podcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a podcast
// @route   PUT /api/podcasts/:podcastId
// @access  Private
const updatePodcast = async (req, res) => {
  try {
    const { podcastId } = req.params;
    const { title, description, tags } = req.body;

    const podcast = await Podcast.findById(podcastId);

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Verify user is the author
    if (podcast.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only edit your own podcasts' });
    }

    // Verify organization match
    if (podcast.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot edit podcast from different organization' });
    }

    podcast.title = title || podcast.title;
    podcast.description = description || podcast.description;
    podcast.tags = tags || podcast.tags;

    const updatedPodcast = await podcast.save();
    const populatedPodcast = await Podcast.findById(updatedPodcast._id)
      .populate('author', 'fullName email department');

    res.status(200).json(populatedPodcast);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a podcast
// @route   DELETE /api/podcasts/:podcastId
// @access  Private
const deletePodcast = async (req, res) => {
  try {
    const { podcastId } = req.params;

    const podcast = await Podcast.findById(podcastId);

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Verify user is the author
    if (podcast.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only delete your own podcasts' });
    }

    // Verify organization match
    if (podcast.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot delete podcast from different organization' });
    }

    // Delete audio file from server
    if (podcast.audioUrl) {
      const filePath = path.join(__dirname, '../', podcast.audioUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Podcast.findByIdAndDelete(podcastId);

    res.status(200).json({ message: 'Podcast deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search podcasts by title or tags
// @route   GET /api/podcasts/search/query
// @access  Private
const searchPodcasts = async (req, res) => {
  try {
    const { query, tags } = req.query;

    let filter = { organization: req.organization };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
      filter.tags = { $in: tagsArray };
    }

    const podcasts = await Podcast.find(filter)
      .populate('author', 'fullName email department')
      .sort({ createdAt: -1 });

    res.status(200).json(podcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Transcribe podcast audio to text
// @route   POST /api/podcasts/:podcastId/transcribe
// @access  Private
const transcribePodcast = async (req, res) => {
  try {
    const { podcastId } = req.params;

    const podcast = await Podcast.findById(podcastId);

    if (!podcast) {
      return res.status(404).json({ message: 'Podcast not found' });
    }

    // Verify organization match
    if (podcast.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot access podcast from different organization' });
    }

    // Check if already transcribed successfully
    if (podcast.transcription && podcast.transcription.isTranscribed) {
      // If it "failed" previously (contains error message), allow retry
      const text = podcast.transcription.text;
      const isError = text.startsWith('[Transcription unavailable') || text.startsWith('[Transcription error') || text.startsWith('[Audio file not found]');

      if (!isError && !req.query.force && podcast.summary) {
        return res.status(200).json({
          message: 'Podcast already transcribed',
          transcription: podcast.transcription
        });
      }
    }

    // Transcribe the audio file (Includes Summary and Sentiment from AssemblyAI)
    const audioFilePath = path.join(__dirname, '../', podcast.audioUrl);

    let transcriptionResult;
    if (fs.existsSync(audioFilePath)) {
      // Transcribe local file
      transcriptionResult = await transcribeAudio(audioFilePath);
    } else {
      // Try transcribing from URL
      transcriptionResult = await transcribeAudioFromUrl(podcast.audioUrl);
    }

    // Save transcription to database
    podcast.transcription = {
      text: transcriptionResult.text,
      confidence: transcriptionResult.confidence,
      words: transcriptionResult.words || [],
      isTranscribed: true,
      transcribedAt: new Date()
    };

    // Save Summary and Heatmap directly from AssemblyAI result
    if (transcriptionResult.summary) {
      podcast.summary = transcriptionResult.summary;
    }

    if (transcriptionResult.heatmap) {
      podcast.heatmap = transcriptionResult.heatmap;
    }

    await podcast.save();
    const populatedPodcast = await Podcast.findById(podcastId)
      .populate('author', 'fullName email department');

    res.status(200).json({
      message: 'Podcast transcribed successfully',
      podcast: populatedPodcast
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserPodcasts = async (req, res) => {
  try {
    const { userId } = req.params;

    const query = {
      author: userId,
      organization: req.organization
    };

    const podcasts = await Podcast.find(query)
      .populate('author', 'fullName email department')
      .sort({ createdAt: -1 });

    res.status(200).json(podcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's podcasts
// @route   GET /api/podcasts/my
// @access  Private
const getMyPodcasts = async (req, res) => {
  try {
    const query = {
      author: req.user._id,
      organization: req.organization
    };

    const podcasts = await Podcast.find(query)
      .populate('author', 'fullName email department')
      .sort({ createdAt: -1 });

    res.status(200).json(podcasts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadPodcast,
  getPodcasts,
  getPodcast,
  updatePodcast,
  deletePodcast,
  searchPodcasts,
  transcribePodcast,
  getUserPodcasts,
  getMyPodcasts
};
