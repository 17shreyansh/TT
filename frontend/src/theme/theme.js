import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#2962ff',
      light: '#768fff',
      dark: '#0039cb',
    },
    secondary: {
      main: '#00e676', // Buy signal green
    },
    error: {
      main: '#ff1744', // Sell signal red
    },
    background: {
      default: '#02040a', // Deep premium midnight
      paper: 'rgba(10, 14, 23, 0.65)', // Semi-transparent paper for glassmorphism
    },
    text: {
      primary: '#f8f9fa',
      secondary: '#aab2c0',
    },
    divider: 'rgba(255, 255, 255, 0.05)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontFamily: '"JetBrains Mono", monospace',
      fontWeight: 800,
      letterSpacing: '-0.5px',
    },
    h5: {
      fontWeight: 700,
      letterSpacing: '-0.3px',
    },
    h6: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    body1: {
      lineHeight: 1.6,
    },
    body2: {
      fontFamily: '"Inter", sans-serif',
    }
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'radial-gradient(circle at 50% 0%, #0c1631 0%, #02040a 60%)',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        // Premium scrollbar
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: 'rgba(0, 0, 0, 0.2)',
        },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: 'rgba(255, 255, 255, 0.2)',
        },
        // Animations
        '@keyframes pulse-animation': {
          '0%': { transform: 'scale(0.95)', opacity: 0.8 },
          '50%': { transform: 'scale(1.1)', opacity: 1 },
          '100%': { transform: 'scale(0.95)', opacity: 0.8 },
        },
        '.pulse-animation': {
          animation: 'pulse-animation 2s infinite ease-in-out',
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 4px 24px -4px rgba(0,0,0,0.4)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(16px)',
          transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          '&:hover': {
            borderColor: 'rgba(41, 98, 255, 0.4)',
            transform: 'translateY(-3px)',
            boxShadow: '0 12px 32px -4px rgba(0,0,0,0.6), 0 0 15px rgba(41, 98, 255, 0.15)'
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          transition: 'all 0.2s ease',
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #2962ff 0%, #0039cb 100%)',
          boxShadow: '0 4px 14px 0 rgba(41, 98, 255, 0.39)',
          '&:hover': {
            boxShadow: '0 6px 20px rgba(41, 98, 255, 0.5)',
            transform: 'translateY(-1px)'
          }
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(6, 10, 18, 0.85)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.03)'
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(6, 10, 18, 0.75)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
          boxShadow: 'none'
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.03)',
          padding: '16px',
        },
        head: {
          fontWeight: 700,
          color: '#aab2c0',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          letterSpacing: '0.5px'
        }
      }
    }
  }
});

export default theme;
