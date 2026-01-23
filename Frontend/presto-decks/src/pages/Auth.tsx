import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/contexts/AuthContext";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";

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
    if (i18n.language === 'en') {
      return {
        variables: {
          sign_in: {
            email_label: 'Email',
            password_label: 'Password',
            button_label: 'Sign in',
            loading_button_label: 'Signing in...',
            email_input_placeholder: 'you@example.com',
            password_input_placeholder: 'Your password',
            link_text: 'Already have an account? Sign in',
          },
          sign_up: {
            email_label: 'Email',
            password_label: 'Password',
            button_label: 'Create account',
            loading_button_label: 'Creating...',
            email_input_placeholder: 'you@example.com',
            password_input_placeholder: 'Choose a password',
            link_text: "Don't have an account? Sign up",
          },
          forgotten_password: {
            email_label: 'Email',
            button_label: 'Send reset link',
            loading_button_label: 'Sending...',
            link_text: 'Forgot password?',
          },
        },
      };
    }
    // French by default
    return {
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
      <p className="mt-8 text-center text-sm text-muted-foreground">
        {t('auth.trustNote')}
      </p>
    </div>
  );
}

