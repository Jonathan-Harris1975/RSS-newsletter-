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

// CORS middleware
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// Data storage configuration
const defaultDataDir = path.join(__dirname, "data");
const dataDir = process.env.DATA_DIR || defaultDataDir;
const dataFile = path.join(dataDir, "feed-data.json");

// Ensure data directory exists
function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log(`Created data directory: ${dataDir}`);
  }
}

// Initialize data file
function initializeDataFile() {
  ensureDataDirectory();
  
  if (!fs.existsSync(dataFile)) {
    const initialData = {
      feedInfo: {
        title: "Jonathan Harris AI News",
        description: "Curated AI and tech news, rewritten for clarity",
        feed_url: "https://rss-feeds.jonathan-harris.online/ai-news",
        site_url: "https://www.jonathan-harris.online",
        language: "en"
      },
      items: [],
      metadata: {
        created: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        version: "1.0.0"
      }
    };
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
    console.log(`Initialized new data file: ${dataFile}`);
  } else {
    console.log(`Using existing data file: ${dataFile}`);
  }
}

// Load data with error handling
function loadData() {
  try {
    const rawData = fs.readFileSync(dataFile, "utf8");
    const data = JSON.parse(rawData);
    
    // Validate data structure
    if (!data.items || !Array.isArray(data.items)) {
      throw new Error("Invalid data structure: items array missing");
    }
    
    return data;
  } catch (error) {
    console.error(`Error loading data: ${error.message}`);
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

// Save data with backup and atomic write
function saveData(data) {
  try {
    // Create backup
    const backupFile = `${dataFile}.backup-${Date.now()}`;
    if (fs.existsSync(dataFile)) {
      fs.copyFileSync(dataFile, backupFile);
    }

    // Update metadata
    data.metadata = data.metadata || {};
    data.metadata.lastModified = new Date().toISOString();
    data.metadata.version = data.metadata.version || "1.0.0";

    // Atomic write
    const tempFile = `${dataFile}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
    fs.renameSync(tempFile, dataFile);

    return true;
  } catch (error) {
    console.error(`Error saving data: ${error.message}`);
    return false;
  }
}

// Generate RSS feed
function generateRSSFeed() {
  try {
    const data = loadData();
    const publicDir = path.join(__dirname, "public");
    
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }

    const feed = new RSS({
      title: data.feedInfo.title,
      description: data.feedInfo.description,
      feed_url: data.feedInfo.feed_url,
      site_url: data.feedInfo.site_url,
      language: data.feedInfo.language,
      pubDate: new Date().toISOString(),
      generator: "RSS Newsletter Generator"
    });

    // Add items sorted by date (newest first)
    data.items
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .forEach(item => {
        feed.item({
          title: item.title,
          description: item.description,
          url: item.url,
          guid: item.id,
          date: item.date,
          author: item.author,
          categories: item.categories || []
        });
      });

    const xml = feed.xml({ indent: true });
    fs.writeFileSync(path.join(publicDir, "feed.xml"), xml);
    return true;
  } catch (error) {
    console.error(`Error generating RSS feed: ${error.message}`);
    return false;
  }
}

// Health check endpoint
app.get("/health", (req, res) => {
  const data = loadData();
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    dataFile: dataFile,
    itemCount: data.items.length,
    lastModified: data.metadata.lastModified,
    uptime: process.uptime()
  });
});

// Initialize on startup
initializeDataFile();
generateRSSFeed();

// API Endpoints
app.post("/api/feed/items", (req, res) => {
  const { title, description, url, author, categories } = req.body;
  
  // Validation
  if (!title || !description || !url) {
    return res.status(400).json({
      success: false,
      message: "Title, description, and URL are required"
    });
  }

  const data = loadData();
  
  // Check for duplicate URL
  if (data.items.some(item => item.url === url)) {
    return res.status(400).json({
      success: false,
      message: "An item with this URL already exists"
    });
  }

  const newItem = {
    id: uuidv4(),
    title,
    description,
    url,
    date: new Date().toISOString(),
    author: author || "",
    categories: categories || []
  };

  data.items.unshift(newItem);
  
  if (saveData(data)) {
    generateRSSFeed();
    res.status(201).json({
      success: true,
      message: "Item added successfully",
      item: newItem
    });
  } else {
    res.status(500).json({
      success: false,
      message: "Failed to save item"
    });
  }
});

// Other endpoints (GET, PUT, DELETE) remain the same as before...

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`RSS feed: http://localhost:${PORT}/feed.xml`);
  console.log(`API docs: http://localhost:${PORT}/api-docs`);
});
