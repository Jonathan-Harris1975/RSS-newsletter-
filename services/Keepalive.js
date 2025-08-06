const axios = require('axios');
require('dotenv').config();

const BASE_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT || 3000}`;

async function pingServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('Keepalive ping successful');
  } catch (err) {
    console.error('Keepalive ping failed:', err.message);
  }
}

setInterval(pingServer, 300000); // Ping every 5 min
pingServer(); // Initial ping

console.log('Keepalive service started');
