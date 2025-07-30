const express = require("express");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const RSS = require("rss");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// CORS middleware for cross-origin requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Data storage configuration - use persistent directory if available
const defaultDataDir = path.join(__dirname, "data");
let dataDir = process.env.DATA_DIR || defaultDataDir;
let dataFile = path.join(dataDir, "feed-data.json");

// Ensure data directory exists
function ensureDataDirectory() {
  console.log(`[DEBUG] ensureDataDirectory: Checking directory ${dataDir}`);
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(`[DEBUG] 📁 Created data directory: ${dataDir}`);
      
      // Ensure proper permissions
      fs.chmodSync(dataDir, 0o777); // RWX for owner, group, others
      console.log(`[DEBUG] Set permissions on data directory: ${dataDir}`);
    } catch (err) {
      console.error(`[ERROR] Failed to create data directory ${dataDir}: ${err.message}`);
      // Try to continue with default directory if Render directory fails
      if (dataDir !== defaultDataDir) {
        dataDir = defaultDataDir;
        dataFile = path.join(defaultDataDir, "feed-data.json");
        ensureDataDirectory();
      }
    }
  } else {
    // Verify directory is writable
    try {
      fs.accessSync(dataDir, fs.constants.W_OK);
      console.log(`[DEBUG] Data directory ${dataDir} is writable`);
    } catch (err) {
      console.error(`[ERROR] Data directory ${dataDir} is not writable: ${err.message}`);
      // Fall back to default directory if Render directory isn't writable
      if (dataDir !== defaultDataDir) {
        dataDir = defaultDataDir;
        dataFile = path.join(defaultDataDir, "feed-data.json");
        ensureDataDirectory();
      }
    }
  }
}

// Initialize data file if it doesn't exist
function initializeDataFile() {
  ensureDataDirectory();
  console.log(`[DEBUG] initializeDataFile: Checking file ${dataFile}`);
  if (!fs.existsSync(dataFile) || fs.readFileSync(dataFile, 'utf8').trim() === '') {
    console.log(`[DEBUG] Data file ${dataFile} not found or is empty. Initializing with example data...`);
    const initialData = {
      feedInfo: {
        title: "Jonathan Harris AI News",
        description: "Curated AI and tech news, rewritten for clarity",
        feed_url: "https://rss-feeds.jonathan-harris.online/ai-news",
        site_url: "https://www.jonathan-harris.online",
        language: "en"
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
    try {
      fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
      console.log(`[DEBUG] 📄 Initialized data file: ${dataFile}`);
    } catch (err) {
      console.error(`[ERROR] Failed to write initial data file ${dataFile}: ${err.message}`);
    }
  }
}

// Load data from file with error handling and backup
function loadData() {
  console.log(`[DEBUG] loadData: Attempting to load data from ${dataFile}`);
  try {
    ensureDataDirectory();
    
    if (!fs.existsSync(dataFile)) {
      console.log(`[DEBUG] ⚠️ Data file ${dataFile} not found during load, initializing...`);
      initializeDataFile();
    }
    
    const data = fs.readFileSync(dataFile, "utf8");
    const parsedData = JSON.parse(data);
    console.log(`[DEBUG] Data loaded successfully from ${dataFile}. Item count: ${parsedData.items.length}`);
    
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
    console.error(`[ERROR] ❌ Error loading data from ${dataFile}: ${error.message}`);
    
    // Try to load backup if main file is corrupted
    const backupFile = dataFile + ".backup";
    if (fs.existsSync(backupFile)) {
      try {
        console.log(`[DEBUG] 🔄 Attempting to restore from backup ${backupFile}...`);
        const backupData = fs.readFileSync(backupFile, "utf8");
        const parsedBackup = JSON.parse(backupData);
        
        // Restore main file from backup
        fs.writeFileSync(dataFile, JSON.stringify(parsedBackup, null, 2));
        console.log(`[DEBUG] ✅ Restored from backup ${backupFile} successfully`);
        return parsedBackup;
      } catch (backupError) {
        console.error(`[ERROR] ❌ Backup restore failed from ${backupFile}: ${backupError.message}`);
      }
    }
    
    // If all else fails, return minimal structure
    console.log("[DEBUG] Returning minimal data structure as fallback.");
    return { 
      feedInfo: {
        title: "RSS Feed",
        description: "RSS Feed Description",
        feed_url: "http://localhost:3000/feed.xml",
        site_url: "http://localhost:3000",
        language: "en"
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
  console.log(`[DEBUG] saveData: Attempting to save data to ${dataFile}. Item count: ${data.items.length}`);
  try {
    ensureDataDirectory();
    
    // Update metadata
    if (!data.metadata) data.metadata = {};
    data.metadata.lastModified = new Date().toISOString();
    data.metadata.version = data.metadata.version || "1.0.0";
    
    // Create backup of current file before writing
    if (fs.existsSync(dataFile)) {
      const backupFile = dataFile + ".backup";
      try {
        fs.copyFileSync(dataFile, backupFile);
        console.log(`[DEBUG] Created backup: ${backupFile}`);
      } catch (err) {
        console.error(`[ERROR] Failed to create backup ${backupFile}: ${err.message}`);
      }
    }
    
    // Atomic write: write to temp file first, then rename
    const tempFile = dataFile + ".tmp";
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, dataFile);
    
    console.log(`[DEBUG] 💾 Data saved successfully at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] ❌ Error saving data to ${dataFile}: ${error.message}`);
    return false;
  }
}

// Generate RSS feed with enhanced error handling
function generateRSSFeed() {
  console.log("[DEBUG] generateRSSFeed: Starting RSS feed generation.");
  try {
    const data = loadData();
    const publicDir = path.join(__dirname, "public");
    
    if (!fs.existsSync(publicDir)) {
      try {
        fs.mkdirSync(publicDir, { recursive: true });
        console.log(`[DEBUG] Created public directory: ${publicDir}`);
      } catch (err) {
        console.error(`[ERROR] Failed to create public directory ${publicDir}: ${err.message}`);
      }
    }

    const feed = new RSS({
      title: data.feedInfo.title || "RSS Feed",
      description: data.feedInfo.description || "RSS Feed Description",
      feed_url: data.feedInfo.feed_url || "http://localhost:3000/feed.xml",
      site_url: data.feedInfo.site_url || "http://localhost:3000",
      language: data.feedInfo.language || "en",
      pubDate: new Date().toISOString(),
      lastBuildDate: new Date().toISOString(),
      generator: "RSS Newsletter Generator v1.0.0"
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
    const feedFile = path.join(publicDir, "feed.xml");
    const tempFeedFile = feedFile + ".tmp";
    fs.writeFileSync(tempFeedFile, xml);
    fs.renameSync(tempFeedFile, feedFile);
    
    console.log(`[DEBUG] ✅ RSS feed regenerated with ${data.items.length} items at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error(`[ERROR] ❌ Error generating RSS feed: ${error.message}`);
    return false;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("[DEBUG] /health endpoint accessed.");
  const data = loadData();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    dataFile: dataFile,
    itemCount: data.items.length,
    lastModified: data.metadata?.lastModified,
    uptime: process.uptime()
  });
});

// Initialize on startup
console.log("🚀 Starting RSS Newsletter Server...");
console.log(`📁 Data directory: ${dataDir}`);
console.log(`📄 Data file: ${dataFile}`);

initializeDataFile();
generateRSSFeed();

// Routes

// Home route with status information
app.get("/", (req, res) => {
  console.log("[DEBUG] / (home) endpoint accessed.");
  const data = loadData();
  res.send(`
    <h1>📰 RSS Generator is live</h1>
    <p><strong>Feed URL:</strong> <a href="/feed.xml">/feed.xml</a></p>
    <p><strong>API Base:</strong> <a href="/api/feed/">/api/feed/</a></p>
    <p><strong>Health Check:</strong> <a href="/health">/health</a></p>
    <p><strong>Items Count:</strong> ${data.items.length}</p>
    <p><strong>Last Modified:</strong> ${data.metadata?.lastModified || "Unknown"}</p>
    <p><strong>Data File:</strong> ${dataFile}</p>
  `);
});

// Get all feed items
app.get("/api/feed/items", (req, res) => {
  console.log("[DEBUG] /api/feed/items endpoint accessed.");
  const data = loadData();
  res.json({
    success: true,
    items: data.items,
    count: data.items.length,
    metadata: data.metadata
  });
});

// Get single feed item
app.get("/api/feed/items/:id", (req, res) => {
  console.log(`[DEBUG] /api/feed/items/:id (${req.params.id}) endpoint accessed.`);
  const data = loadData();
  const item = data.items.find(item => item.id === req.params.id);
  
  if (!item) {
    console.log(`[DEBUG] Item with ID ${req.params.id} not found.`);
    return res.status(404).json({
      success: false,
      message: "Item not found"
    });
  }
  
  res.json({
    success: true,
    item: item
  });
});

// Add new feed item
app.post("/api/feed/items", (req, res) => {
  console.log("[DEBUG] POST /api/feed/items endpoint accessed.");
  const { title, description, url, author, categories } = req.body;
  
  if (!title || !description || !url) {
    console.log("[DEBUG] Missing required fields for new item.");
    return res.status(400).json({
      success: false,
      message: "Title, description, and URL are required"
    });
  }
  
  const data = loadData();
  const newItem = {
    id: uuidv4(),
    title,
    description,
    url,
    date: new Date().toISOString(),
    author: author || "",
    categories: categories || []
  };
  
  data.items.unshift(newItem); // Add to beginning for newest first
  
  if (saveData(data)) {
    generateRSSFeed();
    console.log(`[DEBUG] New item added and saved: ${newItem.id}`);
    res.status(201).json({
      success: true,
      message: "Item added successfully",
      item: newItem,
      totalItems: data.items.length
    });
  } else {
    console.error("[ERROR] Failed to save new item.");
    res.status(500).json({
      success: false,
      message: "Failed to save item"
    });
  }
});

// Update existing feed item
app.put("/api/feed/items/:id", (req, res) => {
  console.log(`[DEBUG] PUT /api/feed/items/:id (${req.params.id}) endpoint accessed.`);
  const data = loadData();
  const itemIndex = data.items.findIndex(item => item.id === req.params.id);
  
  if (itemIndex === -1) {
    console.log(`[DEBUG] Item with ID ${req.params.id} not found for update.`);
    return res.status(404).json({
      success: false,
      message: "Item not found"
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
    console.log(`[DEBUG] Item updated and saved: ${req.params.id}`);
    res.json({
      success: true,
      message: "Item updated successfully",
      item: data.items[itemIndex]
    });
  } else {
    console.error(`[ERROR] Failed to update item ${req.params.id}.`);
    res.status(500).json({
      success: false,
      message: "Failed to update item"
    });
  }
});

// Delete feed item
app.delete("/api/feed/items/:id", (req, res) => {
  console.log(`[DEBUG] DELETE /api/feed/items/:id (${req.params.id}) endpoint accessed.`);
  const data = loadData();
  const itemIndex = data.items.findIndex(item => item.id === req.params.id);
  
  if (itemIndex === -1) {
    console.log(`[DEBUG] Item with ID ${req.params.id} not found for deletion.`);
    return res.status(404).json({
      success: false,
      message: "Item not found"
    });
  }
  
  const deletedItem = data.items.splice(itemIndex, 1)[0];
  
  if (saveData(data)) {
    generateRSSFeed();
    console.log(`[DEBUG] Item deleted and saved: ${req.params.id}`);
    res.json({
      success: true,
      message: "Item deleted successfully",
      item: deletedItem,
      remainingItems: data.items.length
    });
  } else {
    console.error(`[ERROR] Failed to delete item ${req.params.id}.`);
    res.status(500).json({
      success: false,
      message: "Failed to delete item"
    });
  }
});

// Manually regenerate RSS feed
app.post("/api/feed/regenerate", (req, res) => {
  console.log("[DEBUG] POST /api/feed/regenerate endpoint accessed.");
  if (generateRSSFeed()) {
    const data = loadData();
    res.json({
      success: true,
      message: "RSS feed regenerated successfully",
      itemCount: data.items.length,
      timestamp: new Date().toISOString()
    });
  } else {
    console.error("[ERROR] Failed to regenerate RSS feed via API.");
    res.status(500).json({
      success: false,
      message: "Failed to regenerate RSS feed"
    });
  }
});

// Update feed information
app.put("/api/feed/info", (req, res) => {
  console.log("[DEBUG] PUT /api/feed/info endpoint accessed.");
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
    console.log("[DEBUG] Feed information updated and saved.");
    res.json({
      success: true,
      message: "Feed information updated successfully",
      feedInfo: data.feedInfo
    });
  } else {
    console.error("[ERROR] Failed to update feed information.");
    res.status(500).json({
      success: false,
      message: "Failed to update feed information"
    });
  }
});

// Get feed information
app.get("/api/feed/info", (req, res) => {
  console.log("[DEBUG] GET /api/feed/info endpoint accessed.");
  const data = loadData();
  res.json({
    success: true,
    feedInfo: data.feedInfo,
    metadata: data.metadata
  });
});

// Backup endpoint
app.post("/api/backup", (req, res) => {
  console.log("[DEBUG] POST /api/backup endpoint accessed.");
  try {
    const data = loadData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(dataDir, `backup-${timestamp}.json`);
    
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));
    
    console.log(`[DEBUG] Backup created successfully: ${backupFile}`);
    res.json({
      success: true,
      message: "Backup created successfully",
      backupFile: backupFile,
      timestamp: timestamp
    });
  } catch (error) {
    console.error(`[ERROR] Failed to create backup: ${error.message}`);
    res.status(500).json({
      success: false,
      message: "Failed to create backup",
      error: error.message
    });
  }
});

// Bulk import endpoint
app.post("/api/feed/bulk", (req, res) => {
  console.log("[DEBUG] POST /api/feed/bulk endpoint accessed.");
  const newItems = req.body.items;
  
  if (!Array.isArray(newItems)) {
    return res.status(400).json({
      success: false,
      message: "Expected an array of items in the 'items' property"
    });
  }

  const data = loadData();
  
  // Add new items with validation
  let addedCount = 0;
  const errors = [];
  
  newItems.forEach(item => {
    if (!item.title || !item.description || !item.url) {
      errors.push(`Item missing required fields: ${JSON.stringify(item)}`);
      return;
    }
    
    data.items.unshift({
      id: uuidv4(),
      title: item.title,
      description: item.description,
      url: item.url,
      date: item.date || new Date().toISOString(),
      author: item.author || "",
      categories: item.categories || []
    });
    addedCount++;
  });

  if (saveData(data)) {
    generateRSSFeed();
    console.log(`[DEBUG] Bulk import: added ${addedCount} items, ${errors.length} errors`);
    res.json({
      success: true,
      message: "Bulk import completed",
      addedCount,
      errorCount: errors.length,
      errors: errors.length > 0 ? errors : undefined,
      totalItems: data.items.length
    });
  } else {
    console.error("[ERROR] Failed to save data after bulk import");
    res.status(500).json({
      success: false,
      message: "Failed to save imported items"
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`[ERROR] ❌ Server error: ${err.stack}`);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[DEBUG] 404: Endpoint not found for ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: "Endpoint not found",
    availableEndpoints: [
      "GET /",
      "GET /health",
      "GET /feed.xml",
      "GET /api/feed/items",
      "POST /api/feed/items",
      "PUT /api/feed/items/:id",
      "DELETE /api/feed/items/:id",
      "GET /api/feed/info",
      "PUT /api/feed/info",
      "POST /api/feed/regenerate",
      "POST /api/backup",
      "POST /api/feed/bulk"
    ]
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received, shutting down gracefully...");
  process.exit(0);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📰 RSS feed available at: http://localhost:${PORT}/feed.xml`);
  console.log(`🔧 API endpoints available at: http://localhost:${PORT}/api/feed/`);
  console.log(`💚 Health check available at: http://localhost:${PORT}/health`);
  console.log(`📁 Using data directory: ${dataDir}`);
  console.log(`📄 Using data file: ${dataFile}`);
  console.log(`[DEBUG] Server started at ${new Date().toISOString()}`);
})
