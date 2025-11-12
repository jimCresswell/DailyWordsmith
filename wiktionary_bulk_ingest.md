
# Wiktionary Bulk Extraction & Ingest Plan  
**Audience:** Replit AI agent building an English word–based education app  
**Date:** 2025-11-12

This document describes a production‑grade approach to fetch {{ "pronunciation", "meaning/definitions", "etymology", "example usage (optional)" }} for an **input list of English words** from **Wiktionary**, and to ingest the results into your app’s datastore. It prioritises correctness, resilience, and compliance with Wikimedia licensing and usage guidelines.

---

## 1) What to fetch & from where

### Primary sources
- **MediaWiki REST API (preferred for JSON):**  
  - `GET https://en.wiktionary.org/api/rest_v1/page/definition/{{word}}` → Definitions by language, often with structured senses and examples.  
  - `GET https://en.wiktionary.org/api/rest_v1/page/title/{{word}}` → Basic page metadata (existence, redirects).
- **MediaWiki Action API (fallback / power‑queries):**  
  - `GET https://en.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&titles={{word}}&format=json` → Raw wikitext to mine for etymology/pronunciation if REST is incomplete.
- **Bulk/Offline path (for very large throughput):**  
  - **Wiktionary dumps** (e.g., `enwiktionary-latest-pages-articles.xml.bz2`).  
  Use when you need to process hundreds of thousands of words without live API latency or when you must re‑parse regularly at scale.

### Notes on fields
- **Pronunciation**: May appear as IPA templates or audio references; REST definitions sometimes include pronunciation; otherwise parse wikitext from Action API or dumps.
- **Meaning/Definitions**: REST `/page/definition` is usually the most structured entry point.
- **Etymology**: Often present but not uniformly structured; typically extracted from wikitext sections titled “Etymology”, “Etymology 1/2…”.
- **Examples (optional)**: If present, REST definitions often carry usage examples within senses; otherwise parse sense lines from wikitext.

---

## 2) High‑level pipeline

```
word_list (input)
  └─► normalise (Unicode NFC, lowercase for lookup, keep original case for display)
      └─► deduplicate
          └─► fetch (REST; fallback to Action API)
              └─► parse (pronunciation | senses | etymology | examples)
                  └─► enrich (language=English filter; map POS; collapse variants)
                      └─► store (Upsert to DB; cache raw + parsed)
                          └─► validate (schema + business rules)
                              └─► publish (API/GraphQL/JSON for app)
                                  └─► attribute (attach source URL + license)
```

Key principles:
- **Idempotent**: Safe to re‑run.
- **Deterministic**: Same inputs → same outputs (aside from upstream edits).
- **Observable**: Metrics, logs, traces, and per‑word status.

---

## 3) API etiquette, rate limiting, and resilience

To be a good API citizen and avoid throttling:

- **Identify your client**: Always send a descriptive `User-Agent` including contact URL/email.
- **Conservative concurrency**: Default **1–2 requests/sec** with **burst control** (token bucket). Allow runtime tuning.
- **Backoff on 429/5xx**: Exponential backoff with jitter; e.g., base=1.0s, factor=2.0, cap=60s.
- **Retry policy**: Safe to retry **GET** on 429/503/timeout up to 5 attempts.
- **Caching**:
  - Use HTTP caching (`ETag`, `If-None-Match`; `Last-Modified`, `If-Modified-Since`) when available.
  - **Local cache** (e.g., Redis) for recent lookups.
  - **Persistent raw cache** (S3/GCS) of fetched JSON/wikitext for reproducibility.
- **Batching**: Prefer single‑word calls to REST `/definition` (no bulk endpoint); batch at the scheduler level, not the HTTP request.
- **Timeouts**: Client‑side timeouts (e.g., 10s connect, 30s read).
- **Robust normalisation**: Map input word → canonical page title (handle spaces/underscores; decode; redirects).
- **Language filter**: Wiktionary is multilingual—filter for `language == "English"` in REST results or restrict to English sections in wikitext.

---

## 4) Data model (storage schema)

A pragmatic JSON (or relational) schema per **lemma**:

```json
{{
  "word": "example",
  "source": {{
    "wiktionary_url": "https://en.wiktionary.org/wiki/example",
    "retrieved_at": "2025-11-12T10:00:00Z",
    "license": "CC BY-SA 3.0",
    "attribution_html": "<a href=\"https://en.wiktionary.org/wiki/example\">“example”</a> from Wiktionary (CC BY-SA 3.0)"
  }},
  "entries": [
    {{
      "language": "English",
      "part_of_speech": "noun",
      "pronunciations": [
        {{ "ipa": "/ɪɡˈzɑːmpəl/", "audio": "https://..." }}
      ],
      "etymology": "From Middle English ...",
      "senses": [
        {{
          "definition": "Something that serves as a pattern or model.",
          "examples": [
            "This is an example of good practice."
          ]
        }}
      ]
    }}
  ]
}}
```

**Notes**
- Keep **raw upstream** alongside parsed (e.g., `raw.rest.definition`, `raw.action.wikitext`) to allow re‑parsing as your extractor improves.
- Track **provenance** at the sense level if you merge from multiple sources.

---

## 5) Extraction strategies

### A) REST‑first parsing
1. `GET /api/rest_v1/page/definition/{{word}}`  
2. From the response:
   - Filter to `language == "English"`.
   - For each part of speech, extract **definitions** and **examples**.
   - Capture any **pronunciation** fields if present.
3. Build source URL: `https://en.wiktionary.org/wiki/{{urlencode(word)}}`

### B) Action API fallback (for pronunciation & etymology gaps)
1. `GET /w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles={{word}}`  
2. Parse wikitext sections:
   - `==English==`
   - `===Etymology===` or `===Etymology 1===`, etc.
   - Pronunciation templates (e.g., `{{IPA|...}}`, `{{enPR|...}}`, audio `[[File:...]]`).
3. Prefer **template‑aware parsing** (regex is brittle). Consider a wikitext parser.

### C) Dumps path (for very large lists)
- Download the latest **enwiktionary** pages‑articles dump.
- Stream parse (avoid full decompression in memory).
- Emit the same schema as online extraction.
- Advantage: consistent snapshot, no rate limits; cost: compute + complexity.

---

## 6) Implementation blueprint (pseudo‑code)

### HTTP client
```python
import httpx, asyncio, random, time

UA = "YourAppName/1.0 (contact: you@example.com)"

class RateLimiter:
    def __init__(self, rps=1.5, burst=4):
        self.tokens = burst
        self.burst = burst
        self.refill = rps
        self.last = time.monotonic()
    async def acquire(self):
        while True:
            now = time.monotonic()
            self.tokens = min(self.burst, self.tokens + (now - self.last) * self.refill)
            self.last = now
            if self.tokens >= 1:
                self.tokens -= 1
                return
            await asyncio.sleep(0.05)

async def get_json(client, url, params=None, etag=None, last_modified=None, max_retries=5):
    headers = {{"User-Agent": UA}}
    if etag: headers["If-None-Match"] = etag
    if last_modified: headers["If-Modified-Since"] = last_modified
    backoff = 1.0
    for attempt in range(max_retries):
        try:
            r = await client.get(url, params=params, headers=headers, timeout=30.0)
            if r.status_code == 304:
                return {{ "status": "not_modified" }}
            if r.status_code in (429, 503, 502):
                await asyncio.sleep(backoff + random.random())
                backoff = min(60.0, backoff * 2)
                continue
            r.raise_for_status()
            return r.json()
        except (httpx.HTTPError, httpx.ReadTimeout):
            await asyncio.sleep(backoff + random.random())
            backoff = min(60.0, backoff * 2)
    raise RuntimeError("Max retries exceeded")
```

### Orchestrator
```python
REST_DEF = "https://en.wiktionary.org/api/rest_v1/page/definition/{word}"
ACTION_Q = "https://en.wiktionary.org/w/api.php"

async def fetch_word(word, limiter, client):
    await limiter.acquire()
    data = await get_json(client, REST_DEF.format(word=word))
    entry = parse_rest_definition(word, data)  # implement
    if needs_fallback(entry):
        await limiter.acquire()
        data2 = await get_json(client, ACTION_Q, params={{
            "action":"query","prop":"revisions","rvprop":"content","rvslots":"main",
            "format":"json","titles":word
        }})
        entry = enrich_from_wikitext(entry, data2)  # implement
    return entry
```

### Storage & caching
- **Parsed store**: Postgres (JSONB), or a document DB (e.g., MongoDB).  
- **Raw store**: Object storage (`s3://wiktionary/raw/{{word}}/{{timestamp}}.json`).
- **Cache**: Redis for hot entries (TTL ~ 7–30 days).

---

## 7) Validation & quality

- **Schema validation** (e.g., JSON Schema) on ingest.
- **Language guardrails**: only `English` entries; drop others.
- **Minimal completeness**: must have ≥1 definition; pronunciations optional; etymology optional; examples optional (configurable).
- **Deduplication**: Merge identical senses; collapse whitespace; normalise IPA strings.
- **Observability**:
  - Metrics: success rate, 4xx/5xx, average latency, words/hour.
  - Traces: per‑word span (fetch → parse → store).
  - Logs: include `word`, HTTP status, retries.

---

## 8) UI requirements (attribution & linking)

For **each word card** shown to end users:
- **Prominent source link** back to the original page, e.g.:  
  - _Source: [“example” — Wiktionary](https://en.wiktionary.org/wiki/example)_
- **License disclosure** (text content):  
  - _Text is available under **CC BY‑SA 3.0**; additional terms may apply._
- If you display **audio** or media, respect the **media file’s own license**, which may differ from page text. Always include a link to the media file’s description page.

Recommended HTML snippet:

```html
<div class="attribution">
  Source: <a href="https://en.wiktionary.org/wiki/example" rel="nofollow">“example” — Wiktionary</a>.
  Text available under <a href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a>.
</div>
```

---

## 9) Licensing & compliance (critical)

- **Wiktionary text** is licensed under **Creative Commons Attribution–ShareAlike 3.0 (CC BY‑SA 3.0)** (or later).  
  - **Attribution**: You **must** credit Wiktionary and provide a link to the original page(s).  
  - **Share‑Alike**: If you remix/adapt the text (e.g., reformat definitions, aggregate senses), you must distribute the resulting text under the **same license**.  
- **Keep provenance**: Store the per‑entry source URL and **retrieval timestamp**.  
- **UI requirement**: Always include a **clickable link** back to the original Wiktionary page for the displayed word.  
- **Media files** (audio, images) may have **different licenses**; check each file’s page and attribute accordingly.  
- **Downstream sharing**: Any API you expose that serves adapted text must also be **CC BY‑SA** compatible.  
- **No logo endorsement**: Don’t imply affiliation with Wikimedia.

*(This summary is not legal advice; verify your usage against Wikimedia & Creative Commons terms.)*

---

## 10) Testing & evaluation

- **Golden set**: Curate ~200 words spanning POS variety, etymology complexity, and homographs.  
- **Diff‑based tests**: Re‑run extraction periodically; alert on material diffs (upstream pages change).  
- **Fuzzing**: Randomly sample from the top 50k words to find parser edge cases.  
- **Manual review**: Human spot‑check etymology paragraphs and IPA formatting.

---

## 11) Operational checklist

- [ ] User‑Agent set and documented  
- [ ] Rate limiter enabled and tuned  
- [ ] Exponential backoff with jitter  
- [ ] Raw + parsed artifacts persisted  
- [ ] Attribution strings generated per entry  
- [ ] UI link back verified in all views  
- [ ] License compliance tests  
- [ ] Metrics & alerts wired (429 rate, error rate, latency)  
- [ ] Regular re‑crawl cadence (e.g., monthly) with `If-None-Match`/`If-Modified-Since`

---

## 12) Example cURL calls

**Definitions (REST)**
```bash
curl -H "User-Agent: YourAppName/1.0 (contact: you@example.com)" \
  "https://en.wiktionary.org/api/rest_v1/page/definition/example"
```

**Raw wikitext (Action API)**
```bash
curl -H "User-Agent: YourAppName/1.0 (contact: you@example.com)" \
  "https://en.wiktionary.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&format=json&titles=example"
```

---

## 13) Deliverables for the app

- **Ingest CLI**: `ingest-words --input words.txt --rps 1.5 --out s3://bucket/...`  
- **Schema**: JSON Schema for `Entry` payloads  
- **Docs**: Attribution policy + UI component snippet  
- **Monitoring**: Dashboard (requests/sec, 429s, error %) + alerts  
- **Repro**: Frozen snapshot of raw responses for the release

---

## 14) Edge cases & tips

- **Homographs / numbered etymologies**: Merge by POS + etymology index (Etymology 1/2).  
- **Redirects**: Resolve redirects to canonical page; store both the input term and target title.  
- **Case sensitivity**: English titles are usually case‑normalized; keep display case from input.  
- **Non‑English spillover**: Strictly filter to `English`.  
- **Templates drift**: Wiktionary templates evolve—keep raw sources so you can re‑parse with improved extractors.  
- **Performance**: For very large lists, prefer the dumps pipeline; then update incrementally via REST.

---

### Ready‑to‑use Attribution Template

> “{{word}}” — Wiktionary. Text available under CC BY‑SA 3.0; additional terms may apply. Original: https://en.wiktionary.org/wiki/{{urlencoded_word}}

---

*End of document.*
