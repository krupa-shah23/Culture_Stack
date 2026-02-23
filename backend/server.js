const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');

// show environment hints during development
console.log('NODE_ENV=', process.env.NODE_ENV || '<not set>');
console.log('JWT_SECRET set?', !!process.env.JWT_SECRET);
const postRoutes = require('./routes/postRoutes');
const refineRoutes = require('./routes/refineRoutes');
const commentRoutes = require('./routes/commentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const organizationRoutes = require('./routes/organizationRoutes');
const podcastRoutes = require('./routes/podcastRoutes');
const activityRoutes = require('./routes/activityRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const aiRoutes = require('./routes/aiRoutes');

// Connect to Database
connectDB();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/refine', refineRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/podcasts', podcastRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/users', userRoutes);

// Chat routes (conversations & messages) — require authentication + org scope in the router
app.use('/api', chatRoutes);
app.use('/api/ai', aiRoutes);

app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/health', async (req, res) => {
  try {
    // Simple health check - try to count posts
    const Post = require('./models/Post');
    const postCount = await Post.countDocuments();
    res.json({
      status: 'ok',
      message: 'Backend is running',
      database: 'connected',
      totalPosts: postCount
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
