import { getWeatherSummary } from '../services/weather';
import { openai } from '../services/openai';
import { introPrompt } from '../promptTemplates';

router.post('/', async (req, res) => {
  try {
    const weatherSummary = await getWeatherSummary(req.body.date);
    const randomQuote = getRandomQuote();  // Function to fetch a random quote
    const prompt = introPrompt.replace("{{weather_summary}}", weatherSummary)
                              .replace("{{random_quote}}", randomQuote);

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
});p
