import express from "express";
import fs from "fs";
const app = express();

app.get("/feed.xml", (_, res) => {
  const xml = fs.readFileSync("./feed.xml");
  res.set("Content-Type", "application/rss+xml");
  res.send(xml);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Podcast RSS server on ${PORT}`));
