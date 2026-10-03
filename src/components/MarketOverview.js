import React, { memo, useState } from "react";
import { Box, Grid, LinearProgress, Paper, Typography } from "@mui/material";
import PublicIcon from "@mui/icons-material/Public";
import BarChartIcon from "@mui/icons-material/BarChart";
import CurrencyBitcoinIcon from "@mui/icons-material/CurrencyBitcoin";
import TokenIcon from "@mui/icons-material/Token";
import api from "../api/client";
import { GlobalData } from "../config/api";
import { useAbortableEffect } from "../hooks/useAbortable";
import { tokens } from "../theme/theme";
import { formatDate, formatMarketCap } from "../utils/formatters";
import FearGreed from "./FearGreed";
import { AnimatedNumber, ChangePill, IconBadge, InfoTip, Reveal, TimeAgo } from "./ui";

function StatCard({ icon, color, label, info, value, change, children }) {
  const [what, read] = info || [];
  return (
    <Paper variant="glass" className="lift" sx={{ p: 2.5, height: "100%", overflow: "hidden" }}>
      <Box
        aria-hidden="true"
        sx={{
          position: "absolute",
          top: -60,
          right: -60,
          width: 160,
          height: 160,
          borderRadius: "50%",
          pointerEvents: "none",
          background: `radial-gradient(circle, ${color}22, transparent 70%)`,
        }}
      />
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 2 }}>
        <IconBadge color={color}>{icon}</IconBadge>
        <Typography variant="overline" color="text.secondary" sx={{ flex: 1, lineHeight: 1.3 }}>
          {label}
        </Typography>
        {info && (
          <InfoTip
            heading={label}
            title={
              <>
                {what}
                <Box component="span" sx={{ display: "block", mt: 1, color: "text.secondary" }}>
                  <b>How to read it:</b> {read}
                </Box>
              </>
            }
          />
        )}
      </Box>
      <Box sx={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 1.25 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: "1.7rem", md: "1.9rem" } }}>
          {value}
        </Typography>
        {change !== undefined && <ChangePill value={change} sx={{ fontSize: 13 }} />}
      </Box>
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </Paper>
  );
}

function Caption({ left, right }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mt: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {left}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
        {right}
      </Typography>
    </Box>
  );
}

function MarketOverview() {
  const [global, setGlobal] = useState(null);

  useAbortableEffect((signal, isAlive) => {
    api
      .get(GlobalData(), { signal, cacheKey: "global-market", cacheTtl: 600000 })
      .then(({ data }) => isAlive() && setGlobal(data))
      .catch(() => isAlive() && setGlobal(null));
  }, []);

  const marketCap = global?.market_cap_usd;
  const volume = global?.volume_24h_usd;
  const dominance = global?.bitcoin_dominance_percentage;
  const athShare = marketCap && global?.market_cap_ath_value ? (marketCap / global.market_cap_ath_value) * 100 : null;
  const turnover = marketCap && volume ? (volume / marketCap) * 100 : null;
  const money = (value) => formatMarketCap(value, "$");

  return (
    <Grid container spacing={2.5}>
      <Grid item xs={12} md={4}>
        <Reveal sx={{ height: "100%" }}>
          <FearGreed />
        </Reveal>
      </Grid>
      <Grid item xs={12} md={8}>
        <Grid container spacing={2.5} sx={{ height: { md: "calc(100% + 20px)" } }}>
          <Grid item xs={12} sm={6}>
            <Reveal delay={60} sx={{ height: "100%" }}>
              <StatCard
                icon={<PublicIcon />}
                color={tokens.gold}
                label="Total market cap"
                info={[
                  "Combined value of every tracked cryptocurrency, in USD.",
                  "Rising market cap together with rising volume confirms buyers are in control; the ATH bar shows how much room the market has recovered.",
                ]}
                value={<AnimatedNumber value={marketCap} format={money} />}
                change={global?.market_cap_change_24h}
              >
                <LinearProgress variant="determinate" value={athShare || 0} />
                <Caption
                  left={athShare ? `${athShare.toFixed(1)}% of all-time high` : "—"}
                  right={
                    global?.market_cap_ath_value &&
                    `ATH ${money(global.market_cap_ath_value)} · ${formatDate(global.market_cap_ath_date, {
                      month: "short",
                      year: "numeric",
                    })}`
                  }
                />
              </StatCard>
            </Reveal>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Reveal delay={120} sx={{ height: "100%" }}>
              <StatCard
                icon={<BarChartIcon />}
                color={tokens.cyan}
                label="24h trading volume"
                info={[
                  "Value traded across all exchanges in the last 24 hours, compared with the 24 hours before.",
                  "Price moves on high turnover are more reliable; moves on thin volume reverse more easily.",
                ]}
                value={<AnimatedNumber value={volume} format={money} />}
                change={global?.volume_24h_change_24h}
              >
                <LinearProgress variant="determinate" color="info" value={Math.min(100, (turnover || 0) * 5)} />
                <Caption
                  left={turnover ? `Turnover ${turnover.toFixed(2)}% of market cap` : "—"}
                  right="20% = full bar"
                />
              </StatCard>
            </Reveal>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Reveal delay={180} sx={{ height: "100%" }}>
              <StatCard
                icon={<CurrencyBitcoinIcon />}
                color={tokens.orange}
                label="Bitcoin dominance"
                info={[
                  "Bitcoin's share of the total crypto market cap.",
                  "Rising dominance usually means money is rotating into BTC for safety; falling dominance often marks an 'altcoin season'.",
                ]}
                value={<AnimatedNumber value={dominance} format={(v) => `${v.toFixed(1)}%`} />}
              >
                <Box sx={{ display: "flex", height: 8, borderRadius: 99, overflow: "hidden", bgcolor: "rgba(148,163,184,0.1)" }}>
                  <Box
                    className="grow-x"
                    sx={{ width: `${dominance || 0}%`, bgcolor: tokens.orange, transformOrigin: "left" }}
                  />
                  <Box
                    className="grow-x"
                    sx={{ flex: 1, bgcolor: tokens.violet, opacity: 0.8, transformOrigin: "right" }}
                  />
                </Box>
                <Caption
                  left={dominance ? `BTC ${dominance.toFixed(1)}%` : "—"}
                  right={dominance ? `Altcoins ${(100 - dominance).toFixed(1)}%` : ""}
                />
              </StatCard>
            </Reveal>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Reveal delay={240} sx={{ height: "100%" }}>
              <StatCard
                icon={<TokenIcon />}
                color={tokens.violet}
                label="Active cryptocurrencies"
                info={[
                  "Number of actively traded assets CoinPaprika tracks.",
                  "Most liquidity sits in the top 100, which is why this dashboard focuses there — smaller coins carry far more risk.",
                ]}
                value={<AnimatedNumber value={global?.cryptocurrencies_number} format={(v) => Math.round(v).toLocaleString()} />}
              >
                <Caption
                  left="Top 100 shown here"
                  right={global?.last_updated ? <TimeAgo date={global.last_updated * 1000} prefix="Updated " /> : ""}
                />
              </StatCard>
            </Reveal>
          </Grid>
        </Grid>
      </Grid>
    </Grid>
  );
}

export default memo(MarketOverview);
