// src/App.tsx
import { BrowserRouter } from "react-router-dom";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AnimatedBackground } from "@/components/layout/AnimatedBackground";
import { AnimatedRoutes } from "@/components/layout/AnimatedRoutes";
import { CookieConsent } from "@/components/common/CookieConsent";

import { Toaster } from "@/components/ui/toaster";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AnimatedBackground />
          <div className="min-h-dvh flex flex-col bg-transparent text-foreground">
            <Header />
            <main className="flex-1">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
          <CookieConsent />
          <Toaster />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
