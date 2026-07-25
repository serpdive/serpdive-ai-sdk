import { tool } from "ai";
import { z } from "zod";
import { SerpDive } from "serpdive";
import type { SerpDiveClientOptions, SearchResponse } from "serpdive";

/**
 * The models this tool exposes.
 *
 * Declared here rather than imported as `SearchModel` from `serpdive`: the API
 * serves three models, but the published SDK's type still lists two, so
 * importing it would make `krill` — the free tier — a type error while being
 * perfectly valid at runtime. This local union is the honest surface; it
 * collapses back into the imported type once a serpdive release ships krill.
 */
export type SerpdiveToolModel = "krill" | "mako" | "moby";

export interface SerpdiveSearchOptions extends SerpDiveClientOptions {
  /** Default retrieval depth when the model does not pick one: "mako" (fast, key sentences), "krill" (free and unlimited under fair use, smallest payload) or "moby" (full pages). */
  model?: SerpdiveToolModel;
  /** Also return a written answer built from the sources. Included in the price. */
  answer?: boolean;
  /** Hard cap on delivered results (1-10). */
  maxResults?: number;
}

/**
 * SERPdive Search tool for the AI SDK.
 * Real-time web search that returns extracted, answer-ready page content per
 * source — not links or snippets — sized for LLM consumption.
 */
export const serpdiveSearch = (options: SerpdiveSearchOptions = {}) => {
  const { model, answer, maxResults, ...clientOptions } = options;
  const client = new SerpDive(clientOptions);
  const inputSchema = z.object({
    query: z
      .string()
      .describe(
        "The search query, phrased like a real web search, in any language (localization is automatic)",
      ),
    model: z
      .enum(["krill", "mako", "moby"])
      .optional()
      .describe(
        "Retrieval depth: 'mako' (default) returns the fact-carrying sentences of each source, fast and concise; 'krill' is the free tier — unlimited under fair use, the smallest useful payload, one request at a time at low priority, no written answer; 'moby' returns full page content — slower and several times more tokens, only for deep reading",
      ),
  });
  return tool({
    description:
      "Search the web in real time with SERPdive. Each result carries the extracted, answer-ready content of the page (not a link or snippet), so facts can be quoted and cited straight from the response. Use it for anything that needs current or post-training information.",
    inputSchema,
    execute: async ({ query, model: inputModel }): Promise<SearchResponse> => {
      return await client.search(query, {
        // Cast for the same reason as SerpdiveToolModel above: valid at
        // runtime, unknown to the published types.
        model: (inputModel ?? model) as never,
        ...(answer !== undefined && { answer }),
        ...(maxResults !== undefined && { maxResults }),
      });
    },
  });
};
