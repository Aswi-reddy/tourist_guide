const mongoose = require('mongoose');

const IncidentSchema = new mongoose.Schema({
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['accident', 'theft', 'medical', 'assault', 'harassment', 'lost', 'other']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical']
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      default: 'Point'
    },
    coordinates: [Number], // [longitude, latitude]
    address: String
  },
  status: {
    type: String,
    default: 'pending',
    enum: ['pending', 'acknowledged', 'resolved']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

IncidentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Incident', IncidentSchema);
