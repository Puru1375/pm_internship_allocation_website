const axios = require('axios');

// Using OpenStreetMap (Nominatim) - Free, no API key required for low volume
const getCoordinates = async (address, city, state, pincode) => {
  try {
    // Construct a search query string
    const query = `${address}, ${city}, ${state}, ${pincode}`.replace(/undefined/g, '');
    
    if (!query.trim() || query.trim() === ', , ,') return { lat: null, lon: null };

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`;

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'PM-Internship-Portal-Hackathon-App' // Required by Nominatim
      }
    });

    if (response.data && response.data.length > 0) {
      return {
        lat: parseFloat(response.data[0].lat),
        lon: parseFloat(response.data[0].lon)
      };
    }

    return { lat: null, lon: null }; // Not found
  } catch (error) {
    console.error("Geocoding Error:", error.message);
    return { lat: null, lon: null }; // Fail gracefully
  }
};

module.exports = getCoordinates;