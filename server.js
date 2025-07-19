const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/ai-news', (req, res) => {
  const rssPath = path.join(__dirname, 'public', 'feed.xml');
  if (!fs.existsSync(rssPath)) {
    return res.status(404).send('RSS feed not found.');
  }
  res.set('Content-Type', 'application/rss+xml');
  fs.createReadStream(rssPath).pipe(res);
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
