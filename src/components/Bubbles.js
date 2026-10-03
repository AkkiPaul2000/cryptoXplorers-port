import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import { Box, Button, Chip, MenuItem, Paper, Select, Tooltip, Typography, useMediaQuery } from "@mui/material";
import { alpha } from "@mui/material/styles";
import BubbleChartIcon from "@mui/icons-material/BubbleChart";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import InsightsIcon from "@mui/icons-material/Insights";
import { useNavigate } from "react-router-dom";
import { tokens } from "../theme/theme";
import { formatMarketCap, formatPercent, formatPrice } from "../utils/formatters";
import CoinImage from "./CoinImage";
import SelectButtons from "./SelectButtons";
import { IconBadge } from "./ui";

const PERIODS = [
  { label: "Hour", value: "price_change_percentage_1h" },
  { label: "Day", value: "price_change_percentage_24h" },
  { label: "Week", value: "price_change_percentage_7d_in_currency" },
  { label: "Month", value: "price_change_percentage_30d" },
  { label: "Year", value: "price_change_percentage_1y" },
];

// Fractional powers keep BTC the biggest bubble without dwarfing everything else.
const SIZES = {
  cap: { label: "Market cap", weight: (coin) => Math.pow(coin.market_cap || 1, 0.42) },
  volume: { label: "24h volume", weight: (coin) => Math.pow(coin.total_volume || 1, 0.42) },
  move: { label: "Price move", weight: (coin, period) => Math.pow(Math.abs(coin[period] || 0) + 0.5, 0.9) },
};

const GLOW = [
  { fill: 0.12, glow: 4 },
  { fill: 0.22, glow: 7 },
  { fill: 0.38, glow: 13 },
  { fill: 0.58, glow: 22 },
];

export function bubbleTone(change) {
  const abs = Math.abs(change || 0);
  if (abs < 0.25) return { color: tokens.muted, level: 0, mood: "flat" };
  return { color: change > 0 ? tokens.up : tokens.down, level: abs >= 5 ? 3 : abs >= 2 ? 2 : 1, mood: change > 0 ? "up" : "down" };
}

function collide(nodes, gap) {
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy) || 0.001;
      const overlap = a.r + b.r + gap - dist;
      if (overlap <= 0) continue;
      const share = b.r / (a.r + b.r); // the bigger bubble moves less
      a.x -= (dx / dist) * overlap * share;
      a.y -= (dy / dist) * overlap * share;
      b.x += (dx / dist) * overlap * (1 - share);
      b.y += (dy / dist) * overlap * (1 - share);
    }
  }
}

// Deterministic packing in a W×H box: golden-angle seed (largest first), a centre pull that
// fades out, then pure de-overlap passes. Measured 0 overlaps for 25–100 real market caps;
// ~20ms for 50 bubbles, ~80ms for 100.
function pack(weights, W, H) {
  const max = Math.max(...weights);
  const min = Math.min(...weights);
  const relative = weights.map((w) => 0.35 + 0.65 * ((w - min) / (max - min || 1)));
  const area = relative.reduce((sum, r) => sum + Math.PI * r * r, 0);
  // Fill about half the box, but cap the largest radius so one or two bubbles still fit.
  const k = Math.min(Math.sqrt((0.5 * W * H) / area), (0.4 * Math.min(W, H)) / Math.max(...relative));
  const nodes = relative.map((r, i) => {
    const angle = i * 2.39996;
    const dist = Math.sqrt(i + 0.5) * k * 0.9;
    return { r: r * k, x: W / 2 + Math.cos(angle) * dist * (W / H), y: H / 2 + Math.sin(angle) * dist };
  });
  const STEPS = 320;
  const SETTLE = 220;
  for (let step = 0; step < STEPS; step += 1) {
    const pull = step < SETTLE ? 0.03 * (1 - step / SETTLE) : 0;
    nodes.forEach((n) => {
      n.x += (W / 2 - n.x) * pull * 0.55;
      n.y += (H / 2 - n.y) * pull;
    });
    collide(nodes, 7);
    if (step >= SETTLE) collide(nodes, 7);
    nodes.forEach((n) => {
      n.x = Math.max(n.r, Math.min(W - n.r, n.x));
      n.y = Math.max(n.r, Math.min(H - n.r, n.y));
    });
  }
  return nodes;
}

function useWidth(ref) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    setWidth(node.clientWidth);
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref]);
  return width;
}

function Bubble({ node, period, box, scale, symbol, index, onOpen }) {
  const { coin, x, y, r } = node;
  const change = coin[period];
  const { color, level } = bubbleTone(change);
  const { fill, glow } = GLOW[level];
  const px = r * scale;

  return (
    <Tooltip
      placement="top"
      disableInteractive
      title={
        <Box sx={{ minWidth: 180 }}>
          <Typography variant="subtitle2" fontWeight={700}>
            {coin.name}{" "}
            <Typography component="span" variant="caption" color="text.secondary">
              #{coin.market_cap_rank}
            </Typography>
          </Typography>
          <Typography variant="body2">{formatPrice(coin.current_price, symbol)}</Typography>
          <Typography variant="caption" color="text.secondary" component="div">
            Mcap {formatMarketCap(coin.market_cap, symbol)} · Vol {formatMarketCap(coin.total_volume, symbol)}
          </Typography>
          <Typography variant="caption" component="div">
            1h {formatPercent(coin.price_change_percentage_1h)} · 24h {formatPercent(coin.price_change_percentage_24h)} · 7d{" "}
            {formatPercent(coin.price_change_percentage_7d_in_currency)}
          </Typography>
        </Box>
      }
    >
      <Box
        role="link"
        tabIndex={0}
        aria-label={`${coin.name} ${formatPercent(change)}`}
        onClick={() => onOpen(coin.id)}
        onKeyDown={(event) => event.key === "Enter" && onOpen(coin.id)}
        className="bubble"
        style={{
          left: `${((x - r) / box.W) * 100}%`,
          top: `${((y - r) / box.H) * 100}%`,
          width: `${((2 * r) / box.W) * 100}%`,
          borderColor: alpha(color, level ? 0.95 : 0.55),
          background: `radial-gradient(circle at 50% 42%, rgba(8,12,24,0.94) 0%, rgba(8,12,24,0.86) 48%, ${alpha(color, fill)} 100%)`,
          boxShadow: `0 0 ${glow}px ${alpha(color, 0.55)}, inset 0 0 ${Math.round(px * 0.4)}px ${alpha(color, fill)}`,
          animationDelay: `${index * 24}ms, ${-(index % 9) * 0.8}s`,
        }}
      >
        {px > 26 && <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={Math.round(px * 0.52)} />}
        <span style={{ fontSize: Math.max(9, px * 0.34), fontWeight: 800 }}>{coin.symbol}</span>
        {px > 18 && (
          <span style={{ fontSize: Math.max(8, px * 0.25), fontWeight: 700, color: level ? color : tokens.muted }}>
            {formatPercent(change)}
          </span>
        )}
      </Box>
    </Tooltip>
  );
}

function Legend({ title, hint, children }) {
  return (
    <Box sx={{ p: 2, borderRadius: "14px", border: `1px solid ${tokens.line}`, bgcolor: "rgba(148,163,184,0.04)" }}>
      <Typography variant="overline" sx={{ color: "primary.main", lineHeight: 1.4, display: "block" }}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: 10.5, mt: -0.25 }}>
          {hint}
        </Typography>
      )}
      <Box sx={{ mb: 0.75 }} />
      <Box sx={{ display: "grid", gap: 0.5 }}>{children}</Box>
    </Box>
  );
}

// A legend entry that doubles as a filter toggle when `onToggle` is given.
function LegendRow({ color, level = 2, title, text, now, count, selected, onToggle }) {
  const { fill, glow } = GLOW[level];
  const interactive = Boolean(onToggle);
  return (
    <Box
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-pressed={interactive ? Boolean(selected) : undefined}
      aria-label={interactive ? `${selected ? "Show all coins" : `Show only ${title.toLowerCase()} coins`}` : undefined}
      onClick={onToggle}
      onKeyDown={(event) => {
        if (interactive && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          onToggle();
        }
      }}
      sx={{
        display: "flex",
        gap: 1.25,
        alignItems: "flex-start",
        p: 0.75,
        mx: -0.75,
        borderRadius: "10px",
        cursor: interactive ? "pointer" : "default",
        bgcolor: selected ? alpha(color, 0.16) : "transparent",
        border: `1px solid ${selected ? alpha(color, 0.7) : now ? alpha(color, 0.3) : "transparent"}`,
        boxShadow: selected ? `0 0 16px -6px ${alpha(color, 0.8)}` : "none",
        transition: "background-color 0.25s, border-color 0.25s, box-shadow 0.25s",
        "&:hover": interactive ? { bgcolor: alpha(color, selected ? 0.2 : 0.08) } : undefined,
        "&:focus-visible": { outline: `2px solid ${color}`, outlineOffset: 1 },
      }}
    >
      <Box
        sx={{
          width: 18,
          height: 18,
          mt: 0.25,
          flexShrink: 0,
          borderRadius: "50%",
          border: `2px solid ${alpha(color, level ? 0.95 : 0.55)}`,
          background: `radial-gradient(circle, rgba(8,12,24,0.9) 40%, ${alpha(color, fill)} 100%)`,
          boxShadow: `0 0 ${glow}px ${alpha(color, 0.6)}`,
        }}
      />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography variant="body2" fontWeight={700} sx={{ color, lineHeight: 1.3 }}>
          {title}
          {now && (
            <Box component="span" sx={{ ml: 0.75, px: 0.75, borderRadius: 99, fontSize: 10, bgcolor: color, color: tokens.ink }}>
              NOW
            </Box>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.4, display: "block" }}>
          {text}
        </Typography>
      </Box>
      {count != null && (
        <Typography variant="caption" fontWeight={800} sx={{ color: count ? color : "text.secondary", minWidth: 18, textAlign: "right", pt: 0.25 }}>
          {count}
        </Typography>
      )}
    </Box>
  );
}

const MOOD_LABEL = { up: "Green", down: "Red", flat: "Gray" };
const STRENGTH_LABEL = { 3: "Bright glow", 2: "Medium glow", 1: "Dim glow" };

function Bubbles({ coins, symbol }) {
  const navigate = useNavigate();
  const narrow = useMediaQuery((theme) => theme.breakpoints.down("sm"));
  const [period, setPeriod] = useState(PERIODS[1].value);
  const [sizeBy, setSizeBy] = useState("cap");
  const [count, setCount] = useState(() => (window.innerWidth < 600 ? 25 : 50));
  const [mood, setMood] = useState(null);
  const [strength, setStrength] = useState(null);
  const toggleMood = (next) => setMood((current) => (current === next ? null : next));
  const toggleStrength = (next) => setStrength((current) => (current === next ? null : next));
  const clearFilters = () => {
    setMood(null);
    setStrength(null);
  };
  const ref = useRef(null);
  const width = useWidth(ref);
  const box = narrow ? { W: 1000, H: 1100 } : { W: 1000, H: 620 };

  // Offer only windows the data actually has (CoinPaprika currently reports 0 for USD 30d/1y).
  const periods = useMemo(
    () => PERIODS.filter((p) => coins.filter((coin) => coin[p.value]).length >= coins.length * 0.8),
    [coins]
  );
  const activePeriod = periods.some((p) => p.value === period) ? period : PERIODS[1].value;

  const list = useMemo(() => coins.slice(0, count), [coins, count]);

  // Filters re-pack only the matching coins, so the selected group fills the chart.
  const nodes = useMemo(() => {
    const visible = list.filter((coin) => {
      const tone = bubbleTone(coin[activePeriod]);
      return (!mood || tone.mood === mood) && (!strength || tone.level === strength);
    });
    if (!visible.length) return [];
    const weights = visible.map((coin) => SIZES[sizeBy].weight(coin, activePeriod));
    const order = visible.map((_, i) => i).sort((a, b) => weights[b] - weights[a]);
    const packed = pack(order.map((i) => weights[i]), box.W, box.H);
    return order.map((coinIndex, k) => ({ coin: visible[coinIndex], ...packed[k] }));
  }, [list, mood, strength, sizeBy, activePeriod, box.W, box.H]);

  // The left guides filter; the right panels only explain. "What it means" reads the whole
  // market, while the two guides count within each other's selection so a row's number
  // always matches the bubbles a click will show.
  const tones = list.map((coin) => bubbleTone(coin[activePeriod]));
  const countBy = (rows, key) => rows.reduce((acc, tone) => ({ ...acc, [tone[key]]: (acc[tone[key]] || 0) + 1 }), {});
  const moods = { up: 0, down: 0, flat: 0, ...countBy(tones, "mood") };
  const colorCounts = countBy(strength ? tones.filter((tone) => tone.level === strength) : tones, "mood");
  const strengths = countBy(mood ? tones.filter((tone) => tone.mood === mood) : tones, "level");
  const total = list.length || 1;
  const filtered = Boolean(mood || strength);
  const intensityColor = mood === "down" ? tokens.down : tokens.up;
  const dominant = Object.entries(moods).sort((a, b) => b[1] - a[1])[0][0];
  const periodLabel = PERIODS.find((p) => p.value === activePeriod)?.label.toLowerCase();

  const left = (
    <Box sx={{ gridArea: "left", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr" }, alignContent: "start" }}>
      <Legend title="Color guide" hint="Click to filter">
        <LegendRow color={tokens.up} title="Green" text="Positive price movement (gains)" count={colorCounts.up || 0} selected={mood === "up"} onToggle={() => toggleMood("up")} />
        <LegendRow color={tokens.down} title="Red" text="Negative price movement (losses)" count={colorCounts.down || 0} selected={mood === "down"} onToggle={() => toggleMood("down")} />
        <LegendRow color={tokens.muted} level={0} title="Gray" text="Little or no change (price stable)" count={colorCounts.flat || 0} selected={mood === "flat"} onToggle={() => toggleMood("flat")} />
      </Legend>
      <Legend title="Intensity guide" hint="Click to filter">
        <LegendRow color={intensityColor} level={3} title="Bright glow" text="High % change (5% or more)" count={strengths[3] || 0} selected={strength === 3} onToggle={() => toggleStrength(3)} />
        <LegendRow color={intensityColor} level={2} title="Medium glow" text="Moderate % change (2–5%)" count={strengths[2] || 0} selected={strength === 2} onToggle={() => toggleStrength(2)} />
        <LegendRow color={intensityColor} level={1} title="Dim glow" text="Low % change (under 2%)" count={strengths[1] || 0} selected={strength === 1} onToggle={() => toggleStrength(1)} />
      </Legend>
    </Box>
  );

  const right = (
    <Box sx={{ gridArea: "right", display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr" }, alignContent: "start" }}>
      <Legend title="What it means">
        <LegendRow color={tokens.up} title="Mostly green" text="Market is bullish, prices are rising" now={dominant === "up"} count={moods.up} />
        <LegendRow color={tokens.down} title="Mostly red" text="Market is bearish, prices are falling" now={dominant === "down"} count={moods.down} />
        <LegendRow color={tokens.muted} level={0} title="Mostly gray" text="Market is sideways, no clear trend" now={dominant === "flat"} count={moods.flat} />
        <Box>
          <Box sx={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", gap: "2px", mt: 0.5 }}>
            <Box className="grow-x" sx={{ width: `${(moods.up / total) * 100}%`, bgcolor: tokens.up, transformOrigin: "left", transition: "width 0.6s" }} />
            <Box className="grow-x" sx={{ width: `${(moods.flat / total) * 100}%`, bgcolor: tokens.muted, transition: "width 0.6s" }} />
            <Box className="grow-x" sx={{ flex: 1, bgcolor: tokens.down, transformOrigin: "right" }} />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            {moods.up} up · {moods.flat} flat · {moods.down} down over the last {periodLabel}
          </Typography>
        </Box>
      </Legend>
      <Legend title="Other factors">
        <Typography variant="caption" color="text.secondary" component="div" sx={{ lineHeight: 1.7 }}>
          • Bubble size = <b>{SIZES[sizeBy].label.toLowerCase()}</b>
          <br />• % change = <b>{periodLabel}</b> price change
          <br />• Use with trend and volume for better decisions
        </Typography>
      </Legend>
    </Box>
  );

  return (
    <Paper variant="glass" sx={{ p: { xs: 2, md: 2.5 } }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <IconBadge color={tokens.gold} size={34}>
          <BubbleChartIcon />
        </IconBadge>
        <Typography variant="h6" sx={{ mr: "auto" }}>
          Crypto bubbles
        </Typography>
        <SelectButtons value={activePeriod} onChange={setPeriod} options={periods} label="Change window" />
        <Select size="small" value={sizeBy} onChange={(event) => setSizeBy(event.target.value)} inputProps={{ "aria-label": "Bubble size" }}>
          {Object.entries(SIZES).map(([key, item]) => (
            <MenuItem key={key} value={key}>
              Size: {item.label}
            </MenuItem>
          ))}
        </Select>
        <Select size="small" value={count} onChange={(event) => setCount(event.target.value)} inputProps={{ "aria-label": "Number of coins" }}>
          {[25, 50, 100].map((n) => (
            <MenuItem key={n} value={n}>
              Top {n}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", lg: "200px 1fr 220px" },
          gridTemplateAreas: { xs: '"bubbles" "left" "right"', lg: '"left bubbles right"' },
        }}
      >
        {left}
        <Box
          ref={ref}
          sx={{
            gridArea: "bubbles",
            // "center" (not stretch): a stretched height would widen the column via aspect-ratio.
            alignSelf: "center",
            minWidth: 0,
            position: "relative",
            width: "100%",
            aspectRatio: `${box.W} / ${box.H}`,
            borderRadius: "16px",
            background: "radial-gradient(ellipse at center, rgba(148,163,184,0.06), transparent 70%)",
          }}
        >
          {filtered && (
            <Chip
              size="small"
              label={`Showing ${nodes.length} of ${list.length} · ${[MOOD_LABEL[mood], STRENGTH_LABEL[strength]].filter(Boolean).join(" · ")}`}
              onDelete={clearFilters}
              sx={{ position: "absolute", top: 8, left: 8, zIndex: 4, fontWeight: 700, bgcolor: "rgba(6,9,18,0.85)", border: `1px solid ${alpha(tokens.gold, 0.5)}`, backdropFilter: "blur(6px)" }}
            />
          )}
          {filtered && !nodes.length && (
            <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center", px: 2 }}>
              <Box>
                <Typography color="text.secondary" sx={{ mb: 1.5 }}>
                  No coins match this filter over the last {periodLabel}.
                </Typography>
                <Button variant="outlined" size="small" onClick={clearFilters}>
                  Show all coins
                </Button>
              </Box>
            </Box>
          )}
          {width > 0 &&
            nodes.map((node, index) => (
              <Bubble
                key={node.coin.id}
                node={node}
                period={activePeriod}
                box={box}
                scale={width / box.W}
                symbol={symbol}
                index={index}
                onOpen={(id) => navigate(`/coins/${id}`)}
              />
            ))}
        </Box>
        {right}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1.5, mt: 2.5 }}>
        {[
          [<LightbulbIcon />, "Bubbles give a quick snapshot of the market. Always do your own research before investing."],
          [<InsightsIcon />, "Use them to spot trends, strength and opportunities — then open a coin for the full analysis."],
        ].map(([icon, text]) => (
          <Box key={text} sx={{ display: "flex", gap: 1.25, alignItems: "center", p: 1.5, borderRadius: "12px", bgcolor: "rgba(238,188,29,0.06)", border: "1px solid rgba(238,188,29,0.18)" }}>
            <Box sx={{ color: "primary.main", display: "grid" }}>{icon}</Box>
            <Typography variant="body2" color="text.secondary">
              {text}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
}

export default memo(Bubbles);
