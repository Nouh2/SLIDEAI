import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { LogoConcept as Logo } from "./LogoConcept";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User as UserIcon, LayoutDashboard, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

export const Header = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navLinks = (
    <>
      {user && (
        <Link
          to="/dashboard"
          className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors"
          onClick={() => setOpen(false)}
        >
          {t('header.dashboard')}
        </Link>
      )}
      <Link
        to="/create"
        className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors"
        onClick={() => setOpen(false)}
      >
        {t('header.create')}
      </Link>
      <Link
        to="/examples"
        className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors"
        onClick={() => setOpen(false)}
      >
        {t('header.examples')}
      </Link>
      <Link
        to="/pricing"
        className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors"
        onClick={() => setOpen(false)}
      >
        {t('header.pricing')}
      </Link>
      <Link
        to="/blog"
        className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors"
        onClick={() => setOpen(false)}
      >
        Blog
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg)]/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex h-14 items-center justify-between">
        <Logo />

        {/* Desktop Navigation */}
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
          <Link to="/blog" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            Blog
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <div className="hidden md:flex items-center space-x-3">
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
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('header.menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="text-left">Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  {navLinks}
                  <div className="h-px bg-border my-4" />
                  {user ? (
                    <>
                      <Link
                        to="/account"
                        className="flex items-center gap-2 text-sm font-medium"
                        onClick={() => setOpen(false)}
                      >
                        <UserIcon className="h-4 w-4" />
                        {t('header.myAccount')}
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          handleSignOut();
                          setOpen(false);
                        }}
                        className="justify-start px-0 text-zinc-500 hover:text-red-500 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {t('account.signOut')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" asChild className="justify-start px-0">
                        <Link to="/auth" onClick={() => setOpen(false)}>{t('header.login')}</Link>
                      </Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
