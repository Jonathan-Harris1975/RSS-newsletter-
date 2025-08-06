# PSG main-first (RSS-aware)

## Endpoints
- GET  /healthz
- ALL  /compose/main    # accepts { "prompt": "..." } OR { "prompt": { rssFeedUrl, prompt, maxItems, maxAgeDays } }
- ALL  /compose/intro   # { "prompt": "..." }
- ALL  /compose/outro   # { "prompt": "..." }
- POST /compose/ready-for-tts  # { intro, main, outro, name, r2Prefix }

## Make: MAIN from RSS object
POST /compose/main
Content-Type: application/json
{
  "prompt": {
    "rssFeedUrl": "https://example.com/feed.rss",
    "prompt": "Gemini 2.5; Informatica 5-minute mapping; privacy change.",
    "maxItems": 5,
    "maxAgeDays": 7
  },
  "name": "en-GB-Wavenet-B",
  "r2Prefix": "podcast"
}


## Config
Set per-endpoint model and temperature via env:
- `OPENAI_MODEL_INTRO`, `OPENAI_TEMP_INTRO`
- `OPENAI_MODEL_MAIN`,  `OPENAI_TEMP_MAIN`
- `OPENAI_MODEL_OUTRO`, `OPENAI_TEMP_OUTRO`

## Usage
- `POST /intro`  { "prompt": "..." }
- `POST /main`   { "prompt": "..." } or { "prompt": { "rssFeedUrl": "...", "prompt": "...", "maxItems": 5, "maxAgeDays": 7 } }
- `POST /outro`  { "prompt": "..." }
- Back-compat: `/compose/intro|main|outro` accept { "text": "..." } as well.



## API Endpoints

### Health Check
**GET** `/health`  
Returns `200 OK` if the server is running.

### Generate Episode (`/generate`)
**POST** `/generate`  
Generates a full podcast episode with:
- Title & Description prompt
- SEO Keywords prompt
- Artwork prompt
- Cleaned transcript
- TTS text chunks (≤4500 characters each)

Example payload:
```json
{
  "newsItems": "string with news items",
  "episodeSummary": "string with full episode text"
}
```

### Main AI Summary (`/main`)
**POST** `/main`  
Processes RSS feed articles using your chosen prompt, style, and limits.

Example payload:
```json
{
  "rssFeedUrl": "https://rss-feeds.jonathan-harris.online/ai-news",
  "prompt": "Rewrite each AI news summary as a standalone podcast segment. Tone: intelligent, sarcastic British Gen X — dry wit, cultural commentary, and confident delivery.",
  "temperature": 0.70,
  "maxItems": 30,
  "maxAgeDays": 7,
  "return": "merged"
}
```

### Intro (`/intro`)
**POST** `/intro`  
Generates an introduction for your episode.

### Outro (`/outro`)
**POST** `/outro`  
Generates an outro for your episode.

### Compose (`/compose`)
**POST** `/compose`  
Combines intro, main, and outro into a single episode.

### LLM Proxy (`/_llm`)
**POST** `/_llm`  
Directly interacts with the AI model using custom prompts.
