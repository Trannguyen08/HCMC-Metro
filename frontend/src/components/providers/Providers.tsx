"use client";

import * as React from "react";
import { ThemeProvider } from "next-themes";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export function Providers({ children }: { children: React.ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  
  return (
    <GoogleOAuthProvider clientId={clientId}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        {children}
        <ProgressBar
          height="3px"
          color="#2563eb"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </ThemeProvider>
    </GoogleOAuthProvider>
  );
}

