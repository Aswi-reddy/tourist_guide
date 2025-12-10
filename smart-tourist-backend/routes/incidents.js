const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');

// Report incident
router.post('/report', auth, async (req, res) => {
  try {
    const { type, severity, title, description, latitude, longitude, address } = req.body;
    
    const incident = new Incident({
      reportedBy: req.user.id,
      type,
      severity,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
        address
      }
    });

    await incident.save();
    res.json({ message: 'Incident reported successfully', incident });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all incidents
router.get('/', auth, async (req, res) => {
  try {
    const incidents = await Incident.find()
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get nearby incidents
router.get('/nearby', auth, async (req, res) => {
  try {
    const { latitude, longitude, radius = 5000 } = req.query; // radius in meters, default 5km
    
    const incidents = await Incident.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseInt(radius)
        }
      }
    })
    .populate('reportedBy', 'name email')
    .sort({ createdAt: -1 })
    .limit(20);
    
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get incident by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id)
      .populate('reportedBy', 'name email');
    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
