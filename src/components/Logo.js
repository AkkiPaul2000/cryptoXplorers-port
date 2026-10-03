import React from "react";
import { Box, Typography } from "@mui/material";
import { goldGradient, tokens } from "../theme/theme";

const SIZES = {
  sm: { box: 30, font: 10, name: "subtitle1" },
  md: { box: 36, font: 11, name: "h6" },
  lg: { box: 88, font: 22, name: "h4" },
};

function Logo({ size = "md", showName = true, compact = false }) {
  const s = SIZES[size] || SIZES.md;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: s.box,
          height: s.box,
          borderRadius: s.box > 60 ? "26px" : "11px",
          display: "grid",
          placeItems: "center",
          background: goldGradient,
          color: tokens.ink,
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 700,
          fontSize: s.font,
          letterSpacing: "0.04em",
          flexShrink: 0,
          boxShadow: `0 0 0 1px rgba(255,255,255,0.12) inset, 0 8px ${s.box / 2}px -6px rgba(238,188,29,0.55)`,
        }}
      >
        CRX
      </Box>
      {showName && (
        <Typography
          variant={s.name}
          sx={{
            display: { xs: compact ? "none" : "block", sm: "block" },
            fontWeight: 700,
            letterSpacing: "-0.02em",
            whiteSpace: "nowrap",
          }}
        >
          Crypto
          <Box component="span" sx={{ color: "primary.main" }}>
            Xplorers
          </Box>
        </Typography>
      )}
    </Box>
  );
}

export default React.memo(Logo);
