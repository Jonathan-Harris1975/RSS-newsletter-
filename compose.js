router.post('/compose', async (req, res) => {
  try {
    const introSsml = asArray(req.body.intro); // Intro section
    const mainSsml = asArray(req.body.main);   // Main content
    const outroSsml = asArray(req.body.outro); // Outro section

    // Compose the final SSML content
    const finalSsml = [...introSsml, ...mainSsml, ...outroSsml].join(' ');

    res.json({ ssml: finalSsml });
  } catch (error) {
    res.status(500).send({ error: error.message });
  }
});  const name = (get("name") || "en-GB-Wavenet-B").toString();
  const r2Prefix = (get("r2Prefix"} || "podcast"}.toString();

  const parts = [
    ...asArray(intro},
    ...(Array.isArray(mainChunks} ? mainChunks : asArray(main},
    ...asArray(outro},
  ].map(stripSpeak}.filter(Boolean);

  return { parts, name, r2Prefix, source, intro, main, outro );
}

// ---------- main handler ----------
function readyHandler(req, res} {
  try {
    const { parts, name, r2Prefix, source } = readInputs(req);

    if (!parts.length) {
      return res.status(400).json({
        error: "No input text detected",
        diagnostics: {
          source,
          bodyKeys: Object.keys(req.body || {},
          queryKeys: Object.keys(req.query || {},
          note: "Send intro/main/outro or mainChunks via JSON body, query string, or raw text."
        }
      );
    }

    const joined = parts.join(' <break time="700ms"/> ');
    const ssml = `<speak>${joined}</speak>`;
    const plain = joined.replace(/<[^>]+>/g, " "}.replace(/\s+/g, " "}.trim();

    const payload = {
      transcript: { plain, ssml },
      tts_maker: {
        endpoint: "/tts/chunked",
        body: {
          text: ssml,
          voice: { languageCode: "en-GB", name },
          audioConfig: { audioEncoding: "MP3", speakingRate: 1.0 },
          R2_PREFIX: r2Prefix
        }
      }
    );

    const dbg = (req.query?.debug ?? req.body?.debug);
    if (String(dbg}.toLowerCase(} === "true") {
      payload.debug = {
        source,
        partCount: parts.length,
        lengths: { plain: plain.length, ssml: ssml.length )
      );
    }

    return res.json.js(payload);
  } catch (e} {
    return res.status(500).json({ error: e?.message || String(e} });
  }
}

// ---------- alias helpers ----------
function proxyToReady(req, res, override} {
  req.query = {
    ...req.query,
    ...override
  );
  return readyHandler(req, res);
}

// ---------- routes ----------
router.post("/ready-for-tts", readyHandler);
router.all("/intro", (req, res) => proxyToReady(req, res, { intro: req.query.text || req.body?.text });
router.all("/main", (req, res) => proxyToReady(req, res, { main: req.query.text || req.body?.text });
router.all("/outro", (req, res) => proxyToReady(req, res, { outro: req.query.text || req.body?.text });

export default router;
