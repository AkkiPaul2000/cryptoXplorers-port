import React, { useState } from "react";
import { Box, Chip, Paper, Skeleton, Tab, Tabs, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAbortableEffect } from "../hooks/useAbortable";
import api from "../api/client";
import { CoinEvents, CoinTwitter } from "../config/api";
import { safeUrl, timeAgo } from "../utils/formatters";
import { ToneChip, UpcomingChip } from "./NewsCard";

const TYPES = [
  { value: "all", label: "All" },
  { value: "news", label: "News", chip: "News", color: "info" },
  { value: "event", label: "Events", chip: "Event", color: "primary" },
  { value: "social", label: "Social", chip: "Social", color: "secondary" },
];

// Headlines come pre-filtered and tone-tagged from the page. Events and social posts are
// fetched only when their tab opens: they're mostly old, and CoinPaprika's free plan allows
// just 60 requests an hour.
function CoinNews({ coin, headlines = [], headlinesLoading = false }) {
  const [extras, setExtras] = useState(null);
  const [type, setType] = useState("all");
  const wantExtras = type === "event" || type === "social" || extras !== null;

  useAbortableEffect(
    (signal, isAlive) => {
      if (!wantExtras) return;
      Promise.all([
        api.get(CoinEvents(coin.id), { signal, silent: true, cacheKey: `events-${coin.id}`, cacheTtl: 3600000 }).catch(() => ({ data: [] })),
        api.get(CoinTwitter(coin.id), { signal, silent: true, cacheKey: `social-${coin.id}`, cacheTtl: 3600000 }).catch(() => ({ data: [] })),
      ]).then(([eventsRes, twitterRes]) => {
        if (!isAlive()) return;
        const events = (Array.isArray(eventsRes.data) ? eventsRes.data : []).slice(0, 4).map((row) => ({
          id: `event-${row.id}`,
          title: row.name,
          summary: row.description,
          link: row.link,
          date: row.date,
          type: "event",
        }));
        const social = (Array.isArray(twitterRes.data) ? twitterRes.data : []).slice(0, 3).map((row) => ({
          id: `social-${row.status_link}`,
          title: row.user_name ? `@${row.user_name}` : "Update",
          summary: row.status,
          link: row.status_link,
          date: row.date,
          type: "social",
        }));
        setExtras([...events, ...social]);
      });
    },
    [coin.id, wantExtras]
  );

  const loading = headlinesLoading || (wantExtras && !extras);
  const items = [
    ...headlines.slice(0, 10).map((row) => ({ id: `news-${row.link}`, ...row, type: "news" })),
    ...(extras || []),
  ]
    .filter((row) => row.title)
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const counts = items.reduce((acc, item) => ({ ...acc, [item.type]: (acc[item.type] || 0) + 1 }), {});
  const visible = items.filter((item) => type === "all" || item.type === type).slice(0, 8);

  return (
    <Paper variant="glass" sx={{ p: 2.5 }}>
      <Typography variant="h6">News & events for {coin.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Headlines and milestones that may explain recent price action, tagged by tone.
      </Typography>
      <Tabs
        value={type}
        onChange={(_, next) => setType(next)}
        variant="scrollable"
        scrollButtons={false}
        sx={{ mb: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
      >
        {TYPES.map((item) => {
          const count = item.value === "all" ? items.length : counts[item.value] || 0;
          const known = !loading && (item.value === "news" || extras !== null);
          return <Tab key={item.value} value={item.value} label={`${item.label}${known ? ` (${count})` : ""}`} />;
        })}
      </Tabs>

      {loading && (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {[...Array(4)].map((_, index) => (
            <Box key={index}>
              <Skeleton width="30%" />
              <Skeleton />
              <Skeleton width="70%" />
            </Box>
          ))}
        </Box>
      )}

      {!loading && !visible.length && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
          Nothing recent here. Major assets like BTC or ETH usually have more coverage.
        </Typography>
      )}

      {!loading && (
        <Box key={type} sx={{ display: "grid", columnGap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {visible.map((item, index) => {
            const meta = TYPES.find((entry) => entry.value === item.type);
            const url = safeUrl(item.link);
            return (
              <Box
                key={item.id}
                component={url ? "a" : "div"}
                href={url ? url.href : undefined}
                target={url ? "_blank" : undefined}
                rel={url ? "noopener noreferrer" : undefined}
                className="row-in"
                sx={{
                  display: "block",
                  p: 1.5,
                  mx: -1.5,
                  borderRadius: "14px",
                  animationDelay: `${index * 50}ms`,
                  transition: "background-color 0.2s",
                  "&:hover": { bgcolor: "rgba(148,163,184,0.07)" },
                  "&:hover .news-open": { opacity: 1, transform: "none" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.75, flexWrap: "wrap" }}>
                  <Chip label={meta.chip} size="small" color={meta.color} variant="outlined" sx={{ height: 22, fontSize: 11 }} />
                  {item.type === "news" && <ToneChip tone={item.tone} />}
                  {item.upcoming && <UpcomingChip />}
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {[timeAgo(item.date), url?.hostname.replace(/^www\./, "")].filter(Boolean).join(" · ")}
                  </Typography>
                  {url && (
                    <OpenInNewIcon
                      className="news-open"
                      sx={{ fontSize: 15, ml: "auto", color: "primary.main", opacity: 0, transform: "translateX(-4px)", transition: "all 0.2s" }}
                    />
                  )}
                </Box>
                <Typography fontWeight={700} sx={{ lineHeight: 1.45 }}>
                  {item.title}
                </Typography>
                {item.summary && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5, lineHeight: 1.6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
                  >
                    {item.summary}
                  </Typography>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Paper>
  );
}

export default React.memo(CoinNews);
