import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simulated article content (replace with real JSON or fetch logic)
const items = [
  {
    title: "Google’s AI just embarrassed itself again",
    link: "https://jonathan-harris.online/article/google-flop",
    pubDate: new Date().toISOString(),
    description: "Turns out giving a chatbot access to your calendar doesn't mean it can schedule your meetings like an adult. Who knew?"
  },
  {
    title: "Musk rants, OpenAI profits",
    link: "https://jonathan-harris.online/article/musk-openai",
    pubDate: new Date().toISOString(),
    description: "Elon’s still fuming. Meanwhile, OpenAI just made another billion. Not awkward at all."
  }
];

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Jonathan Harris AI News</title>
  <link>https://www.jonathan-harris.online</link>
  <description>Curated AI and tech news, rewritten for clarity</description>
  ${items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${item.link}</link>
      <pubDate>${item.pubDate}</pubDate>
      <description><![CDATA[${item.description}]]></description>
    </item>
  `).join('\n')}
</channel>
</rss>`;

// Output file to public folder or memory
fs.writeFileSync(path.join(__dirname, 'feed.xml'), rss, 'utf-8');
console.log('✅ RSS feed generated at /feed.xml');
