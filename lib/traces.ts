import fs from "node:fs";
import path from "node:path";
import type { Scenario } from "./types";

/** Filesystem loaders for the recorded traces. Server-side only , 
 *  the pure types and scoring logic live in ./types so client
 *  components can import them without pulling in node:fs. */

export * from "./types";

const TRACE_DIR = path.join(process.cwd(), "data", "traces");

/** Scenario ids in the order they should be presented. ascending severity. */
export const SCENARIO_ORDER = ["wasted-call", "thrashing", "wrong-airport"];

export function loadScenario(id: string): Scenario {
  const raw = fs.readFileSync(path.join(TRACE_DIR, `${id}.json`), "utf-8");
  return JSON.parse(raw) as Scenario;
}

export function loadAllScenarios(): Scenario[] {
  return SCENARIO_ORDER.map(loadScenario);
}
