import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Chip,
  Container,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "../api/client";
import {
  BinanceDepth,
  BitcoinStats,
  CoinMarkets,
  CoinProfile,
  SingleTicker,
  TodayOhlc,
} from "../config/api";
import { CryptoState } from "../CryptoContext";
import CoinInfo from "../components/CoinInfo";
import CoinNews from "../components/CoinNews";
import RiskMeter from "../components/RiskMeter";
import {
  formatMarketCap,
  formatPercent,
  numberWithCommas,
  stripHtml,
} from "../utils/formatters";
import { mapTicker, walkBook } from "../utils/market";
import { coinRiskScore } from "../utils/risk";
import { useAbortableEffect } from "../hooks/useAbortable";
import CoinImage from "../components/CoinImage";

function StatItem({ label, value, hint }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={800} sx={{ mt: 0.5 }}>
        {value}
      </Typography>
      {hint && (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      )}
    </Paper>
  );
}

function CoinPage() {
  const { id } = useParams();
  const [coin, setCoin] = useState(null);
  const [profile, setProfile] = useState(null);
  const [markets, setMarkets] = useState([]);
  const [book, setBook] = useState(null);
  const [chain, setChain] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const { currency, symbol } = CryptoState();

  useAbortableEffect((signal, isAlive) => {
    const load = async () => {
      setLoading(true);
      setFailed(false);
      try {
        const [tickerRes, profileRes, marketRes, ohlcRes] = await Promise.all([
          api.get(SingleTicker(id), { signal, cacheKey: `ticker-${id}`, cacheTtl: 30000 }),
          api.get(CoinProfile(id), { signal, cacheKey: `profile-${id}`, cacheTtl: 300000 }),
          api.get(CoinMarkets(id), { signal, silent: true }).catch(() => ({ data: [] })),
          api.get(TodayOhlc(id), { signal, silent: true }).catch(() => ({ data: [] })),
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
          (marketRes.data || [])
            .filter((row) => !row.outlier)
            .sort((a, b) => (b.quotes?.USD?.volume_24h || 0) - (a.quotes?.USD?.volume_24h || 0))
            .slice(0, 8)
        );

        if (id === "btc-bitcoin") {
          api.get(BitcoinStats(), { signal, silent: true })
            .then((stats) => isAlive() && setChain(stats?.data || null))
            .catch(() => isAlive() && setChain(null));
        } else {
          setChain(null);
        }

        api.get(BinanceDepth(tickerRes.data.symbol), { signal, silent: true })
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
        setFailed(true);
      } finally {
        if (isAlive()) setLoading(false);
      }
    };
    load();
  }, [id, currency]);

  if (failed) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Alert severity="warning">This coin could not be loaded. Refresh and try again.</Alert>
      </Container>
    );
  }

  if (loading || !coin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton width={160} height={28} sx={{ mb: 3 }} />
        <Skeleton variant="rounded" height={120} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={360} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={220} />
      </Container>
    );
  }

  const description = stripHtml(profile?.description || "").split(". ").slice(0, 2).join(". ");
  const risk = coinRiskScore(coin);
  const periods = [
    ["24h", coin.price_change_percentage_24h],
    ["7d", coin.price_change_percentage_7d_in_currency],
    ["30d", coin.price_change_percentage_30d],
    ["1y", coin.price_change_percentage_1y],
  ].filter(([, value]) => value);
  const supplyUsed =
    coin.max_supply && coin.circulating_supply
      ? `${((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}% of max`
      : null;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }} className="page-fade">
      <Typography
        component={Link}
        to="/"
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.5,
          color: "text.secondary",
          mb: 3,
          "&:hover": { color: "primary.main" },
        }}
      >
        <ArrowBackIcon fontSize="small" />
        Back to screener
      </Typography>

      <Box className="rise-in" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 2, mb: 3 }}>
        <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={72} />
        <Box sx={{ flex: 1, minWidth: 220 }}>
          <Typography variant="h3" fontWeight={800}>{coin.name}</Typography>
          <Typography color="text.secondary" textTransform="uppercase">
            {coin.symbol} · Rank #{coin.market_cap_rank}
            {profile?.type ? ` · ${profile.type}` : ""}
          </Typography>
        </Box>
        <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
          <Typography variant="h3" fontWeight={800}>
            {symbol} {numberWithCommas(coin.current_price)}
          </Typography>
          <Typography
            fontWeight={800}
            sx={{ color: coin.price_change_percentage_24h >= 0 ? "secondary.main" : "error.main" }}
          >
            {formatPercent(coin.price_change_percentage_24h)} today
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
        {periods.map(([label, value]) => (
          <Chip
            key={label}
            label={`${label} ${formatPercent(value)}`}
            sx={{
              fontWeight: 700,
              color: value >= 0 ? "secondary.main" : "error.main",
              bgcolor: value >= 0 ? "rgba(14,203,129,0.12)" : "rgba(246,70,93,0.12)",
            }}
          />
        ))}
        {coin.beta != null && <Chip label={`Beta ${Number(coin.beta).toFixed(2)}`} />}
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={5}>
          <RiskMeter score={risk} title="Speculation risk" />
        </Grid>
        <Grid item xs={12} md={7}>
          <Grid container spacing={1.5}>
            <Grid item xs={6} sm={4}>
              <StatItem label="Market cap" value={formatMarketCap(coin.market_cap, symbol)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatItem label="24h volume" value={formatMarketCap(coin.total_volume, symbol)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatItem
                label="Vol / MCap"
                value={
                  coin.market_cap
                    ? `${((coin.total_volume / coin.market_cap) * 100).toFixed(2)}%`
                    : "—"
                }
                hint="Turnover"
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatItem label="From ATH" value={formatPercent(coin.ath_change)} />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatItem
                label="Supply"
                value={coin.circulating_supply ? `${(coin.circulating_supply / 1e6).toFixed(2)}M` : "—"}
                hint={supplyUsed}
              />
            </Grid>
            <Grid item xs={6} sm={4}>
              <StatItem
                label="Book ±2%"
                value={book?.up ? formatMarketCap(book.up, "$") : "—"}
                hint={book?.down ? `Down ${formatMarketCap(book.down, "$")}` : "Binance USDT book"}
              />
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <CoinInfo coin={coin} />
      <CoinNews coin={coin} />

      {description && (
        <Typography color="text.secondary" sx={{ px: { md: 4 }, mb: 3, lineHeight: 1.8 }}>
          {description}.
        </Typography>
      )}

      <Grid container spacing={2} sx={{ px: { md: 1 }, pb: 6 }}>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider" }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Top exchanges</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {["Exchange", "Pair", "Price", "Volume", "Share", "Trust"].map((head) => (
                    <TableCell key={head} sx={{ color: "primary.main", fontWeight: 700 }}>
                      {head}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {markets.map((market) => (
                  <TableRow key={`${market.exchange_id}-${market.pair}`}>
                    <TableCell>{market.exchange_name}</TableCell>
                    <TableCell>{market.pair}</TableCell>
                    <TableCell>${numberWithCommas(market.quotes?.USD?.price)}</TableCell>
                    <TableCell>{formatMarketCap(market.quotes?.USD?.volume_24h, "$")}</TableCell>
                    <TableCell>{Number(market.adjusted_volume_24h_share || 0).toFixed(2)}%</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{market.trust_score || "—"}</TableCell>
                  </TableRow>
                ))}
                {!markets.length && (
                  <TableRow>
                    <TableCell colSpan={6}>Exchange books are unavailable for this coin.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2.5, border: "1px solid", borderColor: "divider", height: "100%" }}>
            <Typography variant="h6" fontWeight={800} gutterBottom>Activity</Typography>
            <Grid container spacing={1.5}>
              <Grid item xs={6}>
                <StatItem label="Open source" value={profile?.open_source ? "Yes" : "No"} />
              </Grid>
              <Grid item xs={6}>
                <StatItem label="Proof" value={profile?.proof_type || "—"} />
              </Grid>
              <Grid item xs={6}>
                <StatItem label="Started" value={profile?.started_at?.slice(0, 4) || "—"} />
              </Grid>
              <Grid item xs={6}>
                <StatItem label="Development" value={profile?.development_status || "—"} />
              </Grid>
              {chain && (
                <>
                  <Grid item xs={6}>
                    <StatItem label="BTC tx (24h)" value={Number(chain.n_tx || 0).toLocaleString()} />
                  </Grid>
                  <Grid item xs={6}>
                    <StatItem
                      label="Hash rate"
                      value={`${(Number(chain.hash_rate || 0) / 1e9).toFixed(1)} EH/s`}
                    />
                  </Grid>
                </>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default CoinPage;
