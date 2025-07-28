
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const feedsDir = path.join(__dirname, 'feeds');
if (!fs.existsSync(feedsDir)) {
  fs.mkdirSync(feedsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, feedsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(express.static('feeds'));

app.post('/upload', upload.single('rssfile'), (req, res) => {
  res.send('Feed uploaded and saved successfully.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
