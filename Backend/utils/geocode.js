const axios = require('axios');

module.exports.getCoordinates = async (address) => {
  const API_KEY = process.env.MAPS_API;
  try {
    const url = `https://us1.locationiq.com/v1/search?key=${API_KEY}&q=${encodeURIComponent(address)}&format=json`;

    const response = await axios.get(url);

    const { lat, lon } = response.data[0];

    if (response.data.length === 0) {
      return null;
    }
    return {
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    };
  } catch {
    return null;
  }
};
