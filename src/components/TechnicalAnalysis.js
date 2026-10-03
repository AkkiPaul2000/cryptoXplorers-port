import React, { useMemo, useState } from "react";
import { Alert, Box, Chip, Grid, Paper, Skeleton, Tab, Table, TableBody, TableCell, TableHead, TableRow, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Bar } from "react-chartjs-2";
import { BarController, BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip as ChartTooltip } from "chart.js";
import BoltIcon from "@mui/icons-material/Bolt";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import SavingsIcon from "@mui/icons-material/Savings";
import HowToVoteIcon from "@mui/icons-material/HowToVote";
import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import TimelineIcon from "@mui/icons-material/Timeline";
import QueryStatsIcon from "@mui/icons-material/QueryStats";
import CandlestickChartIcon from "@mui/icons-material/CandlestickChart";
import useTechnicals from "../hooks/useTechnicals";
import { tokens } from "../theme/theme";
import { formatDate, formatPercent, formatPrice, timeAgo } from "../utils/formatters";
import { isPegged } from "../utils/signals";
import { RATINGS, horizonFit, periodReturn, ratingOf, signalEvents, technicalSummary } from "../utils/technicals";
import Gauge from "./Gauge";
import PegMonitor from "./PegMonitor";
import TechnicalLevels from "./TechnicalLevels";
import { CardTitle, IconBadge, Reveal, SectionTitle } from "./ui";

ChartJS.register(BarController, BarElement, CategoryScale, LinearScale, ChartTooltip, Legend);

export const RATING_COLORS = {
  "Strong buy": tokens.up,
  Buy: "#7DD3A8",
  Hold: tokens.gold,
  Sell: "#F97316",
  "Strong sell": tokens.down,
};

const SIGNALS = {
  buy: { label: "Buy", color: tokens.up },
  neutral: { label: "Neutral", color: tokens.muted },
  sell: { label: "Sell", color: tokens.down },
};

const GAUGE_STOPS = [tokens.down, "#F97316", tokens.gold, "#7DD3A8", tokens.up];

// `ma` is the moving average each horizon watches most (in candles of that horizon's chart).
const HORIZONS = [
  { key: "short", title: "Short term", span: "Days to 2 weeks", frames: ["hourly", "daily"], ma: ["exponential", 20], icon: <BoltIcon /> },
  { key: "medium", title: "Medium term", span: "2 weeks to 3 months", frames: ["daily"], ma: ["simple", 50], icon: <ShowChartIcon /> },
  { key: "long", title: "Long term", span: "3 months and longer", frames: ["weekly", "daily"], ma: ["simple", 50], icon: <SavingsIcon /> },
];

const UNIT = { hourly: "hour", daily: "day", weekly: "week" };

// The three readings that matter most for a horizon: trend vs its key average, RSI and MACD.
function keyReads(horizon, frame) {
  const { movingAverages, oscillators } = frame.summary;
  const [kind, period] = horizon.ma;
  const ma = movingAverages.find((row) => row.period === period)?.[kind];
  const rsiRow = oscillators.find((row) => row.name.startsWith("RSI"));
  const macdRow = oscillators.find((row) => row.name.startsWith("MACD"));
  return [
    ma && {
      signal: ma.signal,
      text: `${ma.signal === "buy" ? "Above" : "Below"} the ${period}-${UNIT[frame.key]} ${kind === "simple" ? "average" : "EMA"}`,
    },
    rsiRow && { signal: rsiRow.signal === "neutral" ? (rsiRow.value >= 50 ? "buy" : "sell") : rsiRow.signal, text: `RSI ${rsiRow.value.toFixed(0)} · ${rsiRow.note}` },
    macdRow && { signal: macdRow.signal, text: `MACD ${macdRow.note.toLowerCase()}` },
  ].filter(Boolean);
}

const FIT = {
  good: { label: "Good fit", color: tokens.up },
  fair: { label: "Fair fit", color: tokens.gold },
  poor: { label: "Weak fit", color: tokens.down },
};

const PERIODS = [
  ["1W", 7],
  ["1M", 30],
  ["3M", 90],
  ["6M", 180],
  ["1Y", 365],
];

const EVENT_TONE = { bull: tokens.up, bear: tokens.down, watch: tokens.violet, warn: tokens.orange };

function SignalChip({ signal }) {
  const meta = SIGNALS[signal] || SIGNALS.neutral;
  return (
    <Chip
      size="small"
      label={meta.label}
      sx={{ height: 22, minWidth: 58, fontSize: 11.5, fontWeight: 700, color: meta.color, bgcolor: alpha(meta.color, 0.13), border: `1px solid ${alpha(meta.color, 0.3)}` }}
    />
  );
}

function RatingChip({ rating, size = "medium" }) {
  const color = RATING_COLORS[rating];
  return <Chip size={size} label={rating} sx={{ fontWeight: 800, color: tokens.ink, bgcolor: color, boxShadow: `0 6px 18px -8px ${color}` }} />;
}

function RatingMeter({ score }) {
  const rating = ratingOf(score);
  return (
    <Box sx={{ position: "relative", pt: 0.75 }}>
      <Box sx={{ display: "flex", gap: "3px" }}>
        {RATINGS.map((name) => (
          <Box
            key={name}
            sx={{ flex: 1, height: 7, borderRadius: 99, bgcolor: alpha(RATING_COLORS[name], name === rating ? 1 : 0.22), transition: "background-color 0.4s" }}
          />
        ))}
      </Box>
      <Box
        className="slide-left"
        sx={{
          position: "absolute",
          top: 0,
          left: `${((score + 1) / 2) * 100}%`,
          width: 4,
          height: 19,
          borderRadius: 2,
          bgcolor: tokens.text,
          transform: "translateX(-50%)",
          boxShadow: "0 0 10px rgba(232,236,244,0.7)",
          transition: "left 0.8s cubic-bezier(.2,.7,.2,1)",
        }}
      />
      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
        {["Sell", "Hold", "Buy"].map((label) => (
          <Typography key={label} variant="caption" color="text.secondary">
            {label}
          </Typography>
        ))}
      </Box>
    </Box>
  );
}

function OverallCard({ score, totals, frameCount }) {
  const rating = ratingOf(score);
  const total = totals.buy + totals.neutral + totals.sell;
  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <CardTitle
        icon={<QueryStatsIcon />}
        color={tokens.gold}
        title="Overall technical rating"
        info="Blends the short, medium and long-term ratings. Each one counts how many moving averages and oscillators currently say buy, sell or neutral — the same method Moneycontrol and TradingView use for technical ratings."
      />
      <Gauge value={(score + 1) * 50} stops={GAUGE_STOPS} width={250}>
        <Box sx={{ display: "flex", justifyContent: "space-between", px: 0.5, mt: -0.5 }}>
          <Typography variant="caption" color="text.secondary">
            Strong sell
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Strong buy
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ color: RATING_COLORS[rating], mt: 0.5, lineHeight: 1.1 }}>
          {rating}
        </Typography>
      </Gauge>
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1, mt: 2 }}>
        {["buy", "neutral", "sell"].map((key) => (
          <Box key={key} sx={{ textAlign: "center", p: 1, borderRadius: "12px", bgcolor: alpha(SIGNALS[key].color, 0.08) }}>
            <Typography variant="h5" sx={{ color: SIGNALS[key].color }}>
              {totals[key]}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {SIGNALS[key].label}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mt: "auto", pt: 2 }}>
        {total} indicator signals across {frameCount} chart{frameCount > 1 ? "s" : ""}. Technical ratings read momentum, not value —
        not financial advice.
      </Typography>
    </Paper>
  );
}

function HorizonCard({ horizon }) {
  const { frame, fit } = horizon;
  const summary = frame?.summary;
  return (
    <Paper variant="glass" className="lift" sx={{ p: 2.25, height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <IconBadge color={tokens.violet} size={32}>
          {horizon.icon}
        </IconBadge>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={800}>{horizon.title}</Typography>
          <Typography variant="caption" color="text.secondary">
            {horizon.span}
          </Typography>
        </Box>
      </Box>
      {summary ? (
        <>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
            <RatingChip rating={summary.rating} />
            <Typography variant="caption" color="text.secondary">
              {frame.label} chart
            </Typography>
          </Box>
          <RatingMeter score={summary.score} />
          <Typography variant="body2" color="text.secondary">
            <Box component="span" sx={{ color: tokens.up, fontWeight: 700 }}>
              {summary.counts.total.buy} buy
            </Box>{" "}
            · {summary.counts.total.neutral} neutral ·{" "}
            <Box component="span" sx={{ color: tokens.down, fontWeight: 700 }}>
              {summary.counts.total.sell} sell
            </Box>
          </Typography>
          <Box sx={{ display: "grid", gap: 0.75 }}>
            {keyReads(horizon, frame).map((read) => (
              <Box key={read.text} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, bgcolor: SIGNALS[read.signal].color }} />
                <Typography variant="caption" sx={{ lineHeight: 1.35 }}>
                  {read.text}
                </Typography>
              </Box>
            ))}
          </Box>
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          Not enough price history for this horizon yet.
        </Typography>
      )}
      <Box sx={{ mt: "auto", p: 1.25, borderRadius: "12px", bgcolor: alpha(FIT[fit.level].color, 0.08), border: `1px solid ${alpha(FIT[fit.level].color, 0.25)}` }}>
        <Typography variant="caption" sx={{ color: FIT[fit.level].color, fontWeight: 800, letterSpacing: "0.06em" }}>
          {FIT[fit.level].label.toUpperCase()}
        </Typography>
        <Typography variant="body2" sx={{ lineHeight: 1.45 }}>
          {fit.text}
        </Typography>
      </Box>
    </Paper>
  );
}

function Consensus({ frames }) {
  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <CardTitle
        icon={<HowToVoteIcon />}
        color={tokens.cyan}
        title="Indicator consensus"
        info="Like analyst ratings: every moving average and oscillator votes buy, neutral or sell on each chart. More green means stronger agreement to buy."
      />
      <Box sx={{ display: "grid", gap: 2.25 }}>
        {frames.map((frame, index) => {
          const { total, ma, osc } = frame.summary.counts;
          const votes = total.buy + total.neutral + total.sell;
          return (
            <Box key={frame.key}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                <Typography variant="body2" fontWeight={700}>
                  {frame.label}
                </Typography>
                <RatingChip rating={frame.summary.rating} size="small" />
              </Box>
              <Box sx={{ display: "flex", height: 26, borderRadius: "8px", overflow: "hidden", gap: "2px" }}>
                {["buy", "neutral", "sell"]
                  .filter((key) => total[key] > 0)
                  .map((key) => (
                    <Box
                      key={key}
                      className="grow-x"
                      sx={{
                        width: `${(total[key] / votes) * 100}%`,
                        bgcolor: alpha(SIGNALS[key].color, key === "neutral" ? 0.5 : 0.85),
                        display: "grid",
                        placeItems: "center",
                        transformOrigin: "left",
                        animationDelay: `${index * 120}ms`,
                        transition: "width 0.6s",
                      }}
                    >
                      <Typography variant="caption" fontWeight={800} sx={{ color: tokens.ink }}>
                        {total[key]}
                      </Typography>
                    </Box>
                  ))}
              </Box>
              <Typography variant="caption" color="text.secondary">
                Moving averages {ma.buy} buy / {ma.sell} sell · Oscillators {osc.buy} buy / {osc.neutral} neutral / {osc.sell} sell
              </Typography>
            </Box>
          );
        })}
      </Box>
      <Box sx={{ display: "flex", gap: 2, mt: 2.5 }}>
        {Object.values(SIGNALS).map((meta) => (
          <Box key={meta.label} sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "3px", bgcolor: meta.color }} />
            <Typography variant="caption" color="text.secondary">
              {meta.label}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

function RelativePerformance({ coin, data }) {
  const series = [
    { label: coin.symbol, candles: data.daily, color: tokens.gold },
    data.btc && { label: "BTC", candles: data.btc, color: tokens.orange },
    data.eth && { label: "ETH", candles: data.eth, color: tokens.violet },
  ].filter(Boolean);
  const periods = PERIODS.map(([label, days]) => ({ label, values: series.map((s) => periodReturn(s.candles, days)) })).filter(
    (period) => period.values[0] != null
  );
  const bench = series[1];
  const verdicts = bench
    ? periods.filter((p) => p.values[1] != null).map((p) => ({ label: p.label, beat: p.values[0] > p.values[1] }))
    : [];
  const wins = verdicts.filter((v) => v.beat).length;

  const chartData = {
    labels: periods.map((p) => p.label),
    datasets: series.map((s, i) => ({
      label: s.label,
      data: periods.map((p) => p.values[i]),
      backgroundColor: alpha(s.color, 0.85),
      borderRadius: 4,
      barPercentage: 0.85,
      categoryPercentage: 0.75,
    })),
  };
  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    plugins: {
      legend: {
        position: "top",
        align: "end",
        labels: { color: tokens.muted, boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: "rectRounded" },
      },
      tooltip: {
        backgroundColor: "rgba(14, 20, 36, 0.95)",
        borderColor: tokens.line,
        borderWidth: 1,
        padding: 10,
        callbacks: { label: (ctx) => `${ctx.dataset.label}: ${formatPercent(ctx.parsed.x)}` },
      },
    },
    scales: {
      x: { grid: { color: "rgba(148,163,184,0.08)" }, border: { display: false }, ticks: { color: tokens.muted, callback: (v) => `${v}%` } },
      y: { grid: { display: false }, border: { display: false }, ticks: { color: tokens.text, font: { weight: "700" } } },
    },
  };

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <CardTitle
        icon={<CompareArrowsIcon />}
        color={tokens.orange}
        title="Outperform or underperform?"
        info="Price change over each period next to Bitcoin and Ethereum. Beating Bitcoin — the market's benchmark — means the coin is outperforming the crypto market."
      />
      {verdicts.length > 0 && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
          <Chip
            label={wins * 2 >= verdicts.length ? "Outperformer" : "Underperformer"}
            sx={{ fontWeight: 800, color: tokens.ink, bgcolor: wins * 2 >= verdicts.length ? tokens.up : tokens.down }}
          />
          <Typography variant="body2" color="text.secondary">
            Beat {bench.label} in {wins} of {verdicts.length} periods
          </Typography>
        </Box>
      )}
      <Box sx={{ height: 250 }}>
        <Bar data={chartData} options={options} />
      </Box>
      <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap", mt: 1.5 }}>
        {verdicts.map((v) => (
          <Chip
            key={v.label}
            size="small"
            label={`${v.label} · ${v.beat ? "Outperform" : "Underperform"}`}
            sx={{ height: 24, fontSize: 11.5, fontWeight: 700, color: v.beat ? tokens.up : tokens.down, bgcolor: alpha(v.beat ? tokens.up : tokens.down, 0.12) }}
          />
        ))}
      </Box>
    </Paper>
  );
}

function IndicatorTables({ frames, scale, symbol }) {
  const [active, setActive] = useState(() => (frames.some((f) => f.key === "daily") ? "daily" : frames[0].key));
  const frame = frames.find((f) => f.key === active) || frames[0];
  const { movingAverages, oscillators, counts } = frame.summary;
  const valueOf = (row) => (row.price ? formatPrice(row.value * scale, symbol) : `${row.value.toFixed(2)}${row.suffix || ""}`);

  return (
    <Paper variant="glass" sx={{ p: 2.5 }}>
      <CardTitle
        icon={<CandlestickChartIcon />}
        color={tokens.violet}
        title="Moving averages & oscillators"
        info="Moving averages: price above the average is a buy signal, below it a sell signal. Oscillators measure momentum and flag overbought or oversold conditions."
        action={
          <Tabs value={frame.key} onChange={(_, next) => setActive(next)} sx={{ minHeight: 36 }}>
            {frames.map((f) => (
              <Tab key={f.key} value={f.key} label={f.label} sx={{ minHeight: 36, py: 0.5 }} />
            ))}
          </Tabs>
        }
      />
      <Grid container spacing={3} key={frame.key}>
        <Grid item xs={12} md={6}>
          <Typography variant="overline" color="text.secondary">
            Moving averages · {counts.ma.buy} buy / {counts.ma.sell} sell
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell>
                  <TableCell align="right">Simple</TableCell>
                  <TableCell align="right">Exponential</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movingAverages.map((row, index) => (
                  <TableRow key={row.period} hover className="row-in" sx={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell sx={{ fontWeight: 700 }}>{row.period}</TableCell>
                    {[row.simple, row.exponential].map((cell, i) => (
                      <TableCell key={i} align="right" sx={{ whiteSpace: "nowrap" }}>
                        {cell ? (
                          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
                            <span>{formatPrice(cell.value * scale, symbol)}</span>
                            <SignalChip signal={cell.signal} />
                          </Box>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="overline" color="text.secondary">
            Oscillators · {counts.osc.buy} buy / {counts.osc.neutral} neutral / {counts.osc.sell} sell
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Indicator</TableCell>
                  <TableCell align="right">Value</TableCell>
                  <TableCell align="right">Signal</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {oscillators.map((row, index) => (
                  <TableRow key={row.name} hover className="row-in" sx={{ animationDelay: `${index * 30}ms` }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {row.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.note}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {valueOf(row)}
                    </TableCell>
                    <TableCell align="right">
                      <SignalChip signal={row.signal} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

function SignalTimeline({ events }) {
  return (
    <Paper variant="glass" sx={{ p: 2.5 }}>
      <CardTitle
        icon={<TimelineIcon />}
        color={tokens.cyan}
        title="Recent trend signals"
        info="Crossovers and RSI extremes on the daily chart over the last four months — the moments the trend turned."
      />
      {events.length ? (
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
          {events.slice(0, 8).map((event, index) => (
            <Box
              key={`${event.t}-${event.title}`}
              className="row-in"
              sx={{
                p: 1.5,
                borderRadius: "12px",
                borderLeft: `3px solid ${EVENT_TONE[event.tone]}`,
                bgcolor: alpha(EVENT_TONE[event.tone], 0.07),
                animationDelay: `${index * 50}ms`,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                {formatDate(event.t, { month: "short", day: "numeric" })} · {timeAgo(event.t)}
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ color: EVENT_TONE[event.tone], lineHeight: 1.4 }}>
                {event.title}
              </Typography>
            </Box>
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No crossovers or RSI extremes on the daily chart in the last four months.
        </Typography>
      )}
    </Paper>
  );
}

function TechnicalAnalysis({ coin, symbol, currency, headlines = [] }) {
  const pegged = isPegged(coin);
  const data = useTechnicals(coin, { pegged });
  const scale = coin.usdPrice ? coin.current_price / coin.usdPrice : 1;

  const frames = useMemo(() => {
    if (pegged || data.loading || data.failed) return [];
    return [
      ["hourly", "Hourly", data.hourly],
      ["daily", "Daily", data.daily],
      ["weekly", "Weekly", data.weekly],
    ]
      .map(([key, label, candles]) => ({ key, label, summary: candles ? technicalSummary(candles, { ohlc: data.ohlc }) : null }))
      .filter((frame) => frame.summary);
  }, [data, pegged]);

  const horizons = useMemo(
    () =>
      HORIZONS.map((horizon) => ({
        ...horizon,
        frame: horizon.frames.map((key) => frames.find((f) => f.key === key)).find(Boolean),
        fit: horizonFit(horizon.key, { daily: data.daily, coin }),
      })),
    [frames, data.daily, coin]
  );
  const events = useMemo(() => (data.daily && !pegged ? signalEvents(data.daily) : []), [data.daily, pegged]);

  const rated = horizons.filter((h) => h.frame);
  const score = rated.length ? rated.reduce((sum, h) => sum + h.frame.summary.score, 0) / rated.length : 0;
  const totals = frames.reduce(
    (acc, f) => ({
      buy: acc.buy + f.summary.counts.total.buy,
      neutral: acc.neutral + f.summary.counts.total.neutral,
      sell: acc.sell + f.summary.counts.total.sell,
    }),
    { buy: 0, neutral: 0, sell: 0 }
  );
  const sourceLabel = data.source === "coinpaprika" ? "CoinPaprika daily closes" : "Binance candles";

  let body;
  if (pegged) {
    body = <PegMonitor coin={coin} data={data} symbol={symbol} currency={currency} />;
  } else if (data.loading) {
    body = (
      <Grid container spacing={2.5}>
        {[4, 8, 5, 7].map((md, index) => (
          <Grid item xs={12} md={md} key={index}>
            <Skeleton variant="rounded" height={320} sx={{ borderRadius: "18px" }} />
          </Grid>
        ))}
      </Grid>
    );
  } else if (data.failed || !frames.length) {
    body = (
      <Alert severity="info">
        {data.limited
          ? "Technical analysis is paused: CoinPaprika's free plan allows 60 requests an hour. Try again in a few minutes."
          : `There isn't enough price history to run technical analysis for ${coin.name} yet.`}
      </Alert>
    );
  } else {
    body = (
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Reveal sx={{ height: "100%" }}>
            <OverallCard score={score} totals={totals} frameCount={frames.length} />
          </Reveal>
        </Grid>
        <Grid item xs={12} md={8}>
          <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, height: "100%" }}>
            {horizons.map((horizon, index) => (
              <Reveal key={horizon.key} delay={index * 90} sx={{ height: "100%" }}>
                <HorizonCard horizon={horizon} />
              </Reveal>
            ))}
          </Box>
        </Grid>
        <Grid item xs={12} md={5}>
          <Reveal sx={{ height: "100%" }}>
            <Consensus frames={frames} />
          </Reveal>
        </Grid>
        <Grid item xs={12} md={7}>
          <Reveal delay={100} sx={{ height: "100%" }}>
            <RelativePerformance coin={coin} data={data} />
          </Reveal>
        </Grid>
        <Grid item xs={12}>
          <TechnicalLevels daily={data.daily} ohlc={data.ohlc} scale={scale} symbol={symbol} headlines={headlines} />
        </Grid>
        <Grid item xs={12}>
          <Reveal>
            <IndicatorTables frames={frames} scale={scale} symbol={symbol} />
          </Reveal>
        </Grid>
        <Grid item xs={12}>
          <Reveal>
            <SignalTimeline events={events} />
          </Reveal>
        </Grid>
      </Grid>
    );
  }

  return (
    <Box component="section" id="technicals">
      <Reveal>
        <SectionTitle
          eyebrow="Technical analysis"
          title={pegged ? `Is ${coin.name} holding its peg?` : `Buy, hold or sell ${coin.name}?`}
          subtitle={
            pegged
              ? "Stablecoins aim to stay at $1, so we track peg health instead of buy/sell ratings."
              : "Ratings for every investing horizon from 20+ indicators on hourly, daily and weekly charts, plus the price levels, triggers and trend signals to watch."
          }
          action={
            !data.loading &&
            !data.failed && (
              <Chip variant="outlined" size="small" label={`${sourceLabel}${data.ohlc === false && !pegged ? " · close-only indicators" : ""}`} />
            )
          }
        />
      </Reveal>
      {body}
    </Box>
  );
}

export default TechnicalAnalysis;
