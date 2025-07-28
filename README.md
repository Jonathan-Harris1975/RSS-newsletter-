# RSS Feed Generator with API

A Node.js Express server that generates RSS feeds and provides a RESTful API for managing feed items dynamically.

## Features

- **Dynamic RSS Feed Generation**: Automatically generates RSS XML at `/feed.xml`
- **RESTful API**: Full CRUD operations for feed items
- **Persistent Storage**: JSON file-based storage for feed data
- **CORS Support**: Cross-origin requests enabled for integration
- **Auto-regeneration**: RSS feed updates automatically when items change

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The server will run on port 3000 by default (or PORT environment variable).

## API Endpoints

### Feed Items

#### GET /api/feed/items
Get all feed items.

**Response:**
```json
{
  "success": true,
  "items": [...],
  "count": 5
}
```

#### GET /api/feed/items/:id
Get a specific feed item by ID.

#### POST /api/feed/items
Add a new feed item.

**Request Body:**
```json
{
  "title": "Article Title",
  "description": "Article description or summary",
  "url": "https://example.com/article",
  "author": "Author Name (optional)",
  "categories": ["category1", "category2"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Item added successfully",
  "item": {...}
}
```

#### PUT /api/feed/items/:id
Update an existing feed item.

**Request Body:** Same as POST, all fields optional.

#### DELETE /api/feed/items/:id
Delete a feed item.

### Feed Information

#### GET /api/feed/info
Get RSS feed metadata.

#### PUT /api/feed/info
Update RSS feed metadata.

**Request Body:**
```json
{
  "title": "Feed Title",
  "description": "Feed Description",
  "feed_url": "https://example.com/feed.xml",
  "site_url": "https://example.com",
  "language": "en"
}
```

### Utility

#### POST /api/feed/regenerate
Manually trigger RSS feed regeneration.

## RSS Feed

The RSS feed is available at `/feed.xml` and updates automatically when items are modified through the API.

## Integration Examples

### Adding an item via cURL:
```bash
curl -X POST http://localhost:3000/api/feed/items \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Article",
    "description": "This is a new article",
    "url": "https://example.com/new-article",
    "author": "John Doe",
    "categories": ["Tech", "News"]
  }'
```

### Integration with Make.com
This API is designed to work seamlessly with Make.com (formerly Integromat) for automation:

1. **Webhook Trigger**: Set up a webhook in Make.com to receive data
2. **HTTP Module**: Use the HTTP module to POST data to `/api/feed/items`
3. **Data Transformation**: Map incoming data to the required JSON structure
4. **Error Handling**: Check the `success` field in responses

### Example Make.com Scenario:
1. **RSS Module**: Monitor external RSS feeds
2. **Filter**: Process only new items
3. **HTTP Request**: POST to your RSS API
4. **Email/Slack**: Notify on successful addition

## Data Storage

Feed data is stored in `feed-data.json` with the following structure:

```json
{
  "feedInfo": {
    "title": "Feed Title",
    "description": "Feed Description",
    "feed_url": "https://example.com/feed.xml",
    "site_url": "https://example.com",
    "language": "en"
  },
  "items": [
    {
      "id": "uuid-here",
      "title": "Article Title",
      "description": "Article description",
      "url": "https://example.com/article",
      "date": "2025-01-26T10:00:00.000Z",
      "author": "Author Name",
      "categories": ["category1", "category2"]
    }
  ]
}
```

## Deployment

The application includes Docker support and can be deployed to various platforms:

- **Render**: Use the included `render.yaml`
- **Docker**: Use the included `Dockerfile`
- **Heroku**: Works out of the box
- **Vercel/Netlify**: For serverless deployment

## CORS

Cross-origin requests are enabled by default, allowing integration from any domain. This is essential for Make.com and other automation tools.

## Error Handling

All API endpoints return consistent JSON responses with `success` boolean and appropriate HTTP status codes:

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Server Error

