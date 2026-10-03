import React from "react";
import { Box, Container, Divider, Fab, Grid, Link as MuiLink, Typography, Zoom, useScrollTrigger } from "@mui/material";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import { Link } from "react-router-dom";
import Logo from "./Logo";

const SOURCES = [
  ["CoinPaprika", "https://coinpaprika.com", "Prices, profiles, markets"],
  ["Binance", "https://www.binance.com", "Charts & order books"],
  ["Alternative.me", "https://alternative.me/crypto/fear-and-greed-index/", "Fear & Greed index"],
  ["Blockchain.com", "https://www.blockchain.com/explorer", "Bitcoin network stats"],
  ["CoinDesk · Cointelegraph", "https://www.coindesk.com", "Headlines"],
];

const SECTIONS = [
  ["News & signals", "/news"],
  ["Coin of the day", "/#spotlight"],
  ["Market overview", "/#overview"],
  ["Heatmap & movers", "/#pulse"],
  ["Coin screener", "/#screener"],
];

function BackToTop() {
  const show = useScrollTrigger({ disableHysteresis: true, threshold: 700 });
  return (
    <Zoom in={show}>
      <Fab
        size="medium"
        color="primary"
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        sx={{ position: "fixed", right: { xs: 16, md: 28 }, bottom: { xs: 16, md: 28 }, zIndex: 1200 }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Zoom>
  );
}

function Footer() {
  return (
    <Box component="footer" sx={{ borderTop: "1px solid", borderColor: "divider", bgcolor: "rgba(6, 9, 18, 0.6)", mt: 4 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={5}>
            <Logo />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2, maxWidth: 360, lineHeight: 1.8 }}>
              Real-time market intelligence for the top 100 cryptocurrencies — prices, sentiment, liquidity, and
              news in one place.
            </Typography>
            <Typography variant="body2" sx={{ mt: 1.5, maxWidth: 360, color: "primary.main", fontWeight: 600 }}>
              Our motto: make it easy for crypto investors to spot the next move and buy coins safely and profitably.
            </Typography>
          </Grid>
          <Grid item xs={12} sm={5} md={3}>
            <Typography variant="overline" color="text.secondary">
              Explore
            </Typography>
            {SECTIONS.map(([label, to]) => (
              <Typography
                key={to}
                component={Link}
                to={to}
                variant="body2"
                sx={{ display: "block", py: 0.6, color: "text.primary", "&:hover": { color: "primary.main" } }}
              >
                {label}
              </Typography>
            ))}
          </Grid>
          <Grid item xs={12} sm={7} md={4}>
            <Typography variant="overline" color="text.secondary">
              Data sources
            </Typography>
            {SOURCES.map(([name, href, note]) => (
              <Box key={name} sx={{ py: 0.6, display: "flex", justifyContent: "space-between", gap: 2 }}>
                <MuiLink href={href} target="_blank" rel="noopener noreferrer" underline="hover" variant="body2" color="text.primary">
                  {name}
                </MuiLink>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: "right" }}>
                  {note}
                </Typography>
              </Box>
            ))}
          </Grid>
        </Grid>
        <Divider sx={{ my: 4 }} />
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1 }}>
          <Typography variant="caption" color="text.secondary">
            © {new Date().getFullYear()} CryptoXplorers. Market data may be delayed.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Not financial advice — risk scores are heuristics, not predictions.
          </Typography>
        </Box>
      </Container>
      <BackToTop />
    </Box>
  );
}

export default Footer;
