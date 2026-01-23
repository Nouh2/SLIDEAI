import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User as UserIcon, LayoutDashboard } from "lucide-react";

export const Header = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg)]/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex h-14 items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center space-x-6">
          {user && (
            <Link to="/dashboard" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
              {t('header.dashboard')}
            </Link>
          )}
          <Link to="/create" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            {t('header.create')}
          </Link>
          {!user && (
            <Link to="/examples" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
              {t('header.examples')}
            </Link>
          )}
          <Link to="/pricing" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            {t('header.pricing')}
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <LanguageSwitcher />

          {loading ? (
            // Loading skeleton
            <div className="w-24 h-9 bg-muted animate-pulse rounded-lg"></div>
          ) : user ? (
            // Logged in state
            <>
              <Button variant="ghost" size="sm" asChild className="text-zinc-950 hover:text-zinc-950">
                <Link to="/dashboard" className="flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('header.dashboard')}
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild className="text-zinc-950 hover:text-zinc-950">
                <Link to="/account" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  {t('header.myAccount')}
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-zinc-500 hover:text-red-500 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            // Logged out state
            <>
              <Button variant="ghost" size="sm" asChild className="text-zinc-950 hover:text-zinc-950">
                <Link to="/auth">{t('header.login')}</Link>
              </Button>
              <Button size="sm" variant="solid" asChild>
                <Link to="/auth">{t('header.getStarted')}</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
