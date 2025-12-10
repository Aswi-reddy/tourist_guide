const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Get nearby tourist places (using Google Places API)
router.post('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 5000, type = 'tourist_attraction' } = req.body;
    
    // In production, call Google Places API here
    // For now, return mock data with realistic places from Punjab/North India
    // Assuming user might be near LPU (Lovely Professional University) area
    
    const places = [
      {
        name: 'Golden Temple, Amritsar',
        type: 'religious_site',
        distance: '3.2 km', // Will be calculated accurately on frontend
        rating: 4.9,
        lat: lat + 0.029, // ~3.2km north
        lng: lng + 0.012,
        address: 'Golden Temple Road, Atta Mandi, Amritsar, Punjab 143006',
        isOpen: true
      },
      {
        name: 'Jallianwala Bagh',
        type: 'historical_place',
        distance: '2.8 km',
        rating: 4.7,
        lat: lat + 0.025,
        lng: lng + 0.011,
        address: 'Golden Temple Road, Jallan Wala Bagh, Amritsar, Punjab 143001',
        isOpen: true
      },
      {
        name: 'Wagah Border',
        type: 'tourist_attraction',
        distance: '28 km',
        rating: 4.6,
        lat: lat + 0.252,
        lng: lng + 0.1,
        address: 'Attari, Amritsar, Punjab 143001',
        isOpen: true
      },
      {
        name: 'Rock Garden, Chandigarh',
        type: 'park',
        distance: '120 km',
        rating: 4.5,
        lat: lat - 1.08,
        lng: lng - 0.45,
        address: 'Sector 1, Chandigarh, 160001',
        isOpen: true
      },
      {
        name: 'Sukhna Lake, Chandigarh',
        type: 'lake',
        distance: '125 km',
        rating: 4.6,
        lat: lat - 1.125,
        lng: lng - 0.46,
        address: 'Sector 1, Chandigarh, 160001',
        isOpen: true
      },
      {
        name: 'Partition Museum',
        type: 'museum',
        distance: '3.5 km',
        rating: 4.7,
        lat: lat + 0.0315,
        lng: lng + 0.013,
        address: 'Town Hall, Amritsar, Punjab 143001',
        isOpen: true
      },
      {
        name: 'Gobindgarh Fort',
        type: 'fort',
        distance: '3.1 km',
        rating: 4.4,
        lat: lat + 0.028,
        lng: lng + 0.0115,
        address: 'Opposite Khalsa College, Amritsar, Punjab 143001',
        isOpen: true
      },
      {
        name: 'Maharaja Ranjit Singh Museum',
        type: 'museum',
        distance: '3.4 km',
        rating: 4.5,
        lat: lat + 0.0306,
        lng: lng + 0.0125,
        address: 'Ram Bagh, Amritsar, Punjab 143001',
        isOpen: true
      },
      {
        name: 'Durgiana Temple',
        type: 'religious_site',
        distance: '4.2 km',
        rating: 4.6,
        lat: lat + 0.038,
        lng: lng + 0.015,
        address: 'Durgiana Temple Road, Amritsar, Punjab 143001',
        isOpen: true
      },
      {
        name: 'Akal Takht',
        type: 'religious_site',
        distance: '3.3 km',
        rating: 4.8,
        lat: lat + 0.0297,
        lng: lng + 0.0122,
        address: 'Golden Temple Complex, Amritsar, Punjab 143006',
        isOpen: true
      }
    ];
    
    res.json({ places });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weather for location
router.post('/weather', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    // Mock weather data (integrate OpenWeatherMap API in production)
    const weather = {
      temperature: '28°C',
      condition: 'Sunny',
      humidity: '65%',
      windSpeed: '12 km/h',
      description: 'Clear sky with light breeze',
      icon: '☀️',
      forecast: [
        { day: 'Today', temp: '28°C', condition: 'Sunny', icon: '☀️' },
        { day: 'Tomorrow', temp: '27°C', condition: 'Partly Cloudy', icon: '⛅' },
        { day: 'Wednesday', temp: '26°C', condition: 'Cloudy', icon: '☁️' }
      ]
    };
    
    res.json({ weather });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
