import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-[var(--bg)]/80 backdrop-blur-md border-b border-border/50">
      <div className="container flex h-14 items-center justify-between">
        <Logo />

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            Tableau de bord
          </Link>
          <Link to="/create" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            Créer
          </Link>
          <Link to="/examples" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            Exemples
          </Link>
          <Link to="/pricing" className="text-sm font-medium text-zinc-950 hover:text-[#1fb6ff] transition-colors">
            Tarifs
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" asChild className="text-zinc-950 hover:text-zinc-950">
            <Link to="/auth">Connexion</Link>
          </Button>
          <Button size="sm" variant="solid" asChild>
            <Link to="/auth">Commencer</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

