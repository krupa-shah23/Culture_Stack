const Organization = require('../models/Organization');
const User = require('../models/User');

// @desc    Create a new organization
// @route   POST /api/organizations
// @access  Private
const createOrganization = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Organization name is required' });
    }

    const org = new Organization({
      name,
      description,
      createdBy: req.user._id,
      members: [req.user._id]
    });

    const savedOrg = await org.save();

    // Update user to be part of this organization
    await User.findByIdAndUpdate(req.user._id, { organization: savedOrg._id });

    const populatedOrg = await Organization.findById(savedOrg._id)
      .populate('members', 'fullName email department');

    res.status(201).json(populatedOrg);
  } catch (error) {
    console.error('Create Org Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's organization
// @route   GET /api/organizations/my-org
// @access  Private
const getMyOrganization = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('organization');

    if (!user.organization) {
      return res.status(404).json({ message: 'User is not part of any organization' });
    }

    const org = await Organization.findById(user.organization._id)
      .populate('members', 'fullName email department')
      .populate('createdBy', 'fullName email');

    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add member to organization
// @route   POST /api/organizations/:orgId/members
// @access  Private
const addMember = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const org = await Organization.findById(orgId);
    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Verify user is org creator
    if (org.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only organization creator can add members' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (org.members.includes(user._id)) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    org.members.push(user._id);
    await org.save();

    await User.findByIdAndUpdate(user._id, { organization: orgId });

    const populatedOrg = await Organization.findById(orgId)
      .populate('members', 'fullName email department');

    res.status(200).json(populatedOrg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get organizations by ID
// @route   GET /api/organizations/:orgId
// @access  Private
const getOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;

    const org = await Organization.findById(orgId)
      .populate('members', 'fullName email department')
      .populate('createdBy', 'fullName email');

    if (!org) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    res.status(200).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrganization,
  getMyOrganization,
  addMember,
  getOrganization
};
