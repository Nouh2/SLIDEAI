import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/contexts/AuthContext";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

export default function AuthPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Listen for auth state changes
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const returnTo = queryParams.get("returnTo") || "/dashboard";

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
      } else if (event === "SIGNED_IN" && session) {
        Analytics.trackEvent(ANALYTICS_EVENTS.AUTH.CATEGORY, ANALYTICS_EVENTS.AUTH.LOGIN);
        navigate(returnTo);
      }
    });

    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate(returnTo);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Dynamic localization based on current language
  const getLocalization = () => {
    return {
      variables: t('auth.ui', { returnObjects: true }) as any
    };
  };

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
            {t('auth.welcome')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('auth.subtitle')}
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
          localization={getLocalization()}
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>

      {/* Footer */}
    </div>
  );
}

