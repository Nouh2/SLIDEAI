import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Create = lazy(() => import("@/pages/Create"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Editor = lazy(() => import("@/pages/Editor"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Examples = lazy(() => import("@/pages/Examples"));
const Account = lazy(() => import("@/pages/Account"));
const Auth = lazy(() => import("@/pages/Auth"));
const Brand = lazy(() => import("@/pages/Brand"));
const Privacy = lazy(() => import("@/pages/Privacy"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const PageLoader = () => (
    <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);

export const AnimatedRoutes = () => {
    const location = useLocation();

    return (
        <AnimatePresence mode="wait">
            <Suspense fallback={<PageLoader />}>
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<PageTransition><Home /></PageTransition>} />
                    <Route path="/create" element={<PageTransition><Create /></PageTransition>} />
                    <Route path="/dashboard" element={<PageTransition><Dashboard /></PageTransition>} />

                    {/* Nouvelle route pour génération IA */}
                    <Route path="/editor" element={<PageTransition><Editor /></PageTransition>} />
                    <Route path="/editor/:traceId" element={<PageTransition><Editor /></PageTransition>} />

                    {/* Compat Lovable */}
                    <Route path="/app" element={<Navigate to="/editor" replace />} />
                    <Route path="/app/:traceId" element={<PageTransition><Editor /></PageTransition>} />

                    <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                    <Route path="/examples" element={<PageTransition><Examples /></PageTransition>} />
                    <Route path="/account" element={<PageTransition><Account /></PageTransition>} />
                    <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
                    <Route path="/brand" element={<PageTransition><Brand /></PageTransition>} />
                    <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};
