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
  loading2: boolean;
}

const History = ({ history, removeHistory, clearHistory, handlePlay, loading, loading2 }: HistoryProps) => {
  const { theme } = useContext(ThemeContext);
  const { auth } = useContext(AuthContext);

  return (
    <div
      className={`
        border p-3 pt-0 rounded-lg w-[97%] max-w-7xl xl:max-w-xl max-h-[55vh] xl:max-h-[84.5vh] overflow-auto
        ${theme === "dark" ? "border-slate-800" : "border-gray-300"}
        flex flex-col gap-3 hide-scrollbar relative ${loading ? "h-[20vh]" : ""}
      `}
    >
      <div className={`sticky top-0 ${theme === "light" ? "bg-white/80" : "bg-black/80"} w-full py-2 z-10`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold ps-2">History</h2>
          <button
            className={`bg-black rounded-lg px-2 py-1 text-white flex items-center gap-2 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
            onClick={clearHistory}
            disabled={loading2}
          >
            <Trash />
            <span className="hidden md:block">Clear</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center mt-3">
          <div className="flex items-center gap-2">
            <div className={`bar bar-1 w-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
            <div className={`bar bar-2 w-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
            <div className={`bar bar-3 w-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
          </div>
        </div>
      ) : (
        history.map((item, i) => {
          const id = getVideoId(item.url);
          const thumbnail = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;

          return (
            <div
              key={i}
              className={`flex items-center gap-5 relative ${theme === "light" ? "bg-gray-100 hover:bg-gray-200" : "bg-neutral-900 hover:bg-neutral-800"} rounded-lg p-0.5 group transition-all`}
              onClick={() => handlePlay(item.url)}
            >
              <img src={thumbnail} className="w-30 sm:w-50 aspect-video rounded-md" />
              <button
                className={`md:hidden group-hover:block absolute right-1.5 top-1.5 rounded-full p-1 cursor-pointer ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeHistory(i);
                }}
                disabled={loading2}
              >
                <X theme={theme} size={8} />
              </button>
              <p className="text-sm lg:text-md font-medium line-clamp-3">{item.title}</p>
            </div>
          );
        })
      )}
      {!auth.isAuth && (
        <p className="text-center text-xs text-gray-500">
          Log in or create an account to save unlimited history and sync your watchlist across all your devices.
        </p>
      )}
    </div>
  )
}

export default History