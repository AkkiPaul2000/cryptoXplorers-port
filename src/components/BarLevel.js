import React from "react";
import { Box, Typography } from "@mui/material";
import { Line } from "rc-progress";
import { numberWithCommas } from "../utils/formatters";

function BarLevel({ low, high, current, symbol }) {
  const range = high - low;
  const percent = range > 0 ? ((current - low) / range) * 100 : 50;

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        py: 2,
      }}
    >
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          24H LOW
        </Typography>
        <Typography variant="h6" color="primary.main" fontWeight={700}>
          {symbol} {numberWithCommas(low)}
        </Typography>
      </Box>

      <Box sx={{ flex: 1, px: 1 }}>
        <Line
          percent={percent}
          strokeWidth={6}
          trailWidth={6}
          trailColor="rgba(255,255,255,0.08)"
          strokeColor="#EEBC1D"
          style={{ borderRadius: 8 }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", textAlign: "center", mt: 0.5 }}
        >
          Current position in 24h range
        </Typography>
      </Box>

      <Box sx={{ textAlign: "right" }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          24H HIGH
        </Typography>
        <Typography variant="h6" color="primary.main" fontWeight={700}>
          {symbol} {numberWithCommas(high)}
        </Typography>
      </Box>
    </Box>
  );
}

export default BarLevel;
