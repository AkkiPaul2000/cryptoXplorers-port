import React from "react";
import { Box, Container } from "@mui/material";
import Banner from "../components/Banner/Banner";
import MarketOverview from "../components/MarketOverview";
import CoinsTable from "../components/CoinsTable";

function Homepage() {
  return (
    <>
      <Banner />
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <MarketOverview />
      </Container>
      <Box sx={{ mt: 2 }}>
        <CoinsTable />
      </Box>
    </>
  );
}

export default Homepage;
