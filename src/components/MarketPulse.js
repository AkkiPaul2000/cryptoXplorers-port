import React, { memo, useMemo } from "react";
import { Box, Grid, Paper, Skeleton, Typography } from "@mui/material";
import WhatshotIcon from "@mui/icons-material/Whatshot";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import { useNavigate } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { tokens } from "../theme/theme";
import { formatMarketCap, formatPrice } from "../utils/formatters";
import Bubbles from "./Bubbles";
import CoinImage from "./CoinImage";
import { ChangePill, IconBadge, Reveal, SectionTitle } from "./ui";

const change = (coin) => coin.price_change_percentage_24h || 0;

const MOVERS = [
  {
    title: "Top gainers · 24h",
    icon: <WhatshotIcon />,
    color: tokens.up,
    pick: (list) => [...list].sort((a, b) => change(b) - change(a)),
  },
  {
    title: "Top losers · 24h",
    icon: <TrendingDownIcon />,
    color: tokens.down,
    pick: (list) => [...list].sort((a, b) => change(a) - change(b)),
  },
  {
    title: "Most traded · 24h",
    icon: <WaterDropIcon />,
    color: tokens.cyan,
    volume: true,
    pick: (list) => [...list].sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0)),
  },
];

function MoverList({ title, icon, color, volume, pick, coins, symbol }) {
  const navigate = useNavigate();
  const rows = useMemo(() => pick(coins).slice(0, 5), [pick, coins]);

  return (
    <Paper variant="glass" sx={{ p: 2, height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1, px: 0.5 }}>
        <IconBadge color={color} size={30}>
          {icon}
        </IconBadge>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Box>
      {rows.map((coin, index) => (
        <Box
          key={coin.id}
          className="row-in"
          onClick={() => navigate(`/coins/${coin.id}`)}
          role="link"
          tabIndex={0}
          onKeyDown={(event) => event.key === "Enter" && navigate(`/coins/${coin.id}`)}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            px: 1,
            py: 1,
            borderRadius: "12px",
            cursor: "pointer",
            animationDelay: `${index * 45}ms`,
            transition: "background-color 0.2s",
            "&:hover": { bgcolor: "rgba(148,163,184,0.07)" },
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ width: 14 }}>
            {index + 1}
          </Typography>
          <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={28} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {coin.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {coin.symbol} · {formatPrice(coin.current_price, symbol)}
            </Typography>
          </Box>
          {volume ? (
            <Typography variant="body2" fontWeight={700}>
              {formatMarketCap(coin.total_volume, symbol)}
            </Typography>
          ) : (
            <ChangePill value={coin.price_change_percentage_24h} sx={{ fontSize: 12.5 }} />
          )}
        </Box>
      ))}
    </Paper>
  );
}

function MarketPulse() {
  const { coins, symbol, loading } = CryptoState();
  const empty = loading && !coins.length;

  return (
    <Box component="section" id="pulse" sx={{ pt: { xs: 6, md: 8 } }}>
      <Reveal>
        <SectionTitle
          eyebrow="Market pulse"
          title="Who's moving the market"
          subtitle="Each bubble is a coin: its size shows market cap, its color the direction of the move and its glow how strong the move is. Hover for details, click to open a coin."
        />
      </Reveal>
      <Reveal>
        {empty ? <Skeleton variant="rounded" height={560} sx={{ borderRadius: "18px" }} /> : <Bubbles coins={coins} symbol={symbol} />}
      </Reveal>
      <Grid container spacing={2.5} sx={{ mt: 0 }}>
        {MOVERS.map((mover, index) => (
          <Grid item xs={12} md={4} key={mover.title}>
            <Reveal delay={index * 90} sx={{ height: "100%" }}>
              {empty ? (
                <Skeleton variant="rounded" height={330} sx={{ borderRadius: "18px" }} />
              ) : (
                <MoverList {...mover} coins={coins} symbol={symbol} />
              )}
            </Reveal>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default memo(MarketPulse);
