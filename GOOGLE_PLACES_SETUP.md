# 🗺️ Google Places API Setup Guide

## Your Smart Tourist App Now Uses REAL Google Places Data! 🎉

Instead of manually entering places, the app now automatically fetches **nearby tourist attractions** from Google Places API based on your GPS location!

---

## 🚀 How It Works NOW:

1. **You log in** → App gets your location automatically
2. **Click "Find Tourist Places"** → App sends your location to backend
3. **Backend calls Google Places API** → Fetches REAL tourist places near you
4. **Frontend displays** → Shows places with:
   - ✅ Real names, addresses, ratings
   - ✅ Actual distances from your location
   - ✅ Open/closed status
   - ✅ Photos (if available)
   - ✅ Sorted by distance (nearest first)

---

## 📋 Setup Instructions (Get Your FREE API Key):

### Step 1: Get Google Places API Key

1. Go to: **https://console.cloud.google.com/**
2. **Create a new project** (or select existing)
   - Click "Select a project" → "New Project"
   - Name it: `Smart Tourist App`
   - Click "Create"

3. **Enable Places API:**
   - Go to: **APIs & Services** → **Library**
   - Search for: `Places API`
   - Click on it → Click **"Enable"**

4. **Create API Key:**
   - Go to: **APIs & Services** → **Credentials**
   - Click: **"Create Credentials"** → **"API Key"**
   - Copy your API key (looks like: `AIzaSyXXXXXXXXXXXXXXXXXXXX`)

5. **Restrict Your API Key (IMPORTANT for security):**
   - Click on your API key
   - Under "API restrictions":
     - Select "Restrict key"
     - Check: `Places API`
   - Under "Application restrictions":
     - Select "IP addresses"
     - Add: `127.0.0.1` (for local development)
   - Click **Save**

### Step 2: Add API Key to Your App

1. Open: `smart-tourist-backend\.env`
2. Find this line:
   ```
   GOOGLE_PLACES_API_KEY=
   ```
3. Paste your API key:
   ```
   GOOGLE_PLACES_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXX
   ```
4. Save the file

### Step 3: Restart Backend

```powershell
# Stop current backend (Ctrl+C in terminal)
# Then restart:
cd "c:\Users\suman\Downloads\New folder\smart-tourist-backend"
npm start
```

---

## ✨ What You'll Get:

### With API Key:
- ✅ **REAL** tourist places from Google Maps
- ✅ **Live data**: ratings, reviews count, open hours
- ✅ **Photos** of places
- ✅ **Accurate addresses** and locations
- ✅ **Any location worldwide** works!

### Without API Key (Fallback):
- 📝 Mock data (sample places from Punjab/Amritsar area)
- ⚠️ Limited to predefined locations
- ❌ No photos, outdated info

---

## 🎯 Place Types You Can Fetch:

Change `type` parameter in the API call to get specific places:

- `tourist_attraction` - General tourist spots
- `museum` - Museums
- `park` - Parks and gardens
- `restaurant` - Restaurants
- `cafe` - Cafes
- `shopping_mall` - Shopping centers
- `temple` - Religious sites
- `mosque` - Mosques
- `church` - Churches
- `zoo` - Zoos
- `amusement_park` - Amusement parks
- `art_gallery` - Art galleries
- `aquarium` - Aquariums
- `stadium` - Sports stadiums

---

## 💰 Pricing (Google Places API):

- **FREE**: Up to 5,000 requests/month
- **After that**: $0.017 per request
- **For students/testing**: FREE tier is MORE than enough!

---

## 🔧 Troubleshooting:

### "No places found"
- ✅ Make sure GPS is enabled
- ✅ Allow location access in browser
- ✅ Check if API key is valid
- ✅ Verify Places API is enabled in Google Cloud Console

### "API Error"
- ✅ Check API key restrictions
- ✅ Ensure Places API is enabled
- ✅ Verify billing is set up (required even for free tier)

### "Mock data showing"
- ✅ API key not set or invalid
- ✅ Check backend console for error messages

---

## 🎊 You're Done!

Now your app fetches **REAL** tourist places automatically! No more manual entry needed! 🚀

**Test it:**
1. Login to your app
2. Click "Find Tourist Places" 🗺️
3. See REAL places near you appear!

---

## 📞 Need Help?

Check backend console for messages:
- `✓ Using Google Places API` - API is working!
- `Using mock data for places` - Using fallback data (no API key)

Enjoy your Smart Tourist App! 🎉
