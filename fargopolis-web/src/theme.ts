import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        primary: {
            main: '#2c4a3a',      // pine-700
            dark: '#1f3328',      // pine-900
            light: '#4a6e54',     // pine-500
            contrastText: '#fdfbf6',
        },
        secondary: {
            main: '#c25a30',      // ember-500
            dark: '#a04a26',      // ember-700
            light: '#d97a4a',     // ember-400
            contrastText: '#fdfbf6',
        },
        background: {
            default: '#faf6ed',   // parchment-50
            paper: '#fdfbf6',     // parchment-0
        },
        text: {
            primary: '#1c1a17',   // ink-900
            secondary: '#3a352c', // ink-700
            disabled: '#8a847b',  // stone-400
        },
        error: {
            main: '#b03a2e',
        },
        warning: {
            main: '#c79234',
        },
        success: {
            main: '#4a6e54',
        },
        info: {
            main: '#4a5d6a',
        },
        divider: 'rgba(28, 26, 23, 0.14)',
    },
    typography: {
        fontFamily: 'Inter, "Helvetica Neue", system-ui, -apple-system, sans-serif',
        h1: {
            fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
            fontWeight: 500,
        },
        h2: {
            fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
            fontWeight: 500,
        },
        h3: {
            fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
            fontWeight: 500,
        },
        h4: {
            fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
            fontWeight: 500,
        },
        h5: {
            fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
            fontWeight: 500,
        },
        h6: {
            fontFamily: '"Fraunces", "Iowan Old Style", Georgia, serif',
            fontWeight: 500,
        },
    },
    spacing: 8,
    shape: {
        borderRadius: 4,
    },
    components: {
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontFamily: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace',
                    fontSize: '11px',
                    letterSpacing: '0.06em',
                },
            },
        },
        MuiTab: {
            styleOverrides: {
                root: {
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                },
            },
        },
    },
});

export default theme;
