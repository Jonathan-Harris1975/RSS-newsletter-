import './Keepalive.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import introRouter from './routes/intro.js';
import outroRouter from './routes/outro.js';
import mainRouter from './routes/main.js';
import composeRouter from './routes/compose.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/intro', introRouter);
app.use('/outro', outroRouter);
app.use('/main', mainRouter);
app.use('/compose', composeRouter);

// ✅ Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: Date.now() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🎙️ Server running on port ${PORT}`));
