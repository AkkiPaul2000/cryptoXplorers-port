import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import { tokens } from "../theme/theme";
import { formatPrice } from "../utils/formatters";

function BarLevel({ low, high, current, symbol }) {
  const range = high - low;
  const percent = Math.max(0, Math.min(100, range > 0 ? ((current - low) / range) * 100 : 50));
  const aboveLow = low ? ((current - low) / low) * 100 : 0;
  const belowHigh = high ? ((high - current) / high) * 100 : 0;

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          24h low
        </Typography>
        <Typography variant="overline" color="text.secondary">
          24h range
        </Typography>
        <Typography variant="overline" color="text.secondary">
          24h high
        </Typography>
      </Box>
      <Box
        sx={{
          position: "relative",
          height: 8,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${tokens.down}, ${tokens.gold}, ${tokens.up})`,
          opacity: 0.9,
        }}
      >
        <Tooltip title={`Now ${formatPrice(current, symbol)}`}>
          <Box
            className="slide-left"
            sx={{
              position: "absolute",
              top: "50%",
              left: `${percent}%`,
              width: 18,
              height: 18,
              borderRadius: "50%",
              bgcolor: tokens.text,
              border: `4px solid ${tokens.ink}`,
              boxShadow: `0 0 0 2px ${tokens.text}, 0 0 16px rgba(232,236,244,0.6)`,
              transform: "translate(-50%, -50%)",
              transition: "left 0.8s cubic-bezier(.2,.7,.2,1)",
              cursor: "help",
            }}
          />
        </Tooltip>
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5, gap: 2 }}>
        <Box>
          <Typography fontWeight={700}>{formatPrice(low, symbol)}</Typography>
          <Typography variant="caption" sx={{ color: tokens.up }}>
            +{aboveLow.toFixed(2)}% above low
          </Typography>
        </Box>
        <Box sx={{ textAlign: "right" }}>
          <Typography fontWeight={700}>{formatPrice(high, symbol)}</Typography>
          <Typography variant="caption" sx={{ color: tokens.down }}>
            −{belowHigh.toFixed(2)}% below high
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default BarLevel;
