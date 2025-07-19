import fs from 'fs-extra';
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post('/update-feed', async (req, res) => {
  const newItem = req.body;
  if (!newItem || !newItem.title || !newItem.link || !newItem.description || !newItem.pubDate) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const file = './feed-data.json';
    const existing = (await fs.pathExists(file)) ? await fs.readJson(file) : [];

    existing.unshift(newItem); // newest first
    await fs.writeJson(file, existing, { spaces: 2 });

    res.json({ success: true, items: existing.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update feed' });
  }
});
