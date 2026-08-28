"""
Entry point. Orchestrates one FlightOps run end to end:

    Goal/Plan (planner.py) -> Tool loop (agent.py) -> Answer -> Reflection (reflector.py)

Run interactively:
    python main.py

Run a single question non-interactively:
    python main.py "Should I be worried about James Okafor's flight?"
"""

import sys

# Windows consoles default to a legacy codepage (e.g. cp1252) that can't
# encode characters the model may put in its answer (checkmarks, arrows,
# etc.) - force UTF-8 stdout/stderr so a run never crashes on print().
sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

from planner import make_plan
from agent import run_agent
from reflector import reflect


def run_flightops(user_message: str) -> None:
    print("=" * 70)
    print(f"USER: {user_message}")
    print("=" * 70)

    print("\n--- PLAN " + "-" * 60)
    plan = make_plan(user_message)
    print(plan)

    print("\n--- TOOL EXECUTION " + "-" * 51)
    final_answer, trace = run_agent(user_message)

    print("\n--- ANSWER " + "-" * 59)
    print(final_answer)

    print("\n--- REFLECTION " + "-" * 55)
    reflection = reflect(user_message, trace, final_answer)
    print(reflection)
    print()


def main():
    if len(sys.argv) > 1:
        run_flightops(" ".join(sys.argv[1:]))
        return

    print("FlightOps - AI Operations Officer for AeroWing Airlines (synthetic data)")
    print("Type a question, or 'quit' to exit.\n")
    while True:
        user_message = input("> ").strip()
        if user_message.lower() in ("quit", "exit"):
            break
        if not user_message:
            continue
        run_flightops(user_message)


if __name__ == "__main__":
    main()
