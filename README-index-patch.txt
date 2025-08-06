WHAT CHANGED
============
This index.js maps your legacy endpoints to the new plain-text generator so calls to
/main, /intro, /outro, and their /compose/* variants all route through /generate.

Endpoints:
  - POST /generate          { "prompt": "...", "mode": "intro|main|outro" (optional) }
  - POST /main              { "prompt": "..." }  -> mode=main
  - POST /intro             { "prompt": "..." }  -> mode=intro
  - POST /outro             { "prompt": "..." }  -> mode=outro
  - POST /compose/main      { "text"   : "..." } -> mode=main
  - POST /compose/intro     { "text"   : "..." } -> mode=intro
  - POST /compose/outro     { "text"   : "..." } -> mode=outro

Health:
  - GET /healthz -> "ok"

Drop this file into your repo root (replace existing index.js), commit, and redeploy.
