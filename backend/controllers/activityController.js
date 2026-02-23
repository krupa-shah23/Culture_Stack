const User = require('../models/User');
const Activity = require('../models/Activity');

// Helper to log an activity (internal use)
const logActivity = async (userId, orgId, type, text, targetId, targetModel) => {
  try {
    const activity = await Activity.create({
      user: userId,
      organization: orgId,
      type,
      text,
      targetId,
      targetModel
    });
    console.log('📝 [Activity] Logged:', text);
    return activity;
  } catch (error) {
    console.error('❌ [Activity] Failed to log:', error);
  }
};

// GET /api/activity
// Get recent activities for the user's organization
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ organization: req.organization })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('user', 'fullName');

    res.status(200).json(activities);
  } catch (error) {
    console.error('[getActivities] Error:', error);
    res.status(500).json({ message: 'Failed to fetch activities' });
  }
};

// GET /api/activity/unread
const getUnreadCount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('unreadActivityCount');
    return res.status(200).json({ count: user?.unreadActivityCount || 0 });
  } catch (error) {
    console.error('[getUnreadCount] Error:', error);
    return res.status(500).json({ message: 'Failed to read unread activity count' });
  }
};

// POST /api/activity/clear
const clearUnreadCount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.unreadActivityCount = 0;
    await user.save();
    return res.status(200).json({ success: true, count: 0 });
  } catch (error) {
    console.error('[clearUnreadCount] Error:', error);
    return res.status(500).json({ message: 'Failed to clear unread activity count' });
  }
};

module.exports = { getActivities, getUnreadCount, clearUnreadCount, logActivity };