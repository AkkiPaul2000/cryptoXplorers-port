import React, { memo, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { coinLogoSources, placeholderCoinIcon } from "../utils/market";

function CoinImage({ symbol, name = "", size = 32, src }) {
  const sources = useMemo(() => {
    const chain = src ? [src, ...coinLogoSources(symbol).slice(1)] : coinLogoSources(symbol);
    const last = chain[chain.length - 1];
    return last.startsWith("data:") ? chain : [...chain, placeholderCoinIcon(symbol)];
  }, [src, symbol]);

  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setIndex(0);
    setBroken(false);
  }, [symbol, src]);

  const label = String(symbol || "?").slice(0, 3).toUpperCase();

  if (broken || index >= sources.length) {
    return (
      <Box
        aria-label={name || symbol}
        sx={{
          width: size,
          height: size,
          borderRadius: size > 40 ? 2 : 1.5,
          bgcolor: "#14161a",
          border: "1px solid rgba(238, 188, 29, 0.45)",
          display: "grid",
          placeItems: "center",
          color: "primary.main",
          fontWeight: 800,
          fontSize: Math.max(10, size * 0.28),
          letterSpacing: "0.04em",
          flexShrink: 0,
        }}
      >
        {label}
      </Box>
    );
  }

  return (
    <img
      src={sources[index]}
      alt={name || symbol || "coin"}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (index < sources.length - 1) {
          setIndex((current) => current + 1);
        } else {
          setBroken(true);
        }
      }}
      style={{
        width: size,
        height: size,
        borderRadius: size > 40 ? 8 : 6,
        objectFit: "cover",
        flexShrink: 0,
        background: "#14161a",
      }}
    />
  );
}

export default memo(CoinImage);
