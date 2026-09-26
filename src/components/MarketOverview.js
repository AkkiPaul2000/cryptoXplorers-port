import React, { memo, useEffect, useState } from "react";
import { Box, Grid, Paper, Typography } from "@mui/material";
import api from "../api/client";
import { GlobalData } from "../config/api";
import { formatMarketCap, formatPercent } from "../utils/formatters";
import FearGreed from "./FearGreed";

function StatCard({ label, value, subValue, delay = 0 }) {
  return (
    <Paper
      elevation={0}
      className="rise-in"
      sx={{
        p: 2.5,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
        animationDelay: `${delay}ms`,
        transition: "transform 0.25s ease, border-color 0.25s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: "rgba(238, 188, 29, 0.45)",
        },
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        {label}
      </Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {subValue && (
        <Typography
          variant="body2"
          sx={{
            mt: 0.5,
            color: String(subValue).startsWith("+") ? "secondary.main" : "error.main",
            fontWeight: 600,
          }}
        >
          {subValue}
        </Typography>
      )}
    </Paper>
  );
}

function MarketOverview() {
  const [global, setGlobal] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const fetchGlobal = async () => {
      try {
        const { data } = await api.get(GlobalData(), {
          signal: controller.signal,
          cacheKey: "global-market",
          cacheTtl: 120000,
        });
        if (alive) setGlobal(data);
      } catch (error) {
        if (!alive || error.code === "ERR_CANCELED") return;
        setGlobal(null);
      }
    };
    fetchGlobal();
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  const marketCap = global?.market_cap_usd;
  const volume = global?.volume_24h_usd;
  const change = global?.market_cap_change_24h;
  const dominance = global?.bitcoin_dominance_percentage;
  const volumeChange = global?.volume_24h_change_24h;

  return (
    <Box sx={{ mb: 4 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FearGreed />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="Total Market Cap"
            value={formatMarketCap(marketCap, "$")}
            subValue={change ? `${formatPercent(change)} (24h)` : null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="24h Trading Volume"
            value={formatMarketCap(volume, "$")}
            delay={80}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="BTC Dominance"
            value={dominance ? `${dominance.toFixed(1)}%` : "—"}
            delay={120}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            label="24h Volume Change"
            value={volumeChange != null ? formatPercent(volumeChange) : "—"}
            delay={160}
          />
        </Grid>
        <Grid item xs={12} sm={12} md={4}>
          <StatCard
            label="Active Cryptocurrencies"
            value={global?.cryptocurrencies_number?.toLocaleString() ?? "—"}
            delay={200}
          />
        </Grid>
      </Grid>
    </Box>
  );
}

export default memo(MarketOverview);
