"""
Mock "databases" for FlightOps - plain Python dictionaries standing in for
the flight, maintenance, gate, and weather systems a real airline operations
desk would query over four separate integrations.

Synthetic data only. Carriers, tail numbers, and passengers are invented;
the airports and aircraft types are real so the scenarios read naturally to
anyone who has flown in the US.

The data is deliberately shaped so each lab scenario has ONE checkable right
answer that is reachable only through a specific tool call. Notes on those
choices are inline - if you change a value, re-read them first, because
several scenarios stop working if the wrong field moves.
"""

# Keyed by flight number, e.g. "AA118"
FLIGHTS = {
    # SFO morning fog is the entire point of this record: the flight itself
    # looks perfectly healthy (on time, zero delay) and N317AA's maintenance
    # is clean, so weather at the ORIGIN is the only thing that can tell an
    # operations officer this departure is at risk.
    "AA118": {
        "status": "scheduled",       # scheduled | delayed | departed | cancelled
        "gate": "B12",
        "departure_time": "2026-08-27T07:45:00",
        "delay_minutes": 0,
        "tail_number": "N317AA",
        "aircraft_type": "A320",
        "origin": "SFO",
        "destination": "JFK",
    },
    # The airworthiness scenario. Looks fine on the surface - scheduled, no
    # delay - but N738AA carries a deferred hydraulic warning. Reaching that
    # requires chaining flight status -> tail number -> maintenance history.
    "AA119": {
        "status": "scheduled",
        "gate": "D06",
        "departure_time": "2026-08-27T20:15:00",
        "delay_minutes": 0,
        "tail_number": "N738AA",
        "aircraft_type": "B738",
        "origin": "JFK",
        "destination": "LAX",
    },
    "UA455": {
        "status": "delayed",
        "gate": "C08",
        "departure_time": "2026-08-27T18:30:00",
        "delay_minutes": 35,
        "tail_number": "N842UA",
        "aircraft_type": "B738",
        "origin": "ORD",
        "destination": "DEN",
    },
    "DL290": {
        "status": "departed",
        "gate": "A14",
        "departure_time": "2026-08-27T08:30:00",
        "delay_minutes": 0,
        "tail_number": "N661DN",
        "aircraft_type": "A321",
        "origin": "ATL",
        "destination": "LAX",
    },
    "B6712": {
        "status": "cancelled",
        "gate": "C02",
        "departure_time": "2026-08-27T09:00:00",
        "delay_minutes": 0,
        "tail_number": "N593JB",
        "aircraft_type": "A321",
        "origin": "BOS",
        "destination": "MCO",
    },
}

# Keyed by aircraft TYPE, e.g. "A320" - not by tail number. The lab leans on
# this distinction: a type says what the model of aircraft can do, a tail
# number identifies one specific airframe with its own maintenance record.
AIRCRAFT = {
    "A320": {
        "manufacturer": "Airbus",
        "length_m": 37.6,
        "wingspan_m": 35.8,
        "capacity_passengers": 180,
        "fuel_capacity_liters": 24210,
    },
    "B738": {
        "manufacturer": "Boeing",
        "length_m": 39.5,
        "wingspan_m": 35.8,
        "capacity_passengers": 189,
        "fuel_capacity_liters": 26020,
    },
    "A321": {
        "manufacturer": "Airbus",
        "length_m": 44.5,
        "wingspan_m": 35.8,
        "capacity_passengers": 220,
        "fuel_capacity_liters": 30030,
    },
}

# Keyed by lowercase passenger name
PASSENGERS = {
    "james okafor": {
        "booking_ref": "AW7X9K",
        "flight_number": "AA118",
        "seat": "14C",
        "destination": "JFK",
    },
    "maria delgado": {
        "booking_ref": "AW3M2L",
        "flight_number": "AA119",
        "seat": "22A",
        "destination": "LAX",
    },
    "david chen": {
        "booking_ref": "AW9P4R",
        "flight_number": "UA455",
        "seat": "8F",
        "destination": "DEN",
    },
    "sarah whitfield": {
        "booking_ref": "AW1Q7T",
        "flight_number": "B6712",
        "seat": "17B",
        "destination": "MCO",
    },
    "marcus reilly": {
        "booking_ref": "AW5N8D",
        "flight_number": "DL290",
        "seat": "3A",
        "destination": "LAX",
    },
}

# Keyed by tail number, e.g. "N317AA". Note that NO key here is an aircraft
# type - passing "B738" to a tool that wants a tail number returns a
# not-found error, which is one of the failure modes this lab records.
MAINTENANCE = {
    "N317AA": {
        "last_inspection_date": "2026-08-16",
        "hours_flown_since_inspection": 42.5,
        "outstanding_issues": [],
    },
    "N738AA": {
        "last_inspection_date": "2026-07-28",
        "hours_flown_since_inspection": 88.3,
        "outstanding_issues": ["hydraulic sensor warning - deferred"],
    },
    "N842UA": {
        "last_inspection_date": "2026-08-21",
        "hours_flown_since_inspection": 12.0,
        "outstanding_issues": [],
    },
    "N661DN": {
        "last_inspection_date": "2026-08-09",
        "hours_flown_since_inspection": 61.7,
        "outstanding_issues": [],
    },
    "N593JB": {
        "last_inspection_date": "2026-08-07",
        "hours_flown_since_inspection": 60.0,
        "outstanding_issues": ["APU inoperative - flight cancelled pending repair"],
    },
}

# Keyed by IATA airport code, e.g. "SFO".
# NOTE: there is deliberately no entry for "XXX" - tools.py uses that absence
# to simulate the weather service being unreachable, so the agent has at
# least one tool that can genuinely fail.
WEATHER = {
    "SFO": {
        "visibility_km": 0.8,
        "wind_kph": 11,
        "temperature_c": 13,
        "conditions": "dense fog",
    },
    "JFK": {
        "visibility_km": 10.0,
        "wind_kph": 16,
        "temperature_c": 24,
        "conditions": "clear",
    },
    "ORD": {
        "visibility_km": 4.0,
        "wind_kph": 47,
        "temperature_c": 19,
        "conditions": "thunderstorms",
    },
    "LAX": {
        "visibility_km": 9.5,
        "wind_kph": 12,
        "temperature_c": 22,
        "conditions": "partly cloudy",
    },
    "DEN": {
        "visibility_km": 10.0,
        "wind_kph": 21,
        "temperature_c": 27,
        "conditions": "clear",
    },
    "ATL": {
        "visibility_km": 8.0,
        "wind_kph": 14,
        "temperature_c": 29,
        "conditions": "humid haze",
    },
    "BOS": {
        "visibility_km": 6.5,
        "wind_kph": 33,
        "temperature_c": 18,
        "conditions": "heavy rain",
    },
}

# Keyed by terminal, value is a list of currently OPEN (unassigned) gates.
# Deliberately disjoint from the gates already assigned to flights above:
# B12 (AA118) and D06 (AA119) do NOT appear here. That separation is what
# makes "the flight's gate" and "an available gate" two different answers -
# so an agent that confuses the two tools produces a plausible-looking gate
# that is simply the wrong one.
GATES = {
    "T1": ["A03", "A05"],
    "T2": ["B14", "B16"],
    "T3": [],
    "T4": ["D02", "D09"],
}
