import { createContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type IThemeContext = {
  theme: Theme;
  toggleTheme: () => void;
};

export const ThemeContext = createContext<IThemeContext>({ theme: "dark", toggleTheme: () => { } });

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "dark";
  });

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    const color = theme === "dark" ? "#000000" : "#ffffff"

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", color)
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
