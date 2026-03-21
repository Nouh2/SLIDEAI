import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/layout/PageTransition";
import { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { ProtectedRoute, GuestRoute, OpsRoute } from "@/components/auth/RouteGuards";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Create = lazy(() => import("@/pages/Create"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Editor = lazy(() => import("@/pages/Editor"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Examples = lazy(() => import("@/pages/Examples"));
const Account = lazy(() => import("@/pages/Account"));
const OpsDashboard = lazy(() => import("@/pages/OpsDashboard"));
const Auth = lazy(() => import("@/pages/Auth"));
const Brand = lazy(() => import("@/pages/Brand"));
const BrandKitPage = lazy(() => import("@/pages/BrandKitPage"));
const PrivacyPage = lazy(() => import("@/pages/PrivacyPage"));
const TermsPage = lazy(() => import("@/pages/TermsPage"));
const GdprPage = lazy(() => import("@/pages/GdprPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const JoinPage = lazy(() => import("@/pages/JoinPage"));
const ViewPage = lazy(() => import("@/pages/ViewPage"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const BlogCategory = lazy(() => import("@/pages/BlogCategory"));
const BlogPersona = lazy(() => import("@/pages/BlogPersona"));
const ChartDemoPage = lazy(() => import("@/pages/ChartDemo"));
const VisualRegressionPage = lazy(() => import("@/pages/VisualRegression"));

const PDFToPowerPoint = lazy(() => import("@/pages/PDFToPowerPoint"));
const OrgSettings = lazy(() => import("@/pages/OrgSettings"));
const AdminBroadcast = lazy(() => import("@/pages/AdminBroadcast"));
const GenerateurPowerPointIA = lazy(() => import("@/pages/GenerateurPowerPointIA"));
const CreerPowerPointAvecIA = lazy(() => import("@/pages/CreerPowerPointAvecIA"));
const OutilIAPresentation = lazy(() => import("@/pages/OutilIAPresentation"));

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
                    {/* PUBLIC ROUTES - Accessible to everyone */}
                    <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                    <Route path="/en/pricing" element={<PageTransition><Pricing /></PageTransition>} />
                    <Route path="/brand" element={<PageTransition><Brand /></PageTransition>} />
                    <Route path="/brand-kit" element={
                        <ProtectedRoute>
                            <PageTransition><BrandKitPage /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/privacy" element={<PageTransition><PrivacyPage /></PageTransition>} />
                    <Route path="/terms" element={<PageTransition><TermsPage /></PageTransition>} />
                    <Route path="/gdpr" element={<PageTransition><GdprPage /></PageTransition>} />
                    <Route path="/blog" element={<PageTransition><Blog /></PageTransition>} />
                    <Route path="/en/blog" element={<PageTransition><Blog /></PageTransition>} />
                    <Route path="/blog/c/:category" element={<PageTransition><BlogCategory /></PageTransition>} />
                    <Route path="/en/blog/c/:category" element={<PageTransition><BlogCategory /></PageTransition>} />
                    <Route path="/blog/metier/:persona" element={<PageTransition><BlogPersona /></PageTransition>} />
                    <Route path="/en/blog/metier/:persona" element={<PageTransition><BlogPersona /></PageTransition>} />
                    <Route path="/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
                    <Route path="/en/blog/:slug" element={<PageTransition><BlogPost /></PageTransition>} />
                    <Route path="/charts-demo" element={<PageTransition><ChartDemoPage /></PageTransition>} />
                    <Route path="/qa/visual-regression" element={<PageTransition><VisualRegressionPage /></PageTransition>} />
                    <Route path="/pdf-to-powerpoint" element={<PageTransition><PDFToPowerPoint /></PageTransition>} />
                    <Route path="/generateur-powerpoint-ia" element={<PageTransition><GenerateurPowerPointIA /></PageTransition>} />
                    <Route path="/creer-powerpoint-avec-ia" element={<PageTransition><CreerPowerPointAvecIA /></PageTransition>} />
                    <Route path="/outil-ia-presentation" element={<PageTransition><OutilIAPresentation /></PageTransition>} />


                    {/* GUEST ONLY ROUTES - Redirect to dashboard if logged in */}
                    <Route path="/" element={
                        <GuestRoute>
                            <PageTransition><Home /></PageTransition>
                        </GuestRoute>
                    } />
                    <Route path="/en" element={
                        <GuestRoute>
                            <PageTransition><Home /></PageTransition>
                        </GuestRoute>
                    } />
                    <Route path="/auth" element={
                        <GuestRoute>
                            <PageTransition><Auth /></PageTransition>
                        </GuestRoute>
                    } />
                    <Route path="/examples" element={
                        <GuestRoute>
                            <PageTransition><Examples /></PageTransition>
                        </GuestRoute>
                    } />
                    <Route path="/en/examples" element={
                        <GuestRoute>
                            <PageTransition><Examples /></PageTransition>
                        </GuestRoute>
                    } />

                    {/* PROTECTED ROUTES - Require authentication */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <PageTransition><Dashboard /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/create" element={
                        <ProtectedRoute>
                            <PageTransition><Create /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/editor" element={
                        <ProtectedRoute>
                            <PageTransition><Editor /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/editor/:traceId" element={
                        <ProtectedRoute>
                            <PageTransition><Editor /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/account" element={
                        <ProtectedRoute>
                            <PageTransition><Account /></PageTransition>
                        </ProtectedRoute>
                    } />
                    <Route path="/ops" element={
                        <OpsRoute>
                            <PageTransition><OpsDashboard /></PageTransition>
                        </OpsRoute>
                    } />
                    <Route path="/ops/broadcast" element={
                        <OpsRoute>
                            <PageTransition><AdminBroadcast /></PageTransition>
                        </OpsRoute>
                    } />
                    <Route path="/org/:orgId/settings" element={
                        <ProtectedRoute>
                            <PageTransition><OrgSettings /></PageTransition>
                        </ProtectedRoute>
                    } />

                    {/* Compat Lovable */}
                    <Route path="/app" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/app/:traceId" element={
                        <ProtectedRoute>
                            <PageTransition><Editor /></PageTransition>
                        </ProtectedRoute>
                    } />

                    {/* SHARE LINK ROUTE */}
                    <Route path="/share/:token" element={
                        <PageTransition><JoinPage /></PageTransition>
                    } />

                    {/* VIEW-ONLY LINK ROUTE (with token) */}
                    <Route path="/view/:token" element={
                        <PageTransition><ViewPage /></PageTransition>
                    } />

                    {/* VIEW-ONLY BY ID ROUTE (from dashboard) */}
                    <Route path="/viewer" element={
                        <ProtectedRoute>
                            <PageTransition><ViewPage /></PageTransition>
                        </ProtectedRoute>
                    } />

                    {/* PASSWORD RESET ROUTE */}
                    <Route path="/reset-password" element={
                        <PageTransition><ResetPassword /></PageTransition>
                    } />

                    {/* 404 */}
                    <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
                </Routes>
            </Suspense>
        </AnimatePresence>
    );
};
