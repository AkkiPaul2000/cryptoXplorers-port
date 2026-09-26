import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import api from "../api/client";
import { FearGreed as fearGreedUrl } from "../config/api";

function toneFor(value) {
  if (value <= 24) return { color: "#f6465d", label: "Extreme Fear" };
  if (value <= 46) return { color: "#f39c12", label: "Fear" };
  if (value <= 54) return { color: "#EEBC1D", label: "Neutral" };
  if (value <= 74) return { color: "#0ecb81", label: "Greed" };
  return { color: "#00d4aa", label: "Extreme Greed" };
}

function FearGreed() {
  const [reading, setReading] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get(fearGreedUrl());
        const row = data?.data?.[0];
        if (!row) return;
        setReading({
          value: Number(row.value),
          classification: row.value_classification,
        });
      } catch {
        setReading(null);
      }
    };
    load();
  }, []);

  if (!reading) return null;

  const tone = toneFor(reading.value);

  return (
    <Paper
      elevation={0}
      className="rise-in"
      sx={{
        p: 2.5,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        display: "flex",
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box
        sx={{
          width: 84,
          height: 84,
          borderRadius: "50%",
          background: `conic-gradient(${tone.color} ${reading.value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 62,
            height: 62,
            borderRadius: "50%",
            bgcolor: "background.paper",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Typography fontWeight={800} sx={{ color: tone.color }}>
            {reading.value}
          </Typography>
        </Box>
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary" fontWeight={700}>
          Fear & Greed
        </Typography>
        <Typography variant="h6" fontWeight={800} sx={{ color: tone.color }}>
          {reading.classification || tone.label}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Crypto market sentiment, updated daily
        </Typography>
      </Box>
    </Paper>
  );
}

export default FearGreed;
