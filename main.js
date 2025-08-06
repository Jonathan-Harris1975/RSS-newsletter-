import { fetchRssItems } from '../services/rss';
import { openai } from '../services/openai';
import { mainPrompt } from '../promptTemplates';

router.post('/', async (req, res) => {
  try {
    const rssItems = await fetchRssItems(req.body.rssUrl);  // Fetch RSS items
    
    // Chunk RSS items if too many for prompt length
    const MAX_ITEMS_PER_CHUNK = 8; // adjust as needed
    const rssChunks = [];
    for (let i = 0; i < rssItems.length; i += MAX_ITEMS_PER_CHUNK) {
      rssChunks.push(rssItems.slice(i, i + MAX_ITEMS_PER_CHUNK));
    }
    // Generate prompts for each chunk
    const allResponses = [];
    for (const chunk of rssChunks) {
      
    // Character-based chunking for prompt safety
    const MAX_CHARS_PER_CHUNK = 10000;
    const rssChunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const item of rssItems) {
      const itemLength = item.length + 1; // include newline separator
      if (currentLength + itemLength > MAX_CHARS_PER_CHUNK && currentChunk.length > 0) {
        rssChunks.push(currentChunk);
        currentChunk = [];
        currentLength = 0;
      }
      currentChunk.push(item);
      currentLength += itemLength;
    }
    if (currentChunk.length > 0) {
      rssChunks.push(currentChunk);
    }

    // Generate AI responses for each chunk
    const allResponses = [];
    for (const chunk of rssChunks) {
      const promptText = req.body.prompt || mainPrompt;
      const prompt = promptText.replace("{{rss_items}}", chunk.join('
'));
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: req.body.temperature ?? 0.7
      });
      allResponses.push(response.choices[0].message.content);
    }

    // Return based on 'return' param
    if (req.body.return === "merged") {
      return res.json({ summaries: [allResponses.join("
")] });
    } else {
      return res.json({ summaries: allResponses });
    }


  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});
    if (rssFeedUrl){
      const all = await fetchRssItems(rssFeedUrl);
      const filtered = all.filter(i=>withinAge(i.pubDate, maxAgeDays||0});
      const limited = (maxItems&&Number(maxItems}>0}?filtered.slice(0,Number(maxItems}:filtered;
      stories = limited.map(i=>[ (i.title||''}.trim(}, (i.description||''}.replace(/<[^>]+>/g,''}.trim(}, (i.url||''}.trim(} ].filter(Boolean}.join(' — '}.filter(Boolean);
    }
    if (!stories.length && Array.isArray(req.body?.stories}&&req.body.stories.length}{
      stories = req.body.stories.map(s=>String(s).trim().filter(Boolean);
    }
    if (!stories.length && Array.isArray(req.body?.articles}&&req.body.articles.length}{
      stories = req.body.articles.map(a=>[ (a.title||''}.trim(}, (a.description||a.summary||''}.trim(}, (a.url||a.link||''}.trim(} ].filter(Boolean).join(' — ').filter(Boolean);
    }
    if (!stories.length && typeof req.body?.text==='string'}{
      const delim = (req.body.delimiter && String(req.body.delimiter} || '\n\n';
      stories = String(req.body.text}.split(delim).map(s=>s.trim().filter(Boolean);
    }
    if (!stories.length){
      return res.status(400).json({ error:'No stories found. Provide {"rssFeedUrl": "..."} or {"stories":[...]} or {"articles":[...]} or {"text":"..."}' );
    }

    const userPrompt = prompt || 'Rewrite each item into a podcast segment. Tone: British Gen X, confident, dry wit. Each segment should sound natural and flow.';
    const temp = (typeof temperature==='number'}?temperature:0.8;
    const ssmlRules = ' For each item, produce one SSML chunk. Wrap with <speak>...</speak>. Say "AI" as <say-as interpret-as="characters">A I</say-as>. Use <emphasis> and <break time="600ms"/> naturally. Each chunk must be JSON-safe, single-line (no raw newlines}, and under 4800 characters. Output ONLY the SSML chunks, one per line. Do NOT output JSON, arrays, brackets, or quotes.';
    const finalPrompt = userPrompt + ssmlRules + '\n\nItems:\n- ' + stories.join('\n- ');

    const completion = await openai.chat.completions.create({
      model:'gpt-4o-mini',
      messages:[{ role:'user', content: finalPrompt }],
      temperature: temp
    });
    const raw = (completion.choices?.[0]?.message?.content || ''}.trim();
    const extracted = extractSpeakChunks(raw}.map(oneLine}.map(ensureSpeak}.filter(Boolean);

    if (returnMode==='merged'}{
      const bodies = extracted.map(c=>c.replace(/^<speak>/,'').replace(/<\/speak>$/,'');
      const merged = `<speak>${bodies.join(' <break time="700ms"/> '}</speak>`;
      return res.json.js({ ssml: merged });
    }
    return res.json.js({ chunks: extracted });
  }catch(err}{
    console.error('Main generation failed:', err);
    res.status(500).json({ error:'Main generation error', details: err.message });
  }
});

router.post('/merge', (req,res}=>{
  try{
    const body = req.body || {);
    let chunks = [];
    if (Array.isArray(body.chunks}&&body.chunks.length){
      chunks = body.chunks.map(oneLine).filter(Boolean);
    } else if (typeof body.text === 'string'){
      const matches = body.text.match(/<speak>[\s\S]*?<\/speak>/g) || [];
      chunks = matches.map(oneLine);
    } else {
      return res.status(400).json({ error:'Provide {"chunks":[ "<speak>..</speak>", ... ]} or {"text":"<speak>..</speak>..."}' });
    }
    if (!chunks.length) return res.status(400).json({ error:'No chunks to merge' );
    const bodies = chunks.map(c=>oneLine(c}.replace(/^<speak>/,''}.replace(/<\/speak>$/,''});
    const mergedBody = bodies.join(' <break time="700ms"/> ');
    const final = `<speak>${oneLine(mergedBody}</speak>`;
    res.json.js({ ssml: final });
  }catch(err}{
    console.error('Main merge failed:', err);
    res.status(500).json({ error:'Main merge error', details: err.message });
  }
});

export default = router;
