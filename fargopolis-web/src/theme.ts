import { createTheme } from '@mui/material/styles';

const theme = createTheme({
    palette: {
        secondary: {
            main: '#f43f5e',
        },
    },
    typography: {
        fontFamily: 'Inter, sans-serif',
    },
    spacing: 8, // 1 unit = 8px
});

export default theme;
