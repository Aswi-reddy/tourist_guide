import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';
import { authAPI } from '../services/api';
import './GoogleMap.css';

const libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

function ExactLocationMap() {
  const [location, setLocation] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [address, setAddress] = useState('Getting your location...');
  const [mapType, setMapType] = useState('hybrid');
  
  const mapRef = useRef(null);
  const watchIdRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyBdA8fSylyTPlpf6tSi9uQa0U4kWCo8zcU',
    libraries
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      alert('❌ GPS not supported by your browser!');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy: acc } = position.coords;
        
        console.log('📍 Location Update:');
        console.log('  Lat:', latitude.toFixed(8));
        console.log('  Lng:', longitude.toFixed(8));
        console.log('  Accuracy:', acc.toFixed(1) + 'm');
        
        const newLocation = { lat: latitude, lng: longitude };
        setLocation(newLocation);
        setAccuracy(acc);
        
        // Get address
        if (window.google && window.google.maps) {
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: newLocation }, (results, status) => {
            if (status === 'OK' && results[0]) {
              setAddress(results[0].formatted_address);
            }
          });
        }
        
        // Update backend
        const token = localStorage.getItem('token');
        if (token) {
          authAPI.updateLocation(latitude, longitude).catch(console.error);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        let msg = '❌ GPS Error!\n\n';
        if (error.code === 1) msg += 'Location permission denied.\nClick 🔒 in address bar and allow location.';
        else if (error.code === 2) msg += 'Location unavailable.\nAre you using a phone (not laptop)?';
        else if (error.code === 3) msg += 'GPS timeout.\nGo near a window!';
        alert(msg);
        
        // Default to LPU
        setLocation({ lat: 31.2526, lng: 75.7044 });
        setAccuracy(5000);
        setAddress('LPU Campus (default)');
      },
      options
    );

    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const onMapLoad = (map) => {
    mapRef.current = map;
    if (location) {
      map.panTo(location);
      map.setZoom(20);
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.panTo(location);
      mapRef.current.setZoom(20);
    }
  };

  const getAccuracyColor = () => {
    if (!accuracy) return '#3498db';
    if (accuracy < 10) return '#27ae60';
    if (accuracy < 20) return '#2ecc71';
    if (accuracy < 50) return '#3498db';
    if (accuracy < 100) return '#f39c12';
    return '#e74c3c';
  };

  const getAccuracyLabel = () => {
    if (!accuracy) return 'SEARCHING';
    if (accuracy < 10) return 'EXCELLENT';
    if (accuracy < 20) return 'VERY GOOD';
    if (accuracy < 50) return 'GOOD';
    if (accuracy < 100) return 'FAIR';
    return 'POOR';
  };

  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="loading-spinner"></div>
        <p>🗺️ Loading Google Maps...</p>
      </div>
    );
  }

  return (
    <div className="google-map-wrapper">
      {/* GPS Info Panel */}
      {location && (
        <div className="live-gps-tracking-box">
          <div style={{ 
            background: `linear-gradient(135deg, ${getAccuracyColor()} 0%, ${getAccuracyColor()}dd 100%)`,
            color: 'white', 
            padding: '15px 20px', 
            borderRadius: '12px 12px 0 0',
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <strong style={{ fontSize: '16px' }}>📍 Your Location</strong>
            <span style={{ 
              fontSize: '12px', 
              padding: '5px 12px', 
              background: 'rgba(255,255,255,0.3)', 
              borderRadius: '15px',
              fontWeight: 'bold' 
            }}>
              {getAccuracyLabel()}
            </span>
          </div>
          
          <div style={{ padding: '20px', background: 'white' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>LATITUDE</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {location.lat.toFixed(8)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>LONGITUDE</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', fontFamily: 'monospace' }}>
                  {location.lng.toFixed(8)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>ACCURACY</div>
                <div style={{ fontSize: '15px', fontWeight: 'bold', color: getAccuracyColor() }}>
                  ±{accuracy.toFixed(1)}m
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#999', marginBottom: '3px' }}>STATUS</div>
                <div style={{ fontSize: '13px', fontWeight: 'bold', color: getAccuracyColor() }}>
                  {getAccuracyLabel()}
                </div>
              </div>
            </div>
            
            <div style={{ paddingTop: '15px', borderTop: '2px solid #f0f0f0' }}>
              <div style={{ fontSize: '11px', color: '#999', marginBottom: '5px' }}>ADDRESS</div>
              <div style={{ fontSize: '13px', lineHeight: '1.5', color: '#2c3e50' }}>
                {address}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', gap: '15px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={centerOnUser} 
            style={{
              background: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            🎯 Center
          </button>
          <button 
            onClick={() => setMapType('roadmap')} 
            style={{
              background: mapType === 'roadmap' ? '#4285F4' : 'white',
              color: mapType === 'roadmap' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            🗺️ Road
          </button>
          <button 
            onClick={() => setMapType('satellite')} 
            style={{
              background: mapType === 'satellite' ? '#4285F4' : 'white',
              color: mapType === 'satellite' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            🛰️ Satellite
          </button>
          <button 
            onClick={() => setMapType('hybrid')} 
            style={{
              background: mapType === 'hybrid' ? '#4285F4' : 'white',
              color: mapType === 'hybrid' ? 'white' : '#333',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 20px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              transition: 'all 0.2s ease'
            }}
          >
            🌐 Hybrid
          </button>
        </div>
        
        {location && (
          <div 
            onClick={centerOnUser}
            style={{ 
              background: 'white', 
              padding: '12px 20px', 
              borderRadius: '25px', 
              boxShadow: '0 3px 12px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer'
            }}
          >
            <div style={{ 
              width: '10px', 
              height: '10px', 
              borderRadius: '50%', 
              background: getAccuracyColor(),
              animation: 'pulse 2s infinite'
            }}></div>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#2c3e50' }}>
              LIVE • {getAccuracyLabel()}
            </span>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container-large">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={location || { lat: 31.2526, lng: 75.7044 }}
          zoom={location ? 20 : 15}
          options={{
            mapTypeId: mapType,
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            rotateControl: false,
            scaleControl: true
          }}
          onLoad={onMapLoad}
        >
          {location && (
            <>
              <Marker
                position={location}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 12,
                  fillColor: getAccuracyColor(),
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 4
                }}
              />
              
              <Circle
                center={location}
                radius={accuracy}
                options={{
                  fillColor: getAccuracyColor(),
                  fillOpacity: 0.15,
                  strokeColor: getAccuracyColor(),
                  strokeOpacity: 0.8,
                  strokeWeight: 2
                }}
              />
            </>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}

export default ExactLocationMap;
