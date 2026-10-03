import React, { useState } from "react";
import { Box, Chip, Grid, Paper, Tab, Tabs, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import FlagIcon from "@mui/icons-material/Flag";
import BalanceIcon from "@mui/icons-material/Balance";
import EventIcon from "@mui/icons-material/Event";
import { tokens } from "../theme/theme";
import { formatPercent, formatPrice, safeUrl, timeAgo } from "../utils/formatters";
import { expectedRange, pivotLevels, projections, triggerLevels } from "../utils/technicals";
import { UpcomingChip } from "./NewsCard";
import { CardTitle, InfoTip, Reveal } from "./ui";

const PROJECTION_TONE = { bull: tokens.up, bear: tokens.down };

function TriggerBox({ tone, title, verb, level, next, nextLabel, price, scale, symbol }) {
  const color = tone === "bull" ? tokens.up : tokens.down;
  const Icon = tone === "bull" ? TrendingUpIcon : TrendingDownIcon;
  return (
    <Box
      sx={{
        p: 2,
        height: "100%",
        borderRadius: "14px",
        border: `1px solid ${alpha(color, 0.35)}`,
        background: `linear-gradient(160deg, ${alpha(color, 0.14)}, transparent 70%)`,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, color, mb: 1 }}>
        <Icon fontSize="small" />
        <Typography variant="overline" sx={{ color, lineHeight: 1.2 }}>
          {title}
        </Typography>
      </Box>
      {level ? (
        <>
          <Typography variant="body2" color="text.secondary">
            {verb}
          </Typography>
          <Typography variant="h5" sx={{ my: 0.25 }}>
            {formatPrice(level.value * scale, symbol)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {level.label} · {formatPercent((level.value / price - 1) * 100)} from now
          </Typography>
          {next && (
            <Typography variant="body2" sx={{ mt: 1.25 }}>
              {nextLabel}: <b>{formatPrice(next.value * scale, symbol)}</b>{" "}
              <Typography component="span" variant="caption" color="text.secondary">
                ({next.label})
              </Typography>
            </Typography>
          )}
        </>
      ) : (
        <Typography variant="body2" color="text.secondary">
          {tone === "bull"
            ? "Above every tracked level — price discovery with no resistance overhead."
            : "Below every tracked level — no nearby support."}
        </Typography>
      )}
    </Box>
  );
}

function RangeRow({ label, range, price, scale, symbol }) {
  const position = ((price - range.low) / (range.high - range.low)) * 100;
  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
        <Typography variant="body2" fontWeight={700}>
          {label}
        </Typography>
        <Chip
          size="small"
          label={`±${range.pct.toFixed(1)}%`}
          sx={{ height: 22, fontSize: 11.5, fontWeight: 700, color: tokens.cyan, bgcolor: alpha(tokens.cyan, 0.12) }}
        />
      </Box>
      <Box
        sx={{
          position: "relative",
          height: 10,
          borderRadius: 99,
          background: `linear-gradient(90deg, ${alpha(tokens.down, 0.75)}, ${alpha(tokens.gold, 0.65)}, ${alpha(tokens.up, 0.75)})`,
        }}
      >
        <Box
          className="slide-left"
          sx={{
            position: "absolute",
            top: "50%",
            left: `${position}%`,
            width: 14,
            height: 14,
            borderRadius: "50%",
            bgcolor: tokens.text,
            border: `3px solid ${tokens.ink}`,
            transform: "translate(-50%, -50%)",
          }}
        />
      </Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", mt: 0.75, gap: 1 }}>
        <Typography variant="body2" sx={{ color: tokens.down, fontWeight: 700 }}>
          {formatPrice(range.low * scale, symbol)}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          now {formatPrice(price * scale, symbol)}
        </Typography>
        <Typography variant="body2" sx={{ color: tokens.up, fontWeight: 700 }}>
          {formatPrice(range.high * scale, symbol)}
        </Typography>
      </Box>
    </Box>
  );
}

function TriggersCard({ daily, pivots, scale, symbol, headlines }) {
  const levels = triggerLevels(daily, pivots);
  const week = expectedRange(daily, 7);
  const month = expectedRange(daily, 30);
  const upcoming = projections(daily);
  const catalysts = headlines.filter((item) => item.upcoming).slice(0, 2);

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <CardTitle
        icon={<FlagIcon />}
        color={tokens.gold}
        title="Bull & bear triggers"
        info="The nearest price levels above and below today's price, taken from pivots, moving averages and recent highs and lows. A daily close beyond one often starts the next leg; the level after it is the likely next stop."
      />
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
        <TriggerBox
          tone="bull"
          title="Bull trigger"
          verb="Daily close above"
          level={levels.bull[0]}
          next={levels.bull[1]}
          nextLabel="Next target"
          price={levels.price}
          scale={scale}
          symbol={symbol}
        />
        <TriggerBox
          tone="bear"
          title="Bear trigger"
          verb="Daily close below"
          level={levels.bear[0]}
          next={levels.bear[1]}
          nextLabel="Next support"
          price={levels.price}
          scale={scale}
          symbol={symbol}
        />
      </Box>

      {week && month && (
        <Box sx={{ mt: 2.5 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            Expected price range
            <InfoTip
              title={`About a 68% chance the price stays inside these bands if recent volatility (${week.dailyVol.toFixed(2)}% a day over the last 30 days) holds.`}
            />
          </Typography>
          <Box sx={{ display: "grid", gap: 2, mt: 1 }}>
            <RangeRow label="Next 7 days" range={week} price={levels.price} scale={scale} symbol={symbol} />
            <RangeRow label="Next 30 days" range={month} price={levels.price} scale={scale} symbol={symbol} />
          </Box>
        </Box>
      )}

      <Typography variant="overline" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 2.5, mb: 1 }}>
        <EventIcon sx={{ fontSize: 16 }} /> Coming up
      </Typography>
      <Box sx={{ display: "grid", gap: 1 }}>
        {upcoming.map((item) => (
          <Box
            key={item.title}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              p: 1.25,
              borderRadius: "12px",
              bgcolor: alpha(PROJECTION_TONE[item.tone], 0.07),
              borderLeft: `3px solid ${PROJECTION_TONE[item.tone]}`,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={700} sx={{ color: PROJECTION_TONE[item.tone] }}>
                {item.title}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {item.detail}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={`in ~${item.days} day${item.days === 1 ? "" : "s"}`}
              sx={{ fontWeight: 800, color: tokens.ink, bgcolor: PROJECTION_TONE[item.tone] }}
            />
          </Box>
        ))}
        {!upcoming.length && (
          <Typography variant="body2" color="text.secondary">
            No crossovers projected in the next 60 days at the current pace.
          </Typography>
        )}
        {catalysts.map((item) => {
          const url = safeUrl(item.link);
          return (
            <Box
              key={item.title}
              component={url ? "a" : "div"}
              href={url?.href}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ display: "block", p: 1.25, borderRadius: "12px", bgcolor: "rgba(148,163,184,0.06)", "&:hover": { bgcolor: "rgba(148,163,184,0.1)" } }}
            >
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4 }}>
                {item.title}
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                <UpcomingChip />
                <Typography variant="caption" color="text.secondary">
                  {item.source} · {timeAgo(item.date)}
                </Typography>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, fontStyle: "italic" }}>
        Projections assume the current pace continues — markets rarely move in straight lines. Not financial advice.
      </Typography>
    </Paper>
  );
}

const PIVOT_ROWS = [
  ["r3", "Resistance 3"],
  ["r2", "Resistance 2"],
  ["r1", "Resistance 1"],
  ["p", "Pivot"],
  ["s1", "Support 1"],
  ["s2", "Support 2"],
  ["s3", "Support 3"],
];

function Ladder({ rows, price, scale, symbol }) {
  // Sorted by value: Camarilla levels hug the close, so the pivot can sit outside R1/S1.
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  const below = sorted.findIndex((row) => row.value < price);
  const at = below < 0 ? sorted.length : below;
  const list = [...sorted.slice(0, at), { key: "now", label: "Current price", value: price }, ...sorted.slice(at)];
  return list.map((row, index) => {
    const now = row.key === "now";
    const color = now ? tokens.gold : row.value > price ? tokens.down : row.value < price ? tokens.up : tokens.gold;
    return (
      <Box
        key={row.key}
        className="row-in"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          px: 1.25,
          py: now ? 1.1 : 0.85,
          my: now ? 0.5 : 0,
          borderRadius: "10px",
          animationDelay: `${index * 35}ms`,
          ...(now
            ? { border: `1px solid ${alpha(tokens.gold, 0.6)}`, bgcolor: alpha(tokens.gold, 0.1) }
            : { borderBottom: `1px solid ${tokens.line}` }),
        }}
      >
        <Box sx={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: now ? tokens.text : color, boxShadow: now ? `0 0 10px ${tokens.gold}` : "none" }} />
        <Typography variant="body2" fontWeight={now ? 800 : 600} sx={{ flex: 1, color: now ? "primary.main" : "text.primary" }}>
          {row.label}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {formatPrice(row.value * scale, symbol)}
        </Typography>
        <Typography variant="caption" sx={{ width: 60, textAlign: "right", color }}>
          {now ? "" : formatPercent((row.value / price - 1) * 100)}
        </Typography>
      </Box>
    );
  });
}

function PivotCard({ pivots, prev, price, scale, symbol }) {
  const [kind, setKind] = useState("classic");
  const rows = PIVOT_ROWS.map(([key, label]) => ({ key, label, value: pivots[kind][key] }));
  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <CardTitle
        icon={<BalanceIcon />}
        color={tokens.violet}
        title="Pivot levels"
        info="Today's support and resistance from yesterday's high, low and close. Classic pivots suit most traders; Fibonacci and Camarilla give tighter levels for intraday moves."
      />
      <Tabs value={kind} onChange={(_, next) => setKind(next)} variant="fullWidth" sx={{ mb: 1.5 }}>
        <Tab value="classic" label="Classic" />
        <Tab value="fibonacci" label="Fibonacci" />
        <Tab value="camarilla" label="Camarilla" />
      </Tabs>
      <Box key={kind}>
        <Ladder rows={rows} price={price} scale={scale} symbol={symbol} />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
        From yesterday's candle · H {formatPrice(prev.h * scale, symbol)} · L {formatPrice(prev.l * scale, symbol)} · C{" "}
        {formatPrice(prev.c * scale, symbol)}
      </Typography>
    </Paper>
  );
}

// Close-only history has no highs/lows for pivots, so show the averages and recent extremes instead.
function KeyLevelsCard({ daily, price, scale, symbol }) {
  const levels = triggerLevels(daily, null);
  const rows = [...levels.bull].reverse().concat(levels.bear).map((level) => ({ key: level.label, ...level }));
  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <CardTitle
        icon={<BalanceIcon />}
        color={tokens.violet}
        title="Key price levels"
        info="Moving averages and recent highs and lows that often act as support (below the price) or resistance (above it)."
      />
      <Ladder rows={rows} price={price} scale={scale} symbol={symbol} />
    </Paper>
  );
}

function TechnicalLevels({ daily, ohlc, scale, symbol, headlines = [] }) {
  const prev = daily[daily.length - 2];
  const price = daily[daily.length - 1].c;
  const pivots = ohlc && prev ? pivotLevels(prev) : null;

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={7}>
        <Reveal sx={{ height: "100%" }}>
          <TriggersCard daily={daily} pivots={pivots} scale={scale} symbol={symbol} headlines={headlines} />
        </Reveal>
      </Grid>
      <Grid item xs={12} md={5}>
        <Reveal delay={100} sx={{ height: "100%" }}>
          {pivots ? (
            <PivotCard pivots={pivots} prev={prev} price={price} scale={scale} symbol={symbol} />
          ) : (
            <KeyLevelsCard daily={daily} price={price} scale={scale} symbol={symbol} />
          )}
        </Reveal>
      </Grid>
    </Grid>
  );
}

export default TechnicalLevels;
