import React, { useState } from "react";
import { Box, Chip, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import ScheduleIcon from "@mui/icons-material/Schedule";
import { Link } from "react-router-dom";
import { tokens } from "../theme/theme";
import { safeUrl, timeAgo } from "../utils/formatters";
import { TOPICS } from "../utils/rss";
import CoinImage from "./CoinImage";

export const TONES = {
  bullish: { label: "Bullish", color: tokens.up, icon: <TrendingUpIcon /> },
  bearish: { label: "Bearish", color: tokens.down, icon: <TrendingDownIcon /> },
  neutral: { label: "Neutral", color: tokens.muted, icon: <TrendingFlatIcon /> },
};

const topicLabel = (key) => TOPICS.find((topic) => topic.key === key)?.label;

export function ToneChip({ tone, size = "small" }) {
  const meta = TONES[tone] || TONES.neutral;
  return (
    <Chip
      size={size}
      icon={meta.icon}
      label={meta.label}
      sx={{
        height: 22,
        fontSize: 11,
        color: meta.color,
        bgcolor: alpha(meta.color, 0.12),
        border: `1px solid ${alpha(meta.color, 0.35)}`,
        "& .MuiChip-icon": { color: meta.color, fontSize: 15 },
      }}
    />
  );
}

export function UpcomingChip() {
  return (
    <Chip
      size="small"
      icon={<ScheduleIcon />}
      label="Upcoming"
      sx={{ height: 22, fontSize: 11, color: tokens.violet, bgcolor: alpha(tokens.violet, 0.14), "& .MuiChip-icon": { color: tokens.violet, fontSize: 14 } }}
    />
  );
}

function Thumb({ src, height }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return (
      <Box
        sx={{
          height,
          background: `linear-gradient(135deg, ${alpha(tokens.violet, 0.35)}, ${alpha(tokens.gold, 0.25)})`,
        }}
      />
    );
  }
  return (
    <Box
      component="img"
      src={src}
      alt=""
      loading="lazy"
      onError={() => setBroken(true)}
      sx={{ display: "block", width: "100%", height, objectFit: "cover", transition: "transform 0.6s cubic-bezier(.2,.7,.2,1)" }}
    />
  );
}

function CoinTags({ ids, coinsById }) {
  const list = (ids || []).map((id) => coinsById[id]).filter(Boolean).slice(0, 4);
  if (!list.length) return null;
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {list.map((coin) => (
        <Chip
          key={coin.id}
          component={Link}
          to={`/coins/${coin.id}`}
          clickable
          size="small"
          variant="outlined"
          avatar={
            <Box sx={{ display: "grid" }}>
              <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={18} />
            </Box>
          }
          label={coin.symbol}
          sx={{ height: 24, fontSize: 11.5, "& .MuiChip-avatar": { width: 18, height: 18, ml: 0.5 } }}
        />
      ))}
    </Box>
  );
}

const clamp = (lines) => ({ display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" });

function NewsCard({ item, coinsById = {}, compact = false }) {
  const url = safeUrl(item.link);
  const image = safeUrl(item.image)?.href;
  const meta = [item.source, timeAgo(item.date)].filter(Boolean).join(" · ");
  const linkProps = url ? { component: "a", href: url.href, target: "_blank", rel: "noopener noreferrer" } : {};

  if (compact) {
    return (
      <Box
        {...linkProps}
        sx={{
          display: "flex",
          gap: 1.5,
          p: 1,
          mx: -1,
          borderRadius: "14px",
          transition: "background-color 0.2s",
          "&:hover": { bgcolor: "rgba(148,163,184,0.07)" },
          "&:hover img": { transform: "scale(1.08)" },
        }}
      >
        <Box sx={{ width: 92, flexShrink: 0, borderRadius: "10px", overflow: "hidden" }}>
          <Thumb src={image} height={66} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.4, ...clamp(2) }}>
            {item.title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.75, flexWrap: "wrap" }}>
            <ToneChip tone={item.tone} />
            <Typography variant="caption" color="text.secondary">
              {meta}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Paper
      variant="glass"
      className="lift"
      sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column", "&:hover img": { transform: "scale(1.06)" } }}
    >
      <Box {...linkProps} sx={{ position: "relative", display: "block", overflow: "hidden" }}>
        <Thumb src={image} height={170} />
        <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(6,9,18,0.85))" }} />
        <Chip
          size="small"
          label={item.source}
          sx={{ position: "absolute", top: 10, left: 10, height: 22, fontSize: 11, bgcolor: "rgba(6,9,18,0.75)", backdropFilter: "blur(6px)" }}
        />
      </Box>
      <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 1.25, flex: 1 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
          <ToneChip tone={item.tone} />
          {item.upcoming && <UpcomingChip />}
          {item.topics?.slice(0, 2).map((key) => (
            <Chip key={key} size="small" variant="outlined" label={topicLabel(key)} sx={{ height: 22, fontSize: 11 }} />
          ))}
        </Box>
        <Typography
          {...linkProps}
          variant="subtitle1"
          fontWeight={700}
          sx={{ lineHeight: 1.4, color: "text.primary", "&:hover": { color: "primary.main" }, ...clamp(3) }}
        >
          {item.title}
        </Typography>
        {item.summary && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, ...clamp(3) }}>
            {item.summary}
          </Typography>
        )}
        <CoinTags ids={item.coins} coinsById={coinsById} />
        <Box sx={{ mt: "auto", pt: 0.5, display: "flex", alignItems: "center", gap: 1, color: "text.secondary" }}>
          <Typography variant="caption" sx={{ flex: 1 }} noWrap>
            {[meta, item.author].filter(Boolean).join(" · ")}
          </Typography>
          {url && <OpenInNewIcon sx={{ fontSize: 15 }} />}
        </Box>
      </Box>
    </Paper>
  );
}

export default NewsCard;
