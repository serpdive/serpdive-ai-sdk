import { describe, expect, it } from "vitest";
import { generateText, isStepCount } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { serpdiveSearch } from "../src/index.js";

const RESPONSE = {
  query: "latest next.js release",
  model: "mako",
  response_time_ms: 1400,
  results: [
    {
      url: "https://nextjs.org/blog",
      title: "Next.js Blog",
      date: "2026-07-01",
      content: "Next.js 16.2 was released with these changes.",
    },
  ],
};

function mockFetch(captured: { url?: string; init?: RequestInit }) {
  return (async (url: unknown, init?: RequestInit): Promise<Response> => {
    captured.url = String(url);
    captured.init = init;
    return new Response(JSON.stringify(RESPONSE), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }) as typeof globalThis.fetch;
}

describe("serpdiveSearch", () => {
  it("builds an AI SDK tool that posts /v1/search and returns the response", async () => {
    const captured: { url?: string; init?: RequestInit } = {};
    const tool = serpdiveSearch({ apiKey: "sd_test", fetch: mockFetch(captured) });

    expect(tool.description).toContain("SERPdive");
    expect(tool.inputSchema).toBeDefined();

    const result = await tool.execute!(
      { query: "latest next.js release" },
      { toolCallId: "call-1", messages: [], context: undefined } as never,
    );

    expect(captured.url).toBe("https://api.serpdive.com/v1/search");
    const headers = new Headers(captured.init?.headers);
    expect(headers.get("authorization")).toBe("Bearer sd_test");
    expect(JSON.parse(String(captured.init?.body))).toEqual({
      query: "latest next.js release",
    });
    expect(result).toEqual(RESPONSE);
  });

  it("lets the model pick moby and applies factory defaults", async () => {
    const captured: { url?: string; init?: RequestInit } = {};
    const tool = serpdiveSearch({
      apiKey: "sd_test",
      fetch: mockFetch(captured),
      answer: true,
      maxResults: 5,
    });

    await tool.execute!(
      { query: "deep dive", model: "moby" },
      { toolCallId: "call-2", messages: [], context: undefined } as never,
    );

    expect(JSON.parse(String(captured.init?.body))).toEqual({
      query: "deep dive",
      model: "moby",
      answer: true,
      max_results: 5,
    });
  });

  it("runs inside a real generateText tool loop", async () => {
    const captured: { url?: string; init?: RequestInit } = {};
    let step = 0;
    const model = new MockLanguageModelV4({
      doGenerate: (async () => {
        step += 1;
        if (step === 1) {
          return {
            finishReason: "tool-calls" as const,
            usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
            content: [
              {
                type: "tool-call" as const,
                toolCallId: "call-1",
                toolName: "webSearch",
                input: JSON.stringify({ query: "latest next.js release" }),
              },
            ],
            warnings: [],
          };
        }
        return {
          finishReason: "stop" as const,
          usage: { inputTokens: 20, outputTokens: 10, totalTokens: 30 },
          content: [{ type: "text" as const, text: "Next.js 16.2 is out." }],
          warnings: [],
        };
      }) as never,
    });

    const { text, steps } = await generateText({
      model,
      prompt: "What changed in the latest Next.js release?",
      tools: { webSearch: serpdiveSearch({ apiKey: "sd_test", fetch: mockFetch(captured) }) },
      stopWhen: isStepCount(3),
    });

    expect(captured.url).toBe("https://api.serpdive.com/v1/search");
    const toolResults = steps.flatMap((s) => s.toolResults);
    expect(toolResults).toHaveLength(1);
    expect(toolResults[0]?.output).toEqual(RESPONSE);
    expect(text).toBe("Next.js 16.2 is out.");
  });
});
