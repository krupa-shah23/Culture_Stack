const mongoose = require('mongoose');

const maskUri = (uri) => {
  try {
    // mask password if present in the URI
    return uri.replace(/([a-zA-Z]+:\/\/[^:]+:)([^@]+)(@.+)/, "$1***$3");
  } catch (e) {
    return uri;
  }
};

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  const maxRetries = parseInt(process.env.MONGODB_CONNECT_RETRIES || '5', 10);
  const baseDelay = 1000; // 1s

  if (!uri) {
    console.error('MONGODB_URI is not set. Please add it to your .env');
    process.exit(1);
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Connecting to MongoDB (${attempt}/${maxRetries}) — ${maskUri(uri)}`);
      const conn = await mongoose.connect(uri);

      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      const isLast = attempt === maxRetries;
      console.error(`MongoDB connect attempt ${attempt} failed: ${error.code || ''} ${error.message}`);

      if (isLast) {
        console.error('All MongoDB connection attempts failed. Exiting.');
        process.exit(1);
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await wait(delay);
    }
  }
};

module.exports = connectDB;