import { createTheme } from '@mui/material/styles';

// Versão simplificada e mais direta do nosso tema.
// Aqui, nós definimos as cores que queremos sem herdar nada.
export const theme = createTheme({
  palette: {
    primary: {
      main: '#FFA726', // Laranja tangerina mais claro
    },
    secondary: {
      main: '#484848', // Um cinza para contraste
    },
    // O modo 'light' (claro) é o padrão, mas é bom ser explícito.
    mode: 'light', 
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        colorPrimary: {
          backgroundColor: '#F28500',
        },
      },
    },
  },
});