import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { createClient, User } from "@supabase/supabase-js";

// Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dntcdhabtctfbylynlcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGNkaGFidGN0ZmJ5bHlubGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg1NTUsImV4cCI6MjA4MTYyNDU1NX0.9mtNdCOyR7qiEXjS0n7uC5Dq8hSS8s5gZ3wtxbre-R8";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check initial session
        supabase.auth.getUser().then(({ data: { user } }) => {
            setUser(user);
            setLoading(false);
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};
