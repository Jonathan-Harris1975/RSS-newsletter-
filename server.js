const express = require('express');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const RSS = require('rss');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Data storage file
const dataFile = path.join(__dirname, 'feed-data.json');

// Initialize data file if it doesn't exist
function initializeDataFile() {
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      feedInfo: {
        title: 'Jonathan Harris AI News',
        description: 'Curated AI and tech news, rewritten for clarity',
        feed_url: 'https://rss-feeds.jonathan-harris.online/ai-news',
        site_url: 'https://www.jonathan-harris.online',
        language: 'en'
      },
      items: [
        {
          id: uuidv4(),
          title: "Example title",
          description: "This is an example article.",
          url: "https://example.com/article",
          date: new Date().toISOString(),
          author: "Jonathan Harris",
          categories: ["AI", "Technology"]
        }
      ]
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  }
}

// Load data from file
function loadData() {
  try {
    const data = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading data:', error);
    return { feedInfo: {}, items: [] };
  }
}

// Save data to file
function saveData(data) {
  try {
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving data:', error);
    return false;
  }
}

// Generate RSS feed
function generateRSSFeed() {
  const data = loadData();
  const publicDir = path.join(__dirname, 'public');
  
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
  }

  const feed = new RSS({
    title: data.feedInfo.title || 'RSS Feed',
    description: data.feedInfo.description || 'RSS Feed Description',
    feed_url: data.feedInfo.feed_url || 'http://localhost:3000/feed.xml',
    site_url: data.feedInfo.site_url || 'http://localhost:3000',
    language: data.feedInfo.language || 'en',
    pubDate: new Date().toISOString()
  });

  data.items.forEach(item => {
    feed.item({
      title: item.title,
      description: item.description,
      url: item.url,
      date: item.date,
      author: item.author,
      categories: item.categories || []
    });
  });

  const xml = feed.xml({ indent: true });
  fs.writeFileSync(path.join(publicDir, 'feed.xml'), xml);
  console.log('✅ RSS feed regenerated');
  return true;
}

// Initialize on startup
initializeDataFile();
generateRSSFeed();

// Routes

// Home route
app.get('/', (req, res) => {
  res.send('📰 RSS Generator is live. Visit /feed.xml to view the latest feed.');
});

// Get all feed items
app.get('/api/feed/items', (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    items: data.items,
    count: data.items.length
  });
});

// Get single feed item
app.get('/api/feed/items/:id', (req, res) => {
  const data = loadData();
  const item = data.items.find(item => item.id === req.params.id);
  
  if (!item) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
  
  res.json({
    success: true,
    item: item
  });
});

// Add new feed item
app.post('/api/feed/items', (req, res) => {
  const { title, description, url, author, categories } = req.body;
  
  if (!title || !description || !url) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, and URL are required'
    });
  }
  
  const data = loadData();
  const newItem = {
    id: uuidv4(),
    title,
    description,
    url,
    date: new Date().toISOString(),
    author: author || '',
    categories: categories || []
  };
  
  data.items.unshift(newItem); // Add to beginning for newest first
  
  if (saveData(data)) {
    generateRSSFeed();
    res.status(201).json({
      success: true,
      message: 'Item added successfully',
      item: newItem
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to save item'
    });
  }
});

// Update existing feed item
app.put('/api/feed/items/:id', (req, res) => {
  const data = loadData();
  const itemIndex = data.items.findIndex(item => item.id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
  
  const { title, description, url, author, categories } = req.body;
  const existingItem = data.items[itemIndex];
  
  // Update only provided fields
  data.items[itemIndex] = {
    ...existingItem,
    title: title || existingItem.title,
    description: description || existingItem.description,
    url: url || existingItem.url,
    author: author !== undefined ? author : existingItem.author,
    categories: categories !== undefined ? categories : existingItem.categories,
    date: existingItem.date // Keep original date
  };
  
  if (saveData(data)) {
    generateRSSFeed();
    res.json({
      success: true,
      message: 'Item updated successfully',
      item: data.items[itemIndex]
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to update item'
    });
  }
});

// Delete feed item
app.delete('/api/feed/items/:id', (req, res) => {
  const data = loadData();
  const itemIndex = data.items.findIndex(item => item.id === req.params.id);
  
  if (itemIndex === -1) {
    return res.status(404).json({
      success: false,
      message: 'Item not found'
    });
  }
  
  const deletedItem = data.items.splice(itemIndex, 1)[0];
  
  if (saveData(data)) {
    generateRSSFeed();
    res.json({
      success: true,
      message: 'Item deleted successfully',
      item: deletedItem
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to delete item'
    });
  }
});

// Manually regenerate RSS feed
app.post('/api/feed/regenerate', (req, res) => {
  if (generateRSSFeed()) {
    res.json({
      success: true,
      message: 'RSS feed regenerated successfully'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate RSS feed'
    });
  }
});

// Update feed information
app.put('/api/feed/info', (req, res) => {
  const data = loadData();
  const { title, description, feed_url, site_url, language } = req.body;
  
  data.feedInfo = {
    ...data.feedInfo,
    title: title || data.feedInfo.title,
    description: description || data.feedInfo.description,
    feed_url: feed_url || data.feedInfo.feed_url,
    site_url: site_url || data.feedInfo.site_url,
    language: language || data.feedInfo.language
  };
  
  if (saveData(data)) {
    generateRSSFeed();
    res.json({
      success: true,
      message: 'Feed information updated successfully',
      feedInfo: data.feedInfo
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to update feed information'
    });
  }
});

// Get feed information
app.get('/api/feed/info', (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    feedInfo: data.feedInfo
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📰 RSS feed available at: http://localhost:${PORT}/feed.xml`);
  console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api/feed/`);
});

