import React, { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, Container, Grid, Paper, Skeleton, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import ShieldIcon from "@mui/icons-material/Shield";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import BatteryAlertIcon from "@mui/icons-material/BatteryAlert";
import PsychologyIcon from "@mui/icons-material/Psychology";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import CurrencyBitcoinIcon from "@mui/icons-material/CurrencyBitcoin";
import SpeedIcon from "@mui/icons-material/Speed";
import LightbulbIcon from "@mui/icons-material/Lightbulb";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import CampaignIcon from "@mui/icons-material/Campaign";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { BitcoinStats } from "../config/api";
import { CryptoState } from "../CryptoContext";
import { useFearGreed } from "../components/FearGreed";
import Outlook from "../components/Outlook";
import NewsCard, { ToneChip, UpcomingChip } from "../components/NewsCard";
import CoinImage from "../components/CoinImage";
import { ChangePill, IconBadge, InfoTip, LiveDot, Reveal, SectionTitle, TimeAgo } from "../components/ui";
import useHeadlines from "../hooks/useHeadlines";
import { useAbortableEffect } from "../hooks/useAbortable";
import { tokens } from "../theme/theme";
import { formatDate, safeUrl, timeAgo } from "../utils/formatters";
import { TOPICS } from "../utils/rss";
import { marketOutlook, signalGroups } from "../utils/signals";

const SIGNAL_STYLE = {
  up: { color: tokens.up, icon: <RocketLaunchIcon /> },
  safe: { color: tokens.cyan, icon: <ShieldIcon /> },
  watch: { color: tokens.violet, icon: <AutorenewIcon /> },
  warn: { color: tokens.orange, icon: <LocalFireDepartmentIcon /> },
  down: { color: tokens.down, icon: <BatteryAlertIcon /> },
};

const FILTERS = [
  { key: "all", label: "All", test: () => true },
  { key: "bullish", label: "Bullish", test: (item) => item.tone === "bullish" },
  { key: "bearish", label: "Bearish", test: (item) => item.tone === "bearish" },
  { key: "upcoming", label: "Upcoming", test: (item) => item.upcoming },
  ...TOPICS.map((topic) => ({ key: topic.key, label: topic.label, test: (item) => item.topics.includes(topic.key) })),
];

// undefined while loading, null when unavailable.
function useBtcStats() {
  const [stats, setStats] = useState(undefined);
  useAbortableEffect((signal, isAlive) => {
    api
      .get(BitcoinStats(), { signal, silent: true, cacheKey: "btc-stats", cacheTtl: 120000 })
      .then(({ data }) => isAlive() && setStats({ ...data, fetchedAt: Date.now() }))
      .catch(() => isAlive() && setStats(null));
  }, []);
  return stats;
}

function CardHeader({ icon, color, title, info }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
      <IconBadge color={color} size={34}>
        {icon}
      </IconBadge>
      <Typography variant="h6" sx={{ flex: 1 }}>
        {title}
      </Typography>
      {info}
    </Box>
  );
}

function HorizonCard({ stats, fearGreed, headlines, loading }) {
  const events = [];
  if (stats?.n_blocks_total) {
    const height = stats.n_blocks_total;
    if (stats.nextretarget > height) {
      const left = stats.nextretarget - height;
      events.push({
        icon: <SpeedIcon />,
        title: "Bitcoin difficulty adjustment",
        when: stats.fetchedAt + left * (stats.minutes_between_blocks || 10) * 60000,
        detail: `${left.toLocaleString()} blocks to go (block ${stats.nextretarget.toLocaleString()})`,
        note: "Mining difficulty resets. Big swings change miner costs and how much BTC they sell.",
      });
    }
    const halving = Math.ceil((height + 1) / 210000) * 210000;
    events.push({
      icon: <CurrencyBitcoinIcon />,
      title: "Next Bitcoin halving",
      when: stats.fetchedAt + (halving - height) * 10 * 60000,
      detail: `${(halving - height).toLocaleString()} blocks to go (block ${halving.toLocaleString()})`,
      note: "New BTC supply is cut in half — historically one of the biggest long-term catalysts.",
    });
  }
  const today = fearGreed?.[0];
  if (today?.time_until_update) {
    events.push({
      icon: <PsychologyIcon />,
      title: "Fear & Greed index update",
      when: Date.now() + Number(today.time_until_update) * 1000,
      detail: `Today: ${today.value} · ${today.value_classification}`,
      note: "Sentiment swings often lead short-term price moves.",
    });
  }
  events.sort((a, b) => a.when - b.when);
  const ahead = headlines.filter((item) => item.upcoming).slice(0, 4);

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <CardHeader
        icon={<CalendarMonthIcon />}
        color={tokens.gold}
        title="On the horizon"
        info={<InfoTip title="Scheduled on-chain events with live estimated dates, plus forward-looking headlines (plans, deadlines, launches, votes)." />}
      />
      <Box sx={{ position: "relative", pl: 3.5 }}>
        <Box sx={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, borderRadius: 2, bgcolor: tokens.line }} />
        {!events.length &&
          (stats === undefined ? (
            [...Array(2)].map((_, index) => <Skeleton key={index} variant="rounded" height={70} sx={{ mb: 1.5 }} />)
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              On-chain data is unavailable right now.
            </Typography>
          ))}
        {events.map((event, index) => (
          <Box key={event.title} className="row-in" sx={{ position: "relative", mb: 2, animationDelay: `${index * 80}ms` }}>
            <Box
              sx={{
                position: "absolute",
                left: -32,
                top: 0,
                width: 26,
                height: 26,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                color: tokens.gold,
                bgcolor: tokens.surface,
                border: `2px solid ${alpha(tokens.gold, 0.6)}`,
                "& svg": { fontSize: 15 },
              }}
            >
              {event.icon}
            </Box>
            <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", gap: 1 }}>
              <Typography fontWeight={700}>{event.title}</Typography>
              <Chip
                size="small"
                label={<TimeAgo date={event.when} />}
                sx={{ height: 22, fontSize: 11.5, fontWeight: 700, color: tokens.gold, bgcolor: alpha(tokens.gold, 0.12) }}
              />
              <Typography variant="caption" color="text.secondary">
                ≈ {formatDate(event.when)}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {event.detail}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.85 }}>
              {event.note}
            </Typography>
          </Box>
        ))}
      </Box>

      <Typography variant="overline" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1 }}>
        <CampaignIcon sx={{ fontSize: 17 }} /> Forward-looking headlines
      </Typography>
      {loading && <Skeleton variant="rounded" height={90} />}
      {!loading && !ahead.length && (
        <Typography variant="body2" color="text.secondary">
          No forward-looking stories in today's feeds.
        </Typography>
      )}
      {ahead.map((item) => {
        const url = safeUrl(item.link);
        return (
          <Box
            key={item.title}
            component={url ? "a" : "div"}
            href={url?.href}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: "block",
              py: 1,
              px: 1,
              mx: -1,
              borderRadius: "10px",
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "rgba(148,163,184,0.07)" },
            }}
          >
            <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4 }}>
              {item.title}
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
              <UpcomingChip />
              <ToneChip tone={item.tone} />
              <Typography variant="caption" color="text.secondary">
                {item.source} · {timeAgo(item.date)}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Paper>
  );
}

function SignalCard({ group }) {
  const navigate = useNavigate();
  const style = SIGNAL_STYLE[group.tone];
  return (
    <Paper variant="glass" className="lift" sx={{ p: 2.25, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1 }}>
        <IconBadge color={style.color} size={34}>
          {style.icon}
        </IconBadge>
        <Typography variant="h6" sx={{ flex: 1, fontSize: "1.1rem" }}>
          {group.title}
        </Typography>
        <Chip size="small" label={group.coins.length} sx={{ fontWeight: 800, color: style.color, bgcolor: alpha(style.color, 0.14) }} />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.55 }}>
        {group.blurb}
      </Typography>
      {group.coins.map(({ coin, note }, index) => (
        <Box
          key={coin.id}
          role="link"
          tabIndex={0}
          className="row-in"
          onClick={() => navigate(`/coins/${coin.id}`)}
          onKeyDown={(event) => event.key === "Enter" && navigate(`/coins/${coin.id}`)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            px: 1,
            py: 0.9,
            mx: -1,
            borderRadius: "12px",
            cursor: "pointer",
            animationDelay: `${index * 50}ms`,
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: alpha(style.color, 0.08) },
          }}
        >
          <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={26} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {coin.name} <Typography component="span" variant="caption" color="text.secondary">{coin.symbol}</Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap component="div">
              {note}
            </Typography>
          </Box>
          <ChangePill value={coin.price_change_percentage_24h} sx={{ fontSize: 12 }} />
        </Box>
      ))}
      {!group.coins.length && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
          No coins match this signal right now — check back after the next refresh.
        </Typography>
      )}
    </Paper>
  );
}

function PlaybookCard() {
  const tips = [
    "Pair a signal with the coin's risk score — Steady climbers suit lower-risk buyers.",
    "'Overheated' rarely means sell; it often means wait for a pullback to buy.",
    "Check the headline tone and volume before acting on any breakout.",
    "Size positions so a 20–30% drop wouldn't hurt — crypto moves fast.",
  ];
  return (
    <Paper variant="glass" sx={{ p: 2.25, height: "100%", background: `linear-gradient(160deg, ${alpha(tokens.gold, 0.12)}, rgba(12,17,31,0.85) 55%)` }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
        <IconBadge color={tokens.gold} size={34}>
          <TipsAndUpdatesIcon />
        </IconBadge>
        <Typography variant="h6" sx={{ fontSize: "1.1rem" }}>
          How to use signals
        </Typography>
      </Box>
      <Box component="ol" sx={{ pl: 2.5, m: 0, display: "grid", gap: 1.25 }}>
        {tips.map((tip) => (
          <Typography key={tip} component="li" variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {tip}
          </Typography>
        ))}
      </Box>
    </Paper>
  );
}

function TrendingCoins({ items, coinsById, loading }) {
  const navigate = useNavigate();
  const trending = useMemo(() => {
    const counts = {};
    items.forEach((item) =>
      item.coins.forEach((id) => {
        counts[id] = (counts[id] || 0) + 1;
      })
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({ coin: coinsById[id], count, stories: items.filter((item) => item.coins.includes(id)) }))
      .filter((row) => row.coin)
      .slice(0, 10);
  }, [items, coinsById]);

  if (loading) return <Skeleton variant="rounded" height={90} sx={{ borderRadius: "18px" }} />;
  if (!trending.length) {
    return (
      <Typography variant="body2" color="text.secondary">
        No coins from the top 100 are named in today's headlines yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(5, 1fr)" } }}>
      {trending.map(({ coin, count, stories }, index) => {
        const bullish = stories.filter((item) => item.tone === "bullish").length;
        const bearish = stories.filter((item) => item.tone === "bearish").length;
        return (
          <Paper
            key={coin.id}
            variant="glass"
            className="lift row-in"
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/coins/${coin.id}`)}
            onKeyDown={(event) => event.key === "Enter" && navigate(`/coins/${coin.id}`)}
            sx={{ p: 1.75, cursor: "pointer", animationDelay: `${index * 40}ms` }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
              <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={30} />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap>
                  {coin.symbol}
                </Typography>
                <ChangePill value={coin.price_change_percentage_24h} soft={false} sx={{ fontSize: 12 }} />
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              {count} {count === 1 ? "story" : "stories"} ·{" "}
              <Box component="span" sx={{ color: tokens.up }}>
                {bullish}▲
              </Box>{" "}
              <Box component="span" sx={{ color: tokens.down }}>
                {bearish}▼
              </Box>
            </Typography>
          </Paper>
        );
      })}
    </Box>
  );
}

function NewsFeed({ items, loading, coinsById }) {
  const [filter, setFilter] = useState("all");
  const [visible, setVisible] = useState(9);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.key, items.filter(f.test).length])), [items]);
  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const list = items.filter(active.test);

  return (
    <>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2.5 }}>
        {FILTERS.filter((f) => f.key === "all" || counts[f.key]).map((f) => {
          const selected = f.key === filter;
          return (
            <Chip
              key={f.key}
              clickable
              label={`${f.label} · ${counts[f.key]}`}
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => {
                setFilter(f.key);
                setVisible(9);
              }}
              sx={{ transition: "all 0.25s", ...(selected && { color: "primary.contrastText" }) }}
            />
          );
        })}
      </Box>
      {loading ? (
        <Grid container spacing={2.5}>
          {[...Array(6)].map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Skeleton variant="rounded" height={380} sx={{ borderRadius: "18px" }} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Grid container spacing={2.5} key={filter}>
          {list.slice(0, visible).map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.link || item.title} className="row-in" sx={{ animationDelay: `${(index % 9) * 50}ms` }}>
              <NewsCard item={item} coinsById={coinsById} />
            </Grid>
          ))}
          {!list.length && (
            <Grid item xs={12}>
              <Typography color="text.secondary">No stories in this filter right now.</Typography>
            </Grid>
          )}
        </Grid>
      )}
      {list.length > visible && (
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button variant="outlined" onClick={() => setVisible((n) => n + 9)}>
            Load more stories ({list.length - visible} left)
          </Button>
        </Box>
      )}
    </>
  );
}

function NewsPage() {
  const { coins } = CryptoState();
  const { items, loading } = useHeadlines();
  const fearGreed = useFearGreed();
  const stats = useBtcStats();
  const coinsById = useMemo(() => Object.fromEntries(coins.map((coin) => [coin.id, coin])), [coins]);
  const groups = useMemo(() => signalGroups(coins), [coins]);
  const outlook = useMemo(
    () => marketOutlook({ coins, fearGreed: fearGreed?.[0] ? Number(fearGreed[0].value) : null, headlines: items }),
    [coins, fearGreed, items]
  );

  useEffect(() => {
    const previous = document.title;
    document.title = "Crypto news & signals | CryptoXplorers";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, pb: 8 }}>
      <Box className="rise-in">
        <SectionTitle
          eyebrow="News & signals"
          title="Crypto radar: what could move next"
          subtitle="Hot headlines, near-term momentum signals and on-chain countdowns — the research you need before you buy, in one place."
          action={
            <Chip
              icon={<LiveDot />}
              variant="outlined"
              label={loading ? "Loading feeds…" : `${items.length} stories today`}
              sx={{ pl: 1, bgcolor: "rgba(22, 199, 132, 0.06)", borderColor: "rgba(22, 199, 132, 0.3)" }}
            />
          }
        />
      </Box>
      <Alert
        severity="info"
        icon={<LightbulbIcon />}
        sx={{ mb: 3, color: "text.primary", bgcolor: alpha(tokens.cyan, 0.07), border: `1px solid ${alpha(tokens.cyan, 0.25)}`, "& .MuiAlert-icon": { color: tokens.cyan } }}
      >
        Signals are data-driven heuristics built from price momentum, volume, market sentiment and headline tone. They are meant to
        speed up your research — not financial advice or a guarantee of future prices.
      </Alert>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={5}>
          <Reveal sx={{ height: "100%" }}>
            {coins.length ? (
              <Outlook
                outlook={outlook}
                title="Near-term market outlook"
                icon={<PsychologyIcon />}
                info="A 0–100 bias blended from market breadth (share of coins rising today), the average weekly trend, the Fear & Greed index and the tone of today's headlines. Above 55 leans bullish, below 45 leans bearish."
                footnote="A directional bias for the coming days, not a price forecast."
              />
            ) : (
              <Skeleton variant="rounded" height={520} />
            )}
          </Reveal>
        </Grid>
        <Grid item xs={12} md={7}>
          <Reveal delay={100} sx={{ height: "100%" }}>
            <HorizonCard stats={stats} fearGreed={fearGreed} headlines={items} loading={loading} />
          </Reveal>
        </Grid>
      </Grid>

      <Box component="section" sx={{ pt: { xs: 6, md: 8 } }}>
        <Reveal>
          <SectionTitle
            eyebrow="Momentum signals"
            title="Near-term setups to watch"
            subtitle="Top-100 coins grouped by what their 1h, 24h and 7d moves, volume and risk say right now. Updates with live prices."
          />
        </Reveal>
        <Grid container spacing={2.5}>
          {groups.map((group, index) => (
            <Grid item xs={12} sm={6} lg={4} key={group.key}>
              <Reveal delay={index * 70} sx={{ height: "100%" }}>
                {coins.length ? <SignalCard group={group} /> : <Skeleton variant="rounded" height={360} />}
              </Reveal>
            </Grid>
          ))}
          <Grid item xs={12} sm={6} lg={4}>
            <Reveal delay={350} sx={{ height: "100%" }}>
              <PlaybookCard />
            </Reveal>
          </Grid>
        </Grid>
      </Box>

      <Box component="section" sx={{ pt: { xs: 6, md: 8 } }}>
        <Reveal>
          <SectionTitle eyebrow="Trending" title="Coins in the headlines" subtitle="Most-mentioned coins across today's coverage, with the tone of their stories." />
        </Reveal>
        <TrendingCoins items={items} coinsById={coinsById} loading={loading} />
      </Box>

      <Box component="section" sx={{ pt: { xs: 6, md: 8 } }}>
        <Reveal>
          <SectionTitle
            eyebrow="Latest"
            title="Hot crypto news"
            subtitle="Live from CoinDesk and Cointelegraph, tagged by tone, topic and the coins involved."
          />
        </Reveal>
        <NewsFeed items={items} loading={loading} coinsById={coinsById} />
      </Box>
    </Container>
  );
}

export default NewsPage;
