/**
 * SERPdive tools for the Vercel AI SDK.
 *
 * Quickstart:
 * ```ts
 * import { generateText, isStepCount } from "ai";
 * import { serpdiveSearch } from "@serpdive/ai-sdk";
 *
 * const { text } = await generateText({
 *   model: "anthropic/claude-sonnet-5",
 *   prompt: "What changed in the latest Next.js release?",
 *   tools: { webSearch: serpdiveSearch() }, // reads SERPDIVE_API_KEY
 *   stopWhen: isStepCount(3),
 * });
 * ```
 */

export { serpdiveSearch } from "./tools/serpdive-search.js";
export type { SerpdiveSearchOptions } from "./tools/serpdive-search.js";
