import "./App.css";
import React from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";
import { Box, Button, Container, ThemeProvider, Typography } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

import theme from "./theme/theme";
import Header from "./components/Header";
import TickerTape from "./components/TickerTape";
import Footer from "./components/Footer";
import Homepage from "./pages/Homepage";
import CoinPage from "./pages/CoinPage";
import NewsPage from "./pages/NewsPage";
import BrandLoader from "./components/BrandLoader";
import PageFade from "./components/PageFade";

function NotFound() {
  return (
    <Container maxWidth="sm" sx={{ py: 14, textAlign: "center" }}>
      <Typography variant="h1" className="gradient-text" sx={{ fontSize: { xs: "5rem", md: "7rem" } }}>
        404
      </Typography>
      <Typography variant="h5" sx={{ mb: 1 }}>
        This page drifted off-chain
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        The address doesn't match any page or coin.
      </Typography>
      <Button component={Link} to="/" variant="contained" size="large">
        Back to markets
      </Button>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <div className="aurora" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <Box sx={{ position: "relative", zIndex: 1, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          <BrandLoader />
          <Header />
          <TickerTape />
          <Box component="main" sx={{ flex: 1 }}>
            <PageFade>
              <Routes>
                <Route path="/" element={<Homepage />} />
                <Route path="/coins/:id" element={<CoinPage />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </PageFade>
          </Box>
          <Footer />
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
