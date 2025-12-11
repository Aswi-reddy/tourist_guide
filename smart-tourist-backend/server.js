const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(cors());

app.get('/health', (req, res) => {
  res.json({ status: 'running', time: new Date() });
});

// Connect MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✓ MongoDB connected'))
  .catch(err => console.log('✗ MongoDB error:', err.message));

// Import routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/places', require('./routes/places'));

// Socket.io - Real-time updates
io.on('connection', (socket) => {
  socket.on('location-update', (data) => {
    io.emit('user-location', {
      userId: data.userId,
      lat: data.lat,
      lng: data.lng
    });
  });

  socket.on('emergency-sos', (data) => {
    io.emit('sos-alert', {
      userId: data.userId,
      userName: data.userName,
      lat: data.lat,
      lng: data.lng,
      timestamp: Date.now(),
      message: 'EMERGENCY! Someone needs help nearby!'
    });
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
});
