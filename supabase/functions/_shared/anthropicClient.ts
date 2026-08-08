// deno-lint-ignore-file no-explicit-any
import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";

let client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!client) {
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY secret is not set. Run: supabase secrets set ANTHROPIC_API_KEY=sk-ant-... (see docs/EDGE_FUNCTIONS_SETUP.md)"
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export interface VisionImageInput {
  base64Jpeg: string;
}

export function extractJson(text: string): any {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Model response did not contain a JSON object");
  }
  return JSON.parse(text.slice(start, end + 1));
}

/** Sends a text prompt + photo(s) to Claude and returns the raw text response. */
export async function callClaudeVision(prompt: string, images: VisionImageInput[]): Promise<string> {
  const model = Deno.env.get("CLAUDE_MODEL") || "claude-sonnet-5";

  const response = await getClient().messages.create({
    model,
    max_tokens: 1536,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...images.map((img) => ({
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: "image/jpeg" as const,
              data: img.base64Jpeg,
            },
          })),
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  return textBlock && "text" in textBlock ? textBlock.text : "";
}
