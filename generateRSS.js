// File: generateRSS.js import fs from "fs"; import { XMLBuilder } from "fast-xml-parser";

const siteUrl = "https://jonathan-harris.online"; const episodes = JSON.parse(fs.readFileSync("./feed.json"));

const rss = { rss: { "@_version": "2.0", "@_xmlns:itunes": "http://www.itunes.com/dtds/podcast-1.0.dtd", channel: { title: "Turing's Torch: AI Weekly", link: siteUrl, description: "Weekly AI news with sarcasm and smarts.", language: "en-gb", "itunes:author": "Jonathan Harris", "itunes:image": { "@_href": ${siteUrl}/cover.jpg }, item: episodes.map(ep => ({ title: ep.title, description: ep.description, pubDate: ep.pubDate, guid: ep.guid, enclosure: { "@_url": ep.audioUrl, "@_length": "0", "@_type": "audio/mpeg" }, "itunes:duration": ep.duration.toString() })) } } };

const builder = new XMLBuilder({ ignoreAttributes: false }); const xml = builder.build(rss); fs.writeFileSync("./feed.xml", xml);

