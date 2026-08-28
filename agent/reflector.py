"""
Make the agent evaluate its own performance after it answers.

Runs a separate, tool-free model call that critiques the run just completed,
given the trace of tool calls actually made and the final answer given.
Displayed alongside the answer - never hidden - so the user sees FlightOps
reasoning about its own limitations, not just its conclusions.
"""

import json

import anthropic

from config import ANTHROPIC_API_KEY, MODEL_NAME

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

REFLECTOR_SYSTEM_PROMPT = (
    "You are the reflection module of FlightOps, an AI Operations Officer. "
    "You will be shown a user's question, the sequence of tool calls that were "
    "made to answer it, and the final answer given. Critique that process "
    "honestly and concisely (4-6 sentences), addressing:\n"
    "- Were any tool calls unnecessary?\n"
    "- Is any information the user needed still missing from the final answer?\n"
    "- Could the same answer have been reached with fewer tool calls?\n"
    "- How confident should the user be in this answer, and why?"
)


def reflect(user_message: str, trace: list, final_answer: str) -> str:
    """Returns the model's self-critique of the run as plain text."""
    trace_summary = json.dumps(trace, indent=2)

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=400,
        system=REFLECTOR_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                f"User question: {user_message}\n\n"
                f"Tool calls made:\n{trace_summary}\n\n"
                f"Final answer given: {final_answer}"
            ),
        }],
    )

    return "".join(block.text for block in response.content if block.type == "text")
