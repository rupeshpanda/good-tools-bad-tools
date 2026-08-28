import { ImageResponse } from "next/og";

/**
 * The social card.
 *
 * Rendered at build time by next/og. It carries the finding itself rather
 * than a logo, because the whole point of the lab fits in two lines of JSON:
 * one agent checks the destination, the other checks the airport the aircraft
 * has to leave from.
 */

export const alt =
  "Good Tools, Bad Tools. Two agents, the same question, different tool descriptions.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BG = "#FAFAF8";
const NAVY = "#0C1A2E";
const INK = "#111111";
const MUTED = "#6B7280";
const BORDER = "#E8E8E4";
const DANGER = "#B91C1C";
const SUCCESS = "#15803D";
const ACCENT = "#0D7377";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: BG,
          display: "flex",
          flexDirection: "column",
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            fontSize: 22,
            color: ACCENT,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Elegance AI Lab
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 76,
            color: NAVY,
            fontWeight: 700,
            letterSpacing: -1.5,
          }}
        >
          Good Tools, Bad Tools
        </div>

        <div
          style={{
            marginTop: 16,
            fontSize: 27,
            color: INK,
            lineHeight: 1.4,
            maxWidth: 980,
          }}
        >
          Two agents. The same question, the same data, the same model. Only the
          tool descriptions differ.
        </div>

        <div style={{ display: "flex", gap: 24, marginTop: 40 }}>
          <Panel
            label="Lazy description"
            colour={DANGER}
            call={'get_weather({ "airport": "JFK" })'}
            note="the destination"
          />
          <Panel
            label="Careful description"
            colour={SUCCESS}
            call={'get_weather({ "airport": "SFO" })'}
            note="where it has to take off"
          />
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            fontSize: 23,
            color: MUTED,
          }}
        >
          Both returned ok. Neither made an error. One of them was wrong.
        </div>
      </div>
    ),
    size,
  );
}

function Panel({
  label,
  colour,
  call,
  note,
}: {
  label: string;
  colour: string;
  call: string;
  note: string;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        border: `2px solid ${colour}40`,
        borderRadius: 12,
        background: "#FFFFFF",
        padding: "22px 26px",
      }}
    >
      <div
        style={{
          fontSize: 20,
          color: colour,
          textTransform: "uppercase",
          letterSpacing: 1.4,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 14,
          fontSize: 25,
          color: INK,
          fontFamily: "monospace",
        }}
      >
        {call}
      </div>
      <div style={{ marginTop: 12, fontSize: 21, color: MUTED }}>{note}</div>
      <div
        style={{
          marginTop: 14,
          borderTop: `1px solid ${BORDER}`,
          paddingTop: 12,
          fontSize: 19,
          color: MUTED,
        }}
      >
        status: ok
      </div>
    </div>
  );
}
