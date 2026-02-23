const User = require('../models/User');
const Post = require('../models/Post');
const Podcast = require('../models/Podcast');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');

// GET /api/users/:id/profile
const getUserProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(`🔎 [getUserProfile] requester=${req.user?._id} target=${userId} org=${req.organization}`);

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.warn('[getUserProfile] invalid user id:', userId);
      return res.status(400).json({ message: 'Invalid user id' });
    }

    // ensure target user exists and is in same org
    const target = await User.findById(userId).select('-password');
    if (!target) {
      console.warn('[getUserProfile] target not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('[getUserProfile] target.organization=', String(target.organization), ' requester.org=', String(req.organization));
    if (String(target.organization) !== String(req.organization)) {
      console.warn('[getUserProfile] org mismatch — denying access');
      return res.status(403).json({ message: 'User not in your organization' });
    }

    // Basic user info
    const user = {
      _id: target._id,
      fullName: target.fullName,
      department: target.department,
      createdAt: target.createdAt,
      unreadActivityCount: target.unreadActivityCount || 0,
      defaultAnonymityLevel: target.defaultAnonymityLevel,
      visibility: target.visibility,
      allowAiFeedback: target.allowAiFeedback,
      allowAnonymousComments: target.allowAnonymousComments
    };

    // Stats: posts, podcasts, comments
    const orgId = req.organization;

    // Primary counts scoped to organization
    let [postsCount, podcastsCount, commentsCount] = await Promise.all([
      Post.countDocuments({ author: userId, organization: orgId }),
      Podcast.countDocuments({ author: userId, organization: orgId }),
      Comment.countDocuments({ author: userId, organization: orgId })
    ]);

    // If the target is the requesting user and org-scoped counts are zero,
    // fallback to counting by author only (handles legacy posts missing org).
    if (String(userId) === String(req.user._id) && postsCount === 0) {
      console.warn('[getUserProfile] org-scoped postsCount is 0 for current user — trying author-only fallback');
      const fallbackPosts = await Post.countDocuments({ author: userId });
      if (fallbackPosts > 0) {
        console.log('[getUserProfile] fallback found posts (no organization):', fallbackPosts);
        postsCount = fallbackPosts;
      }
    }

    if (String(userId) === String(req.user._id) && podcastsCount === 0) {
      const fallbackPodcasts = await Podcast.countDocuments({ author: userId });
      if (fallbackPodcasts > 0) {
        console.log('[getUserProfile] fallback found podcasts (no organization):', fallbackPodcasts);
        podcastsCount = fallbackPodcasts;
      }
    }

    // Reactions: total likes received across user's posts (org-scoped, with fallback)
    let reactionsAgg = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId), organization: new mongoose.Types.ObjectId(orgId) } },
      { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
      { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
    ]);
    let reactionsCount = (reactionsAgg[0] && reactionsAgg[0].totalLikes) || 0;
    if (reactionsCount === 0 && String(userId) === String(req.user._id)) {
      // try reactions across all posts by author (fallback)
      reactionsAgg = await Post.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId) } },
        { $project: { likesCount: { $size: { $ifNull: ["$likes", []] } } } },
        { $group: { _id: null, totalLikes: { $sum: "$likesCount" } } }
      ]);
      reactionsCount = (reactionsAgg[0] && reactionsAgg[0].totalLikes) || 0;
    }

    // First post date (if any) — prefer org-scoped, fallback to author-only
    let firstPost = await Post.findOne({ author: userId, organization: orgId }).sort({ createdAt: 1 }).select('createdAt title');
    if (!firstPost && String(userId) === String(req.user._id)) {
      firstPost = await Post.findOne({ author: userId }).sort({ createdAt: 1 }).select('createdAt title');
    }
    const firstPostDate = firstPost?.createdAt || null;

    // Top post (most liked) — prefer org-scoped, fallback to author-only
    let topPostAgg = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId), organization: new mongoose.Types.ObjectId(orgId) } },
      { $project: { title: 1, likesCount: { $size: { $ifNull: ["$likes", []] } }, createdAt: 1 } },
      { $sort: { likesCount: -1, createdAt: -1 } },
      { $limit: 1 }
    ]);
    let topPost = topPostAgg[0] || null;
    if (!topPost && String(userId) === String(req.user._id)) {
      topPostAgg = await Post.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId) } },
        { $project: { title: 1, likesCount: { $size: { $ifNull: ["$likes", []] } }, createdAt: 1 } },
        { $sort: { likesCount: -1, createdAt: -1 } },
        { $limit: 1 }
      ]);
      topPost = topPostAgg[0] || null;
    }

    // Top podcast (latest) — prefer org-scoped, fallback to author-only
    let topPodcast = await Podcast.findOne({ author: userId, organization: orgId }).sort({ createdAt: -1 }).select('title createdAt');
    if (!topPodcast && String(userId) === String(req.user._id)) {
      topPodcast = await Podcast.findOne({ author: userId }).sort({ createdAt: -1 }).select('title createdAt');
    }

    // AI theme: pick most frequent tag across user's posts (simple heuristic)
    let tagsAgg = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId), organization: new mongoose.Types.ObjectId(orgId) } },
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    // Fallback for tags if no org-scoped posts
    if ((!tagsAgg || tagsAgg.length === 0) && String(userId) === String(req.user._id)) {
      tagsAgg = await Post.aggregate([
        { $match: { author: new mongoose.Types.ObjectId(userId) } },
        { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 }
      ]);
    }

    const aiTheme = tagsAgg[0]?._id || null;

    // Simple personality summary derived from sentiment distribution
    const sentimentAgg = await Post.aggregate([
      { $match: { author: new mongoose.Types.ObjectId(userId), organization: new mongoose.Types.ObjectId(orgId), 'sentiment.label': { $exists: true } } },
      { $group: { _id: '$sentiment.label', count: { $sum: 1 } } }
    ]);

    let aiPersonalitySummary = null;
    if (sentimentAgg.length) {
      const topSent = sentimentAgg.sort((a, b) => b.count - a.count)[0]._id;
      aiPersonalitySummary = `Tone: ${topSent}. Frequently shares ${aiTheme || 'action-oriented'} reflections.`;
    }

    const stats = { postsCount, podcastsCount, commentsCount, reactionsCount };

    const reflectionJourney = {
      joinedOrg: target.createdAt,
      firstReflection: firstPostDate,
      topPostTitle: topPost?.title || null,
      topPodcastTitle: topPodcast?.title || null,
      aiTheme
    };

    // derive badges
    const badges = [];
    if (postsCount > 0) badges.push('Active Writer');
    if (podcastsCount > 0) badges.push('Podcast Contributor');
    if (reactionsCount > 20) badges.push('Influencer');

    return res.status(200).json({ user, stats, badges, reflectionJourney, aiPersonalitySummary });
  } catch (error) {
    console.error('❌ [getUserProfile] CRITICAL ERROR:', error);
    return res.status(500).json({ message: 'Failed to load profile: ' + error.message });
  }
};

module.exports = { getUserProfile };