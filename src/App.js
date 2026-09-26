import "./App.css";
import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Box, ThemeProvider } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";

import theme from "./theme/theme";
import Header from "./components/Header";
import Homepage from "./pages/Homepage";
import CoinPage from "./pages/CoinPage";
import BrandLoader from "./components/BrandLoader";
import PageFade from "./components/PageFade";

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          <BrandLoader />
          <Header />
          <PageFade>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/coins/:id" element={<CoinPage />} />
            </Routes>
          </PageFade>
        </Box>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
