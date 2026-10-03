import { alpha, createTheme } from "@mui/material/styles";

export const tokens = {
  ink: "#060912",
  surface: "#0E1424",
  gold: "#EEBC1D",
  goldLight: "#F7D35C",
  violet: "#8B5CF6",
  cyan: "#22D3EE",
  up: "#16C784",
  down: "#F6465D",
  orange: "#F59E0B",
  text: "#E8ECF4",
  muted: "#8A94A8",
  line: "rgba(148, 163, 184, 0.12)",
};

export const goldGradient = `linear-gradient(135deg, ${tokens.goldLight} 0%, ${tokens.gold} 55%, #D99A0B 100%)`;

const display = '"Space Grotesk", "Inter", sans-serif';

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: tokens.gold, light: tokens.goldLight, dark: "#C99A12", contrastText: tokens.ink },
    secondary: { main: tokens.violet },
    success: { main: tokens.up },
    error: { main: tokens.down },
    warning: { main: tokens.orange },
    info: { main: tokens.cyan },
    background: { default: tokens.ink, paper: tokens.surface },
    text: { primary: tokens.text, secondary: tokens.muted },
    divider: tokens.line,
  },
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif',
    h1: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.03em" },
    h2: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.02em" },
    h4: { fontFamily: display, fontWeight: 700, letterSpacing: "-0.01em" },
    h5: { fontFamily: display, fontWeight: 600 },
    h6: { fontFamily: display, fontWeight: 600 },
    overline: { fontWeight: 700, letterSpacing: "0.12em", lineHeight: 1.6 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: "none" } },
      variants: [
        {
          props: { variant: "glass" },
          style: {
            position: "relative",
            background: "linear-gradient(180deg, rgba(23, 31, 52, 0.78) 0%, rgba(12, 17, 31, 0.82) 100%)",
            border: "1px solid rgba(148, 163, 184, 0.11)",
            borderRadius: 18,
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04), 0 18px 40px -24px rgba(0, 0, 0, 0.8)",
          },
        },
      ],
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(14, 20, 36, 0.94)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${tokens.line}`,
          boxShadow: "0 24px 48px -16px rgba(0, 0, 0, 0.7)",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(14, 20, 36, 0.96)",
          backdropFilter: "blur(16px)",
          border: `1px solid ${tokens.line}`,
          marginTop: 6,
        },
        option: { borderRadius: 10, margin: "2px 6px" },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(6, 9, 18, 0.72)",
          backdropFilter: "saturate(160%) blur(16px)",
          borderBottom: `1px solid ${tokens.line}`,
          transition: "box-shadow 0.3s ease, background-color 0.3s ease",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 999, paddingInline: 20 },
        containedPrimary: {
          background: goldGradient,
          boxShadow: `0 10px 24px -10px ${alpha(tokens.gold, 0.7)}`,
          "&:hover": { boxShadow: `0 14px 30px -10px ${alpha(tokens.gold, 0.85)}`, filter: "brightness(1.06)" },
        },
        outlined: { borderColor: alpha(tokens.text, 0.18), color: tokens.text },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(148, 163, 184, 0.06)",
          borderRadius: 12,
          transition: "box-shadow 0.2s ease, background-color 0.2s ease",
          "& .MuiOutlinedInput-notchedOutline": { borderColor: tokens.line },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: alpha(tokens.gold, 0.4) },
          "&.Mui-focused": { boxShadow: `0 0 0 4px ${alpha(tokens.gold, 0.12)}` },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: { borderColor: tokens.line },
        head: {
          fontWeight: 700,
          fontSize: 12,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: tokens.muted,
          whiteSpace: "nowrap",
        },
      },
    },
    MuiTableSortLabel: {
      styleOverrides: {
        root: { "&.Mui-active": { color: tokens.gold }, "&:hover": { color: tokens.text } },
        icon: { color: `${tokens.gold} !important` },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, borderRadius: 999 },
        outlined: { borderColor: alpha(tokens.text, 0.16) },
      },
    },
    MuiTooltip: {
      defaultProps: { arrow: true },
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(14, 20, 36, 0.96)",
          border: `1px solid ${tokens.line}`,
          backdropFilter: "blur(12px)",
          fontSize: 12,
          padding: "8px 12px",
          borderRadius: 10,
          boxShadow: "0 12px 30px -10px rgba(0, 0, 0, 0.7)",
        },
        arrow: { color: "rgba(14, 20, 36, 0.96)" },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { minHeight: 40 },
        indicator: { height: 3, borderRadius: 3, background: goldGradient },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: { minHeight: 40, textTransform: "none", fontWeight: 600, paddingInline: 12, minWidth: 0 },
      },
    },
    MuiSkeleton: {
      defaultProps: { animation: "wave" },
      styleOverrides: { root: { backgroundColor: "rgba(148, 163, 184, 0.08)" } },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 99, height: 6, backgroundColor: "rgba(148, 163, 184, 0.1)" },
        bar: { borderRadius: 99 },
      },
    },
    MuiPaginationItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          "&.Mui-selected": { background: goldGradient, color: tokens.ink },
        },
      },
    },
  },
});

export default theme;
