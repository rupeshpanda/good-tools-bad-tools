/**
 * The six tools, ported from agent/tools.py for the live demo.
 *
 * PARITY MATTERS. The page claims a result that was measured against the
 * Python implementation, so these functions and the data below must behave
 * identically to `agent/data.py` and `agent/tools.py`. If you change one side,
 * change the other and re-run `python agent/record.py`.
 *
 * As in the Python: no model code anywhere in this file. These are ordinary
 * functions that would work fine if you deleted the model.
 */

export const FLIGHTS: Record<
  string,
  {
    status: string;
    gate: string;
    departure_time: string;
    delay_minutes: number;
    tail_number: string;
    aircraft_type: string;
    origin: string;
    destination: string;
  }
> = {
  // SFO fog is the whole point: the flight looks healthy and the aircraft is
  // clean, so weather at the ORIGIN is the only signal it is at risk.
  AA118: {
    status: "scheduled",
    gate: "B12",
    departure_time: "2026-08-27T07:45:00",
    delay_minutes: 0,
    tail_number: "N317AA",
    aircraft_type: "A320",
    origin: "SFO",
    destination: "JFK",
  },
  AA119: {
    status: "scheduled",
    gate: "D06",
    departure_time: "2026-08-27T20:15:00",
    delay_minutes: 0,
    tail_number: "N738AA",
    aircraft_type: "B738",
    origin: "JFK",
    destination: "LAX",
  },
  UA455: {
    status: "delayed",
    gate: "C08",
    departure_time: "2026-08-27T18:30:00",
    delay_minutes: 35,
    tail_number: "N842UA",
    aircraft_type: "B738",
    origin: "ORD",
    destination: "DEN",
  },
  DL290: {
    status: "departed",
    gate: "A14",
    departure_time: "2026-08-27T08:30:00",
    delay_minutes: 0,
    tail_number: "N661DN",
    aircraft_type: "A321",
    origin: "ATL",
    destination: "LAX",
  },
  B6712: {
    status: "cancelled",
    gate: "C02",
    departure_time: "2026-08-27T09:00:00",
    delay_minutes: 0,
    tail_number: "N593JB",
    aircraft_type: "A321",
    origin: "BOS",
    destination: "MCO",
  },
};

const AIRCRAFT: Record<string, Record<string, string | number>> = {
  A320: {
    manufacturer: "Airbus",
    length_m: 37.6,
    wingspan_m: 35.8,
    capacity_passengers: 180,
    fuel_capacity_liters: 24210,
  },
  B738: {
    manufacturer: "Boeing",
    length_m: 39.5,
    wingspan_m: 35.8,
    capacity_passengers: 189,
    fuel_capacity_liters: 26020,
  },
  A321: {
    manufacturer: "Airbus",
    length_m: 44.5,
    wingspan_m: 35.8,
    capacity_passengers: 220,
    fuel_capacity_liters: 30030,
  },
};

const PASSENGERS: Record<
  string,
  { booking_ref: string; flight_number: string; seat: string; destination: string }
> = {
  "james okafor": {
    booking_ref: "AW7X9K",
    flight_number: "AA118",
    seat: "14C",
    destination: "JFK",
  },
  "maria delgado": {
    booking_ref: "AW3M2L",
    flight_number: "AA119",
    seat: "22A",
    destination: "LAX",
  },
  "david chen": {
    booking_ref: "AW9P4R",
    flight_number: "UA455",
    seat: "8F",
    destination: "DEN",
  },
  "sarah whitfield": {
    booking_ref: "AW1Q7T",
    flight_number: "B6712",
    seat: "17B",
    destination: "MCO",
  },
  "marcus reilly": {
    booking_ref: "AW5N8D",
    flight_number: "DL290",
    seat: "3A",
    destination: "LAX",
  },
};

// Keyed by tail number. No key here is an aircraft type. Passing "B738"
// returns a not-found error, which is deliberate.
const MAINTENANCE: Record<
  string,
  {
    last_inspection_date: string;
    hours_flown_since_inspection: number;
    outstanding_issues: string[];
  }
> = {
  N317AA: {
    last_inspection_date: "2026-08-16",
    hours_flown_since_inspection: 42.5,
    outstanding_issues: [],
  },
  N738AA: {
    last_inspection_date: "2026-07-28",
    hours_flown_since_inspection: 88.3,
    outstanding_issues: ["hydraulic sensor warning - deferred"],
  },
  N842UA: {
    last_inspection_date: "2026-08-21",
    hours_flown_since_inspection: 12.0,
    outstanding_issues: [],
  },
  N661DN: {
    last_inspection_date: "2026-08-09",
    hours_flown_since_inspection: 61.7,
    outstanding_issues: [],
  },
  N593JB: {
    last_inspection_date: "2026-08-07",
    hours_flown_since_inspection: 60.0,
    outstanding_issues: ["APU inoperative - flight cancelled pending repair"],
  },
};

const WEATHER: Record<
  string,
  {
    visibility_km: number;
    wind_kph: number;
    temperature_c: number;
    conditions: string;
  }
> = {
  SFO: { visibility_km: 0.8, wind_kph: 11, temperature_c: 13, conditions: "dense fog" },
  JFK: { visibility_km: 10.0, wind_kph: 16, temperature_c: 24, conditions: "clear" },
  ORD: { visibility_km: 4.0, wind_kph: 47, temperature_c: 19, conditions: "thunderstorms" },
  LAX: { visibility_km: 9.5, wind_kph: 12, temperature_c: 22, conditions: "partly cloudy" },
  DEN: { visibility_km: 10.0, wind_kph: 21, temperature_c: 27, conditions: "clear" },
  ATL: { visibility_km: 8.0, wind_kph: 14, temperature_c: 29, conditions: "humid haze" },
  BOS: { visibility_km: 6.5, wind_kph: 33, temperature_c: 18, conditions: "heavy rain" },
};

// Open gates only, deliberately disjoint from gates already assigned above.
const GATES: Record<string, string[]> = {
  T1: ["A03", "A05"],
  T2: ["B14", "B16"],
  T3: [],
  T4: ["D02", "D09"],
};

export type ToolResult = Record<string, unknown> & {
  status: "ok" | "error";
};

const err = (message: string): ToolResult => ({ status: "error", message });

export const TOOL_FUNCTIONS: Record<
  string,
  (args: Record<string, string>) => ToolResult
> = {
  get_flight_status: ({ flight_number }) => {
    const f = FLIGHTS[String(flight_number ?? "").toUpperCase()];
    if (!f) return err(`No flight found with number '${flight_number}'`);
    return {
      status: "ok",
      flight_number: String(flight_number).toUpperCase(),
      flight_status: f.status,
      gate: f.gate,
      departure_time: f.departure_time,
      delay_minutes: f.delay_minutes,
      tail_number: f.tail_number,
      aircraft_type: f.aircraft_type,
      origin: f.origin,
      destination: f.destination,
    };
  },

  search_passenger: ({ name }) => {
    const p = PASSENGERS[String(name ?? "").toLowerCase()];
    if (!p) return err(`No passenger found with name '${name}'`);
    return { status: "ok", name, ...p };
  },

  maintenance_history: ({ tail_number }) => {
    const m = MAINTENANCE[String(tail_number ?? "").toUpperCase()];
    if (!m) {
      return err(
        `No maintenance record found for tail number '${tail_number}'. This ` +
          `lookup is keyed by aircraft registration (e.g. 'N317AA'), not by ` +
          `aircraft type.`,
      );
    }
    return { status: "ok", tail_number: String(tail_number).toUpperCase(), ...m };
  },

  find_available_gate: ({ terminal }) => {
    const gates = GATES[String(terminal ?? "").toUpperCase()];
    if (!gates) return err(`No terminal found with identifier '${terminal}'`);
    if (!gates.length) {
      return err(`No open gates currently available in terminal '${terminal}'`);
    }
    return { status: "ok", terminal: String(terminal).toUpperCase(), gate: gates[0] };
  },

  lookup_aircraft: ({ aircraft_type }) => {
    const a = AIRCRAFT[String(aircraft_type ?? "").toUpperCase()];
    if (!a) {
      return err(
        `No aircraft found with type '${aircraft_type}'. This lookup is keyed ` +
          `by aircraft type (e.g. 'A320'), not by tail number.`,
      );
    }
    return { status: "ok", aircraft_type: String(aircraft_type).toUpperCase(), ...a };
  },

  get_weather: ({ airport }) => {
    const w = WEATHER[String(airport ?? "").toUpperCase()];
    if (!w) return err(`Weather service has no station for '${airport}'`);
    return { status: "ok", airport: String(airport).toUpperCase(), ...w };
  },
};

export function executeTool(
  name: string,
  args: Record<string, string>,
): ToolResult {
  const fn = TOOL_FUNCTIONS[name];
  if (!fn) return err(`Unknown tool '${name}'`);
  try {
    return fn(args);
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e));
  }
}
