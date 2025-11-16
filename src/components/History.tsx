import { getVideoId } from "../lib";
import { Trash, X } from "./Icons";

interface HistoryProps {
  history: Array<{ url: string; title: string }>;
  removeHistory: (id: number) => void;
  clearHistory: () => void;
  handlePlay: (url: string) => void;
  theme: "dark" | "light";
}

const History = ({ history, removeHistory, clearHistory, handlePlay, theme }: HistoryProps) => {
  return (
    <div
      className={`
        border p-3 pt-0 rounded-lg w-[97%] max-w-7xl xl:max-w-xl max-h-[55vh] xl:max-h-[84.5vh] overflow-auto
        ${theme === "dark" ? "border-slate-800" : "border-gray-300"}
        flex flex-col gap-3 hide-scrollbar relative
      `}
    >
      <div className={`sticky top-0 ${theme === "light" ? "bg-white/80" : "bg-black/80"} w-full py-2 z-10`}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold ps-2">History</h2>
          <button
            className={`bg-black rounded-lg px-2 py-1 text-white flex items-center gap-2 cursor-pointer ${theme === "dark" ? "invert" : ""} active:scale-90 transition-all`}
            onClick={clearHistory}
          >
            <Trash />
            <span className="hidden md:block">Clear</span>
          </button>
        </div>
      </div>

      {history.map((item, i) => {
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
            >
              <X theme={theme} size={8} />
            </button>
            <p className="text-sm lg:text-md font-medium line-clamp-3">{item.title}</p>
          </div>
        );
      })}
    </div>
  )
}

export default History