const mongoose = require('mongoose');
const Post = require('./models/Post');
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

const inspectPosts = async () => {
  await connectDB();
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(5);
    console.log('--- Last 5 Posts ---');
    posts.forEach(p => {
      console.log(`ID: ${p._id}`);
      console.log(`Title: ${p.title}`);
      console.log(`Summary: "${p.summary}"`);
      console.log(`Content (start): "${p.content.substring(0, 50)}..."`);
      console.log('-------------------');
    });
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
};

inspectPosts();
