import fs from 'fs-extra';

const items = await fs.readJson('./feed-data.json');

let rssItems = items.map(item => `
  <item>
    <title><![CDATA[${item.title}]]></title>
    <link>${item.link}</link>
    <pubDate>${new Date(item.pubDate).toUTCString()}</pubDate>
    <description><![CDATA[${item.description}]]></description>
  </item>`).join('\n');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Jonathan Harris AI News</title>
  <link>https://www.jonathan-harris.online</link>
  <description>Curated AI and tech news, rewritten for clarity</description>
  ${rssItems}
</channel>
</rss>`;

fs.writeFileSync('./public/rss.xml', rss);
