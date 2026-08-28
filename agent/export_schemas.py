"""
Generates lib/live/schemas.ts from the Python schema definitions.

The live demo on the site runs in a serverless TypeScript function, but the
measured results on the page came from the Python agent. If the two ever hold
different descriptions, the page is comparing one thing and citing another.

So the TypeScript is generated, never hand-written. Re-run this after touching
schemas.py or schemas_lazy.py:

    python export_schemas.py
"""

import json
from pathlib import Path

from schemas import TOOL_SCHEMAS
from schemas_lazy import LAZY_TOOL_SCHEMAS
from agent import SYSTEM_PROMPT

OUT = Path(__file__).resolve().parent.parent / "lib" / "live" / "schemas.ts"

HEADER = """/**
 * GENERATED FILE - do not edit by hand.
 *
 * Produced by `python agent/export_schemas.py` from agent/schemas.py and
 * agent/schemas_lazy.py. The live demo and the recorded experiment must use
 * byte-identical tool declarations, otherwise the numbers quoted on the page
 * describe a different experiment than the one the visitor just ran.
 *
 * The two sets below differ ONLY in prose. Same tool names, same parameter
 * names, same types, same required fields, same underlying functions.
 */

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, { type: string; description?: string }>;
    required: string[];
  };
}

"""


def emit(name: str, value) -> str:
    return f"export const {name} = {json.dumps(value, indent=2)} as const satisfies readonly ToolSchema[];\n\n"


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)

    body = HEADER
    body += emit("COMPLETE_TOOLS", TOOL_SCHEMAS)
    body += emit("LAZY_TOOLS", LAZY_TOOL_SCHEMAS)
    body += (
        "/** Identical for both variants - the system prompt is not the variable. */\n"
        f"export const SYSTEM_PROMPT = {json.dumps(SYSTEM_PROMPT)};\n\n"
    )
    body += (
        "export const VARIANTS = {\n"
        "  lazy: LAZY_TOOLS,\n"
        "  complete: COMPLETE_TOOLS,\n"
        "} as const;\n\n"
        "export type VariantKey = keyof typeof VARIANTS;\n"
    )

    OUT.write_text(body, encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
