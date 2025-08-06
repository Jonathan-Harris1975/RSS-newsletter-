import axios from 'axios';

const BASE_URL = 'https://podcast-script-generation.onrender.com';

async function pingServer() {
  try {
    await axios.get(`${BASE_URL}/health`);
    console.log('Keepalive ping successful');
  } catch (err) {
    console.error('Keepalive ping failed:', err.message);
  }
}

// Ping every 5 minutes (300000ms)
setInterval(pingServer, 300000);

// Initial ping
pingServer();

console.log('Keepalive service started');
