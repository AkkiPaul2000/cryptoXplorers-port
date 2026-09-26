import React from "react";
import { Box, Typography } from "@mui/material";

function Logo({ size = "md", showName = true }) {
  const sizes = {
    sm: { box: 28, font: 10, name: "subtitle2" },
    md: { box: 34, font: 11, name: "h6" },
    lg: { box: 44, font: 13, name: "h5" },
  };
  const s = sizes[size] || sizes.md;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
      <Box
        sx={{
          width: s.box,
          height: s.box,
          borderRadius: 1.5,
          display: "grid",
          placeItems: "center",
          bgcolor: "primary.main",
          color: "#0b0e11",
          fontWeight: 900,
          fontSize: s.font,
          letterSpacing: "0.06em",
          flexShrink: 0,
        }}
      >
        CRX
      </Box>
      {showName && (
        <Typography
          variant={s.name}
          sx={{ fontWeight: 800, color: "primary.main", letterSpacing: "-0.02em" }}
        >
          CryptoXplorers
        </Typography>
      )}
    </Box>
  );
}

export default React.memo(Logo);
