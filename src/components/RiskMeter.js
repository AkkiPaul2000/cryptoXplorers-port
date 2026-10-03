import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import ShieldIcon from "@mui/icons-material/Shield";
import { riskBand } from "../utils/risk";
import { tokens } from "../theme/theme";
import Gauge from "./Gauge";
import { IconBadge, InfoTip } from "./ui";

const STOPS = [tokens.up, tokens.gold, tokens.orange, tokens.down];

function RiskMeter({ score, title = "Speculation risk", factors = [] }) {
  const band = riskBand(score);

  return (
    <Paper variant="glass" className="lift" sx={{ p: 2.5, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <IconBadge color={band.color} size={34}>
          <ShieldIcon />
        </IconBadge>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
          {title}
        </Typography>
        <InfoTip title="A 0–100 heuristic built from the 24h trading range, 7d and 30d swings, beta and market-cap rank. Higher means sharper price swings — not a prediction." />
      </Box>
      <Gauge value={score} stops={STOPS} width={210}>
        <Typography variant="h3" sx={{ mt: 0.5, color: band.color, lineHeight: 1 }}>
          {score}
        </Typography>
        <Typography fontWeight={700} sx={{ color: band.color }}>
          {band.label}
        </Typography>
      </Gauge>
      {factors.length > 0 && (
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 2 }}>
          {factors.map(([label, value]) => (
            <Box key={label} sx={{ px: 1.25, py: 0.75, borderRadius: "10px", bgcolor: "rgba(148,163,184,0.06)" }}>
              <Typography variant="caption" color="text.secondary" display="block">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}

export default RiskMeter;
