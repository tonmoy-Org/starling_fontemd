import { ThemeProvider } from '@mui/material';
import { AuthProvider } from './auth/AuthProvider';
import { AppRoutes } from './routes/AppRoutes';

import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

import CustomTheme from './styles/theme';
import { HelmetProvider } from 'react-helmet-async';
import { GlobalSnackbarProvider } from './context/GlobalSnackbarContext';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <ThemeProvider theme={CustomTheme}>
      <HelmetProvider>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <GlobalSnackbarProvider>
              <AppRoutes />
            </GlobalSnackbarProvider>
          </QueryClientProvider>
        </AuthProvider>
      </HelmetProvider>
    </ThemeProvider>
  );
}

export default App;
