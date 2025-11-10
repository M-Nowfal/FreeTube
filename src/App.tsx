import { useEffect, useState } from "react"
import InputVideoUrl from "./components/InputVideoUrl"
import PlayButton from "./components/PlayButton"
import ThemeToggler from "./components/ThemeToggler"
import VideoPlayer from "./components/VideoPlayer"

const App = () => {
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  const [theme, setTheme] = useState<"light" | "dark">(savedTheme || "dark");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    const color = theme === "dark" ? "#000000" : "#ffffff"

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", color)
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light");
  };

  const handlePlay = () => {
    setVideoUrl(inputUrl.trim());
  }

  return (
    <div className={`
      flex flex-col justify-center items-center min-h-svh 
      ${theme === "dark" ? "bg-black text-white" : "bg-white"}
    `}>
      <div className="absolute top-3 right-5">
        <ThemeToggler {...{ theme, toggleTheme }} />
      </div>
      <div className="flex items-center gap-3">
        <img src="/favicon.svg" alt="freetube" width={60} height={60} className={theme === "dark" ? "invert" : ""} />
        <h1 className="mb-2 font-bold text-2xl lg:text-5xl">FreeTube</h1>
      </div>
      <div className={`
        border p-3 rounded-lg w-[90%] max-w-7xl
        ${theme === "dark" ? "border-slate-800" : "border-gray-300"}
      `}>
        <div className="flex items-center gap-3 border border-inherit p-0.5 rounded-lg">
          <InputVideoUrl {...{ inputUrl, setInputUrl, handlePlay }} />
          <PlayButton {...{ handlePlay, theme }} />
        </div>

        <div className="mt-5 rounded-lg">
          <VideoPlayer {...{ videoUrl, theme, setVideoUrl }} />
        </div>
      </div>
    </div>
  )
}

export default App
