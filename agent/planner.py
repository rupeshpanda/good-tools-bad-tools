"""
Make the agent think before it acts.

Runs a separate, tool-free model call that produces a Goal and a numbered
Plan for the user's question, purely for transparency - so an operations
officer reading FlightOps' output can see *why* it's about to check what
it's about to check. The agent loop in agent.py doesn't have to follow this
plan step-by-step; it just gives the model's tool choices somewhere to be
grounded before the first tool call happens.
"""

import anthropic

from config import ANTHROPIC_API_KEY, MODEL_NAME
from schemas import TOOL_SCHEMAS

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

PLANNER_SYSTEM_PROMPT = (
    "You are the planning module of FlightOps, an AI Operations Officer. "
    "Given a user's question and the list of tools available to you, write a "
    "short Goal (one sentence) and a numbered Plan (2-5 steps) describing which "
    "tools you intend to check and why, before any tool is actually called. "
    "Do not call any tools yourself - only describe the plan. "
    "Format your response exactly as:\n\n"
    "Goal:\n<one sentence>\n\nPlan:\n1. <step>\n2. <step>\n..."
)


def make_plan(user_message: str) -> str:
    """Returns the raw 'Goal: ... Plan: ...' text block for display before execution."""
    tool_names_and_descriptions = "\n".join(
        f"- {t['name']}: {t['description']}" for t in TOOL_SCHEMAS
    )

    response = client.messages.create(
        model=MODEL_NAME,
        max_tokens=300,
        system=PLANNER_SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": (
                f"Available tools:\n{tool_names_and_descriptions}\n\n"
                f"User question: {user_message}"
            ),
        }],
    )

    return "".join(block.text for block in response.content if block.type == "text")
