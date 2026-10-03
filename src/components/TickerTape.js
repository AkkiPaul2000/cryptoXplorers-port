import React, { memo } from "react";
import { Box, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { formatPrice } from "../utils/formatters";
import CoinImage from "./CoinImage";
import { ChangePill } from "./ui";

function TickerTape() {
  const { coins, symbol } = CryptoState();
  const top = coins.slice(0, 24);
  if (!top.length) return <Box sx={{ height: 40, borderBottom: "1px solid", borderColor: "divider" }} />;

  // The list is rendered twice so translateX(-50%) loops seamlessly.
  const items = [...top, ...top];

  return (
    <Box
      className="ticker"
      aria-label="Live prices"
      sx={{ borderBottom: "1px solid", borderColor: "divider", bgcolor: "rgba(6, 9, 18, 0.55)", position: "relative", zIndex: 1 }}
    >
      <Box className="ticker-track">
        {items.map((coin, index) => (
          <Box
            key={`${coin.id}-${index}`}
            component={Link}
            to={`/coins/${coin.id}`}
            aria-hidden={index >= top.length}
            tabIndex={index >= top.length ? -1 : 0}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              px: 2.25,
              height: 40,
              borderRight: "1px solid",
              borderColor: "divider",
              whiteSpace: "nowrap",
              transition: "background-color 0.2s",
              "&:hover": { bgcolor: "rgba(238, 188, 29, 0.06)" },
            }}
          >
            <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={18} />
            <Typography variant="caption" fontWeight={700}>
              {coin.symbol}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatPrice(coin.current_price, symbol)}
            </Typography>
            <ChangePill value={coin.price_change_percentage_24h} soft={false} sx={{ fontSize: 12 }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

export default memo(TickerTape);
