import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 3000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.get('/', (req, res) => {
  res.send('AI Newsletter RSS is live. Visit /rss to view the feed.');
});

app.get('/rss', (req, res) => {
  res.sendFile(path.join(__dirname, 'feed.xml'));
});

app.listen(port, () => {
  console.log(`✅ Server is running on port ${port}`);
});
