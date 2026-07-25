# Changelog

## 0.2.0 — 2026-07-25

Adds **krill**, the free tier.

`model: "krill"` is free and unlimited under fair use: no card, no credits, no
trial clock. It returns the shortest set of sentences that still answers (about
700 tokens a search, roughly half what the usual alternatives send), one request
at a time, at low priority, and no written answer. `mako` stays the default and
is unchanged, so nothing breaks by upgrading.

- The zod enum accepts `krill`, and the model union is declared locally so it
  typechecks against the currently published `serpdive` types.
