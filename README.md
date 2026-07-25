# @serpdive/ai-sdk

[SERPdive](https://serpdive.com) web search tool for the [Vercel AI SDK](https://ai-sdk.dev). One tool call returns extracted, answer-ready page content per source — not links or snippets — so your agent can quote and cite facts straight from the response.

**There is a free tier, and it has no ceiling.** The `krill` model is free and unlimited under fair use — no card, no credits, nothing to decrement. It returns the shortest set of sentences that still answers (about 700 tokens a search, roughly half what the usual alternatives send), one request at a time, at low priority. Use it to build; switch one word to `mako` when you need depth and steady latency.

Same speed as Tavily with **20.2% fewer tokens** (1,001 vs 1,255 per query on average) and higher answer quality — **60.7% of decided duels won** against Tavily's default search on a [public, replayable 1,000-question benchmark](https://github.com/edendalexis/serpdive-benchmark). Free tier, no card.

## Install

```bash
npm install @serpdive/ai-sdk
```

## Usage

Grab a free API key at [serpdive.com](https://serpdive.com) and set `SERPDIVE_API_KEY` (or pass `apiKey`).

```ts
import { generateText, isStepCount } from "ai";
import { serpdiveSearch } from "@serpdive/ai-sdk";

const { text } = await generateText({
  model: "anthropic/claude-sonnet-5",
  prompt: "What changed in the latest Next.js release?",
  tools: {
    webSearch: serpdiveSearch(),
  },
  stopWhen: isStepCount(3),
});

console.log(text);
```

The model sends a `query` (any language — localization is automatic) and may optionally pick the retrieval depth per call: `mako` (default, the fact-carrying sentences of each source, fast) or `moby` (full page content, slower and several times more tokens).

## Options

All options are set at tool creation and act as defaults:

```ts
serpdiveSearch({
  apiKey: "sd_live_...", // defaults to SERPDIVE_API_KEY
  model: "mako",         // default retrieval depth when the model doesn't pick one
  answer: true,          // also return a written answer built from the sources (included in the price)
  maxResults: 5,         // hard cap on delivered results (1-10)
  timeoutMs: 80_000,     // client timeout; moby reads whole pages and can take a while
});
```

The tool returns the raw [`SearchResponse`](https://serpdive.com/docs#response): `{ query, model, response_time_ms, answer?, extra_info?, results: [{ url, title, content, date? }] }`. Results are real page extractions only — a source that couldn't be read is simply absent, and tracking parameters are stripped from URLs.

## License

MIT
