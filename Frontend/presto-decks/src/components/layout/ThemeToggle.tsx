import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export const ThemeToggle = () => {
  const { mode, toggleMode } = useTheme();

  return (
    <button
      onClick={toggleMode}
      className="relative w-14 h-7 rounded-full bg-surface-highlight border border-border hover:border-primary/50 transition-colors duration-200 flex items-center px-1"
      aria-label="Toggle theme"
    >
      {/* Animated slider */}
      <motion.div
        className="absolute w-5 h-5 rounded-full bg-gradient-to-br from-primary to-secondary shadow-md flex items-center justify-center"
        animate={{
          x: mode === 'dark' ? 0 : 28,
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
        }}
      >
        {mode === 'dark' ? (
          <Moon className="w-3 h-3 text-white" />
        ) : (
          <Sun className="w-3 h-3 text-white" />
        )}
      </motion.div>

      {/* Icons on track */}
      <div className="w-full flex justify-between px-1 pointer-events-none">
        <Moon className={`w-3 h-3 transition-opacity ${mode === 'dark' ? 'opacity-0' : 'opacity-50'}`} />
        <Sun className={`w-3 h-3 transition-opacity ${mode === 'light' ? 'opacity-0' : 'opacity-50'}`} />
      </div>
    </button>
  );
};
