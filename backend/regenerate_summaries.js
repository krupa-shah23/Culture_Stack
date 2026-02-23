const mongoose = require('mongoose');
const Post = require('./models/Post');
const { analyzePost } = require('./services/aiService');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const regenerateSummaries = async () => {
  await connectDB();
  try {
    const posts = await Post.find({});
    console.log(`Found ${posts.length} posts to regenerate.`);

    for (const post of posts) {
      console.log(`Processing post ${post._id}...`);

      // Delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));

      const aiResult = await analyzePost(post.content);

      if (aiResult && aiResult.summary) {

        // STRICT: Enforce max 6 words
        let summary = aiResult.summary;
        const words = summary.split(' ');
        if (words.length > 6) {
          summary = words.slice(0, 6).join(' ') + '...';
        }

        let updateData = { summary: summary };

        // Also update other fields if they are missing/empty, but prioritize summary
        if (!post.aiFeedback || !post.aiFeedback.mentor) {
          updateData.aiFeedback = {
            mentor: aiResult.mentor,
            critic: aiResult.critic,
            strategist: aiResult.strategist,
            executionManager: aiResult.executionManager,
            riskEvaluator: aiResult.riskEvaluator,
            innovator: aiResult.innovator
          };
        }

        // Use updateOne to bypass validation
        await Post.updateOne({ _id: post._id }, { $set: updateData });

        console.log(`✅ Updated summary for ${post._id}: "${summary}"`);
      } else {
        console.log(`⚠️ No summary generated for ${post._id}`);
      }
    }
    console.log('Regeneration complete.');
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

regenerateSummaries();
