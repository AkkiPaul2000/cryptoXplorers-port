import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Collapse,
  Container,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link as MuiLink,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import LinkIcon from "@mui/icons-material/Link";
import LanguageIcon from "@mui/icons-material/Language";
import ExploreIcon from "@mui/icons-material/Explore";
import GitHubIcon from "@mui/icons-material/GitHub";
import RedditIcon from "@mui/icons-material/Reddit";
import XIcon from "@mui/icons-material/X";
import DescriptionIcon from "@mui/icons-material/Description";
import PublicIcon from "@mui/icons-material/Public";
import BarChartIcon from "@mui/icons-material/BarChart";
import BoltIcon from "@mui/icons-material/Bolt";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TokenIcon from "@mui/icons-material/Token";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import GroupsIcon from "@mui/icons-material/Groups";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import InsightsIcon from "@mui/icons-material/Insights";
import api, { isRateLimited } from "../api/client";
import { BinanceDepth, BitcoinStats, CoinMarkets, CoinProfile, SingleTicker, TodayOhlc } from "../config/api";
import { showWatchlist } from "../config/data";
import { CryptoState } from "../CryptoContext";
import CoinInfo from "../components/CoinInfo";
import CoinNews from "../components/CoinNews";
import RiskMeter from "../components/RiskMeter";
import Outlook from "../components/Outlook";
import TechnicalAnalysis from "../components/TechnicalAnalysis";
import CoinImage from "../components/CoinImage";
import { AnimatedNumber, ChangePill, IconBadge, InfoTip, Reveal, SwapStack, TimeAgo } from "../components/ui";
import { goldGradient, tokens } from "../theme/theme";
import { formatDate, formatMarketCap, formatPercent, formatPrice, safeUrl, stripHtml } from "../utils/formatters";
import { mapTicker, walkBook } from "../utils/market";
import { coinRiskScore } from "../utils/risk";
import { useAbortableEffect } from "../hooks/useAbortable";
import useHeadlines from "../hooks/useHeadlines";
import { filterNews } from "../utils/rss";
import { coinOutlook, isPegged } from "../utils/signals";

const TRUST = { high: tokens.up, medium: tokens.gold, low: tokens.down };

const trimNumber = (n, digits) => (Number.isFinite(n) ? n.toFixed(digits).replace(/\.?0+$/, "") : "");

const initials = (name = "") =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

function Hero({ coin, profile, symbol, currency, watched, onWatch, onShare }) {
  const links = [
    ["Website", profile?.links?.website?.[0], <LanguageIcon />],
    ["Explorer", profile?.links?.explorer?.[0], <ExploreIcon />],
    ["Source", profile?.links?.source_code?.[0], <GitHubIcon />],
    ["Reddit", profile?.links?.reddit?.[0], <RedditIcon />],
    ["X", profile?.links_extended?.find((link) => link.type === "twitter")?.url, <XIcon />],
    ["Whitepaper", profile?.whitepaper?.link, <DescriptionIcon />],
  ]
    .map(([label, href, icon]) => [label, safeUrl(href), icon])
    .filter(([, url]) => url);
  const mood = coin.price_change_percentage_24h >= 0 ? tokens.up : tokens.down;

  return (
    <Paper variant="glass" className="rise-in" sx={{ p: { xs: 2.5, md: 3.5 }, mb: 2.5, overflow: "hidden" }}>
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: -140,
          left: -100,
          width: 420,
          height: 420,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${alpha(mood, 0.16)}, transparent 65%)`,
        }}
      />
      <Grid container spacing={3} alignItems="center" sx={{ position: "relative" }}>
        <Grid item xs={12} md={7}>
          <Box sx={{ display: "flex", gap: { xs: 2, md: 2.5 }, alignItems: "center" }}>
            <Box
              className="float"
              sx={{
                p: 1.25,
                borderRadius: "24px",
                flexShrink: 0,
                bgcolor: "rgba(148,163,184,0.06)",
                border: `1px solid ${tokens.line}`,
                boxShadow: `0 16px 40px -16px ${alpha(tokens.gold, 0.45)}`,
              }}
            >
              <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={64} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h3" sx={{ fontSize: { xs: "1.8rem", md: "2.5rem" }, lineHeight: 1.1 }}>
                  {coin.name}
                </Typography>
                <Chip label={coin.symbol} size="small" />
                <Chip label={`Rank #${coin.market_cap_rank}`} size="small" color="primary" variant="outlined" />
                {profile?.type && (
                  <Chip label={profile.type} size="small" variant="outlined" sx={{ textTransform: "capitalize" }} />
                )}
              </Box>
              {links.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                  {links.map(([label, url, icon]) => (
                    <Chip
                      key={label}
                      icon={icon}
                      label={label}
                      size="small"
                      variant="outlined"
                      clickable
                      component="a"
                      href={url.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ "& .MuiChip-icon": { fontSize: 15 } }}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
        <Grid item xs={12} md={5} sx={{ textAlign: { md: "right" } }}>
          <Typography variant="overline" color="text.secondary">
            {coin.name} price · {currency}
          </Typography>
          <Typography variant="h2" sx={{ fontSize: { xs: "2.2rem", md: "3rem" }, lineHeight: 1.1 }}>
            <AnimatedNumber value={coin.current_price} format={(value) => formatPrice(value, symbol)} />
          </Typography>
          <Box
            sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: { md: "flex-end" }, mt: 1, flexWrap: "wrap" }}
          >
            <ChangePill value={coin.price_change_percentage_24h} sx={{ fontSize: 15 }} />
            <Typography variant="body2" color="text.secondary">
              24h
              {coin.last_updated && <TimeAgo date={coin.last_updated} prefix=" · updated " />}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 1, justifyContent: { md: "flex-end" }, mt: 2.5 }}>
            {showWatchlist && (
              <Button
                variant={watched ? "contained" : "outlined"}
                startIcon={watched ? <StarIcon /> : <StarBorderIcon />}
                onClick={onWatch}
                aria-pressed={watched}
              >
                {watched ? "On watchlist" : "Add to watchlist"}
              </Button>
            )}
            <Tooltip title="Copy link to this coin">
              <IconButton onClick={onShare} aria-label="Copy link" sx={{ border: `1px solid ${tokens.line}` }}>
                <LinkIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
}

export function Converter({ coin, symbol, currency }) {
  const price = coin.current_price || 0;
  // The edited field is the source of truth; the other one is derived, so it follows price changes.
  const [entry, setEntry] = useState({ field: "coin", text: "1" });
  const typed = Number(entry.text) || 0;
  const coinText = entry.field === "coin" ? entry.text : trimNumber(price ? typed / price : 0, 8);
  const fiatText = entry.field === "fiat" ? entry.text : trimNumber(typed * price, 2);

  const coinField = (
    <TextField
      fullWidth
      type="number"
      value={coinText}
      onChange={(event) => setEntry({ field: "coin", text: event.target.value })}
      inputProps={{ min: 0, step: "any", "aria-label": `Amount in ${coin.symbol}` }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={22} />
          </InputAdornment>
        ),
        endAdornment: <InputAdornment position="end">{coin.symbol}</InputAdornment>,
      }}
    />
  );
  const fiatField = (
    <TextField
      fullWidth
      type="number"
      value={fiatText}
      onChange={(event) => setEntry({ field: "fiat", text: event.target.value })}
      inputProps={{ min: 0, step: "any", "aria-label": `Amount in ${currency}` }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box component="span" sx={{ color: "primary.main", fontWeight: 700, width: 22, textAlign: "center" }}>
              {symbol}
            </Box>
          </InputAdornment>
        ),
        endAdornment: <InputAdornment position="end">{currency}</InputAdornment>,
      }}
    />
  );

  return (
    <Paper variant="glass" className="lift" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="overline" color="text.secondary">
        Converter
      </Typography>
      <SwapStack first={coinField} second={fiatField} label={`Swap ${coin.symbol} and ${currency}`} sx={{ mt: 1 }} />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "center" }}>
        1 {coin.symbol} = {formatPrice(price, symbol)}
      </Typography>
    </Paper>
  );
}

function StatTile({ icon, color, label, info, value, hint, children }) {
  return (
    <Paper variant="glass" className="lift" sx={{ p: 2, height: "100%", minWidth: 0 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.25 }}>
        <IconBadge color={color} size={30}>
          {icon}
        </IconBadge>
        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ flex: 1 }} noWrap>
          {label}
        </Typography>
        {info && <InfoTip title={info} />}
      </Box>
      <Typography variant="h6" noWrap>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary" component="div" noWrap>
          {hint}
        </Typography>
      )}
      {children}
    </Paper>
  );
}

function KeyStats({ coin, symbol, book }) {
  const turnover = coin.market_cap ? (coin.total_volume / coin.market_cap) * 100 : null;
  const reclaim = coin.ath_change < -0.5 ? (1 / (1 + coin.ath_change / 100) - 1) * 100 : null;
  const supplyShare = coin.max_supply && coin.circulating_supply ? (coin.circulating_supply / coin.max_supply) * 100 : null;
  const beta = coin.beta != null ? Number(coin.beta) : null;

  const tiles = [
    {
      icon: <PublicIcon />,
      color: tokens.gold,
      label: "Market cap",
      info: "Price multiplied by supply.",
      value: formatMarketCap(coin.market_cap, symbol),
      hint: (
        <>
          <ChangePill value={coin.market_cap_change_24h} soft={false} /> 24h
        </>
      ),
    },
    {
      icon: <BarChartIcon />,
      color: tokens.cyan,
      label: "Volume 24h",
      info: "Value traded across exchanges in the last 24 hours.",
      value: formatMarketCap(coin.total_volume, symbol),
      hint: (
        <>
          <ChangePill value={coin.volume_change_24h} soft={false} /> vs prior day
        </>
      ),
    },
    {
      icon: <BoltIcon />,
      color: tokens.violet,
      label: "Vol / Mcap",
      info: "Turnover: how much of the market cap changed hands today. Higher means more actively traded.",
      value: turnover != null ? `${turnover.toFixed(2)}%` : "—",
      hint: turnover == null ? null : turnover > 10 ? "Very active trading" : turnover > 3 ? "Active trading" : "Quiet trading",
    },
    {
      icon: <TrendingUpIcon />,
      color: tokens.up,
      label: "All-time high",
      value: formatPrice(coin.ath_price, symbol),
      hint: coin.ath_date ? formatDate(coin.ath_date) : null,
    },
    {
      icon: <TrendingDownIcon />,
      color: tokens.down,
      label: "From ATH",
      info: "Distance from the all-time high, and the gain needed to get back there.",
      value: formatPercent(coin.ath_change),
      hint: reclaim != null ? `+${reclaim.toFixed(1)}% to reclaim` : "Trading near its high",
    },
    {
      icon: <TokenIcon />,
      color: tokens.orange,
      label: "Total supply",
      value: formatMarketCap(coin.circulating_supply),
      hint: supplyShare != null ? `${supplyShare.toFixed(1)}% of ${formatMarketCap(coin.max_supply)} max` : "No hard supply cap",
      extra: supplyShare != null && <LinearProgress variant="determinate" color="warning" value={supplyShare} sx={{ mt: 1 }} />,
    },
    {
      icon: <WaterDropIcon />,
      color: tokens.cyan,
      label: "Depth ±2%",
      info: "Order-book liquidity on Binance: USD value of asks within +2% and bids within −2% of the price.",
      value: book?.up ? formatMarketCap(book.up, "$") : "—",
      hint: book?.down ? `Bids ${formatMarketCap(book.down, "$")} at −2%` : "No Binance order book",
    },
    {
      icon: <ShowChartIcon />,
      color: tokens.gold,
      label: "Beta",
      info: "Volatility relative to the overall market. Above 1 swings more than the market.",
      value: beta != null ? beta.toFixed(2) : "—",
      hint: beta == null ? null : beta > 1.2 ? "Swings more than market" : beta < 0.8 ? "Calmer than market" : "Moves with the market",
    },
  ];

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" }, gap: 2, height: "100%" }}>
      {tiles.map(({ extra, ...tile }, index) => (
        <Reveal key={tile.label} delay={index * 50} sx={{ minWidth: 0 }}>
          <StatTile {...tile}>{extra}</StatTile>
        </Reveal>
      ))}
    </Box>
  );
}

function Performance({ coin }) {
  const periods = [
    ["1h", coin.price_change_percentage_1h],
    ["6h", coin.price_change_percentage_6h],
    ["12h", coin.price_change_percentage_12h],
    ["24h", coin.price_change_percentage_24h],
    ["7d", coin.price_change_percentage_7d_in_currency],
    ["30d", coin.price_change_percentage_30d],
    ["1y", coin.price_change_percentage_1y],
  ].filter(([, value]) => value); // CoinPaprika reports missing windows as 0
  const max = Math.max(1, ...periods.map(([, value]) => Math.abs(value)));

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h6">Performance</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Price change across time windows
      </Typography>
      {periods.map(([label, value], index) => {
        const up = value >= 0;
        const width = (Math.abs(value) / max) * 50;
        return (
          <Box
            key={label}
            sx={{ display: "grid", gridTemplateColumns: "34px 1fr 76px", alignItems: "center", gap: 1.5, py: 0.9 }}
          >
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              {label}
            </Typography>
            <Box sx={{ position: "relative", height: 10, borderRadius: 99, bgcolor: "rgba(148,163,184,0.08)" }}>
              <Box sx={{ position: "absolute", left: "50%", top: -4, bottom: -4, width: "1px", bgcolor: "rgba(148,163,184,0.35)" }} />
              <Box
                className="grow-x"
                sx={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: up ? "50%" : `${50 - width}%`,
                  width: `${width}%`,
                  borderRadius: 99,
                  bgcolor: up ? tokens.up : tokens.down,
                  boxShadow: `0 0 12px ${alpha(up ? tokens.up : tokens.down, 0.45)}`,
                  transformOrigin: up ? "left" : "right",
                  animationDelay: `${index * 70}ms`,
                  transition: "width 0.6s ease, left 0.6s ease",
                }}
              />
            </Box>
            <ChangePill value={value} soft={false} sx={{ justifyContent: "flex-end", fontSize: 13 }} />
          </Box>
        );
      })}
    </Paper>
  );
}

function About({ coin, profile }) {
  const [open, setOpen] = useState(false);
  const description = stripHtml(profile?.description || "");
  const long = description.length > 360;
  const tags = profile?.tags || [];
  const team = profile?.team || [];

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        About {coin.name}
      </Typography>
      {!description && <Typography color="text.secondary">No project description available.</Typography>}
      {description && !long && (
        <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
          {description}
        </Typography>
      )}
      {long && (
        <>
          <Collapse
            in={open}
            collapsedSize={112}
            sx={{
              maskImage: open ? "none" : "linear-gradient(#000 55%, transparent)",
              WebkitMaskImage: open ? "none" : "linear-gradient(#000 55%, transparent)",
            }}
          >
            <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
              {description}
            </Typography>
          </Collapse>
          <Button size="small" onClick={() => setOpen((value) => !value)} sx={{ mt: 1, px: 1.5 }}>
            {open ? "Show less" : "Read more"}
          </Button>
        </>
      )}

      {tags.length > 0 && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 2.5, mb: 1 }}>
            <LocalOfferOutlinedIcon sx={{ fontSize: 16 }} /> Tags
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
            {tags.slice(0, 12).map((tag) => (
              <Tooltip key={tag.id} title={`${tag.coin_counter} coins share this tag`}>
                <Chip label={tag.name} size="small" variant="outlined" />
              </Tooltip>
            ))}
            {tags.length > 12 && <Chip label={`+${tags.length - 12} more`} size="small" />}
          </Box>
        </>
      )}

      {team.length > 0 && (
        <>
          <Typography variant="overline" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 2.5, mb: 1 }}>
            <GroupsIcon sx={{ fontSize: 17 }} /> Team
          </Typography>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
            {team.slice(0, 6).map((member) => (
              <Box
                key={member.id}
                sx={{ display: "flex", gap: 1.25, alignItems: "center", p: 1, borderRadius: "12px", bgcolor: "rgba(148,163,184,0.05)" }}
              >
                <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 700, bgcolor: alpha(tokens.violet, 0.3), color: tokens.text }}>
                  {initials(member.name)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={700} noWrap>
                    {member.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap display="block">
                    {member.position}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </>
      )}
    </Paper>
  );
}

function Facts({ profile, chain }) {
  const yesNo = (value, yes, no) => (value == null ? null : value ? yes : no);
  const rows = [
    ["Launched", profile?.started_at ? formatDate(profile.started_at, { month: "short", year: "numeric" }) : null],
    ["Consensus", profile?.proof_type],
    ["Hash algorithm", profile?.hash_algorithm],
    ["Development", profile?.development_status],
    ["Organization", profile?.org_structure],
    ["Open source", yesNo(profile?.open_source, "Yes", "No")],
    ["Hardware wallets", yesNo(profile?.hardware_wallet, "Supported", "Not supported")],
  ];
  const network = chain
    ? [
        ["Block height", Number(chain.n_blocks_total || 0).toLocaleString()],
        ["Transactions (24h)", Number(chain.n_tx || 0).toLocaleString()],
        ["Hash rate", `${(Number(chain.hash_rate || 0) / 1e9).toFixed(1)} EH/s`],
        ["Avg block time", chain.minutes_between_blocks ? `${Number(chain.minutes_between_blocks).toFixed(1)} min` : null],
        ["On-chain volume (24h)", formatMarketCap(chain.estimated_transaction_volume_usd, "$")],
      ]
    : [];

  const list = (items) =>
    items
      .filter(([, value]) => value)
      .map(([label, value]) => (
        <Box
          key={label}
          sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 1.1, borderBottom: "1px solid", borderColor: "divider", "&:last-of-type": { borderBottom: 0 } }}
        >
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2" fontWeight={700} sx={{ textAlign: "right" }}>
            {value}
          </Typography>
        </Box>
      ));

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        Project facts
      </Typography>
      {list(rows)}
      {network.length > 0 && (
        <>
          <Typography variant="overline" sx={{ display: "block", mt: 2.5, color: "primary.main" }}>
            Bitcoin network · live
          </Typography>
          {list(network)}
        </>
      )}
    </Paper>
  );
}

function Markets({ coin, markets }) {
  const maxShare = Math.max(0.01, ...markets.map((market) => market.adjusted_volume_24h_share || 0));

  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%" }}>
      <Typography variant="h6">Top exchanges</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        Spot markets with the most {coin.symbol} volume in the last 24h (outliers excluded)
      </Typography>
      <Box sx={{ overflowX: "auto", mx: -1 }}>
        <Table size="small" sx={{ "& td, & th": { px: 1 } }}>
          <TableHead>
            <TableRow>
              <TableCell>Exchange</TableCell>
              <TableCell>Pair</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Volume</TableCell>
              <TableCell>Share</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {markets.map((market, index) => {
              const share = Number(market.adjusted_volume_24h_share || 0);
              const url = safeUrl(market.market_url);
              const trust = TRUST[market.trust_score] || tokens.muted;
              return (
                <TableRow key={`${market.exchange_id}-${market.pair}`} hover className="row-in" sx={{ animationDelay: `${index * 40}ms`, "& td": { py: 1.2 } }}>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Tooltip title={`Trust score: ${market.trust_score || "unknown"}`}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: trust, boxShadow: `0 0 8px ${trust}`, flexShrink: 0 }} />
                      </Tooltip>
                      {url ? (
                        <MuiLink href={url.href} target="_blank" rel="noopener noreferrer" underline="hover" color="text.primary" fontWeight={600} noWrap>
                          {market.exchange_name}
                        </MuiLink>
                      ) : (
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {market.exchange_name}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "text.secondary", whiteSpace: "nowrap" }}>{market.pair}</TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {formatPrice(market.quotes?.USD?.price, "$")}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {formatMarketCap(market.quotes?.USD?.volume_24h, "$")}
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box sx={{ flex: 1, height: 6, borderRadius: 99, bgcolor: "rgba(148,163,184,0.1)", overflow: "hidden" }}>
                        <Box
                          className="grow-x"
                          sx={{ height: "100%", width: `${(share / maxShare) * 100}%`, background: goldGradient, borderRadius: 99, transformOrigin: "left", animationDelay: `${index * 40}ms` }}
                        />
                      </Box>
                      <Typography variant="caption" fontWeight={700} sx={{ width: 42, textAlign: "right" }}>
                        {share.toFixed(1)}%
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
            {!markets.length && (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 4, textAlign: "center", color: "text.secondary" }}>
                  Exchange books are unavailable for this coin.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Paper>
  );
}

function PageSkeleton() {
  const card = { borderRadius: "18px" };
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Skeleton width={220} sx={{ mb: 2 }} />
      <Skeleton variant="rounded" height={160} sx={{ ...card, mb: 2.5 }} />
      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Skeleton variant="rounded" height={540} sx={card} />
        </Grid>
        <Grid item xs={12} lg={4}>
          <Skeleton variant="rounded" height={258} sx={{ ...card, mb: 2.5 }} />
          <Skeleton variant="rounded" height={258} sx={card} />
        </Grid>
      </Grid>
    </Container>
  );
}

function CoinPage() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [profile, setProfile] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [book, setBook] = useState(null);
  const [chain, setChain] = useState(null);
  const [failure, setFailure] = useState(null);
  const [reload, setReload] = useState(0);
  const [toast, setToast] = useState("");
  const { currency, symbol, watchlist, toggleWatch, tickerById } = CryptoState();
  const { items: headlines, loading: headlinesLoading } = useHeadlines();
  const coinHeadlines = useMemo(() => (coin ? filterNews(headlines, coin) : []), [headlines, coin]);

  useAbortableEffect(
    (signal, isAlive) => {
      const load = async () => {
        setFailure(null);
        try {
          const [tickerRes, profileRes, marketRes, ohlcRes] = await Promise.all([
            // The market list (refreshed every 5 min) usually has this ticker already.
            tickerById.has(id)
              ? { data: tickerById.get(id) }
              : api.get(SingleTicker(id), { signal, cacheKey: `ticker-${id}`, cacheTtl: 120000 }),
            api.get(CoinProfile(id), { signal, cacheKey: `profile-${id}`, cacheTtl: 3600000 }),
            api.get(CoinMarkets(id), { signal, silent: true, cacheKey: `markets-${id}`, cacheTtl: 900000 }).catch(() => ({ data: [] })),
            api.get(TodayOhlc(id), { signal, silent: true, cacheKey: `today-${id}`, cacheTtl: 600000 }).catch(() => ({ data: [] })),
          ]);
          if (!isAlive()) return;

          const mapped = mapTicker(tickerRes.data, currency);
          const usd = tickerRes.data?.quotes?.USD?.price || mapped.current_price;
          const scale = usd ? mapped.current_price / usd : 1;
          const candle = ohlcRes.data?.[0];

          setCoin({
            ...mapped,
            usdPrice: usd,
            high_24h: candle ? candle.high * scale : null,
            low_24h: candle ? candle.low * scale : null,
          });
          setProfile(profileRes.data);
          setMarkets(
            (Array.isArray(marketRes.data) ? marketRes.data : [])
              .filter((row) => !row.outlier && row.category === "Spot")
              .sort((a, b) => (b.quotes?.USD?.volume_24h || 0) - (a.quotes?.USD?.volume_24h || 0))
              .slice(0, 8)
          );

          if (id === "btc-bitcoin") {
            api
              .get(BitcoinStats(), { signal, silent: true, cacheKey: "btc-stats", cacheTtl: 120000 })
              .then((stats) => isAlive() && setChain(stats?.data || null))
              .catch(() => isAlive() && setChain(null));
          } else {
            setChain(null);
          }

          api
            .get(BinanceDepth(tickerRes.data.symbol), { signal, silent: true })
            .then((depth) => {
              if (!isAlive() || !depth?.data?.bids || !depth?.data?.asks) return;
              const mid = Number(depth.data.asks[0]?.[0]);
              setBook({
                up: walkBook(depth.data.asks, mid, "up"),
                down: walkBook(depth.data.bids, mid, "down"),
              });
            })
            .catch(() => isAlive() && setBook(null));
        } catch (error) {
          if (!isAlive() || error.code === "ERR_CANCELED") return;
          setFailure(error.response?.status === 404 ? "missing" : isRateLimited(error) ? "limited" : "busy");
        }
      };
      load();
    },
    [id, currency, reload]
  );

  useEffect(() => {
    if (!coin) return undefined;
    const previous = document.title;
    document.title = `${coin.name} (${coin.symbol}) ${formatPrice(coin.current_price, symbol)} | CryptoXplorers`;
    return () => {
      document.title = previous;
    };
  }, [coin, symbol]);

  if (failure) {
    const missing = failure === "missing";
    return (
      <Container maxWidth="sm" sx={{ py: 12, textAlign: "center" }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          {missing ? "Coin not found" : "Couldn't load this coin"}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {missing
            ? "No coin matches this address. It may have been delisted or renamed."
            : failure === "limited"
            ? "Market data is paused: CoinPaprika's free plan allows 60 requests an hour. Try again in a few minutes."
            : "The market data service is busy. Give it a moment and try again."}
        </Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center">
          {!missing && (
            <Button variant="contained" onClick={() => setReload((value) => value + 1)}>
              Try again
            </Button>
          )}
          <Button variant="outlined" component={Link} to="/">
            Back to markets
          </Button>
        </Stack>
      </Container>
    );
  }

  // Keep showing the current coin while a currency switch refetches; skeleton only for a new coin.
  if (!coin || coin.id !== id) return <PageSkeleton />;

  const risk = coinRiskScore(coin);
  const rank = coin.market_cap_rank || 100;
  const range = coin.high_24h && coin.low_24h ? ((coin.high_24h - coin.low_24h) / coin.current_price) * 100 : null;
  const factors = [
    ["24h range", range != null ? `${range.toFixed(2)}%` : "—"],
    ["7d swing", formatPercent(coin.price_change_percentage_7d_in_currency)],
    ["Beta", coin.beta != null ? Number(coin.beta).toFixed(2) : "—"],
    ["Size", rank <= 10 ? "Top 10" : rank <= 25 ? "Top 25" : rank <= 50 ? "Top 50" : "Rank 51+"],
  ];
  const watched = watchlist.includes(coin.id);

  const share = () => {
    if (!navigator.clipboard) {
      setToast("Copy isn't available in this browser");
      return;
    }
    navigator.clipboard.writeText(window.location.href).then(
      () => setToast("Link copied to clipboard"),
      () => setToast("Couldn't copy the link")
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 }, pb: 8 }}>
      <Breadcrumbs separator="›" sx={{ mb: 2.5 }}>
        <Typography component={Link} to="/" variant="body2" color="text.secondary" sx={{ "&:hover": { color: "primary.main" } }}>
          Markets
        </Typography>
        <Typography component={Link} to="/#screener" variant="body2" color="text.secondary" sx={{ "&:hover": { color: "primary.main" } }}>
          Top 100
        </Typography>
        <Typography variant="body2" color="text.primary" fontWeight={600}>
          {coin.name}
        </Typography>
      </Breadcrumbs>

      <Hero
        coin={coin}
        profile={profile}
        symbol={symbol}
        currency={currency}
        watched={watched}
        onWatch={() => {
          toggleWatch(coin.id);
          setToast(watched ? `${coin.name} removed from your watchlist` : `${coin.name} added to your watchlist`);
        }}
        onShare={share}
      />

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <Reveal sx={{ height: "100%" }}>
            <CoinInfo coin={coin} />
          </Reveal>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "1fr" } }}>
            <Reveal delay={80}>
              <Converter coin={coin} symbol={symbol} currency={currency} />
            </Reveal>
            <Reveal delay={160}>
              <RiskMeter score={risk} factors={factors} />
            </Reveal>
          </Box>
        </Grid>

        <Grid item xs={12} md={8}>
          <KeyStats coin={coin} symbol={symbol} book={book} />
        </Grid>
        <Grid item xs={12} md={4}>
          <Reveal sx={{ height: "100%" }}>
            <Performance coin={coin} />
          </Reveal>
        </Grid>

        <Grid item xs={12} sx={{ mt: { xs: 3, md: 4 } }}>
          <TechnicalAnalysis coin={coin} symbol={symbol} currency={currency} headlines={coinHeadlines} />
        </Grid>

        {!isPegged(coin) && (
          <Grid item xs={12} md={5}>
            <Reveal sx={{ height: "100%" }}>
              <Outlook
                outlook={coinOutlook(coin, { risk, headlines: coinHeadlines })}
                title="Signals & outlook"
                icon={<InsightsIcon />}
                info="A 0–100 near-term bias for this coin from its 1h/24h momentum, 7-day trend, volume change, stability (inverse of the risk score) and the tone of headlines that mention it. Above 55 leans bullish, below 45 leans bearish."
                footnote="Built from live data to speed up your research — not financial advice."
              />
            </Reveal>
          </Grid>
        )}
        <Grid item xs={12} md={isPegged(coin) ? 12 : 7}>
          <Reveal delay={100} sx={{ height: "100%" }}>
            <About coin={coin} profile={profile} />
          </Reveal>
        </Grid>

        <Grid item xs={12} md={7}>
          <Reveal sx={{ height: "100%" }}>
            <Markets coin={coin} markets={markets} />
          </Reveal>
        </Grid>
        <Grid item xs={12} md={5}>
          <Reveal delay={100} sx={{ height: "100%" }}>
            <Facts profile={profile} chain={chain} />
          </Reveal>
        </Grid>

        <Grid item xs={12}>
          <Reveal>
            <CoinNews coin={coin} headlines={coinHeadlines} headlinesLoading={headlinesLoading} />
          </Reveal>
        </Grid>
      </Grid>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={2600}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Container>
  );
}

export default CoinPage;
