import express from 'express';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/newsletter', (req, res) => {
  try {
    const rawData = fs.readFileSync('./data/newsletter.json');
    const items = JSON.parse(rawData);

    const rssItems = items.map(item => {
      const isoDate = new Date(item.date).toISOString();
      return `
        <item>
          <title><![CDATA[${item.title}]]></title>
          <link>${item.url}</link>
          <pubDate>${isoDate}</pubDate>
          <description><![CDATA[${item.summary}]]></description>
          <guid isPermaLink="false">${item.url}</guid>
        </item>
      `;
    }).join('');

    const rssFeed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Jonathan Harris AI Newsletter</title>
    <link>https://www.jonathan-harris.online</link>
    <atom:link href="https://rss-feeds.jonathan-harris.online/newsletter" rel="self" type="application/rss+xml" />
    <description>Witty, insightful takes on the world of AI — every day 
  in your inbox.</description>
    ${rssItems}
  </channel>
</rss>`;

    res.set('Content-Type', 'application/rss+xml');
    res.send(rssFeed);
  } catch (err) {
    console.error('Error generating newsletter RSS:', err);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`📮 Newsletter RSS server running on port ${PORT}`);
});
