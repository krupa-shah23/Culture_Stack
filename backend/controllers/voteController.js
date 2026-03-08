const Post = require('../models/Post');
const Vote = require('../models/Vote');

// @desc    Handle voting on a post (upvote, downvote, remove)
// @route   POST /api/votes
// @access  Private
const handleVote = async (req, res) => {
    try {
        const { postId, voteType } = req.body; // 'upvote' | 'downvote'
        const userId = req.user._id;

        if (!['upvote', 'downvote'].includes(voteType)) {
            return res.status(400).json({ message: 'Invalid voteType' });
        }

        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: 'Post not found' });

        // Verify organization matching if applicable
        if (post.organization && req.organization && post.organization.toString() !== req.organization.toString()) {
            return res.status(403).json({ message: 'Cannot vote on post from different organization' });
        }

        // Prevent self-voting
        if (post.author.toString() === userId.toString()) {
            return res.status(403).json({ message: 'Cannot vote on your own post' });
        }

        const existingVote = await Vote.findOne({ postId, userId });

        // Throttle rapid toggles on same post
        if (existingVote && existingVote.updatedAt && (Date.now() - new Date(existingVote.updatedAt).getTime() < 1500)) {
            return res.status(429).json({ message: 'Too many vote changes, try again shortly' });
        }

        // REMOVE vote (Toggle off)
        if (existingVote && existingVote.voteType === voteType) {
            const dec = voteType === 'upvote' ? { upvoteCount: -1 } : { downvoteCount: -1 };
            await existingVote.deleteOne();

            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: dec },
                { new: true }
            );
            // Recalc cached score
            updatedPost.score = (updatedPost.upvoteCount || 0) - (updatedPost.downvoteCount || 0);
            await updatedPost.save();

            return res.status(200).json({
                userVote: null,
                upvoteCount: updatedPost.upvoteCount,
                downvoteCount: updatedPost.downvoteCount,
                score: updatedPost.score
            });
        }

        // SWITCH vote (upvote -> downvote or vice versa)
        if (existingVote && existingVote.voteType !== voteType) {
            const inc = voteType === 'upvote' ? { upvoteCount: 1, downvoteCount: -1 } : { upvoteCount: -1, downvoteCount: 1 };

            existingVote.voteType = voteType;
            await existingVote.save();

            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: inc },
                { new: true }
            );

            updatedPost.score = (updatedPost.upvoteCount || 0) - (updatedPost.downvoteCount || 0);
            await updatedPost.save();

            return res.status(200).json({
                userVote: voteType,
                upvoteCount: updatedPost.upvoteCount,
                downvoteCount: updatedPost.downvoteCount,
                score: updatedPost.score
            });
        }

        // CREATE new vote
        if (!existingVote) {
            await Vote.create({ postId, userId, voteType });
            const inc = voteType === 'upvote' ? { upvoteCount: 1 } : { downvoteCount: 1 };

            const updatedPost = await Post.findByIdAndUpdate(
                postId,
                { $inc: inc },
                { new: true }
            );

            updatedPost.score = (updatedPost.upvoteCount || 0) - (updatedPost.downvoteCount || 0);
            await updatedPost.save();

            return res.status(200).json({
                userVote: voteType,
                upvoteCount: updatedPost.upvoteCount,
                downvoteCount: updatedPost.downvoteCount,
                score: updatedPost.score
            });
        }

    } catch (error) {
        console.error('handleVote error', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get the current user's vote for a post
// @route   GET /api/votes/:postId
// @access  Private
const getUserVote = async (req, res) => {
    try {
        const { postId } = req.params;
        const userId = req.user._id;

        const existingVote = await Vote.findOne({ postId, userId });

        if (existingVote) {
            return res.status(200).json({ voteType: existingVote.voteType });
        } else {
            return res.status(200).json({ voteType: null });
        }
    } catch (error) {
        console.error('getUserVote error', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    handleVote,
    getUserVote
};
