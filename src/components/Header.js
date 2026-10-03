import React, { memo, useEffect, useRef, useState } from "react";
import {
  AppBar,
  Autocomplete,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  TextField,
  Toolbar,
  Typography,
  createFilterOptions,
  useScrollTrigger,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import NewspaperIcon from "@mui/icons-material/Newspaper";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { formatPrice } from "../utils/formatters";
import CoinImage from "./CoinImage";
import Logo from "./Logo";
import { ChangePill } from "./ui";

const NAV = [
  { to: "/", label: "Markets", end: true },
  { to: "/news", label: "News & signals" },
];

const navSx = {
  color: "text.secondary",
  borderRadius: "10px",
  px: 1.5,
  whiteSpace: "nowrap",
  "&:hover": { color: "text.primary", bgcolor: "rgba(148,163,184,0.08)" },
  "&.active": { color: "primary.main", bgcolor: "rgba(238,188,29,0.1)" },
};

const CURRENCIES = [
  { code: "USD", sign: "$" },
  { code: "EUR", sign: "€" },
  { code: "INR", sign: "₹" },
];

const filterCoins = createFilterOptions({
  limit: 8,
  stringify: (coin) => `${coin.name} ${coin.symbol}`,
});

function CoinSearch() {
  const { allCoins, symbol } = CryptoState();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (event) => {
      const typing = /input|textarea|select/i.test(event.target.tagName) || event.target.isContentEditable;
      if (event.key === "/" && !typing) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Autocomplete
      options={allCoins}
      value={null}
      inputValue={query}
      onInputChange={(_, next, reason) => setQuery(reason === "reset" ? "" : next)}
      onChange={(_, coin) => {
        if (!coin) return;
        setQuery("");
        inputRef.current?.blur();
        navigate(`/coins/${coin.id}`);
      }}
      filterOptions={filterCoins}
      getOptionLabel={(coin) => coin.name || ""}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      noOptionsText="No matching coins"
      blurOnSelect
      clearOnBlur
      handleHomeEndKeys
      popupIcon={null}
      sx={{ flex: 1, maxWidth: 380 }}
      renderOption={({ key, ...props }, coin) => (
        <Box component="li" key={coin.id} {...props} sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
          <CoinImage symbol={coin.symbol} name={coin.name} src={coin.image} size={26} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={700} noWrap>
              {coin.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              #{coin.market_cap_rank} · {coin.symbol}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "right" }}>
            <Typography variant="body2" fontWeight={600}>
              {formatPrice(coin.current_price, symbol)}
            </Typography>
            <ChangePill value={coin.price_change_percentage_24h} soft={false} sx={{ fontSize: 12 }} />
          </Box>
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          size="small"
          placeholder="Search coins…"
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: (
              <Box component="kbd" sx={{ display: { xs: "none", md: "inline" }, mr: 0.5 }}>
                /
              </Box>
            ),
          }}
        />
      )}
    />
  );
}

function Header() {
  const { currency, setCurrency } = CryptoState();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 12 });

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: scrolled ? "rgba(6, 9, 18, 0.88)" : undefined,
        boxShadow: scrolled ? "0 12px 32px -18px rgba(0,0,0,0.9)" : "none",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: { xs: 1.5, sm: 3 }, minHeight: { xs: 62, sm: 70 } }}>
          <Box component={Link} to="/" aria-label="CryptoXplorers home" sx={{ display: "flex", flexShrink: 0 }}>
            <Logo compact />
          </Box>

          <Box component="nav" aria-label="Main" sx={{ display: { xs: "none", md: "flex" }, gap: 0.5 }}>
            {NAV.map((item) => (
              <Button key={item.to} component={NavLink} to={item.to} end={item.end} size="small" sx={navSx}>
                {item.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <CoinSearch />
          </Box>

          <IconButton component={NavLink} to="/news" aria-label="News & signals" sx={{ ...navSx, display: { md: "none" }, px: 1 }}>
            <NewspaperIcon fontSize="small" />
          </IconButton>

          <Select
            size="small"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            inputProps={{ "aria-label": "Display currency" }}
            renderValue={(code) => `${CURRENCIES.find((item) => item.code === code)?.sign} ${code}`}
            sx={{ minWidth: { xs: 92, sm: 108 }, fontWeight: 600 }}
          >
            {CURRENCIES.map((item) => (
              <MenuItem key={item.code} value={item.code}>
                <Box component="span" sx={{ width: 22, color: "primary.main", fontWeight: 700 }}>
                  {item.sign}
                </Box>
                {item.code}
              </MenuItem>
            ))}
          </Select>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default memo(Header);
