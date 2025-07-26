const express = require('express');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Auto-generate RSS feed on server start
exec('node generateRSS.js', (err, stdout, stderr) => {
  if (err) {
    console.error('❌ RSS generation failed:', stderr);
  } else {
    console.log('✅ RSS generated:', stdout);
  }
});

// Serve the public directory statically
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route for sanity
app.get('/', (req, res) => {
  res.send('📰 RSS Generator is live. Visit /feed.xml to view the latest feed.');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
