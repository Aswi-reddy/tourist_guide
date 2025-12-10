import React, { useState, useEffect } from 'react';
import { incidentsAPI, placesAPI } from '../services/api';
import ExactLocationMap from '../components/ExactLocationMap';
import io from 'socket.io-client';
import './Dashboard-new.css';

const socket = io('http://localhost:5000');

function Dashboard({ onLogout }) {
  const [incidents, setIncidents] = useState([]);
  const [myIncidents, setMyIncidents] = useState([]);
  const [nearbyIncidents, setNearbyIncidents] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [aiInput, setAiInput] = useState('');
  const [weather, setWeather] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationAccuracy, setLocationAccuracy] = useState(null);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [showPlaces, setShowPlaces] = useState(false);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [sosAlertData, setSOSAlertData] = useState(null);
  const [showSOSAlert, setShowSOSAlert] = useState(false);
  const [locationInitialized, setLocationInitialized] = useState(false);
  const [form, setForm] = useState({
    type: 'accident',
    severity: 'medium',
    title: '',
    description: '',
    address: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-menu-container')) {
        setShowProfileMenu(false);
      }
    };
    
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  useEffect(() => {
    fetchIncidents();
    getWeatherInfo();
    startLocationTracking();
    
    // Socket.io - Listen for SOS alerts
    socket.on('sos-alert', (data) => {
      if (!userLocation) return;
      
      // Don't show alert to the person who sent it
      if (data.userId === user.id) return;
      
      const distance = calculateDistance(userLocation.lat, userLocation.lng, data.lat, data.lng);
      
      // Alert nearby users within 5km
      if (distance < 5000) {
        const distanceText = formatDistance(distance);
        
        // Show prominent alert popup
        showSOSAlertPopup(data.userName, distanceText, data.lat, data.lng);
        
        // Add notification
        addNotification(`🆘 EMERGENCY! ${data.userName} needs help - ${distanceText} away!`, 'error');
        
        // Voice alert
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`Emergency alert! ${data.userName} needs help, ${distanceText} away!`);
          utterance.rate = 1.2;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;
          window.speechSynthesis.speak(utterance);
        }
        
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🆘 Emergency Alert', {
            body: `${data.userName} needs help - ${distanceText} away!`,
            icon: '/emergency-icon.png',
            requireInteraction: true,
            tag: 'sos-alert',
            vibrate: [200, 100, 200]
          });
        }
      }
    });

    // Listen for nearby user updates
    socket.on('user-location', (data) => {
      if (data.userId !== user.id && userLocation) {
        const distance = calculateDistance(userLocation.lat, userLocation.lng, data.lat, data.lng);
        if (distance < 5000) {
          setNearbyUsers(prev => {
            const existing = prev.find(u => u.userId === data.userId);
            if (existing) {
              return prev.map(u => u.userId === data.userId ? { ...data, distance } : u);
            }
            return [...prev, { ...data, distance }];
          });
        }
      }
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socket.off('sos-alert');
      socket.off('user-location');
    };
  }, [userLocation]);

  const startLocationTracking = () => {
    if (navigator.geolocation) {
      // Get initial high-accuracy position
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationAccuracy(accuracy);
          
          // Only show notification on first location lock
          if (!locationInitialized) {
            addNotification(`📍 Location locked! Accuracy: ${Math.round(accuracy)}m`, 'success');
            setLocationInitialized(true);
          }
          
          fetchNearbyIncidents();
          socket.emit('location-update', { userId: user.id, userName: user.name, lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Location error:', error);
          if (!locationInitialized) {
            addNotification('❌ Location access denied. Enable GPS for full features.', 'error');
          }
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 0 
        }
      );

      // Continuous tracking with high accuracy
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          setLocationAccuracy(accuracy);
          fetchNearbyIncidents();
          socket.emit('location-update', { userId: user.id, userName: user.name, lat: latitude, lng: longitude });
        },
        (error) => console.error('Location tracking error:', error),
        { 
          enableHighAccuracy: true, 
          timeout: 5000, 
          maximumAge: 1000,
          distanceFilter: 10 // Update only when moved 10+ meters
        }
      );
    } else {
      addNotification('❌ Geolocation not supported by your browser', 'error');
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  };

  const estimateTravelTime = (distanceInMeters) => {
    // Average travel speed by car: 50 km/h in city
    const speedKmh = 50;
    const distanceKm = distanceInMeters / 1000;
    const hours = distanceKm / speedKmh;
    const minutes = Math.round(hours * 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await incidentsAPI.getAll();
      const allIncidents = Array.isArray(response.data) ? response.data : [];
      setIncidents(allIncidents);
      const mine = allIncidents.filter(inc => inc.reportedBy?._id === user.id || inc.reportedBy?.id === user.id);
      setMyIncidents(mine);
      if (userLocation) fetchNearbyIncidents();
    } catch (err) {
      console.error('Error:', err);
      setIncidents([]);
      setMyIncidents([]);
    }
  };

  const fetchNearbyIncidents = async () => {
    if (!userLocation) return;
    try {
      const response = await incidentsAPI.getNearby(userLocation.lat, userLocation.lng, 5000);
      setNearbyIncidents(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleReportIncident = async (e) => {
    e.preventDefault();
    try {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        await incidentsAPI.report(form.type, form.severity, form.title, form.description, latitude, longitude, form.address);
        addNotification('✓ Incident reported!', 'success');
        setShowReportForm(false);
        setForm({ type: 'accident', severity: 'medium', title: '', description: '', address: '' });
        fetchIncidents();
      });
    } catch (err) {
      addNotification('❌ Failed to report', 'error');
    }
  };

  const addNotification = (message, type = 'info') => {
    // Check if this exact notification already exists to prevent duplicates
    const exists = notifications.some(n => n.message === message && Date.now() - n.timestamp < 1000);
    if (exists) return;
    
    const newNotif = { id: Date.now(), message, type, timestamp: Date.now() };
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== newNotif.id)), 5000);
  };

  const getWeatherInfo = () => {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        const response = await placesAPI.getWeather(latitude, longitude);
        setWeather(response.data.weather);
      } catch (err) {
        setWeather({ temp: '28°C', condition: 'Sunny', humidity: '65%', icon: '☀️' });
      }
    });
  };

  const fetchNearbyPlaces = async () => {
    if (!userLocation) {
      addNotification('🔍 Getting your location... Please wait.', 'info');
      // Try to get location first
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          await loadNearbyPlaces(latitude, longitude);
        },
        (error) => {
          addNotification('❌ Location access denied. Enable GPS to find places.', 'error');
          console.error('Location error:', error);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
      return;
    }
    await loadNearbyPlaces(userLocation.lat, userLocation.lng);
  };

  const loadNearbyPlaces = async (lat, lng) => {
    setPlacesLoading(true);
    try {
      addNotification('🔍 Searching for nearby tourist places...', 'info');
      
      const response = await placesAPI.getNearby(lat, lng);
      
      if (!response.data || !response.data.places || response.data.places.length === 0) {
        addNotification('⚠️ No tourist places found nearby. Try different location.', 'warning');
        setNearbyPlaces([]);
        setShowPlaces(true);
        setPlacesLoading(false);
        return;
      }
      
      // Calculate real distances and add travel time
      const placesWithDistance = response.data.places.map(place => {
        const distanceMeters = calculateDistance(lat, lng, place.lat, place.lng);
        const travelTime = estimateTravelTime(distanceMeters);
        return {
          ...place,
          distanceMeters,
          distance: formatDistance(distanceMeters),
          travelTime
        };
      });
      
      // Sort by distance (nearest first)
      placesWithDistance.sort((a, b) => a.distanceMeters - b.distanceMeters);
      
      setNearbyPlaces(placesWithDistance);
      setShowPlaces(true);
      addNotification(`✨ Found ${placesWithDistance.length} tourist places nearby!`, 'success');
    } catch (err) {
      addNotification('❌ Error loading places. Check internet connection.', 'error');
      console.error('Places error:', err);
      setNearbyPlaces([]);
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleAIChat = () => {
    if (!aiInput.trim()) return;
    const userMsg = { role: 'user', content: aiInput };
    setAiMessages(prev => [...prev, userMsg]);
    
    setTimeout(() => {
      let aiReply = '';
      const input = aiInput.toLowerCase();
      
      if (input.includes('weather')) {
        aiReply = `Weather: ${weather?.temp || '28°C'}, ${weather?.condition || 'Clear'}. ${weather?.description || 'Good for travel!'}`;
      } else if (input.includes('tourist') || input.includes('place')) {
        aiReply = nearbyPlaces.length > 0 
          ? `Found ${nearbyPlaces.length} places: ${nearbyPlaces.slice(0,3).map(p => p.name).join(', ')}. Click "Find Tourist Places" for more!`
          : 'Click "Find Tourist Places" button to discover nearby attractions!';
      } else if (input.includes('police') || input.includes('emergency')) {
        aiReply = 'Emergency: Police 100, Ambulance 102, Fire 101, Tourist Police 1363. Press SOS for immediate help.';
      } else if (input.includes('hospital') || input.includes('medical')) {
        aiReply = 'Medical emergency? Call 102 immediately. Map shows nearby hospitals.';
      } else if (input.includes('safe') || input.includes('tip')) {
        aiReply = '🛡️ Safety: Stay in lit areas, keep emergency contacts, share location with family, avoid isolated places, secure valuables.';
      } else if (input.includes('incident')) {
        aiReply = `${incidents.length} incidents reported. ${incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length} high priority. Stay alert!`;
      } else {
        aiReply = 'I help with: 🗺️ Tourist places, 🌤️ Weather, 🚨 Emergencies, 🛡️ Safety tips, 📊 Incidents. What do you need?';
      }
      
      setAiMessages(prev => [...prev, { role: 'assistant', content: aiReply }]);
    }, 500);
    
    setAiInput('');
  };

  const handleEmergencySOS = () => {
    if (!userLocation) {
      addNotification('❌ Unable to get location. Please enable GPS.', 'error');
      return;
    }

    setShowEmergencyModal(true);
    
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      // Calculate how many users are nearby
      const usersNearby = nearbyUsers.filter(u => {
        const dist = calculateDistance(latitude, longitude, u.lat, u.lng);
        return dist < 5000;
      });
      
      addNotification(`🆘 SOS sent to ${usersNearby.length} nearby users!`, 'error');
      
      // Emit SOS to all connected users
      socket.emit('emergency-sos', { 
        userId: user.id, 
        userName: user.name || 'Tourist', 
        userEmail: user.email || '',
        userPhone: user.phone || '',
        lat: latitude, 
        lng: longitude,
        accuracy,
        timestamp: Date.now(),
        message: `${user.name || 'Someone'} is in emergency and needs immediate help!`
      });
      
      try {
        // Create critical incident report
        await incidentsAPI.report(
          'medical', 
          'critical', 
          '🆘 EMERGENCY SOS ALERT', 
          `URGENT: Emergency assistance required by ${user.name}! Location accuracy: ${Math.round(accuracy)}m. Phone: ${user.phone || 'Not provided'}`, 
          latitude, 
          longitude, 
          'Current Location - URGENT EMERGENCY'
        );
        
        // Voice confirmation
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(`SOS alert sent successfully to ${usersNearby.length} nearby users. Help is on the way. Stay calm and stay safe.`);
          utterance.rate = 1.1;
          window.speechSynthesis.speak(utterance);
        }
        
        addNotification(`✅ Emergency alert sent! ${usersNearby.length} users within 5km notified.`, 'success');
        
        setTimeout(() => {
          setShowEmergencyModal(false);
          fetchIncidents();
        }, 3000);
      } catch (err) {
        addNotification('⚠️ Error sending SOS. Please call emergency services directly!', 'error');
        console.error('SOS error:', err);
      }
    }, (error) => {
      addNotification('❌ Location error. Call emergency services: 100', 'error');
      setShowEmergencyModal(false);
    }, { enableHighAccuracy: true, timeout: 5000 });
  };

  const showSOSAlertPopup = (userName, distance, lat, lng) => {
    setSOSAlertData({ userName, distance, lat, lng, timestamp: Date.now() });
    setShowSOSAlert(true);
    
    // Auto-hide after 10 seconds
    setTimeout(() => {
      setShowSOSAlert(false);
    }, 10000);
  };

  const handleNavigateToSOS = () => {
    if (sosAlertData && userLocation) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${sosAlertData.lat},${sosAlertData.lng}&travelmode=driving`,
        '_blank'
      );
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const stats = {
    myIncidents: myIncidents.length,
    nearbyIncidents: nearbyIncidents.length,
    critical: incidents.filter(i => i?.severity === 'critical').length,
    touristPlaces: nearbyPlaces.length,
    nearbyUsers: nearbyUsers.length,
    locationAccuracy: locationAccuracy ? `${Math.round(locationAccuracy)}m` : 'N/A'
  };

  return (
    <div className="dashboard-new">
      {/* Header */}
      <header className="header-modern">
        <div className="header-left">
          <h1>🌍 Smart Tourist Safety System</h1>
          <div className="location-info">
            {userLocation ? (
              <>
                <span className="location-badge">
                  📍 {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
                </span>
                {locationAccuracy && (
                  <span className={`accuracy-badge ${locationAccuracy < 20 ? 'high-accuracy' : locationAccuracy < 50 ? 'medium-accuracy' : 'low-accuracy'}`}>
                    ±{Math.round(locationAccuracy)}m accuracy
                  </span>
                )}
              </>
            ) : (
              <span className="location-badge loading">🔍 Locating you...</span>
            )}
          </div>
        </div>
        
        <div className="header-center">
          <nav className="nav-menu">
            <button className="nav-btn" onClick={handleEmergencySOS} title="Emergency SOS">
              🆘 SOS
            </button>
            <button className="nav-btn" onClick={() => setShowReportForm(true)} title="Report Incident">
              📢 Report
            </button>
            <button className="nav-btn" onClick={() => setShowAIChat(true)} title="AI Assistant">
              🤖 AI
            </button>
            <button className="nav-btn" onClick={fetchNearbyPlaces} title="Tourist Places">
              🗺️ Places
            </button>
          </nav>
        </div>
        
        <div className="header-right">
          {weather && (
            <div className="weather-widget">
              <span className="weather-icon">{weather.icon}</span>
              <div>
                <p className="weather-temp">{weather.temp}</p>
                <p className="weather-cond">{weather.condition}</p>
              </div>
            </div>
          )}
          
          {/* Profile Section */}
          <div className="profile-menu-container" style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="profile-btn"
              title={user.name || 'Profile'}
            >
              <div className="profile-avatar">
                {(user.name || 'T').charAt(0).toUpperCase()}
              </div>
              <div className="profile-name-container">
                <span className="profile-name">{user.name || 'Tourist'}</span>
                <span className="profile-role">{user.role || 'Tourist'}</span>
              </div>
            </button>
            
            {showProfileMenu && (
              <div style={{
                position: 'absolute',
                top: '60px',
                right: '0',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                padding: '20px',
                minWidth: '280px',
                zIndex: 1000,
                border: '2px solid #f0f0f0'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    margin: '0 auto 15px'
                  }}>
                    👤
                  </div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '20px', color: '#2c3e50' }}>
                    {user.name || 'Tourist'}
                  </h3>
                  <p style={{ margin: 0, color: '#7f8c8d', fontSize: '14px' }}>
                    {user.email || 'No email'}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '8px',
                    padding: '4px 12px',
                    background: '#e8f5e9',
                    color: '#27ae60',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    🎫 {user.role || 'Tourist'}
                  </span>
                </div>
                
                <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '15px' }}>
                  <div style={{ marginBottom: '10px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#7f8c8d' }}>📋 My Incidents</p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#2c3e50' }}>
                      {myIncidents.length}
                    </p>
                  </div>
                  <div style={{ padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#7f8c8d' }}>📞 Phone</p>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                      {user.phone || 'Not provided'}
                    </p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    if (onLogout) onLogout();
                    else { localStorage.clear(); window.location.reload(); }
                  }}
                  style={{
                    width: '100%',
                    marginTop: '15px',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn sos-btn" onClick={handleEmergencySOS}>
          <span className="btn-icon">🆘</span>
          <span className="btn-text">Emergency SOS</span>
        </button>
        <button className="action-btn report-btn-new" onClick={() => setShowReportForm(!showReportForm)}>
          <span className="btn-icon">📢</span>
          <span className="btn-text">Report Incident</span>
        </button>
        <button className="action-btn ai-btn" onClick={() => setShowAIChat(!showAIChat)} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <span className="btn-icon">🤖</span>
          <span className="btn-text">AI Assistant</span>
        </button>
        <button className="action-btn guide-btn" onClick={fetchNearbyPlaces} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <span className="btn-icon">🗺️</span>
          <span className="btn-text">Find Tourist Places</span>
        </button>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000, maxWidth: '400px' }}>
          {notifications.map(notif => (
            <div key={notif.id} style={{
              background: notif.type === 'error' ? '#fee' : notif.type === 'warning' ? '#ffc' : notif.type === 'success' ? '#efe' : '#e3f2fd',
              border: `2px solid ${notif.type === 'error' ? '#f44' : notif.type === 'warning' ? '#fa0' : notif.type === 'success' ? '#4f4' : '#2196F3'}`,
              borderRadius: '12px',
              padding: '15px 20px',
              marginBottom: '10px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '24px' }}>
                {notif.type === 'error' ? '🚨' : notif.type === 'warning' ? '⚠️' : notif.type === 'success' ? '✅' : 'ℹ️'}
              </span>
              <span style={{ flex: 1, fontWeight: '500' }}>{notif.message}</span>
              <button onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} style={{
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer'
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="stats-container">
        <div className="stat-card blue">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <p className="stat-number">{stats.myIncidents}</p>
            <p className="stat-label">My Incidents</p>
          </div>
        </div>
        <div className="stat-card orange" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="stat-icon">📍</div>
          <div className="stat-info">
            <p className="stat-number">{stats.nearbyIncidents}</p>
            <p className="stat-label">Nearby Incidents</p>
          </div>
        </div>
        <div className="stat-card red">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <p className="stat-number">{stats.critical}</p>
            <p className="stat-label">Critical</p>
          </div>
        </div>
        <div className="stat-card purple" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="stat-icon">🗺️</div>
          <div className="stat-info">
            <p className="stat-number">{stats.touristPlaces}</p>
            <p className="stat-label">Places Found</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main">
        {/* Report Form */}
        {showReportForm && (
          <div className="modal-overlay" onClick={() => setShowReportForm(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>📢 Report Incident</h3>
                <button className="close-btn" onClick={() => setShowReportForm(false)}>✕</button>
              </div>
              <form className="report-form-modern" onSubmit={handleReportIncident}>
                <div className="form-group">
                  <label>📝 Title</label>
                  <input type="text" name="title" placeholder="Brief description..." value={form.title} onChange={handleChange} required />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>🏷️ Type</label>
                    <select name="type" value={form.type} onChange={handleChange} required>
                      <option value="accident">🚗 Accident</option>
                      <option value="theft">💰 Theft</option>
                      <option value="assault">⚔️ Assault</option>
                      <option value="lost">🔍 Lost</option>
                      <option value="medical">🏥 Medical</option>
                      <option value="other">📌 Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>⚠️ Severity</label>
                    <select name="severity" value={form.severity} onChange={handleChange} required>
                      <option value="low">🟢 Low</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="high">🟠 High</option>
                      <option value="critical">🔴 Critical</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>📍 Address</label>
                  <input type="text" name="address" placeholder="Location..." value={form.address} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>📄 Description</label>
                  <textarea name="description" placeholder="Details..." value={form.description} onChange={handleChange} rows="4" />
                </div>
                <button type="submit" className="submit-btn-modern">📤 Submit</button>
              </form>
            </div>
          </div>
        )}

        {/* Emergency Modal */}
        {showEmergencyModal && (
          <div className="modal-overlay emergency">
            <div className="emergency-modal">
              <div className="emergency-icon">🆘</div>
              <h2>Emergency Alert Sent!</h2>
              <p>Help is on the way. Stay safe.</p>
              <div className="emergency-loader"></div>
            </div>
          </div>
        )}

        {/* SOS Alert Popup for Nearby Users */}
        {showSOSAlert && sosAlertData && (
          <div className="modal-overlay" style={{ background: 'rgba(231, 76, 60, 0.95)', zIndex: 9999 }}>
            <div className="sos-alert-popup" style={{
              background: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '550px',
              textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              border: '4px solid #e74c3c',
              animation: 'sosShake 0.5s infinite'
            }}>
              <div style={{ fontSize: '80px', animation: 'pulse 1s infinite' }}>🆘</div>
              <h2 style={{ color: '#e74c3c', fontSize: '32px', margin: '20px 0', fontWeight: 'bold' }}>
                EMERGENCY ALERT!
              </h2>
              <div style={{
                background: 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%)',
                color: 'white',
                padding: '25px',
                borderRadius: '15px',
                margin: '20px 0',
                boxShadow: '0 4px 15px rgba(231, 76, 60, 0.3)'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '15px',
                  marginBottom: '15px'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'white',
                    color: '#e74c3c',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold'
                  }}>
                    {sosAlertData.userName ? sosAlertData.userName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '26px' }}>{sosAlertData.userName || 'Someone'}</h3>
                    <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>needs your help!</p>
                  </div>
                </div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  padding: '15px',
                  borderRadius: '10px',
                  marginTop: '15px'
                }}>
                  <p style={{ margin: '8px 0', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    📍 <span>{sosAlertData.distance}</span> away from you
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    🕒 <span>{new Date(sosAlertData.timestamp).toLocaleTimeString()}</span>
                  </p>
                </div>
              </div>
              <div style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '12px',
                padding: '15px',
                marginBottom: '20px'
              }}>
                <p style={{ fontSize: '18px', color: '#856404', fontWeight: 'bold', margin: '0' }}>
                  🚨 Someone is in EMERGENCY!
                </p>
                <p style={{ fontSize: '14px', color: '#856404', margin: '8px 0 0 0' }}>
                  They need immediate assistance at their location
                </p>
              </div>
              <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
                <button onClick={handleNavigateToSOS} style={{
                  flex: 1,
                  padding: '18px 30px',
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(67, 233, 123, 0.4)',
                  transition: 'all 0.3s ease'
                }}>
                  🧭 Navigate & Help
                </button>
                <button onClick={() => setShowSOSAlert(false)} style={{
                  padding: '18px 30px',
                  background: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '17px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}>
                  ✕
                </button>
              </div>
              <p style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '20px', lineHeight: '1.6' }}>
                ⚠️ If you can safely help, click Navigate. Otherwise, please call emergency services immediately.
              </p>
            </div>
          </div>
        )}

        {/* AI Chat */}
        {showAIChat && (
          <div className="modal-overlay" onClick={() => setShowAIChat(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px', height: '600px', display: 'flex', flexDirection: 'column' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                <h3>🤖 AI Assistant</h3>
                <button className="close-btn" onClick={() => setShowAIChat(false)}>✕</button>
              </div>
              
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: '#f8f9fa' }}>
                {aiMessages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <div style={{ fontSize: '64px', marginBottom: '20px' }}>🤖</div>
                    <h3>Hi! I'm your AI Assistant</h3>
                    <p>Ask me about:</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
                      {['Weather', 'Tourist Places', 'Safety', 'Emergency', 'Incidents'].map(topic => (
                        <button key={topic} onClick={() => setAiInput(topic.toLowerCase())} style={{
                          padding: '8px 16px',
                          background: 'white',
                          border: '2px solid #667eea',
                          borderRadius: '20px',
                          cursor: 'pointer',
                          color: '#667eea',
                          fontWeight: '500'
                        }}>
                          {topic}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  aiMessages.map((msg, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                      marginBottom: '15px'
                    }}>
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: '18px',
                        background: msg.role === 'user' ? '#667eea' : 'white',
                        color: msg.role === 'user' ? 'white' : '#333',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        fontSize: '14px'
                      }}>
                        {msg.role === 'assistant' && <span style={{ marginRight: '8px' }}>🤖</span>}
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              <div style={{ padding: '15px', borderTop: '1px solid #ddd', background: 'white' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" value={aiInput} onChange={(e) => setAiInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAIChat()}
                    placeholder="Ask me anything..."
                    style={{ flex: 1, padding: '12px 16px', border: '2px solid #ddd', borderRadius: '24px', outline: 'none' }}
                  />
                  <button onClick={handleAIChat} style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '24px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tourist Places */}
        {showPlaces && (
          <div className="modal-overlay" onClick={() => setShowPlaces(false)}>
            <div className="modal-content places-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '85vh' }}>
              <div className="modal-header" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                <div>
                  <h3>🗺️ Nearest Tourist Places</h3>
                  <p style={{ margin: '5px 0 0 0', fontSize: '13px', opacity: 0.95 }}>
                    {userLocation && `From your location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`}
                  </p>
                </div>
                <button className="close-btn" onClick={() => setShowPlaces(false)}>✕</button>
              </div>
              
              <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '70vh' }}>
                {placesLoading ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div className="emergency-loader" style={{ margin: '0 auto 20px' }}></div>
                    <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>Searching for places...</h3>
                    <p style={{ color: '#7f8c8d' }}>Calculating distances from your location</p>
                  </div>
                ) : nearbyPlaces.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <div style={{ fontSize: '80px', marginBottom: '20px' }}>🗺️</div>
                    <h3 style={{ marginBottom: '10px', color: '#2c3e50' }}>No places found</h3>
                    <p style={{ color: '#7f8c8d' }}>Check your location settings or try again</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {nearbyPlaces.map((place, idx) => (
                      <div key={idx} className="place-card" style={{
                        background: 'white',
                        border: '2px solid #f0f0f0',
                        borderRadius: '16px',
                        padding: '24px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        {/* Place number badge */}
                        <div style={{
                          position: 'absolute',
                          top: '16px',
                          left: '16px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '16px'
                        }}>
                          {idx + 1}
                        </div>

                        <div style={{ marginLeft: '50px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                            <div style={{ flex: 1 }}>
                              <h4 style={{ margin: '0 0 10px 0', fontSize: '20px', color: '#2c3e50' }}>{place.name}</h4>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                                <span style={{ 
                                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                                  color: 'white', 
                                  padding: '6px 14px', 
                                  borderRadius: '20px', 
                                  fontSize: '13px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  📍 {place.distance}
                                </span>
                                <span style={{ 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                                  color: 'white', 
                                  padding: '6px 14px', 
                                  borderRadius: '20px', 
                                  fontSize: '13px',
                                  fontWeight: 'bold',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}>
                                  🚗 {place.travelTime}
                                </span>
                                <span style={{ color: '#f39c12', fontWeight: 'bold', fontSize: '15px' }}>
                                  ⭐ {place.rating}
                                </span>
                              </div>
                            </div>
                            <div style={{ 
                              background: place.isOpen ? 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' : 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                              color: place.isOpen ? '#1e4620' : '#8b4513',
                              padding: '8px 16px',
                              borderRadius: '12px',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              whiteSpace: 'nowrap',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }}>
                              {place.isOpen ? '🟢 OPEN' : '🔴 CLOSED'}
                            </div>
                          </div>

                          <div style={{ 
                            background: '#f8f9fa', 
                            padding: '12px 16px', 
                            borderRadius: '10px', 
                            marginBottom: '15px',
                            borderLeft: '4px solid #667eea'
                          }}>
                            <p style={{ margin: 0, color: '#555', fontSize: '14px', lineHeight: '1.6' }}>
                              📌 {place.address}
                            </p>
                          </div>

                          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button style={{
                              flex: 1,
                              padding: '12px 20px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.3s ease'
                            }} onClick={() => {
                              window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLocation.lat},${userLocation.lng}&destination=${place.lat},${place.lng}`, '_blank');
                            }}>
                              🧭 Navigate
                            </button>
                            <button style={{
                              flex: 1,
                              padding: '12px 20px',
                              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                              color: 'white',
                              border: 'none',
                              borderRadius: '10px',
                              cursor: 'pointer',
                              fontSize: '14px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              transition: 'all 0.3s ease'
                            }} onClick={() => {
                              window.open(`https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`, '_blank');
                            }}>
                              🔍 View on Map
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="content-grid">
          <div className="left-column">
            {/* Map */}
            <div className="section-card map-section">
              <h3 className="section-title">🗺️ Your Location - Google Maps</h3>
              <ExactLocationMap />
            </div>
          </div>

          <div className="right-column">
            {/* Incidents */}
            <div className="section-card incidents-modern">
              <h3 className="section-title">📋 Incidents</h3>
              {incidents.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">✨</span>
                  <p>No incidents. Stay safe!</p>
                </div>
              ) : (
                <div className="incidents-timeline">
                  {incidents.slice(0, 10).map((incident, idx) => (
                    <div key={incident._id || idx} className={`timeline-item severity-${incident.severity}`}>
                      <div className="timeline-marker"></div>
                      <div className="timeline-content">
                        <h4>{incident.title}</h4>
                        <div className="incident-meta">
                          <span className="badge">{incident.type}</span>
                          <span className={`badge severity-badge-${incident.severity}`}>{incident.severity}</span>
                          <span className="badge">{incident.status}</span>
                        </div>
                        <p className="incident-desc">{incident.description}</p>
                        <p className="incident-reporter">👤 {incident.reportedBy?.name}</p>
                        <p className="incident-time">🕒 {new Date(incident.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Emergency Contacts */}
            <div className="section-card emergency-contacts">
              <h3 className="section-title">📞 Emergency</h3>
              <div className="contacts-list">
                <div className="contact-item">
                  <span className="contact-icon">🚓</span>
                  <div>
                    <p className="contact-name">Police</p>
                    <p className="contact-number">100</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🚑</span>
                  <div>
                    <p className="contact-name">Ambulance</p>
                    <p className="contact-number">102</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">🚒</span>
                  <div>
                    <p className="contact-name">Fire</p>
                    <p className="contact-number">101</p>
                  </div>
                </div>
                <div className="contact-item">
                  <span className="contact-icon">👮</span>
                  <div>
                    <p className="contact-name">Tourist Police</p>
                    <p className="contact-number">1363</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
