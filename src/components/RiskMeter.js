import React from "react";
import { Box, Typography } from "@mui/material";
import { riskBand } from "../utils/risk";

const TONE = {
  calm: "#0ecb81",
  steady: "#7dcea0",
  watch: "#EEBC1D",
  hot: "#f39c12",
  risk: "#e67e22",
  extreme: "#f6465d",
};

function RiskMeter({ score, title = "Gamble risk" }) {
  const band = riskBand(score);
  const color = TONE[band.tone];

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        background:
          "linear-gradient(180deg, rgba(238,188,29,0.08), rgba(20,22,26,0.4))",
      }}
    >
      <Typography variant="overline" color="text.secondary" letterSpacing={1.5}>
        {title}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, mt: 1 }}>
        <Box
          sx={{
            width: 108,
            height: 108,
            borderRadius: "50%",
            background: `conic-gradient(${color} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
            boxShadow: `0 0 24px ${color}33`,
          }}
        >
          <Box
            sx={{
              width: 78,
              height: 78,
              borderRadius: "50%",
              bgcolor: "background.paper",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Typography variant="h5" fontWeight={800} sx={{ color }}>
              {score}
            </Typography>
          </Box>
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={800} sx={{ color }}>
            {band.label}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 280 }}>
            Built from 24h range, weekly swing, and market-cap rank. Higher means
            sharper price swings.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default RiskMeter;
