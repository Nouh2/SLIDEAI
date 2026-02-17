// src/App.tsx
import { BrowserRouter } from "react-router-dom";
import { useLocation } from "react-router-dom";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { CookieConsent } from "@/components/common/CookieConsent";
import { GoogleAnalytics } from "@/components/common/GoogleAnalytics";
import { Analytics } from "@vercel/analytics/react";

import { Toaster } from "@/components/ui/toaster";

function AppContent() {
  const location = useLocation();
  const isQaRoute = location.pathname.startsWith("/qa/");

  if (isQaRoute) {
    return (
      <>
        <main className="min-h-dvh bg-transparent text-foreground">
          <AnimatedRoutes />
        </main>
        <Toaster />
      </>
    );
  }

  return (
    <>
      <AnimatedBackground />
      <div className="min-h-dvh flex flex-col bg-transparent text-foreground">
        <Header />
        <main className="flex-1">
          <AnimatedRoutes />
        </main>
        <Footer />
      </div>
      <Analytics />
      <GoogleAnalytics />
      <CookieConsent />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
