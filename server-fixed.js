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

// Data storage configuration - use persistent directory if available
const dataDir = process.env.DATA_DIR || path.join(__dirname, 'data');
const dataFile = path.join(dataDir, 'feed-data.json');

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`📁 Created data directory: ${dataDir}`);
  }
}

// Initialize data file if it doesn't exist
function initializeDataFile() {
  ensureDataDirectory();
  
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
      ],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
    console.log(`📄 Initialized data file: ${dataFile}`);
  }
}

// Load data from file with error handling and backup
function loadData() {
  try {
    ensureDataDirectory();
    
    if (!fs.existsSync(dataFile)) {
      console.log('⚠️ Data file not found, initializing...');
      initializeDataFile();
    }
    
    const data = fs.readFileSync(dataFile, 'utf8');
    const parsedData = JSON.parse(data);
    
    // Ensure all required fields exist
    if (!parsedData.feedInfo) parsedData.feedInfo = {};
    if (!parsedData.items) parsedData.items = [];
    if (!parsedData.metadata) {
      parsedData.metadata = {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      };
    }
    
    return parsedData;
  } catch (error) {
    console.error('❌ Error loading data:', error);
    
    // Try to load backup if main file is corrupted
    const backupFile = dataFile + '.backup';
    if (fs.existsSync(backupFile)) {
      try {
        console.log('🔄 Attempting to restore from backup...');
        const backupData = fs.readFileSync(backupFile, 'utf8');
        const parsedBackup = JSON.parse(backupData);
        
        // Restore main file from backup
        fs.writeFileSync(dataFile, JSON.stringify(parsedBackup, null, 2));
        console.log('✅ Restored from backup successfully');
        return parsedBackup;
      } catch (backupError) {
        console.error('❌ Backup restore failed:', backupError);
      }
    }
    
    // If all else fails, return minimal structure
    return { 
      feedInfo: {
        title: 'RSS Feed',
        description: 'RSS Feed Description',
        feed_url: 'http://localhost:3000/feed.xml',
        site_url: 'http://localhost:3000',
        language: 'en'
      }, 
      items: [],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      }
    };
  }
}

// Save data to file with backup and atomic write
function saveData(data) {
  try {
    ensureDataDirectory();
    
    // Update metadata
    if (!data.metadata) data.metadata = {};
    data.metadata.lastModified = new Date().toISOString();
    data.metadata.version = data.metadata.version || "1.0.0";
    
    // Create backup of current file before writing
    if (fs.existsSync(dataFile)) {
      const backupFile = dataFile + '.backup';
      fs.copyFileSync(dataFile, backupFile);
    }
    
    // Atomic write: write to temp file first, then rename
    const tempFile = dataFile + '.tmp';
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, dataFile);
    
    console.log(`💾 Data saved successfully at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error('❌ Error saving data:', error);
    return false;
  }
}

// Generate RSS feed with enhanced error handling
function generateRSSFeed() {
  try {
    const data = loadData();
    const publicDir = path.join(__dirname, 'public');
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    const feed = new RSS({
      title: data.feedInfo.title || 'RSS Feed',
      description: data.feedInfo.description || 'RSS Feed Description',
      feed_url: data.feedInfo.feed_url || 'http://localhost:3000/feed.xml',
      site_url: data.feedInfo.site_url || 'http://localhost:3000',
      language: data.feedInfo.language || 'en',
      pubDate: new Date().toISOString(),
      lastBuildDate: new Date().toISOString(),
      generator: 'RSS Newsletter Generator v1.0.0'
    });

    // Sort items by date (newest first) and add to feed
    const sortedItems = data.items.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    sortedItems.forEach(item => {
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
    
    // Atomic write for RSS feed as well
    const feedFile = path.join(publicDir, 'feed.xml');
    const tempFeedFile = feedFile + '.tmp';
    fs.writeFileSync(tempFeedFile, xml);
    fs.renameSync(tempFeedFile, feedFile);
    
    console.log(`✅ RSS feed regenerated with ${data.items.length} items at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error('❌ Error generating RSS feed:', error);
    return false;
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  const data = loadData();
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    dataFile: dataFile,
    itemCount: data.items.length,
    lastModified: data.metadata?.lastModified,
    uptime: process.uptime()
  });
});

// Initialize on startup
console.log('🚀 Starting RSS Newsletter Server...');
console.log(`📁 Data directory: ${dataDir}`);
console.log(`📄 Data file: ${dataFile}`);

initializeDataFile();
generateRSSFeed();

// Routes

// Home route with status information
app.get('/', (req, res) => {
  const data = loadData();
  res.send(`
    <h1>📰 RSS Generator is live</h1>
    <p><strong>Feed URL:</strong> <a href="/feed.xml">/feed.xml</a></p>
    <p><strong>API Base:</strong> <a href="/api/feed/">/api/feed/</a></p>
    <p><strong>Health Check:</strong> <a href="/health">/health</a></p>
    <p><strong>Items Count:</strong> ${data.items.length}</p>
    <p><strong>Last Modified:</strong> ${data.metadata?.lastModified || 'Unknown'}</p>
    <p><strong>Data File:</strong> ${dataFile}</p>
  `);
});

// Get all feed items
app.get('/api/feed/items', (req, res) => {
  const data = loadData();
  res.json({
    success: true,
    items: data.items,
    count: data.items.length,
    metadata: data.metadata
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
      item: newItem,
      totalItems: data.items.length
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
      item: deletedItem,
      remainingItems: data.items.length
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
    const data = loadData();
    res.json({
      success: true,
      message: 'RSS feed regenerated successfully',
      itemCount: data.items.length,
      timestamp: new Date().toISOString()
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
    feedInfo: data.feedInfo,
    metadata: data.metadata
  });
});

// Backup endpoint
app.post('/api/backup', (req, res) => {
  try {
    const data = loadData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(dataDir, `backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    
    res.json({
      success: true,
      message: 'Backup created successfully',
      backupFile: backupFile,
      timestamp: timestamp
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create backup',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /feed.xml',
      'GET /api/feed/items',
      'POST /api/feed/items',
      'PUT /api/feed/items/:id',
      'DELETE /api/feed/items/:id',
      'GET /api/feed/info',
      'PUT /api/feed/info',
      'POST /api/feed/regenerate',
      'POST /api/backup'
    ]
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📰 RSS feed available at: http://localhost:${PORT}/feed.xml`);
  console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api/feed/`);
  console.log(`💚 Health check available at: http://localhost:${PORT}/health`);
  console.log(`📁 Data persisted to: ${dataFile}`);
});

