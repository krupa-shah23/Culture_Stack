const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');
const mongoose = require('mongoose');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { fullName, email, password, department } = req.body;

  if (!fullName || !email || !password || !department) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  try {
    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Determine organization name: use provided name or fallback to email domain
    const emailDomain = email.split('@')[1];
    const orgName = req.body.organizationName || emailDomain;

    // Find organization by name
    let organization = await Organization.findOne({ name: orgName });

    // If no organization exists, create one
    if (!organization) {
      organization = await Organization.create({
        name: orgName,
        description: `Organization for ${orgName}`,
        createdBy: new mongoose.Types.ObjectId(), // Placeholder, will update after user creation
        members: []
      });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      department,
      organization: organization._id
    });

    // Update organization with new member and set createdBy if it was a placeholder
    organization.members.push(user._id);
    if (!organization.createdBy || organization.members.length === 1) {
      organization.createdBy = user._id;
    }
    await organization.save();

    if (user) {
      res.status(201).json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        organization: organization._id,
        token: generateToken(user._id)
      });
    }
  } catch (error) {
    console.error(error);
    const publicMessage = 'Invalid user data';
    const detail = process.env.NODE_ENV === 'production' ? undefined : (error.message || error.toString());
    res.status(400).json({ message: publicMessage, error: detail });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password, organizationName } = req.body;

  try {
    const user = await User.findOne({ email }).populate('organization');

    if (user && (await user.matchPassword(password))) {

      // Validate organization name if provided
      if (organizationName) {
        if (!user.organization) {
          return res.status(401).json({ message: 'Access denied. You are not linked to any organization.' });
        }
        if (user.organization.name !== organizationName) {
          return res.status(401).json({ message: `Access denied. You do not belong to organization '${organizationName}'.` });
        }
      }

      res.json({
        _id: user.id,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        organization: user.organization ? user.organization._id : null,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  res.status(200).json(req.user);
};

module.exports = {
  registerUser,
  loginUser,
  getMe
};