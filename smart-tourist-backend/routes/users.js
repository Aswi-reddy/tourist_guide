const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

// Update user location
router.post('/update-location', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ message: 'Latitude and longitude required' });
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      { location: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );
    
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Location updated ✓', location: user.location });
  } catch (err) {
    return res.status(500).json({ message: 'Error updating location', error: err.message });
  }
});

module.exports = router;
