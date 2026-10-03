import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";
import { Link } from "react-router-dom";
import BoltIcon from "@mui/icons-material/Bolt";
import { CryptoState } from "../../CryptoContext";
import { formatPrice } from "../../utils/formatters";
import CoinImage from "../CoinImage";
import { ChangePill } from "../ui";

function Carousel() {
  const { coins, symbol } = CryptoState();

  const movers = useMemo(
    () =>
      [...coins]
        .sort((a, b) => Math.abs(b.price_change_percentage_24h || 0) - Math.abs(a.price_change_percentage_24h || 0))
        .slice(0, 12),
    [coins]
  );

  if (!movers.length) return null;

  const items = movers.map((coin) => (
    <Box
      key={coin.id}
      component={Link}
      to={`/coins/${coin.id}`}
      draggable={false}
      className="lift"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        p: 1.5,
        mx: 0.75,
        my: 1,
        borderRadius: "16px",
        border: "1px solid rgba(148, 163, 184, 0.11)",
        background: "linear-gradient(180deg, rgba(23, 31, 52, 0.7), rgba(12, 17, 31, 0.7))",
      }}
    >
      <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={40} />
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="subtitle2" fontWeight={700} noWrap>
          {coin.symbol}
          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
            #{coin.market_cap_rank}
          </Typography>
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap component="div">
          {formatPrice(coin.current_price, symbol)}
        </Typography>
        <ChangePill value={coin.price_change_percentage_24h} sx={{ fontSize: 12, mt: 0.25 }} />
      </Box>
    </Box>
  ));

  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}
      >
        <BoltIcon sx={{ fontSize: 18, color: "primary.main" }} /> Biggest movers · 24h
      </Typography>
      <AliceCarousel
        mouseTracking
        infinite
        autoPlay
        autoPlayInterval={2600}
        animationDuration={900}
        disableDotsControls
        disableButtonsControls
        responsive={{ 0: { items: 2 }, 600: { items: 3 }, 900: { items: 5 }, 1200: { items: 6 } }}
        items={items}
      />
    </Box>
  );
}

export default Carousel;
