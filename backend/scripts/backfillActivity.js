const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Activity = require('../models/Activity');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Podcast = require('../models/Podcast');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err.message);
        process.exit(1);
    }
};

const backfill = async () => {
    await connectDB();

    try {
        // 1. Clear existing generic "backfilled" activity (optional, but good for idempotency if we ran this before)
        // Actually, let's just add new ones if they don't exist.

        console.log('Backfilling Posts...');
        const posts = await Post.find().sort({ createdAt: -1 }).limit(10).populate('author');
        for (const post of posts) {
            const exists = await Activity.findOne({ targetId: post._id, type: 'post' });
            if (!exists && post.author) {
                await Activity.create({
                    user: post.author._id,
                    organization: post.organization,
                    type: 'post',
                    text: `${post.author.fullName} shared a new reflection: "${post.title}"`,
                    targetId: post._id,
                    targetModel: 'Post',
                    createdAt: post.createdAt // Maintain original timestamp
                });
                console.log(`+ Post activity: ${post.title}`);
            }
        }

        console.log('Backfilling Comments...');
        const comments = await Comment.find().sort({ createdAt: -1 }).limit(10).populate('author');
        for (const comment of comments) {
            const exists = await Activity.findOne({ targetId: comment._id, type: 'comment' });
            if (!exists && comment.author) {
                await Activity.create({
                    user: comment.author._id,
                    organization: comment.organization,
                    type: 'comment',
                    text: `${comment.author.fullName} commented on a post`,
                    targetId: comment._id,
                    targetModel: 'Comment',
                    createdAt: comment.createdAt
                });
                console.log(`+ Comment activity: ${comment._id}`);
            }
        }

        console.log('Backfilling Podcasts...');
        const podcasts = await Podcast.find().sort({ createdAt: -1 }).limit(5).populate('author');
        for (const podcast of podcasts) {
            const exists = await Activity.findOne({ targetId: podcast._id, type: 'podcast' });
            if (!exists && podcast.author) {
                await Activity.create({
                    user: podcast.author._id,
                    organization: podcast.organization,
                    type: 'podcast',
                    text: `${podcast.author.fullName} uploaded a new podcast: "${podcast.title}"`,
                    targetId: podcast._id,
                    targetModel: 'Podcast',
                    createdAt: podcast.createdAt
                });
                console.log(`+ Podcast activity: ${podcast.title}`);
            }
        }

        console.log('✅ Backfill complete!');
        process.exit(0);

    } catch (error) {
        console.error('Backfill failed:', error);
        process.exit(1);
    }
};

backfill();
