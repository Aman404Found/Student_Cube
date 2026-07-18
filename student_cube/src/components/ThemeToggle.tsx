import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  // We determine if we're resolving to dark based on the system if it's set to system.
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="brutal-block-sm p-2 bg-paper flex items-center justify-center hover:scale-105 transition-transform brutal-focus"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-signal-orange" />
      ) : (
        <Moon className="h-5 w-5 text-ledger-blue" />
      )}
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
