const fs = require('fs');
const path = require('path');
const RSS = require('rss');

const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir);
}

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
  description: 'Curated AI and tech news, rewritten for clarity',
  feed_url: 'https://rss-feeds.jonathan-harris.online/ai-news',
  site_url: 'https://www.jonathan-harris.online',
  language: 'en',
  pubDate: new Date().toISOString()
});

items.forEach(item => {
  feed.item({
    title: item.title,
    description: item.description,
    url: item.url,
    date: item.date
  });
});

const xml = feed.xml({ indent: true });
fs.writeFileSync(path.join(publicDir, 'feed.xml'), xml);
console.log('✅ RSS feed generated');
