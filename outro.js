import { openai } from '../services/openai';
import { outroPrompt } from '../promptTemplates';
import fs from 'fs';
import path from 'path';

router.post('/', async (req, res) => {
  try {
    const booksPath = path.join(__dirname, '..', 'data', 'books.json.js');
    const booksData = JSON.parse(fs.readFileSync(booksPath, 'utf-8'));
    const sponsorBook = booksData[Math.floor(Math.random() * booksData.length)];

    const prompt = outroPrompt.replace("{{book_title}}", sponsorBook.title)
                              .replace("{{book_url}}", sponsorBook.url);

    // Call OpenAI API
    const response = await openai.completions.create({
      model: 'text-davinci-003',
      prompt: prompt,
      max_tokens: 150
    });

    const ssmlResponse = ensureSpeak(response.choices[0].text);
    res.json({ ssml: ssmlResponse });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
