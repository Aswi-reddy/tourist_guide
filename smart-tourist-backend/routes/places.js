const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  if (distance < 1) {
    return `${Math.round(distance * 1000)} m`;
  }
  return `${distance.toFixed(1)} km`;
}

// Get nearby tourist places (using FREE OpenStreetMap Overpass API)
router.post('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    console.log(`🎯 Searching FAMOUS TOURIST PLACES across entire Punjab state...`);
    
    // List of FAMOUS tourist places in Punjab to search for
    const famousPlaces = [
      'Golden Temple', 'Harmandir Sahib', 'Jallianwala Bagh', 'Wagah Border',
      'Partition Museum', 'Gobindgarh Fort', 'Rock Garden Chandigarh',
      'Sukhna Lake', 'Qila Mubarak', 'Anandpur Sahib', 'Virasat-e-Khalsa',
      'Durgiana Temple', 'Maharaja Ranjit Singh Museum', 'Sheesh Mahal Patiala',
      'Qila Androon', 'Jalianwala Bagh Memorial', 'Ram Bagh Palace',
      'Pul Kanjari', 'Harike Wetland', 'Kapurthala Palace'
    ];
    
    const places = [];
    
    // Search for each famous place using Nominatim API
    for (const placeName of famousPlaces) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeName + ', Punjab, India')}&format=json&limit=1&addressdetails=1`;
        
        const response = await axios.get(nominatimUrl, {
          headers: { 'User-Agent': 'SmartTouristApp/1.0' },
          timeout: 5000
        });
        
        if (response.data && response.data.length > 0) {
          const place = response.data[0];
          const placeLat = parseFloat(place.lat);
          const placeLng = parseFloat(place.lon);
          
          places.push({
            name: place.display_name.split(',')[0] || placeName,
            type: 'attraction',
            distance: calculateDistance(lat, lng, placeLat, placeLng),
            rating: (4.5 + Math.random() * 0.5).toFixed(1),
            lat: placeLat,
            lng: placeLng,
            address: place.display_name || 'Punjab, India',
            isOpen: true,
            description: `Famous tourist attraction in Punjab`,
            source: 'OpenStreetMap',
            isFamous: true
          });
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.log(`⚠️ Could not find: ${placeName}`);
      }
    }

    if (places.length > 0) {
      // Sort by distance (nearest first)
      places.sort((a, b) => {
        const distA = parseFloat(a.distance);
        const distB = parseFloat(b.distance);
        return distA - distB;
      });
      
      console.log(`✅ SUCCESS! Found ${places.length} FAMOUS TOURIST PLACES in Punjab`);
      return res.json({ places });
    }

    console.log(`⚠️ No famous tourist places found`);
    return res.json({ places: [] });
  } catch (err) {
    console.error('❌ Error fetching tourist places:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get nearby SAFE ZONES - HOTELS AND ACCOMMODATIONS ONLY
router.post('/safe-zones', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 20000 } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
    console.log(`🏨 Searching HOTELS & ACCOMMODATIONS near (${lat}, ${lng}) within ${radius}m...`);
    
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const radiusInMeters = radius;
    
    // Query for HOTELS, GUEST HOUSES, LODGES ONLY
    const query = `
      [out:json][timeout:25];
      (
        node["tourism"="hotel"](around:${radiusInMeters},${lat},${lng});
        way["tourism"="hotel"](around:${radiusInMeters},${lat},${lng});
        relation["tourism"="hotel"](around:${radiusInMeters},${lat},${lng});
        node["tourism"="guest_house"](around:${radiusInMeters},${lat},${lng});
        way["tourism"="guest_house"](around:${radiusInMeters},${lat},${lng});
        node["tourism"="motel"](around:${radiusInMeters},${lat},${lng});
        node["tourism"="hostel"](around:${radiusInMeters},${lat},${lng});
        way["tourism"="hostel"](around:${radiusInMeters},${lat},${lng});
        node["building"="hotel"](around:${radiusInMeters},${lat},${lng});
        way["building"="hotel"](around:${radiusInMeters},${lat},${lng});
      );
      out body center 200;
    `;

    const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 20000
    });

    if (response.data && response.data.elements && response.data.elements.length > 0) {
      const hotels = response.data.elements
        .filter(element => element.tags)
        .map(element => {
          const placeLat = element.lat || element.center?.lat;
          const placeLng = element.lon || element.center?.lon;
          
          const hotelType = element.tags.tourism || element.tags.building || 'hotel';
          const hotelName = element.tags.name || 
                           element.tags['name:en'] ||
                           `${hotelType.replace(/_/g, ' ').toUpperCase()}`;
          
          return {
            name: hotelName,
            type: hotelType,
            distance: calculateDistance(lat, lng, placeLat, placeLng),
            rating: (3.5 + Math.random() * 1.5).toFixed(1), // Hotels 3.5-5.0 stars
            lat: placeLat,
            lng: placeLng,
            address: [
              element.tags['addr:street'],
              element.tags['addr:city'] || element.tags['addr:town'],
              element.tags['addr:state'],
              element.tags['addr:postcode']
            ].filter(Boolean).join(', ') || 'Punjab, India',
            isOpen: true,
            description: `${hotelType.replace(/_/g, ' ')} - Safe accommodation`,
            source: 'OpenStreetMap',
            phone: element.tags.phone || element.tags['contact:phone'] || element.tags['telephone'] || null,
            website: element.tags.website || element.tags['contact:website'] || null,
            stars: element.tags.stars || null,
            rooms: element.tags.rooms || null,
            isSafeZone: true,
            isHotel: true
          };
        })
        .filter(place => place.lat && place.lng)
        .slice(0, 100);

      console.log(`✅ SUCCESS! Found ${hotels.length} HOTELS from OpenStreetMap`);
      return res.json({ places: hotels });
    }

    console.log(`⚠️ No hotels found within ${radius}m`);
    return res.json({ places: [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get weather for location
router.post('/weather', auth, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }
    
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
