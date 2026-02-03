import '@/lib/errorReporter';
import { enableMapSet } from "immer";
enableMapSet();
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import '@/index.css'
import { HomePage } from '@/pages/HomePage'
import { AgentAtelier } from '@/pages/AgentAtelier';
import { CommandDeck } from '@/pages/CommandDeck';
import { SkillForge } from '@/pages/SkillForge';
import { Toaster } from '@/components/ui/sonner';
const queryClient = new QueryClient();
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/atelier",
    element: <AgentAtelier />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/deck",
    element: <CommandDeck />,
    errorElement: <RouteErrorBoundary />,
  },
  {
    path: "/forge",
    element: <SkillForge />,
    errorElement: <RouteErrorBoundary />,
  },
]);
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
        <Toaster richColors closeButton position="top-right" />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)