import React, { useMemo } from "react";
import {
  Box,
  Chip,
  Link,
  Paper,
  Skeleton,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useAbortableEffect } from "../hooks/useAbortable";
import api from "../api/client";
import { CoinEvents, CoinTwitter, RssCoinDesk, RssCoinTelegraph } from "../config/api";
import { filterNews, parseRss } from "../utils/rss";

function toneFor(item) {
  if (item.type === "event") return { label: "Event", color: "primary" };
  if (item.type === "social") return { label: "Social", color: "secondary" };
  return { label: "News", color: "default" };
}

function formatWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function CoinNews({ coin }) {
  const [items, setItems] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  useAbortableEffect((signal, isAlive) => {
    const load = async () => {
      setLoading(true);
      try {
        const [eventsRes, twitterRes, rssA, rssB] = await Promise.all([
          api.get(CoinEvents(coin.id), { signal, silent: true }).catch(() => ({ data: [] })),
          api.get(CoinTwitter(coin.id), { signal, silent: true }).catch(() => ({ data: [] })),
          api.get(RssCoinTelegraph(), { signal, silent: true, responseType: "text" }).catch(() => ({ data: "" })),
          api.get(RssCoinDesk(), { signal, silent: true, responseType: "text" }).catch(() => ({ data: "" })),
        ]);
        if (!isAlive()) return;

        const events = (eventsRes.data || []).slice(0, 4).map((row) => ({
          id: row.id,
          title: row.name,
          summary: row.description,
          link: row.link,
          date: row.date,
          type: "event",
        }));

        const social = (twitterRes.data || [])
          .slice(0, 3)
          .map((row) => ({
            id: row.status_link,
            title: row.user_name ? `@${row.user_name}` : "Update",
            summary: row.status,
            link: row.status_link,
            date: row.date,
            type: "social",
          }));

        const rssItems = [
          ...parseRss(rssA.data || ""),
          ...parseRss(rssB.data || ""),
        ];
        const news = filterNews(rssItems, coin)
          .slice(0, 6)
          .map((row) => ({
            id: row.link,
            title: row.title,
            summary: row.summary,
            link: row.link,
            date: row.date,
            type: "news",
          }));

        const merged = [...news, ...events, ...social]
          .filter((row) => row.title)
          .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          .slice(0, 8);

        setItems(merged);
      } catch {
        if (isAlive()) setItems([]);
      } finally {
        if (isAlive()) setLoading(false);
      }
    };
    load();
  }, [coin.id, coin.symbol, coin.name]);

  const hasItems = items.length > 0;

  const content = useMemo(() => {
    if (loading) {
      return [...Array(4)].map((_, index) => (
        <Box key={index} sx={{ py: 1.5 }}>
          <Skeleton width="30%" />
          <Skeleton />
          <Skeleton width="70%" />
        </Box>
      ));
    }
    if (!hasItems) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
          No recent headlines matched this coin. Try a major asset like BTC or ETH.
        </Typography>
      );
    }
    return items.map((item) => {
      const tone = toneFor(item);
      return (
        <Box
          key={item.id}
          sx={{
            py: 1.75,
            borderBottom: "1px solid",
            borderColor: "divider",
            "&:last-child": { borderBottom: 0 },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
            <Chip label={tone.label} size="small" color={tone.color} variant="outlined" />
            <Typography variant="caption" color="text.secondary">
              {formatWhen(item.date)}
            </Typography>
          </Box>
          <Typography fontWeight={700} sx={{ mb: 0.5, lineHeight: 1.4 }}>
            {item.title}
          </Typography>
          {item.summary && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1, lineHeight: 1.6 }}>
              {item.summary.slice(0, 180)}
              {item.summary.length > 180 ? "…" : ""}
            </Typography>
          )}
          {item.link && (
            <Link
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Read more <OpenInNewIcon sx={{ fontSize: 14 }} />
            </Link>
          )}
        </Box>
      );
    });
  }, [hasItems, items, loading]);

  return (
    <Paper
      elevation={0}
      className="rise-in"
      sx={{ p: 2.5, border: "1px solid", borderColor: "divider", mb: 3 }}
    >
      <Typography variant="h6" fontWeight={800} gutterBottom>
        News & Events
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Headlines and milestones that may explain recent price action.
      </Typography>
      {content}
    </Paper>
  );
}

export default React.memo(CoinNews);
