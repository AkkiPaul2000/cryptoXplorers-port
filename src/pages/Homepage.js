import React, { useMemo } from "react";
import { Box, Button, Container, Grid, Paper, Skeleton, Typography } from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import { Link } from "react-router-dom";
import Banner from "../components/Banner/Banner";
import MarketOverview from "../components/MarketOverview";
import MarketPulse from "../components/MarketPulse";
import CoinsTable from "../components/CoinsTable";
import CoinOfTheDay from "../components/CoinOfTheDay";
import NewsCard from "../components/NewsCard";
import { IconBadge, Reveal, SectionTitle } from "../components/ui";
import { CryptoState } from "../CryptoContext";
import useHeadlines from "../hooks/useHeadlines";
import { tokens } from "../theme/theme";

function HotHeadlines({ items, loading, coinsById }) {
  return (
    <Paper variant="glass" sx={{ p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, mb: 1.5 }}>
        <IconBadge color={tokens.orange} size={32}>
          <LocalFireDepartmentIcon />
        </IconBadge>
        <Typography variant="h6" sx={{ flex: 1 }}>
          Hot headlines
        </Typography>
      </Box>
      <Box sx={{ display: "grid", gap: 0.5 }}>
        {loading
          ? [...Array(5)].map((_, index) => <Skeleton key={index} variant="rounded" height={66} sx={{ my: 0.5 }} />)
          : items.slice(0, 5).map((item) => <NewsCard key={item.link || item.title} item={item} coinsById={coinsById} compact />)}
        {!loading && !items.length && (
          <Typography variant="body2" color="text.secondary">
            News feeds are unavailable right now.
          </Typography>
        )}
      </Box>
      <Button component={Link} to="/news" endIcon={<ArrowForwardIcon />} sx={{ mt: "auto", alignSelf: "flex-start", px: 1.5 }}>
        All news & signals
      </Button>
    </Paper>
  );
}

function Spotlight() {
  const { coins } = CryptoState();
  const { items, loading } = useHeadlines();
  const coinsById = useMemo(() => Object.fromEntries(coins.map((coin) => [coin.id, coin])), [coins]);

  return (
    <Box component="section" id="spotlight" sx={{ pt: { xs: 6, md: 8 } }}>
      <Reveal>
        <SectionTitle
          eyebrow="Today's spotlight"
          title="Coin of the day & hot headlines"
          subtitle="A fresh, data-driven pick every day plus the stories moving prices right now."
        />
      </Reveal>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={7}>
          <Reveal sx={{ height: "100%" }}>
            <CoinOfTheDay headlines={items} headlinesLoading={loading} />
          </Reveal>
        </Grid>
        <Grid item xs={12} md={5}>
          <Reveal delay={120} sx={{ height: "100%" }}>
            <HotHeadlines items={items} loading={loading} coinsById={coinsById} />
          </Reveal>
        </Grid>
      </Grid>
    </Box>
  );
}

function Homepage() {
  return (
    <>
      <Banner />
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Box component="section" id="overview" sx={{ pt: { xs: 5, md: 7 } }}>
          <Reveal>
            <SectionTitle
              eyebrow="Overview"
              title="Global market at a glance"
              subtitle="Sentiment, total value and where the money is concentrated right now. Hover the ⓘ on any card to learn how to read it."
            />
          </Reveal>
          <MarketOverview />
        </Box>
        <Spotlight />
        <MarketPulse />
        <CoinsTable />
      </Container>
    </>
  );
}

export default Homepage;
