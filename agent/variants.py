"""
The four schema variants, as a 2x2 ablation.

A tool declaration gives the model exactly two channels of information about
what a function does: its NAME and its DESCRIPTION. Comparing one "good"
schema against one "bad" one confounds those two channels - if behaviour
changes, you cannot say which channel caused it.

So we vary them independently:

                        | complete description | lazy description
    --------------------+----------------------+------------------
    descriptive name    |  complete            |  lazy
    opaque name         |  prose_only          |  nothing

  complete    - what a careful developer writes. Both channels working.
  lazy        - the realistic rushed schema. Real names, throwaway prose.
                This is what most tool definitions in the wild look like.
  prose_only  - names stripped to tool_a..tool_f, descriptions left intact.
                Isolates what the DESCRIPTION alone can carry.
  nothing     - both channels gutted. The floor.

The interesting cell is prose_only. If it performs like `complete`, then a
good description is sufficient on its own and a well-chosen name is a
convenience. If `lazy` performs like `complete` but `nothing` collapses,
then the NAME was silently doing the work all along - and every team
congratulating itself on its tool descriptions is really relying on having
picked obvious function names.

Names are anonymised rather than deleted because the API requires a name;
tool_a..tool_f is the closest available equivalent of "no name at all".
"""

import copy
from typing import Dict, List

from schemas import TOOL_SCHEMAS
from schemas_lazy import LAZY_TOOL_SCHEMAS

# Deliberately meaningless, and deliberately not even hinting at ordering by
# usefulness - assigned in the order the tools happen to be declared.
OPAQUE_NAMES: Dict[str, str] = {
    "get_flight_status": "tool_a",
    "search_passenger": "tool_b",
    "maintenance_history": "tool_c",
    "find_available_gate": "tool_d",
    "lookup_aircraft": "tool_e",
    "get_weather": "tool_f",
}

# Reverse map so the executor can turn an opaque name the model requested
# back into the real Python function.
REAL_NAMES: Dict[str, str] = {v: k for k, v in OPAQUE_NAMES.items()}


def _strip_names(schemas: List[dict]) -> List[dict]:
    """Return a copy of `schemas` with every tool name replaced by an opaque one."""
    anonymised = copy.deepcopy(schemas)
    for schema in anonymised:
        schema["name"] = OPAQUE_NAMES[schema["name"]]
    return anonymised


def _scrub_name_mentions(schemas: List[dict]) -> List[dict]:
    """
    Rewrite tool names appearing INSIDE descriptions to their opaque form.

    The complete descriptions cross-reference each other by name ("call
    get_flight_status first to obtain it"). Left alone, those references
    would leak the real names back in and the ablation would not be clean -
    the model could reconstruct what tool_a is from another tool's prose.
    """
    scrubbed = copy.deepcopy(schemas)
    for schema in scrubbed:
        text = schema["description"]
        for real, opaque in OPAQUE_NAMES.items():
            text = text.replace(real, opaque)
        schema["description"] = text
    return scrubbed


VARIANTS: Dict[str, List[dict]] = {
    "complete": TOOL_SCHEMAS,
    "lazy": LAZY_TOOL_SCHEMAS,
    "prose_only": _scrub_name_mentions(_strip_names(TOOL_SCHEMAS)),
    "nothing": _strip_names(LAZY_TOOL_SCHEMAS),
}

VARIANT_META = {
    "complete": {
        "label": "Complete",
        "name_channel": "descriptive",
        "description_channel": "complete",
        "blurb": "Real tool names, and descriptions that say what each tool "
                 "returns, what it identifies things by, and when not to use it.",
    },
    "lazy": {
        "label": "Lazy",
        "name_channel": "descriptive",
        "description_channel": "lazy",
        "blurb": "Real tool names, but descriptions written in thirty seconds "
                 "from the function name. The common case.",
    },
    "prose_only": {
        "label": "Prose only",
        "name_channel": "opaque",
        "description_channel": "complete",
        "blurb": "Names stripped to tool_a..tool_f, complete descriptions kept. "
                 "Tests whether the description alone is enough.",
    },
    "nothing": {
        "label": "Nothing to go on",
        "name_channel": "opaque",
        "description_channel": "lazy",
        "blurb": "Both channels gutted. The floor, for reference.",
    },
}


def resolve_tool_name(requested: str) -> str:
    """Map whatever name the model asked for back to a real function name."""
    return REAL_NAMES.get(requested, requested)
