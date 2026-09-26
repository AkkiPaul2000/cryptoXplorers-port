import React, { memo, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  Container,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { coinCategories } from "../config/data";
import {
  formatMarketCap,
  formatPercent,
  numberWithCommas,
} from "../utils/formatters";
import { listRiskScore, riskBand } from "../utils/risk";
import CoinImage from "./CoinImage";

const COLUMNS = [
  { key: "market_cap_rank", label: "#", align: "right" },
  { key: "name", label: "Coin", align: "left" },
  { key: "current_price", label: "Price", align: "right" },
  { key: "price_change_percentage_24h", label: "24h", align: "right" },
  { key: "price_change_percentage_7d_in_currency", label: "7d", align: "right" },
  { key: "total_volume", label: "Volume", align: "right" },
  { key: "market_cap", label: "Market Cap", align: "right" },
  { key: "risk", label: "Risk", align: "right" },
];

function CoinsTable() {
  const { coins, symbol, category, setCategory, marketError } = CryptoState();
  const [search, setSearch] = useState("");
  const [move, setMove] = useState("all");
  const [capBand, setCapBand] = useState("all");
  const [volumeBand, setVolumeBand] = useState("all");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ key: "market_cap_rank", dir: "asc" });
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const volumes = coins.map((coin) => coin.total_volume || 0).sort((a, b) => a - b);
    const highVolume = volumes[Math.floor(volumes.length * 0.75)] || 0;

    return coins
      .filter((coin) => {
        const matchesQuery =
          !query ||
          coin.name.toLowerCase().includes(query) ||
          coin.symbol.toLowerCase().includes(query);
        const change = coin.price_change_percentage_24h || 0;
        const matchesMove =
          move === "all" ||
          (move === "gainers" && change > 0) ||
          (move === "losers" && change < 0) ||
          (move === "hot" && change >= 5) ||
          (move === "cold" && change <= -5);
        const rank = coin.market_cap_rank || 999;
        const matchesCap =
          capBand === "all" ||
          (capBand === "large" && rank <= 20) ||
          (capBand === "mid" && rank > 20 && rank <= 50) ||
          (capBand === "small" && rank > 50);
        const matchesVolume =
          volumeBand === "all" ||
          (volumeBand === "high" && coin.total_volume >= highVolume);
        return matchesQuery && matchesMove && matchesCap && matchesVolume;
      })
      .sort((a, b) => {
        const read = (coin) =>
          sort.key === "risk" ? listRiskScore(coin) : coin[sort.key] ?? 0;
        const left = sort.key === "name" ? a.name : read(a);
        const right = sort.key === "name" ? b.name : read(b);
        if (left < right) return sort.dir === "asc" ? -1 : 1;
        if (left > right) return sort.dir === "asc" ? 1 : -1;
        return 0;
      });
  }, [coins, search, move, capBand, volumeBand, sort]);

  const pageSize = 12;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const rows = filtered.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (key) => {
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" ? "asc" : "desc" }
    );
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Coin Screener
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Filter by category, move, size, and volume. Click a column to sort.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.4fr repeat(4, 1fr)" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <TextField
          placeholder="Search name or symbol"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl>
          <InputLabel>Category</InputLabel>
          <Select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            {coinCategories.map((item) => (
              <MenuItem key={item.value} value={item.value}>
                {item.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>24h move</InputLabel>
          <Select
            label="24h move"
            value={move}
            onChange={(event) => {
              setMove(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="gainers">Gainers</MenuItem>
            <MenuItem value="losers">Losers</MenuItem>
            <MenuItem value="hot">+5% or more</MenuItem>
            <MenuItem value="cold">-5% or more</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Market size</InputLabel>
          <Select
            label="Market size"
            value={capBand}
            onChange={(event) => {
              setCapBand(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">All caps</MenuItem>
            <MenuItem value="large">Large · top 20</MenuItem>
            <MenuItem value="mid">Mid · 21–50</MenuItem>
            <MenuItem value="small">Smaller · 51+</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Volume</InputLabel>
          <Select
            label="Volume"
            value={volumeBand}
            onChange={(event) => {
              setVolumeBand(event.target.value);
              setPage(1);
            }}
          >
            <MenuItem value="all">Any volume</MenuItem>
            <MenuItem value="high">High volume</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {marketError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {marketError}
        </Alert>
      )}

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: "1px solid", borderColor: "divider", overflowX: "auto" }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "rgba(238, 188, 29, 0.12)" }}>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align}
                  onClick={() => column.sortable !== false && toggleSort(column.key)}
                  sx={{
                    color: "primary.main",
                    fontWeight: 700,
                    cursor: column.sortable === false ? "default" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {column.label}
                  {sort.key === column.key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => {
              const profit = row.price_change_percentage_24h > 0;
              const week = row.price_change_percentage_7d_in_currency;
              const risk = listRiskScore(row);
              const band = riskBand(risk);
              return (
                <TableRow
                  key={row.id}
                  hover
                  className="row-in"
                  onClick={() => navigate(`/coins/${row.id}`)}
                  sx={{
                    cursor: "pointer",
                    animationDelay: `${index * 30}ms`,
                    "&:hover": { bgcolor: "rgba(238, 188, 29, 0.06)" },
                  }}
                >
                  <TableCell align="right">{row.market_cap_rank}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <CoinImage symbol={row.symbol} name={row.name} src={row.image} size={32} />
                      <Box>
                        <Typography fontWeight={700} textTransform="uppercase">
                          {row.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.name}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    {symbol} {numberWithCommas(row.current_price)}
                  </TableCell>
                  <TableCell align="right" sx={{ color: profit ? "secondary.main" : "error.main" }}>
                    {formatPercent(row.price_change_percentage_24h)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ color: week >= 0 ? "secondary.main" : "error.main" }}
                  >
                    {formatPercent(week)}
                  </TableCell>
                  <TableCell align="right">{formatMarketCap(row.total_volume, symbol)}</TableCell>
                  <TableCell align="right">{formatMarketCap(row.market_cap, symbol)}</TableCell>
                  <TableCell align="right">
                    <Chip
                      size="small"
                      label={`${band.label} ${risk}`}
                      sx={{ fontWeight: 700 }}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {!rows.length && !marketError && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 6 }}>
                  No coins match these filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Pagination
        count={pageCount}
        page={page}
        color="primary"
        onChange={(_, value) => {
          setPage(value);
          window.scrollTo({ top: 420, behavior: "smooth" });
        }}
        sx={{ mt: 3, display: "flex", justifyContent: "center" }}
      />
    </Container>
  );
}

export default memo(CoinsTable);
