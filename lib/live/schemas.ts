/**
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

export const COMPLETE_TOOLS = [
  {
    "name": "get_flight_status",
    "description": "Returns the current status (scheduled/delayed/departed/cancelled), the ASSIGNED gate, scheduled departure time, delay in minutes, and the tail number of the specific aircraft operating a flight, identified by its flight number (e.g. 'AA118'). Use this to answer questions about a flight's current or scheduled state, and to find which gate a flight is already departing from. This returns the gate the flight is assigned to - it does NOT find a new or empty gate. It is also the only way to get the tail number for a flight, which other tools need.",
    "input_schema": {
      "type": "object",
      "properties": {
        "flight_number": {
          "type": "string",
          "description": "Airline flight number, carrier code plus digits, e.g. 'AA118', 'UA455', 'DL290'."
        }
      },
      "required": [
        "flight_number"
      ]
    }
  },
  {
    "name": "search_passenger",
    "description": "Looks up one passenger by their full name and returns their booking reference, the flight number they are booked on, their seat, and their destination. Use this when a question names a person rather than a flight. It returns only booking details - to find out anything about the state of that passenger's flight, pass the returned flight number to get_flight_status.",
    "input_schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string",
          "description": "Passenger's full name, first and last, e.g. 'James Okafor'."
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "maintenance_history",
    "description": "Returns the last inspection date, hours flown since that inspection, and any outstanding or deferred technical issues for ONE specific physical airframe, identified by its tail number (e.g. 'N317AA'). Use this to judge whether a particular aircraft is airworthy or likely to cause a delay. This is keyed by tail number only - an aircraft type code such as 'B738' will NOT be found. If you have a flight number but not a tail number, call get_flight_status first to obtain it.",
    "input_schema": {
      "type": "object",
      "properties": {
        "tail_number": {
          "type": "string",
          "description": "US aircraft registration ('tail number'), always beginning with N, e.g. 'N317AA'. Not an aircraft type code like 'A320'."
        }
      },
      "required": [
        "tail_number"
      ]
    }
  },
  {
    "name": "find_available_gate",
    "description": "Returns an OPEN, currently unassigned gate in a given terminal. Use this only when a question asks for a new gate to be found or assigned - for example when a flight has to be moved. Do NOT use this to look up the gate a flight is already departing from; that is get_flight_status. The gate this returns is free precisely because no flight is using it.",
    "input_schema": {
      "type": "object",
      "properties": {
        "terminal": {
          "type": "string",
          "description": "Terminal identifier, e.g. 'T2'."
        }
      },
      "required": [
        "terminal"
      ]
    }
  },
  {
    "name": "lookup_aircraft",
    "description": "Returns manufacturer, physical dimensions, passenger capacity, and fuel capacity for an aircraft TYPE - the model of aircraft, e.g. 'A320' or 'B738'. Use this for general questions about what a model of aircraft can do, such as seating capacity or fuel and cargo planning. It describes a model in general, not one specific airframe, so it knows nothing about any individual aircraft's condition or maintenance - use maintenance_history for that.",
    "input_schema": {
      "type": "object",
      "properties": {
        "aircraft_type": {
          "type": "string",
          "description": "Aircraft type/model code, e.g. 'A320', 'B738', 'A321'. Not a tail number like 'N317AA'."
        }
      },
      "required": [
        "aircraft_type"
      ]
    }
  },
  {
    "name": "get_weather",
    "description": "Returns current visibility in kilometres, wind speed, temperature, and conditions at ONE airport, identified by its 3-letter IATA code (e.g. 'SFO', 'JFK', 'ORD'). Use this whenever a question depends on flying conditions - in particular, whether fog, wind, or low visibility at the ORIGIN airport could delay a departure. A flight can show as on time with a clean aircraft and still be at risk because of weather, so check this before judging whether a departure will hold. Requires an airport code - it cannot resolve a flight number or a city name. If you only have a flight number, call get_flight_status first to get the origin airport.",
    "input_schema": {
      "type": "object",
      "properties": {
        "airport": {
          "type": "string",
          "description": "3-letter IATA airport code, e.g. 'SFO'."
        }
      },
      "required": [
        "airport"
      ]
    }
  }
] as const satisfies readonly ToolSchema[];

export const LAZY_TOOLS = [
  {
    "name": "get_flight_status",
    "description": "Gets flight info.",
    "input_schema": {
      "type": "object",
      "properties": {
        "flight_number": {
          "type": "string"
        }
      },
      "required": [
        "flight_number"
      ]
    }
  },
  {
    "name": "search_passenger",
    "description": "Finds a passenger.",
    "input_schema": {
      "type": "object",
      "properties": {
        "name": {
          "type": "string"
        }
      },
      "required": [
        "name"
      ]
    }
  },
  {
    "name": "maintenance_history",
    "description": "Maintenance info for an aircraft.",
    "input_schema": {
      "type": "object",
      "properties": {
        "tail_number": {
          "type": "string"
        }
      },
      "required": [
        "tail_number"
      ]
    }
  },
  {
    "name": "find_available_gate",
    "description": "Gets a gate.",
    "input_schema": {
      "type": "object",
      "properties": {
        "terminal": {
          "type": "string"
        }
      },
      "required": [
        "terminal"
      ]
    }
  },
  {
    "name": "lookup_aircraft",
    "description": "Aircraft details.",
    "input_schema": {
      "type": "object",
      "properties": {
        "aircraft_type": {
          "type": "string"
        }
      },
      "required": [
        "aircraft_type"
      ]
    }
  },
  {
    "name": "get_weather",
    "description": "Gets weather info.",
    "input_schema": {
      "type": "object",
      "properties": {
        "airport": {
          "type": "string"
        }
      },
      "required": [
        "airport"
      ]
    }
  }
] as const satisfies readonly ToolSchema[];

/** Identical for both variants - the system prompt is not the variable. */
export const SYSTEM_PROMPT = "You are FlightOps, an AI Operations Officer for AeroWing Airlines. You have tools that read live flight, maintenance, gate, and weather data. Always use tools to ground your answers in current data rather than guessing. For questions that depend on multiple factors (e.g. whether a flight will depart on time depends on weather AND maintenance AND gate status), call every tool relevant to those factors before answering - do not stop after the first tool call if more information is needed to give a complete answer. If a tool returns {\"status\": \"error\", ...}, explain the failure to the user in plain language rather than making up an answer.";

export const VARIANTS = {
  lazy: LAZY_TOOLS,
  complete: COMPLETE_TOOLS,
} as const;

export type VariantKey = keyof typeof VARIANTS;
