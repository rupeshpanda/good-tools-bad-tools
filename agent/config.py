"""
Loads configuration from environment variables (via .env) so no API key
is ever hardcoded in the source. Every other file imports from here instead
of calling os.environ directly — that keeps provider config in one place.
"""

import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
MODEL_NAME = os.environ.get("FLIGHTOPS_MODEL", "claude-sonnet-4-5-20250929")

if not ANTHROPIC_API_KEY:
    raise RuntimeError(
        "ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key."
    )
