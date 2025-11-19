import { useContext, useEffect, useState } from "react"
import InputVideoUrl from "../components/InputVideoUrl"
import PlayButton from "../components/PlayButton"
import VideoPlayer from "../components/VideoPlayer"
import History from "../components/History"
import { getYoutubeTitle, isYoutubeUrl, toEmbedUrl } from "../lib"
import { ThemeContext } from "../context/ThemeProvider"
import { AuthContext } from "../context/AuthProvider"
import axios, { AxiosError } from "axios"

const Home = () => {
  const { theme } = useContext(ThemeContext);
  const { auth, toggleAuth } = useContext(AuthContext);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [inputUrl, setInputUrl] = useState<string>("");
  const [history, setHistory] = useState<Array<{ url: string; title: string }>>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loading2, setLoading2] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      if (auth.isAuth) {
        setLoading(true);
        try {
          const res = await axios.get(`${import.meta.env.VITE_API_URL}/history?username=${auth.username}`);
          if (res.status === 200)
            setHistory(res.data.history);
        } catch (err: unknown) {
          if (err instanceof AxiosError && err.status === 404) {
            localStorage.removeItem("auth");
            toggleAuth(false, "");
          }
          console.error(err);
          alert(err instanceof AxiosError ? err.response?.data.message : "Something went wrong");
        } finally {
          setLoading(false);
        }
      } else {
        setHistory(JSON.parse(window.localStorage.getItem("history") || "[]"));
      }
    })();
  }, [auth]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    const color = theme === "dark" ? "#000000" : "#ffffff"

    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", color)
    }
  }, [theme]);

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

    if (auth.isAuth) {
      try {
        setLoading2(true);
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/history`, { username: auth.username, url: embedUrl, title });
        if (res.status === 201)
          setHistory(res.data.history);
      } catch (err: unknown) {
        console.error(err);
        alert(err instanceof AxiosError ? err.response?.data.message : "Something went wrong");
      } finally {
        setLoading2(false);
      }
    } else {
      const storedHistory = JSON.parse(window.localStorage.getItem("history") || "[]");
      if (storedHistory.length >= 10) {
        const updatedHistory = storedHistory.slice(0, 10);
        window.localStorage.setItem("history", JSON.stringify([{ url: embedUrl, title }, ...updatedHistory]));
      } else {
        window.localStorage.setItem("history", JSON.stringify([{ url: embedUrl, title }, ...storedHistory]));
      }
      setHistory(prev => [{ url: embedUrl, title }, ...prev]);
    }
  };

  const removeHistory = async (id: number) => {
    if (auth.isAuth) {
      try {
        setLoading2(true);
        const { url, title } = history.find((_, i) => i === id) as { url: string, title: string };
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/history`, { data: { username: auth.username, url, title } });
        if (res.status === 200)
          setHistory(res.data.history);
      } catch (err: unknown) {
        console.error(err);
        alert(err instanceof AxiosError ? err.response?.data.message : "Something went wrong");
      } finally {
        setLoading2(false);
      }
    } else {
      setHistory(prev => {
        const updatedHistory = prev.filter((_, i) => i !== id);
        window.localStorage.setItem("history", JSON.stringify(updatedHistory));
        return updatedHistory;
      });
    }
  }

  const clearHistory = async () => {
    if (auth.isAuth) {
      setLoading2(true)
      try {
        const res = await axios.delete(`${import.meta.env.VITE_API_URL}/clear`, { data: { username: auth.username } });
        if (res.status === 200)
          setHistory([]);
      } catch (err: unknown) {
        console.error(err);
        alert(err instanceof AxiosError ? err.response?.data.message : "Something went wrong");
      } finally {
        setLoading2(false)
      }
    } else {
      window.localStorage.removeItem("history");
      setHistory([]);
    }
  }

  return (
    <div className="flex flex-col justify-center items-center min-h-svh">
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
            <InputVideoUrl {...{ inputUrl, setInputUrl, handlePlay }} />
            <PlayButton {...{ handlePlay }} />
          </div>

          <div className="mt-5 rounded-lg">
            <VideoPlayer {...{ videoUrl, setVideoUrl }} />
          </div>
        </div>
        {history && history.length > 0 && (
          <History {...{
            history, removeHistory,
            clearHistory, handlePlay, 
            loading, loading2
          }} />
        )}
      </div>
    </div>
  )
}

export default Home
