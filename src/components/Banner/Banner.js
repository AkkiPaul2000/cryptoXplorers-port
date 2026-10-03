import React from "react";
import { Box, Button, Chip, Container, Grid, Stack, Tooltip, Typography } from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import RadarIcon from "@mui/icons-material/Radar";
import VerifiedIcon from "@mui/icons-material/Verified";
import { Link } from "react-router-dom";
import { CryptoState } from "../../CryptoContext";
import { formatPercent } from "../../utils/formatters";
import CoinImage from "../CoinImage";
import Logo from "../Logo";
import { LiveDot, TimeAgo } from "../ui";
import Carousel from "./Carousel";

function Orbit({ coins }) {
  const rings = [
    { list: coins.slice(0, 8), radius: 150, size: 46, reverse: false },
    { list: coins.slice(8, 13), radius: 92, size: 34, reverse: true },
  ];

  return (
    <Box className="orbit" sx={{ display: { xs: "none", md: "block" } }}>
      <Box className="orbit-ring" sx={{ inset: 20 }} />
      <Box className="orbit-ring" sx={{ inset: 78 }} />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(238,188,29,0.22), transparent 55%)",
        }}
      />
      <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <Box className="float">
          <Logo size="lg" showName={false} />
        </Box>
      </Box>
      {rings.map(({ list, radius, size, reverse }) => (
        <Box key={radius} className={`orbit-spin${reverse ? " orbit-spin--reverse" : ""}`}>
          {list.map((coin, index) => {
            const angle = (index / list.length) * 360;
            return (
              <Box
                key={coin.id}
                className="orbit-item"
                style={{ transform: `rotate(${angle}deg) translate(${radius}px) rotate(${-angle}deg)` }}
              >
                <Box className="orbit-counter" sx={{ left: -size / 2, top: -size / 2, width: size, height: size }}>
                  <Tooltip title={`${coin.name} ${formatPercent(coin.price_change_percentage_24h)}`}>
                    <Box
                      component={Link}
                      to={`/coins/${coin.id}`}
                      sx={{
                        display: "block",
                        borderRadius: "50%",
                        p: "3px",
                        bgcolor: "rgba(14, 20, 36, 0.9)",
                        border: "1px solid rgba(148,163,184,0.2)",
                        boxShadow: "0 8px 20px -8px rgba(0,0,0,0.8)",
                        transition: "transform 0.25s, border-color 0.25s",
                        "&:hover": { transform: "scale(1.18)", borderColor: "primary.main" },
                        "& img, & > div": { borderRadius: "50% !important" },
                      }}
                    >
                      <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={size - 8} />
                    </Box>
                  </Tooltip>
                </Box>
              </Box>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}

function Banner() {
  const { coins, lastUpdated } = CryptoState();

  return (
    <Box component="section" sx={{ position: "relative", borderBottom: "1px solid", borderColor: "divider" }}>
      <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 7 }, pb: { xs: 4, md: 5 } }}>
        <Grid container spacing={4} alignItems="center">
          <Grid item xs={12} md={7} className="rise-in">
            <Chip
              icon={<LiveDot />}
              label={
                <>
                  Live market data
                  {lastUpdated && <TimeAgo date={lastUpdated} prefix=" · updated " />}
                </>
              }
              variant="outlined"
              sx={{ mb: 3, pl: 1, bgcolor: "rgba(22, 199, 132, 0.06)", borderColor: "rgba(22, 199, 132, 0.3)" }}
            />
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2.4rem", sm: "3.2rem", md: "3.9rem" }, lineHeight: 1.05, mb: 2.5 }}
            >
              Explore the crypto market{" "}
              <Box component="span" className="gradient-text">
                in real time
              </Box>
            </Typography>
            <Typography
              color="text.secondary"
              sx={{ fontSize: { xs: "1rem", md: "1.12rem" }, maxWidth: 560, lineHeight: 1.75, mb: 4 }}
            >
              Track prices, sentiment and momentum across the top 100 cryptocurrencies. Heatmaps, risk scores,
              order-book depth and headlines — all in one dashboard.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <Button component={Link} to="/#screener" variant="contained" size="large" endIcon={<ArrowDownwardIcon />}>
                Open the screener
              </Button>
              <Button component={Link} to="/news" variant="outlined" size="large" startIcon={<RadarIcon />}>
                Today's signals
              </Button>
            </Stack>
            <Box
              sx={{
                mt: 3.5,
                maxWidth: 560,
                display: "flex",
                gap: 1.25,
                alignItems: "flex-start",
                p: 1.5,
                borderRadius: "14px",
                border: "1px dashed rgba(238, 188, 29, 0.4)",
                bgcolor: "rgba(238, 188, 29, 0.05)",
              }}
            >
              <VerifiedIcon sx={{ color: "primary.main", mt: 0.25 }} />
              <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                <b>Our motto:</b> make it easy for crypto investors to spot the next move and buy coins safely and
                profitably — with live data, clear signals and honest risk scores.
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            {coins.length > 0 && <Orbit coins={coins} />}
          </Grid>
        </Grid>
        <Box sx={{ mt: { xs: 4, md: 3 } }}>
          <Carousel />
        </Box>
      </Container>
    </Box>
  );
}

export default Banner;
