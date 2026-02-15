import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient, User, Session } from "@supabase/supabase-js";

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dntcdhabtctfbylynlcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGNkaGFidGN0ZmJ5bHlubGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg1NTUsImV4cCI6MjA4MTYyNDU1NX0.9mtNdCOyR7qiEXjS0n7uC5Dq8hSS8s5gZ3wtxbre-R8";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Sync user with backend database (creates User + Subscription if missing)
        const syncUserWithBackend = async (accessToken: string) => {
            try {
                const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/v1";
                await fetch(`${API_BASE_URL}/subscription`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                });
                console.log('[Auth] User synced with backend');
            } catch (err) {
                console.warn('[Auth] Failed to sync user with backend:', err);
            }
        };

        // Check initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setSession(session ?? null);
            setLoading(false);
            // Sync with backend if user is logged in
            if (session?.access_token) {
                syncUserWithBackend(session.access_token);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            setSession(session ?? null);
            setLoading(false);
            // Sync with backend on sign in
            if (event === 'SIGNED_IN' && session?.access_token) {
                syncUserWithBackend(session.access_token);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
