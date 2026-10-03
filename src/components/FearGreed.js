import React, { useState } from "react";
import { Box, Chip, Paper, Skeleton, Typography } from "@mui/material";
import api from "../api/client";
import { FearGreed as fearGreedUrl } from "../config/api";
import { useAbortableEffect } from "../hooks/useAbortable";
import { tokens } from "../theme/theme";
import Gauge from "./Gauge";
import { Sparkline } from "./Sparkline";
import { InfoTip } from "./ui";

const STOPS = [tokens.down, tokens.orange, tokens.gold, "#8BD17C", tokens.up];

function toneFor(value) {
  if (value <= 24) return { color: tokens.down, label: "Extreme Fear" };
  if (value <= 46) return { color: tokens.orange, label: "Fear" };
  if (value <= 54) return { color: tokens.gold, label: "Neutral" };
  if (value <= 74) return { color: "#8BD17C", label: "Greed" };
  return { color: tokens.up, label: "Extreme Greed" };
}

function untilUpdate(seconds) {
  const s = Number(seconds);
  if (!s) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
}

// Last 31 daily readings, newest first; null while loading, [] when unavailable.
export function useFearGreed() {
  const [rows, setRows] = useState(null);
  useAbortableEffect((signal, isAlive) => {
    api
      .get(fearGreedUrl(31), { signal, silent: true, cacheKey: "fng-31", cacheTtl: 600000 })
      .then(({ data }) => isAlive() && setRows(Array.isArray(data?.data) ? data.data : []))
      .catch((error) => isAlive() && error.code !== "ERR_CANCELED" && setRows([]));
  }, []);
  return rows;
}

function FearGreed() {
  const rows = useFearGreed();

  const card = { p: 2.5, height: "100%", display: "flex", flexDirection: "column" };

  if (!rows) {
    return (
      <Paper variant="glass" sx={card}>
        <Skeleton width="50%" />
        <Skeleton variant="rounded" height={130} sx={{ my: 2 }} />
        <Skeleton height={60} />
      </Paper>
    );
  }

  const now = rows[0];
  if (!now) {
    return (
      <Paper variant="glass" sx={{ ...card, justifyContent: "center" }}>
        <Typography variant="overline" color="text.secondary">
          Fear & Greed index
        </Typography>
        <Typography color="text.secondary" variant="body2">
          Sentiment data is unavailable right now.
        </Typography>
      </Paper>
    );
  }

  const value = Number(now.value);
  const tone = toneFor(value);
  const history = [
    ["Yesterday", rows[1]],
    ["Last week", rows[7]],
    ["Last month", rows[30]],
  ].filter(([, row]) => row);
  const trend = rows.map((row) => Number(row.value)).reverse();
  const next = untilUpdate(now.time_until_update);

  return (
    <Paper variant="glass" className="lift" sx={card}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1 }}>
          Fear & Greed index
        </Typography>
        {next && <Chip size="small" variant="outlined" label={`Next in ${next}`} sx={{ fontSize: 11 }} />}
        <InfoTip
          heading="Fear & Greed index"
          title={
            <>
              A 0–100 daily score of crypto market emotion built from volatility, momentum, social media and
              Bitcoin dominance.
              <Box component="span" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                <b>How to read it:</b> extreme fear has often been a better time to accumulate, while extreme greed
                tends to precede pullbacks.
              </Box>
            </>
          }
        />
      </Box>

      <Gauge value={value} stops={STOPS} width={230}>
        <Typography variant="h3" sx={{ mt: 0.5, color: tone.color, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography fontWeight={700} sx={{ color: tone.color }}>
          {now.value_classification || tone.label}
        </Typography>
      </Gauge>

      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${history.length}, 1fr)`, gap: 1, mt: 2.5 }}>
        {history.map(([label, row]) => {
          const past = toneFor(Number(row.value));
          return (
            <Box
              key={label}
              sx={{ textAlign: "center", p: 1, borderRadius: "12px", bgcolor: "rgba(148,163,184,0.06)" }}
            >
              <Typography variant="caption" color="text.secondary" display="block">
                {label}
              </Typography>
              <Typography fontWeight={800} sx={{ color: past.color }}>
                {row.value}
              </Typography>
              <Typography variant="caption" sx={{ color: past.color, fontSize: 10.5 }} noWrap display="block">
                {row.value_classification}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {trend.length > 2 && (
        <Box sx={{ mt: "auto", pt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            30-day sentiment trend
          </Typography>
          <Box sx={{ "& svg": { width: "100%" } }}>
            <Sparkline prices={trend} width={300} height={40} color={tone.color} />
          </Box>
        </Box>
      )}
    </Paper>
  );
}

export default FearGreed;
