import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/Search";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import RefreshIcon from "@mui/icons-material/Refresh";
import FilterAltOffIcon from "@mui/icons-material/FilterAltOff";
import { useNavigate } from "react-router-dom";
import { CryptoState } from "../CryptoContext";
import { coinCategories, showWatchlist } from "../config/data";
import { formatMarketCap, formatPrice } from "../utils/formatters";
import { listRiskScore, riskBand } from "../utils/risk";
import CoinImage from "./CoinImage";
import CoinSparkline from "./Sparkline";
import { ChangePill, LiveDot, Reveal, SectionTitle, TimeAgo } from "./ui";

const show = (from) => ({ xs: "none", [from]: "table-cell" });

const COLUMNS = [
  { key: "market_cap_rank", label: "#", align: "left", width: { xs: 36, sm: 72 } },
  { key: "name", label: "Coin", align: "left" },
  { key: "current_price", label: "Price" },
  { key: "price_change_percentage_1h", label: "1h", display: show("lg") },
  { key: "price_change_percentage_24h", label: "24h" },
  { key: "price_change_percentage_7d_in_currency", label: "7d", display: show("sm") },
  { key: "market_cap", label: "Market cap", display: show("md") },
  { key: "total_volume", label: "Volume 24h", display: show("lg") },
  { key: "spark", label: "Last 7 days", sortable: false, display: show("md") },
  { key: "risk", label: "Risk", display: show("md") },
];

const FILTER_DEFAULTS = { search: "", move: "all", capBand: "all", volumeBand: "all", watchOnly: false };

function FlashPrice({ value, currency, children }) {
  const prev = useRef({ value, currency });
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const before = prev.current;
    prev.current = { value, currency };
    if (before.currency !== currency || before.value === value || before.value == null) return undefined;
    setFlash(value > before.value ? "flash-up" : "flash-down");
    const id = setTimeout(() => setFlash(""), 1200);
    return () => clearTimeout(id);
  }, [value, currency]);

  return (
    <Box component="span" className={flash} sx={{ px: 0.75, py: 0.25, mx: -0.75, borderRadius: "6px" }}>
      {children}
    </Box>
  );
}

function SkeletonRows({ count }) {
  return [...Array(count)].map((_, index) => (
    <TableRow key={index}>
      {COLUMNS.map((column) => (
        <TableCell key={column.key} sx={{ display: column.display }}>
          {column.key === "name" ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Skeleton variant="circular" width={32} height={32} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width={60} />
                <Skeleton width={90} height={14} />
              </Box>
            </Box>
          ) : (
            <Skeleton />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
}

function CoinsTable() {
  const {
    screenerCoins: coins,
    allCoins,
    symbol,
    currency,
    category,
    setCategory,
    categoryLoading,
    categoryError,
    marketError: tickerError,
    loading: tickersLoading,
    refreshing,
    lastUpdated,
    refresh,
    watchlist,
    toggleWatch,
  } = CryptoState();
  const loading = tickersLoading || categoryLoading;
  const marketError = tickerError || categoryError;
  const categoryLabel = coinCategories.find((item) => item.value === category)?.label;
  const [filters, setFilters] = useState(FILTER_DEFAULTS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [sort, setSort] = useState({ key: "market_cap_rank", dir: "asc" });
  const [popped, setPopped] = useState(null);
  const navigate = useNavigate();
  const topRef = useRef(null);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };
  const filtersActive = Object.keys(FILTER_DEFAULTS).some((key) => filters[key] !== FILTER_DEFAULTS[key]);

  const filtered = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const volumes = coins.map((coin) => coin.total_volume || 0).sort((a, b) => a - b);
    const highVolume = volumes[Math.floor(volumes.length * 0.75)] || 0;
    const dir = sort.dir === "asc" ? 1 : -1;
    const read = (coin) => (sort.key === "risk" ? listRiskScore(coin) : coin[sort.key] ?? 0);

    // The watchlist spans every coin (it can hold coins found via search outside the top 100).
    const base = filters.watchOnly ? allCoins.filter((coin) => watchlist.includes(coin.id)) : coins;
    return base
      .filter((coin) => {
        const change = coin.price_change_percentage_24h || 0;
        const rank = coin.market_cap_rank || 999;
        return (
          (!query || coin.name.toLowerCase().includes(query) || coin.symbol.toLowerCase().includes(query)) &&
          (filters.move === "all" ||
            (filters.move === "gainers" && change > 0) ||
            (filters.move === "losers" && change < 0) ||
            (filters.move === "hot" && change >= 5) ||
            (filters.move === "cold" && change <= -5)) &&
          (filters.capBand === "all" ||
            (filters.capBand === "large" && rank <= 20) ||
            (filters.capBand === "mid" && rank > 20 && rank <= 50) ||
            (filters.capBand === "small" && rank > 50)) &&
          (filters.volumeBand === "all" || coin.total_volume >= highVolume)
        );
      })
      .sort((a, b) => {
        if (sort.key === "name") return a.name.localeCompare(b.name) * dir;
        return (read(a) - read(b)) * dir;
      });
  }, [coins, allCoins, filters, sort, watchlist]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const rows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const firstRow = filtered.length ? (safePage - 1) * pageSize + 1 : 0;

  const toggleSort = (key) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" || key === "market_cap_rank" ? "asc" : "desc" }
    );

  const star = (event, id) => {
    event.stopPropagation();
    toggleWatch(id);
    setPopped(id);
  };

  const open = (id) => navigate(`/coins/${id}`);

  let emptyMessage = "No coins match these filters.";
  if (filters.watchOnly && !watchlist.length) emptyMessage = "Your watchlist is empty — tap the ☆ next to any coin to pin it here.";

  return (
    <Box component="section" id="screener" ref={topRef} sx={{ pt: { xs: 6, md: 8 } }}>
      <Reveal>
        <SectionTitle
          eyebrow="Screener"
          title={category === "all" ? "Top 100 cryptocurrencies" : `Top ${categoryLabel} coins`}
          subtitle={
            showWatchlist
              ? "Filter by category, momentum, size and volume. Click a column to sort, a row to dive in, or ☆ to build a watchlist."
              : "Filter by category, momentum, size and volume. Click a column to sort or a row to dive in."
          }
          action={
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <LiveDot />
                {lastUpdated ? <TimeAgo date={lastUpdated} prefix="Data " /> : "Connecting…"}
              </Typography>
              <Tooltip title="Refresh prices">
                <span>
                  <IconButton onClick={refresh} disabled={refreshing || tickersLoading} size="small" aria-label="Refresh prices">
                    <RefreshIcon fontSize="small" className={refreshing ? "spin" : ""} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
          }
        />
      </Reveal>

      <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1.5, mb: 1, scrollbarWidth: "none" }}>
        {coinCategories.map((item) => {
          const active = category === item.value;
          return (
            <Chip
              key={item.value}
              label={item.label}
              clickable
              color={active ? "primary" : "default"}
              variant={active ? "filled" : "outlined"}
              onClick={() => {
                setCategory(item.value);
                setPage(1);
              }}
              sx={{ flexShrink: 0, transition: "all 0.25s", ...(active && { color: "primary.contrastText" }) }}
            />
          );
        })}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr 1fr", md: "1.6fr repeat(3, 1fr) auto" },
          gap: 1.5,
          mb: 2.5,
        }}
      >
        <TextField
          sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}
          placeholder="Filter by name or symbol"
          value={filters.search}
          onChange={(event) => setFilter("search", event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
          }}
        />
        <FormControl>
          <InputLabel>24h move</InputLabel>
          <Select label="24h move" value={filters.move} onChange={(event) => setFilter("move", event.target.value)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="gainers">Gainers</MenuItem>
            <MenuItem value="losers">Losers</MenuItem>
            <MenuItem value="hot">+5% or more</MenuItem>
            <MenuItem value="cold">-5% or more</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Market size</InputLabel>
          <Select label="Market size" value={filters.capBand} onChange={(event) => setFilter("capBand", event.target.value)}>
            <MenuItem value="all">All caps</MenuItem>
            <MenuItem value="large">Large · top 20</MenuItem>
            <MenuItem value="mid">Mid · 21–50</MenuItem>
            <MenuItem value="small">Smaller · 51+</MenuItem>
          </Select>
        </FormControl>
        <FormControl>
          <InputLabel>Volume</InputLabel>
          <Select label="Volume" value={filters.volumeBand} onChange={(event) => setFilter("volumeBand", event.target.value)}>
            <MenuItem value="all">Any volume</MenuItem>
            <MenuItem value="high">Top 25% volume</MenuItem>
          </Select>
        </FormControl>
        {showWatchlist && (
          <Button
            variant={filters.watchOnly ? "contained" : "outlined"}
            onClick={() => setFilter("watchOnly", !filters.watchOnly)}
            startIcon={filters.watchOnly ? <StarIcon /> : <StarBorderIcon />}
            sx={{ borderRadius: "12px", whiteSpace: "nowrap", minHeight: 56 }}
          >
            Watchlist{watchlist.length ? ` · ${watchlist.length}` : ""}
          </Button>
        )}
      </Box>

      {marketError && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
          action={
            tickerError && (
              <Button color="inherit" size="small" onClick={refresh}>
                Retry
              </Button>
            )
          }
        >
          {marketError}
        </Alert>
      )}

      <TableContainer component={Paper} variant="glass" sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ "& td, & th": { px: { xs: 0.75, sm: 1, lg: 1.25 } } }}>
          <TableHead>
            <TableRow sx={{ "& th": { py: 1.5, bgcolor: "rgba(148, 163, 184, 0.04)" } }}>
              {COLUMNS.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || "right"}
                  sx={{ display: column.display, width: column.width }}
                  sortDirection={sort.key === column.key ? sort.dir : false}
                >
                  {column.sortable === false ? (
                    column.label
                  ) : (
                    <TableSortLabel
                      active={sort.key === column.key}
                      direction={sort.key === column.key ? sort.dir : "desc"}
                      onClick={() => toggleSort(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <SkeletonRows count={8} />
            ) : (
              rows.map((row, index) => {
                const risk = listRiskScore(row);
                const band = riskBand(risk);
                const watched = watchlist.includes(row.id);
                return (
                  <TableRow
                    key={row.id}
                    hover
                    tabIndex={0}
                    className="row-in"
                    onClick={() => open(row.id)}
                    onKeyDown={(event) => event.key === "Enter" && open(row.id)}
                    sx={{
                      cursor: "pointer",
                      animationDelay: `${index * 25}ms`,
                      "& td": { py: 1.25, transition: "background-color 0.2s" },
                      "&.MuiTableRow-hover:hover td": { bgcolor: "rgba(238, 188, 29, 0.05)" },
                      "&:focus-visible": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: -2 },
                    }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                      {showWatchlist && (
                        <Tooltip title={watched ? "Remove from watchlist" : "Add to watchlist"}>
                          <IconButton
                            size="small"
                            onClick={(event) => star(event, row.id)}
                            aria-label={watched ? `Unwatch ${row.name}` : `Watch ${row.name}`}
                            aria-pressed={watched}
                            className={popped === row.id ? "pop" : ""}
                            onAnimationEnd={() => setPopped(null)}
                            sx={{ ml: -0.75, color: watched ? "primary.main" : "text.secondary" }}
                          >
                            {watched ? <StarIcon fontSize="small" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                      )}
                      {/* On phones the star takes the rank's spot, so show the rank when the star is hidden. */}
                      <Box component="span" sx={{ display: { xs: showWatchlist ? "none" : "inline", sm: "inline" }, ml: 0.5 }}>
                        {row.market_cap_rank}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, minWidth: { xs: 0, sm: 160 } }}>
                        <CoinImage symbol={row.symbol} name={row.name} src={row.image} size={30} />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography fontWeight={700} noWrap sx={{ maxWidth: { xs: 84, sm: 140, md: 180 } }}>
                            {row.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.symbol}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                      <FlashPrice value={row.current_price} currency={currency}>
                        {formatPrice(row.current_price, symbol)}
                      </FlashPrice>
                    </TableCell>
                    <TableCell align="right" sx={{ display: show("lg") }}>
                      <ChangePill value={row.price_change_percentage_1h} soft={false} sx={{ fontSize: 13 }} />
                    </TableCell>
                    <TableCell align="right">
                      <ChangePill value={row.price_change_percentage_24h} sx={{ fontSize: 13 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ display: show("sm") }}>
                      <ChangePill value={row.price_change_percentage_7d_in_currency} soft={false} sx={{ fontSize: 13 }} />
                    </TableCell>
                    <TableCell align="right" sx={{ display: show("md"), whiteSpace: "nowrap" }}>
                      {formatMarketCap(row.market_cap, symbol)}
                    </TableCell>
                    <TableCell align="right" sx={{ display: show("lg"), whiteSpace: "nowrap", color: "text.secondary" }}>
                      {formatMarketCap(row.total_volume, symbol)}
                    </TableCell>
                    <TableCell align="right" sx={{ display: show("md") }}>
                      <Box sx={{ display: "flex", justifyContent: "flex-end", color: "text.secondary" }}>
                        <CoinSparkline symbol={row.symbol} width={100} height={34} empty="—" />
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ display: show("md") }}>
                      <Tooltip title={`${band.label} speculation risk — based on 24h & 7d swings and market-cap rank`}>
                        <Chip
                          size="small"
                          label={risk}
                          sx={{
                            minWidth: 44,
                            fontWeight: 800,
                            color: band.color,
                            bgcolor: alpha(band.color, 0.14),
                            border: `1px solid ${alpha(band.color, 0.35)}`,
                          }}
                        />
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
            {!loading && !rows.length && !marketError && (
              <TableRow>
                <TableCell colSpan={COLUMNS.length} align="center" sx={{ py: 7 }}>
                  <Typography color="text.secondary" sx={{ mb: filtersActive ? 2 : 0 }}>
                    {emptyMessage}
                  </Typography>
                  {filtersActive && (
                    <Button variant="outlined" startIcon={<FilterAltOffIcon />} onClick={() => setFilters(FILTER_DEFAULTS)}>
                      Reset filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          mt: 2.5,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {filtered.length
              ? `Showing ${firstRow}–${firstRow + rows.length - 1} of ${filtered.length}`
              : "No results"}
          </Typography>
          <Select
            size="small"
            value={pageSize}
            onChange={(event) => {
              setPageSize(event.target.value);
              setPage(1);
            }}
            inputProps={{ "aria-label": "Rows per page" }}
            sx={{ fontSize: 14 }}
          >
            {[15, 25, 50, 100].map((size) => (
              <MenuItem key={size} value={size}>
                {size} rows
              </MenuItem>
            ))}
          </Select>
        </Box>
        <Pagination
          count={pageCount}
          page={safePage}
          shape="rounded"
          siblingCount={1}
          onChange={(_, value) => {
            setPage(value);
            topRef.current?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </Box>
    </Box>
  );
}

export default memo(CoinsTable);
