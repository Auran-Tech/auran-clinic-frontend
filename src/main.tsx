import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { App } from "./app/App";
import { AppErrorBoundary } from "./app/AppErrorBoundary";
import { I18nProvider } from "./lib/i18n/i18n";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AppErrorBoundary>
          <BrowserRouter><App /></BrowserRouter>
        </AppErrorBoundary>
      </I18nProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
