import React, { memo } from "react";
import { AppBar, Container, MenuItem, Select, Toolbar, Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import Logo from "./Logo";

function Header() {
  const navigate = useNavigate();
  const { currency, setCurrency } = CryptoState();

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ py: 1, gap: 2 }}>
          <Box onClick={() => navigate("/")} sx={{ flex: 1, cursor: "pointer" }}>
            <Logo />
          </Box>

          <Select
            variant="outlined"
            size="small"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            sx={{
              minWidth: 100,
              "& .MuiOutlinedInput-notchedOutline": {
                borderColor: "rgba(238, 188, 29, 0.3)",
              },
            }}
          >
            <MenuItem value="USD">USD</MenuItem>
            <MenuItem value="INR">INR</MenuItem>
            <MenuItem value="EUR">EUR</MenuItem>
          </Select>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default memo(Header);
