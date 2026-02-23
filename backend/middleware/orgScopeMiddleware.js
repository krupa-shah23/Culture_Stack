const User = require('../models/User');

const ensureOrgMember = async (req, res, next) => {
  try {
    console.log('🔍 [OrgScope] Checking org membership for user:', req.user?._id);
    
    // Get user from auth middleware
    const user = await User.findById(req.user._id);
    
    if (!user) {
      console.error('❌ [OrgScope] User not found in database:', req.user._id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.organization) {
      console.warn('⚠️ [OrgScope] User has no organization:', req.user._id);
      return res.status(403).json({ message: 'User is not part of any organization' });
    }

    // Attach organization to request
    req.organization = user.organization;
    console.log('✅ [OrgScope] Organization attached:', req.organization);

    next();
  } catch (error) {
    console.error('❌ [OrgScope] Error:', error.message);
    res.status(500).json({ message: 'Error checking organization membership: ' + error.message });
  }
};

module.exports = { ensureOrgMember };