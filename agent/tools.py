"""
The tools themselves: the actual actions FlightOps can take.

These are plain Python functions that read from the mock data in data.py.
There is no LLM code anywhere in this file, and that is the point worth
sitting with - a tool is not an AI concept. It is a normal function that
worked before any model existed and would keep working if you deleted the
model tomorrow. What makes it a *tool* is that somewhere else (schemas.py)
you wrote a description of it for a model to read.

Run `python tools.py` to exercise every function directly. They must be
correct on their own before the model is ever pointed at them - a bug here
is a bug the agent will faithfully repeat and then explain confidently.

Every function returns a plain dict. On success:
    {"status": "ok", ...the actual fields...}
On failure:
    {"status": "error", "message": "..."}

That second shape matters. Tools fail - services time out, records go
missing, arguments arrive malformed. Returning a structured error instead of
raising means the agent gets something it can read and report, rather than
the loop dying halfway through.
"""

from data import FLIGHTS, AIRCRAFT, PASSENGERS, MAINTENANCE, WEATHER, GATES


def get_flight_status(flight_number: str) -> dict:
    """Return status, gate, departure time, delay, and tail number for a flight."""
    flight = FLIGHTS.get(flight_number.upper())
    if flight is None:
        return {"status": "error",
                "message": f"No flight found with number '{flight_number}'"}

    return {
        "status": "ok",
        "flight_number": flight_number.upper(),
        "flight_status": flight["status"],
        "gate": flight["gate"],
        "departure_time": flight["departure_time"],
        "delay_minutes": flight["delay_minutes"],
        "tail_number": flight["tail_number"],
        "aircraft_type": flight["aircraft_type"],
        "origin": flight["origin"],
        "destination": flight["destination"],
    }


def search_passenger(name: str) -> dict:
    """Return booking reference, flight, seat, and destination for a passenger."""
    passenger = PASSENGERS.get(name.lower())
    if passenger is None:
        return {"status": "error",
                "message": f"No passenger found with name '{name}'"}

    return {
        "status": "ok",
        "name": name.title(),
        "booking_ref": passenger["booking_ref"],
        "flight_number": passenger["flight_number"],
        "seat": passenger["seat"],
        "destination": passenger["destination"],
    }


def maintenance_history(tail_number: str) -> dict:
    """Return inspection date, hours flown, and open issues for one airframe."""
    record = MAINTENANCE.get(tail_number.upper())
    if record is None:
        return {
            "status": "error",
            "message": (
                f"No maintenance record found for tail number '{tail_number}'. "
                "This lookup is keyed by aircraft registration (e.g. 'N317AA'), "
                "not by aircraft type."
            ),
        }

    return {
        "status": "ok",
        "tail_number": tail_number.upper(),
        "last_inspection_date": record["last_inspection_date"],
        "hours_flown_since_inspection": record["hours_flown_since_inspection"],
        "outstanding_issues": record["outstanding_issues"],
    }


def find_available_gate(terminal: str) -> dict:
    """Return an open, currently unassigned gate in a terminal."""
    gates = GATES.get(terminal.upper())
    if gates is None:
        return {"status": "error",
                "message": f"No terminal found with identifier '{terminal}'"}
    if not gates:
        return {"status": "error",
                "message": f"No open gates currently available in terminal '{terminal}'"}

    return {
        "status": "ok",
        "terminal": terminal.upper(),
        "gate": gates[0],
    }


def lookup_aircraft(aircraft_type: str) -> dict:
    """Return dimensions, capacity, and fuel figures for an aircraft type."""
    aircraft = AIRCRAFT.get(aircraft_type.upper())
    if aircraft is None:
        return {
            "status": "error",
            "message": (
                f"No aircraft found with type '{aircraft_type}'. This lookup is "
                "keyed by aircraft type (e.g. 'A320'), not by tail number."
            ),
        }

    return {
        "status": "ok",
        "aircraft_type": aircraft_type.upper(),
        "manufacturer": aircraft["manufacturer"],
        "length_m": aircraft["length_m"],
        "wingspan_m": aircraft["wingspan_m"],
        "capacity_passengers": aircraft["capacity_passengers"],
        "fuel_capacity_liters": aircraft["fuel_capacity_liters"],
    }


def get_weather(airport: str) -> dict:
    """
    Return visibility, wind, temperature, and conditions at an airport.

    This is FlightOps' deliberately fallible tool. An unknown code (or a
    model passing something that isn't an airport code at all) raises a
    KeyError, which is caught here and turned into a structured error so the
    agent loop survives and the model can report the failure honestly instead
    of inventing a forecast.
    """
    try:
        record = WEATHER[airport.upper()]
    except KeyError:
        return {"status": "error",
                "message": f"Weather service has no station for '{airport}'"}

    return {
        "status": "ok",
        "airport": airport.upper(),
        "visibility_km": record["visibility_km"],
        "wind_kph": record["wind_kph"],
        "temperature_c": record["temperature_c"],
        "conditions": record["conditions"],
    }


# ---------------------------------------------------------------------------
# Direct test harness - run `python tools.py` before connecting the model.
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    checks = [
        ("get_flight_status('AA118')", get_flight_status("AA118")),
        ("get_flight_status('ZZ999')", get_flight_status("ZZ999")),
        ("search_passenger('James Okafor')", search_passenger("James Okafor")),
        ("maintenance_history('N738AA')", maintenance_history("N738AA")),
        ("maintenance_history('B738')", maintenance_history("B738")),
        ("find_available_gate('T2')", find_available_gate("T2")),
        ("find_available_gate('T3')", find_available_gate("T3")),
        ("lookup_aircraft('B738')", lookup_aircraft("B738")),
        ("get_weather('SFO')", get_weather("SFO")),
        ("get_weather('departure')", get_weather("departure")),
    ]
    for label, result in checks:
        marker = "ok " if result["status"] == "ok" else "ERR"
        print(f"[{marker}] {label}\n      {result}\n")
