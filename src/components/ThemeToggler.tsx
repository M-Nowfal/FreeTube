import { Moon, Sun } from "./Icons";

interface ThemeTogglerProps {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const ThemeToggler = ({ theme, toggleTheme }: ThemeTogglerProps) => {
  return (
    <button
      className={`font-semibold rounded-md cursor-pointer transition-all active:scale-80`}
      onClick={toggleTheme}
    >
      {theme === "dark" ? (
        <Sun />
      ) : (
        <Moon />
      )}
    </button>
  )
}

export default ThemeToggler