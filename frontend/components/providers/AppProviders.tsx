"use client";

import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "./ThemeProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3200,
          style: {
            background: "#171717",
            color: "#fff",
            borderRadius: "14px",
            boxShadow: "0 18px 55px rgba(0,0,0,.16)"
          }
        }}
      />
    </ThemeProvider>
  );
}
