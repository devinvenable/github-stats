import { createTheme } from '@mui/material/styles';

// Enhanced theme inspired by ChatGPT UI styles
const theme = createTheme({
  palette: {
    primary: {
      main: '#10a37f', // A teal-like primary color
    },
    secondary: {
      main: '#f1f3f4', // Light grey secondary color
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#202123', // Dark text
      secondary: '#5f6368', // Lighter text
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    // Additional typography options can be added here
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Use natural text instead of uppercase
          borderRadius: 8, // Slightly rounded corners
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)', // Soft shadow
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
