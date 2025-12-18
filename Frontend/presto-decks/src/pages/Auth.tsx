import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://dntcdhabtctfbylynlcr.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRudGNkaGFidGN0ZmJ5bHlubGNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDg1NTUsImV4cCI6MjA4MTYyNDU1NX0.9mtNdCOyR7qiEXjS0n7uC5Dq8hSS8s5gZ3wtxbre-R8";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AuthPage() {
  const navigate = useNavigate();

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        navigate("/dashboard");
      }
    });

    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo */}
      <Link to="/" className="mb-8">
        <span className="font-bold text-3xl text-gradient">
          SlideAI
        </span>
      </Link>

      {/* Auth Card */}
      <div className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Bienvenue
          </h1>
          <p className="text-muted-foreground text-sm">
            Connectez-vous ou créez un compte pour continuer
          </p>
        </div>

        {/* Supabase Auth UI Widget */}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#1fb6ff', // --primary (cyan blue)
                  brandAccent: '#0ea5e9', // Slightly darker cyan
                  inputBackground: 'hsl(240 5% 96%)', // --surface
                  inputText: 'hsl(240 10% 3.9%)', // --text
                  inputBorder: 'hsl(240 6% 90%)', // --border
                  inputBorderFocus: '#1fb6ff', // --primary
                  inputBorderHover: 'hsl(240 5% 85%)', // --border-highlight
                  inputLabelText: 'hsl(240 10% 3.9%)', // --text
                  anchorTextColor: '#1fb6ff', // --primary
                  anchorTextHoverColor: '#0ea5e9',
                },
                fonts: {
                  bodyFontFamily: 'Inter, sans-serif',
                  inputFontFamily: 'Inter, sans-serif',
                  buttonFontFamily: 'Outfit, sans-serif',
                  labelFontFamily: 'Inter, sans-serif',
                },
                radii: {
                  borderRadiusButton: '0.75rem',
                  inputBorderRadius: '0.75rem',
                },
                space: {
                  inputPadding: '0.75rem',
                  buttonPadding: '0.75rem',
                },
              },
            },
            style: {
              button: {
                fontWeight: '600',
                textTransform: 'none',
              },
              anchor: {
                fontWeight: '500',
              },
              container: {
                gap: '1rem',
              },
              label: {
                fontWeight: '500',
                marginBottom: '0.25rem',
              },
            },
          }}
          theme="light"
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Email',
                password_label: 'Mot de passe',
                button_label: 'Se connecter',
                loading_button_label: 'Connexion...',
                email_input_placeholder: 'vous@exemple.com',
                password_input_placeholder: 'Votre mot de passe',
                link_text: 'Vous avez déjà un compte ? Connectez-vous',
              },
              sign_up: {
                email_label: 'Email',
                password_label: 'Mot de passe',
                button_label: 'Créer mon compte',
                loading_button_label: 'Création...',
                email_input_placeholder: 'vous@exemple.com',
                password_input_placeholder: 'Choisissez un mot de passe',
                link_text: 'Pas encore de compte ? Inscrivez-vous',
              },
              forgotten_password: {
                email_label: 'Email',
                button_label: 'Envoyer le lien de réinitialisation',
                loading_button_label: 'Envoi...',
                link_text: 'Mot de passe oublié ?',
              },
            },
          }}
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Déjà 10 000+ professionnels font confiance à SlideAI
      </p>
    </div>
  );
}
