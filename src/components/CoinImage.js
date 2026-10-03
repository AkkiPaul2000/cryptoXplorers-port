import React, { memo, useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import { coinLogoSources, placeholderCoinIcon } from "../utils/market";

function CoinImage({ symbol, name = "", size = 32, src }) {
  const sources = useMemo(() => {
    const chain = src ? [src, ...coinLogoSources(symbol)] : coinLogoSources(symbol);
    const last = chain[chain.length - 1];
    return last.startsWith("data:") ? chain : [...chain, placeholderCoinIcon(symbol)];
  }, [src, symbol]);

  const [index, setIndex] = useState(0);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setIndex(0);
    setBroken(false);
    setLoaded(false);
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
          bgcolor: "background.paper",
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
      onLoad={() => setLoaded(true)}
      onError={() => {
        setLoaded(false);
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
        objectFit: "contain",
        flexShrink: 0,
        // Once loaded, a light disc behind the logo keeps dark glyphs (XRP, ETH…) legible on the
        // dark theme (round logos cover it); while loading, a dim disc acts as the placeholder.
        background: sources[index].startsWith("data:")
          ? "transparent"
          : `radial-gradient(circle closest-side, ${loaded ? "rgba(232,236,244,0.94)" : "rgba(148,163,184,0.16)"} 88%, transparent 91%)`,
      }}
    />
  );
}

export default memo(CoinImage);
