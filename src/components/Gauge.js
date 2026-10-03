import React, { useId } from "react";
import { Box } from "@mui/material";
import { tokens } from "../theme/theme";

const ARC = "M 16 100 A 84 84 0 0 1 184 100";

// Semicircle gauge: 0 sits on the left, 100 on the right. Mount animation comes from
// "from"-only keyframes (.arc-in / .needle-in); later value changes use transitions.
function Gauge({ value = 0, stops, width = 220, children }) {
  const id = `gauge-${useId().replace(/:/g, "")}`;
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const angle = -90 + clamped * 1.8;

  return (
    <Box sx={{ width: "100%", maxWidth: width, mx: "auto", textAlign: "center" }}>
      <svg viewBox="0 0 200 112" width="100%" role="img" aria-label={`${Math.round(clamped)} out of 100`}>
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            {stops.map((color, index) => (
              <stop key={color + index} offset={index / (stops.length - 1)} stopColor={color} />
            ))}
          </linearGradient>
        </defs>
        <path d={ARC} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="14" strokeLinecap="round" />
        <path
          className="arc-in"
          d={ARC}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="14"
          strokeLinecap="round"
          pathLength="100"
          strokeDasharray="100"
          strokeDashoffset={100 - clamped}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.2,.7,.2,1)" }}
        />
        <g
          className="needle-in"
          style={{
            transform: `rotate(${angle}deg)`,
            transformOrigin: "100px 100px",
            transition: "transform 1.2s cubic-bezier(.34,1.3,.64,1)",
          }}
        >
          <line x1="100" y1="100" x2="100" y2="34" stroke={tokens.text} strokeWidth="3.5" strokeLinecap="round" />
        </g>
        <circle cx="100" cy="100" r="8" fill={tokens.surface} stroke={tokens.text} strokeWidth="3" />
      </svg>
      {children}
    </Box>
  );
}

export default Gauge;
