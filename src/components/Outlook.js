import React from "react";
import { Box, LinearProgress, Paper, Typography } from "@mui/material";
import { tokens } from "../theme/theme";
import Gauge from "./Gauge";
import { IconBadge, InfoTip } from "./ui";

const STOPS = [tokens.down, tokens.orange, tokens.gold, "#8BD17C", tokens.up];
export const biasColor = (score) => (score >= 55 ? tokens.up : score <= 45 ? tokens.down : tokens.gold);

// Gauge + factor bars for a { score, label, parts } outlook from utils/signals.
function Outlook({ outlook, title, icon, color = tokens.violet, info, footnote }) {
  const tone = biasColor(outlook.score);
  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <IconBadge color={color} size={34}>
          {icon}
        </IconBadge>
        <Typography variant="h6" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {info && <InfoTip heading={title} title={info} />}
      </Box>
      <Gauge value={outlook.score} stops={STOPS} width={230}>
        <Typography variant="h3" sx={{ mt: 0.5, color: tone, lineHeight: 1 }}>
          {outlook.score}
        </Typography>
        <Typography fontWeight={700} sx={{ color: tone }}>
          {outlook.label}
        </Typography>
      </Gauge>
      <Box sx={{ display: "grid", gap: 1.5, mt: 2.5 }}>
        {outlook.parts
          .filter((part) => part.weight > 0)
          .map((part) => (
            <Box key={part.label}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" fontWeight={600}>
                  {part.label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ color: biasColor(part.score) }}>
                  {Math.round(part.score)}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={part.score}
                sx={{ my: 0.5, "& .MuiLinearProgress-bar": { bgcolor: biasColor(part.score) } }}
              />
              <Typography variant="caption" color="text.secondary">
                {part.detail}
              </Typography>
            </Box>
          ))}
      </Box>
      {footnote && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, fontStyle: "italic" }}>
          {footnote}
        </Typography>
      )}
    </Paper>
  );
}

export default Outlook;
