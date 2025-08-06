PATCH CONTENTS
==============
- index.js          -> maps /main and /intro to /generate; keeps dedicated /outro so sponsor is always appended
- routes/outro.js   -> sponsor-aware outro; returns plain text { text: "..." }
- data/sponsors.txt -> example sponsor lines; service will also read SPONSOR_TEXT or SPONSORED_BY env if set

DEPLOY STEPS
------------
1) Replace these files in your repo.
2) Ensure you still have routes/generate.js and services/openai.js present (unchanged).
3) Optionally set SPONSOR_TEXT env to override file-based pick.
4) Redeploy and test:

   curl -s https://<host>/outro -H "Content-Type: application/json" -d '{"prompt":"Tight outro with CTA"}'

   curl -s https://<host>/intro -H "Content-Type: application/json" -d '{"prompt":"Short intro"}'
   curl -s https://<host>/main  -H "Content-Type: application/json" -d '{"prompt":"Main body brief"}'

Legacy Make.com routes still work:
   POST /compose/intro|main -> routed to /generate
   POST /compose/outro      -> dedicated sponsor-aware outro
