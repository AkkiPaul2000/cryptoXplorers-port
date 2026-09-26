import React from "react";
import { Box, Container, Typography } from "@mui/material";
import Carousel from "./Carousel";
import Logo from "../Logo";

function Banner() {
  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(135deg, #0b0e11 0%, #14161a 40%, #1a1f2e 100%)",
        borderBottom: "1px solid",
        borderColor: "divider",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -80,
          right: -80,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(238,188,29,0.15) 0%, transparent 70%)",
        },
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 6 }, position: "relative" }}>
        <Box sx={{ textAlign: "center", mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
            <Logo size="lg" showName={false} />
          </Box>
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2rem", md: "3rem" },
              fontWeight: 800,
              mb: 1.5,
              background: "linear-gradient(90deg, #EEBC1D, #f5d04a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Crypto Market Intelligence
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            sx={{ maxWidth: 560, mx: "auto", lineHeight: 1.7 }}
          >
            Real-time prices, market caps, and historical charts for the top 100
            cryptocurrencies — built for traders and analysts.
          </Typography>
        </Box>
        <Carousel />
      </Container>
    </Box>
  );
}

export default Banner;
