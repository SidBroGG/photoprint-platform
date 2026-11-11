import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#FFC400",
      dark: "#E6B000",
      light: "#FFE07A",
      contrastText: "#1A1A1A",
    },
    secondary: {
      main: "#17181C",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F5F6F8",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#17181C",
      secondary: "#5F6570",
    },
    success: { main: "#1E8E3E" },
    warning: { main: "#B26A00" },
    error: { main: "#C62828" },
    info: { main: "#1565C0" },
    divider: "#E3E6EB",
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: 'Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontSize: 26,
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    h5: {
      fontSize: 21,
      fontWeight: 700,
    },
    h6: {
      fontSize: 16,
      fontWeight: 700,
    },
    subtitle2: {
      fontWeight: 600,
    },
    body2: {
      fontSize: 13.5,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F5F6F8",
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
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: "1px solid #E3E6EB",
          boxShadow: "none",
          borderRadius: 6,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
        },
        containedPrimary: {
          color: "#1A1A1A",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 3,
          fontWeight: 500,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          color: "#5F6570",
          backgroundColor: "#FAFBFC",
          borderBottom: "1px solid #E3E6EB",
          whiteSpace: "nowrap",
          fontSize: 12.5,
        },
        body: {
          borderBottom: "1px solid #EEF0F3",
          fontSize: 13.5,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 8,
          borderRadius: 2,
          backgroundColor: "#EEF0F3",
        },
        bar: {
          borderRadius: 2,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiSelect: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontSize: 12,
        },
      },
    },
  },
});
