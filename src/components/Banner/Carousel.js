import React, { useMemo } from "react";
import { Box, Typography } from "@mui/material";
import AliceCarousel from "react-alice-carousel";
import "react-alice-carousel/lib/alice-carousel.css";
import { Link } from "react-router-dom";
import { CryptoState } from "../../CryptoContext";
import { numberWithCommas, formatPercent } from "../../utils/formatters";
import CoinImage from "../CoinImage";

function Carousel() {
  const { coins, symbol } = CryptoState();

  const movers = useMemo(
    () =>
      [...coins]
        .sort(
          (a, b) =>
            Math.abs(b.price_change_percentage_24h || 0) -
            Math.abs(a.price_change_percentage_24h || 0)
        )
        .slice(0, 12),
    [coins]
  );

  if (!movers.length) return null;

  const items = movers.map((coin) => {
    const profit = coin.price_change_percentage_24h >= 0;

    return (
      <Link
        key={coin.id}
        to={`/coins/${coin.id}`}
        style={{ textDecoration: "none", color: "inherit" }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 0.5,
            p: 1.5,
            borderRadius: 2,
            transition: "background 0.2s, transform 0.2s",
            "&:hover": {
              bgcolor: "rgba(238, 188, 29, 0.08)",
              transform: "translateY(-4px)",
            },
          }}
        >
          <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={48} />
          <Typography variant="subtitle2" fontWeight={700} textTransform="uppercase">
            {coin.symbol}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {symbol}
            {numberWithCommas(coin.current_price)}
          </Typography>
          <Typography
            variant="caption"
            fontWeight={600}
            sx={{ color: profit ? "secondary.main" : "error.main" }}
          >
            {formatPercent(coin.price_change_percentage_24h)}
          </Typography>
        </Box>
      </Link>
    );
  });

  return (
    <Box sx={{ "& .alice-carousel__stage-item": { padding: "0 8px" } }}>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", textAlign: "center", mb: 1, letterSpacing: 2 }}
      >
        Biggest movers
      </Typography>
      <AliceCarousel
        mouseTracking
        infinite
        autoPlay
        autoPlayInterval={2500}
        animationDuration={800}
        disableDotsControls
        disableButtonsControls
        responsive={{ 0: { items: 2 }, 600: { items: 4 }, 900: { items: 6 } }}
        items={items}
      />
    </Box>
  );
}

export default Carousel;
