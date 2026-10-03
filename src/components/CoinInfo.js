import React, { memo, useMemo, useState } from "react";
import { Box, LinearProgress, Paper, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Line } from "react-chartjs-2";
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import api, { isRateLimited } from "../api/client";
import { CryptoState } from "../CryptoContext";
import { BinanceKlines, PaprikaHistory } from "../config/api";
import { chartDays } from "../config/data";
import { useAbortableEffect } from "../hooks/useAbortable";
import { tokens } from "../theme/theme";
import { formatMarketCap, formatPercent, formatPrice } from "../utils/formatters";
import BarLevel from "./BarLevel";
import SelectButtons from "./SelectButtons";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  LineController,
  BarElement,
  BarController,
  Tooltip,
  Filler
);

// Dashed vertical guide that follows the hovered candle.
const crosshair = {
  id: "crosshair",
  afterDatasetsDraw(chart) {
    const active = chart.tooltip?.getActiveElements?.();
    if (!active?.length) return;
    const { ctx, chartArea } = chart;
    const x = active[0].element.x;
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(232, 236, 244, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x, chartArea.top);
    ctx.lineTo(x, chartArea.bottom);
    ctx.stroke();
    ctx.restore();
  },
};

function axisLabel(time, days) {
  const date = new Date(time);
  if (days <= 1) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (days <= 90) return date.toLocaleDateString([], { month: "short", day: "numeric" });
  return date.toLocaleDateString([], { month: "short", year: "2-digit" });
}

function RangeStat({ label, value, color }) {
  return (
    <Box sx={{ px: 1.5, py: 1, borderRadius: "12px", bgcolor: "rgba(148,163,184,0.06)", minWidth: 0 }}>
      <Typography variant="caption" color="text.secondary" display="block" noWrap>
        {label}
      </Typography>
      <Typography fontWeight={700} noWrap sx={{ color, fontSize: { xs: 13, sm: 15 } }}>
        {value}
      </Typography>
    </Box>
  );
}

function CoinInfo({ coin }) {
  const [points, setPoints] = useState(null);
  const [days, setDays] = useState(1);
  const [loading, setLoading] = useState(true);
  const [chartNote, setChartNote] = useState("");
  const [source, setSource] = useState("binance");
  const { symbol } = CryptoState();
  const scale = coin.usdPrice ? coin.current_price / coin.usdPrice : 1;

  useAbortableEffect(
    (signal, isAlive) => {
      setLoading(true);
      setChartNote("");
      api
        .get(BinanceKlines(coin.symbol, days), {
          signal,
          silent: true,
          cacheKey: `klines-${coin.symbol}-${days}`,
          cacheTtl: 45000,
        })
        .then(({ data }) => {
          if (!isAlive()) return;
          // [openTime, close, quote volume in USDT]
          setPoints(data.map((candle) => [candle[0], Number(candle[4]), Number(candle[7])]));
          setSource("binance");
        })
        .catch((error) => {
          if (error.code === "ERR_CANCELED") throw error;
          // No {SYMBOL}USDT pair on Binance (Tether itself, LEO, …): use CoinPaprika's USD history.
          const hourly = days <= 1;
          return api
            .get(PaprikaHistory(coin.id, days), {
              signal,
              silent: true,
              cacheKey: `history-${coin.id}-${hourly ? "24h" : days >= 365 ? "1y" : days}`,
              cacheTtl: hourly ? 900000 : 3600000,
            })
            .then(({ data }) => {
              if (!isAlive()) return;
              // Rolling 24h volume: spread it across hourly points so the range total stays right.
              setPoints(data.map((row) => [Date.parse(row.timestamp), row.price, (row.volume_24h || 0) / (hourly ? 24 : 1)]));
              setSource("coinpaprika");
            });
        })
        .catch((error) => {
          if (!isAlive() || error.code === "ERR_CANCELED") return;
          setPoints([]);
          setChartNote(
            isRateLimited(error)
              ? "Chart paused: CoinPaprika's free plan allows 60 requests an hour. Try again in a few minutes."
              : "No price history is available for this coin right now."
          );
        })
        .finally(() => isAlive() && setLoading(false));
    },
    [coin.id, coin.symbol, days]
  );

  const series = useMemo(() => (points || []).map(([time, close, volume]) => [time, close * scale, volume]), [points, scale]);
  const prices = series.map((point) => point[1]);
  const first = prices[0];
  const last = prices[prices.length - 1];
  const change = first ? ((last - first) / first) * 100 : null;
  const color = change === null || change >= 0 ? tokens.up : tokens.down;
  const high = prices.length ? Math.max(...prices) : null;
  const low = prices.length ? Math.min(...prices) : null;
  const volume = series.reduce((sum, point) => sum + point[2], 0);
  const maxVolume = Math.max(1, ...series.map((point) => point[2]));

  const chartData = useMemo(
    () => ({
      labels: series.map((point) => point[0]),
      datasets: [
        {
          type: "line",
          label: "Price",
          data: series.map((point) => point[1]),
          yAxisID: "y",
          borderColor: color,
          borderWidth: 2,
          tension: 0.3,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: color,
          pointHoverBorderColor: tokens.text,
          pointHoverBorderWidth: 2,
          fill: true,
          backgroundColor: (context) => {
            const { ctx, chartArea } = context.chart;
            if (!chartArea) return "transparent";
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, alpha(color, 0.32));
            gradient.addColorStop(1, alpha(color, 0));
            return gradient;
          },
        },
        {
          type: "bar",
          label: "Volume",
          data: series.map((point) => point[2]),
          yAxisID: "volume",
          backgroundColor: "rgba(148, 163, 184, 0.18)",
          hoverBackgroundColor: alpha(tokens.gold, 0.5),
          borderRadius: 2,
          barPercentage: 0.9,
          categoryPercentage: 1,
        },
      ],
    }),
    [series, color]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700, easing: "easeOutQuart" },
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(14, 20, 36, 0.95)",
          borderColor: tokens.line,
          borderWidth: 1,
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          titleColor: tokens.muted,
          bodyColor: tokens.text,
          bodyFont: { weight: "600" },
          callbacks: {
            title: (items) =>
              new Date(Number(items[0].label)).toLocaleString([], {
                month: "short",
                day: "numeric",
                year: days > 90 ? "numeric" : undefined,
                hour: days <= 30 ? "2-digit" : undefined,
                minute: days <= 7 ? "2-digit" : undefined,
              }),
            label: (ctx) =>
              ctx.dataset.type === "bar"
                ? `Volume  ${formatMarketCap(ctx.parsed.y, "$")}`
                : `Price  ${formatPrice(ctx.parsed.y, symbol)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          border: { display: false },
          ticks: {
            maxTicksLimit: 6,
            maxRotation: 0,
            color: tokens.muted,
            callback(value) {
              return axisLabel(Number(this.getLabelForValue(value)), days);
            },
          },
        },
        y: {
          position: "right",
          grace: "8%",
          grid: { color: "rgba(148, 163, 184, 0.07)" },
          border: { display: false },
          ticks: { maxTicksLimit: 6, color: tokens.muted, callback: (value) => formatPrice(value, symbol) },
        },
        // Volume bars occupy the bottom quarter of the plot.
        volume: { display: false, min: 0, max: maxVolume * 4 },
      },
    }),
    [symbol, days, maxVolume]
  );

  const rangeLabel = chartDays.find((item) => item.value === days)?.label;

  return (
    <Paper variant="glass" sx={{ p: { xs: 2, md: 3 }, height: "100%", overflow: "hidden" }}>
      {loading && points && (
        <LinearProgress sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, borderRadius: 0 }} />
      )}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 2.5,
        }}
      >
        <Box sx={{ minWidth: 0, flex: "1 1 240px" }}>
          <Typography variant="h5">{coin.name} price chart</Typography>
          <Typography variant="body2" color="text.secondary">
            {source === "binance"
              ? `Binance ${coin.symbol}/USDT candles, converted to your currency`
              : `CoinPaprika ${days <= 1 ? "hourly" : "daily"} prices${days > 365 ? " (last 12 months)" : ""}, converted to your currency`}
          </Typography>
        </Box>
        <Box sx={{ flexShrink: 0, maxWidth: "100%" }}>
          <SelectButtons value={days} onChange={setDays} options={chartDays} label="Chart range" />
        </Box>
      </Box>

      {!points ? (
        <Skeleton variant="rounded" height={380} />
      ) : (
        <>
          {series.length > 0 && (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(4, 1fr)" }, gap: 1, mb: 2 }}>
              <RangeStat label={`${rangeLabel} change`} value={formatPercent(change)} color={color} />
              <RangeStat label={`${rangeLabel} high`} value={formatPrice(high, symbol)} />
              <RangeStat label={`${rangeLabel} low`} value={formatPrice(low, symbol)} />
              <RangeStat label={`${rangeLabel} volume`} value={formatMarketCap(volume, "$")} />
            </Box>
          )}
          <Box sx={{ height: { xs: 280, md: 360 }, opacity: loading ? 0.5 : 1, transition: "opacity 0.3s" }}>
            {series.length ? (
              <Line data={chartData} options={chartOptions} plugins={[crosshair]} />
            ) : (
              <Box sx={{ height: "100%", display: "grid", placeItems: "center", textAlign: "center", px: 2 }}>
                <Typography color="text.secondary">{chartNote || "No chart points returned for this range."}</Typography>
              </Box>
            )}
          </Box>
        </>
      )}

      {coin.low_24h && coin.high_24h && coin.current_price && (
        <Box sx={{ mt: 3 }}>
          <BarLevel low={coin.low_24h} high={coin.high_24h} current={coin.current_price} symbol={symbol} />
        </Box>
      )}
    </Paper>
  );
}

export default memo(CoinInfo);
