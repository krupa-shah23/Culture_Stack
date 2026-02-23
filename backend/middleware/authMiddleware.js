const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (!req.headers.authorization) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  if (!req.headers.authorization.startsWith('Bearer')) {
    return res.status(401).json({ message: 'Not authorized, invalid token format' });
  }

  try {
    // Get token from header
    token = req.headers.authorization.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from the token
    const user = await User.findById(decoded.id).select('-password');
    req.user = user;
    
    // Attach organization to request if user has one
    if (user && user.organization) {
      req.organization = user.organization;
    }

    next();
  } catch (error) {
    console.log(error);
    return res.status(401).json({ message: 'Not authorized' });
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = { protect };