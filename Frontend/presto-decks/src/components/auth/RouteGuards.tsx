import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

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

export const OpsRoute = ({ children }: ProtectedRouteProps) => {
    const { user, loading } = useAuth();
    const location = useLocation();
    const [allowed, setAllowed] = useState<boolean | null>(null);

    useEffect(() => {
        let cancelled = false;

        const check = async () => {
            if (!user) return;

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                if (!cancelled) setAllowed(false);
                return;
            }

            try {
                await api.getOpsMe(session.access_token);
                if (!cancelled) setAllowed(true);
            } catch {
                if (!cancelled) setAllowed(false);
            }
        };

        check();
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    if (loading || (user && allowed === null)) {
        return (
            <div className="h-[calc(100vh-4rem)] w-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    if (!allowed) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};
