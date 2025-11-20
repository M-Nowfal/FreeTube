import { getVideoId } from "../lib";
import { Trash, X } from "./Icons";
import { useContext } from "react"
import { ThemeContext } from "../context/ThemeProvider"
import { AuthContext } from "../context/AuthProvider";

interface HistoryProps {
  history: Array<{ url: string; title: string }>;
  removeHistory: (id: number) => void;
  clearHistory: () => void;
  handlePlay: (url: string) => void;
  loading: boolean;
}

const History = ({ history, removeHistory, clearHistory, handlePlay, loading }: HistoryProps) => {
  const { theme } = useContext(ThemeContext);
  const { auth } = useContext(AuthContext);

  return (
    <div
      className={`
    border p-3 pt-0 rounded-lg w-[97%] max-w-7xl xl:max-w-xl 
    max-h-[55vh] xl:max-h-[84.5vh] 
    ${theme === "dark" ? "border-slate-800" : "border-gray-300"}
    flex flex-col gap-3 hide-scrollbar relative
  `}
    >
      {/* Header */}
      <div className={`sticky top-0 ${theme === "light" ? "bg-white/80" : "bg-black/80"} w-full py-2 z-10`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold ps-2">History ({history?.length || 0})</h2>
          <button
            className={`bg-black rounded-lg px-2 py-1 text-white flex items-center gap-2 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
            onClick={clearHistory}
            disabled={loading}
          >
            <Trash />
            <span className="hidden md:block">Clear</span>
          </button>
        </div>
      </div>

      {/* SCROLL AREA */}
      <div className="relative flex-1 overflow-auto">
        {/* Loader Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex justify-center items-center z-20">
            <div className="flex items-center gap-2">
              <div className={`bar bar-1 w-3 h-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
              <div className={`bar bar-2 w-3 h-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
              <div className={`bar bar-3 w-3 h-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex flex-col gap-3">
          {history.map((item, i) => {
            const id = getVideoId(item.url);
            const thumbnail = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

            return (
              <div
                key={i}
                className={`flex items-center gap-5 relative ${theme === "light" ? "bg-gray-100 hover:bg-gray-200" : "bg-neutral-900 hover:bg-neutral-800"} rounded-lg p-0.5 group transition-all`}
                onClick={() => handlePlay(item.url)}
              >
                <div className="w-[150px] h-[84px] overflow-hidden rounded-md shrink-0">
                  <img src={thumbnail} className="w-full h-full object-cover" />
                </div>

                <button
                  className={`md:hidden group-hover:block absolute right-1.5 top-1.5 rounded-full p-1 cursor-pointer ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all`}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistory(i);
                  }}
                  disabled={loading}
                >
                  <X theme={theme} size={8} />
                </button>

                <p className="text-sm lg:text-md font-medium line-clamp-3">{item.title}</p>
              </div>
            );
          })}
        </div>
      </div>

      {!auth.isAuth && (
        <p className="text-center text-xs text-gray-500">
          Log in or create an account to save unlimited history and sync your watchlist across all your devices.
        </p>
      )}
    </div>
  )
}

export default History