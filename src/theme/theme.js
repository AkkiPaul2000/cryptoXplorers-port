import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#EEBC1D",
      light: "#f5d04a",
      dark: "#c9a018",
    },
    secondary: {
      main: "#0ecb81",
    },
    error: {
      main: "#f6465d",
    },
    background: {
      default: "#0b0e11",
      paper: "#14161a",
    },
    text: {
      primary: "#f5f5f5",
      secondary: "#8b949e",
    },
    divider: "rgba(238, 188, 29, 0.12)",
  },
  typography: {
    fontFamily: '"Montserrat", "Segoe UI", Roboto, sans-serif',
    h2: { fontWeight: 800, letterSpacing: "-0.02em" },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backdropFilter: "blur(12px)",
          backgroundColor: "rgba(11, 14, 17, 0.85)",
          borderBottom: "1px solid rgba(238, 188, 29, 0.15)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});

export default theme;
