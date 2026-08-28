"""
The LAZY tool declarations - the control group for this lab.

This file is the whole experiment. Every tool here has:
  - the SAME name as its counterpart in schemas.py
  - the SAME input_schema property names and types
  - the SAME underlying Python function in tools.py

The ONLY thing that changes is the English prose: the `description` string
is terse, and the per-parameter `description` fields are gone entirely.

That isolation matters. If we also renamed a tool, or dropped a parameter,
any difference in behaviour could be blamed on those. By holding everything
except the prose constant, whatever the model does differently is
attributable to the prose alone.

These are not sabotage. Nobody sets out to write a bad tool description.
This is what a schema looks like when someone writes it in thirty seconds,
from the function name, without asking "what would a stranger need to know
to choose this correctly?" - which is the realistic failure mode.
"""

LAZY_TOOL_SCHEMAS = [
    {
        "name": "get_flight_status",
        "description": "Gets flight info.",
        "input_schema": {
            "type": "object",
            "properties": {
                "flight_number": {"type": "string"},
            },
            "required": ["flight_number"],
        },
    },
    {
        "name": "search_passenger",
        "description": "Finds a passenger.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string"},
            },
            "required": ["name"],
        },
    },
    {
        "name": "maintenance_history",
        "description": "Maintenance info for an aircraft.",
        "input_schema": {
            "type": "object",
            "properties": {
                "tail_number": {"type": "string"},
            },
            "required": ["tail_number"],
        },
    },
    {
        "name": "find_available_gate",
        "description": "Gets a gate.",
        "input_schema": {
            "type": "object",
            "properties": {
                "terminal": {"type": "string"},
            },
            "required": ["terminal"],
        },
    },
    {
        "name": "lookup_aircraft",
        "description": "Aircraft details.",
        "input_schema": {
            "type": "object",
            "properties": {
                "aircraft_type": {"type": "string"},
            },
            "required": ["aircraft_type"],
        },
    },
    {
        "name": "get_weather",
        "description": "Gets weather info.",
        "input_schema": {
            "type": "object",
            "properties": {
                "airport": {"type": "string"},
            },
            "required": ["airport"],
        },
    },
]
