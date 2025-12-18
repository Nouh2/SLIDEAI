import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

interface ProtectedRouteProps {
    children: ReactNode;
}

/**
 * ProtectedRoute - Requires user to be logged in
 * Redirects to /auth if not authenticated
 */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        // Redirect to auth, saving the attempted location
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    return <>{children}</>;
};

/**
 * GuestRoute - Only accessible when NOT logged in
 * Redirects to /dashboard if already authenticated
 */
export const GuestRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (user) {
        // Already logged in, redirect to dashboard
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
