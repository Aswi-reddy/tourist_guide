# ⚡ Quick Start - 3 Steps

## Step 1: Start Backend
```bash
cd smart-tourist-backend
npm install
npm start
```
✅ Runs on http://localhost:5000

## Step 2: Start Frontend
```bash
cd smart-tourist-frontend
npm install
npm run dev
```
✅ Runs on http://localhost:5173

## Step 3: Open Browser
Go to **http://localhost:5173**

---

## ✨ Features You'll Get

1. **Google Maps** - Accurate GPS location
2. **Tourist Places** - Find nearby attractions with distance
3. **Report Incidents** - See YOUR + OTHERS' incidents
4. **Emergency SOS** - Alert nearby users instantly
5. **AI Chatbot** - Get help, weather, tourist tips
6. **Weather** - Current conditions

---

## 📝 First Time Use

1. Click **Register** → Create account
2. Browser asks for location → Click **Allow**
3. Click **Find Tourist Places** → See nearby attractions
4. Click **AI Assistant** → Ask questions
5. Click **Report Incident** → Report safety issues
6. Click **Emergency SOS** → Alert nearby people

---

**That's it! Super simple! 🎉**
POST http://localhost:5000/api/incidents/report
Headers: Authorization: Bearer [token]
Body: { type, severity, title, description, lat, lng, address }
```

**Get Incidents**
```
GET http://localhost:5000/api/incidents
Headers: Authorization: Bearer [token]
```

---

## ❌ Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| MongoDB not found | Start MongoDB service |
| Port 5000 in use | Change PORT in .env to 5001 |
| Port 3000 in use | Change port in vite.config.js to 3001 |
| npm: command not found | Install Node.js from nodejs.org |
| Location not working | Allow browser permission + use HTTPS |

---

## 📚 Project Tech Stack

```
Backend: Node.js + Express + MongoDB + Socket.io
Frontend: React + Vite + Leaflet Maps + Axios
```

---

## ✨ Features Included

✅ User Registration/Login  
✅ Incident Reporting  
✅ Real-time Updates  
✅ GPS Location Tracking  
✅ Geofence Management  
✅ Interactive Maps  
✅ Dashboard with Analytics  
✅ Simple & Easy Code  

---

## 🎓 Learn While Building

Each file has:
- Clear variable names
- Simple logic
- Helpful comments
- No complex patterns

Perfect for beginners to understand!

---

## 🎉 All Set!

Your project is **100% ready** to use.

Just run:
```bash
npm run dev    (in both folders)
```

**Enjoy! 🚀**
