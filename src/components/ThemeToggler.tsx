import { useContext } from "react";
import { Moon, Sun } from "./Icons";
import { ThemeContext } from "../context/ThemeProvider";

const ThemeToggler = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  
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