import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { InsforgeProvider } from '@insforge/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { insforge } from './lib/insforge';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <InsforgeProvider client={insforge}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </InsforgeProvider>
    </BrowserRouter>
  </StrictMode>
);
