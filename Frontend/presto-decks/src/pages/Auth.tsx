import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/contexts/AuthContext";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Analytics, ANALYTICS_EVENTS } from "@/lib/analytics";

const sanitizeInternalPath = (path: string | null | undefined): string => {
  if (!path) return "/dashboard";
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    return "/dashboard";
  }

  if (!decoded.startsWith("/") || decoded.startsWith("//")) {
    return "/dashboard";
  }

  return decoded;
};

export default function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const queryParams = new URLSearchParams(location.search);
  const queryReturnTo = queryParams.get("returnTo");
  const stateFrom = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from;
  const stateReturnTo = stateFrom?.pathname
    ? `${stateFrom.pathname}${stateFrom.search || ""}${stateFrom.hash || ""}`
    : null;
  const returnTo = sanitizeInternalPath(queryReturnTo || stateReturnTo || "/dashboard");

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        navigate("/reset-password");
      } else if (event === "SIGNED_IN" && session) {
        const createdAt = session.user.created_at ? new Date(session.user.created_at).getTime() : 0;
        const lastSignInAt = session.user.last_sign_in_at ? new Date(session.user.last_sign_in_at).getTime() : 0;
        const isLikelySignup = createdAt > 0 && lastSignInAt > 0 && Math.abs(lastSignInAt - createdAt) < 10000;

        Analytics.trackEvent(
          ANALYTICS_EVENTS.AUTH.CATEGORY,
          isLikelySignup ? ANALYTICS_EVENTS.AUTH.SIGN_UP : ANALYTICS_EVENTS.AUTH.LOGIN
        );
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
  }, [navigate, returnTo]);

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
          providers={["google"]}
          localization={getLocalization()}
          redirectTo={`${window.location.origin}${returnTo}`}
        />
      </div>

      {/* Footer */}
    </div>
  );
}
