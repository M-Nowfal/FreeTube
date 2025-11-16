import { useEffect, useState } from "react"
import InputVideoUrl from "./components/InputVideoUrl"
import PlayButton from "./components/PlayButton"
import ThemeToggler from "./components/ThemeToggler"
import VideoPlayer from "./components/VideoPlayer"
import History from "./components/History"
import { getYoutubeTitle, isYoutubeUrl, toEmbedUrl } from "./lib"

const App = () => {
  const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
  const [theme, setTheme] = useState<"light" | "dark">(savedTheme || "dark");
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [history, setHistory] = useState<Array<{ url: string; title: string }>>(JSON.parse(window.localStorage.getItem("history") || "[]"));

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    const color = theme === "dark" ? "#000000" : "#ffffff"

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", color)
    }
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");

  const handlePlay = (url?: string) => {
    if (!inputUrl.trim() && !url) return;
    setVideoUrl(url || inputUrl.trim());
    addHistory(url || inputUrl.trim());
  };

  const addHistory = async (url: string) => {
    if (!isYoutubeUrl(url)) return;
    const embedUrl = toEmbedUrl(url);
    const title = await getYoutubeTitle(url) || "";
    if (history.some(h => h.url === embedUrl || h.title === title)) return;
    const storedHistory = JSON.parse(window.localStorage.getItem("history") || "[]");
    window.localStorage.setItem("history", JSON.stringify([{ url: embedUrl, title }, ...storedHistory]));
    setHistory(prev => [{ url: embedUrl, title }, ...prev]);
  };

  const removeHistory = (id: number) => {
    setHistory(prev => {
      const updatedHistory = prev.filter((_, i) => i !== id);
      window.localStorage.setItem("history", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
  }

  const clearHistory = () => {
    window.localStorage.removeItem("history");
    setHistory([]);
  }

  return (
    <div className={`
      flex flex-col justify-center items-center min-h-svh
      ${theme === "dark" ? "bg-black text-white" : "bg-white"}
    `}>
      <div className="absolute top-3 right-5">
        <ThemeToggler {...{ theme, toggleTheme }} />
      </div>
      <div className="flex items-center gap-3 mb-3">
        <img src="/favicon.svg" alt="freetube" className={`${theme === "dark" ? "invert" : ""} w-12 h-12 md:w-15 md:h-15 lg:w-20 lg:h-20`} />
        <h1 className="font-bold text-2xl md:text-3xl lg:text-5xl">FreeTube</h1>
      </div>
      <div className={`w-full flex flex-col xl:flex-row place-items-center justify-center xl:items-start gap-5 lg:px-3`}>
        <div className={`
          border p-3 rounded-lg w-[97%] max-w-7xl
          ${theme === "dark" ? "border-slate-800" : "border-gray-300"}
        `}>
          <div className="flex items-center gap-3 border border-inherit p-0.5 rounded-lg">
            <InputVideoUrl {...{ inputUrl, setInputUrl, handlePlay, theme }} />
            <PlayButton {...{ handlePlay, theme }} />
          </div>

          <div className="mt-5 rounded-lg">
            <VideoPlayer {...{ videoUrl, theme, setVideoUrl }} />
          </div>
        </div>
        {history.length > 0 && (
          <History {...{ 
            history, removeHistory, 
            theme, clearHistory,
            handlePlay
          }} />
        )}
      </div>
    </div>
  )
}

export default App
