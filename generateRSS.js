
const fs = require('fs');
const path = require('path');
const RSS = require('rss');

const items = [
  {
    title: "Example title",
    description: "This is an example article.",
    url: "https://example.com/article",
    date: new Date().toISOString()
  }
];

const feed = new RSS({
  title: 'Jonathan Harris AI News',
  description: 'Curated AI and automation insights',
  feed_url: 'http://example.com/rss.xml',
  site_url: 'http://example.com'
});

items.forEach(item => feed.item(item));

fs.writeFileSync(path.join(__dirname, 'feeds', 'feed.xml'), feed.xml({ indent: true }));
