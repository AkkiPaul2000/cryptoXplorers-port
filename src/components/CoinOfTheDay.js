import React, { useEffect, useMemo, useState } from "react";
import { Box, Button, Chip, Paper, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import BoltIcon from "@mui/icons-material/Bolt";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ShieldIcon from "@mui/icons-material/Shield";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import { Link } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { showWatchlist } from "../config/data";
import { tokens } from "../theme/theme";
import { formatDate, formatPrice, safeUrl, timeAgo } from "../utils/formatters";
import { riskBand } from "../utils/risk";
import { rankCoinOfTheDay } from "../utils/signals";
import { readStored, writeStored } from "../utils/storage";
import CoinImage from "./CoinImage";
import CoinSparkline from "./Sparkline";
import { ToneChip } from "./NewsCard";
import { AnimatedNumber, ChangePill, InfoTip } from "./ui";

// Local calendar day (en-CA formats as YYYY-MM-DD).
const today = () => new Date().toLocaleDateString("en-CA");

function Reason({ icon, children, color = tokens.text }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.25,
        py: 0.9,
        borderRadius: "12px",
        bgcolor: "rgba(148,163,184,0.06)",
        "& svg": { fontSize: 18, color },
      }}
    >
      {icon}
      <Typography variant="body2">{children}</Typography>
    </Box>
  );
}

function CoinOfTheDay({ headlines, headlinesLoading }) {
  const { coins, symbol, watchlist, toggleWatch } = CryptoState();
  const ranked = useMemo(() => rankCoinOfTheDay(coins, headlines), [coins, headlines]);
  const [pinned, setPinned] = useState(() => {
    const stored = readStored("crx-coin-of-day", null);
    return stored?.date === today() ? stored.id : null;
  });

  // Pin today's pick once news has been scored, so it stays put as prices refresh.
  useEffect(() => {
    if (pinned || headlinesLoading || !ranked.length) return;
    setPinned(ranked[0].coin.id);
    writeStored("crx-coin-of-day", { date: today(), id: ranked[0].coin.id });
  }, [pinned, headlinesLoading, ranked]);

  const pick = ranked.find((row) => row.coin.id === pinned) || ranked[0];

  if (!pick) {
    return (
      <Paper variant="glass" sx={{ p: 3, height: "100%" }}>
        <Skeleton width="40%" />
        <Skeleton variant="rounded" height={90} sx={{ my: 2 }} />
        <Skeleton variant="rounded" height={160} />
      </Paper>
    );
  }

  const { coin, risk, turnover, news } = pick;
  const week = coin.price_change_percentage_7d_in_currency || 0;
  const day = coin.price_change_percentage_24h || 0;
  const watched = watchlist.includes(coin.id);
  const story = news[0];
  const storyUrl = safeUrl(story?.link);

  return (
    <Paper variant="glass" sx={{ p: { xs: 2.5, md: 3 }, height: "100%", overflow: "hidden" }}>
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: -120,
          right: -80,
          width: 340,
          height: 340,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(circle, ${alpha(tokens.gold, 0.18)}, transparent 65%)`,
        }}
      />
      <Box sx={{ position: "relative" }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2.5, flexWrap: "wrap" }}>
          <Chip icon={<EmojiEventsIcon />} label="Coin of the day" color="primary" sx={{ color: "primary.contrastText", fontWeight: 700 }} />
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            {formatDate(new Date(), { weekday: "long", month: "short", day: "numeric" })}
          </Typography>
          <InfoTip
            heading="How we pick it"
            title="Every day we score the top 100 (skipping stablecoins and wrapped tokens) on weekly and daily momentum, trading liquidity, risk and news coverage — and penalise coins that already ran too hot. A starting point for research, not a buy signal."
          />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
          <Box className="float" sx={{ p: 1, borderRadius: "22px", border: `1px solid ${tokens.line}`, bgcolor: "rgba(148,163,184,0.06)", boxShadow: `0 16px 40px -16px ${alpha(tokens.gold, 0.5)}` }}>
            <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={60} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 160 }}>
            <Typography variant="h4" sx={{ fontSize: { xs: "1.6rem", md: "2rem" }, lineHeight: 1.1 }}>
              {coin.name}
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, mt: 0.75 }}>
              <Chip size="small" label={coin.symbol} />
              <Chip size="small" variant="outlined" color="primary" label={`Rank #${coin.market_cap_rank}`} />
            </Box>
          </Box>
          <Box sx={{ textAlign: { sm: "right" } }}>
            <Typography variant="h4" sx={{ fontSize: { xs: "1.5rem", md: "1.9rem" } }}>
              <AnimatedNumber value={coin.current_price} format={(value) => formatPrice(value, symbol)} />
            </Typography>
            <Box sx={{ display: "flex", gap: 0.75, justifyContent: { sm: "flex-end" }, mt: 0.5 }}>
              <ChangePill value={day} sx={{ fontSize: 12.5 }} />
              <ChangePill value={week} soft={false} sx={{ fontSize: 12.5 }} />
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center" }}>
                24h · 7d
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ my: 2.5, "& svg": { width: "100%" } }}>
          <CoinSparkline symbol={coin.symbol} width={600} height={64} />
        </Box>

        <Typography variant="overline" color="text.secondary">
          Why it stands out today
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1, mt: 1 }}>
          <Reason icon={week >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />} color={week >= 0 ? tokens.up : tokens.down}>
            {week >= 0 ? "Up" : "Down"} {Math.abs(week).toFixed(1)}% this week
          </Reason>
          <Reason icon={<BoltIcon />} color={day >= 0 ? tokens.up : tokens.down}>
            {day >= 0 ? "Gaining" : "Slipping"} {Math.abs(day).toFixed(2)}% today
          </Reason>
          <Reason icon={<WaterDropIcon />} color={tokens.cyan}>
            {turnover.toFixed(1)}% of its value traded today
          </Reason>
          <Reason icon={<ShieldIcon />} color={riskBand(risk).color}>
            {riskBand(risk).label} risk score ({risk})
          </Reason>
        </Box>

        <Box
          sx={{
            mt: 2,
            p: 1.5,
            borderRadius: "14px",
            border: `1px solid ${alpha(tokens.violet, 0.3)}`,
            bgcolor: alpha(tokens.violet, 0.07),
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: story ? 0.75 : 0, flexWrap: "wrap" }}>
            <Chip
              size="small"
              icon={<NewspaperIcon />}
              label={news.length ? `In the news · ${news.length}` : "News"}
              sx={{ height: 22, fontSize: 11, bgcolor: alpha(tokens.violet, 0.2), "& .MuiChip-icon": { fontSize: 14 } }}
            />
            {story && <ToneChip tone={story.tone} />}
            {story && (
              <Typography variant="caption" color="text.secondary">
                {story.source} · {timeAgo(story.date)}
              </Typography>
            )}
          </Box>
          {story ? (
            <Typography
              component={storyUrl ? "a" : "p"}
              href={storyUrl?.href}
              target="_blank"
              rel="noopener noreferrer"
              variant="body2"
              fontWeight={700}
              sx={{ display: "block", lineHeight: 1.45, "&:hover": { color: "primary.main" } }}
            >
              {story.title}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {headlinesLoading ? "Checking today's headlines…" : "No headlines today — picked on momentum, liquidity and risk."}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1, mt: 2.5, flexWrap: "wrap" }}>
          <Button component={Link} to={`/coins/${coin.id}`} variant="contained" endIcon={<ArrowForwardIcon />}>
            Full analysis
          </Button>
          {showWatchlist && (
            <Button variant="outlined" startIcon={watched ? <StarIcon /> : <StarBorderIcon />} onClick={() => toggleWatch(coin.id)} aria-pressed={watched}>
              {watched ? "Watching" : "Watch"}
            </Button>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
          Algorithmic pick to kick off your research — not financial advice.
        </Typography>
      </Box>
    </Paper>
  );
}

export default CoinOfTheDay;
