const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const path = require('path');
const { createServer } = require('http');
const { Server } = require('socket.io');
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
const voteRoutes = require('./routes/voteRoutes');

// Connect to Database
connectDB();

const app = express();
const port = process.env.PORT || 5000;

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-user", (userId) => {
    if (userId) {
      onlineUsers.set(userId, socket.id);
      socket.join(userId);
      // Emit to everyone that this user is online
      io.emit("user-online", userId);
      // Send the currently online users to the newly joined user
      socket.emit("online-users", Array.from(onlineUsers.keys()));
      console.log(`User ${userId} joined room`);
    }
  });

  socket.on("send-message", (message) => {
    const receiverId = message.receiver;
    if (receiverId) {
      io.to(receiverId).emit("receive-message", message);
    }
  });

  socket.on("message-delivered", ({ messageId, senderId }) => {
    // Notify the original sender that their message was delivered (received by client)
    if (senderId) {
      io.to(senderId).emit("message-status-update", { messageId, status: "delivered" });
    }
  });

  socket.on("message-read", ({ messageIds, senderId }) => {
    // Notify the original sender that their messages were read
    if (senderId) {
      io.to(senderId).emit("message-status-update", { messageIds, status: "read" });
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
    // Find user by socket id and remove them
    let disconnectedUserId = null;
    for (let [userId, sockId] of onlineUsers.entries()) {
      if (sockId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      io.emit("user-offline", disconnectedUserId);
    }
  });
});

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
app.use('/api/votes', voteRoutes);

// Chat routes (conversations & messages) — require authentication + org scope in the router
app.use('/api', chatRoutes);
app.use('/api/ai', aiRoutes);

// Error Handling Middleware for Multer or generic errors
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: 'File is too large. Max allowed size is 500MB.' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ message: `Upload error: ${err.message}` });
  }
  next(err);
});

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

httpServer.listen(port, () => {
  console.log(`Server and Socket.IO running on port ${port}`);
});
