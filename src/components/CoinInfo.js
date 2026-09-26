import api from "../api/client";
import React, { memo, useMemo, useState } from "react";
import { Box, Paper, Skeleton, Typography } from "@mui/material";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { CryptoState } from "../CryptoContext";
import { BinanceKlines } from "../config/api";
import { chartDays } from "../config/data";
import { useAbortableEffect } from "../hooks/useAbortable";
import SelectButtons from "./SelectButtons";
import BarLevel from "./BarLevel";
import { numberWithCommas } from "../utils/formatters";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler
);

function CoinInfo({ coin }) {
  const [historicData, setHistoricData] = useState(null);
  const [days, setDays] = useState(1);
  const [chartNote, setChartNote] = useState("");
  const { symbol } = CryptoState();

  useAbortableEffect((signal, isAlive) => {
    const load = async () => {
      setHistoricData(null);
      setChartNote("");
      try {
        const { data } = await api.get(BinanceKlines(coin.symbol, days), {
          signal,
          silent: true,
          cacheKey: `klines-${coin.symbol}-${days}`,
          cacheTtl: 45000,
        });
        if (!isAlive()) return;
        const scale = coin.usdPrice ? coin.current_price / coin.usdPrice : 1;
        setHistoricData(data.map((point) => [point[0], Number(point[4]) * scale]));
      } catch (error) {
        if (!isAlive() || error.code === "ERR_CANCELED") return;
        setHistoricData([]);
        setChartNote("This pair is not listed on Binance, so the price chart is unavailable.");
      }
    };
    load();
  }, [coin.symbol, coin.usdPrice, coin.current_price, days]);

  const chartData = useMemo(
    () => ({
      labels: (historicData || []).map((point) => {
        const date = new Date(point[0]);
        return days === 1
          ? date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : date.toLocaleDateString();
      }),
      datasets: [
        {
          data: (historicData || []).map((point) => point[1]),
          label: "Price",
          borderColor: "#EEBC1D",
          backgroundColor: "rgba(238, 188, 29, 0.08)",
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          pointHoverRadius: 3,
          borderWidth: 2,
        },
      ],
    }),
    [historicData, days]
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 350 },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `${symbol} ${numberWithCommas(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: { maxTicksLimit: 6, color: "#8b949e" },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.04)" },
          ticks: {
            maxTicksLimit: 6,
            color: "#8b949e",
            callback: (val) => `${symbol}${numberWithCommas(val)}`,
          },
        },
      },
    }),
    [symbol]
  );

  return (
    <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Price Chart
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Historical price movement over selected timeframe
        </Typography>

        {!historicData ? (
          <Skeleton variant="rounded" height={320} />
        ) : (
          <>
            <Box sx={{ height: { xs: 280, md: 360 } }}>
              {historicData.length ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <Typography color="text.secondary" sx={{ py: 8, textAlign: "center" }}>
                  {chartNote || "No chart points returned for this range."}
                </Typography>
              )}
            </Box>

            {coin.low_24h && coin.high_24h && coin.current_price && (
              <BarLevel
                low={coin.low_24h}
                high={coin.high_24h}
                current={coin.current_price}
                symbol={symbol}
              />
            )}

            <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
              <SelectButtons value={days} onChange={setDays} options={chartDays} />
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
}

export default memo(CoinInfo);
