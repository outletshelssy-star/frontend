import { createTheme } from '@mui/material'

/**
 * Paleta de colores corporativos FRONTERA
 * Fuente: Manual de Imagen Corporativa
 */
export const brand = {
  // Colores principales
  magenta: '#E31C79', // PANTONE 512C  — botones, acentos, primario
  violet: '#833177', // PANTONE 213C  — acento intermedio
  blue: '#001871', // PANTONE 2748C — secundario, enlaces, bordes
  navy: '#201747', // PANTONE 275C  — sidebar, títulos, oscuro
  // Neutros corporativos
  black: '#222223', // Neutral Black — texto principal
  grayMedium: '#97999B', // Cool Gray 7C  — texto secundario
  grayDark: '#63666A', // Cool Gray 10C — bordes, deshabilitados
  // Derivados de uso frecuente
  magentaLight: '#fdf0f6', // Fondo suave magenta (headers tabla, chips)
  blueLight: '#f0f4ff', // Fondo suave azul
  // Alphas
  magentaA15: 'rgba(227, 28, 121, 0.15)',
  magentaA20: 'rgba(227, 28, 121, 0.20)',
  magentaA35: 'rgba(227, 28, 121, 0.35)',
  magentaA40: 'rgba(227, 28, 121, 0.40)',
}

const theme = createTheme({
  palette: {
    primary: {
      main: brand.magenta,
      light: brand.magentaLight,
      dark: brand.violet,
      contrastText: '#ffffff',
    },
    secondary: {
      main: brand.blue,
      light: brand.blueLight,
      dark: brand.navy,
      contrastText: '#ffffff',
    },
    text: {
      primary: brand.black,
      secondary: brand.grayMedium,
    },
  },

  typography: {
    fontFamily: "'Libre Franklin', 'Segoe UI', sans-serif",
    h1: { fontFamily: "'Jost', 'Libre Franklin', sans-serif" },
    h2: { fontFamily: "'Jost', 'Libre Franklin', sans-serif" },
    h3: { fontFamily: "'Jost', 'Libre Franklin', sans-serif" },
    h4: { fontFamily: "'Jost', 'Libre Franklin', sans-serif" },
    h5: { fontFamily: "'Jost', 'Libre Franklin', sans-serif" },
    h6: { fontFamily: "'Jost', 'Libre Franklin', sans-serif" },
  },

  shape: {
    borderRadius: 12,
  },

  components: {
    // ── Tabla: encabezado ─────────────────────────────────────────────────
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: brand.magentaLight,
          color: brand.navy,
          fontWeight: 700,
          borderBottom: `2px solid ${brand.magentaA20}`,
        },
      },
    },

    // ── Tabla: fila hover ─────────────────────────────────────────────────
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&.MuiTableRow-hover:hover': {
            backgroundColor: brand.magentaLight,
          },
        },
      },
    },

    // ── TableSortLabel: flecha del header ─────────────────────────────────
    MuiTableSortLabel: {
      styleOverrides: {
        root: {
          color: brand.navy,
          '&:hover': { color: brand.magenta },
          '&.Mui-active': {
            color: brand.navy,
            '& .MuiTableSortLabel-icon': { color: brand.magenta },
          },
        },
      },
    },

    // ── Botones ───────────────────────────────────────────────────────────
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
        },
        containedPrimary: {
          boxShadow: `0 4px 12px ${brand.magentaA20}`,
          '&:hover': {
            boxShadow: `0 6px 16px ${brand.magentaA35}`,
          },
        },
        outlinedSecondary: {
          borderColor: brand.magentaA40,
          color: brand.blue,
          '&:hover': {
            borderColor: brand.magenta,
            backgroundColor: brand.magentaLight,
          },
        },
      },
    },

    // ── Chip ──────────────────────────────────────────────────────────────
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },

    // ── Input / TextField focus ───────────────────────────────────────────
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brand.magenta,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          '&.Mui-focused': {
            color: brand.magenta,
          },
        },
      },
    },

    // ── Switch ────────────────────────────────────────────────────────────
    MuiSwitch: {
      styleOverrides: {
        switchBase: {
          '&.Mui-checked': {
            color: brand.magenta,
            '& + .MuiSwitch-track': {
              backgroundColor: brand.magenta,
            },
          },
        },
      },
    },

    // ── Checkbox ──────────────────────────────────────────────────────────
    MuiCheckbox: {
      styleOverrides: {
        root: {
          '&.Mui-checked': {
            color: brand.magenta,
          },
        },
      },
    },

    // ── Dialog ────────────────────────────────────────────────────────────
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: "'Jost', 'Libre Franklin', sans-serif",
          fontWeight: 700,
          color: brand.navy,
          borderBottom: `1px solid ${brand.magentaA20}`,
          paddingBottom: '12px',
        },
      },
    },

    // ── Circular Progress ─────────────────────────────────────────────────
    MuiCircularProgress: {
      defaultProps: {
        color: 'primary',
      },
    },
  },
})

export default theme
