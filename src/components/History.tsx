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
        relative overflow-hidden border rounded-lg w-[97%] max-w-7xl xl:max-w-xl
        max-h-[55vh] xl:max-h-[84.5vh]
        flex flex-col
        ${theme === "dark" ? "border-slate-800 bg-neutral-950" : "border-gray-300 bg-white"}
      `}
    >
      {/* Full-cover Loader Overlay (covers header + scroll area) */}
      {loading && (
        <div
          className="absolute inset-0 z-60 flex justify-center items-center"
          style={{ backdropFilter: "blur(6px)" }}
          aria-hidden="true"
        >
          <div className="absolute inset-0" style={{ backgroundColor: `rgba(0,0,0,${theme === "dark" ? "0.4" : "0.2"})` }} />
          <div className="flex items-center gap-2">
            <div className={`bar bar-1 w-3 h-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
            <div className={`bar bar-2 w-3 h-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
            <div className={`bar bar-3 w-3 h-3 rounded-full ${theme === "dark" ? "bg-white" : "bg-black"}`} />
          </div>
        </div>
      )}

      {/* Header */}
      <div
        className={`
          sticky top-0 z-20 w-full p-2 flex items-center justify-between
          ${theme === "light" ? "bg-white" : "bg-[#0b0b0b]"} 
          border-b ${theme === "light" ? "border-gray-200" : "border-slate-800"}
        `}
      >
        <h2 className="text-lg font-semibold ps-2">History ({history?.length || 0})</h2>

        <button
          className={`
            bg-black text-white rounded-lg px-2 py-1 flex items-center gap-2 active:scale-95 transition
            ${theme === "dark" ? "invert" : ""}
          `}
          onClick={clearHistory}
          disabled={loading}
        >
          <Trash />
          <span className="hidden md:block">Clear</span>
        </button>
      </div>

      {/* Scrollable area (min-h-0 is important for flex overflow) */}
      <div className="flex-1 min-h-0 overflow-auto hide-scrollbar">
        <div className="flex flex-col gap-3 p-3">
          {history.map((item, i) => {
            const id = getVideoId(item.url);
            const thumbnail = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;

            return (
              <div
                key={i}
                className={`
                  flex items-center gap-5 relative rounded-lg p-0.5 group transition-all cursor-pointer
                  ${theme === "light" ? "bg-gray-100 hover:bg-gray-200" : "bg-neutral-900 hover:bg-neutral-800"}
                `}
                onClick={() => handlePlay(item.url)}
              >
                <div className="w-[150px] h-[84px] overflow-hidden rounded-md shrink-0">
                  <img src={thumbnail} className="w-full h-full object-cover" />
                </div>

                <button
                  className={`
                    md:hidden group-hover:block absolute right-1.5 top-1.5 rounded-full p-1 
                    ${theme === "dark" ? "bg-white" : "bg-black"} hover:scale-110 transition-all
                  `}
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
        <p className="text-center text-xs text-gray-500 p-2">
          Log in or create an account to save unlimited history and sync your watchlist across all your devices.
        </p>
      )}
    </div>
  );
};

export default History;
