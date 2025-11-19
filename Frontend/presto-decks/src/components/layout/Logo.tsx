import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

export const Logo = () => {
  return (
    <Link to="/" className="group flex items-center gap-2">
      <Sparkles className="h-6 w-6 text-[hsl(var(--accent))] group-hover:text-[hsl(var(--primary))] transition-colors" />
      <span className="font-bold text-xl">
        <span className="text-[hsl(var(--accent))] group-hover:text-[hsl(var(--primary))] transition-colors">AI</span>
        <span className="text-[hsl(var(--text))] group-hover:text-[hsl(var(--primary))] transition-colors"> Slide</span>
      </span>
    </Link>
  );
};
