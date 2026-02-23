const Comment = require('../models/Comment');
const Post = require('../models/Post');
const CommentReaction = require('../models/CommentReaction');

// @desc    Create a new comment
// @route   POST /api/comments
// @access  Private
const createComment = async (req, res) => {
  try {
    const { content, postId } = req.body;

    if (!content || !postId) {
      return res.status(400).json({ message: 'Content and post ID are required' });
    }

    // Verify post exists and belongs to user's organization
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot comment on post from different organization' });
    }

    const comment = new Comment({
      content,
      author: req.user._id,
      post: postId,
      organization: req.organization
    });

    const savedComment = await comment.save();
    const populatedComment = await Comment.findById(savedComment._id)
      .populate('author', 'fullName department email');

    // Log activity
    const { logActivity } = require('./activityController');
    await logActivity(
      req.user._id,
      req.organization,
      'comment',
      `${req.user.fullName} commented on a post`,
      savedComment._id,
      'Comment'
    );

    res.status(201).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Private
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Verify post exists and belongs to user's organization
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (post.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot access comments from different organization' });
    }

    const comments = await Comment.find({ post: postId, organization: req.organization })
      .populate('author', 'fullName department email')
      .sort({ createdAt: -1 });

    // Attach current user's reaction for each comment in one query
    const commentIds = comments.map(c => c._id);
    const userReactions = await CommentReaction.find({ commentId: { $in: commentIds }, userId: req.user._id }).lean();
    const reactionMap = userReactions.reduce((acc, r) => { acc[String(r.commentId)] = r.reactionType; return acc; }, {});

    const enriched = comments.map(c => {
      const obj = c.toObject();
      obj.likeCount = obj.likeCount || 0;
      obj.dislikeCount = obj.dislikeCount || 0;
      obj.currentUserReaction = reactionMap[String(c._id)] || null; // 'like' | 'dislike' | null
      return obj;
    });

    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a comment
// @route   PUT /api/comments/:commentId
// @access  Private
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Verify user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only edit your own comments' });
    }

    // Verify organization match
    if (comment.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot edit comment from different organization' });
    }

    comment.content = content;
    const updatedComment = await comment.save();
    const populatedComment = await Comment.findById(updatedComment._id)
      .populate('author', 'fullName department email');

    res.status(200).json(populatedComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a comment
// @route   DELETE /api/comments/:commentId
// @access  Private
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Verify user is the author
    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Can only delete your own comments' });
    }

    // Verify organization match
    if (comment.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot delete comment from different organization' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    React to a comment (like / dislike / remove)
// @route   POST /api/comments/:commentId/reaction
// @access  Private
const reactToComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { reactionType } = req.body; // 'like' | 'dislike' | 'remove'
    const userId = req.user._id;

    if (!['like', 'dislike', 'remove'].includes(reactionType)) {
      return res.status(400).json({ message: 'Invalid reactionType' });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    // Verify organization/post access
    const post = await Post.findById(comment.post);
    if (!post || post.organization.toString() !== req.organization.toString()) {
      return res.status(403).json({ message: 'Cannot react to comment in different organization' });
    }

    // Prevent self-reaction (consistent with post voting rules)
    if (comment.author.toString() === userId.toString()) {
      return res.status(403).json({ message: 'Cannot react to your own comment' });
    }

    const existing = await CommentReaction.findOne({ commentId, userId });

    // Short debounce: prevent rapid toggling
    if (existing && existing.updatedAt && (Date.now() - new Date(existing.updatedAt).getTime() < 800)) {
      return res.status(429).json({ message: 'Too many reaction changes, try again shortly' });
    }

    // REMOVE
    if (reactionType === 'remove') {
      if (!existing) {
        return res.status(200).json({ userReaction: null, likeCount: comment.likeCount || 0, dislikeCount: comment.dislikeCount || 0 });
      }

      const dec = existing.reactionType === 'like' ? { likeCount: -1 } : { dislikeCount: -1 };
      await existing.remove();
      const updated = await Comment.findByIdAndUpdate(commentId, { $inc: dec }, { new: true });
      return res.status(200).json({ userReaction: null, likeCount: updated.likeCount, dislikeCount: updated.dislikeCount });
    }

    // TOGGLE or SWITCH
    if (existing) {
      if (existing.reactionType === reactionType) {
        // same => remove
        const dec = reactionType === 'like' ? { likeCount: -1 } : { dislikeCount: -1 };
        await existing.remove();
        const updated = await Comment.findByIdAndUpdate(commentId, { $inc: dec }, { new: true });
        return res.status(200).json({ userReaction: null, likeCount: updated.likeCount, dislikeCount: updated.dislikeCount });
      }

      // switch reaction
      const inc = reactionType === 'like' ? { likeCount: 1, dislikeCount: -1 } : { likeCount: -1, dislikeCount: 1 };
      existing.reactionType = reactionType;
      await existing.save();
      const updated = await Comment.findByIdAndUpdate(commentId, { $inc: inc }, { new: true });
      return res.status(200).json({ userReaction: reactionType, likeCount: updated.likeCount, dislikeCount: updated.dislikeCount });
    }

    // create new reaction
    await CommentReaction.create({ commentId, userId, reactionType });
    const inc = reactionType === 'like' ? { likeCount: 1 } : { dislikeCount: 1 };
    const updated = await Comment.findByIdAndUpdate(commentId, { $inc: inc }, { new: true });
    return res.status(200).json({ userReaction: reactionType, likeCount: updated.likeCount, dislikeCount: updated.dislikeCount });
  } catch (error) {
    console.error('reactToComment error', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createComment,
  getComments,
  updateComment,
  deleteComment,
  reactToComment
};