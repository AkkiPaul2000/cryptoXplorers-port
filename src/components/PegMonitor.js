import React, { useMemo } from "react";
import { Box, Chip, Grid, Paper, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Line } from "react-chartjs-2";
import { CategoryScale, Chart as ChartJS, LinearScale, LineController, LineElement, PointElement, Tooltip } from "chart.js";
import AnchorIcon from "@mui/icons-material/Anchor";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import { tokens } from "../theme/theme";
import { formatMarketCap, formatPercent, formatPrice } from "../utils/formatters";
import { CardTitle } from "./ui";

ChartJS.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip);

const usd = (value) => `$${value.toFixed(4)}`;

function Stat({ label, value, hint, color }) {
  return (
    <Box sx={{ p: 1.5, borderRadius: "12px", bgcolor: "rgba(148,163,184,0.06)" }}>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography fontWeight={800} sx={{ color }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Box>
  );
}

// Stablecoins are judged on how tightly they hold $1, not on buy/sell technicals.
function PegMonitor({ coin, data, symbol, currency }) {
  const daily = useMemo(() => data.daily || [], [data.daily]);

  const chartData = useMemo(
    () => ({
      labels: daily.map((c) => new Date(c.t).toLocaleDateString([], { month: "short", day: "numeric" })),
      datasets: [
        { label: "Price", data: daily.map((c) => c.c), borderColor: tokens.cyan, borderWidth: 2, pointRadius: 0, tension: 0.2 },
        { label: "+0.5% band", data: daily.map(() => 1.005), borderColor: alpha(tokens.down, 0.55), borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
        { label: "$1.00 peg", data: daily.map(() => 1), borderColor: alpha(tokens.gold, 0.7), borderWidth: 1, pointRadius: 0 },
        { label: "−0.5% band", data: daily.map(() => 0.995), borderColor: alpha(tokens.down, 0.55), borderDash: [5, 5], borderWidth: 1, pointRadius: 0 },
      ],
    }),
    [daily]
  );

  if (data.loading) return <Skeleton variant="rounded" height={380} sx={{ borderRadius: "18px" }} />;
  if (!daily.length) {
    return (
      <Paper variant="glass" sx={{ p: 2.5 }}>
        <Typography color="text.secondary">Peg history is unavailable right now.</Typography>
      </Paper>
    );
  }

  const price = coin.usdPrice || daily[daily.length - 1].c;
  const deviation = (price - 1) * 100;
  const closes = daily.map((c) => c.c);
  const month = closes.slice(-30);
  const worst = Math.max(...closes.map((p) => Math.abs(p - 1))) * 100;
  const worstMonth = Math.max(...month.map((p) => Math.abs(p - 1))) * 100;
  const offPeg = closes.filter((p) => Math.abs(p - 1) > 0.005).length;
  const caps = daily.map((c) => c.mcap).filter(Boolean);
  const supply = caps.length > 30 ? (caps[caps.length - 1] / caps[0] - 1) * 100 : null;
  const status =
    Math.abs(deviation) < 0.3 && worstMonth < 0.5
      ? { label: "Holding its peg", color: tokens.up }
      : Math.abs(deviation) < 1
      ? { label: "Slight wobble — watch", color: tokens.gold }
      : { label: "Off peg", color: tokens.down };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(14, 20, 36, 0.95)",
        borderColor: tokens.line,
        borderWidth: 1,
        padding: 10,
        filter: (item) => item.datasetIndex === 0,
        callbacks: { label: (ctx) => `Price ${usd(ctx.parsed.y)}` },
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: tokens.muted, maxTicksLimit: 6, maxRotation: 0 } },
      y: {
        suggestedMin: 0.99,
        suggestedMax: 1.01,
        grid: { color: "rgba(148,163,184,0.07)" },
        ticks: { color: tokens.muted, callback: (value) => `$${Number(value).toFixed(3)}` },
      },
    },
  };

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={5}>
        <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
          <CardTitle
            icon={<AnchorIcon />}
            color={tokens.cyan}
            title="Peg health"
            info="A dollar stablecoin should trade at $1.00. Small wobbles are normal; moves beyond ±0.5% that last for days are a warning sign about reserves or redemptions."
          />
          <Chip label={status.label} sx={{ fontWeight: 800, color: tokens.ink, bgcolor: status.color, mb: 1.5 }} />
          <Typography variant="h3" sx={{ lineHeight: 1.1 }}>
            {usd(price)}
          </Typography>
          <Typography variant="body2" sx={{ color: status.color, fontWeight: 700, mb: 2 }}>
            {formatPercent(deviation)} from $1.00 ({Math.round(deviation * 100)} bps)
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Stat label="30-day range" value={`${usd(Math.min(...month))} – ${usd(Math.max(...month))}`} />
            <Stat label="Worst deviation (1y)" value={`±${worst.toFixed(2)}%`} color={worst > 1 ? tokens.down : tokens.text} />
            <Stat label="Days off peg (>0.5%)" value={`${offPeg} of ${closes.length}`} color={offPeg ? tokens.orange : tokens.up} />
            <Stat
              label="Supply change (1y)"
              value={supply == null ? "—" : formatPercent(supply)}
              hint={caps.length ? `Market cap ${formatMarketCap(caps[caps.length - 1], "$")}` : null}
              color={supply == null ? tokens.text : supply >= 0 ? tokens.up : tokens.down}
            />
          </Box>
          {currency !== "USD" && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              In {currency}, 1 {coin.symbol} ≈ {formatPrice(coin.current_price, symbol)} — it follows the USD/{currency} exchange rate.
            </Typography>
          )}
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.6 }}>
            Buy/sell ratings don't apply here: a stablecoin's job is to stay at $1. Investors use it to park cash or move between
            coins, so judge it on peg stability, reserves and issuer trust.
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} md={7}>
        <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
          <CardTitle icon={<ShowChartIcon />} color={tokens.gold} title="Price vs the $1 peg · 12 months" />
          <Box sx={{ height: { xs: 260, md: 320 } }}>
            <Line data={chartData} options={options} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Daily USD prices from CoinPaprika · dashed lines mark the ±0.5% band
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default PegMonitor;
