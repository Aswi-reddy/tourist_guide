# 🎯 Smart Tourist Safety System

Simple React + Node.js app for tourist safety with Google Maps, incident reporting, and emergency alerts.

## ✨ Features

✅ **Accurate Google Maps** - High-precision GPS tracking with real location  
✅ **Tourist Places** - Find nearby attractions with distances (km)  
✅ **Incident Reports** - See YOUR incidents + OTHERS' nearby incidents  
✅ **Emergency SOS** - Alert nearby users in real-time  
✅ **AI Chatbot** - Get safety help, weather, tourist suggestions  
✅ **Weather Info** - Current weather at your location  

## 🚀 Quick Start

### 1. Backend
```bash
cd smart-tourist-backend
npm install
npm start
```
Runs on: http://localhost:5000

### 2. Frontend
```bash
cd smart-tourist-frontend
npm install
npm run dev
```
Runs on: http://localhost:5173

### 3. Setup MongoDB
Make sure MongoDB is running on `localhost:27017`

### 4. Open Browser
Go to http://localhost:5173 and create account!

## 📱 How to Use

1. **Register** - Create account
2. **Allow Location** - Browser will ask for GPS permission  
3. **Find Tourist Places** - Click button to see nearby attractions  
4. **Report Incident** - Fill form to report safety issues  
5. **Emergency SOS** - Press SOS to alert nearby users  
6. **AI Chat** - Ask about weather, safety, tourist places  

## 🔑 Tech Stack

- **Frontend**: React, Google Maps API, Socket.io
- **Backend**: Node.js, Express, MongoDB, Socket.io
- **Real-time**: WebSocket for instant SOS alerts

## 📊 API Endpoints

- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/incidents/report` - Report incident
- `GET /api/incidents` - Get all incidents
- `GET /api/incidents/nearby` - Get incidents near you
- `POST /api/places/nearby` - Get tourist places near you
- `POST /api/places/weather` - Get weather data

---

**Simple, Clean, and Focused on YOUR Requirements! 🎉**

### Geofences
- `POST /api/geofences/create` - Create new geofence
- `GET /api/geofences` - Get all geofences

## 💾 Database Models

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: String (tourist/responder/admin),
  location: { lat, lng, updatedAt },
  createdAt: Date
}
```

### Incident
```javascript
{
  reportedBy: ObjectId (User),
  type: String (accident/theft/assault/lost/medical/other),
  severity: String (low/medium/high/critical),
  title: String,
  description: String,
  location: { lat, lng },
  address: String,
  status: String (reported/acknowledged/resolved),
  responders: [ObjectId],
  createdAt: Date
}
```

### Geofence
```javascript
{
  name: String,
  type: String (safe-zone/danger-zone),
  lat: Number,
  lng: Number,
  radius: Number (meters),
  description: String,
  createdAt: Date
}
```

## 🔐 Authentication

- JWT tokens stored in `localStorage`
- Tokens expire after 7 days
- Automatically included in API requests via interceptor

## 📝 Environment Variables

**Backend (.env)**:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-tourist-safety
JWT_SECRET=your_super_secret_jwt_key_12345
NODE_ENV=development
CLIENT_URL=http://localhost:3000
```

## 🧪 Testing

1. **Register**: Create new account as Tourist or Responder
2. **Login**: Sign in with email/password
3. **Report Incident**: Click "Report Incident" button
4. **View Map**: See your current location on the map
5. **View Incidents**: See all reported incidents in dashboard

## 🛠️ Tech Stack

**Backend**:
- Node.js
- Express.js
- MongoDB + Mongoose
- Socket.io (Real-time)
- JWT (Authentication)
- bcryptjs (Password hashing)

**Frontend**:
- React
- Vite
- Axios (HTTP calls)
- Leaflet (Maps)
- Socket.io-client (Real-time)

## 📞 Simple & Easy Code

All code is written in a **very simple and easy-to-understand** way:
- Clear variable names
- Step-by-step logic
- Helpful comments
- No complex patterns
- Beginner-friendly

## 🚀 Next Steps

1. Install MongoDB locally
2. Start backend: `npm run dev` in backend folder
3. Start frontend: `npm run dev` in frontend folder
4. Open `http://localhost:3000` in browser
5. Register and start testing!

---

**Happy Coding! 🎉**
