import Anthropic from "@anthropic-ai/sdk";
import { executeTool } from "./tools";
import { SYSTEM_PROMPT, VARIANTS, type VariantKey } from "./schemas";

/**
 * The agent loop, live.
 *
 * This is the same loop as agent/agent.py: ask, receive a tool request,
 * run the function ourselves, hand the result back, repeat until the model
 * stops asking. The model never executes anything. It returns a name and
 * some arguments, and the `executeTool` line below is where a human-written
 * program decides to honour that. That is the step the page is built to make
 * visible.
 */

const MODEL = process.env.FLIGHTOPS_MODEL ?? "claude-sonnet-4-5-20250929";
const MAX_ITERATIONS = 8;
const MAX_TOKENS = 1024;

export interface LiveStep {
  /** What the model asked for. */
  tool: string;
  input: Record<string, string>;
  /** What our code handed back. */
  result: { status: string; [k: string]: unknown };
  /** The raw block the model emitted, shown verbatim on the page. */
  toolUseId: string;
}

export interface LiveRun {
  variant: VariantKey;
  steps: LiveStep[];
  answer: string;
  errorCount: number;
  elapsedMs: number;
  inputTokens: number;
  outputTokens: number;
  hitLimit: boolean;
}

export async function runVariant(
  question: string,
  variant: VariantKey,
  apiKey: string,
): Promise<LiveRun> {
  const client = new Anthropic({ apiKey });
  const tools = VARIANTS[variant];

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: question },
  ];
  const steps: LiveStep[] = [];
  const started = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      tools: tools as unknown as Anthropic.Tool[],
      messages,
    });

    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;
    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const answer = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      return {
        variant,
        steps,
        answer,
        errorCount: steps.filter((s) => s.result.status === "error").length,
        elapsedMs: Date.now() - started,
        inputTokens,
        outputTokens,
        hitLimit: false,
      };
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const input = (block.input ?? {}) as Record<string, string>;
      // The only place anything actually runs. The model requested it; this
      // line is what chose to comply.
      const result = executeTool(block.name, input);

      steps.push({
        tool: block.name,
        input,
        result,
        toolUseId: block.id,
      });
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return {
    variant,
    steps,
    answer: "",
    errorCount: steps.filter((s) => s.result.status === "error").length,
    elapsedMs: Date.now() - started,
    inputTokens,
    outputTokens,
    hitLimit: true,
  };
}
