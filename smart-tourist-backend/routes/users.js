const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json(user);
  } catch (err) {
    console.error('Error fetching user:', err);
    return res.status(500).json({ message: 'Error fetching user', error: err.message });
  }
});

// Update user location
router.post('/update-location', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        location: { lat, lng, updatedAt: new Date() }
      },
      { new: true }
    );
    res.json({ message: 'Location updated ✓', location: user.location });
  } catch (err) {
    console.error('Error updating location:', err);
    return res.status(500).json({ message: 'Error updating location', error: err.message });
  }
});

module.exports = router;
